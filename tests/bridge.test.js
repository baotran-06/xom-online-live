import test from 'node:test';import assert from 'node:assert/strict';import {EventEmitter} from 'node:events';
import {TikTokBridge,normalize} from '../bridge/tiktok.js';import {createApp} from '../bridge/server.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('modern payload normalization; id fallback; no user ignored',()=>{const e=normalize('join',{user:{userId:'123',nickname:'Xóm'},common:{msgId:'99'}},'a');assert.equal(e.id,'a:join:99');assert.equal(e.user.id,'123');assert.equal(e.source,'LIVE');assert.equal(normalize('gift',{},'x'),null);});
test('streak emits final total only once, follow/like join and streamEnd',async()=>{let c;class Fake extends EventEmitter{constructor(){super();c=this;}async connect(){}async disconnect(){}}
  const events=[],statuses=[];const b=new TikTokBridge(e=>events.push(e),s=>statuses.push(s),()=>{},async()=>({TikTokLiveConnection:Fake}));await b.start('example');const data={user:{userId:'u',nickname:'Bắp'},giftId:1,giftDetails:{giftType:1,giftName:'Rose'},groupId:'111',repeatCount:3,repeatEnd:false};c.emit('gift',data);assert.equal(events.length,0);c.emit('gift',{...data,repeatEnd:true});c.emit('gift',{...data,repeatEnd:true});assert.equal(events.length,1);assert.equal(events[0].count,3);c.emit('member',{user:{userId:1,nickname:'A'}});assert.equal(events[1].type,'join');c.emit('streamEnd');await wait(5);assert.ok(statuses.includes('ended'));await b.stop();});
test('late async connect cannot revive stopped connection',async()=>{let release;class Fake extends EventEmitter{async connect(){await new Promise(r=>release=r);}async disconnect(){}}
  const statuses=[];const b=new TikTokBridge(()=>{},s=>statuses.push(s),()=>{},async()=>({TikTokLiveConnection:Fake}));const attempt=b.start('example');await wait(5);await b.stop();release();await attempt;assert.notEqual(statuses.at(-1),'connected');});
test('real connector module imports and supports modern API (no network LIVE)',async()=>{const lib=await import('../bridge/node_modules/tiktok-live-connector/dist/index.js');assert.equal(typeof lib.TikTokLiveConnection,'function');});
test('HTTP + WebSocket end-to-end; origin, DEMO/LIVE separation, restart, traversal',async(t)=>{
 const app=createApp();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));t.after(()=>app.close());const port=app.server.address().port;const origin=`http://127.0.0.1:${port}`;
 const admin=await fetch(origin+'/admin');assert.equal(admin.status,200);const cookie=admin.headers.get('set-cookie').split(';')[0];assert.ok(cookie.includes('xom_control='));
 const post=async(path,body)=>fetch(origin+'/api/'+path,{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await fetch(origin+'/api/demo',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await post('demo',{type:'join',amount:35})).status,200);await wait(250);
 let s=await (await fetch(origin+'/api/state')).json();assert.equal(s.inside,28);assert.equal(s.waiting,7);assert.equal(s.total,35);
 const ws=new WebSocket(origin.replace('http:','ws:')+'/ws');const snapshot=await new Promise((resolve,reject)=>{ws.addEventListener('message',e=>resolve(JSON.parse(e.data)),{once:true});ws.addEventListener('error',reject,{once:true});});assert.equal(snapshot.inside,28);ws.close();
 assert.equal((await post('mode',{mode:'LIVE'})).status,200);assert.equal((await post('demo',{type:'gift'})).status,409);s=await (await fetch(origin+'/api/state')).json();assert.equal(s.total,0);assert.equal(s.mode,'LIVE');
 assert.equal((await post('restart',{})).status,200);s=await (await fetch(origin+'/api/state')).json();assert.equal(s.mode,'DEMO');assert.equal(s.users.length,0);
 assert.notEqual((await fetch(origin+'/%2e%2e%2fpackage.json')).status,200);
 assert.equal((await fetch(origin+'/js/scene.js')).status,200);
});
test('pinned v2.5.0 protobuf defaults and real modern gift schema',async()=>{
 const proto=await import('../bridge/node_modules/tiktok-live-proto/dist/node/v3.js');
 const gift=proto.WebcastGiftMessage.decode(new Uint8Array());gift.user=proto.User.decode(new Uint8Array());gift.user.id='123';gift.user.nickname='Khách thử';gift.gift=proto.Gift.decode(new Uint8Array());gift.gift.name='Rose';gift.gift.type=1;gift.giftId='5655';gift.repeatCount=4;gift.repeatEnd=1;gift.groupId='555';
 const e=normalize('gift',gift,'session');assert.equal(e.user.id,'123');assert.equal(e.giftName,'Rose');assert.equal(e.count,4);assert.notEqual(e.id,'session:gift:0');
 let c;class Fake extends EventEmitter{constructor(){super();c=this;}async connect(){}async disconnect(){}}
 const events=[];const b=new TikTokBridge(e=>events.push(e),()=>{},()=>{},async()=>({TikTokLiveConnection:Fake}));await b.start('test');c.emit('gift',{...gift,repeatEnd:0});assert.equal(events.length,0);c.emit('gift',gift);c.emit('gift',gift);assert.equal(events.length,1);await b.stop();
});
