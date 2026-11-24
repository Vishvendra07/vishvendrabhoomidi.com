import type {ReactNode} from 'react';

const scenes:Record<string,{label:string;steps:string[];caption:string}>={
 'event-relay':{label:'ORDER → OUTBOX → RECEIPT',steps:['Commit','Claim lease','Deliver','One receipt'],caption:'A retry carries the same event identity.'},
 'workflow-desk':{label:'TWO OPERATORS / ONE RECORD',steps:['Revision 1','Save A','Draft B','Resolve'],caption:'The newer record never erases the local draft.'},
 'implementation-kit':{label:'TWO DEPLOYMENTS / SHARED IMPORT',steps:['North CSV','Harbor CSV','Map + plan','Apply'],caption:'Customer differences live in versioned configuration.'},
 'postgres-cdc-projection':{label:'LOGICAL STREAM / DURABLE CHECKPOINT',steps:['Source WAL','Projection','Watermark','Resume'],caption:'Commit the view before acknowledging the stream.'},
 'mcp-approval-demo':{label:'PROPOSE → REVIEW → APPLY',steps:['MCP tool','Proposal','Approval','Receipt'],caption:'The exact payload and revision travel with approval.'},
 'intake-evals':{label:'AUTHORED REGRESSION SET / 60 CASES',steps:['24 / 60','60 / 60'],caption:'Deterministic extraction · fixture exact matches'},
 'model-change-review':{label:'WORD FEATURES / CHARACTER FEATURES',steps:['Word TF-IDF','Char TF-IDF'],caption:'Compare paired predictions before changing routing.'},
 'kaarya-workflow-case-study':{label:'ENQUIRY → OWNERSHIP → FOLLOW-UP',steps:['Enquiry','Record','Assignment','Follow-up'],caption:'An authored workflow inspired by Kaarya AI.'},
 'nutrilens-ocr-bench':{label:'IMAGE → OCR → FIELD COMPARISON',steps:['6 labels','OCR output','Normalize','Compare'],caption:'Keep recognition fixed to isolate parser changes.'},
 'eatfit-order-sandbox':{label:'CART → STOCK → RECEIPT',steps:['Cart','Stock lock','Commit','Replay'],caption:'The same order key returns the same receipt.'},
 'voice-turn-trace':{label:'ONE TURN / OVERLAPPING STAGES',steps:['Transcribe','Inference','Synthesis','Playback'],caption:'Synthetic trace · interruptions measured separately'},
 'event-relay-performance':{label:'FIXED WORKLOAD / WORKER COMPARISON',steps:['60 events','1 worker','3 workers','Receipts'],caption:'Two local runs; every observation retained.'},
 'integration-diagnostics':{label:'SCHEMA → DRIFT → SCOPED EXPORT',steps:['Schema','Mappings','Drift','Bundle'],caption:'An allowlist controls what leaves the diagnostic.'},
 'tenant-search-benchmark':{label:'TENANT BOUNDARY → RANKING',steps:['Tenant','Documents','Rank','SQL check'],caption:'Scope the documents before calculating similarity.'},
 'durable-approvals':{label:'RESERVATION / TEMPORAL HISTORY',steps:['Reserve','Wait','New worker','Resume'],caption:'A process restart is not a business cancellation.'},
 'property-data-explorer':{label:'SHARED FILTERS / STABLE RECORD ID',steps:['URL filters','DuckDB','Map','Table'],caption:'One selected property across two linked views.'},
 'document-review-queue':{label:'EVIDENCE → REVIEW → DECISION',steps:['Extraction','Validation','Reviewer','Revision'],caption:'A stale decision cannot replace a newer one.'},
 'crm-migration-reconciler':{label:'CONTACT SIGNALS / EXPLICIT REVIEW',steps:['Email','Phone','Reconcile','Review'],caption:'Conflicting identities remain reviewable.'},
 'subscription-reconciliation-lab':{label:'ARRIVAL ORDER ≠ EVENT ORDER',steps:['Event 1','Event 3','Event 2','Projection'],caption:'Only the contiguous sequence advances state.'},
 'api-contract-compatibility':{label:'TWO CONSUMERS / ONE API CHANGE',steps:['Original','Breaking','Additive','Pass'],caption:'Keep existing callers compatible with the new shape.'},
 'open-source-engineering':{label:'ENGINEERING / SOURCE / EVIDENCE',steps:['Product','Backend','Applied AI','Delivery'],caption:'Twenty small systems. Inspectable decisions.'},
};

