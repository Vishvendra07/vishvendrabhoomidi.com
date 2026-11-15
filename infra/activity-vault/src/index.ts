import { DurableObject } from "cloudflare:workers";
import { authenticate, seal, secretMatches, unseal } from "./security";

type Auth = { auth_mode: "chatgpt"; OPENAI_API_KEY: null; tokens: { access_token: string; refresh_token: string; [key: string]: unknown }; [key: string]: unknown };
type Bundle = { profiles: { a: { auth: Auth; pin: string }; b: { auth: Auth; pin: string } } };
type State = { sealed: Awaited<ReturnType<typeof seal>>; pins: string[]; version: number; lease?: { owner: string; expires: number }; lastRelease?: { owner: string; version: number; digest: string } };
function bundle(value: unknown): Bundle {
  const candidate = value as Bundle;
  if (!candidate?.profiles || Object.keys(candidate).join() !== "profiles" || Object.keys(candidate.profiles).sort().join() !== "a,b") throw new Error("Invalid bundle");
  for (const profile of [candidate.profiles.a, candidate.profiles.b]) {
    if (!profile || !/^[a-f0-9]{64}$/.test(profile.pin) || profile.auth?.auth_mode !== "chatgpt" || profile.auth.OPENAI_API_KEY !== null
      || typeof profile.auth.tokens?.access_token !== "string" || !profile.auth.tokens.access_token
      || typeof profile.auth.tokens.refresh_token !== "string" || !profile.auth.tokens.refresh_token) throw new Error("Invalid profile");
  }
  if (candidate.profiles.a.pin === candidate.profiles.b.pin) throw new Error("Duplicate account");
  return candidate;
}
async function boundedJson(request: Request) {
  if (!request.body || !request.headers.get("content-type")?.includes("application/json")) throw new Error("Invalid body");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 131072) { await reader.cancel(); throw new Error("Body too large"); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export class CredentialVault extends DurableObject<Env> {
  async bootstrap(input: unknown) {
    const data = bundle(input); const encrypted = await seal(data, this.env.VAULT_KEY);
    return this.ctx.storage.transaction(async transaction => {
      if (await transaction.get("state")) return false;
      await transaction.put("state", { sealed: encrypted, pins: [data.profiles.a.pin, data.profiles.b.pin], version: 1 } satisfies State);
      return true;
    });
  }
  async acquire(owner: string) {
    const state = await this.ctx.storage.transaction(async transaction => {
      const state = await transaction.get<State>("state"); if (!state) throw new Error("Unavailable");
      if (state.lease && state.lease.owner !== owner && state.lease.expires > Date.now()) throw new Error("Busy");
      state.lease = { owner, expires: Date.now() + 20 * 60_000 }; await transaction.put("state", state); return state;
    });
    return { version: state.version, credentialsJson: JSON.stringify(await unseal(state.sealed, this.env.VAULT_KEY)) };
  }
  async release(owner: string, version: number, input: unknown) {
    const data = bundle(input); const encrypted = await seal(data, this.env.VAULT_KEY);
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(data))))).map(byte => byte.toString(16).padStart(2,"0")).join("");
    return this.ctx.storage.transaction(async transaction => {
      const state = await transaction.get<State>("state");
      if (state?.version === version + 1 && state.lastRelease?.owner === owner && state.lastRelease.version === version && state.lastRelease.digest === digest) return true;
      if (!state || state.version !== version || state.lease?.owner !== owner) return false;
      if (state.pins[0] !== data.profiles.a.pin || state.pins[1] !== data.profiles.b.pin) return false;
      await transaction.put("state", { sealed: encrypted, pins: state.pins, version: state.version + 1, lastRelease: { owner, version, digest } } satisfies State);
      return true;
    });
  }
}
export default {
  async fetch(request, env) {
    let stage = "routing";
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow" };
    const reply = (value: unknown, status = 200) => Response.json(value, { status, headers });
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return reply({ service: "portfolio-activity-vault", status: "ok" });
    if (!["/v1/bootstrap", "/v1/session"].includes(url.pathname) || request.method !== "POST") return reply({ error: "Not found" }, 404);
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
    try {
      const vault = env.VAULT.getByName("portfolio-codex-accounts");
      if (url.pathname === "/v1/bootstrap") {
        if (!await secretMatches(token, env.BOOTSTRAP_TOKEN)) return reply({ error: "Unauthorized" }, 401);
        return reply({ initialized: await vault.bootstrap(await boundedJson(request)) });
      }
      stage = "identity";
      const owner = await authenticate(token, { repository: env.TRUSTED_REPOSITORY, repositoryId: env.TRUSTED_REPOSITORY_ID, ownerId: env.TRUSTED_OWNER_ID, subjectPrefix: env.TRUSTED_SUBJECT_PREFIX, audience: url.origin });
      stage = "body";
      const body = await boundedJson(request);
      if (body.action === "acquire") {
        stage = "acquire";
        const session = await vault.acquire(owner);
        if (String(env.SYNC_ENABLED) !== "true") {
          stage = "diagnostic_release";
          const saved = await vault.release(owner, session.version, JSON.parse(session.credentialsJson));
          console.log(JSON.stringify({ event: "paused_vault_round_trip", saved }));
          return reply({ error: "Sync paused", diagnostic: saved ? "Vault round trip passed" : "Vault save failed" }, 409);
        }
        return reply({ version: session.version, credentials: JSON.parse(session.credentialsJson) });
      }
      if (body.action === "release" && Number.isSafeInteger(body.version) && body.version > 0) return reply({ saved: await vault.release(owner, body.version, body.credentials) });
      return reply({ error: "Invalid request" }, 400);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error && /^ERR_[A-Z_]+$/.test(String(error.code)) ? String(error.code) : "REJECTED";
      console.log(JSON.stringify({ event: "vault_request_rejected", stage, code }));
      return reply({ error: "Request rejected", stage, code }, 403);
    }
  },
} satisfies ExportedHandler<Env>;
