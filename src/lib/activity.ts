
export const sourceIds = ["manual-import", "codex", "openai-api", "app-instrumentation", "github"] as const;
export type SourceId = typeof sourceIds[number];
export type ActivityUnit = "tokens" | "contributions";
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export type DailyActivity = { date: string; count: number | null; providers: string[]; partial?: boolean };
export type ActivityMetadata = { source: SourceId; label: string; unit: ActivityUnit; timezone: string; verified: boolean; updatedAt: string | null; coverage: { start: string; end: string; complete: boolean } | null };
export type ActivityDataset = { metadata: ActivityMetadata; days: DailyActivity[] };
export type ActivitySummary = { total: number | null; activeDays: number; observedDays: number; currentStreak: number | null; longestStreak: number | null; peak: DailyActivity | null };
export type ActivityRange = { start: string; end: string; source: SourceId };
export interface ActivityProvider {
  getDailyActivity(query: ActivityRange): Promise<ActivityDataset>;
  getSummary(query: ActivityRange): Promise<ActivitySummary>;
}
export function todayIn(timezone = "America/Detroit", now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function addDays(date: string, n: number) { return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10); }
export function dateRange(start: string, end: string) {
  if (!validDate(start) || !validDate(end) || start > end) throw new Error("Invalid date range");
  if ((Date.parse(end) - Date.parse(start)) / 86400000 > 3660) throw new Error("Range exceeds ten years");
  const days: string[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) days.push(date);
  return days;
}
export function safeSum(a: number, b: number) { const total = a + b; if (!Number.isSafeInteger(total)) throw new Error("Token sum exceeds safe integer precision"); return total; }
export function emptyActivity(): ActivityDataset { return { metadata: { source: "manual-import", label: "Data not connected", unit: "tokens", timezone: "America/Detroit", verified: false, updatedAt: null, coverage: null }, days: [] }; }
export function selectRange(data: ActivityDataset, range: ActivityRange): ActivityDataset {
  const dates = dateRange(range.start, range.end);
  if (range.source !== data.metadata.source) return emptyActivity();
  const byDate = new Map(data.days.map(d => [d.date, d]));
  return { metadata: data.metadata, days: dates.map(date => byDate.get(date) || { date, count: null, providers: [] }) };
}
export function summarize(days: DailyActivity[]): ActivitySummary {
  const observed = days.filter(d => d.count !== null);
  if (!observed.length) return { total: null, activeDays: 0, observedDays: 0, currentStreak: null, longestStreak: null, peak: null };
  const ordered = [...days].sort((a,b) => a.date.localeCompare(b.date));
  const contiguous = ordered.every((d,i) => d.count !== null && !d.partial && (!i || addDays(ordered[i-1].date, 1) === d.date));
  let run = 0, longest = 0;
  for (const d of ordered) { run = d.count && d.count > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  return { total: observed.reduce((n,d) => safeSum(n, d.count!), 0), activeDays: observed.filter(d => d.count! > 0).length, observedDays: observed.length, currentStreak: contiguous ? run : null, longestStreak: contiguous ? longest : null, peak: observed.reduce((a,b) => a.count! >= b.count! ? a : b) };
}
export function aggregateWeeks(days: DailyActivity[]) {
  const groups = new Map<string, { date: string; count: number | null; observed: number; missing: number }>();
  for (const d of days) {
    const weekday = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    const date = addDays(d.date, -((weekday + 6) % 7));
    const old = groups.get(date) || { date, count: null, observed: 0, missing: 0 };
    if (d.count !== null) { old.count = safeSum(old.count || 0, d.count); old.observed++; if (d.partial) old.missing++; } else old.missing++;
    groups.set(date, old);
  }
  return [...groups.values()];
}
export function cumulative(days: DailyActivity[]) {
  let total = 0;
  return days.map(d => { if (d.count !== null) total = safeSum(total, d.count); return { date: d.date, count: d.count === null ? null : total }; });
}