function Node({x,y,title,detail,accent=false}:{x:number;y:number;title:string;detail?:string;accent?:boolean}){return <g className={accent?'engineering-node engineering-node-accent':'engineering-node'}><rect x={x} y={y} width="108" height="60" rx="8"/><text x={x+14} y={y+26} textLength={title.length>9?80:undefined} lengthAdjust="spacingAndGlyphs">{title}</text>{detail&&<text className="engineering-detail" x={x+14} y={y+44}>{detail}</text>}</g>;}
function Flow({steps}:{steps:string[]}){return <><path className="engineering-wire" d="M102 112H446"/><path className="engineering-travel" d="M102 112H446"/>{steps.map((title,i)=><Node key={title} x={24+i*136} y={82} title={title} accent={i===3}/>)}</>;}
export function EngineeringArt({slug}:{slug:string}){
 const scene=scenes[slug];if(!scene)return null;
 let drawing:ReactNode;
 if(slug==='workflow-desk')drawing=<><path className="engineering-wire" d="M132 65H218Q238 65 238 86V112H296M132 166H218Q238 166 238 144V112"/><path className="engineering-travel" d="M132 166H218Q238 166 238 144V112H296"/><Node x={24} y={35} title="Operator A" detail="save revision 2"/><Node x={24} y={136} title="Operator B" detail="draft preserved" accent/><Node x={296} y={82} title="Resolve" detail="review + retry"/><text className="engineering-note" x="433" y="116">r2 → r3</text></>;
 else if(slug==='implementation-kit')drawing=<><path className="engineering-wire" d="M132 65H185Q206 65 206 86V112H228M132 166H185Q206 166 206 144V112M336 112H432"/><path className="engineering-travel" d="M132 65H185Q206 65 206 86V112H432"/><Node x={24} y={35} title="North CSV" detail="mapping v1"/><Node x={24} y={136} title="Harbor CSV" detail="mapping v1"/><Node x={228} y={82} title="Plan + apply" detail="shared engine" accent/><text className="engineering-note" x="410" y="99">CRM</text><text className="engineering-detail" x="410" y="133">0 on replay</text></>;
 else if(slug==='event-relay')drawing=<><Flow steps={scene.steps}/><path className="engineering-return" d="M450 142V178H314V151"/><text className="engineering-detail" x="352" y="198">retry · same ID</text></>;
 else if(slug==='postgres-cdc-projection')drawing=<><Flow steps={scene.steps}/><path className="engineering-return" d="M450 142V181H178V150"/><text className="engineering-detail" x="231" y="202">restart → skip committed history</text></>;
 else if(slug==='mcp-approval-demo')drawing=<><Flow steps={scene.steps}/><path className="engineering-gate" d="M286 57V73M286 153V169"/><text className="engineering-detail" x="262" y="193">payload digest + revision</text></>;
 else if(['intake-evals','model-change-review'].includes(slug))drawing=<>{scene.steps.map((label,i)=><g key={label}><text className="engineering-note" x="30" y={68+i*78}>{i===0?'Baseline':'Candidate'}</text><rect className="engineering-track" x="150" y={45+i*78} width="302" height="32" rx="4"/><rect className={i?'engineering-bar engineering-bar-candidate':'engineering-bar'} x="150" y={45+i*78} width={slug==='intake-evals'?(i?302:121):(i?302:273)} height="32" rx="4"/><text className="engineering-bar-label" x="164" y={66+i*78}>{label}</text></g>)}<text className="engineering-detail" x="150" y="196">{slug==='intake-evals'?'Exact matches · 60 authored cases':'Feature comparison · synthetic text set'}</text></>;
 else if(slug==='voice-turn-trace')drawing=<>{scene.steps.map((label,i)=><g key={label}><text className="engineering-detail" x="28" y={45+i*45}>{label}</text><rect className="engineering-bar" x={150+i*58} y={28+i*45} width={155-i*19} height="21" rx="3"/></g>)}<path className="engineering-gate" d="M421 24V199"/><text className="engineering-detail" x="432" y="197">audio</text></>;
 else drawing=<Flow steps={scene.steps}/>;
 return <div className={`project-illustration engineering-art art-${slug}`} role="img" aria-label={`${scene.label}. ${scene.caption}`}><div className="engineering-art-title mono">{scene.label}</div><svg viewBox="0 0 560 230" aria-hidden="true">{drawing}</svg><p className="engineering-art-caption">{scene.caption}</p></div>;
}
export function hasEngineeringArt(slug:string){return Object.hasOwn(scenes,slug);}
