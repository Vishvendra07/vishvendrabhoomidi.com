import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
for(const script of ['build.ts','export-site.ts']){
 const result=spawnSync(process.execPath,[require.resolve('tsx/cli'),`scripts/${script}`],{stdio:'inherit',env:{...process.env,PUBLIC_RELEASE:'1',STATIC_EXPORT:'1',NEXT_TELEMETRY_DISABLED:'1'}});
 if(result.status!==0)process.exit(result.status??1);
}
