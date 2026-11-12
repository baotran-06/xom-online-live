// Fresh process for each check: failed ESM imports must not poison a repaired install.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const sub=process.argv[2]||'';
try{
  if(!['','bridge'].includes(sub))throw Error('Invalid dependency scope');
  const dir=join(root,sub);const manifest=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'));const req=createRequire(join(dir,'package.json'));
  for(const [name,version] of Object.entries(manifest.dependencies||{})){
    const pkg=JSON.parse(readFileSync(join(dir,'node_modules',...name.split('/'),'package.json'),'utf8'));
    if(pkg.version!==version)throw Error('Dependency version mismatch: '+name);
    await import(pathToFileURL(req.resolve(name)).href);
  }
}catch(e){console.error('Dependency check failed: '+e.message);process.exitCode=1;}
