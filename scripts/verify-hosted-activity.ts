import fs from "node:fs";
import { chromium } from "@playwright/test";
async function main() {
  const { commit } = JSON.parse(fs.readFileSync(".private/published.json", "utf8"));
  const expected = JSON.parse(fs.readFileSync("src/data/activity.json", "utf8"));
  let deployed = false;
  for (let attempt = 0; attempt < 35; attempt++) {
    const response = await fetch(`https://api.github.com/repos/Vishvendra07/vishvendrabhoomidi.com/commits/${commit}/check-runs`, { headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "accept": "application/vnd.github+json" } });
    if (!response.ok) throw new Error("Check status unavailable");
    const result = await response.json() as { check_runs: { name: string; status: string; conclusion: string }[] };
    const pages = result.check_runs.find(check => check.name === "Cloudflare Pages");
    if (pages?.status === "completed") { if (pages.conclusion !== "success") throw new Error("Deployment failed"); deployed = true; break; }
    await new Promise(resolve => setTimeout(resolve, 20_000));
  }
  if (!deployed) throw new Error("Deployment did not complete");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto("https://vishvendrabhoomidi.com", { waitUntil: "networkidle" });
    if (response?.status() !== 200) throw new Error("Public site unavailable");
    await page.locator(".activity-section").scrollIntoViewIfNeeded();
    const badge = page.locator(".source-badge"); await badge.waitFor();
    const summary = expected.metadata.accountSummary;
    await page.waitForFunction(() => !!document.querySelector(".activity-summary strong"));
    const values = await page.locator(".activity-summary strong").allTextContents();
    const total = await page.locator(".activity-summary strong").first().getAttribute("title");
    if (await badge.innerText() !== "In sync" || total !== `${new Intl.NumberFormat("en-US").format(summary.lifetimeTokens)} tokens`
      || values[2] !== (summary.currentStreakDays === null ? "—" : `${summary.currentStreakDays}d`) || values[3] !== `${summary.longestStreakDays}d` || errors.length) throw new Error("Public data verification failed");
    const html = await page.content(); if (/refresh_token|access_token|accountKey/.test(html)) throw new Error("Private field exposure");
    console.log("Verified live lifetime total, both streaks, sync state and privacy boundaries.");
  } finally { await browser.close(); }
}
main().catch(() => { console.error("Hosted deployment verification failed. Review the workflow and Cloudflare build; no private data was logged."); process.exitCode = 1; });
