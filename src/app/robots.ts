export const dynamic = "force-static";
import type { MetadataRoute } from "next";
import { publicRelease } from "@/lib/release";
import { site } from "@/data/site";
export default function robots():MetadataRoute.Robots{return publicRelease?{rules:{userAgent:"*",allow:"/",disallow:"/preview/"},sitemap:`${site.url}/sitemap.xml`}:{rules:{userAgent:"*",disallow:"/"}};}
