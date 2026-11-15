import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import type { ActivityDataset } from "../../src/lib/activity";
const file = "src/data/activity.json";
const dataset: ActivityDataset | null = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
test.skip(dataset?.metadata.source !== "codex", "Requires a genuine published Codex dataset");

test("connected activity displays reviewed totals and switches views", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.locator(".activity-section").scrollIntoViewIfNeeded();
  await expect(page.locator(".source-badge")).toHaveText("Codex · two accounts", {timeout:15_000});
  await expect(page.locator(".activity-summary")).toContainText("OBSERVED TOKENS IN RANGE");
  const total = dataset!.days.reduce((sum, day) => sum + (day.count || 0), 0);
  await expect(page.locator(".activity-summary strong").first()).toHaveAttribute("title", `${new Intl.NumberFormat("en-US").format(total)} tokens`);
  await expect(page.locator(".activity-note").filter({ hasText: "partial" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Weekly", exact: true }).click();
  await expect(page.getByLabel("Weekly activity totals")).toBeVisible();
  await page.getByRole("button", { name: "Cumulative", exact: true }).click();
  await expect(page.locator(".cumulative-chart svg")).toBeVisible();
  expect(await page.locator(".cumulative-chart path").count()).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Daily", exact: true }).click();
  await page.getByText("View accessible data table", { exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  expect(errors).toEqual([]);
  for (const route of ["/.private/codex/a/auth.json", "/.private/codex/snapshot-a.json", "/.private/codex/snapshot-b.json"])
    expect((await request.get(route)).status(), route).toBe(404);
});

test("connected chart fits both themes on mobile and desktop", async ({ page }) => {
  test.setTimeout(90_000);
  for (const colorScheme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/");
      await page.locator(".activity-section").scrollIntoViewIfNeeded();
      await expect(page.locator(".source-badge")).toHaveText("Codex · two accounts", {timeout:15_000});
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.locator(".activity-section").screenshot({ path: `verification/screenshots/activity-connected-${width}-${colorScheme}.png` });
    }
  }
});

test("connected activity and methodology remain accessible", async ({ page }) => {
  for (const route of ["/", "/activity/methodology"]) {
    await page.goto(route);
    if (route === "/") await page.locator(".activity-section").scrollIntoViewIfNeeded();
    const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]);
    if (route === "/") builder.include(".activity-section");
    const result = await builder.analyze();
    expect(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  }
});
