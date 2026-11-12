import {Client} from './client.js';
import {Tavern} from './scene.js';
const $=id=>document.getElementById(id);let scene;let lastSeq=0;let state=null;let audio=null;let hideToast;
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(hideToast);hideToast=setTimeout(()=>$('toast').classList.remove('visible'),4500);}
function play(action){if(!audio||audio.state!=='running'||!state?.sound)return;const notes=action==='spotlight'?[523,659,784,1046]:action==='flowers'?[880,1174]:[1200,1600];notes.forEach((f,i)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(.06,audio.currentTime+i*.1);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.1+.5);osc.connect(gain);gain.connect(audio.destination);osc.start(audio.currentTime+i*.1);osc.stop(audio.currentTime+i*.1+.5);osc.onended=()=>{osc.disconnect();gain.disconnect();};});}
try {scene=new Tavern($('world'));$('loading').hidden=true;}catch(e){$('loading').hidden=true;$('fatal').hidden=false;$('fatal').textContent='Không khởi tạo được WebGL. Bật tăng tốc đồ họa trong trình duyệt rồi tải lại. '+e.message;}
const client=new Client(s=>{
  const changed=state?.mode&&state.mode!==s.mode;if(changed){lastSeq=0;toast('Đã chuyển sang '+s.mode);}
  state=s;scene?.update(s);$('inside').textContent=s.inside;$('tables').textContent=`${s.tablesUsed} / 7 bàn`;
  $('mode-label').textContent=s.mode==='DEMO'?'DEMO · Dữ liệu mô phỏng':s.connection==='connected'?'LIVE · Sự kiện TikTok thật':'LIVE · Chưa có luồng sự kiện';
  $('status-dot').style.background=s.mode==='LIVE'&&s.connection==='connected'?'#84d6a8':'#efc05e';
  const labels={connected:'Đã kết nối TikTok LIVE',connecting:'Đang kết nối TikTok…',reconnecting:'Mất kết nối · đang thử lại',ended:'Buổi LIVE đã kết thúc',error:'Lỗi kết nối · mở bảng điều khiển',disconnected:'Cầu nối đang chờ kết nối','demo-local':'DEMO trong trình duyệt · không phải TikTok thật'};
  $('connection-label').textContent=labels[s.connection]||s.connection;$('welcome-demo').hidden=s.mode!=='DEMO';$('sound').textContent=`Âm thanh: ${s.sound?'bật':'tắt'}`;
  const e=s.history[0];if(e){const verbs={join:'vừa ghé xóm. Mời bạn vào bàn!',follow:'vừa follow · cả xóm chào bạn!',like:'vừa thả tim cho xóm!',gift:`gửi ${e.giftName||'quà'} ×${e.count} cho xóm!`,chat:'đang trò chuyện cùng xóm.'};$('ticker-text').textContent=`${s.mode==='DEMO'?'[DEMO] ':''}${e.user.name} ${verbs[e.type]||''}${s.waiting?' · '+s.waiting+' khách đang chờ bàn':''}`;}
  const f=s.lastEffect;if(f&&f.seq!==lastSeq&&f.until>s.serverTime){lastSeq=f.seq;const labels={flowers:'nhận một bó hoa 🌷',wave:'vẫy chào cả xóm 👋',cheers:'mời cả xóm nâng ly! 🍻',spotlight:'thắp sáng cả xóm! ✨'};toast(`${s.mode==='DEMO'?'[DEMO] ':''}${f.user} ${labels[f.action]}`);play(f.action);}
});
async function command(path,body){try{await client.command(path,body);}catch(e){toast(e.message);}}
$('welcome-demo').onclick=async()=>{await client.ready;if(client.isLocal){toast('Mở Điều khiển để mời khách trên cầu nối local.');return;}void command('demo',{type:'join',amount:12});};
$('sound').onclick=async()=>{audio??=new AudioContext();await audio.resume();if(client.isLocal){toast('Âm thanh đã sẵn sàng. Bật âm thanh ở trang Điều khiển.');return;}void command('sound',{enabled:!state?.sound});};
$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('game').requestFullscreen().catch(()=>toast('Trình duyệt chưa cho phép toàn màn hình.'));};
window.addEventListener('pagehide',()=>{client.close();scene?.dispose();audio?.close();},{once:true});
window.__xom={get state(){return state;},get renderer(){return scene?.renderer;}};
