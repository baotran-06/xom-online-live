import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,cp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawn} from 'node:child_process';import net from 'node:net';
import {projectIdentity,probe} from '../scripts/launcher.mjs';
const source=resolve(import.meta.dirname,'..');const pause=ms=>new Promise(r=>setTimeout(r,ms));
function bat(root,name){const child=spawn(process.env.ComSpec||'cmd.exe',['/d','/s','/c','call "'+join(root,name)+'"'],{cwd:tmpdir(),windowsVerbatimArguments:true,env:{...process.env,XOM_NO_BROWSER:'1',XOM_NO_PAUSE:'1',XOM_PORT:'3210'},stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>{output+=b;process.stdout.write(b);});child.stderr.on('data',b=>{output+=b;process.stderr.write(b);});const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>resolve(code));});return {child,done,get output(){return output;}};}
async function ready(origin,task){const until=Date.now()+180000;while(Date.now()<until){if(task.child.exitCode!==null)throw Error('START exited '+task.child.exitCode+'\n'+task.output);try{return await probe(origin);}catch{}await pause(600);}throw Error('START timeout\n'+task.output);}
async function exit(task,ms=20000){return Promise.race([task.done,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('BAT timeout\n'+task.output)),ms);timer.unref();})]);}
test('Windows cmd.exe: install from missing dependencies, START twice, live truth, wrong-folder STOP, safe STOP, busy port', {skip:process.platform!=='win32',timeout:360000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'Xom Windows smoke (safe) '));const origin='http://127.0.0.1:3210';
 await cp(source,root,{recursive:true,filter:p=>!/(^|[\\/])(?:node_modules|\.git|\.runtime|dist)(?:[\\/]|$)/.test(p)});
 await mkdir(join(root,'.runtime'),{recursive:true});await writeFile(join(root,'.runtime','start.lock'),JSON.stringify({pid:2147483647,instanceId:'stale'}));
 const first=bat(root,'START-XOM.bat');
 t.after(async()=>{try{await exit(bat(root,'STOP-XOM.bat'));}catch{}if(first.child.exitCode===null)first.child.kill();await rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:500});});
 const health=await ready(origin,first);assert.equal(health.ready,true);assert.equal(health.projectId,projectIdentity(root));assert.equal(health.liveEvidence.verified,false);assert.equal(health.liveEvidence.receivedEvents,0);
 const state=await (await fetch(origin+'/api/state')).json();assert.equal(state.mode,'LIVE');assert.equal(state.connection,'disconnected');assert.equal(state.total,0);assert.equal(state.history.length,0);
 assert.ok(JSON.parse(await readFile(join(root,'node_modules','three','package.json'),'utf8')).version);assert.equal(JSON.parse(await readFile(join(root,'bridge','node_modules','tiktok-live-connector','package.json'),'utf8')).version,'2.5.0');
 const second=bat(root,'START-XOM.bat');assert.equal(await exit(second),0);assert.equal((await probe(origin)).pid,health.pid);assert.match(second.output,/Khong tao server trung/);
 assert.equal((await fetch(origin+'/api/launcher/stop',{method:'POST',headers:{Authorization:'Bearer '+'0'.repeat(64)}})).status,403);assert.equal((await probe(origin)).pid,health.pid);
 const other=await mkdtemp(join(tmpdir(),'Xom wrong folder '));try{await mkdir(join(other,'scripts'));await mkdir(join(other,'.runtime'));await cp(join(root,'scripts','launcher.mjs'),join(other,'scripts','launcher.mjs'));await cp(join(root,'STOP-XOM.bat'),join(other,'STOP-XOM.bat'));await cp(join(root,'.runtime','control.json'),join(other,'.runtime','control.json'));assert.equal(await exit(bat(other,'STOP-XOM.bat')),1);assert.equal((await probe(origin)).pid,health.pid);}finally{await rm(other,{recursive:true,force:true});}
 const stop=bat(root,'STOP-XOM.bat');assert.equal(await exit(stop),0);assert.equal(await exit(first),0);await assert.rejects(fetch(origin+'/api/health',{signal:AbortSignal.timeout(1000)}));assert.equal(await exit(bat(root,'STOP-XOM.bat')),0);
 const blocker=net.createServer();await new Promise(r=>blocker.listen(3210,'127.0.0.1',r));try{const blocked=bat(root,'START-XOM.bat');assert.equal(await exit(blocked),1);assert.match(blocked.output,/Cong 3210 dang ban/);assert.equal(blocker.listening,true);}finally{await new Promise(r=>blocker.close(r));}
});
