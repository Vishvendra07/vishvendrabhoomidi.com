import { z } from "zod";
import { validDate, todayIn, safeSum, dateRange, type ActivityDataset, type DailyActivity } from "./activity";

const day = z.string().refine(validDate, "Use a valid ISO calendar date (YYYY-MM-DD)");
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const importRecordSchema = z.object({ date: day, provider: z.string().trim().min(1).max(80), inputTokens: count, outputTokens: count, totalTokens: count }).strict().refine(r => Number.isSafeInteger(r.inputTokens + r.outputTokens) && r.totalTokens === r.inputTokens + r.outputTokens, "Total tokens must equal input + output");
export const importSchema = z.object({
  version: z.literal(1),
  timezone: z.string().refine(tz => { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; } }, "Invalid IANA timezone"),
  coverage: z.object({ start: day, end: day, complete: z.boolean() }).strict(),
  records: z.array(importRecordSchema).max(100000),
}).strict();
export type ImportDataset = z.infer<typeof importSchema>;
export function normalizeImport(input: unknown, now = new Date()): ActivityDataset {
  const data = importSchema.parse(input);
  if (data.coverage.start > data.coverage.end) throw new Error("Coverage is reversed");
  const today = todayIn(data.timezone, now);
  if (data.coverage.end > today) throw new Error("Coverage includes future days");
  const seen = new Set<string>();
  const days = new Map<string, DailyActivity>();
  for (const r of data.records) {
    if (r.date > today || r.date < data.coverage.start || r.date > data.coverage.end) throw new Error("Record is outside coverage or in the future");
    const key = `${r.date}/${r.provider.toLowerCase()}`;
    if (seen.has(key)) throw new Error(`Duplicate date/provider: ${key}`);
    seen.add(key);
    const old = days.get(r.date);
    days.set(r.date, { date: r.date, count: safeSum(old?.count || 0, r.totalTokens), providers: [...(old?.providers || []), r.provider] });
  }
  const normalized = dateRange(data.coverage.start, data.coverage.end).map(date => days.get(date) || { date, count: data.coverage.complete ? 0 : null, providers: [] });
  // Validate total precision before writing, not only when a visitor reads it.
  normalized.reduce((total, d) => safeSum(total, d.count || 0), 0);
  return { metadata: { source: "manual-import", label: "Owner-reviewed import", unit: "tokens", timezone: data.timezone, verified: false, updatedAt: now.toISOString(), coverage: data.coverage }, days: normalized };
}
export function parseCsvRows(csv: string): string[][] {
  // A real CSV parser: quoted commas, escaped quotes, BOM, and CRLF are supported.
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  const source = csv.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') { if (quoted && source[i+1] === '"') { cell += '"'; i++; } else { if (!quoted && cell) throw new Error("Invalid CSV quote"); quoted = !quoted; } }
    else if (c === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) { if (c === "\r" && source[i+1] === "\n") i++; row.push(cell); if (row.some(v => v !== "")) rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (quoted) throw new Error("Unterminated CSV quote");
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
export function parseCsv(csv: string): unknown[] {
  const rows = parseCsvRows(csv);
  const headers = rows.shift();
  const expected = ["date", "provider", "inputTokens", "outputTokens", "totalTokens"];
  if (!headers || headers.length !== expected.length || expected.some(h => !headers.includes(h))) throw new Error("CSV headers must be date,provider,inputTokens,outputTokens,totalTokens");
  return rows.map(cells => {
    if (cells.length !== headers.length) throw new Error("CSV column count mismatch");
    return Object.fromEntries(headers.map((h,i) => { const val = cells[i]; if (h.endsWith("Tokens") && !/^\d+$/.test(val)) throw new Error("CSV token values must be non-negative integers"); return [h, h.endsWith("Tokens") ? Number(val) : val]; }));
  });
}
