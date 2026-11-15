import {BrandIcon,KaaryaMark} from './brand-icon';

function VoiceGlyph(){return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true"><path d="M3 8v4m3-7v10m4-13v16m4-12v8m3-6v4"/></svg>;}
export function KaaryaSystem(){return <div className="kaarya-system brand-stage">
  <div className="kaarya-knowledge"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="m10 2 7 4v8l-7 4-7-4V6Zm0 0v16M3 6l7 4 7-4"/></svg><span>Knowledge</span></div>
  <div className="kaarya-endpoints kaarya-inputs"><span><BrandIcon name="whatsapp"/>Messaging</span><span><VoiceGlyph/>Voice</span></div>
  <div className="kaarya-core"><KaaryaMark/><span className="kaarya-core-name">Kaarya AI</span></div>
  <div className="kaarya-endpoints kaarya-outputs"><span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="13" y="13" width="5" height="5" rx="1"/><path d="M7 4.5h8.5V13M4.5 7v8.5H13"/></svg>Workflows</span><span><BrandIcon name="calendar"/>Scheduling</span></div>
  <svg className="kaarya-system-rails" viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true"><g>{['M110 112C190 112 195 180 250 180','M110 248C190 248 195 180 250 180','M350 180C405 180 410 112 490 112','M350 180C405 180 410 248 490 248','M300 34V105'].map((d,i)=><g key={d} className={`system-rail-${i}`}><path d={d}/><path className={`system-signal signal-${i}`} pathLength="100" d={d}/></g>)}</g></svg>
  <div className="kaarya-system-note">Understand <i/> Connect <i/> Follow through</div>
</div>;}
