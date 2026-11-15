import {test,expect,type Page} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
async function prepareHome(page:Page){await page.locator(".systems-section").scrollIntoViewIfNeeded();await expect(page.locator(".pipeline-canvas")).toBeVisible();await page.locator(".activity-section").scrollIntoViewIfNeeded();await expect(page.locator(".activity-controls")).toBeVisible();await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));}
const routes=["/","/about","/work","/work/kaarya-ai","/work/nutrilens-ai","/work/eatfit","/writing","/lab","/lab/message-pipeline","/lab/latency-budget","/now","/stack","/credits","/contact","/resume","/activity/methodology"];
test("all public routes render without runtime errors or broken local navigation",async({page,request})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const hrefs=new Set<string>();
  for(const route of routes){const response=await page.goto(route);expect(response?.status(),route).toBe(200);await expect(page.locator("h1")).toBeVisible();expect(await page.title()).not.toContain("Create Next App");for(const href of await page.locator('a[href^="/"]').evaluateAll(links=>links.map(l=>l.getAttribute("href")!)))hrefs.add(href.split("#")[0]);}
  for(const href of hrefs){const response=await request.get(href);expect(response.status(),href).toBeLessThan(400);}
  expect(errors).toEqual([]);
});
test("drafts, raw imports, fixtures and unknown pages are not public",async({request})=>{
  for(const route of ["/writing/designing-the-handoff","/preview/writing/designing-the-handoff","/preview/activity","/.private/usage.json","/this-page-does-not-exist","/toString","/constructor","/work/nonexistent","/lab/nonexistent"]){expect((await request.get(route)).status(),route).toBe(404);}
  for(const route of ["/","/writing","/rss.xml","/sitemap.xml"]){const response=await request.get(route);const body=await response.text();expect(body).not.toContain("designing-the-handoff");expect(body).not.toContain("TEST FIXTURE");expect(body).not.toContain("Owner setup:");}
  expect(await(await request.get("/robots.txt")).text()).toContain("Disallow: /");expect((await request.get("/")).headers()["x-robots-tag"]).toBe("noindex, nofollow");
});
test("command search, keyboard navigation and focus restoration work",async({page})=>{
  await page.goto("/");const trigger=page.getByRole("button",{name:"Search website"});await trigger.click();const dialog=page.getByRole("dialog");await expect(dialog).toBeVisible();await page.getByRole("textbox",{name:"Search pages and writing"}).fill("latency");await expect(dialog.getByRole("link",{name:/The latency budget/})).toBeVisible();await page.keyboard.press("Escape");await expect(trigger).toBeFocused();await page.keyboard.press("Control+k");await expect(dialog).toBeVisible();await page.getByRole("textbox").fill("Kaarya");await page.keyboard.press("ArrowDown");await expect(dialog.getByRole("link",{name:/Kaarya AI/})).toBeFocused();await page.keyboard.press("Enter");await expect(page).toHaveURL(/work\/kaarya-ai/);
});
test("mobile menu traps focus and restores it on Escape",async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto("/");const trigger=page.getByRole("button",{name:"Open navigation menu"});await trigger.click();await expect(page.getByRole("dialog")).toBeVisible();for(let i=0;i<12;i++)await page.keyboard.press("Tab");expect(await page.getByRole("dialog").evaluate(e=>e.contains(document.activeElement))).toBe(true);await page.keyboard.press("Escape");await expect(trigger).toBeFocused();await trigger.click();await page.getByRole("navigation",{name:"All pages"}).getByRole("link",{name:/Lab/}).click();await expect(page).toHaveURL(/\/lab$/);
});
test("theme persists and activity views switch without invented data",async({page})=>{
  await page.goto("/");const before=await page.locator("html").getAttribute("data-theme");await page.getByRole("button",{name:"Toggle color theme"}).first().click();await expect(page.locator("html")).not.toHaveAttribute("data-theme",before!);await page.reload();await expect(page.locator("html")).not.toHaveAttribute("data-theme",before!);await page.locator(".activity-section").scrollIntoViewIfNeeded();await page.getByRole("button",{name:"Weekly",exact:true}).click();await expect(page.getByLabel("Weekly activity totals")).toBeVisible();await page.getByRole("button",{name:"Cumulative",exact:true}).click();await expect(page.locator(".cumulative-chart")).toBeVisible();await page.getByRole("button",{name:"Daily",exact:true}).click();await page.getByLabel("Activity date range").selectOption("6");const connected=fs.existsSync("src/data/activity.json") ? JSON.parse(fs.readFileSync("src/data/activity.json","utf8")) : null;await expect(page.locator(".source-badge")).toHaveText(connected?.metadata.label || "Data not connected");if(!connected)await expect(page.locator(".activity-summary")).not.toContainText(/\d/);else await expect(page.locator(".activity-note").first()).toContainText(connected.metadata.label);
});
test("pipeline stages support keyboard and dragging",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/lab/message-pipeline");
  const first=page.getByRole("button",{name:"Stage 1: Message"});
  await first.focus();await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button",{name:"Stage 2: Understand"})).toBeFocused();
  await expect(page.locator(".pipeline-explanation :is(h2,h3)")).toHaveText("Understand");
  await first.scrollIntoViewIfNeeded();
  const location=()=>first.evaluate(e=>{const node=e.getBoundingClientRect(),field=e.parentElement!.getBoundingClientRect();return {x:node.x,y:node.y,width:node.width,localX:node.x-field.x,localY:node.y-field.y};});
  const before=await location();
  await page.mouse.move(before.x+before.width/2,before.y+10);await page.mouse.down();
  await page.mouse.move(before.x+before.width/2+30,before.y+40,{steps:5});await page.mouse.up();
  const moved=await location();expect(moved.localX).toBeGreaterThan(before.localX+20);expect(moved.localY).toBeGreaterThan(before.localY+20);
  await page.getByRole("button",{name:"Reset layout"}).click();
  const reset=await location();expect(reset.localX).toBeCloseTo(before.localX,0);expect(reset.localY).toBeCloseTo(before.localY,0);
});

