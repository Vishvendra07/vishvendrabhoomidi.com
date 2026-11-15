import {PipelineIcon} from './pipeline-icon';

export function LabPreview({kind}:{kind:'pipeline'|'latency'}) {
 if(kind==='pipeline')return <div className="lab-preview preview-pipeline" aria-hidden="true"><div className="preview-flow-steps"><div className="preview-flow-rail"/>{['Message','Context','Tools','Action'].map((label,i)=><div className="preview-flow-step" key={label}><span className="preview-step-number">0{i+1}</span><span className="preview-step-icon"><PipelineIcon stage={i}/></span><span className="preview-step-label">{label}</span></div>)}</div><span className="preview-figure-note">One request. Four explicit handoffs.</span></div>;
 const stages=['Speech','Context','Model','Voice'];
 const sequence=[{start:0,length:23},{start:25,length:17},{start:44,length:35},{start:81,length:19}];
 const overlap=[{start:0,length:23},{start:0,length:17},{start:25,length:35},{start:62,length:19}];
 return <div className="lab-preview preview-latency" aria-hidden="true"><div className="preview-schedule"><span className="preview-lane-label">Sequential</span><div className="preview-schedule-lane lane-sequential">{sequence.map((bar,i)=><i key={stages[i]} className={`preview-duration duration-${i}`} style={{left:`${bar.start}%`,width:`${bar.length}%`}}/>)}</div></div><div className="preview-schedule"><span className="preview-lane-label">Parallel</span><div className="preview-schedule-lane lane-parallel">{overlap.map((bar,i)=><i key={stages[i]} className={`preview-duration duration-${i}`} style={{left:`${bar.start}%`,width:`${bar.length}%`}}/>)}</div></div><div className="preview-duration-legend">{stages.map((stage,i)=><span key={stage}><i className={`duration-${i}`}/>{stage}</span>)}</div><span className="preview-figure-note">Same stages. A shorter critical path.</span></div>;
}
