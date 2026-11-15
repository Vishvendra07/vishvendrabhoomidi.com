"use client";
import Link from "next/link";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="container not-found"><span className="mono accent">A MOMENTARY INTERRUPTION</span><h1>A handoff<br /><em>didn’t complete.</em></h1><p>Please try loading this page again.</p><button className="button button-primary" onClick={reset}>Try again</button><Link className="button" href="/">Return home</Link></div>;}
