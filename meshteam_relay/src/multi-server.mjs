import http from 'node:http';
import https from 'node:https';
import {createRelay} from './server.mjs';
const bearer=req=>/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization??'')?.[1]??'';
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
/** Route only by verified membership/invitation, never by an untrusted group ID. */
export function createMultiRelay({registry,tlsOptions,now=Date.now,...options}){
 const groups=new Map(),limits=new Map();let closing=false;
 function add(store){const id=store.state.groupId;if(groups.has(id))throw Error('Duplicate group');const relay=createRelay({store,now,...options});groups.set(id,relay);return relay;}
 for(const store of registry.stores.values())add(store);
 function rate(req){const key=req.socket.remoteAddress,t=now();let item=limits.get(key);if(!item||t-item.at>=60000){if(!item&&limits.size>=1024)return false;limits.set(key,item={at:t,count:0});}return ++item.count<=180;}
 const timer=setInterval(()=>{for(const [key,v] of limits)if(now()-v.at>=60000)limits.delete(key);},60000);timer.unref();
 const handler=async(req,res)=>{
  try {
   if(closing){json(res,503,{error:'Unavailable'});req.resume();return;}
   if(req.method==='GET'&&req.url==='/health'){json(res,200,{status:'ok',protocol:3});return;}
   if(req.headers.origin||!rate(req)){json(res,403,{error:'Request rejected'});req.resume();return;}
   if(req.method==='POST'&&req.url==='/v1/enroll'){
    if(req.headers['content-type']?.split(';')[0]!=='application/json')throw Error('JSON required');
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>2048)throw Error('Too large');chunks.push(chunk);}
    const e=JSON.parse(Buffer.concat(chunks).toString('utf8')),store=registry.forInvite(e?.invite);
    if(!store)throw Error('Invalid invitation');
    const result=store.enroll(e.invite,e.deviceKey,e.enrollmentNonce);
    groups.get(store.state.groupId).room.broadcastMembers();json(res,200,result);return;
   }
   const store=registry.forToken(bearer(req)),relay=store&&groups.get(store.state.groupId);
   if(!relay){json(res,401,{error:'Authentication required'});req.resume();return;}
   relay.server.emit('request',req,res);
  }catch{if(!res.headersSent)json(res,400,{error:'Request rejected'});else res.end();req.resume();}
 };
 const server=http.createServer(handler),tlsServer=tlsOptions?https.createServer(tlsOptions,handler):null;
 const upgrade=(req,socket,head)=>{try{
  if(closing||req.headers.origin||!rate(req))throw Error('Unavailable');
  const store=registry.forToken(bearer(req)),relay=store&&groups.get(store.state.groupId);
  if(!relay)throw Error('Unauthorized');relay.server.emit('upgrade',req,socket,head);
 }catch{socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');}};
 for(const s of [server,tlsServer].filter(Boolean)){s.on('upgrade',upgrade);s.headersTimeout=10000;s.requestTimeout=10000;s.keepAliveTimeout=5000;}
 return {server,tlsServer,groups,add,async remove(id){const child=groups.get(id);groups.delete(id);if(child)await child.close();},async close(){closing=true;clearInterval(timer);await Promise.all([...groups.values()].map(g=>g.close()));groups.clear();await Promise.all([server,tlsServer].filter(Boolean).map(s=>new Promise(resolve=>s.listening?s.close(resolve):resolve())));}};
}
