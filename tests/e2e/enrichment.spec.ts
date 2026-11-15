import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('living visuals animate, pause persistently, and respect reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
 await expect(page.getByRole('button',{name:'Pause animations',exact:true})).toBeVisible();
 const pixels=()=>page.locator('canvas.sculpture-canvas').evaluate((c:HTMLCanvasElement)=>c.toDataURL());
 const initial=await pixels();await expect.poll(pixels).not.toBe(initial);
 await page.getByRole('button',{name:'Pause animations',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-motion','off');await page.waitForTimeout(200);const paused=await pixels();await page.waitForTimeout(250);expect(await pixels()).toBe(paused);
 await page.getByRole('button',{name:'Toggle color theme'}).first().click();await expect.poll(pixels).not.toBe(paused);
 await page.reload();await expect(page.getByRole('button',{name:'Enable animations',exact:true})).toBeVisible();
 await page.evaluate(()=>localStorage.removeItem('motion'));await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect(page.getByRole('button',{name:'Enable animations',exact:true})).toBeVisible();await page.waitForTimeout(200);const reduced=await pixels();await page.waitForTimeout(250);expect(await pixels()).toBe(reduced);
 await page.getByRole('button',{name:'Enable animations',exact:true}).click();await expect.poll(pixels).not.toBe(reduced);
});
test('professional content, technology marks, and social destinations are complete',async({page,request})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/about');await expect(page.locator('.experience-row')).toHaveCount(5);await expect(page.locator('.education-card')).toHaveCount(2);await expect(page.locator('#experience')).toContainText('Propvia');
 await page.goto('/stack');expect(await page.locator('.tool-card').count()).toBeGreaterThan(20);
 const masks=await page.locator('.brand-icon>span').evaluateAll(items=>[...new Set(items.map(el=>(el as HTMLElement).style.maskImage.match(/url\(["']?(.*?)["']?\)/)?.[1]).filter(Boolean))]);
 for(const url of masks){expect((await request.get(url!)).status(),url).toBe(200);}
 for(const route of ['/stack','/contact','/resume','/work/nutrilens-ai','/work/eatfit']){await page.goto(route);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),route).toEqual([]);}
 await page.goto('/contact');await expect(page.locator('main').getByRole('link',{name:/LinkedIn/})).toHaveAttribute('href','https://www.linkedin.com/in/vishvendra-reddy-bhoomidi/');await expect(page.locator('main').getByRole('link',{name:/GitHub/})).toHaveAttribute('href','https://github.com/Vishvendra07');
 await page.goto('/work/nutrilens-ai');await expect(page.locator('article.prose')).toContainText(/synthetic/i);await page.goto('/work/eatfit');await expect(page.locator('article.prose')).toContainText(/team/i);
});
