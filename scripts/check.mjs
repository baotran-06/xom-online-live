import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
async function files(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name==='node_modules'||e.name==='vendor')continue;const p=dir+'/'+e.name;if(e.isDirectory())out.push(...await files(p));else out.push(p);}return out;}
let count=0;for(const dir of ['frontend/js','bridge','scripts','tests'])for(const p of await files(dir))if(/\.(js|mjs)$/.test(p)){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status){console.error(r.stderr);process.exit(1);}count++;}
for(const p of ['config/gifts.json','config/game-settings.json','package.json','bridge/package.json'])JSON.parse(await readFile(p));
console.log(`${count} JavaScript modules: syntax OK; JSON configuration OK.`);
