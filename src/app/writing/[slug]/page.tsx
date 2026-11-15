export const dynamicParams = false;
import {pageMetadata,absoluteUrl,socialImage,safeJsonLd} from '@/lib/seo';
import {RouteSchema} from '@/components/route-schema';
import { notFound } from "next/navigation";
import { getArticles } from "@/lib/content";
import { ArticlePage } from "@/components/article";
import { site } from "@/data/site";
export function generateStaticParams() { const articles=getArticles();return articles.length?articles.map(a => ({slug:a.slug})):[{slug:"unpublished"}]; }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; const article=getArticles().find(a=>a.slug===slug); return article ? pageMetadata(`/writing/${slug}`,article.title,article.description,article) : {}; }
export default async function WritingArticle({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const article=getArticles().find(a=>a.slug===slug); if (!article) notFound();
  const jsonLd={ "@context":"https://schema.org", "@type":"BlogPosting", headline:article.title, description:article.description, author:{"@type":"Person",name:site.name,url:absoluteUrl("/about"),"@id":absoluteUrl("/#person")},publisher:{"@id":absoluteUrl("/#person")},image:absoluteUrl(socialImage.url),mainEntityOfPage:absoluteUrl(`/writing/${slug}`),inLanguage:"en-US",keywords:article.tags,datePublished:article.publishedAt,dateModified:article.updatedAt||article.publishedAt,url:`${site.url}/writing/${slug}` };
  return <><RouteSchema path={`/writing/${slug}`} title={article.title} description={article.description}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(jsonLd)}} /><ArticlePage article={article} /></>;
}