test("latency controls change the critical-path result",async({page})=>{
  await page.goto("/lab/latency-budget");await expect(page.locator(".latency-result strong")).toHaveText("1.45s");await page.getByRole("button",{name:"Sequential",exact:true}).click();await expect(page.locator(".latency-result strong")).toHaveText("1.75s");await page.getByLabel("Language model",{exact:false}).fill("1000");await expect(page.locator(".latency-result strong")).toHaveText("1.95s");
});
test("RSS, sitemap and OG outputs are usable",async({request})=>{
  const rss=await request.get("/rss.xml");expect(rss.headers()["content-type"]).toContain("application/rss+xml");expect(await rss.text()).toContain("<channel>");expect(await(await request.get("/sitemap.xml")).text()).toContain("/work/kaarya-ai");for(const url of ["/opengraph-image","/og?title=Test%20title"]){const image=await request.get(url);expect(image.status()).toBe(200);expect(image.headers()["content-type"]).toContain(url==="/opengraph-image"?"image/jpeg":"image/png");}
});
test("captures the finished first viewport",async({page})=>{await page.setViewportSize({width:1440,height:900});await page.emulateMedia({colorScheme:"dark",reducedMotion:"reduce"});await page.goto("/");await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:"verification/screenshots/home-desktop.png"});await page.setViewportSize({width:390,height:844});await page.screenshot({path:"verification/screenshots/home-mobile.png"});});
for(const color of ["dark","light"] as const){test(`accessibility: representative routes in ${color} theme`,async({page})=>{await page.emulateMedia({colorScheme:color,reducedMotion:"reduce"});for(const route of ["/","/work/kaarya-ai","/lab/latency-budget","/writing","/about"]){await page.goto(route);if(route==="/")await prepareHome(page);const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze();expect(result.violations.map(v=>({id:v.id,description:v.description,nodes:v.nodes.map(n=>n.target)})),route).toEqual([]);}});}
test("responsive screenshots and overflow audit",async({page})=>{
  test.setTimeout(120000);fs.mkdirSync("verification/screenshots",{recursive:true});
  for(const theme of ["dark","light"] as const){await page.emulateMedia({colorScheme:theme,reducedMotion:"reduce"});for(const width of [1440,1280,768,390,360]){await page.setViewportSize({width,height:900});for(const route of ["/","/work/kaarya-ai","/lab/latency-budget","/writing","/about","/stack","/contact","/resume","/work/nutrilens-ai","/work/eatfit"]){await page.goto(route);if(route==="/")await prepareHome(page);await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`${route} at ${width} ${theme}`).toBe(true);const name=route==="/"?"home":route.replaceAll("/","-").slice(1);await page.screenshot({path:`verification/screenshots/${name}-${width}-${theme}.png`,fullPage:true});}}}
});
