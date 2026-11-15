import {defineConfig} from 'cf/config';
export default defineConfig({
 worker:{
  name:'vishvendra-portfolio',
  compatibilityDate:'2026-11-15',
  assets:{htmlHandling:'drop-trailing-slash',notFoundHandling:'404-page'},
  previewUrls:false,
 },
});
