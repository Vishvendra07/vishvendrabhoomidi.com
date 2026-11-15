import {site} from '../../src/data/site';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {resolveSiteOrigin} from '../../src/lib/site-origin';
import {pageMetadata,identityGraph,routeGraph,safeJsonLd,indexingMetadata,verificationMetadata} from '../../src/lib/seo';

const origin=site.url;
afterEach(()=>vi.unstubAllEnvs());
describe('canonical origin and structured metadata',()=>{
 it('normalizes a root origin and rejects unsafe or placeholder public configuration',()=>{
  expect(resolveSiteOrigin(' https://portfolio.vishvendra.dev/ ',true)).toBe('https://portfolio.vishvendra.dev');
  expect(resolveSiteOrigin(undefined)).toBe('http://localhost:3000');
  for(const input of [undefined,'http://portfolio.vishvendra.dev','https://localhost','https://127.0.0.1','https://192.168.1.2','https://example.com','https://preview.example.org','https://portfolio.test','https://me:secret@portfolio.vishvendra.dev','https://portfolio.vishvendra.dev/profile','https://portfolio.vishvendra.dev/?utm=x','https://portfolio.vishvendra.dev/#home'])expect(()=>resolveSiteOrigin(input,true),input).toThrow();
 });
 it('keeps each page canonical, social URL and title synchronized',()=>{
  const m=pageMetadata('/work/kaarya-ai','Kaarya AI','An execution platform for service businesses.');
  expect(m.alternates?.canonical).toBe(`${origin}/work/kaarya-ai`);
  expect(m.openGraph).toMatchObject({url:m.alternates?.canonical,title:'Kaarya AI | Vishvendra Bhoomidi',images:[{width:1200,height:630,type:'image/jpeg',url:`${origin}/media/social/vishvendra-meta.jpg`}]});
  expect(m.twitter).toMatchObject({creator:'@VishvendraReddy',card:'summary_large_image',title:'Kaarya AI | Vishvendra Bhoomidi'});
 });
 it('uses article metadata only for real published article fields',()=>{
  expect(pageMetadata('/writing/example','Example','An essay.',{publishedAt:'2026-11-15',tags:['Engineering']}).openGraph).toMatchObject({type:'article',publishedTime:'2026-11-15',tags:['Engineering']});
  expect(pageMetadata('/writing').openGraph).toMatchObject({type:'website'});
 });
 it('keeps previews noindex and provides an explicit public indexing policy',()=>{
  expect(indexingMetadata(false)).toEqual({index:false,follow:false});
  expect(indexingMetadata(true)).toMatchObject({index:true,follow:true,googleBot:{'max-image-preview':'large'}});
 });
 it('emits ownership tags only when actual tokens are configured',()=>{
  vi.stubEnv('GOOGLE_SITE_VERIFICATION','');vi.stubEnv('BING_SITE_VERIFICATION','');vi.stubEnv('META_DOMAIN_VERIFICATION','');expect(verificationMetadata()).toEqual({other:{}});
  vi.stubEnv('GOOGLE_SITE_VERIFICATION','google-test-token');vi.stubEnv('BING_SITE_VERIFICATION','bing-test-token');vi.stubEnv('META_DOMAIN_VERIFICATION','meta-test-token');expect(verificationMetadata()).toEqual({google:'google-test-token',other:{'msvalidate.01':'bing-test-token','facebook-domain-verification':'meta-test-token'}});
 });
 it('connects the personal website, owner and supplied social identities',()=>{
  const graph=identityGraph()['@graph'];expect(graph.find(n=>n['@type']==='Person')).toMatchObject({sameAs:expect.arrayContaining(['https://x.com/VishvendraReddy','https://www.instagram.com/vishvendrabhoomidi/'])});
  expect(graph.find(n=>n['@type']==='WebSite')).toBeTruthy();expect(routeGraph('/about')['@graph'][0]).toMatchObject({'@type':'ProfilePage',mainEntity:{'@id':`${origin}/#person`}});
 });
 it('only links existing breadcrumb ancestors and safely encodes JSON-LD',()=>{
  const graph=routeGraph('/activity/methodology')['@graph'];const crumbs=graph[1] as {itemListElement:{item:string}[]};expect(crumbs.itemListElement.map(x=>x.item)).toEqual([`${origin}/`,`${origin}/activity/methodology`]);
  expect(routeGraph('/lab/message-pipeline')['@graph'][1]).toMatchObject({itemListElement:[{position:1},{position:2,item:`${origin}/lab`},{position:3}]});
  const value={text:'</script><script>alert(1)</script>'};const encoded=safeJsonLd(value);expect(encoded).not.toContain('<');expect(JSON.parse(encoded)).toEqual(value);
 });
});
