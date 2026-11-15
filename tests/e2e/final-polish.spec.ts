import {test,expect} from '@playwright/test';

test('credentials have real university marks and balanced desktop alignment',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');
 const proof=page.locator('.proof-row');await expect(proof).toContainText('University of Michigan - 2025');await expect(proof).toContainText('Penn State University - 2024');
 await expect(proof.locator('.university-mark img')).toHaveCount(2);
 await proof.scrollIntoViewIfNeeded();for(const image of await proof.locator('.university-mark img').all())await expect.poll(()=>image.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
 expect(await proof.evaluate(e=>Math.abs(e.parentElement!.getBoundingClientRect().bottom-e.getBoundingClientRect().bottom))).toBeLessThan(2);
 const offsets=await proof.locator(':scope > div').evaluateAll(items=>items.map(item=>{const box=item.getBoundingClientRect(),children=[...item.children].map(c=>c.getBoundingClientRect());return Math.abs((Math.min(...children.map(r=>r.left))+Math.max(...children.map(r=>r.right)))/2-(box.left+box.width/2));}));
 for(const offset of offsets)expect(offset).toBeLessThan(2);
 await expect(page.locator('.writing-pending-mark')).toHaveCount(0);await expect(page.locator('.notebook-thread')).toHaveCount(3);
 for(const width of [360,390,768]){await page.setViewportSize({width,height:900});const overlap=await page.locator('.kaarya-system').first().evaluate(field=>{const logo=field.querySelector('.brand-logo')!.getBoundingClientRect();return [...field.querySelectorAll('.kaarya-endpoints>span')].some(e=>{const r=e.getBoundingClientRect();return r.left<logo.right&&r.right>logo.left&&r.top<logo.bottom&&r.bottom>logo.top;});});expect(overlap,`Kaarya endpoints overlap logo at ${width}`).toBe(false);}
 await page.goto('/work');
 for(const width of [360,390,768]){await page.setViewportSize({width,height:900});const stacked=await page.locator('.work-index-feature .venture-feature').evaluate(e=>{const art=e.children[0].getBoundingClientRect(),copy=e.children[1].getBoundingClientRect();return copy.top>=art.bottom;});expect(stacked,`Work feature must stack at ${width}`).toBe(true);}
});

test('social destinations and the selected resume download are complete',async({page,request})=>{
 await page.goto('/contact');
 for(const [name,href] of [['X','https://x.com/VishvendraReddy'],['Instagram','https://www.instagram.com/vishvendrabhoomidi/']]){
  const link=page.locator('.contact-opening').getByRole('link',{name:new RegExp(`^${name}`)});await expect(link).toHaveAttribute('href',href);await expect(link).toHaveAttribute('rel','noopener noreferrer');
 }
 await page.goto('/resume');const download=page.getByRole('link',{name:'Download backend résumé PDF'});await expect(download).toHaveAttribute('download','');
 const response=await request.get((await download.getAttribute('href'))!);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('application/pdf');expect((await response.body()).subarray(0,5).toString()).toBe('%PDF-');
});
