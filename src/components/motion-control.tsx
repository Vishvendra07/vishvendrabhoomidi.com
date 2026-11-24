"use client";
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
export function useMotionEnabled(){const [enabled,setEnabled]=useState(false);useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{const choice=document.documentElement.dataset.motion||'auto';setEnabled(choice==='on'||(choice!=='off'&&!media.matches));};update();window.addEventListener('site-motion-change',update);media.addEventListener('change',update);return()=>{window.removeEventListener('site-motion-change',update);media.removeEventListener('change',update);};},[]);return enabled;}
export function MotionToggle(){const enabled=useMotionEnabled();return <button className="icon-button motion-toggle" aria-label={enabled?'Pause animations':'Enable animations'} title={enabled?'Pause animations':'Enable animations'} onClick={()=>{const next=enabled?'off':'on';document.documentElement.dataset.motion=next;try{localStorage.setItem('motion',next);}catch{}window.dispatchEvent(new Event('site-motion-change'));}}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/>{enabled?<><path d="M9 8v8M15 8v8"/></>:<path d="m10 8 6 4-6 4Z"/>}</svg></button>;}
// Pause decorative scenes outside the viewport; structural content never translates or fades.
export function MotionChoreography(){
 const pathname=usePathname();
 useEffect(()=>{
  const sky=document.querySelector<HTMLElement>('.signal-sky');
  const visibility=()=>{if(sky)sky.dataset.hidden=String(document.hidden);document.documentElement.dataset.pageHidden=String(document.hidden);};
  visibility();document.addEventListener('visibilitychange',visibility);
  const scenes=document.querySelectorAll<HTMLElement>('.brand-stage,.project-illustration,.toolkit-constellation,.lab-preview,.pipeline-canvas');
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('motion-outside',!entry.isIntersecting);},{rootMargin:'80px'});
  scenes.forEach(scene=>observer.observe(scene));
  return()=>{document.removeEventListener('visibilitychange',visibility);observer.disconnect();scenes.forEach(scene=>scene.classList.remove('motion-outside'));};
 },[pathname]);return null;
}
