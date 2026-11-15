import {pageMetadata} from '@/lib/seo';
import {RouteSchema} from '@/components/route-schema';
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { Icon } from "@/components/icons";
import {LabPreview} from "@/components/lab-preview";
import { labs } from "@/data/site";
export const metadata:Metadata=pageMetadata('/lab');
export default function Lab(){return <div className="container page-body"><RouteSchema path="/lab"/><PageIntro label="The Lab" title={<>Small experiments.<br /><em>Useful intuitions.</em></>}>A place to pull systems apart, move the pieces, and see what changes. Educational models, with their assumptions in the open.</PageIntro><div className="lab-grid">{labs.map(l=><Link className={`lab-card ${l.color}`} href={`/lab/${l.slug}`} key={l.slug}><span className="mono muted">EXPERIMENT {l.number}</span><LabPreview kind={l.slug === "message-pipeline" ? "pipeline" : "latency"}/><div className="lab-card-title"><h2 style={{fontSize:26}}>{l.title}</h2><Icon name="external" /></div><p>{l.description}</p><span className="mono lab-tags">{l.tags}</span></Link>)}</div></div>;}
