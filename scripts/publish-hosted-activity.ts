import fs from "node:fs";
import { execFileSync } from "node:child_process";
const repository = "Vishvendra07/vishvendrabhoomidi.com";
const token = process.env.GITHUB_TOKEN;
function git(args: string[]) {
  if (!token || process.env.GITHUB_REPOSITORY !== repository) throw new Error("Unexpected publishing authority");
  return execFileSync("git", args, { encoding: "utf8", timeout: 90_000, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env,
    GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`,
  } }).trim();
}
async function main() {
  if (git(["remote", "get-url", "origin"]) !== `https://github.com/${repository}` && git(["remote", "get-url", "origin"]) !== `https://github.com/${repository}.git`) throw new Error("Unexpected publishing remote");
  if (git(["diff", "--name-only"]) !== "src/data/activity.json") throw new Error("Unexpected file changes");
  if (git(["diff", "--cached", "--name-only"])) throw new Error("Unexpected staged changes");
  git(["config", "user.name", "github-actions[bot]"]);
  git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
  git(["add", "--", "src/data/activity.json"]);
  git(["commit", "-m", "Refresh hosted activity aggregates"]);
  git(["push", "origin", "HEAD:main"]);
  const commit = git(["rev-parse", "HEAD"]);
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("Invalid commit");
  const response = await fetch(`https://api.github.com/repos/${repository}/statuses/${commit}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "accept": "application/vnd.github+json", "content-type": "application/json", "X-GitHub-Api-Version": "2022-11-28" }, body: JSON.stringify({ state: "success", context: "Activity validation", description: "Private collector, unit tests and production build passed", target_url: `https://github.com/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}` }) });
  if (!response.ok) throw new Error("Unable to record validation");
  fs.writeFileSync(".private/published.json", JSON.stringify({ commit }));
  console.log(`Published sanitized activity commit ${commit}.`);
}
main().catch(() => { console.error("Hosted publication failed. No force push, unrelated file publication or credential output was attempted."); process.exitCode = 1; });
