import {mkdir,open,readFile,writeFile,unlink,stat} from 'node:fs/promises';
import {appendFileSync,existsSync,renameSync,unlinkSync,truncateSync} from 'node:fs';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
import net from 'node:net';
export const projectRoot=resolve(fileURLToPath(new URL('../',import.meta.url)));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const readJSON=async path=>{try{return JSON.parse(await readFile(path,'utf8'));}catch{return null;}};
const alive=pid=>{if(!Number.isInteger(pid)||pid<=0)return false;try{process.kill(pid,0);return true;}catch(e){return e.code==='EPERM';}};
export function projectIdentity(root){return createHash('sha256').update(resolve(root)).digest('hex');}
export function checkedPort(value){const p=Number(value??3210);if(!Number.isInteger(p)||p<1024||p>65535)throw Error('Cong khong hop le (1024-65535).');return p;}
export async function probe(origin,expected={}) {
  const response=await fetch(origin+'/api/health',{signal:AbortSignal.timeout(2500)});if(!response.ok)throw Error('HTTP health '+response.status);
  const health=await response.json();if(health.service!=='xom-online-live'||health.ready!==true||health.protocol!==1)throw Error('Cong dang duoc ung dung khac su dung.');
  for(const key of ['instanceId','projectId'])if(expected[key]&&health[key]!==expected[key])throw Error('Day la phien Xom khac. Khong can thiep.');
  await new Promise((resolve,reject)=>{const socket=new WebSocket(origin.replace('http:','ws:')+'/ws');const timer=setTimeout(()=>{socket.close();reject(Error('WebSocket timeout'));},3000);
    const finish=(error)=>{clearTimeout(timer);socket.close();error?reject(error):resolve();};
    socket.addEventListener('error',()=>finish(Error('WebSocket khong san sang')),{once:true});socket.addEventListener('message',e=>{try{const s=JSON.parse(e.data);if(!Array.isArray(s.users))throw Error();finish();}catch{finish(Error('WebSocket payload khong hop le'));}},{once:true});
  });
  for(const path of ['/admin','/','/js/game.js','/assets/vendor/three.module.js']){const r=await fetch(origin+path,{method:'HEAD',signal:AbortSignal.timeout(2500)});if(!r.ok)throw Error('Thieu frontend '+path+' (HTTP '+r.status+')');}
  return health;
}
async function portFree(port){await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',()=>reject(Error('Cong '+port+' dang ban. Khong tat tien trinh khac; dong phien cu hoac dung STOP-XOM.bat trong dung thu muc.')));server.listen(port,'127.0.0.1',()=>server.close(resolve));});}
async function fingerprint(root,sub){return createHash('sha256').update(await readFile(join(root,sub,'package-lock.json'))).digest('hex');}
async function modulesValid(root,sub){try{const dir=join(root,sub);const pkg=await readJSON(join(dir,'package.json'));const req=createRequire(join(dir,'package.json'));for(const [name,version] of Object.entries(pkg.dependencies||{})){const installed=JSON.parse(await readFile(join(dir,'node_modules',...name.split('/'),'package.json'),'utf8'));if(installed.version!==version)return false;await import(pathToFileURL(req.resolve(name)).href);}return true;}catch{return false;}}
function run(command,args,cwd,log){return new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>{process.stdout.write(b);log(b.toString(),false);});child.stderr.on('data',b=>{process.stderr.write(b);log(b.toString(),false);});child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error('Buoc cai dat/build that bai (exit '+code+'). Kiem tra Internet va .runtime/logs/latest.log, sau do nhan START lai.')));});}
export async function runNpm(root,sub,log){
  const candidate=join(dirname(process.execPath),'node_modules','npm','bin','npm-cli.js');
  if(existsSync(candidate))return run(process.execPath,[candidate,'ci','--no-audit','--no-fund'],join(root,sub),log);
  if(process.platform==='win32'&&spawnSync('where.exe',['npm.cmd'],{stdio:'ignore',windowsHide:true}).status!==0)throw Error('Thieu npm. Cai lai Node.js LTS kem npm roi nhan START lai.');
  if(process.platform==='win32')return run(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npm ci --no-audit --no-fund'],join(root,sub),log);
  return run('npm',['ci','--no-audit','--no-fund'],join(root,sub),log);
}
export async function ensureDependencies(root,log,install=runNpm){
  const stampPath=join(root,'.runtime','dependencies.json');const saved=await readJSON(stampPath)||{};const result={};
  for(const sub of ['','bridge']){const hash=await fingerprint(root,sub);const key=sub||'root';if(saved[key]!==hash||!await modulesValid(root,sub)){log('[SETUP] Kiem tra/cai dependencies '+key+' (lan dau can Internet)...');await install(root,sub,log);if(!await modulesValid(root,sub))throw Error('Dependencies '+key+' chua day du. Nhan START lai de sua cai dat.');}else log('[OK] Dependencies '+key);result[key]=hash;}
  await writeFile(stampPath,JSON.stringify(result),{mode:0o600});
}
function logger(root){const path=join(root,'.runtime','logs','latest.log');if(existsSync(path)){try{if(existsSync(path+'.previous'))unlinkSync(path+'.previous');renameSync(path,path+'.previous');}catch{}}
 return (message,display=true)=>{if(display)console.log(message);try{if(existsSync(path)&&requireSize(path)>1048576){try{if(existsSync(path+'.previous'))unlinkSync(path+'.previous');renameSync(path,path+'.previous');}catch{truncateSync(path,0);}}appendFileSync(path,(display?new Date().toISOString()+' ':'')+message+(display?'\n':''),{mode:0o600});}catch{}};
}
// Bounded logs, no provider payloads or management tokens.
import {statSync} from 'node:fs';
function requireSize(path){return statSync(path).size;}
async function acquire(root,instanceId){const path=join(root,'.runtime','start.lock');for(let i=0;i<2;i++){try{const f=await open(path,'wx',0o600);await f.writeFile(JSON.stringify({pid:process.pid,instanceId}));await f.close();return;}catch(e){if(e.code!=='EEXIST')throw e;const lock=await readJSON(path);if(lock&&alive(lock.pid))throw Error('Xom dang khoi dong hoac da chay. Hay doi, hoac dung STOP-XOM.bat trong thu muc nay.');try{const age=Date.now()-(await stat(path)).mtimeMs;if(!lock&&age<5000)throw Error('Xom vua bat dau khoi dong; hay doi vai giay.');await unlink(path);}catch(e){if(e.code!=='ENOENT')throw e;}}}throw Error('Khong tao duoc khoa khoi dong.');}
async function removeOwned(path,instanceId){const data=await readJSON(path);if(data?.instanceId===instanceId)await unlink(path).catch(()=>{});}
export async function openDashboard(origin){if(process.env.XOM_NO_BROWSER==='1')return;
 if(process.platform==='win32')await new Promise((resolve,reject)=>{const c=spawn(process.env.ComSpec||'cmd.exe',['/d','/s','/c','start "" "'+origin+'/admin"'],{windowsHide:true,stdio:'ignore'});c.once('error',reject);c.once('exit',code=>code===0?resolve():reject(Error('Khong mo duoc trinh duyet.')));});
 else {const child=spawn(process.platform==='darwin'?'open':'xdg-open',[origin+'/admin'],{stdio:'ignore',detached:true});child.on('error',()=>{});child.unref();}
}
export async function startSystem({root=projectRoot,port=3210,browser=openDashboard,install=runNpm}={}){
 port=checkedPort(port);const origin='http://127.0.0.1:'+port;const runtime=join(root,'.runtime');await mkdir(join(runtime,'logs'),{recursive:true,mode:0o700});
 const projectId=projectIdentity(root);const old=await readJSON(join(runtime,'control.json'));
 if(old&&old.projectId===projectId){try{await probe(origin,old);console.log('[OK] Xom da chay. Khong tao server trung.');await browser(origin);return null;}catch{}}
 await portFree(port);const instanceId=randomUUID();await acquire(root,instanceId);if(old)await removeOwned(join(runtime,'control.json'),old.instanceId);const log=logger(root);let app=null;let closing=false;let monitor;
 const cleanup=async()=>{clearInterval(monitor);for(const name of ['control.json','start.lock','stop-request.json'])await removeOwned(join(runtime,name),instanceId);};
 const shutdown=async()=>{if(closing)return;closing=true;log('[STOP] Dang ngat TikTok, dong WebSocket va HTTP...');if(app)await app.close();await cleanup();log('[STOP] Da dung Xom an toan.');};
 const pendingStop=async()=>{const req=await readJSON(join(runtime,'stop-request.json'));if(req?.instanceId===instanceId){log('[STOP] Da nhan yeu cau dung trong luc khoi dong.');await cleanup();return true;}return false;};
 try{
  log('[START] XOM ONLINE LIVE - Node '+process.versions.node);await ensureDependencies(root,log,install);if(await pendingStop())return null;
  await run(process.execPath,[join(root,'scripts','build.mjs')],root,log);if(await pendingStop())return null;
  const {createApp}=await import(pathToFileURL(join(root,'bridge','server.js')).href);
  const preferences=await readJSON(join(runtime,'preferences.json'))||{};
  const token=randomBytes(32).toString('hex');app=createApp({initialMode:'LIVE',instanceId,projectId,shutdownToken:token,rememberedUsername:preferences.username,onPreferences:p=>writeFile(join(runtime,'preferences.json'),JSON.stringify(p),{mode:0o600}),onShutdown:()=>{void shutdown().then(()=>process.exit(0)).catch(e=>{log('[LOI] '+e.message);process.exit(1);});}});
  await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(port,'127.0.0.1',resolve);});
  const health=await probe(origin,{instanceId,projectId});await writeFile(join(runtime,'control.json'),JSON.stringify({pid:process.pid,instanceId,projectId,port,token}),{mode:0o600});
  if(await pendingStop()){await shutdown();return null;}
  log('[OK] HTTP + WebSocket + frontend da san sang: '+origin+'/admin');log('[TikTok] CHUA ket noi LIVE. Nhap username tren bang dieu khien. Chi xac nhan khi nhan su kien that.');
  if(preferences.autoConnect&&/^[a-zA-Z0-9_.]{1,40}$/.test(preferences.username||'')){log('[TikTok] Dang thu ket noi username da luu; CHUA xac nhan su kien LIVE.');void app.connectLive(preferences.username).catch(()=>log('[TikTok] Khong khoi tao duoc ket noi da luu.'));}
  try{await browser(origin);}catch{log('[LOI] Server da san sang nhung khong mo duoc browser. Mo '+origin+'/admin');}
  let monitoring=false;monitor=setInterval(async()=>{if(monitoring||closing)return;monitoring=true;try{await probe(origin,{instanceId,projectId});}catch(e){log('[LOI KIEM TRA] '+e.message);}finally{monitoring=false;}},15000);monitor.unref();
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{void shutdown().then(()=>process.exit(0));});
  return {app,health,shutdown};
 }catch(e){if(app)await app.close().catch(()=>{});await cleanup();throw e;}
}
export async function stopSystem({root=projectRoot,timeoutMs=120000}={}){
 const runtime=join(root,'.runtime');const record=await readJSON(join(runtime,'control.json'));const lock=await readJSON(join(runtime,'start.lock'));const projectId=projectIdentity(root);
 if(!record){if(lock&&alive(lock.pid)){await writeFile(join(runtime,'stop-request.json'),JSON.stringify({instanceId:lock.instanceId}),{mode:0o600});console.log('[STOP] Dang setup. Se dung sau buoc cai dat/build hien tai...');const until=Date.now()+timeoutMs;while(Date.now()<until){if(!await readJSON(join(runtime,'start.lock')))return;await delay(500);}throw Error('Da gui yeu cau dung; buoc cai dat chua ket thuc. Xem cua so START, khong tat Node khac.');}console.log('[OK] Khong co dich vu Xom dang chay trong thu muc nay.');return;}
 if(record.projectId!==projectId)throw Error('Thong tin phien khong khop thu muc. Khong dung tien trinh khac.');
 const origin='http://127.0.0.1:'+checkedPort(record.port);
 let health;try{const r=await fetch(origin+'/api/health',{signal:AbortSignal.timeout(2000)});health=await r.json();}catch{if(alive(record.pid))throw Error('Server khong phan hoi; khong force-kill PID de tranh tat nham. Xem cua so START.');for(const name of ['control.json','start.lock','stop-request.json'])await removeOwned(join(runtime,name),record.instanceId);console.log('[OK] Phien cu da dung; da don thong tin tam.');return;}
 if(health.instanceId!==record.instanceId||health.projectId!==projectId||health.service!=='xom-online-live')throw Error('Cong dang chay phien/ung dung khac. Khong can thiep.');
 const res=await fetch(origin+'/api/launcher/stop',{method:'POST',headers:{Authorization:'Bearer '+record.token,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(4000)});if(res.status!==202)throw Error('Server tu choi dung (HTTP '+res.status+'). Khong dung tien trinh khac.');
 const until=Date.now()+timeoutMs;while(Date.now()<until){if(!await readJSON(join(runtime,'control.json'))){console.log('[OK] Da ngat TikTok, dong WebSocket va server.');return;}await delay(250);}throw Error('Server chua dong xong. Xem cua so START; khong dung taskkill /IM node.exe.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{if(Number(process.versions.node.split('.')[0])<22)throw Error('Can Node.js 22 LTS hoac moi hon.');const action=process.argv[2];if(action==='start')await startSystem({port:process.env.XOM_PORT||3210});else if(action==='stop')await stopSystem();else throw Error('Thao tac khong hop le. Dung START-XOM.bat hoac STOP-XOM.bat.');}
 catch(e){console.error('[LOI] '+e.message);process.exitCode=1;}
}
