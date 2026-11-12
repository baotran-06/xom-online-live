import {randomUUID} from 'node:crypto';
import {diagnoseTikTok,diagnosticLine} from './diagnostics.js';
// Pure normalization is exported for fixture tests; never labels synthetic data LIVE.
export function normalize(type,data,session) {
  const user=data.user||data;
  const valid=x=>x&&String(x)!=='0';
  const uid=[user.userId,user.id,user.uniqueId,user.displayId].find(valid);
  if(!uid)return null;
  const msg=[data.common?.msgId,data.msgId,data.eventId].find(valid);
  // Without a provider message id, exactly-once delivery cannot be guaranteed.
  return {id:`${session}:${type}:${msg||randomUUID()}`,source:'LIVE',type,user:{id:String(uid),name:user.nickname||user.uniqueId||user.displayId||String(uid)},giftId:data.giftId,giftName:data.giftDetails?.giftName||data.gift?.name||data.extendedGiftInfo?.name||data.giftName||'',count:data.repeatCount||1};
}
export class TikTokBridge {
  constructor(emit,status,log,loader=()=>import('tiktok-live-connector')){this.emit=emit;this.status=status;this.log=log;this.loader=loader;this.generation=0;this.client=null;this.timer=null;this.attempt=0;this.target='';this.session='';this.streaks=new Map();this.receivedEvents=0;this.lastEventAt=null;this.verified=false;this.lastError=null;this.lastLogged=null;this.nextRetryAt=null;this.cooldownUntil=0;}
  async start(username) {
    const expectedGeneration=this.generation+1;await this.stop();if(this.generation!==expectedGeneration)return; this.target=username;this.session=randomUUID();this.attempt=0;this.lastError=null;this.lastLogged=null;
    return this.open(this.generation);
  }
  async open(gen) {
    if(gen!==this.generation)return;
    this.receivedEvents=0;this.lastEventAt=null;this.verified=false;this.status('connecting');
    let client;let opening=true;
    try {
      const {TikTokLiveConnection}=await this.loader();if(gen!==this.generation)return;
      client=new TikTokLiveConnection(this.target,{processInitialData:false,enableExtendedGiftInfo:true}); this.client=client;
      const active=()=>gen===this.generation&&this.client===client;
      // A failed optional gift catalogue must not prevent receiving public LIVE events.
      // Signing/transport still authenticate normally; provider rate limits are not swallowed.
      if(typeof client.fetchAvailableGifts==='function'){
        const fetchGifts=client.fetchAvailableGifts.bind(client);
        client.fetchAvailableGifts=async(...args)=>{try{return await fetchGifts(...args);}catch(error){
          const d=diagnoseTikTok(error);if(d.code==='RATE_LIMIT'||d.details.some(n=>n.status===429))throw error;
          if(active())this.log('[GIFT_CATALOG_UNAVAILABLE] Bỏ qua danh mục quà tùy chọn; tiếp tục kiểm tra kết nối nguồn. '+diagnosticLine(d));
          return [];
        }};
      }
      for(const type of ['member','like','follow','chat','gift'])client.on(type,data=>{
        if(!active())return;
        const event=normalize(type==='member'?'join':type,data,this.session);if(!event)return;
        if(type==='gift') {
          const giftType=data.giftDetails?.giftType??data.gift?.type??data.extendedGiftInfo?.type??data.giftType;
          if(giftType===1&&!data.repeatEnd)return;
          const group=data.groupId;
          if(giftType===1&&group&&String(group)!=='0') {
            const key=`${event.user.id}:${event.giftId}:${group}`;
            if(this.streaks.has(key))return;
            this.streaks.set(key,Date.now());while(this.streaks.size>10000)this.streaks.delete(this.streaks.keys().next().value);
            event.id=`${this.session}:streak:${key}`;
          }
        }
        this.receivedEvents++;this.lastEventAt=Date.now();this.verified=true;this.lastError=null;this.attempt=0;this.status('connected');this.emit(event);
      });
      client.on('error',error=>{if(active()&&!opening)this.report(error);});
      client.on('streamEnd',()=>{if(active()){this.status('ended');void this.stop(false);}});
      client.on('disconnected',()=>{if(active())this.retry(gen);});
      await client.connect();if(!active()){await client.disconnect();return;}
      opening=false;this.lastError=null;this.status(this.receivedEvents>0?'connected':'awaiting-event');
    } catch(error) {
      if(gen!==this.generation)return;this.verified=false;
      const diagnostic=this.report(error);
      if(!diagnostic.retryable){this.retireClient();this.status('error');return;}
      this.retry(gen,diagnostic.retryAfterMs);
    }
  }
  report(error){const diagnostic=diagnoseTikTok(error);this.verified=false;this.lastError=diagnostic;if(diagnostic.code==='RATE_LIMIT'||diagnostic.details.some(n=>n.status===429))this.cooldownUntil=Math.max(this.cooldownUntil,Date.now()+Math.max(1500,diagnostic.retryAfterMs));const line=diagnosticLine(diagnostic);const now=Date.now();if(!this.lastLogged||this.lastLogged.line!==line||now-this.lastLogged.at>60000){this.log(line);this.lastLogged={line,at:now};}return diagnostic;}
  retireClient(){const old=this.client;this.client=null;if(old){old.removeAllListeners();old.on('error',()=>{});try{Promise.resolve(old.disconnect()).catch(()=>{});}catch{}}}
  evidence(){return {verified:this.verified,receivedEvents:this.receivedEvents,lastEventAt:this.lastEventAt,username:this.target||null,capabilities:{viewerLeave:false,viewerLeaveNote:'Connector 2.5.0 không cung cấp sự kiện rời LIVE theo từng ID; không suy luận từ số người xem hoặc im lặng.'},lastError:this.lastError,nextRetryAt:this.nextRetryAt,cooldownUntil:this.cooldownUntil};}
  retry(gen,minimumDelay=0) {
    if(gen!==this.generation||this.timer)return;this.verified=false;
    this.retireClient();
    if(++this.attempt>8){this.status('error');this.log('Đã dừng sau 8 lần thử. Nhấn kết nối để thử lại.');return;}
    this.status('reconnecting');const wait=Math.max(minimumDelay,Math.min(60000,1500*2**(this.attempt-1))+Math.floor(Math.random()*500));this.nextRetryAt=Date.now()+wait;this.log('[RETRY '+this.attempt+'/8] Thử lại sau '+Math.ceil(wait/1000)+' giây. Chưa kết nối LIVE.');
    this.timer=setTimeout(()=>{this.timer=null;this.nextRetryAt=null;void this.open(gen);},wait);this.timer.unref?.();
  }
  async stop(update=true) {
    this.verified=false;this.lastError=null;this.generation++;clearTimeout(this.timer);this.timer=null;this.nextRetryAt=null;const old=this.client;this.client=null;
    if(old){old.removeAllListeners();old.on('error',()=>{});let timer;try{await Promise.race([Promise.resolve(old.disconnect()),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('TikTok disconnect timeout')),5000);})]);}finally{clearTimeout(timer);}}
    this.streaks.clear();if(update)this.status('disconnected');
  }
}
