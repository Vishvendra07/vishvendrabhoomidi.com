import {test,expect} from '@playwright/test';
import {pages,site} from '../../src/data/site';

test('public routes have coherent search and social metadata without duplicate inherited tags',async({page,request})=>{
 const titles=new Set<string>(),descriptions=new Set<string>();
 for(const entry of pages){await page.goto(entry.href);const title=await page.title();expect(titles.has(title),`${entry.href} duplicate title`).toBe(false);titles.add(title);
  const meta=await page.evaluate(()=>({description:[...document.querySelectorAll('meta[name="description"]')].map(e=>e.getAttribute('content')),canonical:[...document.querySelectorAll('link[rel="canonical"]')].map(e=>e.getAttribute('href')),ogTitle:[...document.querySelectorAll('meta[property="og:title"]')].map(e=>e.getAttribute('content')),ogUrl:[...document.querySelectorAll('meta[property="og:url"]')].map(e=>e.getAttribute('content')),ogImage:[...document.querySelectorAll('meta[property="og:image"]')].map(e=>e.getAttribute('content')),twitter:[...document.querySelectorAll('meta[name="twitter:image"]')].map(e=>e.getAttribute('content')),robots:document.querySelector('meta[name="robots"]')?.getAttribute('content'),schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent||'{}'))}));
  expect(meta.description).toHaveLength(1);expect(meta.description[0]!.length).toBeGreaterThan(45);expect(descriptions.has(meta.description[0]!)).toBe(false);descriptions.add(meta.description[0]!);
  expect(meta.canonical.map(url=>new URL(url!).href)).toEqual([new URL(entry.href,site.url).href]);expect(meta.ogUrl).toEqual(meta.canonical);expect(meta.ogTitle).toEqual([title]);expect(meta.ogImage).toEqual([`${site.url}/media/social/vishvendra-meta.jpg`]);expect(meta.twitter).toEqual(meta.ogImage);expect(meta.robots).toContain('noindex');expect(meta.schemas.length).toBeGreaterThanOrEqual(2);
 }
 const image=await request.get('/media/social/vishvendra-meta.jpg');expect(image.status()).toBe(200);expect(image.headers()['content-type']).toContain('image/jpeg');expect((await image.body()).length).toBeLessThan(200000);
});

test('crawler outputs, mobile icons and missing pages maintain the release boundary',async({request,page})=>{
 const sitemap=await request.get('/sitemap.xml'),xml=await sitemap.text();expect(xml).not.toMatch(/\/preview\/|designing-the-handoff|missing-page/);expect(xml).toContain(`<loc>${site.url}/</loc>`);
 const robots=await request.get('/robots.txt');expect(await robots.text()).toContain('Disallow: /');
 const home=await request.get('/');expect(home.headers()['x-robots-tag']).toBe('noindex, nofollow');expect(await home.text()).toContain('property="og:image"');
 const manifest=await(await request.get('/manifest.webmanifest')).json();expect(manifest.icons).toHaveLength(2);for(const icon of manifest.icons)expect((await request.get(icon.src)).status()).toBe(200);
 await page.goto('/');await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
 const missing=await request.get('/does-not-exist');expect(missing.status()).toBe(404);expect(await missing.text()).toContain('noindex');
 const draft=await request.get('/preview/writing/designing-the-handoff');expect(draft.status()).toBe(404);
});
