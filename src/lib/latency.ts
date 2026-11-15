export type LatencyInputs = { stt: number; llm: number; retrieval: number; tts: number };
export function latencyBudget(v: LatencyInputs) {
  if (Object.values(v).some(n => !Number.isFinite(n) || n < 0)) throw new Error("Latency must be finite and non-negative");
  const sequential = v.stt + v.retrieval + v.llm + v.tts;
  // Retrieval in this toy model can start with audio processing; generation waits for both.
  const parallel = Math.max(v.stt, v.retrieval) + v.llm + v.tts;
  return { sequential, parallel, saved: sequential - parallel };
}
