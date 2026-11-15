"use client";
import { useState } from "react";
import { latencyBudget, type LatencyInputs } from "@/lib/latency";
const controls = [{ key: "stt", label: "Speech to text", description: "Understand the audio", max: 1600 }, { key: "retrieval", label: "Retrieval", description: "Prepare relevant context", max: 1600 }, { key: "llm", label: "Language model", description: "Generate a response", max: 3000 }, { key: "tts", label: "Text to speech", description: "Produce the audio", max: 1600 }] as const;
export function LatencyDemo() {
  const [v,setV] = useState<LatencyInputs>({ stt: 400, retrieval: 300, llm: 800, tts: 250 });
  const [mode,setMode] = useState<"sequential" | "parallel">("parallel");
  const budget = latencyBudget(v);
  const total = budget[mode];
  const starts = mode === "sequential" ? [0,v.stt,v.stt+v.retrieval,v.stt+v.retrieval+v.llm] : [0,0,Math.max(v.stt,v.retrieval),Math.max(v.stt,v.retrieval)+v.llm];
  const scale = Math.max(budget.sequential, 1);
  return <div className="latency-demo"><div className="latency-controls">{controls.map(c => <label key={c.key} htmlFor={c.key}><span>{c.label}<output htmlFor={c.key}>{v[c.key]} <small>ms</small></output></span><small>{c.description}</small><input id={c.key} type="range" min="0" max={c.max} step="50" value={v[c.key]} onChange={e => setV({ ...v, [c.key]: Number(e.target.value) })} /></label>)}</div>
    <div className="latency-visual"><div className="segmented" aria-label="Execution model">{(["sequential","parallel"] as const).map(m => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{m === "sequential" ? "Sequential" : "Parallel"}</button>)}</div><div className="latency-result" aria-live="polite"><span className="mono muted">MODELED RESPONSE TIME</span><strong>{(total/1000).toFixed(2)}<small>s</small></strong><p>{mode === "parallel" ? `${budget.saved} ms saved by overlapping independent work` : "Each stage waits for the previous stage"}</p></div>
    <div className="latency-tracks" aria-label="Stage timing diagram">{controls.map((c,i) => <div className="latency-track" key={c.key}><span>{c.label}</span><div><div className={`latency-bar bar-${i}`} style={{ marginLeft: `${starts[i]/scale*100}%`, width: `${v[c.key]/scale*100}%`, minWidth: v[c.key] ? "2px" : 0 }} /><small>{starts[i]}–{starts[i]+v[c.key]} ms</small></div></div>)}</div><div className="latency-scale mono"><span>0 ms</span><span>{budget.sequential} ms</span></div></div>
    <div className="lab-assumptions"><h2>What this model assumes</h2><p>Retrieval can begin independently alongside speech processing. Generation waits for both; speech output waits for generation. No streaming, network variance, retries, or tool execution is modeled. These adjustable values are illustrative, not measured Kaarya or provider performance.</p><p className="mono">Sequential = STT + retrieval + LLM + TTS<br />Parallel = max(STT, retrieval) + LLM + TTS</p></div>
  </div>;
}
