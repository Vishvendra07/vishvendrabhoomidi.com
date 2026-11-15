import {afterAll,beforeAll,describe,expect,it} from "vitest";
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
const root=process.cwd(),scratch=path.resolve(root,".private/test-work");let directory:string;
const raw={version:1,timezone:"America/Detroit",coverage:{start:"2026-11-01",end:"2026-11-02",complete:false},records:[{date:"2026-11-01",provider:"CLI fixture",inputTokens:10,outputTokens:20,totalTokens:30}]};
function run(args:string[]){return spawnSync(process.execPath,[path.join(root,"node_modules/tsx/dist/cli.mjs"),path.join(root,"scripts/import-activity.ts"),...args],{cwd:directory,encoding:"utf8"});}
beforeAll(()=>{fs.mkdirSync(scratch,{recursive:true});directory=fs.mkdtempSync(path.join(scratch,"import-test-"));fs.mkdirSync(path.join(directory,"src/data"),{recursive:true});fs.mkdirSync(path.join(directory,".private"));fs.writeFileSync(path.join(directory,".private/usage.json"),JSON.stringify(raw));});
afterAll(()=>{if(!directory)return;const resolved=path.resolve(directory);if(!resolved.startsWith(scratch+path.sep))throw new Error("Scratch path escaped workspace");fs.rmSync(resolved,{recursive:true,force:true});});
describe("local import CLI",()=>{
  it("validates without writing and requires review before publishing",()=>{const result=run(["--input",".private/usage.json","--dry-run"]);expect(result.status,result.stderr).toBe(0);expect(fs.existsSync(path.join(directory,"src/data/activity.json"))).toBe(false);expect(run(["--input",".private/usage.json"]).status).toBe(1);});
  it("atomically replaces reviewed aggregates without copying raw breakdowns",()=>{const first=run(["--input",".private/usage.json","--reviewed"]);expect(first.status,first.stderr).toBe(0);const output=path.join(directory,"src/data/activity.json");const a=JSON.parse(fs.readFileSync(output,"utf8"));expect(a.days.map((d:{count:number|null})=>d.count)).toEqual([30,null]);expect(a.metadata.verified).toBe(true);expect(fs.readFileSync(output,"utf8")).not.toContain("inputTokens");expect(run(["--input",".private/usage.json","--reviewed"]).status).toBe(0);expect(JSON.parse(fs.readFileSync(output,"utf8")).days).toEqual(a.days);expect(fs.existsSync(output+".tmp")).toBe(false);});
  it("rejects input stored in public assets",()=>{fs.mkdirSync(path.join(directory,"public"));fs.writeFileSync(path.join(directory,"public/usage.json"),JSON.stringify(raw));expect(run(["--input","public/usage.json","--reviewed"]).stderr).toContain("must not be stored under public");});
});
