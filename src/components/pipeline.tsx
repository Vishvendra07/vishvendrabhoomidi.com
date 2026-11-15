"use client";
import {useEffect,useId,useRef,useState,type CSSProperties,type PointerEvent} from 'react';
import {Icon} from './icons';
import {PipelineIcon} from './pipeline-icon';

const stages = [
 {title:'Message',subtitle:'A request arrives',detail:'The input carries a request and its channel context. In this teaching model, the message is: ‘Help me find the next step.’ Real systems need to retain only the context they are authorized to use.',output:'Request + channel context'},
 {title:'Understand',subtitle:'Intent & context',detail:'An orchestration step identifies what the person is asking and which information is still missing. A missing detail should lead to clarification before an action is attempted.',output:'Intent + information needed'},
 {title:'Retrieve / tools',subtitle:'Ground the next step',detail:'Relevant knowledge or a tool result gives the next step something concrete to work with. Permissions, input checks, and tool failures need their own handling.',output:'Relevant context + tool result'},
 {title:'Execute',subtitle:'An explicit outcome',detail:'The operation produces an outcome: completed, deferred, or failed. The system should represent that outcome explicitly rather than infer success from a fluent response.',output:'Outcome + response'},
];
type Point={x:number;y:number};
const wide:Point[]=[{x:14,y:50},{x:38,y:50},{x:62,y:50},{x:86,y:50}];
const narrow:Point[]=[{x:25,y:25},{x:75,y:25},{x:25,y:75},{x:75,y:75}];
const emptyPositions=():Array<Point|null>=>[null,null,null,null];

function connection(a:Point,b:Point,cardWidth:number,cardHeight:number) {
 const dx=b.x-a.x,dy=b.y-a.y;
 if(Math.abs(dx)>=Math.abs(dy)){
  const direction=Math.sign(dx)||1,sx=a.x+direction*(cardWidth/2+5),tx=b.x-direction*(cardWidth/2+7),middle=(sx+tx)/2;
  return {path:`M${sx} ${a.y} C${middle} ${a.y} ${middle} ${b.y} ${tx} ${b.y}`,sx,sy:a.y,tx,ty:b.y};
 }
 const direction=Math.sign(dy)||1,sx=a.x,sy=a.y+direction*(cardHeight/2+5),tx=b.x,ty=b.y-direction*(cardHeight/2+7),middle=(sy+ty)/2;
 const bend=Math.min(10,Math.abs(ty-sy)/3,Math.abs(tx-sx)/3),horizontal=Math.sign(tx-sx);
 const path=horizontal?`M${sx} ${sy} V${middle-direction*bend} Q${sx} ${middle} ${sx+horizontal*bend} ${middle} H${tx-horizontal*bend} Q${tx} ${middle} ${tx} ${middle+direction*bend} V${ty}`:`M${sx} ${sy} V${ty}`;
 return {path,sx,sy,tx,ty};
}

