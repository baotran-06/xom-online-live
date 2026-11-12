import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createApp} from '../bridge/server.js';
import {melodyWav} from '../frontend/js/audio.js';
const app=createApp();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+app.server.address().port;
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=user-gesture-required']});
const page=await browser.newPage({viewport:{width:1920,height:1080}});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function rms(){return page.evaluate(()=>{const a=__xom.audio.analyser,b=new Uint8Array(a.fftSize);a.getByteTimeDomainData(b);return Math.sqrt(b.reduce((s,v)=>s+((v-128)/128)**2,0)/b.length);});}
try{
 await page.goto(origin+'/admin');await page.click('#demo-mode');await page.click('[data-amount="12"]');await page.goto(origin+'/');await page.waitForFunction(()=>window.__xom?.scene?.avatars.size===12);await page.waitForTimeout(3500);
 assert.equal(await page.locator('#fatal').isHidden(),true);assert.equal(await page.locator('.interaction-item').count(),5);
 const bounds=await page.evaluate(()=>({world:document.getElementById('world').getBoundingClientRect().right,rail:document.querySelector('.interaction-board').getBoundingClientRect().left}));assert.ok(bounds.world<=bounds.rail+1);
 await page.click('#audio-start');await page.waitForFunction(()=>__xom.audio?.ctx?.state==='running'&&!!__xom.audio.crowd&&!__xom.audio.media.paused,null,{timeout:20000});
 await page.evaluate(()=>{__xom.audio.enable('ambient',false);__xom.audio.enable('sfx',false);__xom.audio.set('music',.8);});await page.waitForTimeout(600);assert.ok(await rms()>.001,'music bus produces PCM');
 await page.evaluate(()=>{__xom.audio.enable('music',false);__xom.audio.enable('ambient',true);__xom.audio.set('ambient',.8);});await page.waitForTimeout(3000);assert.ok(await rms()>.001,'ambient bus produces PCM');
 await page.evaluate(()=>{__xom.audio.enable('ambient',false);__xom.audio.enable('sfx',true);__xom.audio.set('sfx',.8);});await page.waitForTimeout(5000);await page.click('#audio-test');await page.waitForTimeout(60);assert.ok(await rms()>.001,'SFX bus produces PCM');
 const oldIndex=await page.evaluate(()=>__xom.audio.index);await page.click('#music-next');assert.notEqual(await page.evaluate(()=>__xom.audio.index),oldIndex);await page.click('#music-prev');assert.equal(await page.evaluate(()=>__xom.audio.index),oldIndex);
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/game-initial.png'});
 await page.setInputFiles('#music-files',{name:'local-test.wav',mimeType:'audio/wav',buffer:Buffer.from(melodyWav(0))});assert.equal(await page.locator('#music-list option').count(),3);await page.selectOption('#music-list','2');await page.click('#music-remove');assert.equal(await page.locator('#music-list option').count(),2);
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/game-1920.png'});
 // Explicit DEMO leave via the authenticated admin cookie; no provider event claimed.
 const response=await page.request.post(origin+'/api/demo',{headers:{Origin:origin},data:{type:'leave',viewer:1}});assert.ok(response.ok());await page.waitForFunction(()=>__xom.scene.avatars.get('demo-1')?.user.state==='standing');
 const start=await page.evaluate(()=>__xom.scene.avatars.get('demo-1').group.position.toArray());await page.waitForTimeout(2500);const next=await page.evaluate(()=>__xom.scene.avatars.get('demo-1').group.position.toArray());assert.notDeepEqual(start,next);assert.equal(await page.evaluate(()=>!!__xom.scene.avatars.get('demo-1').exit),true);
 await page.waitForFunction(()=>!__xom.scene.avatars.has('demo-1'),null,{timeout:22000});assert.equal(await page.evaluate(()=>__xom.scene.avatars.size),11);
 // Re-enter the same ID using a fixture, exercising a fresh avatar.
 app.world.enqueue({id:'browser-return',source:'DEMO',type:'join',user:{id:'demo-1',name:'Khách quay lại thử nghiệm'}});await page.waitForFunction(()=>__xom.scene.avatars.size===12);
 await page.setViewportSize({width:1280,height:720});await page.screenshot({path:'artifacts/game-1280.png'});assert.equal(await page.locator('.interaction-board').isVisible(),true);
 assert.deepEqual(errors,[]);console.log('Browser verified: WebGL, guide viewport, music/ambient/SFX PCM, playlist controls, animated departure/removal and re-entry. LIVE Studio output NOT tested.');
}finally{await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/game-final.png'}).catch(()=>{});await browser.close();await app.close();}
