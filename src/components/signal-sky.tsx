import type { CSSProperties } from 'react';

// Fixed coordinates keep the server render stable and avoid a client-side particle engine.
const stars = Array.from({ length: 78 }, (_, i) => ({
  x: (i * 47.137 + 3.4) % 100,
  y: (i * 31.719 + 7.2) % 100,
  size: i % 11 === 0 ? 2.8 : i % 3 === 0 ? 1.8 : 1.2,
}));

export function SignalSky() {
  return <div className="signal-sky" aria-hidden="true">
    <div className="sky-atmosphere" />
    <div className="sky-stars">{stars.map((star, i) => <span key={i} className={`sky-star${i % 9 === 0 ? ' sky-star-pulse' : ''}`} style={{left:`${star.x}%`,top:`${star.y}%`,width:star.size,height:star.size,'--star-delay':`${-i * 1.7}s`,'--star-alpha':i % 11 === 0 ? .85 : .5} as CSSProperties} />)}</div>
    <svg className="sky-constellation sky-constellation-east" viewBox="0 0 280 480" fill="none"><path d="m34 38 111 84-41 129 128 105-69 92"/><g>{[[34,38],[145,122],[104,251],[232,356],[163,448]].map(([cx,cy])=><circle key={cy} cx={cx} cy={cy} r="2"/>)}</g></svg>
    <svg className="sky-constellation sky-constellation-west" viewBox="0 0 240 340" fill="none"><path d="m17 294 89-59-40-110L182 38"/><g>{[[17,294],[106,235],[66,125],[182,38]].map(([cx,cy])=><circle key={cy} cx={cx} cy={cy} r="1.8"/>)}</g></svg>
    <div className="sky-traces"><span className="sky-trace sky-trace-one"><i/></span><span className="sky-trace sky-trace-two"><i/></span><span className="sky-trace sky-trace-three"><i/></span></div>
  </div>;
}
