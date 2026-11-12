export const DEFAULT_SETTINGS = {tables:7,seatsPerTable:4,maxVisible:28,maxWaiting:80,idleTimeoutMs:600000,eventQueueLimit:2000,eventsPerTick:30,tickMs:100,dedupeLimit:10000,dedupeTtlMs:900000,historyLimit:80,sessionVisitorLimit:50000};
export const DEFAULT_GIFTS = {byId:{},byName:{rose:'flowers','hoa hồng':'flowers',beer:'cheers',bia:'cheers',heart:'wave',galaxy:'spotlight',lion:'spotlight'},defaultAction:'cheers',groupThreshold:10};
const ACTIONS = new Set(['wave','cheers','flowers','spotlight']);
export class World {
  constructor(settings={}, gifts=DEFAULT_GIFTS, now=Date.now) {
    this.settings={...DEFAULT_SETTINGS,...settings}; this.gifts=gifts; this.now=now;
    this.mode='DEMO'; this.sound=false; this.reset();
  }
  reset(mode=this.mode) {
    this.mode=mode; this.users=new Map(); this.waiting=[]; this.queue=[]; this.seen=new Map();
    this.visitors=new Set(); this.total=0; this.totalCapped=false; this.dropped=0; this.history=[]; this.sequence=0;
    this.groupUntil=0; this.lastEffect=null;
  }
  enqueue(e) {
    if(!e || e.source!==this.mode || !['join','leave','like','follow','gift','chat'].includes(e.type)) return false;
    if(!e.id || !e.user?.id || !e.user?.name) return false;
    const clean={id:String(e.id).slice(0,180),source:e.source,type:e.type,user:{id:String(e.user.id).slice(0,100),name:String(e.user.name).slice(0,40)},giftId:String(e.giftId??'').slice(0,40),giftName:String(e.giftName??'').slice(0,60),count:Math.max(1,Math.min(99999,Number(e.count)||1))};
    if(this.queue.length>=this.settings.eventQueueLimit) { this.dropped++; return false; }
    this.queue.push(clean); return true;
  }
  seat(user) {
    const used=new Set([...this.users.values()].filter(u=>u.seat!==null).map(u=>u.seat));
    const capacity=Math.min(this.settings.maxVisible,this.settings.tables*this.settings.seatsPerTable);
    for(let i=0;i<capacity;i++) if(!used.has(i)) {user.seat=i;user.state='walking';user.arrivedAt=this.now()+3000;return true;}
    return false;
  }
  apply(e) {
    const now=this.now(); if(this.seen.has(e.id)) return;
    this.seen.set(e.id,now);
    while(this.seen.size>this.settings.dedupeLimit) this.seen.delete(this.seen.keys().next().value);
    let u=this.users.get(e.user.id);
    if(e.type==='leave') {
      if(u&&!u.departedAt){u.departedAt=now||1;u.state='standing';u.action=null;u.removeAt=now+18000;this.waiting=this.waiting.filter(id=>id!==u.id);this.history.unshift({...e,at:now,action:null});this.history.length=Math.min(this.history.length,this.settings.historyLimit);}
      return;
    }
    if(u?.departedAt){if(e.type==='join')u.returnEvent=e;return;}
    if(!u) {
      if(this.users.size>=this.settings.maxVisible+this.settings.maxWaiting){this.dropped++;return;}
      u={...e.user,seat:null,state:'waiting',lastSeen:now,action:null,actionUntil:0,arrivedAt:0,joinedAt:now,departedAt:null};
      if(!this.visitors.has(u.id)) {
        if(this.visitors.size<this.settings.sessionVisitorLimit){this.visitors.add(u.id);this.total++;}
        else this.totalCapped=true;
      }
      this.users.set(u.id,u); if(!this.seat(u))this.waiting.push(u.id);
    }
    u.name=e.user.name;u.lastSeen=now;
    let action=null;
    if(e.type==='like'||e.type==='follow') action='wave';
    if(e.type==='gift') {
      action=this.gifts.byId?.[e.giftId]??this.gifts.byName?.[e.giftName.toLowerCase()]??this.gifts.defaultAction;
      if(!ACTIONS.has(action))action='cheers';
      if(e.count>=this.gifts.groupThreshold)this.groupUntil=now+6500;
    }
    if(action){u.action=action;u.actionUntil=now+5000;this.lastEffect={seq:++this.sequence,user:u.name,action,count:e.count,until:now+5000};}
    this.history.unshift({...e,at:now,action}); this.history.length=Math.min(this.history.length,this.settings.historyLimit);
  }
  remove(id) {this.users.delete(id);this.waiting=this.waiting.filter(x=>x!==id);this.fill();}
  fill() {while(this.waiting.length){const u=this.users.get(this.waiting[0]);if(!u){this.waiting.shift();continue;}if(!this.seat(u))break;this.waiting.shift();}}
  tick() {
    for(let i=0;i<this.settings.eventsPerTick&&this.queue.length;i++)this.apply(this.queue.shift());
    const now=this.now();
    for(const [id,u] of this.users) {
      if(u.departedAt){if(now>=u.removeAt){const back=u.returnEvent;this.remove(id);if(back){this.seen.delete(back.id);this.apply(back);}}else u.state=now-u.departedAt<900?'standing':now-u.departedAt<14000?'walking':'exiting';continue;}
      if(this.mode==='DEMO'&&now-u.lastSeen>this.settings.idleTimeoutMs){this.remove(id);continue;}
      if(u.state==='walking'&&now>=u.arrivedAt)u.state='sitting';
      if(u.actionUntil<=now)u.action=null;
    }
    for(const [id,t] of this.seen) {if(now-t>this.settings.dedupeTtlMs)this.seen.delete(id);else break;}
  }
  snapshot() {
    const users=[...this.users.values()];const visible=users.filter(u=>u.seat!==null);
    return {giftRules:this.gifts,mode:this.mode,sound:this.sound,users,total:this.total,totalCapped:this.totalCapped,inside:visible.length,waiting:this.waiting.length,tablesUsed:new Set(visible.map(u=>Math.floor(u.seat/this.settings.seatsPerTable))).size,capacity:Math.min(this.settings.maxVisible,this.settings.tables*this.settings.seatsPerTable),queue:this.queue.length,dropped:this.dropped,history:this.history,groupUntil:this.groupUntil,lastEffect:this.lastEffect,serverTime:this.now()};
  }
}
export function demoEvent(type='join', index=1, giftName='Rose', count=1) {
  return {id:globalThis.crypto.randomUUID(),source:'DEMO',type,user:{id:`demo-${index}`,name:['Bé Bắp','Anh Hai','Cô Ba','Mèo Cam','Anh Năm','Bé Na','Chị Tư','Tí Sún','Cậu Út','Chị Sáu'][index%10]+(index>9?' '+index:'')},giftName,count};
}
