import { notFound } from "next/navigation";
import { getArticles } from "@/lib/content";
import { ArticlePage } from "@/components/article";
export const dynamic="force-static";
export const dynamicParams=false;
export function generateStaticParams(){const articles=getArticles(true);return articles.length?articles.map(a=>({slug:a.slug})):[{slug:"unpublished"}];}
export default async function Preview({params}:{params:Promise<{slug:string}>}) { if (process.env.NODE_ENV !== "development") notFound(); const {slug}=await params; const article=getArticles(true).find(a=>a.slug===slug); if(!article) notFound(); return <ArticlePage article={article} preview />; }
