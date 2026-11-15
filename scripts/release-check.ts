import readiness from "../src/data/release.json";
import { getArticles } from "../src/lib/content";
import { site } from "../src/data/site";
import {resolveSiteOrigin} from '../src/lib/site-origin';
export function checkRelease() {
  const missing = Object.entries(readiness).filter(([,approved]) => !approved).map(([key]) => key);
  if (!getArticles().length && !readiness.writingEmptyStateApproved) missing.push("an approved writing empty state or published article");
  if (!site.contact.email && !Object.values(site.contact).some(Boolean)) missing.push("an approved personal contact method");
  try { resolveSiteOrigin(site.url,true); } catch { missing.push("a real HTTPS canonical origin"); }
  if(missing.length) throw new Error(`Public release blocked:\n${missing.map(m=>` - ${m}`).join("\n")}`);
  return true;
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/release-check.ts")){try{checkRelease();console.log("Public release content checks passed. Owner authorized publication and hosting setup on 2026-11-15.");}catch(error){console.error(error instanceof Error?error.message:error);process.exitCode=1;}}
