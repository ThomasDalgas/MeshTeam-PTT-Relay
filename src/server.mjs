import http from 'node:http';
import https from 'node:https';
import {performance} from 'node:perf_hooks';
import {WebSocketServer,WebSocket} from 'ws';
import {RelayRoom,MAX_MESSAGES} from './room.mjs';

const bearer=req=>/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization??'')?.[1]??'';
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function body(req){
  if(req.headers['content-type']?.split(';')[0]!=='application/json')throw Error('JSON required');
  if(Number(req.headers['content-length']??0)>2048)throw Error('Request too large');
  let chunks=[],length=0;for await(const chunk of req){length+=chunk.length;if(length>2048)throw Error('Request too large');chunks.push(chunk);}
  const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!value||Array.isArray(value)||typeof value!=='object')throw Error('JSON object required');return value;
}
export function createRelay({store,now=Date.now,heartbeatMs=15000,mono=()=>performance.now(),tlsOptions}){
  const sockets=new Map(),limits=new Map(),connectionStats=new Map();let closing=false;
  const started=mono(),traffic={receivedBytes:0,sentBytes:0,receivedFrames:0,completedUtterances:0};
  const add=(target,key,value)=>target[key]=Math.min(Number.MAX_SAFE_INTEGER,target[key]+value);
  function seen(stats){stats.lastSeenAt=now();stats.lastSeenMono=mono();}
  let knownMembers=new Set(store.roster().map(m=>m.id));
  function rate(key,max,window=60000){const t=now();let r=limits.get(key);if(!r||t-r.at>=window){if(limits.size>=1024&&!limits.has(key))return false;limits.set(key,r={at:t,count:0});}return ++r.count<=max;}
  const send=(id,event)=>{const ws=sockets.get(id);if(ws?.readyState!==WebSocket.OPEN)return;if(ws.bufferedAmount>2*1024*1024){ws.close(1013,'Slow connection');return;}const payload=JSON.stringify(event),bytes=Buffer.byteLength(payload);ws.send(payload);add(traffic,'sentBytes',bytes);const stats=connectionStats.get(id);if(stats)add(stats,'sentBytes',bytes);};
  const room=new RelayRoom({send,roster:()=>store.roster(),now,mono,canExtend:()=>[...sockets.values()].every(ws=>ws.extendedLive)});
  const requestHandler=async(req,res)=>{
    try{
      if(req.method==='GET'&&req.url==='/health'){json(res,200,{status:'ok',protocol:3});return;}
      if(req.headers.origin){json(res,403,{error:'Native clients only'});return;}
      // Never trust forwarded headers: edge reverse proxy should also rate-limit upstream traffic.
      if(!rate('http:'+req.socket.remoteAddress,60)){json(res,429,{error:'Try later'});req.resume();return;}
      if(req.method==='POST'&&req.url==='/v1/enroll'){
        if(!rate('enroll',30)){json(res,429,{error:'Try later'});req.resume();return;}
        const e=await body(req),result=store.enroll(e.invite,e.deviceKey,e.enrollmentNonce);json(res,200,result);room.broadcastMembers();return;
      }
      const token=bearer(req),member=store.auth(token);
      if(!member){json(res,401,{error:'Authentication required'});req.resume();return;}
      if(req.method==='GET'&&req.url==='/v1/profile'){const s=store.state;json(res,200,{id:member.id,owner:member.owner,groupId:s.groupId,groupName:s.groupName,participants:store.roster()});return;}
      if(req.method==='POST'&&req.url==='/v1/invites'){
        if(!rate('invite:'+member.id,6)){json(res,429,{error:'Try later'});req.resume();return;}
        const e=await body(req);json(res,200,store.invite(token,e.name));return;
      }
      json(res,404,{error:'Not found'});req.resume();
    }catch{if(!res.headersSent)json(res,400,{error:'Request rejected'});else res.end();req.resume();}
  };
  const server=http.createServer(requestHandler);
  const tlsServer=tlsOptions?https.createServer(tlsOptions,requestHandler):null;
  if(tlsServer){tlsServer.headersTimeout=10000;tlsServer.requestTimeout=10000;tlsServer.keepAliveTimeout=5000;}
  server.headersTimeout=10000;server.requestTimeout=10000;server.keepAliveTimeout=5000;
  const wss=new WebSocketServer({noServer:true,maxPayload:4096,perMessageDeflate:false});
  const upgradeHandler=(req,socket,head)=>{
    try{
      if(closing||!rate('upgrade:'+req.socket.remoteAddress,60))throw Error('Unavailable');
      const member=store.auth(bearer(req));
      if(req.url!=='/ptt'||req.headers['x-ptt-protocol']!=='3'||req.headers.origin||!member)throw Error('Unauthorized');
      wss.handleUpgrade(req,socket,head,ws=>{
        // An authenticated reconnect supersedes its own stale TCP connection.
        // Remove it first so late close/message callbacks cannot affect the new session.
        const previous=sockets.get(member.id);
        if(previous){sockets.delete(member.id);room.leave(member.id);previous.terminate();}
        const stats={connectedAt:now(),connectedMono:mono(),lastSeenAt:now(),lastSeenMono:mono(),rttMs:null,rttMono:null,receivedBytes:0,sentBytes:0};
        connectionStats.set(member.id,stats);
        sockets.set(member.id,ws);ws.authToken=bearer(req);ws.extendedLive=req.headers['x-ptt-extended-live']==='1';ws.alive=true;ws.pingSerial=0;
        ws.on('pong',payload=>{ws.alive=true;seen(stats);if(ws.pendingPing&&payload.equals(ws.pendingPing.payload)){stats.rttMs=Math.max(0,mono()-ws.pendingPing.at);stats.rttMono=mono();ws.pendingPing=null;}});ws.on('error',()=>{});
        ws.on('close',()=>{if(sockets.get(member.id)!==ws)return;sockets.delete(member.id);ws.pendingPing=null;try{room.leave(member.id);}catch{}});
        ws.on('message',raw=>{
          if(sockets.get(member.id)!==ws)return;
          try{
            seen(stats);add(stats,'receivedBytes',raw.length);add(traffic,'receivedBytes',raw.length);
            if(!rate('ws:'+member.id,80,1000))throw Error('Rate limit');
            if(!store.auth(bearer(req))){ws.close(1008,'Access revoked');return;}
            const e=JSON.parse(raw.toString());
            if(!e||Array.isArray(e)||typeof e!=='object')throw Error('Invalid event');
            switch(e.type){
              case 'profile':if(!rate('profile:'+member.id,12))throw Error('Profile rate limit');if(store.rename(ws.authToken,e.name))room.broadcastMembers();break;
              case 'begin':if(e.recipients!==undefined&&(!Array.isArray(e.recipients)||e.recipients.length))throw Error('Directed audio unsupported');room.begin(member.id,e.id);break;
              case 'frame':room.frame(member.id,e);add(traffic,'receivedFrames',1);break;
              case 'end':room.end(member.id,e);add(traffic,'completedUtterances',1);break;
              case 'cancel':room.abort(member.id);break;
              case 'received':room.received(member.id,e.id);break;
              case 'fetch':if(!rate('fetch:'+member.id,6,1000))throw Error('Fetch limit');room.fetch(member.id,e.id);break;
              case 'backlog':room.backlog(member.id);break;
              case 'playback_idle':break;
              case 'set_mode':if(e.mode!=='free')send(member.id,{type:'mode_rejected',reason:'Relay v1 supports open conversation only'});break;
              default:throw Error('Unknown event');
            }
          }catch{room.abort(member.id,'Invalid or overloaded stream');send(member.id,{type:'error',reason:'Relay rejected the request'});}
        });
        room.join(member.id,store.state);
      });
    }catch{socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');}
  };
  server.on('upgrade',upgradeHandler);tlsServer?.on('upgrade',upgradeHandler);
  const sweep=setInterval(()=>{
    try{room.sweep();const active=new Set(store.roster().map(m=>m.id));for(const id of knownMembers)if(!active.has(id))room.revoke(id);knownMembers=active;for(const id of connectionStats.keys())if(!active.has(id))connectionStats.delete(id);for(const [id,ws] of sockets)if(!store.auth(ws.authToken))ws.close(1008,'Access revoked');
      for(const [key,v]of limits)if(now()-v.at>=60000)limits.delete(key);
    }catch{for(const ws of sockets.values())ws.close(1011,'Configuration unavailable');}
  },1000);sweep.unref();
  const heartbeat=setInterval(()=>{for(const ws of sockets.values()){if(!ws.alive)ws.terminate();else{ws.alive=false;const payload=Buffer.from(String(++ws.pingSerial));ws.pendingPing={payload,at:mono()};ws.ping(payload);}}},heartbeatMs);heartbeat.unref();
  function telemetry(){
    room.sweep();const t=mono(),roster=store.roster(),names=new Map(roster.map(m=>[m.id,m.name]));
    const messages=[...room.messages.values()];
    return {uptimeMs:Math.max(0,t-started),codecVisibility:'packet-size estimate',
      speakers:[...room.active.values()].map(m=>({id:m.sender,name:names.get(m.sender)??'',speakingForMs:Math.max(0,t-m.monoCreated),frames:m.frameCount,liveOnly:!m.retained,codec:m.frameCount?(m.codecs.size>1?'mixed':m.codecs.has(472)?'ADPCM':'PCM'):null,codecEvidence:'packet-size estimate'})),
      connections:roster.map(m=>{const s=connectionStats.get(m.id),ws=sockets.get(m.id),online=!!ws;const rttAge=s?.rttMono==null?null:Math.max(0,t-s.rttMono);return {id:m.id,online,connectedForMs:online?Math.max(0,t-s.connectedMono):null,lastSeenAt:s?.lastSeenAt??null,lastSeenAgoMs:s?Math.max(0,t-s.lastSeenMono):null,rttMs:online&&rttAge!==null&&rttAge<=heartbeatMs*2?s.rttMs:null,rttAgeMs:online?rttAge:null,receivedBytes:s?.receivedBytes??0,sentBytes:s?.sentBytes??0,bufferedBytes:ws?.bufferedAmount??0};}),
      queue:{messages:messages.length,completedMessages:messages.filter(m=>m.end).length,bytes:room.bytes,maxBytes:room.maxBytes,maxMessages:MAX_MESSAGES,oldestAgeMs:messages.length?Math.max(0,...messages.map(m=>t-m.monoCreated)):null,byteBasis:'base64-ciphertext'},
      traffic:{...traffic,byteBasis:'websocket-json-payload',reset:'relay-restart'},heartbeatMs};
  }
  return {server,tlsServer,room,telemetry,close:()=>new Promise(resolve=>{closing=true;clearInterval(sweep);clearInterval(heartbeat);for(const ws of sockets.values())ws.terminate();room.close();wss.close();Promise.all([server,tlsServer].filter(Boolean).map(s=>new Promise(done=>s.listening?s.close(done):done()))).then(resolve);})};
}
