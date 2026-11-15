export const dynamic = "force-static";
import type { MetadataRoute } from "next";
import { pages } from "@/data/site";
import {absoluteUrl} from '@/lib/seo';
import { getArticles, getProjects } from "@/lib/content";
export default function sitemap():MetadataRoute.Sitemap{
 const articles=getArticles();const paths=[...pages.map(p=>p.href),...getProjects().map(p=>`/work/${p.slug}`),...articles.map(a=>`/writing/${a.slug}`)];
 return [...new Set(paths)].map(path=>{const article=articles.find(a=>path===`/writing/${a.slug}`);const modified=article?.updatedAt||article?.publishedAt;return {url:absoluteUrl(path),...(modified&&!Number.isNaN(Date.parse(modified))?{lastModified:modified}:{})};});
}
