"use client";
import { useEffect, useState } from "react";
import { CopyButton } from "./copy-button";
export function ReaderTools() {
  const [progress,setProgress] = useState(0),[url,setUrl] = useState("");
  useEffect(() => {
    const update = () => { const article = document.querySelector<HTMLElement>(".article-prose"); if (!article) return; const top = article.getBoundingClientRect().top + window.scrollY; const height = Math.max(1, article.offsetHeight-window.innerHeight+160); setProgress(Math.max(0,Math.min(1,(window.scrollY-top+120)/height))); };
    update(); const frame=requestAnimationFrame(() => setUrl(window.location.href)); window.addEventListener("scroll",update,{passive:true}); window.addEventListener("resize",update); return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll",update); window.removeEventListener("resize",update); };
  },[]);
  return <><div className="reading-progress" style={{transform:`scaleX(${progress})`}} aria-hidden="true" /><CopyButton value={url} label="Copy article link" /></>;
}
