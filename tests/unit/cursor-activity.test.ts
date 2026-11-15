import { describe,expect,it } from "vitest";
import { archiveCursorAccounts, combineCursorArchive, parseCursorCsv } from "../../src/lib/cursor-activity";
import { emptyActivity } from "../../src/lib/activity";
const now = new Date("2026-11-15T12:00:00Z");
const csv = 'Date,Model,Total Tokens,Input (w/ Cache Write),Cost\r\n2025-09-05T01:00:00Z,"model, example",10,999,1.00\r\n2025-09-05T02:00:00Z,example,20,999,2.00\r\n2025-09-07T00:00:00Z,example,0,999,0\r\n';
const inputs = [{accountKey:"a".repeat(64),csv},{accountKey:"b".repeat(64),csv:csv.replace('01:00:00','03:00:00')}];
describe("private Cursor archives",()=>{
  it("uses authoritative total tokens without adding overlapping input/cache columns",()=>{
    expect(parseCursorCsv(csv,now).days.map(day=>day.count)).toEqual([30,0]);
    expect(parseCursorCsv('\uFEFF'+csv,now).recordCount).toBe(3);
  });
  it("replaces snapshots deterministically and publishes no raw fields or identities",()=>{
    const archive=archiveCursorAccounts(inputs,now);
    expect(archive.totalTokens).toBe(60); expect(archive.accountCount).toBe(2);
    expect(archiveCursorAccounts(inputs,now)).toEqual(archive);
    const serialized=JSON.stringify(archive);
    for(const value of ["accountKey","Cost","Model","example","a".repeat(64)])expect(serialized).not.toContain(value);
  });
  it("rejects duplicate account imports",()=>{expect(()=>archiveCursorAccounts([inputs[0],inputs[0]],now)).toThrow(/distinct/);});
  it.each(["-1","1.2","","9007199254740992"])("rejects invalid counts %s",value=>{expect(()=>parseCursorCsv(csv.replace(',10,',`,${value},`),now)).toThrow();});
  it("rejects invalid timestamps and future records",()=>{
    for(const value of ["2025-02-30T01:00:00Z","2025-09-05T01:00:00","2026-11-16T01:00:00Z"])
      expect(()=>parseCursorCsv(csv.replace('2025-09-05T01:00:00Z',value),now)).toThrow();
  });
  it("combines lifetime and daily records without making unknown days zero",()=>{
    const codex=emptyActivity();codex.metadata.source="codex";codex.metadata.accountSummary={lifetimeTokens:1000,currentStreakDays:null,longestStreakDays:1,activeDays:1,streakAsOf:"2026-11-15"};codex.days=[{date:"2025-09-05",count:5,providers:["Codex"]}];
    const result=combineCursorArchive(codex,archiveCursorAccounts(inputs,now),now);
    expect(result.metadata.source).toBe("combined");expect(result.metadata.accountSummary?.lifetimeTokens).toBe(1060);
    expect(result.days.map(day=>day.count)).toEqual([65,null,0]);
    expect(()=>combineCursorArchive(result,archiveCursorAccounts(inputs,now),now)).toThrow(/exactly once/);
  });
});
