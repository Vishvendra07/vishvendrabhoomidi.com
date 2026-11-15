import "server-only";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { validDate } from "./activity";
import { emptyActivity, selectRange, summarize, type ActivityDataset, type ActivityProvider, type ActivityRange } from "./activity";

const publicActivitySchema = z.object({
  metadata: z.object({
    source: z.enum(["manual-import", "codex"]), label: z.string().max(100), unit: z.literal("tokens"),
    timezone: z.string().refine(value => { try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; } }),
    verified: z.literal(true), updatedAt: z.iso.datetime().nullable(),
    coverage: z.object({ start: z.string().refine(validDate), end: z.string().refine(validDate), complete: z.boolean() }).strict().nullable(),
    accountSummary: z.object({ lifetimeTokens: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(), currentStreakDays: z.number().int().nonnegative().nullable(), longestStreakDays: z.number().int().nonnegative(), activeDays: z.number().int().nonnegative(), streakAsOf: z.string().refine(validDate) }).strict().optional(),
  }).strict(),
  days: z.array(z.object({ date: z.string().refine(validDate), count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(), providers: z.array(z.string().max(100)).max(20), partial: z.boolean().optional() }).strict()).max(3661),
}).strict();
export function loadActivity(): ActivityDataset {
  const file = path.join(process.cwd(), "src/data/activity.json");
  if (!fs.existsSync(file)) return emptyActivity();
  const data = publicActivitySchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!data.metadata.verified || !["manual-import", "codex"].includes(data.metadata.source)) throw new Error("Activity data must be owner-reviewed before use");
  return data;
}
export class ManualActivityProvider implements ActivityProvider {
  async getDailyActivity(query: ActivityRange) { return selectRange(loadActivity(), query); }
  async getSummary(query: ActivityRange) { return summarize((await this.getDailyActivity(query)).days); }
}
