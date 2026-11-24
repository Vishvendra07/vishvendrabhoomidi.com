import type {Metadata} from 'next';
import {site} from '@/data/site';
import {publicRelease} from './release';

export const socialImage={url:'/media/social/vishvendra-meta.jpg',width:1200,height:630,type:'image/jpeg',alt:'Vishvendra Reddy Bhoomidi — Founder, Engineer, Builder, Writer. AI systems, engineering, products and writing.'};
export const seoPages:Record<string,{title:string;description:string}>={
 '/':{title:'Vishvendra Reddy Bhoomidi | Founder & AI Engineer',description:'Vishvendra Reddy Bhoomidi, founder of Kaarya AI. Explore AI engineering, Python backends, full-stack products, projects, and engineering notes.'},
 '/about':{title:'About',description:'Meet Vishvendra Reddy Bhoomidi: Kaarya AI founder, AI engineer, and Michigan graduate. Explore his experience, education, and approach to building useful systems.'},
 '/work':{title:'Engineering Projects & Kaarya AI',description:'Explore Kaarya AI and 20 engineering demos by Vishvendra Bhoomidi: backend reliability, React products, AI evaluation, MCP tools, and customer integrations. Source, decisions, and evidence.'},
 '/writing':{title:'Writing on AI & Engineering',description:'Vishvendra Bhoomidi’s notebook on AI systems, software engineering, and building useful products. Published essays will appear here after editorial review.'},
 '/lab':{title:'Interactive Engineering Lab',description:'Explore interactive models of AI execution and voice latency. Follow message-to-action handoffs and experiment with sequential and parallel work.'},
 '/now':{title:'Now',description:'A dated update from Vishvendra Bhoomidi on building this personal website, connecting engineering work, and making space for thoughtful writing.'},
 '/stack':{title:'Technology Stack & Engineering Toolkit',description:'Explore Vishvendra Bhoomidi’s toolkit for AI, Python backends, React interfaces, data, infrastructure, and testing, with links to relevant project work.'},
 '/credits':{title:'Credits & Acknowledgments',description:'The design references, open-source tools, typography, original artwork, and brand attributions behind Vishvendra Bhoomidi’s personal website.'},
 '/contact':{title:'Contact Vishvendra Bhoomidi',description:'Connect with Vishvendra Bhoomidi about engineering opportunities, product ideas, and AI systems. Find email, LinkedIn, GitHub, X, and Instagram links.'},
 '/resume':{title:'Backend Engineer Résumé & Experience',description:'Download Vishvendra Bhoomidi’s backend engineering résumé. Explore Kaarya AI, professional experience, AI and computer science education, and technical skills.'},
 '/activity/methodology':{title:'Building Activity: Sources & Methodology',description:'How this website measures building activity: reviewed sources, daily totals, timezone coverage, missing data, privacy, and the limits of token counts.'},
};
export function absoluteUrl(path:string){return new URL(path,site.url).toString();}
export function pageMetadata(path:string,title?:string,description?:string,article?:{publishedAt?:string;updatedAt?:string;tags?:string[]}):Metadata{
 const entry=seoPages[path];const heading=title||entry?.title||site.name;const summary=description||entry?.description||site.description;
 const displayTitle=path==='/'?heading:`${heading} | Vishvendra Bhoomidi`;
 return {title:path==='/'?{absolute:heading}:heading,description:summary,alternates:{canonical:absoluteUrl(path),types:{'application/rss+xml':absoluteUrl('/rss.xml')}},
  openGraph:{type:article?'article':'website',locale:'en_US',siteName:site.name,url:absoluteUrl(path),title:displayTitle,description:summary,images:[{...socialImage,url:absoluteUrl(socialImage.url)}],...(article?{publishedTime:article.publishedAt,modifiedTime:article.updatedAt||article.publishedAt,authors:[absoluteUrl('/about')],tags:article.tags}: {})},
  twitter:{card:'summary_large_image',creator:'@VishvendraReddy',site:'@VishvendraReddy',title:displayTitle,description:summary,images:[{url:absoluteUrl(socialImage.url),alt:socialImage.alt}]},
 };
}
export function indexingMetadata(indexable=publicRelease):Metadata['robots']{return indexable?{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}}:{index:false,follow:false};}
export function verificationMetadata():Metadata['verification']{
 const google=process.env.GOOGLE_SITE_VERIFICATION?.trim();const bing=process.env.BING_SITE_VERIFICATION?.trim();const meta=process.env.META_DOMAIN_VERIFICATION?.trim();
 return {...(google?{google}:{}),other:{...(bing?{'msvalidate.01':bing}:{}),...(meta?{'facebook-domain-verification':meta}:{})}};
}
export function safeJsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c');}
export function identityGraph(){return {'@context':'https://schema.org','@graph':[
 {'@type':'Person','@id':absoluteUrl('/#person'),name:site.name,alternateName:'Vishvendra Bhoomidi',url:site.url,description:site.description,jobTitle:'Founder & AI engineer',sameAs:[site.contact.linkedin,site.contact.github,site.contact.x,site.contact.instagram].filter(Boolean),worksFor:{'@id':`${site.venture.url}/#organization`},alumniOf:[{'@type':'CollegeOrUniversity',name:'The Pennsylvania State University',url:'https://www.psu.edu/'},{'@type':'CollegeOrUniversity',name:'University of Michigan–Dearborn',url:'https://umdearborn.edu/'}]},
 {'@type':'Organization','@id':`${site.venture.url}/#organization`,name:site.venture.name,url:site.venture.url,founder:{'@id':absoluteUrl('/#person')}},
 {'@type':'WebSite','@id':absoluteUrl('/#website'),url:site.url,name:site.name,alternateName:'Vishvendra Bhoomidi',description:site.description,inLanguage:'en-US',publisher:{'@id':absoluteUrl('/#person')}},
 ]};}
export function routeGraph(path:string,title?:string,description?:string){
 const entry=seoPages[path];const heading=title||entry?.title||site.name;const url=absoluteUrl(path);
 const crumbs=[{name:'Home',url:absoluteUrl('/')}];
 const section=path.split('/')[1];if(path.split('/').filter(Boolean).length>1&&['work','writing','lab'].includes(section))crumbs.push({name:section[0].toUpperCase()+section.slice(1),url:absoluteUrl(`/${section}`)});
 if(path!=='/')crumbs.push({name:heading,url});
 const page={'@type':path==='/about'?'ProfilePage':path==='/contact'?'ContactPage':['/work','/writing','/lab'].includes(path)?'CollectionPage':'WebPage','@id':`${url}#webpage`,url,name:heading,description:description||entry?.description||site.description,isPartOf:{'@id':absoluteUrl('/#website')},inLanguage:'en-US',...(path==='/about'?{mainEntity:{'@id':absoluteUrl('/#person')}}:{about:{'@id':absoluteUrl('/#person')}}),...(path!=='/'?{breadcrumb:{'@id':`${url}#breadcrumb`}}:{})};
 return {'@context':'https://schema.org','@graph':[page,...(path==='/'?[]:[{'@type':'BreadcrumbList','@id':`${url}#breadcrumb`,itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,item:c.url}))}])]};
}
