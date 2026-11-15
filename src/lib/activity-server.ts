import "server-only";
import fs from "node:fs";
import path from "node:path";
import { emptyActivity, selectRange, summarize, type ActivityDataset, type ActivityProvider, type ActivityRange } from "./activity";

export function loadActivity(): ActivityDataset {
  const file = path.join(process.cwd(), "src/data/activity.json");
  if (!fs.existsSync(file)) return emptyActivity();
  const data: ActivityDataset = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!data.metadata.verified || data.metadata.source !== "manual-import") throw new Error("Activity data must be owner-reviewed before use");
  return data;
}
export class ManualActivityProvider implements ActivityProvider {
  async getDailyActivity(query: ActivityRange) { return selectRange(loadActivity(), query); }
  async getSummary(query: ActivityRange) { return summarize((await this.getDailyActivity(query)).days); }
}
