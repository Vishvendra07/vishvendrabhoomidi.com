import { normalizeImport } from "../../src/lib/activity-import";
export function activityFixture() {
  const now=new Date("2026-11-15T15:00:00Z");
  const data=normalizeImport({version:1,timezone:"America/Detroit",coverage:{start:"2026-11-01",end:"2026-11-15",complete:true},records:Array.from({length:15},(_,i)=>({date:`2026-11-${String(i+1).padStart(2,"0")}`,provider:"TEST FIXTURE — not real usage",inputTokens:i*20,outputTokens:i*10,totalTokens:i*30}))},now);
  data.metadata.verified=true;data.metadata.label="DEMO DATA — NOT REAL USAGE";
  return data;
}
