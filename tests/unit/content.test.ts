import { describe,it,expect } from "vitest";
import { getArticles,getProjects,articleSchema,xmlEscape } from "../../src/lib/content";
import { latencyBudget } from "../../src/lib/latency";
import { checkRelease } from "../../scripts/release-check";
describe("content and release boundaries",()=>{
  it("does not publish the unapproved essay",()=>{expect(getArticles()).toHaveLength(0);});
  it("publishes 20 evidence-linked demos with six curated starting points",()=>{
    const projects=getProjects(),demos=projects.filter(p=>p.collection==='engineering');
    expect(projects[0].slug).toBe('kaarya-ai');
    expect(demos).toHaveLength(20);
    expect(demos.filter(p=>p.featured).map(p=>p.slug)).toEqual(['event-relay','workflow-desk','implementation-kit','postgres-cdc-projection','mcp-approval-demo','intake-evals']);
    for(const p of demos){expect(p.evidence).toMatch(/^https:\/\/github.com\/Vishvendra07\//);expect(p.repository).toBe(`https://github.com/Vishvendra07/${p.slug}`);expect(p.body).toContain('## Scope and tradeoffs');}
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
