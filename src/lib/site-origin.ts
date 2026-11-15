export function resolveSiteOrigin(value?:string,requirePublic=false){
  if(!value?.trim()){if(requirePublic)throw new Error('Set NEXT_PUBLIC_SITE_URL to the final HTTPS domain before public release.');return 'http://localhost:3000';}
  const url=new URL(value.trim());
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('NEXT_PUBLIC_SITE_URL must be a root HTTP(S) origin without a path, credentials, query or fragment.');
  const privateHost=url.hostname==='localhost'||/^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname)||url.hostname.startsWith('[')||/\.(localhost|local|test|invalid|example)$/.test(url.hostname)||/(^|\.)example\.(com|org|net)$/.test(url.hostname)||!url.hostname.includes('.');
  if(requirePublic&&(url.protocol!=='https:'||privateHost))throw new Error('Public release requires a real HTTPS canonical origin.');
  return url.origin;
}
