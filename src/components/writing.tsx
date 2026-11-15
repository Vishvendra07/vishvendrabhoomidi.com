"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "./icons";
import { EmptyState } from "./ui";
type Entry = { slug: string; title: string; description: string; tags: string[]; publishedAt?: string; readingTime: number; featured: boolean };
export function WritingIndex({ articles }: { articles: Entry[] }) {
  const [query,setQuery] = useState(""),[tag,setTag] = useState("All");
  const tags = ["All", ...new Set(articles.flatMap(a => a.tags))];
  const filtered = articles.filter(a => (tag === "All" || a.tags.includes(tag)) && `${a.title} ${a.description} ${a.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const featured = filtered.find(a => a.featured);
  return <><div className="writing-controls"><div className="tag-filters" aria-label="Filter writing by topic">{tags.map(t => <button key={t} aria-pressed={tag === t} onClick={() => setTag(t)}>{t}</button>)}</div><input className="writing-search" type="search" aria-label="Search published writing" value={query} placeholder="Search the notebook…" onChange={e => setQuery(e.target.value)} /></div>
    {filtered.length ? <>{featured && <Link href={`/writing/${featured.slug}`} className="featured-article" style={{display:"block"}}><span className="mono accent">FEATURED ESSAY</span><h2>{featured.title}</h2><p>{featured.description}</p><span className="text-link">Read the essay <Icon name="arrow" /></span></Link>}{filtered.filter(a => a !== featured).map(a => <Link href={`/writing/${a.slug}`} className="article-row" key={a.slug}><span className="mono muted">{a.publishedAt}</span><h3>{a.title}</h3><span className="mono muted">{a.readingTime} MIN READ</span><Icon name="arrow" /></Link>)}</> : <EmptyState title={articles.length ? "No essays match that search." : "The notebook is open."} href="/lab" link="Explore the Lab">{articles.length ? "Try a different topic or search term." : "Writing on AI systems, engineering decisions, and building useful things is being prepared. Essays will appear here after editorial review."}</EmptyState>}
    <p className="work-index-note">Prefer a feed? <a className="text-link" href="/rss.xml">Subscribe via RSS <Icon name="feed" width="14" height="14" /></a></p>
  </>;
}
