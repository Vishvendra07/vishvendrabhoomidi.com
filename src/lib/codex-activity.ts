import { z } from "zod";
import { dateRange, safeSum, validDate, type ActivityDataset } from "./activity";

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const codexUsageSchema = z.object({
  summary: z.object({
    lifetimeTokens: count.nullable(), peakDailyTokens: count.nullable(),
    longestRunningTurnSec: count.nullable(), currentStreakDays: count.nullable(), longestStreakDays: count.nullable(),
  }),
  dailyUsageBuckets: z.array(z.object({ startDate: z.string().refine(validDate), tokens: count })).max(100_000).nullable(),
});
export const codexSnapshotSchema = z.object({
  version: z.literal(1), accountKey: z.string().regex(/^[a-f0-9]{64}$/), fetchedAt: z.iso.datetime(), usage: codexUsageSchema,
}).strict();
export type CodexSnapshot = z.infer<typeof codexSnapshotSchema>;

/** Latest snapshot per account replaces the previous one; no account identifiers leave this function. */
export function combineCodexSnapshots(input: unknown[], now = new Date()): ActivityDataset {
  const accounts = input.map(value => codexSnapshotSchema.parse(value));
  if (accounts.length !== 2) throw new Error("Connect both accounts before publishing combined activity");
  if (new Set(accounts.map(a => a.accountKey)).size !== accounts.length) throw new Error("Both profiles use the same account; connect a different account");
  const maps = accounts.map(account => {
    if (!account.usage.dailyUsageBuckets?.length) throw new Error("Daily history unavailable for an account; existing public data was preserved");
    const records = new Map<string, number>();
    for (const bucket of account.usage.dailyUsageBuckets) {
      if (records.has(bucket.startDate)) throw new Error("Duplicate provider date");
      if (bucket.startDate > now.toISOString().slice(0,10)) throw new Error("Future provider date");
      records.set(bucket.startDate, bucket.tokens);
    }
    return records;
  });
  const dates = [...new Set(maps.flatMap(map => [...map.keys()]))].sort();
  // Keep every measured token, while identifying days with partial account coverage.
  // A missing bucket is never asserted to mean zero usage.
  const days = dateRange(dates[0], dates.at(-1)!).map(date => {
    const observed = maps.filter(map => map.has(date));
    return { date,
      count: observed.length ? observed.reduce((sum, map) => safeSum(sum, map.get(date)!), 0) : null,
      partial: observed.length > 0 && observed.length < maps.length,
      providers: observed.length ? [`Codex · ${observed.length} of 2 accounts reported${observed.length < 2 ? " (partial)" : ""}`] : [],
    };
  });
  return { metadata: { source: "codex", label: "Codex · two accounts", unit: "tokens", timezone: "UTC", verified: true,
    updatedAt: accounts.map(a => a.fetchedAt).sort()[0],
    coverage: { start: dates[0], end: dates.at(-1)!, complete: false },
  }, days };
}
