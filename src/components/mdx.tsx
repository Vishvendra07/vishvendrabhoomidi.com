import Link from "next/link";
import type { ReactNode, ReactElement } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { codeToHtml, type BundledLanguage } from "shiki";
import { CopyButton } from "./copy-button";
import { PipelineDemo } from "./pipeline";
import { LatencyDemo } from "./latency";

async function CodeBlock({ children }: { children: ReactElement<{ children: string; className?: string }> }) {
  const code = children.props.children.trimEnd();
  const language = children.props.className?.replace("language-", "") || "text";
  let html: string;
  try { html = await codeToHtml(code, { lang:language as BundledLanguage, themes:{ light:"github-light", dark:"github-dark" }, defaultColor:false }); }
  catch { html = await codeToHtml(code, { lang:"text", themes:{ light:"github-light", dark:"github-dark" }, defaultColor:false }); }
  return <div className="code-block"><div className="code-toolbar"><span>{language}</span><CopyButton value={code} /></div><div dangerouslySetInnerHTML={{__html:html}} /></div>;
}
export async function Mdx({ source }: { source: string }) {
  const { content } = await compileMDX({ source, options:{ mdxOptions:{ remarkPlugins:[remarkGfm], rehypePlugins:[rehypeSlug] }, blockJS:true }, components:{
    pre: CodeBlock,
    Callout: ({ title, children }: { title:string; children:ReactNode }) => <aside className="callout"><strong>{title}</strong>{children}</aside>,
    PipelineDemo, LatencyDemo,
    a: ({ href = "", children }: { href?:string; children?:ReactNode }) => <Link href={href} {...(href.startsWith("https://") ? { target:"_blank", rel:"noopener noreferrer" } : {})}>{children}</Link>,
  } });
  return content;
}
