export const dynamicParams = false;
import {pageMetadata} from '@/lib/seo';
import {RouteSchema} from '@/components/route-schema';
import { notFound } from "next/navigation";
import { labs } from "@/data/site";
import { Breadcrumbs, PageIntro, TextLink } from "@/components/ui";
import { PipelineDemo } from "@/components/pipeline";
import { LatencyDemo } from "@/components/latency";
export function generateStaticParams(){return labs.map(l=>({slug:l.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const l=labs.find(l=>l.slug===slug);return l?pageMetadata(`/lab/${slug}`,l.title,l.description):{};}
export default async function Experiment({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const l=labs.find(l=>l.slug===slug);if(!l)notFound();return <div className="container page-body"><RouteSchema path={`/lab/${slug}`} title={l.title} description={l.description}/><Breadcrumbs items={[{href:"/lab",title:"Lab"},{href:`/lab/${slug}`,title:l.title}]} /><PageIntro label={`Experiment ${l.number} / Educational model`} title={l.title}>{l.description}</PageIntro>{slug==="message-pipeline"?<><PipelineDemo headingLevel={2}/><div className="subsection" style={{marginTop:40}}><h2>The handoff is part of the system.</h2><p>This model shows a fixed sequence: message, understanding, retrieval/tools, then execution. Selecting a stage reveals its responsibility. Moving nodes changes only the diagram layout. Real systems may branch, retry, ask for clarification, or stop when authorization is missing.</p><p>No request is sent to an AI provider. There is no live telemetry or product benchmark behind this diagram.</p></div></>:<LatencyDemo/>}<div className="lab-links"><TextLink href={slug==="message-pipeline"?"/lab/latency-budget":"/lab/message-pipeline"}>Try the other experiment</TextLink><TextLink href="/work/kaarya-ai">Related work: Kaarya AI</TextLink></div></div>;}
