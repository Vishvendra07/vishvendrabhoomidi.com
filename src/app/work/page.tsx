import {pageMetadata} from '@/lib/seo';
import {RouteSchema} from '@/components/route-schema';
import type {Metadata} from "next";
import {PageIntro,TextLink} from "@/components/ui";
import {KaaryaArt,ProjectCards} from "@/components/project-art";
import {getProjects} from "@/lib/content";
export const metadata:Metadata=pageMetadata('/work');
export default function Work(){const projects=getProjects(),p=projects[0];return <div className="container page-body"><RouteSchema path="/work"/><PageIntro label="Selected work" title={<>Intelligence is useful<br/>when it <em>goes somewhere.</em></>}>From a founder venture to applied AI and a team-built storefront. The problem, the engineering decisions, and the boundaries of each project.</PageIntro><section className="work-index-feature"><div className="venture-feature"><KaaryaArt/><div><span className="mono accent">FOUNDER VENTURE / AUG 2025 — PRESENT</span><h2>{p.title}</h2><p>{p.description}</p><div className="tag-list">{p.technologies.map(t=><span key={t}>{t}</span>)}</div><TextLink href={`/work/${p.slug}`}>Read the case study</TextLink></div></div></section><ProjectCards projects={projects.slice(1)}/><p className="work-index-note">Different settings, different responsibilities. Each case study explains my role, the project context, and what the available evidence can support.</p><TextLink href="/lab">Explore engineering concepts in the Lab</TextLink></div>;}
