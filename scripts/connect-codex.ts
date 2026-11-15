import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { CodexClient } from "./codex-client";
import { codexSnapshotSchema, codexUsageSchema, combineCodexSnapshots } from "../src/lib/codex-activity";

const args = process.argv.slice(2);
const value = (key: string) => args[args.indexOf(key) + 1];
const directory = path.resolve(".private/codex");
function save(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file + ".tmp", JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(file + ".tmp", file);
}
async function collect(profile: string, login: boolean) {
  const client = new CodexClient(profile);
  try {
    await client.initialize();
    const readAccount = async () => z.object({ account: z.object({ type: z.literal("chatgpt"), email: z.string().nullable() }).nullable(), userId: z.string().nullable() }).parse(await client.request("account/read", { refreshToken: false }));
    if (login) {
      const completed = client.waitForLogin();
      // Attach a handler now so an expired/failed sign-in cannot become an unhandled rejection.
      completed.catch(() => {});
      const result = z.object({ authUrl: z.url(), loginId: z.string() }).parse(await client.request("account/login/start", { type: "chatgpt", useHostedLoginSuccessPage: true, appBrand: "codex" }));
      save(path.join(directory, `login-${profile}.json`), { authUrl: result.authUrl });
      console.log(`Profile ${profile.toUpperCase()}: open the sign-in URL saved in .private/codex/login-${profile}.json. Waiting for browser sign-in.`);
      await completed;
    }
    const identity = await readAccount();
    if (!identity.account) throw new Error(`Profile ${profile.toUpperCase()} needs sign-in. Run with --login --profile ${profile}`);
    if (args.includes("--email") && identity.account.email?.toLowerCase() !== value("--email").toLowerCase()) throw new Error("The selected account does not match --email; retry sign-in with the intended account");
    // Stable identity is hashed locally solely to prevent reconnecting one account twice.
    if (!identity.userId) throw new Error("Provider did not return a stable account identity; cannot safely deduplicate accounts");
    const usage = codexUsageSchema.parse(await client.request("account/usage/read", {}));
    const snapshot = codexSnapshotSchema.parse({ version: 1, accountKey: createHash("sha256").update(identity.userId).digest("hex"), fetchedAt: new Date().toISOString(), usage });
    save(path.join(directory, `snapshot-${profile}.json`), snapshot);
    fs.rmSync(path.join(directory, `login-${profile}.json`), { force: true });
    console.log(`Profile ${profile.toUpperCase()}: signed in; ${usage.dailyUsageBuckets?.length ?? "unavailable"} daily buckets. Snapshot stays private.`);
  } finally { client.close(); }
}
async function main() {
  if (args.includes("--publish")) {
    const snapshots = ["a", "b"].map(profile => JSON.parse(fs.readFileSync(path.join(directory, `snapshot-${profile}.json`), "utf8")));
    for (const snapshot of snapshots) {
      const parsed = codexSnapshotSchema.parse(snapshot);
      if (Date.now() - Date.parse(parsed.fetchedAt) > 24 * 60 * 60 * 1000) throw new Error("Refresh both accounts before publishing; snapshot older than 24 hours");
    }
    const dataset = combineCodexSnapshots(snapshots);
    save(path.join(directory, "public-preview.json"), dataset);
    if (!args.includes("--reviewed")) { console.log("Sanitized preview saved privately. Review it, then rerun --publish --reviewed. No website data changed."); return; }
    save(path.resolve("src/data/activity.json"), dataset);
    console.log(`Published sanitized daily aggregates for ${dataset.days.length} dates. Sign-in data and account identities remain private.`);
    return;
  }
  if (args.includes("--refresh")) {
    for (const profile of ["a", "b"]) await collect(profile, false);
    return;
  }
  if (!args.includes("--profile") || !/^[ab]$/.test(value("--profile"))) throw new Error("Use --profile a --login, --profile b --login, --refresh, or --publish [--reviewed]");
  await collect(value("--profile"), args.includes("--login"));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Connection failed"); process.exitCode = 1; });
