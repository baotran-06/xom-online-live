import {Client} from './client.js';
import {Tavern} from './scene.js';
import {mountGuide} from './interactions.js';
import {mountAudio} from './audio.js';
const $=id=>document.getElementById(id);let scene;let lastSeq=0;let state=null;let hideToast;
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(hideToast);hideToast=setTimeout(()=>$('toast').classList.remove('visible'),4500);}
let music;let guide;
mountGuide().then(render=>{guide=render;if(state)guide(state.giftRules);}).catch(()=>toast('Không tải được cấu hình hướng dẫn.'));
mountAudio().then(player=>{music=player;if(state)music.update(state);$('audio-start').onclick=()=>{void player.start();void command('sound',{enabled:true});};$('sfx-enabled').onchange=e=>command('sound',{enabled:e.target.checked});}).catch(()=>toast('Không tải được cấu hình âm thanh.'));
try {scene=new Tavern($('world'));$('loading').hidden=true;}catch(e){$('loading').hidden=true;$('fatal').hidden=false;$('fatal').textContent='Không khởi tạo được WebGL. Bật tăng tốc đồ họa trong trình duyệt rồi tải lại. '+e.message;}
const client=new Client(s=>{
  const changed=state?.mode&&state.mode!==s.mode;if(changed){lastSeq=0;toast('Đã chuyển sang '+s.mode);}
  state=s;scene?.update(s);guide?.(s.giftRules);music?.update(s);$('inside').textContent=s.inside;$('tables').textContent=`${s.tablesUsed} / 7 bàn`;
  $('mode-label').textContent=s.mode==='DEMO'?'DEMO · Dữ liệu mô phỏng':s.connection==='connected'?'LIVE · Sự kiện TikTok thật':'LIVE · Chưa có luồng sự kiện';
  $('status-dot').style.background=s.mode==='LIVE'&&s.connection==='connected'?'#84d6a8':'#efc05e';
  const labels={connected:'Đã nhận sự kiện TikTok LIVE thật','awaiting-event':'Socket TikTok đã mở · chờ sự kiện thật',connecting:'Đang kết nối TikTok…',reconnecting:'Mất kết nối · đang thử lại',ended:'Buổi LIVE đã kết thúc',error:'Lỗi kết nối · mở bảng điều khiển',disconnected:'Cầu nối đang chờ kết nối','demo-local':'DEMO trong trình duyệt · không phải TikTok thật'};
  $('connection-label').textContent=labels[s.connection]||s.connection;$('welcome-demo').hidden=s.mode!=='DEMO';$('sound').textContent=`Âm thanh: ${s.sound?'bật':'tắt'}`;
  const e=s.history[0];if(e){const verbs={join:'vừa ghé xóm. Mời bạn vào bàn!',follow:'vừa follow · cả xóm chào bạn!',like:'vừa thả tim cho xóm!',gift:`gửi ${e.giftName||'quà'} ×${e.count} cho xóm!`,chat:'đang trò chuyện cùng xóm.',leave:'đang chào tạm biệt và rời quán.'};$('ticker-text').textContent=`${s.mode==='DEMO'?'[DEMO] ':''}${e.user.name} ${verbs[e.type]||''}${s.waiting?' · '+s.waiting+' khách đang chờ bàn':''}`;}
  const f=s.lastEffect;if(f&&f.seq!==lastSeq&&f.until>s.serverTime){lastSeq=f.seq;const labels={flowers:'nhận một bó hoa 🌷',wave:'vẫy chào cả xóm 👋',cheers:'mời cả xóm nâng ly! 🍻',spotlight:'thắp sáng cả xóm! ✨'};toast(`${s.mode==='DEMO'?'[DEMO] ':''}${f.user} ${labels[f.action]}`);music?.effect(f.action);}
});
async function command(path,body){try{await client.command(path,body);}catch(e){toast(e.message);}}
$('welcome-demo').onclick=async()=>{await client.ready;if(client.isLocal){toast('Mở Điều khiển để mời khách trên cầu nối local.');return;}void command('demo',{type:'join',amount:12});};
$('sound').onclick=async()=>{await music?.start();void command('sound',{enabled:!state?.sound});};
$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('game').requestFullscreen().catch(()=>toast('Trình duyệt chưa cho phép toàn màn hình.'));};
window.addEventListener('pagehide',()=>{client.close();scene?.dispose();music?.dispose();},{once:true});
window.__xom={get state(){return state;},get renderer(){return scene?.renderer;},get scene(){return scene;},get audio(){return music;}};
