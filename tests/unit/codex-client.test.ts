import { PassThrough } from "node:stream";
import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ spawn: vi.fn(), mkdir: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));
vi.mock("node:fs", () => ({ default: { mkdirSync: mocks.mkdir } }));
import { CodexClient } from "../../scripts/codex-client";
function setup() {
  const proc = Object.assign(new EventEmitter(), { stdin: new PassThrough(), stdout: new PassThrough(), kill: vi.fn() });
  mocks.spawn.mockReturnValue(proc);
  const client = new CodexClient("a");
  const writes: Record<string, unknown>[] = [];
  proc.stdin.on("data", bytes => writes.push(JSON.parse(bytes.toString())));
  return { client, proc, writes };
}
afterEach(() => vi.clearAllMocks());
describe("isolated Codex protocol client", () => {
  it("uses a separate profile and explicit file auth without changing the parent environment", () => {
    const original = process.env.CODEX_HOME;
    const { client } = setup();
    const options = mocks.spawn.mock.calls[0][2];
    expect(options.cwd).toMatch(/[\\/]\.private[\\/]codex[\\/]a$/);
    expect(options.env.CODEX_HOME).toBe(options.cwd);
    expect(mocks.spawn.mock.calls[0][1]).toContain('cli_auth_credentials_store="file"');
    expect(process.env.CODEX_HOME).toBe(original);
    expect(() => new CodexClient("../../outside")).toThrow();
    client.close();
  });
  it("acknowledges initialization before requesting account usage", async () => {
    const { client, proc, writes } = setup();
    const initialized = client.initialize();
    proc.stdout.write(JSON.stringify({ id: 1, result: {} }) + "\n");
    await initialized;
    expect(writes[1]).toEqual({ method: "initialized" });
    const response = client.request("account/usage/read", {});
    proc.stdout.write(JSON.stringify({ id: 2, result: { dailyUsageBuckets: null } }) + "\n");
    expect(await response).toEqual({ dailyUsageBuckets: null }); client.close();
  });
  it("surfaces provider errors and login failure instead of reporting success", async () => {
    const { client, proc } = setup();
    const response = client.request("account/usage/read", {});
    const failed = expect(response).rejects.toThrow("Unavailable");
    proc.stdout.write(JSON.stringify({ id: 1, error: { message: "Unavailable" } }) + "\n"); await failed;
    const login = expect(client.waitForLogin()).rejects.toThrow(/did not complete/);
    proc.stdout.write(JSON.stringify({ method: "account/login/completed", params: { success: false } }) + "\n"); await login;
    client.close();
  });
});
