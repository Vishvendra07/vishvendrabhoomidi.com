import {test,expect} from "@playwright/test";
test("the full name leads the hero across screen sizes",async({page})=>{
  for(const colorScheme of ["dark","light"] as const){
    await page.emulateMedia({colorScheme,reducedMotion:"reduce"});
    for(const width of [360,390,768,1440]){
      await page.setViewportSize({width,height:950});await page.goto("/");await page.evaluate(()=>document.fonts.ready);
      await expect(page.locator(".hero h1")).toHaveText(/Vishvendra\s+Reddy Bhoomidi\./);
      await expect(page.locator(".hero-intent")).toContainText("I build intelligent systems");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      expect(await page.locator(".hero-name").evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(40);
      expect(await page.locator(".hero-name em").evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
      if(width===390||width===1440)await page.screenshot({path:`verification/screenshots/hero-name-${width}-${colorScheme}.png`});
    }
  }
});
