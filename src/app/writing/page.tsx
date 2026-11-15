import {pageMetadata} from '@/lib/seo';
import {RouteSchema} from '@/components/route-schema';
import type { Metadata } from "next";
import { PageIntro } from "@/components/ui";
import { WritingIndex } from "@/components/writing";
import { getArticles } from "@/lib/content";
export const metadata:Metadata=pageMetadata('/writing');
export default function Writing() { return <div className="container page-body"><RouteSchema path="/writing"/><PageIntro label="The notebook" title={<>Thinking through<br /><em>the things I build.</em></>}>Essays and notes on AI systems, engineering decisions, and the craft of making something useful.</PageIntro><WritingIndex articles={getArticles().map(a => ({slug:a.slug,title:a.title,description:a.description,tags:a.tags,publishedAt:a.publishedAt,readingTime:a.readingTime,featured:a.featured}))} /></div>; }
