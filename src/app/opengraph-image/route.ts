export const dynamic = "force-static";
import {readFile} from 'node:fs/promises';
import path from 'node:path';
// Keep the original preview URL usable; all metadata points directly to the optimized owner image.
export async function GET(){const data=await readFile(path.join(process.cwd(),'public/media/social/vishvendra-meta.jpg'));return new Response(data,{headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});}
