"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { addDays, aggregateWeeks, cumulative, dateRange, summarize, type ActivityDataset, type ActivityMetadata, type DailyActivity } from "@/lib/activity";
import { Icon } from "./icons";

function number(n: number) { return new Intl.NumberFormat("en-US").format(n); }
export function ActivitySummary({ days, unit, accountSummary }: { days: DailyActivity[]; unit: string; accountSummary?: ActivityMetadata["accountSummary"] }) {
  const summary = summarize(days);
  const total = accountSummary ? accountSummary.lifetimeTokens : summary.total;
  const current = accountSummary ? accountSummary.currentStreakDays : summary.currentStreak;
  const longest = accountSummary ? accountSummary.longestStreakDays : summary.longestStreak;
  const compact = (value: number) => value >= 1_000_000 ? new Intl.NumberFormat("en-US", {notation:"compact",maximumFractionDigits:2}).format(value) : number(value);
  return <div className="activity-summary"><div><span className="mono muted">{accountSummary ? "LIFETIME TOKENS" : `${unit.toUpperCase()} IN RANGE`}</span><strong title={total === null ? undefined : `${number(total)} ${unit}`} aria-label={total === null ? "Unavailable" : `${number(total)} ${unit}`}>{total === null ? "—" : compact(total)}</strong></div><div><span className="mono muted">ACTIVE DAYS</span><strong>{accountSummary?.activeDays ?? (summary.total === null ? "—" : summary.activeDays)}</strong></div><div><span className="mono muted">CURRENT STREAK</span><strong title="Consecutive observed active dates through today or yesterday">{current === null ? "—" : `${current}d`}</strong></div><div><span className="mono muted">LONGEST STREAK</span><strong title="Longest consecutive run in the returned daily records">{longest === null ? "—" : `${longest}d`}</strong></div></div>;
}
export function ActivityHeatmap({ dataset, end }: { dataset: ActivityDataset; end: string; owner?: boolean }) {
  const [view,setView] = useState("Daily"), [range,setRange] = useState("12"), [detail,setDetail] = useState<DailyActivity | null>(null), [focusDate,setFocusDate] = useState("");
  const heatmapScroll = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState<number | null>(null);
  useEffect(() => { const update = () => setClock(Date.now()); const frame = requestAnimationFrame(update); const timer = setInterval(update, 60_000); return () => { cancelAnimationFrame(frame); clearInterval(timer); }; }, []);
  const stale = clock !== null && !!dataset.metadata.updatedAt && clock - Date.parse(dataset.metadata.updatedAt) > 36 * 60 * 60 * 1000;
  useEffect(() => { const chart = heatmapScroll.current; if (chart) chart.scrollLeft = chart.scrollWidth; }, [range, view]);
  const start = addDays(end, range === "12" ? -364 : -181);
  const byDate = new Map(dataset.days.map(d => [d.date,d]));
  const days = dateRange(start,end).map(date => byDate.get(date) || { date, count: null, providers: [] });
  const max = Math.max(1, ...days.map(d => d.count || 0));
  const connected = dataset.metadata.verified && dataset.days.some(d => d.count !== null);
  const pad = (new Date(`${start}T00:00:00Z`).getUTCDay()+6)%7;
  const cells = [...Array.from({length: pad}, () => null), ...days];
  const weeks = aggregateWeeks(days);
  const cum = cumulative(days);
  const summary = summarize(days);
  const total = summary.total || 1;
  const months: { label: string; column: number }[] = [];
  days.forEach((d,i) => { if (i === 0 || d.date.endsWith("-01")) months.push({ label: new Intl.DateTimeFormat("en-US", { month:"short", timeZone:"UTC" }).format(new Date(d.date)), column: Math.floor((i+pad)/7) }); });
  function cellKey(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    const move = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (move) { e.preventDefault(); const buttons = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button"); buttons?.[Math.max(0,Math.min(days.length-1,i+move))]?.focus(); }
  }
  return <div className="activity-card">
    <div className="activity-card-top"><div className="source-badge"><span className={connected && !stale ? "status-dot" : "status-dot unconnected"} />{connected ? dataset.metadata.source === "codex" && stale ? "Awaiting sync" : dataset.metadata.label : "Data not connected"}</div><div className="activity-controls"><label className="sr-only" htmlFor="activity-range">Activity date range</label><select id="activity-range" value={range} onChange={e => { setRange(e.target.value); setDetail(null); }}><option value="12">Last 12 months</option><option value="6">Last 6 months</option></select><div className="segmented" aria-label="Activity view">{["Daily","Weekly","Cumulative"].map(v => <button key={v} aria-pressed={view === v} onClick={() => { setView(v); setDetail(null); }}>{v}</button>)}</div></div></div>
    <ActivitySummary days={days} unit={dataset.metadata.unit} accountSummary={dataset.metadata.accountSummary} />
    <div className={`activity-chart ${!connected ? "not-connected" : ""}`}>
      {view === "Daily" && <div className="heatmap-scroll" ref={heatmapScroll}><div className="heatmap-content"><div className="heatmap-months" style={{ gridTemplateColumns:`repeat(${Math.ceil(cells.length/7)},1fr)` }}>{months.map((m,i) => <span key={i} style={{ gridColumn: m.column+1 }}>{m.label}</span>)}</div><div className="heatmap-body"><div className="heatmap-weekdays mono"><span>Mon</span><span>Wed</span><span>Fri</span></div><div className="heatmap-grid" style={{ gridTemplateColumns:`repeat(${Math.ceil(cells.length/7)},1fr)` }} aria-label="Daily activity calendar">{cells.map((d,i) => d ? <button key={d.date} className={`heatmap-cell level-${d.count === null ? "missing" : d.count === 0 ? "0" : Math.min(5,Math.ceil(d.count/max*5))}`} aria-label={`${d.date}: ${d.count === null ? "no verified data" : `${number(d.count)} ${dataset.metadata.unit}${d.partial ? ", partial account coverage" : ""}`}`} tabIndex={connected && (focusDate === d.date || (!days.some(day => day.date === focusDate) && i === cells.length - 1)) ? 0 : -1} onFocus={() => { setDetail(d); setFocusDate(d.date); }} onMouseEnter={() => setDetail(d)} onMouseLeave={() => setDetail(null)} onKeyDown={e => cellKey(e, i-pad)} /> : <span key={`pad-${i}`} />)}</div></div></div></div>}
      {view === "Weekly" && <div className="weekly-chart" aria-label="Weekly activity totals">{weeks.map(w => <button key={w.date} onFocus={() => setDetail({ date: `Week of ${w.date}`, count: w.count, providers: w.missing ? ["Partial coverage: missing days excluded"] : [] })} onMouseEnter={() => setDetail({date: `Week of ${w.date}`, count:w.count, providers:w.missing ? ["Partial coverage"] : []})} aria-label={`Week of ${w.date}: ${w.count === null ? "unavailable" : `${number(w.count)} ${dataset.metadata.unit}, ${w.missing} missing days`}`}><span style={{height: w.count === null ? "3px" : `${Math.max(2,w.count/Math.max(1,...weeks.map(x => x.count || 0))*100)}%`}} /></button>)}</div>}
      {view === "Cumulative" && <div className="cumulative-chart"><svg viewBox="0 0 1000 150" preserveAspectRatio="none" role="img" aria-label={`Cumulative observed total: ${number(summarize(days).total || 0)} ${dataset.metadata.unit}. Missing dates have gaps; no activity is inferred.`}>{cum.map((d,i) => d.count !== null && <path key={d.date} d={`M${i/(cum.length-1)*1000},${145-(cum[i-1]?.count ?? d.count)/total*130} V${145-d.count/total*130}${cum[i+1] && cum[i+1].count !== null ? ` H${(i+1)/(cum.length-1)*1000}` : ""}`} fill="none" stroke="var(--blue)" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}</svg><div className="mono muted chart-axis"><span>{start}</span><span>{end}</span></div></div>}
      {!connected && <div className="activity-empty-message"><span className="empty-dot" /><div><h3>The work deserves an honest record.</h3><p>Verified activity will appear here when a source is connected.</p></div></div>}
    </div>
    <div className="activity-detail mono" aria-live="polite">{detail ? `${detail.date} · ${detail.count === null ? "No verified data" : `${number(detail.count)} ${dataset.metadata.unit}`} ${detail.providers.length ? `· ${detail.providers.join(", ")}` : ""}` : `${start} — ${end} · ${dataset.metadata.source === "codex" ? "Provider calendar dates" : dataset.metadata.timezone}`}</div>
    <div className="activity-bottom"><Link href="/activity/methodology">How this is measured <Icon name="external" width="14" height="14" /></Link><div className="activity-legend mono"><span>Missing</span><i className="level-missing" /><span>Less</span>{[0,1,2,3,4,5].map(n => <i key={n} className={`level-${n}`} />)}<span>More</span></div></div>
  </div>;
}
