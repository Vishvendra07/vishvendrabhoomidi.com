import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {pages,site} from '../../src/data/site';

test.skip(process.env.STATIC_DEPLOYMENT!=='1','Run against a public static build with STATIC_DEPLOYMENT=1 and TEST_BASE_URL.');
test('exported routes are indexable and keep canonical/social URLs intact',async({page,request})=>{
 for(const entry of pages){const response=await page.goto(entry.href);expect(response?.status(),entry.href).toBe(200);expect(new URL((await page.locator('link[rel="canonical"]').getAttribute('href'))!).href).toBe(new URL(entry.href,site.url).href);expect(await page.locator('meta[name="robots"]').getAttribute('content')).not.toContain('noindex');await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',`${site.url}/media/social/vishvendra-meta.jpg`);}
 expect(await(await request.get('/robots.txt')).text()).toContain('Allow: /');
 for(const route of ['/not-a-page','/preview/activity','/preview/writing/designing-the-handoff','/writing/unpublished'])expect((await request.get(route)).status(),route).toBe(404);
});
test('new projects fit mobile, tablet and desktop in both themes',async({page})=>{
 for(const theme of ['dark','light'] as const){await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});for(const width of [360,390,768,1440]){await page.setViewportSize({width,height:900});for(const route of ['/work','/work/email-classifier','/work/bayesian-inference']){await page.goto(route);await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} ${width} ${theme}`).toBe(true);if(width===390||width===1440)await page.screenshot({path:`verification/screenshots/launch-${route.replaceAll('/','-')}-${width}-${theme}.png`,fullPage:true});}}}
});
test('new cases hydrate under the exported CSP and remain accessible',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(const route of ['/','/work/email-classifier','/work/bayesian-inference']){await page.goto(route);await page.getByRole('button',{name:'Toggle color theme'}).first().click();await page.waitForTimeout(300);expect(errors).toEqual([]);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);}
 expect(errors).toEqual([]);
});
