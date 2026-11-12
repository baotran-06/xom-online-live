import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {World,demoEvent} from '../frontend/js/core.js';
import {root,settings,gifts,host,port} from './config.js';
import {attachWebSocket} from './websocket.js';
import {TikTokBridge} from './tiktok.js';
export function createApp(options={}) {
  const world=new World(settings,gifts);const logs=[];let connection='disconnected';let demoIndex=0;let auto=null;let busy=false;
  const controlToken=randomBytes(32).toString('hex');
  const log=message=>{logs.unshift({at:Date.now(),message});logs.length=Math.min(logs.length,60);};
  const bridge=new TikTokBridge(e=>world.enqueue(e),s=>{connection=s;},log,options.loader);
  const json=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
  const frontend=resolve(fileURLToPath(new URL('frontend/',root)));
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://127.0.0.1:*; img-src 'self' data:; frame-ancestors 'self'; object-src 'none'; base-uri 'none'");
    if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host||'')){json(res,403,{error:'Chỉ dùng địa chỉ 127.0.0.1'});return;}
    let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{json(res,400,{error:'URL không hợp lệ'});return;}
    if(pathname.startsWith('/api/')) {
      if(req.method==='GET'&&pathname==='/api/state'){json(res,200,{...world.snapshot(),connection,logs});return;}
      const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('xom_control='))?.slice(12)||'';
      const expected=`http://${req.headers.host}`;
      if(req.method!=='POST'||req.headers.origin!==expected||!/^[a-f0-9]{64}$/.test(cookie)||!timingSafeEqual(Buffer.from(cookie),Buffer.from(controlToken))){json(res,403,{error:'Mở bảng điều khiển từ máy này; yêu cầu bị từ chối.'});return;}
      if(req.headers['content-type']!=='application/json'){json(res,415,{error:'Cần application/json'});return;}
      let body='';try{for await(const chunk of req){body+=chunk;if(body.length>4096){json(res,413,{error:'Yêu cầu quá lớn'});return;}}body=JSON.parse(body||'{}');}catch{json(res,400,{error:'JSON không hợp lệ'});return;}
      if(busy){json(res,409,{error:'Đang chuyển kết nối, chờ giây lát'});return;}
      try {
        if(pathname==='/api/connect') {
          const username=String(body.username||'').replace(/^@/,'');if(!/^[a-zA-Z0-9_.]{1,40}$/.test(username)){json(res,400,{error:'Username TikTok không hợp lệ'});return;}
          busy=true;clearInterval(auto);auto=null;await bridge.stop();world.reset('LIVE');
          void bridge.start(username).finally(()=>{busy=false;});json(res,202,{ok:true});return;
        }
        if(pathname==='/api/disconnect'){busy=true;await bridge.stop();busy=false;}
        else if(pathname==='/api/mode') {
          if(!['DEMO','LIVE'].includes(body.mode)){json(res,400,{error:'Chế độ không hợp lệ'});return;}
          busy=true;await bridge.stop();clearInterval(auto);auto=null;world.reset(body.mode);busy=false;
        } else if(pathname==='/api/restart'){busy=true;await bridge.stop();clearInterval(auto);auto=null;world.reset('DEMO');logs.length=0;busy=false;}
        else if(pathname==='/api/sound')world.sound=Boolean(body.enabled);
        else if(pathname==='/api/demo'){
          if(world.mode!=='DEMO'){json(res,409,{error:'LIVE không nhận sự kiện DEMO'});return;}
          if(body.action==='auto') {
            clearInterval(auto);auto=null;if(body.enabled){auto=setInterval(()=>{const i=++demoIndex;world.enqueue(demoEvent('join',i));if(i%3===0)world.enqueue(demoEvent('gift',Math.max(1,i-1),'Beer',i%12+1));},2000);auto.unref();}
          } else {
            const amount=Math.max(1,Math.min(100,Number(body.amount)||1));
            const allowed=['join','like','follow','gift'];const type=allowed.includes(body.type)?body.type:'join';
            for(let i=0;i<amount;i++)world.enqueue(demoEvent(type,type==='join'?++demoIndex:Math.max(1,Math.min(demoIndex,Number(body.viewer)||1)),String(body.giftName||'Rose'),Number(body.count)||1));
          }
        }else {json(res,404,{error:'Không tìm thấy lệnh'});return;}
        json(res,200,{ok:true});
      }catch{busy=false;log('Lỗi điều khiển cầu nối.');json(res,500,{error:'Không thực hiện được thao tác'});}return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const page=pathname==='/'?'index.html':pathname==='/admin'?'admin.html':pathname.replace(/^\//,'');
    const path=resolve(frontend,page);if(!path.startsWith(frontend+sep)){res.writeHead(403);res.end();return;}
    try {
      const data=await readFile(path);
      if(page==='admin.html')res.setHeader('Set-Cookie',`xom_control=${controlToken}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=43200`);
      res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
    }catch{res.writeHead(404);res.end('Không tìm thấy tài nguyên');}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;server.maxConnections=50;
  const sockets=attachWebSocket(server,world,()=>connection);
  const tick=setInterval(()=>{world.tick();sockets.broadcast();},settings.tickMs);tick.unref();
  return {server,world,bridge,close:async()=>{clearInterval(tick);clearInterval(auto);await bridge.stop();sockets.close();server.closeAllConnections();await new Promise(r=>server.close(r));}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const app=createApp();app.server.listen(port,host,()=>console.log(`XÓM ONLINE LIVE\nGame: http://${host}:${port}/\nĐiều khiển: http://${host}:${port}/admin`));
  app.server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Cổng đang bận. Đóng cửa sổ cầu nối cũ hoặc đặt PORT khác.':'Không khởi chạy được cầu nối.');process.exitCode=1;});
  for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await app.close();process.exit(0);});
}
