import {test,expect} from '@playwright/test';
test('static artwork paints below the fold and has a no-JavaScript fallback',async({page,browser})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/about');
 const art=page.locator('.signal-sculpture');expect((await art.boundingBox())!.y).toBeGreaterThan(844);
 await expect(art).toHaveAttribute('data-painted','true');
 expect(await art.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0))).toBe(true);
 const staticContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const staticPage=await staticContext.newPage();await staticPage.goto('/');await expect(staticPage.locator('.sculpture-fallback')).toBeVisible();expect(await staticPage.locator('.sculpture-fallback path').count()).toBeGreaterThan(5);await staticContext.close();
});
test('tablet hero actions and case typography preserve a deliberate hierarchy',async({page})=>{
 for(const width of [768,820]){await page.setViewportSize({width,height:900});await page.goto('/');const actions=await page.locator('.hero-actions>a').all();const a=(await actions[0].boundingBox())!,b=(await actions[1].boundingBox())!;expect(Math.abs((a.y+a.height/2)-(b.y+b.height/2))).toBeLessThan(3);}
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.goto('/work/eatfit');expect(await page.locator('.case-study h1').evaluate(h=>parseFloat(getComputedStyle(h.querySelector('em')!).fontSize)<parseFloat(getComputedStyle(h).fontSize))).toBe(true);await page.goto('/credits');expect(await page.getByRole('heading',{name:'Acknowledgments'}).evaluate(h=>h.scrollWidth<=h.clientWidth+1)).toBe(true);}
});
