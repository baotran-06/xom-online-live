import {WebSocketServer,WebSocket} from 'ws';
export function attachWebSocket(server,world,getStatus,getEvidence=()=>({verified:false,receivedEvents:0,lastEventAt:null})) {
  const wss=new WebSocketServer({noServer:true,maxPayload:1024,perMessageDeflate:false});
  server.on('upgrade',(req,socket,head)=>{
    const origin=req.headers.origin;
    if(req.url!=='/ws'||(origin&&origin!==`http://${req.headers.host}`)||!/^127\.0\.0\.1:\d+$/.test(req.headers.host||'')){socket.destroy();return;}
    if(wss.clients.size>=20){socket.destroy();return;}
    wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
  });
  wss.on('connection',ws=>{ws.alive=true;ws.on('error',()=>{});ws.on('pong',()=>{ws.alive=true;});ws.send(JSON.stringify({...world.snapshot(),connection:getStatus(),liveEvidence:getEvidence()}));});
  const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},30000);heartbeat.unref();
  return {
    broadcast(){const text=JSON.stringify({...world.snapshot(),connection:getStatus(),liveEvidence:getEvidence()});for(const ws of wss.clients){if(ws.bufferedAmount>1048576){ws.terminate();continue;}if(ws.readyState===WebSocket.OPEN)ws.send(text);}},
    close(){clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();wss.close();}
  };
}
