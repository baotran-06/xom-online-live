import {World,demoEvent} from './core.js';
export class Client {
  constructor(onState) {
    this.onState=onState;this.world=new World();this.remote=false;this.closed=false;this.retry=0;this.demoIndex=0;this.lastRemote=0;this.isLocal=false;
    this.channel=new BroadcastChannel('xom-online-live-demo-v1');this.leader=false;this.state=null;
    this.channel.onmessage=({data})=>{if(this.remote)return;if(data.command&&this.leader){try{this.localCommand(data.path,data.body);}catch{}}if(data.state&&!this.leader){this.state=data.state;this.onState(this.state);}};
    // Web Locks elects one DEMO simulation across game and dashboard tabs.
    if(navigator.locks)navigator.locks.request('xom-demo-leader',{mode:'exclusive'},async()=>{if(this.closed)return;this.leader=true;await new Promise(r=>{this.release=r;});});else this.leader=true;
    this.timer=setInterval(()=>{if(!this.remote&&this.holdLive&&this.state){this.onState({...this.state,connection:'disconnected',liveEvidence:{...this.state.liveEvidence,verified:false}});return;}if(!this.remote&&this.leader){this.world.tick();const s={...this.world.snapshot(),connection:this.world.mode==='LIVE'?'disconnected':'demo-local',logs:[]};this.state=s;this.onState(s);this.channel.postMessage({state:s});}},100);
    this.ready=this.probe();
  }
  async probe(){
    if(location.hostname!=='127.0.0.1')return;
    try{const response=await fetch('/api/state',{signal:AbortSignal.timeout(2500)});if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))return;const s=await response.json();if(!Array.isArray(s.users)||!s.connection)return;this.isLocal=true;this.remote=true;this.state=s;this.onState(s);this.connect();}catch{}
  }
  connect(){if(this.closed)return;const ws=new WebSocket(`ws://${location.host}/ws`);this.ws=ws;
    ws.onmessage=e=>{try{const s=JSON.parse(e.data);if(!Array.isArray(s.users))return;this.remote=true;this.holdLive=false;this.retry=0;this.lastRemote=Date.now();this.state=s;this.onState(s);}catch{}};
    ws.onerror=()=>{};ws.onclose=()=>{if(this.closed)return;this.remote=false;
      // Never replace disconnected LIVE with a synthetic running DEMO silently.
      if(this.state?.mode==='LIVE')this.holdLive=true;
      this.retryTimer=setTimeout(()=>this.connect(),Math.min(15000,1000*2**this.retry++));};
  }
  async command(path,body={}) {
    await this.ready;
    if(this.remote||this.isLocal){const res=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw Error(data.error||'Thao tác thất bại');return;}
    if(['connect','disconnect'].includes(path)||path==='mode'&&body.mode!=='DEMO')throw Error('LIVE cần cầu nối Windows: chạy START-XOM.bat và mở http://127.0.0.1:3210/admin.');
    if(!this.leader){this.channel.postMessage({command:true,path,body});return;}
    this.localCommand(path,body);
  }
  localCommand(path,body) {
    if(path==='connect'||path==='disconnect')throw Error('LIVE cần cầu nối Windows. Mở http://127.0.0.1:3210/admin sau khi chạy START-XOM.bat.');
    if(path==='mode'){if(body.mode!=='DEMO')throw Error('Trang tĩnh chỉ hỗ trợ DEMO. LIVE cần cầu nối local.');this.world.reset('DEMO');clearInterval(this.auto);}
    if(path==='restart'){this.world.reset('DEMO');clearInterval(this.auto);}
    if(path==='sound')this.world.sound=Boolean(body.enabled);
    if(path==='demo'&&this.world.mode==='DEMO'){
      if(body.action==='auto'){clearInterval(this.auto);if(body.enabled)this.auto=setInterval(()=>this.world.enqueue(demoEvent('join',++this.demoIndex)),2000);return;}
      for(let i=0;i<Math.min(100,Number(body.amount)||1);i++)this.world.enqueue(demoEvent(body.type||'join',body.type==='join'?++this.demoIndex:Math.max(1,Number(body.viewer)||1),body.giftName||'Rose',body.count||1));
    }
  }
  close(){this.closed=true;clearInterval(this.timer);clearInterval(this.auto);clearTimeout(this.retryTimer);this.ws?.close();this.release?.();this.channel.close();}
}
