import { z } from "zod";
import { dateRange, observedStreaks, safeSum, validDate, type ActivityDataset, type DailyActivity } from "./activity";
import { parseCsvRows } from "./activity-import";
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const cursorArchiveSchema = z.object({
  version: z.literal(1), source: z.literal("cursor-export"), unit: z.literal("tokens"), timezone: z.literal("UTC"),
  importedAt: z.iso.datetime(), accountCount: z.number().int().min(1).max(4), recordCount: count, totalTokens: count,
  days: z.array(z.object({date:z.string().refine(validDate),count,providers:z.array(z.literal("Cursor archive")).length(1),partial:z.literal(true)}).strict()).max(3661),
}).strict();
export type CursorArchive = z.infer<typeof cursorArchiveSchema>;
export function parseCursorCsv(csv: string, now = new Date()) {
  const rows = parseCsvRows(csv), headers = rows.shift();
  if (!headers || new Set(headers).size !== headers.length || !headers.includes("Date") || !headers.includes("Total Tokens")) throw new Error("Cursor export requires Date and Total Tokens headers");
  if (rows.length > 200_000) throw new Error("Cursor export exceeds row limit");
  const dateIndex = headers.indexOf("Date"), tokensIndex = headers.indexOf("Total Tokens");
  const days = new Map<string, number>();
  for (const cells of rows) {
    if (cells.length !== headers.length || !/^\d+$/.test(cells[tokensIndex])) throw new Error("Invalid Cursor token record");
    const timestamp = cells[dateIndex];
    if (!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(timestamp) || !validDate(timestamp.slice(0,10)) || !Number.isFinite(Date.parse(timestamp))) throw new Error("Cursor record needs a valid timestamp and explicit timezone");
    if (Date.parse(timestamp) > now.getTime()) throw new Error("Future Cursor record");
    const date = new Date(timestamp).toISOString().slice(0,10);
    const tokens = count.parse(Number(cells[tokensIndex]));
    days.set(date, safeSum(days.get(date) || 0, tokens));
  }
  return { recordCount: rows.length, days: [...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count,providers:["Cursor archive"] as ["Cursor archive"],partial:true as const})) };
}
export function archiveCursorAccounts(inputs: {accountKey:string;csv:string}[], now = new Date()): CursorArchive {
  if (!inputs.length || inputs.length > 4 || inputs.some(input=>!/^[a-f0-9]{64}$/.test(input.accountKey)) || new Set(inputs.map(input=>input.accountKey)).size !== inputs.length) throw new Error("Cursor accounts must be distinct");
  const exports = inputs.map(input=>parseCursorCsv(input.csv,now));
  const byDate = new Map<string,number>(); let recordCount = 0;
  for (const item of exports) { recordCount = safeSum(recordCount,item.recordCount); for(const day of item.days) byDate.set(day.date,safeSum(byDate.get(day.date)||0,day.count)); }
  if (!byDate.size) throw new Error("No measured Cursor records available");
  const days = [...byDate].sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count,providers:["Cursor archive"] as ["Cursor archive"],partial:true as const}));
  return cursorArchiveSchema.parse({version:1,source:"cursor-export",unit:"tokens",timezone:"UTC",importedAt:now.toISOString(),accountCount:inputs.length,recordCount,totalTokens:days.reduce((sum,day)=>safeSum(sum,day.count),0),days});
}
export function combineCursorArchive(codex: ActivityDataset, input: unknown, now = new Date()): ActivityDataset {
  if (codex.metadata.source !== "codex") throw new Error("Cursor archives must be combined with a fresh Codex dataset exactly once");
  const archive = cursorArchiveSchema.parse(input);
  if (archive.days.reduce((sum,day)=>safeSum(sum,day.count),0) !== archive.totalTokens || new Set(archive.days.map(day=>day.date)).size !== archive.days.length) throw new Error("Invalid Cursor archive totals");
  const dates = [...codex.days.map(day=>day.date), ...archive.days.map(day=>day.date)].sort();
  const byDate = new Map<string,DailyActivity>();
  for (const day of [...codex.days, ...archive.days]) {
    const existing = byDate.get(day.date);
    byDate.set(day.date,{date:day.date,count:day.count === null ? existing?.count ?? null : safeSum(existing?.count || 0,day.count),providers:[...new Set([...(existing?.providers || []),...day.providers])],partial:!!day.partial || !!existing?.partial});
  }
  const days = dateRange(dates[0],dates.at(-1)!).map(date=>byDate.get(date)||{date,count:null,providers:[]});
  const lifetime = codex.metadata.accountSummary?.lifetimeTokens;
  return {metadata:{...codex.metadata,source:"combined",accountSummary:{lifetimeTokens:lifetime === null || lifetime === undefined ? null : safeSum(lifetime,archive.totalTokens),...observedStreaks(days,now.toISOString().slice(0,10))},coverage:{start:dates[0],end:dates.at(-1)!,complete:false}},days};
}
