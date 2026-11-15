import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"./tests/e2e",fullyParallel:false,workers:2,timeout:30000,
  use:{baseURL:process.env.TEST_BASE_URL||"http://127.0.0.1:3000",trace:"retain-on-failure",screenshot:"only-on-failure",colorScheme:"dark"},
  reporter:[["list"],["html",{open:"never"}]],
  webServer:{command:"npm run start -- --hostname 127.0.0.1 --port 3000",url:"http://127.0.0.1:3000",reuseExistingServer:!process.env.CI,timeout:60000},
});
