import type {CSSProperties} from 'react';
import Image from 'next/image';
export function UniversityMark({school}:{school:'michigan'|'penn-state'}){return <span className={`university-mark university-${school}`}><Image src={`/marks/${school}.${school==='michigan'?'png':'svg'}`} width={48} height={48} alt=""/></span>;}
export function BrandIcon({name,className='',color}:{name:string;className?:string;color?:string}) {
  return <span className={`brand-icon brand-${name} ${className}`} aria-hidden="true" style={color?{'--brand-color':color} as CSSProperties:undefined}><span style={{maskImage:`url(/marks/${name}.svg)`,WebkitMaskImage:`url(/marks/${name}.svg)`}}/></span>;
}
export function KaaryaMark({small=false}:{small?:boolean}){return <span className={`kaarya-mark ${small?'kaarya-mark-small':''}`}><span className="brand-orbit brand-orbit-one"/><span className="brand-orbit brand-orbit-two"/><span className="brand-spark spark-one"/><span className="brand-spark spark-two"/><span className="brand-logo"><Image src="/media/kaarya-symbol.png" alt={small?"":"Kaarya AI"} width={small?48:128} height={small?48:128} className="kaarya-logo-image"/></span></span>;}
