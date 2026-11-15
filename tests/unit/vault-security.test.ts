import { beforeAll, describe, expect, it } from "vitest";
import { base64url, createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import { authenticate, seal, secretMatches, unseal } from "../../infra/activity-vault/src/security";
const policy = { repository: "owner/portfolio", repositoryId: "123", ownerId: "456", subjectPrefix: "repo:owner@456/portfolio@123", audience: "https://vault.example" };
let keys: JWTVerifyGetKey, privateKey: CryptoKey;
const claims = { repository: policy.repository, repository_id: "123", repository_owner_id: "456", ref: "refs/heads/main", sub: "repo:owner@456/portfolio@123:ref:refs/heads/main", workflow_ref: "owner/portfolio/.github/workflows/sync-activity.yml@refs/heads/main", event_name: "schedule", runner_environment: "github-hosted", run_id: "99", run_attempt: "1" };
beforeAll(async () => {
  const pair = await generateKeyPair("RS256"); privateKey = pair.privateKey;
  keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: "test" }] });
});
async function token(changes: Record<string, unknown> = {}, audience = policy.audience) {
  return new SignJWT({ ...claims, ...changes }).setProtectedHeader({ alg: "RS256", kid: "test" }).setIssuer("https://token.actions.githubusercontent.com").setAudience(audience).setIssuedAt().setExpirationTime(typeof changes.exp === "number" ? changes.exp : "5m").sign(privateKey);
}
describe("hosted credential boundary", () => {
  it("accepts only the pinned hosted workflow identity", async () => { expect(await authenticate(await token(),policy,keys)).toBe("99:1"); });
  it.each([
    { repository_id: "789" }, { repository_owner_id: "789" }, { repository: "attacker/portfolio" },
    { ref: "refs/heads/feature" }, { sub: "repo:owner/portfolio:pull_request" },
    { event_name: "pull_request_target" }, { workflow_ref: "owner/portfolio/.github/workflows/other.yml@refs/heads/main" },
    { runner_environment: "self-hosted" }, { run_id: "invalid" },
  ])("rejects untrusted claims %j", async changes => { await expect(authenticate(await token(changes),policy,keys)).rejects.toThrow(); });
  it("rejects another audience and expired tokens", async () => {
    await expect(authenticate(await token({},"https://attacker.example"),policy,keys)).rejects.toThrow();
    await expect(authenticate(await token({exp:1}),policy,keys)).rejects.toThrow();
  });
  it("encrypts state with a random nonce and detects tampering", async () => {
    const key = base64url.encode(crypto.getRandomValues(new Uint8Array(32)));
    const value = { syntheticCredential: "TEST ONLY" };
    const a = await seal(value,key), b = await seal(value,key);
    expect(a.iv).not.toBe(b.iv); expect(JSON.stringify(a)).not.toContain("TEST ONLY");
    expect(await unseal(a,key)).toEqual(value);
    await expect(unseal({...a,ciphertext:(a.ciphertext[0] === "A" ? "B" : "A") + a.ciphertext.slice(1)},key)).rejects.toThrow();
  });
  it("compares bootstrap secrets through HMAC verification", async () => {
    expect(await secretMatches("synthetic-token","synthetic-token")).toBe(true);
    expect(await secretMatches("wrong","synthetic-token")).toBe(false);
    expect(await secretMatches("","")).toBe(false);
  });
});
