import { describe,it,expect } from "vitest";
import { getArticles,getProjects,articleSchema,xmlEscape } from "../../src/lib/content";
import { latencyBudget } from "../../src/lib/latency";
import { checkRelease } from "../../scripts/release-check";
describe("content and release boundaries",()=>{
  it("does not publish the unapproved essay",()=>{expect(getArticles()).toHaveLength(0);});
  it("leads with Kaarya and the engineering demos index",()=>{
    expect(getProjects().map(project=>project.slug)).toEqual([
      "kaarya-ai","open-source-engineering","nutrilens-ai","eatfit","email-classifier",
      "bayesian-inference","workflow-desk","intake-evals","event-relay","implementation-kit",
    ]);
  });
  it("requires a publication date",()=>expect(()=>articleSchema.parse({slug:"a",title:"A",description:"A",draft:false})).toThrow());
  it("escapes feed content",()=>expect(xmlEscape('<a & "b">')).toBe("&lt;a &amp; &quot;b&quot;&gt;"));
  it("permits the owner-authorized release with an honest writing empty state",()=>expect(checkRelease()).toBe(true));
});
describe("latency model",()=>{
  it("calculates critical path and independent overlap",()=>expect(latencyBudget({stt:400,retrieval:300,llm:800,tts:250})).toEqual({sequential:1750,parallel:1450,saved:300}));
  it("supports zero work and the other dominant branch",()=>{expect(latencyBudget({stt:0,retrieval:0,llm:0,tts:0}).parallel).toBe(0);expect(latencyBudget({stt:50,retrieval:400,llm:100,tts:50}).parallel).toBe(550);});
  it("rejects invalid timing",()=>expect(()=>latencyBudget({stt:-1,retrieval:0,llm:0,tts:0})).toThrow());
});
