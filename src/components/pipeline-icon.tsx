import type {SVGProps} from 'react';

export function PipelineIcon({stage,...props}:SVGProps<SVGSVGElement>&{stage:number}) {
 const shapes=[
  <path key="message" d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 3V6a2 2 0 0 1 2-2Zm2 5h10M7 13h6"/>,
  <g key="context"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3"/></g>,
  <g key="tools"><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/></g>,
  <g key="action"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></g>,
 ];
 return <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[stage]}</svg>;
}
