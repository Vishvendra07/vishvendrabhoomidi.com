import Link from "next/link";
import { Mdx } from "./mdx";
import { ReaderTools } from "./reader-tools";
import { Breadcrumbs, TextLink } from "./ui";
import { headings, getArticles, type Article } from "@/lib/content";
import { site } from "@/data/site";

export function Toc({ body, mobile = false }: { body:string; mobile?:boolean }) {
  const links = headings(body);
  if (!links.length) return null;
  if (mobile) return <details className="mobile-toc"><summary>On this page</summary><nav aria-label="Article table of contents">{links.map(h => <a href={`#${h.id}`} key={h.id}>{h.title}</a>)}</nav></details>;
  return <nav className="toc" aria-label="Table of contents"><span className="mono">ON THIS PAGE</span>{links.map(h => <a href={`#${h.id}`} key={h.id}>{h.title}</a>)}</nav>;
}
export async function ArticlePage({ article, preview = false }: { article:Article; preview?:boolean }) {
  const published = getArticles(); const index = published.findIndex(a => a.slug === article.slug);
  const related = published.filter(a => a.slug !== article.slug && a.tags.some(t => article.tags.includes(t))).slice(0,3);
  return <div className="container page-body"><Breadcrumbs items={[{href:"/writing",title:"Writing"},{href:`/writing/${article.slug}`,title:preview ? "Draft preview" : article.title}]} />{preview && <div className="preview-banner">Unpublished draft · Local preview only · Not included in feeds, search, or production routes</div>}<header className="page-intro article-header"><div className="mono accent">{article.tags.join(" / ")}</div><h1>{article.title}</h1><div className="intro-copy">{article.description}</div><div className="article-meta"><span>{site.name}</span>{article.publishedAt && <time dateTime={article.publishedAt}>{article.publishedAt}</time>}{article.updatedAt && <span>Updated <time dateTime={article.updatedAt}>{article.updatedAt}</time></span>}<span>{article.readingTime} min read</span></div><div className="article-tools"><ReaderTools /></div></header><Toc body={article.body} mobile /><div className="article-layout"><article className="prose article-prose"><Mdx source={article.body} /></article><Toc body={article.body} /></div><section className="article-related"><div className="article-prev-next">{index > 0 && <TextLink href={`/writing/${published[index-1].slug}`}>Newer: {published[index-1].title}</TextLink>}{index >= 0 && index < published.length-1 && <TextLink href={`/writing/${published[index+1].slug}`}>Older: {published[index+1].title}</TextLink>}</div>{related.length > 0 && <><h2>Keep reading</h2>{related.map(a => <Link className="article-row" href={`/writing/${a.slug}`} key={a.slug}><h3>{a.title}</h3></Link>)}</>}<TextLink href="/work/kaarya-ai">Related work: Kaarya AI</TextLink><br /><br /><TextLink href="/lab/message-pipeline">Explore the message pipeline</TextLink></section></div>;
}
