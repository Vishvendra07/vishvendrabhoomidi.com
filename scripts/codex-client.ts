import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import fs from "node:fs";
import path from "node:path";

/** An isolated first-party app-server. Never reads or changes the desktop app's auth. */
export class CodexClient {
  private sequence = 0;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
  private listeners = new Set<(method: string, params: unknown) => void>();
  private process;
  constructor(profile: string) {
    if (!/^[ab]$/.test(profile)) throw new Error("Profile must be a or b");
    const home = path.resolve(".private/codex", profile);
    fs.mkdirSync(home, { recursive: true, mode: 0o700 });
    this.process = spawn(process.env.CODEX_BINARY || "codex", ["app-server", "--stdio", "-c", 'cli_auth_credentials_store="file"'], {
      cwd: home,
      env: { ...process.env, CODEX_HOME: home, OPENAI_API_KEY: "", CODEX_API_KEY: "" },
      stdio: ["pipe", "pipe", "ignore"], windowsHide: true,
    });
    createInterface({ input: this.process.stdout }).on("line", line => {
      let message;
      try { message = JSON.parse(line); } catch { return; }
      const pending = this.pending.get(message.id);
      if (pending) {
        clearTimeout(pending.timer); this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(String(message.error.message || "Codex request failed")));
        else pending.resolve(message.result);
      } else if (message.method) {
        // No server-initiated action is authorized by this read-only collector.
        if (message.id !== undefined) this.send({ id: message.id, error: { code: -32601, message: "Unsupported" } });
        else this.listeners.forEach(fn => fn(message.method, message.params));
      }
    });
    const fail = () => { for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error("Codex collector stopped")); } this.pending.clear(); };
    this.process.on("error", fail); this.process.on("exit", fail);
  }
  private send(message: unknown) { this.process.stdin.write(JSON.stringify(message) + "\n"); }
  request(method: string, params?: unknown): Promise<unknown> {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`${method} timed out`)); }, 60_000);
      this.pending.set(id, { resolve, reject, timer }); this.send({ id, method, ...(params === undefined ? {} : { params }) });
    });
  }
  async initialize() {
    await this.request("initialize", { clientInfo: { name: "vishvendra_activity", title: "Private portfolio activity collector", version: "1.0.0" } });
    this.send({ method: "initialized" });
  }
  waitForLogin(timeout = 600_000): Promise<void> {
    return new Promise((resolve, reject) => {
      const listener = (method: string, params: unknown) => {
        if (method !== "account/login/completed") return;
        const result = params as { success: boolean };
        clearTimeout(timer); this.listeners.delete(listener);
        if (result.success) resolve(); else reject(new Error("Sign-in did not complete; retry this profile"));
      };
      const timer = setTimeout(() => { this.listeners.delete(listener); reject(new Error("Sign-in expired; retry this profile")); }, timeout);
      timer.unref();
      this.listeners.add(listener);
    });
  }
  close() { this.process.stdin.end(); this.process.kill(); }
}
