import { base64url, createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
const issuer = "https://token.actions.githubusercontent.com";
const githubKeys = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks`));
export type Policy = { repository: string; repositoryId: string; ownerId: string; subjectPrefix: string; audience: string };
export async function authenticate(token: string, policy: Policy, keys: JWTVerifyGetKey = githubKeys) {
  const { payload } = await jwtVerify(token, keys, { issuer, audience: policy.audience, algorithms: ["RS256"], maxTokenAge: "10m", requiredClaims: ["exp", "iat", "sub", "run_id", "run_attempt"] });
  const checks = { repository: payload.repository === policy.repository, repositoryId: payload.repository_id === policy.repositoryId, ownerId: payload.repository_owner_id === policy.ownerId,
    branch: payload.ref === "refs/heads/main", subject: payload.sub === `${policy.subjectPrefix}:ref:refs/heads/main`,
    workflow: payload.workflow_ref === `${policy.repository}/.github/workflows/sync-activity.yml@refs/heads/main`,
    event: ["schedule", "workflow_dispatch"].includes(String(payload.event_name)), hosted: payload.runner_environment === "github-hosted",
    runId: /^\d+$/.test(String(payload.run_id)), attempt: /^\d+$/.test(String(payload.run_attempt)) };
  if (!Object.values(checks).every(Boolean)) {
    if (keys === githubKeys) console.log(JSON.stringify({ event: "identity_policy_checks", checks }));
    throw new Error("Untrusted workflow identity");
  }
  return `${payload.run_id}:${payload.run_attempt}`;
}
async function key(secret: string) {
  const bytes = Uint8Array.from(base64url.decode(secret));
  if (bytes.length !== 32) throw new Error("Invalid encryption configuration");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}
const additionalData = new TextEncoder().encode("portfolio-activity-vault:v1");
export async function seal(value: unknown, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData }, await key(secret), new TextEncoder().encode(JSON.stringify(value)));
  return { iv: base64url.encode(iv), ciphertext: base64url.encode(new Uint8Array(ciphertext)) };
}
export async function unseal(value: { iv: string; ciphertext: string }, secret: string): Promise<unknown> {
  const bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv: Uint8Array.from(base64url.decode(value.iv)), additionalData }, await key(secret), Uint8Array.from(base64url.decode(value.ciphertext)));
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function secretMatches(provided: string, expected: string) {
  if (!expected || provided.length > 512) return false;
  const bytes = new TextEncoder();
  const candidate = await crypto.subtle.importKey("raw", bytes.encode(provided || "invalid"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const actual = await crypto.subtle.importKey("raw", bytes.encode(expected), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const message = bytes.encode("portfolio-vault-bootstrap");
  return crypto.subtle.verify("HMAC", actual, await crypto.subtle.sign("HMAC", candidate, message), message);
}
