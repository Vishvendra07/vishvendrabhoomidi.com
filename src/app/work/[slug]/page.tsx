export const dynamicParams = false;
import {pageMetadata} from '@/lib/seo';
import {RouteSchema} from '@/components/route-schema';
import { notFound } from "next/navigation";
import { getProjects } from "@/lib/content";
import { Mdx } from "@/components/mdx";
import { Toc } from "@/components/article";
import { Breadcrumbs, PageIntro, TextLink } from "@/components/ui";
import {ProjectArt} from "@/components/project-art";
import { site } from "@/data/site";
import {ProjectCollection} from "@/components/project-collection";
export function generateStaticParams(){return getProjects().map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=getProjects().find(p=>p.slug===slug);return p?pageMetadata(`/work/${slug}`,p.title,p.description):{};}
export default async function Project({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const projects=getProjects(),p=projects.find(p=>p.slug===slug);if(!p)notFound();return <div className="container page-body case-study"><RouteSchema path={`/work/${slug}`} title={p.title} description={p.description}/><Breadcrumbs items={[{href:"/work",title:"Work"},{href:`/work/${p.slug}`,title:p.title}]} /><PageIntro label={`${p.category} / Case study`} title={<>{p.title}<br /><em>{p.subtitle}</em></>}>{p.description}</PageIntro><div className="project-hero"><dl className="project-meta"><div><dt>Role</dt><dd>{p.role}</dd></div><div><dt>Context</dt><dd>{p.context}</dd></div><div><dt>Tools</dt><dd>{p.technologies.join(" · ")}</dd></div><div><dt>Scope</dt><dd>{p.period||p.category}</dd></div></dl><div><ProjectArt slug={p.slug}/></div></div>{p.proof&&<p className="case-proof">{p.proof}<span>Recorded local demo · source and evidence below</span></p>}<div className="project-links">{p.slug==="kaarya-ai"?<><TextLink href={site.venture.url} external>Visit Kaarya AI</TextLink><TextLink href="/lab/message-pipeline">Explore the pipeline model</TextLink></>:p.repository?<TextLink href={p.repository} external>View the repository</TextLink>:null}{p.evidence&&<TextLink href={p.evidence} external>Inspect demo evidence</TextLink>}<TextLink href="/work#collection">All engineering projects</TextLink></div>{slug==='open-source-engineering'?<ProjectCollection projects={projects.filter(p=>p.collection==='engineering').map(({slug,title,description,family,technologies,repository,proof})=>({slug,title,description,family,technologies,repository,proof}))}/>:<><Toc body={p.body} mobile /><div className="article-layout"><article className="prose"><Mdx source={p.body} /></article><Toc body={p.body} /></div></>}</div>;}
