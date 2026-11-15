import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { codexSnapshotSchema, combineCodexSnapshots } from "../src/lib/codex-activity";
import { combineCursorArchive } from "../src/lib/cursor-activity";

type Profile = { auth: Record<string, unknown>; pin: string };
type Credentials = { profiles: { a: Profile; b: Profile } };
const directory = path.resolve(".private/codex");
const profiles = ["a", "b"] as const;
let stage = "vault session";
async function broker(body: unknown): Promise<Record<string, unknown>> {
  const origin = process.env.ACTIVITY_VAULT_URL;
  if (!origin || !/^https:\/\/portfolio-activity-vault\.[a-z0-9-]+\.workers\.dev$/.test(origin)) throw new Error("Invalid vault origin");
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken) throw new Error("A GitHub hosted workflow identity is required");
  const oidcUrl = new URL(requestUrl); oidcUrl.searchParams.set("audience", origin);
  const identityResponse = await fetch(oidcUrl, { headers: { authorization: `Bearer ${requestToken}` }, signal: AbortSignal.timeout(30_000) });
  if (!identityResponse.ok) throw new Error("Identity unavailable");
  const identity = await identityResponse.json() as { value: string };
  if (!identity.value) throw new Error("Identity unavailable");
  const response = await fetch(`${origin}/v1/session`, { method: "POST", headers: { authorization: `Bearer ${identity.value}`, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    const diagnostic = await response.json().catch(()=>({})) as {stage?:string;code?:string};
    if (diagnostic.stage && /^[a-z_]+$/.test(diagnostic.stage)) console.error(`Vault rejected the request at ${diagnostic.stage} (HTTP ${response.status}).`);
    throw new Error("Vault unavailable");
  }
  return response.json() as Promise<Record<string, unknown>>;
}
async function main() {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const session = await broker({ action: "acquire" });
  const credentials = session.credentials as Credentials;
  if (!Number.isSafeInteger(session.version) || !credentials?.profiles?.a?.pin || !credentials.profiles.b?.pin) throw new Error("Invalid session");
  try {
    for (const profile of profiles) {
      const home = path.join(directory, profile); fs.mkdirSync(home, { recursive: true, mode: 0o700 });
      fs.writeFileSync(path.join(home, "auth.json"), JSON.stringify(credentials.profiles[profile].auth), { mode: 0o600 });
    }
    stage = "official account collection";
    execFileSync(process.execPath, ["--import", "tsx", "scripts/connect-codex.ts", "--refresh"], { encoding: "utf8", timeout: 240_000, stdio: ["ignore", "pipe", "pipe"] });
    stage = "identity and archive validation";
    const snapshots = profiles.map(profile => {
      const snapshot = codexSnapshotSchema.parse(JSON.parse(fs.readFileSync(path.join(directory, `snapshot-${profile}.json`), "utf8")));
      if (snapshot.accountKey !== credentials.profiles[profile].pin || Math.abs(Date.now() - Date.parse(snapshot.fetchedAt)) > 60 * 60_000) throw new Error("Account verification failed");
      return snapshot;
    });
    const codex = combineCodexSnapshots(snapshots);
    const dataset = fs.existsSync("src/data/cursor-history.json") ? combineCursorArchive(codex,JSON.parse(fs.readFileSync("src/data/cursor-history.json","utf8"))) : codex;
    const text = JSON.stringify(dataset, null, 2) + "\n";
    if (/@|accountKey|access_token|refresh_token|authUrl|sessionId|userId/.test(text)) throw new Error("Private output blocked");
    fs.writeFileSync("src/data/activity.json", text);
    console.log("Refreshed both accounts and validated public aggregates.");
  } finally {
    const collectionStage = stage; stage = "renewed credential persistence";
    // Persist provider-rotated credentials even when usage collection failed halfway through.
    for (const profile of profiles) {
      const file = path.join(directory, profile, "auth.json");
      if (fs.existsSync(file)) credentials.profiles[profile].auth = JSON.parse(fs.readFileSync(file, "utf8"));
    }
    let saved = false;
    for (let attempt = 0; attempt < 5 && !saved; attempt++) {
      try { saved = (await broker({ action: "release", version: session.version, credentials })).saved === true; } catch { /* Retry without logging any credential-bearing response. */ }
      if (!saved) await new Promise(resolve => setTimeout(resolve, 2_000));
    }
    if (!saved) throw new Error("Credential persistence failed");
    for (const profile of profiles) fs.rmSync(path.join(directory, profile, "auth.json"), { force: true });
    stage = collectionStage;
  }
}
main().catch(() => { console.error(`Hosted activity refresh failed at ${stage}; publication stopped. No credentials or raw provider records were logged.`); process.exitCode = 1; });
