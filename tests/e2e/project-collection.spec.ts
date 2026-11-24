import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {getProjects} from '../../src/lib/content';
import path from 'node:path';
const demos=getProjects().filter(p=>p.collection==='engineering');
test('recruiters can filter, search, recover and open a project',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/work');
 await expect(page.locator('.collection-row')).toHaveCount(20);
 await page.getByRole('button',{name:'Backend',exact:true}).click();
 await expect(page.locator('.collection-row')).toHaveCount(6);
 await expect(page.getByRole('status')).toContainText('6 projects in Backend');
 await page.getByRole('button',{name:'All',exact:true}).click();
 await page.getByRole('searchbox',{name:'Search projects'}).fill('pgvector');
 await expect(page.locator('.collection-row')).toHaveCount(1);
 await expect(page.locator('.collection-row h3')).toHaveText('Tenant Search Benchmark');
 await page.getByRole('searchbox',{name:'Search projects'}).fill('no-result-example');
 await expect(page.getByRole('heading',{name:'No projects match this search.'})).toBeVisible();
 await page.getByRole('button',{name:'Clear filters'}).click();
 await expect(page.locator('.collection-row')).toHaveCount(20);
 await page.locator('.collection-row').filter({has:page.getByRole('heading',{name:'Postgres CDC Projection',exact:true})}).locator('.collection-case').click();
 await expect(page).toHaveURL(/\/work\/postgres-cdc-projection$/);
 await expect(page.getByRole('heading',{name:'What you can verify',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Inspect demo evidence',exact:true})).toHaveAttribute('href',/postgres-cdc-projection\/blob\/main\/evidence\/demo.json/);
 expect(errors).toEqual([]);
});
test('every demo has a complete static page, specific diagram and canonical URL',async({page})=>{
 for(const p of demos){
  const response=await page.goto(`/work/${p.slug}`);expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText(p.title);
  await expect(page.locator('.engineering-art')).toHaveCount(1);
  await expect(page.locator('.commerce-art')).toHaveCount(0);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',`https://vishvendrabhoomidi.com/work/${p.slug}`);
  await expect(page.locator('.project-links').getByRole('link',{name:'View the repository'})).toHaveAttribute('href',p.repository!);
 }
});
test('the collection and case diagrams remain readable across themes and widths',async({page})=>{
 for(const theme of ['dark','light'] as const){
  await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  for(const width of [360,390,768,1440]){
   await page.setViewportSize({width,height:960});
   for(const route of ['/work','/work/event-relay','/work/workflow-desk','/work/implementation-kit','/work/intake-evals']){
    await page.goto(route);await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route}, ${width}, ${theme}`).toBe(true);
    if(route==='/work'&&[390,1440].includes(width)){
     await page.getByRole('link',{name:'Start with selected projects ↓'}).click();
     await expect(page.locator('#selected')).toBeInViewport();
     await page.screenshot({path:path.resolve(`../project-gallery/selected-${width}-${theme}.png`)});
    }
   }
  }
 }
});
test('work and a new case study have no serious accessibility violations',async({page})=>{
 for(const route of ['/work','/work/mcp-approval-demo']){
  await page.goto(route);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
});
test('diagram motion respects pause and reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/work');
 const diagram=page.locator('.art-event-relay');await diagram.scrollIntoViewIfNeeded();
 const pulse=diagram.locator('.engineering-travel');await expect(pulse).toHaveCSS('animation-play-state','running');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(pulse).toHaveCSS('animation-name','none');
 await page.emulateMedia({reducedMotion:'no-preference'});await expect(pulse).toHaveCSS('animation-name','engineering-delivery');
 await page.getByRole('button',{name:'Pause animations',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-motion','off');await diagram.scrollIntoViewIfNeeded();
 await expect(pulse).toHaveCSS('animation-play-state','paused');
 await page.getByRole('button',{name:'Enable animations',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-motion','on');await diagram.scrollIntoViewIfNeeded();
 await expect(pulse).toHaveCSS('animation-play-state','running');
 await page.emulateMedia({reducedMotion:'reduce'});
 // An explicit user choice may enable motion even when the OS requests reduction.
 await expect(pulse).not.toHaveCSS('animation-name','none');
});
