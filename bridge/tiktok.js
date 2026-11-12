import {randomUUID} from 'node:crypto';
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
  constructor(emit,status,log,loader=()=>import('tiktok-live-connector')){this.emit=emit;this.status=status;this.log=log;this.loader=loader;this.generation=0;this.client=null;this.timer=null;this.attempt=0;this.target='';this.session='';this.streaks=new Map();}
  async start(username) {
    await this.stop(); this.target=username;this.session=randomUUID();this.attempt=0;
    return this.open(this.generation);
  }
  async open(gen) {
    if(gen!==this.generation)return;
    this.status('connecting');
    let client;
    try {
      const {TikTokLiveConnection}=await this.loader();if(gen!==this.generation)return;
      client=new TikTokLiveConnection(this.target,{processInitialData:false,enableExtendedGiftInfo:true}); this.client=client;
      const active=()=>gen===this.generation&&this.client===client;
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
        this.emit(event);
      });
      client.on('error',()=>{if(active())this.log('Lỗi nguồn TikTok. Kiểm tra kết nối, trạng thái LIVE và dịch vụ ký.');});
      client.on('streamEnd',()=>{if(active()){this.status('ended');void this.stop(false);}});
      client.on('disconnected',()=>{if(active())this.retry(gen);});
      await client.connect();if(!active()){await client.disconnect();return;}
      this.attempt=0;this.status('connected');
    } catch(error) {
      if(gen!==this.generation)return;
      const missing=error.code==='ERR_MODULE_NOT_FOUND';
      this.log(missing?'Chưa cài thư viện TikTok. Chạy npm run install:tiktok.':'Không kết nối được TikTok: nguồn LIVE hoặc dịch vụ ký chưa khả dụng.');
      if(missing){this.status('error');return;}
      this.retry(gen);
    }
  }
  retry(gen) {
    if(gen!==this.generation||this.timer)return;
    this.client?.removeAllListeners();try{Promise.resolve(this.client?.disconnect()).catch(()=>{});}catch{}this.client=null;
    if(++this.attempt>8){this.status('error');this.log('Đã dừng sau 8 lần thử. Nhấn kết nối để thử lại.');return;}
    this.status('reconnecting');const wait=Math.min(60000,1500*2**(this.attempt-1))+Math.floor(Math.random()*500);
    this.timer=setTimeout(()=>{this.timer=null;void this.open(gen);},wait);this.timer.unref?.();
  }
  async stop(update=true) {
    this.generation++;clearTimeout(this.timer);this.timer=null;const old=this.client;this.client=null;
    if(old){old.removeAllListeners();try{await old.disconnect();}catch{}}
    this.streaks.clear();if(update)this.status('disconnected');
  }
}
