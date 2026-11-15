import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { getArticles, getProjects, getNotes } from "../src/lib/content";
import { publicRelease } from "../src/lib/release";
import { checkRelease } from "./release-check";
const require=createRequire(import.meta.url);
try {
  getArticles(true);getProjects();getNotes();
  if(publicRelease)checkRelease();
  const result=spawnSync(process.execPath,[require.resolve("next/dist/bin/next"),"build"],{stdio:"inherit",env:{...process.env,NEXT_TELEMETRY_DISABLED:"1"}});
  process.exitCode=result.status??1;
}catch(error){console.error(error instanceof Error?error.message:error);process.exitCode=1;}