export function PipelineDemo({compact=false,headingLevel=3}:{compact?:boolean;headingLevel?:2|3}) {
 const Heading=headingLevel===2?'h2':'h3',id=useId().replaceAll(':','');
 const field=useRef<HTMLDivElement>(null);
 const dragOffset=useRef({x:0,y:0});
 const [size,setSize]=useState({width:0,height:0});
 const [selected,setSelected]=useState(0);
 const [custom,setCustom]=useState(emptyPositions);
 useEffect(()=>{const node=field.current;if(!node)return;let wasNarrow=node.clientWidth<600;const update=()=>{const next={width:node.clientWidth,height:node.clientHeight};if((next.width<600)!==wasNarrow){wasNarrow=next.width<600;setCustom(emptyPositions());}setSize(previous=>previous.width===next.width&&previous.height===next.height?previous:next);};update();const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect();},[]);
 const small=size.width<600,defaults=small?narrow:wide;
 const positions=defaults.map((p,i)=>custom[i]||p);
 const cardWidth=small?Math.min(150,size.width*.5-32):Math.min(184,Math.max(128,size.width*.18));
 const cardHeight=148;
 const points=positions.map(p=>({x:p.x/100*size.width,y:p.y/100*size.height}));
 const edges=points.slice(0,3).map((p,i)=>connection(p,points[i+1],cardWidth,cardHeight));
 function move(event:PointerEvent<HTMLButtonElement>,index:number){
  if(compact||!event.currentTarget.hasPointerCapture(event.pointerId)||!field.current)return;
  const bounds=field.current.getBoundingClientRect(),minX=(cardWidth/2+8)/bounds.width*100,minY=(cardHeight/2+8)/bounds.height*100;
  const point={x:Math.max(minX,Math.min(100-minX,(event.clientX-bounds.left-dragOffset.current.x)/bounds.width*100)),y:Math.max(minY,Math.min(100-minY,(event.clientY-bounds.top-dragOffset.current.y)/bounds.height*100))};
  setCustom(previous=>previous.map((old,i)=>i===index?point:old));
 }
 return <div className={`pipeline ${compact?'pipeline-compact':''}`}>
  <div className="pipeline-top"><span className="mono">REQUEST → CONTEXT → ACTION</span><span>Select a stage{!compact?' · drag to rearrange':''}</span></div>
  <div className="pipeline-canvas" ref={field}>
   {size.width>0&&<svg className="pipeline-connections" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true"><defs><linearGradient id={`${id}-line`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={size.width} y2="0"><stop stopColor="var(--accent)"/><stop offset="1" stopColor="var(--blue)"/></linearGradient><marker id={`${id}-arrow`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="m1 1 4 2-4 2" fill="none" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>{edges.map((edge,i)=><g key={i}><path className="pipeline-connection" d={edge.path} stroke={`url(#${id}-line)`} markerEnd={`url(#${id}-arrow)`} vectorEffect="non-scaling-stroke"/><path className="pipeline-flow-pulse" pathLength="100" d={edge.path} vectorEffect="non-scaling-stroke" style={{animationDelay:`${i*-1.6}s`}}/><circle cx={edge.sx} cy={edge.sy} r="2" className="pipeline-port"/></g>)}</svg>}
   {stages.map((stage,i)=><button key={stage.title} className={`pipeline-node ${selected===i?'selected':''}`} style={{'--stage-x':`${wide[i].x}%`,'--stage-y':`${wide[i].y}%`,'--small-stage-x':`${narrow[i].x}%`,'--small-stage-y':`${narrow[i].y}%`,...(custom[i]?{left:`${custom[i]!.x}%`,top:`${custom[i]!.y}%`}:{})} as CSSProperties} aria-pressed={selected===i} aria-label={`Stage ${i+1}: ${stage.title}`} onClick={()=>setSelected(i)} onPointerDown={event=>{if(!compact&&event.isPrimary){const bounds=event.currentTarget.getBoundingClientRect();dragOffset.current={x:event.clientX-bounds.left-bounds.width/2,y:event.clientY-bounds.top-bounds.height/2};event.currentTarget.setPointerCapture(event.pointerId);setSelected(i);}}} onPointerMove={event=>move(event,i)} onPointerUp={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}} onKeyDown={event=>{const direction=event.key==='ArrowRight'||event.key==='ArrowDown'?1:event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:0;if(direction){event.preventDefault();const next=(i+direction+4)%4;setSelected(next);field.current?.querySelectorAll<HTMLButtonElement>('.pipeline-node')[next].focus();}}}><span className="pipeline-node-index mono">0{i+1}</span><span className="node-glyph"><PipelineIcon stage={i}/></span><span className="node-title">{stage.title}</span><span className="node-subtitle">{stage.subtitle}</span></button>)}
  </div>
  <div className="pipeline-explanation" aria-live="polite"><span className="pipeline-active-step mono">0{selected+1} / 04</span><div><Heading>{stages[selected].title}</Heading><p>{stages[selected].detail}</p><div className="pipeline-output"><span className="mono">HANDOFF</span><Icon name="arrow" width="14" height="14"/><span>{stages[selected].output}</span></div></div></div>
  {!compact&&<div className="pipeline-actions"><button className="small-button" onClick={()=>setCustom(emptyPositions())}>Reset layout</button><p>Use the arrow keys to inspect stages. Moving nodes changes the layout, not the execution order.</p></div>}
 </div>;
}
