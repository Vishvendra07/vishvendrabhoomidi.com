import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import { site } from "@/data/site";
export function TextLink({ href, children, external = false, className = "" }: { href: string; children: ReactNode; external?: boolean; className?: string }) {
  return <Link href={href} className={`text-link ${className}`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}<Icon name={external ? "external" : "arrow"} /></Link>;
}
export function SectionLabel({ number, children }: { number?: string; children: ReactNode }) { return <div className="section-label">{number && <span>{number}</span>}{children}</div>; }
export function PageIntro({ label, title, children }: { label: string; title: ReactNode; children?: ReactNode }) {
  return <header className="page-intro"><div className="mono muted">{label}</div><h1>{title}</h1>{children && <div className="intro-copy">{children}</div>}</header>;
}
export function EmptyState({ title, children, href, link }: { title: string; children: ReactNode; href?: string; link?: string }) {
  return <div className="empty-state"><span className="empty-orbit" aria-hidden="true"><span /></span><div><h3>{title}</h3><p>{children}</p>{href && <TextLink href={href}>{link || "Learn more"}</TextLink>}</div></div>;
}
export function Breadcrumbs({ items }: { items: { href: string; title: string }[] }) {
  const data={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{href:"/",title:"Home"},...items].map((item,i)=>({"@type":"ListItem",position:i+1,name:item.title,item:`${site.url}${item.href}`}))};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/><nav aria-label="Breadcrumb" className="breadcrumbs"><Link href="/">Home</Link>{items.map((item,i) => <span key={item.href}><span aria-hidden="true">/</span><Link href={item.href} aria-current={i === items.length - 1 ? "page" : undefined}>{item.title}</Link></span>)}</nav></>;
}
