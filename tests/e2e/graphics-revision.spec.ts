import {test,expect} from '@playwright/test';

test('the homepage includes the full history and the owner-corrected Director title',async({page})=>{
 await page.goto('/');await expect(page.locator('.journey-entry')).toHaveCount(7);
 const history=page.locator('.journey-ledger');for(const name of ['Surge Business Development','V&U Intellect Consultants','Propvia','Kaarya AI','Teaching Assistant / Grader'])await expect(history).toContainText(name);
 await expect(history).toContainText('Director');
 for(const route of ['/about','/resume']){await page.goto(route);const vu=page.locator('.experience-row').filter({hasText:'V&U Intellect'});await expect(vu.locator('.experience-role')).toHaveText('Director');}
});
test('the logo is unplated and stages stay separate across responsive container widths',async({page})=>{
 await page.goto('/work/kaarya-ai');expect(await page.locator('.brand-logo').first().evaluate(e=>{const s=getComputedStyle(e);return s.backgroundColor==='rgba(0, 0, 0, 0)'&&parseFloat(s.borderTopWidth)===0&&s.boxShadow==='none';})).toBe(true);
 for(const width of [360,390,640,768,1280]){
  await page.setViewportSize({width,height:900});await page.goto('/lab/message-pipeline');await expect(page.locator('.pipeline-connection')).toHaveCount(3);
  const nodes=await page.locator('.pipeline-node').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];expect(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,`Nodes ${i+1}/${j+1} overlap at ${width}`).toBe(true);}
  const distances=await page.locator('.pipeline-canvas').evaluate(field=>{const root=field.getBoundingClientRect(),nodes=[...field.querySelectorAll('.pipeline-node')].map(e=>e.getBoundingClientRect());return [...field.querySelectorAll<SVGPathElement>('.pipeline-connection')].map((path,i)=>{const point=path.getPointAtLength(0),r=nodes[i],x=point.x+root.x,y=point.y+root.y;return Math.min(Math.abs(x-r.left),Math.abs(x-r.right),Math.abs(y-r.top),Math.abs(y-r.bottom));});});
  for(const distance of distances)expect(distance).toBeLessThan(7);
 }
});
