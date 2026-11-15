import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Next's server headers do not apply to static exports. Ship the equivalent
// policy with the assets, plus exact hashes for the generated inline scripts.
const root=path.resolve('out');
// Development-only routes must not become static files with a 200 status.
fs.rmSync(path.join(root,'preview'),{recursive:true,force:true});
for(const suffix of ['', '.html', '.txt'])fs.rmSync(path.join(root,`writing/unpublished${suffix}`),{recursive:true,force:true});
const walk=(dir:string):string[]=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const headers=[`/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`];
for(const file of walk(root).filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(file,'utf8');
 const hashes=[...new Set([...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')).map(m=>`'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`))];
 const policy=`default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`;
 if(policy.length>1950)throw new Error(`CSP exceeds Cloudflare header line limit: ${file}`);
 const rel=path.relative(root,file).replaceAll('\\','/');
 const route=rel==='index.html'?'/':`/${rel.replace(/\.html$/,'')}`;
 for(const match of new Set([route,`/${rel}`]))headers.push(`${match}\n  Content-Security-Policy: ${policy}\n`);
}
fs.writeFileSync(path.join(root,'_headers'),headers.join('\n'));
fs.writeFileSync(path.join(root,'_redirects'),'/og /media/social/vishvendra-meta.jpg 301\n/opengraph-image /media/social/vishvendra-meta.jpg 301\n');
console.log('Static assets and hash-based security headers prepared.');
