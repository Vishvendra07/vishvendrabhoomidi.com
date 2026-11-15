import { describe, expect, it } from "vitest";
import { combineCodexSnapshots } from "../../src/lib/codex-activity";
import { observedStreaks } from "../../src/lib/activity";
const now = new Date("2026-11-15T12:00:00Z");
function snapshot(key = "a", buckets: { startDate: string; tokens: number }[] | null = [{ startDate: "2026-11-12", tokens: 10 }, { startDate: "2026-11-14", tokens: 0 }]) {
  return { version: 1, accountKey: key.repeat(64), fetchedAt: now.toISOString(), usage: {
    summary: { lifetimeTokens: null, peakDailyTokens: null, longestRunningTurnSec: null, currentStreakDays: null, longestStreakDays: null }, dailyUsageBuckets: buckets,
  } };
}
describe("two-account Codex activity", () => {
  it("sums provider buckets once, preserving explicit zeroes and missing days", () => {
    const result = combineCodexSnapshots([snapshot(), snapshot("b")], now);
    expect(result.days.map(d => d.count)).toEqual([20, null, 0]);
    expect(result.metadata.coverage?.complete).toBe(false);
    expect(combineCodexSnapshots([snapshot(), snapshot("b")], now)).toEqual(result);
  });
  it("never publishes account identities or individual provider summaries", () => {
    const text = JSON.stringify(combineCodexSnapshots([snapshot(), snapshot("b")], now));
    expect(text).not.toContain("accountKey"); expect(text).not.toContain("longestRunningTurnSec"); expect(text).not.toContain("a".repeat(64));
  });
  it("publishes lifetime totals independently of returned daily coverage", () => {
    const a = snapshot(), b = snapshot("b");
    const input = [a,b].map((s,i) => ({...s,usage:{...s.usage,summary:{...s.usage.summary,lifetimeTokens:100 + i * 100}}}));
    expect(combineCodexSnapshots(input,now).metadata.accountSummary?.lifetimeTokens).toBe(300);
    expect(combineCodexSnapshots([a,b],now).metadata.accountSummary?.lifetimeTokens).toBeNull();
  });
  it("uses positive evidence across partial accounts and grants today a grace period", () => {
    const days = [12,13,14].map(date => ({ date:`2026-11-${date}`,count:1,providers:[],partial:true }));
    expect(observedStreaks(days,"2026-11-15")).toMatchObject({currentStreakDays:3,longestStreakDays:3});
    expect(observedStreaks([...days,{date:"2026-11-15",count:0,providers:[],partial:false}],"2026-11-15").currentStreakDays).toBe(3);
    expect(observedStreaks(days,"2026-11-17").currentStreakDays).toBeNull();
  });
  it("breaks observed streaks at gaps without inventing zero token days", () => {
    const days = [10,11,13,14].map(date => ({date:`2026-11-${date}`,count:1,providers:[]}));
    expect(observedStreaks(days,"2026-11-15")).toMatchObject({currentStreakDays:2,longestStreakDays:2,activeDays:4});
  });
  it("rejects signing into the same account twice", () => {
    expect(() => combineCodexSnapshots([snapshot(), snapshot()], now)).toThrow(/same account/);
  });
  it("requires both accounts and available daily history", () => {
    expect(() => combineCodexSnapshots([snapshot()], now)).toThrow(/both accounts/);
    expect(() => combineCodexSnapshots([snapshot(), snapshot("b", null)], now)).toThrow(/unavailable/);
    expect(() => combineCodexSnapshots([snapshot(), snapshot("b", [])], now)).toThrow(/unavailable/);
  });
  it("keeps measured tokens but marks partial account coverage explicitly", () => {
    const result = combineCodexSnapshots([snapshot(), snapshot("b", [{ startDate: "2026-11-12", tokens: 7 }])], now);
    expect(result.days.map(d => d.count)).toEqual([17, null, 0]);
    expect(result.days[2].partial).toBe(true);
    expect(result.days[2].providers[0]).toContain("1 of 2 accounts reported (partial)");
  });
  it("rejects duplicate dates, invalid dates, future dates, and unsafe precision", () => {
    for (const buckets of [
      [{ startDate: "2026-11-12", tokens: 1 }, { startDate: "2026-11-12", tokens: 2 }],
      [{ startDate: "2026-02-30", tokens: 1 }], [{ startDate: "2026-11-16", tokens: 1 }],
      [{ startDate: "2026-11-12", tokens: -1 }], [{ startDate: "2026-11-12", tokens: 1.5 }],
      [{ startDate: "2026-11-12", tokens: Number.MAX_SAFE_INTEGER }],
    ]) expect(() => combineCodexSnapshots([snapshot(), snapshot("b", buckets)], now)).toThrow();
  });
});
