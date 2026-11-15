import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, Footer } from "@/components/shell";
import { getArticles, getNotes, getProjects } from "@/lib/content";
import { pages, site } from "@/data/site";
import {pageMetadata,indexingMetadata,verificationMetadata,identityGraph,safeJsonLd} from "@/lib/seo";
import { MotionChoreography } from "@/components/motion-control";
import { SocialLinks } from "@/components/social-links";
import { SignalSky } from "@/components/signal-sky";
import "./globals.css";

const GeistSans=Geist({subsets:["latin"],variable:"--font-geist-sans",display:"optional"});
const GeistMono=Geist_Mono({subsets:["latin"],variable:"--font-geist-mono",display:"optional",preload:false});

export const metadata: Metadata = {
  ...pageMetadata('/'), metadataBase:new URL(site.url),
  title:{default:'Vishvendra Reddy Bhoomidi | Founder & AI Engineer',template:'%s | Vishvendra Bhoomidi'},
  applicationName:site.name,authors:[{name:site.name,url:site.url}],creator:site.name,publisher:site.name,
  category:'technology',referrer:'strict-origin-when-cross-origin',formatDetection:{telephone:false},
  robots:indexingMetadata(),verification:verificationMetadata(),manifest:'/manifest.webmanifest',
  alternates:{types:{'application/rss+xml':'/rss.xml'}},
};
export const viewport:Viewport={width:'device-width',initialScale:1,colorScheme:'light dark',themeColor:[{media:'(prefers-color-scheme: light)',color:'#f5f2eb'},{media:'(prefers-color-scheme: dark)',color:'#111217'}]};
const themeScript = `try{document.documentElement.dataset.motion=localStorage.getItem('motion')||'auto';const t=localStorage.getItem('theme');const m=window.matchMedia('(prefers-color-scheme: dark)');function apply(){document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:(m.matches?'dark':'light')}apply();m.addEventListener('change',()=>{const c=localStorage.getItem('theme');if(c!=='dark'&&c!=='light')document.documentElement.dataset.theme=m.matches?'dark':'light'})}catch(e){}`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const articles = getArticles(); getProjects(); getNotes();
  const entries = [...pages, ...articles.map(a => ({ href: `/writing/${a.slug}`, title:a.title, description:a.description, type:"Article" }))];
  const identity=identityGraph();
  return <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><SignalSky/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(identity)}}/><Header entries={entries} /><main id="main" tabIndex={-1}>{children}</main><Footer socials={<SocialLinks compact/>}/><MotionChoreography/></body></html>;
}
