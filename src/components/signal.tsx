"use client";
import {useEffect,useRef,useState} from 'react';
import {useMotionEnabled} from './motion-control';

// A projected toroidal ribbon. The sculpture is original generative geometry, not telemetry.
const ribbons=Array.from({length:28},(_,r)=>Array.from({length:90},(_,i)=>{
  const t=i/89*Math.PI*2,phase=(r/27-.5)*.74;
  const radius=1.35+.34*Math.cos(3*t+phase*2);
  return {x:radius*Math.cos(2*t+phase),y:radius*Math.sin(2*t+phase),z:.66*Math.sin(3*t+phase*1.4)};
}));
export function SignalArt({compact=false}:{compact?:boolean}){
  const host=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),pointer=useRef({x:0,y:0}),phase=useRef(1.1);
  const enabled=useMotionEnabled();
  const [ready,setReady]=useState(false);
  // The server-rendered sculpture is visible immediately; Canvas waits for idle time.
  useEffect(()=>{
    if(typeof window.requestIdleCallback==='function'){const task=window.requestIdleCallback(()=>setReady(true),{timeout:1500});return()=>window.cancelIdleCallback(task);}
    const task=window.setTimeout(()=>setReady(true),120);return()=>window.clearTimeout(task);
  },[]);
  useEffect(() => {
    if(!ready)return;
    const node = canvas.current, container = host.current;
    if (!node || !container) return;
    const ctx = node.getContext('2d');
    if (!ctx) return;
    let frame = 0, last = 0, previousTime = 0, visible = true;
    let width = 600, height = 600, rotationX = 0, rotationY = 0;
    let dark = false;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const running = () => enabled && visible && !document.hidden;
    function paint(time: number) {
      const t = phase.current;
      rotationX += (pointer.current.y * .18 - rotationX) * .05;
      rotationY += (pointer.current.x * .22 - rotationY) * .05;
      ctx!.clearRect(0, 0, width, height);
      const size = Math.min(width, height), scale = size * .205, cx = width * .5, cy = height * .49;
      const a = .62 + Math.sin(t * .6) * .18 + rotationX, b = t * .42 + rotationY;
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      // Reuse one projection record; the running sculpture does not allocate thousands of points per frame.
      const projected={x:0,y:0,z:0};
      const project = (p: {x:number;y:number;z:number}) => {
        const x = p.x * cb - p.z * sb, z = p.x * sb + p.z * cb;
        const y = p.y * ca - z * sa, depth = p.y * sa + z * ca, perspective = 4.9 / (4.9 + depth);
        projected.x=cx+x*scale*perspective;projected.y=cy+y*scale*perspective;projected.z=depth;return projected;
      };
      const grad = ctx!.createLinearGradient(cx-scale*1.5,cy-scale,cx+scale*1.5,cy+scale);
      grad.addColorStop(0,dark?'rgba(188,153,255,.56)':'rgba(105,75,162,.48)');
      grad.addColorStop(.5,dark?'rgba(149,155,255,.9)':'rgba(91,106,183,.75)');
      grad.addColorStop(1,dark?'rgba(102,190,255,.68)':'rgba(48,123,186,.58)');
      ctx!.strokeStyle=grad;
      for(let ring=0;ring<ribbons.length;ring++) {
        const points=ribbons[ring];let depth=0;ctx!.beginPath();
        for(let i=0;i<points.length;i++){const p=project(points[i]);depth+=p.z;if(i)ctx!.lineTo(p.x,p.y);else ctx!.moveTo(p.x,p.y);}
        depth/=points.length;
        ctx!.globalAlpha=Math.max(.25,Math.min(.95,.65-depth*.13));
        ctx!.lineWidth=ring%7===0?1.15:.65;ctx!.stroke();
      }
      ctx!.globalAlpha=1;
      for(let i=0;i<7;i++) {
        const ring=ribbons[(i*4)%ribbons.length], index=Math.floor(((t*.19+i/7)%1)*89), p=project(ring[index]);
        ctx!.fillStyle=dark?'#d7dfff':'#665c9e';ctx!.beginPath();ctx!.arc(p.x,p.y,1.8,0,Math.PI*2);ctx!.fill();
      }
      container!.dataset.painted='true';
      previousTime=time;
    }
    function tick(time:number) {
      frame=0;
      if (!running()) return;
      if(time-last>=1000/(width<500?20:30)) {
        if(previousTime) phase.current+=Math.min(time-previousTime,100)*.00013;
        paint(time);last=time;
      }
      frame=requestAnimationFrame(tick);
    }
    function schedule() {
      if(frame) cancelAnimationFrame(frame);
      frame=0;previousTime=0;
      if(running()) frame=requestAnimationFrame(tick);
    }
    const theme=()=>{dark=document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':media.matches;paint(performance.now());schedule();};
    const resize=()=>{const box=node!.getBoundingClientRect();width=box.width;height=box.height;
      const dpr=Math.min(window.devicePixelRatio||1,width<500?1.25:1.5);
      node!.width=Math.round(width*dpr);node!.height=Math.round(height*dpr);ctx!.setTransform(dpr,0,0,dpr,0,0);
      paint(performance.now());schedule();};
    dark=document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':media.matches;
    resize();
    const resizing=new ResizeObserver(resize);resizing.observe(node);
    const observer=new MutationObserver(theme);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();});intersection.observe(container);
    document.addEventListener('visibilitychange',schedule);media.addEventListener('change',theme);
    return()=>{cancelAnimationFrame(frame);resizing.disconnect();observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',schedule);media.removeEventListener('change',theme);};
  },[enabled,ready]);
  return <div ref={host} className={`signal-art signal-sculpture ${compact?'compact':''}`} onPointerMove={e=>{if(!enabled||e.pointerType==='touch')return;const box=e.currentTarget.getBoundingClientRect();pointer.current={x:(e.clientX-box.left)/box.width-.5,y:(e.clientY-box.top)/box.height-.5};}} onPointerLeave={()=>{pointer.current={x:0,y:0};}}>
    <div className="sculpture-halo"/>
    <svg className="sculpture-orbits" viewBox="0 0 600 600" aria-hidden="true"><circle cx="300" cy="290" r="236"/><ellipse cx="300" cy="290" rx="260" ry="120" transform="rotate(-32 300 290)"/><circle className="orbit-dashed" cx="300" cy="290" r="260"/><path d="M300 20v18m-9-9h18M29 290h18m-9-9v18M553 290h18m-9-9v18M300 542v18m-9-9h18"/></svg>
    <svg className="sculpture-fallback" viewBox="0 0 600 600" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1">{ribbons.filter((_,i)=>i%3===0).map((r,i)=><path key={i} d={r.map((p,index)=>{const t=1.1,a=.62+Math.sin(t*.6)*.18,b=t*.42,x=p.x*Math.cos(b)-p.z*Math.sin(b),z=p.x*Math.sin(b)+p.z*Math.cos(b),y=p.y*Math.cos(a)-z*Math.sin(a),depth=p.y*Math.sin(a)+z*Math.cos(a),q=4.9/(4.9+depth);return `${index?'L':'M'}${(300+x*123*q).toFixed(1)} ${(294+y*123*q).toFixed(1)}`;}).join(' ')}/>)}</g></svg>
    <canvas ref={canvas} className="sculpture-canvas" role="img" aria-label="An animated sculpture of interwoven violet and blue signal ribbons, converging into a continuous execution loop."/>
    <div className="sculpture-label label-context"><span/>CONTEXT</div><div className="sculpture-label label-action"><span/>ACTION</div>
    <div className="sculpture-coordinate mono">φ / 01 <span>FORM FOLLOWS FLOW</span></div>
    {!compact&&<div className="signal-caption mono"><span>INTELLIGENCE, PUT IN MOTION</span><span>FIG. 01</span></div>}
  </div>;
}
