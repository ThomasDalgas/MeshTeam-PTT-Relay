import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';import{generateKeyPairSync,randomUUID,randomBytes,createCipheriv,createDecipheriv}from'node:crypto';import{once}from'node:events';import{WebSocket}from'ws';import{Store}from'../src/store.mjs';import{createRelay}from'../src/server.mjs';
const key=()=>generateKeyPairSync('ec',{namedCurve:'prime256v1'}).publicKey.export({format:'der',type:'spki'}).toString('base64');
async function fixture(options={}){const dir=mkdtempSync(join(tmpdir(),'mesh-relay-server-')),file=join(dir,'relay.json');const invitation=Store.init(file,{origin:'https://relay.example.com',name:'Team',owner:'Owner'}),store=new Store(file);const app=createRelay({store,...options});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const url=`http://127.0.0.1:${app.server.address().port}`;return{app,store,invitation,url,async close(){await app.close();rmSync(dir,{recursive:true,force:true});}};}
async function post(f,path,data,token){const r=await fetch(f.url+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});return{status:r.status,body:await r.json()};}
function socket(f,token,protocol='3'){const ws=new WebSocket(f.url.replace('http:','ws:')+'/ptt',{headers:{Authorization:'Bearer '+token,'X-PTT-Protocol':protocol}});ws.messages=[];ws.on('message',data=>ws.messages.push(JSON.parse(data)));ws.on('error',()=>{});return ws;}
async function until(predicate){const deadline=Date.now()+2000;while(!predicate()){if(Date.now()>deadline)throw Error('Timed out');await new Promise(r=>setTimeout(r,5));}}
test('HTTP enroll/auth and real WebSocket ciphertext deferred delivery + ack',async()=>{const f=await fixture();try{
  const owner=await post(f,'/v1/enroll',{invite:f.invitation.invite,deviceKey:key(),enrollmentNonce:"N".repeat(43)});assert.equal(owner.status,200);
  const unauthorized=await post(f,'/v1/invites',{name:'B'});assert.equal(unauthorized.status,401);
  const invite=await post(f,'/v1/invites',{name:'B'},owner.body.token),member=await post(f,'/v1/enroll',{invite:invite.body.invite,deviceKey:key(),enrollmentNonce:"N".repeat(43)});assert.equal(member.status,200);
  const a=socket(f,owner.body.token);await until(()=>a.messages.some(e=>e.type==='hello'));
  const id=Date.now()+'-'+randomUUID();a.send(JSON.stringify({type:'begin',id}));await until(()=>a.messages.some(e=>e.type==='grant'));
  const grant=a.messages.find(e=>e.type==='grant'),audioKey=randomBytes(32),plain=Buffer.alloc(1280,0);
  const aad=(seq,isEnd)=>Buffer.from(`teamptt-v1|${id}|${grant.sender}|${grant.order}|${seq}|${isEnd?'end':'audio'}`);
  const encrypt=(bytes,seq,isEnd)=>{const nonce=randomBytes(12),c=createCipheriv('aes-256-gcm',audioKey,nonce);c.setAAD(aad(seq,isEnd));return Buffer.concat([nonce,c.update(bytes),c.final(),c.getAuthTag()]).toString('base64');};
  const decrypt=(encoded,seq,isEnd)=>{const packet=Buffer.from(encoded,'base64'),c=createDecipheriv('aes-256-gcm',audioKey,packet.subarray(0,12));c.setAAD(aad(seq,isEnd));c.setAuthTag(packet.subarray(-16));return Buffer.concat([c.update(packet.subarray(12,-16)),c.final()]);};
  const data=encrypt(plain,0,false),end=encrypt(Buffer.alloc(0),1,true);
  a.send(JSON.stringify({type:'frame',id,seq:0,data}));a.send(JSON.stringify({type:'end',id,seq:1,data:end}));await until(()=>a.messages.some(e=>e.type==='accepted'));
  const b=socket(f,member.body.token);await until(()=>b.messages.some(e=>e.type==='backlog'&&e.messages.length===1));
  b.send(JSON.stringify({type:'fetch',id}));await until(()=>b.messages.some(e=>e.type==='deferred'));
  const delivery=b.messages.find(e=>e.type==='deferred');assert.deepEqual(delivery.frames,[data]);assert.deepEqual(decrypt(delivery.frames[0],0,false),plain);assert.equal(decrypt(delivery.end,1,true).length,0);assert.throws(()=>decrypt(delivery.frames[0],1,false));b.send(JSON.stringify({type:'received',id}));await until(()=>f.app.room.messages.size===0);
  a.terminate();b.terminate();
}finally{await f.close();}});
test('authenticated reconnect replaces stale socket; wrong protocol and directed sends rejected',async()=>{const f=await fixture();try{
  const owner=f.store.enroll(f.invitation.invite,key(),"N".repeat(43)),wrong=socket(f,owner.token,'2');await once(wrong,'error');
  const a=socket(f,owner.token);await until(()=>a.messages.some(e=>e.type==='hello'));const duplicate=socket(f,owner.token);await until(()=>duplicate.messages.some(e=>e.type==='hello'));await until(()=>a.readyState===WebSocket.CLOSED);
  duplicate.send(JSON.stringify({type:'begin',id:Date.now()+'-'+randomUUID(),recipients:['private-target']}));await until(()=>duplicate.messages.some(e=>e.type==='error'));assert.equal(f.app.room.active.size,0);duplicate.terminate();
}finally{await f.close();}});
test('oversized body and invalid token rejected without enrollment',async()=>{const f=await fixture();try{const r=await post(f,'/v1/enroll',{invite:'x'.repeat(3000),deviceKey:key(),enrollmentNonce:"N".repeat(43)});assert.equal(r.status,400);assert.equal(f.store.roster().length,0);const profile=await fetch(f.url+'/v1/profile',{headers:{Authorization:'Bearer invalid'}});assert.equal(profile.status,401);}finally{await f.close();}});
test('HTTP rejects missing enrollment nonce without consuming invitation',async()=>{const f=await fixture();try{const deviceKey=key();const missing=await post(f,'/v1/enroll',{invite:f.invitation.invite,deviceKey});assert.equal(missing.status,400);assert.equal(f.store.roster().length,0);const valid=await post(f,'/v1/enroll',{invite:f.invitation.invite,deviceKey,enrollmentNonce:'N'.repeat(43)});assert.equal(valid.status,200);const stolen=await post(f,'/v1/enroll',{invite:f.invitation.invite,deviceKey,enrollmentNonce:'X'.repeat(43)});assert.equal(stolen.status,400);assert.ok(f.store.auth(valid.body.token));}finally{await f.close();}});

test('private telemetry tracks stream lifecycle, monotonic RTT and bounded queue without audio data',async()=>{
 let clock=1000;const f=await fixture({mono:()=>clock,heartbeatMs:20});let a;
 try{
  const owner=f.store.enroll(f.invitation.invite,key(),'N'.repeat(43));
  const invite=f.store.invite(owner.token,'Listener');f.store.enroll(invite.invite,key(),'N'.repeat(43));
  a=new WebSocket(f.url.replace('http:','ws:')+'/ptt',{autoPong:false,headers:{Authorization:'Bearer '+owner.token,'X-PTT-Protocol':'3'}});
  a.messages=[];a.on('message',raw=>a.messages.push(JSON.parse(raw)));a.on('ping',data=>{clock+=7;a.pong(data);});
  await until(()=>a.messages.some(e=>e.type==='hello'));
  assert.equal(f.app.telemetry().connections.find(c=>c.id===owner.id).rttMs,null);
  await until(()=>f.app.telemetry().connections.find(c=>c.id===owner.id).rttMs===7);
  const id=Date.now()+'-'+randomUUID();a.send(JSON.stringify({type:'begin',id}));
  await until(()=>f.app.telemetry().speakers.length===1);
  clock+=40;const data=Buffer.alloc(352).toString('base64');a.send(JSON.stringify({type:'frame',id,seq:0,data}));
  await until(()=>f.app.telemetry().traffic.receivedFrames===1);
  const live=f.app.telemetry();assert.equal(live.speakers[0].id,owner.id);assert.equal(live.speakers[0].codec,'ADPCM');assert.equal(live.speakers[0].codecEvidence,'packet-size estimate');assert.equal(live.speakers[0].frames,1);
  assert.ok(live.queue.oldestAgeMs>=40);assert.equal(live.queue.bytes,data.length);assert.ok(live.traffic.receivedBytes>data.length);assert.ok(live.traffic.sentBytes>0);
  assert.equal(JSON.stringify(live).includes(data),false);assert.equal(live.connections.find(c=>c.id!==owner.id).lastSeenAt,null);
  assert.deepEqual(await (await fetch(f.url+'/health')).json(),{status:'ok',protocol:3});
  assert.equal((await fetch(f.url+'/api/status')).status,401);
  a.send(JSON.stringify({type:'end',id,seq:1,data:Buffer.alloc(28).toString('base64')}));
  await until(()=>f.app.telemetry().traffic.completedUtterances===1);
  assert.equal(f.app.telemetry().speakers.length,0);assert.equal(f.app.telemetry().queue.completedMessages,1);
  const next=Date.now()+'-'+randomUUID();a.send(JSON.stringify({type:'begin',id:next}));await until(()=>f.app.telemetry().speakers.length===1);
  clock+=5001;assert.equal(f.app.telemetry().speakers.length,0);
  a.terminate();await until(()=>!f.app.telemetry().connections.find(c=>c.id===owner.id).online);
  const offline=f.app.telemetry().connections.find(c=>c.id===owner.id);assert.equal(offline.rttMs,null);assert.equal(offline.connectedForMs,null);assert.ok(offline.lastSeenAt>0);
  clock+=16*60000;assert.equal(f.app.telemetry().queue.messages,0);assert.equal(f.app.telemetry().queue.bytes,0);
 }finally{a?.terminate();await f.close();}
});

test('profile events sync roster and extended capture is negotiated around legacy peers',async()=>{
 const f=await fixture();let a,b;try{
 const owner=f.store.enroll(f.invitation.invite,key(),'N'.repeat(43));const invitation=f.store.invite(owner.token,'Invite label');const member=f.store.enroll(invitation.invite,key(),'N'.repeat(43));
 a=new WebSocket(f.url.replace('http:','ws:')+'/ptt',{headers:{Authorization:'Bearer '+owner.token,'X-PTT-Protocol':'3','X-PTT-Extended-Live':'1'}});a.messages=[];a.on('message',raw=>a.messages.push(JSON.parse(raw)));
 await until(()=>a.messages.some(e=>e.type==='hello'));
 a.send(JSON.stringify({type:'profile',name:'Phone name'}));await until(()=>f.store.roster().find(m=>m.id===owner.id).name==='Phone name');
 let id=Date.now()+'-'+randomUUID();a.send(JSON.stringify({type:'begin',id}));await until(()=>a.messages.some(e=>e.type==='grant'&&e.id===id));assert.equal(a.messages.find(e=>e.type==='grant'&&e.id===id).maxFrames,1000000000);a.send(JSON.stringify({type:'cancel'}));await until(()=>f.app.room.active.size===0);
 b=socket(f,member.token);await until(()=>b.messages.some(e=>e.type==='hello'));assert.equal(b.messages.find(e=>e.type==='hello').participants.find(m=>m.id===owner.id).name,'Phone name');
 id=Date.now()+'-'+randomUUID();a.send(JSON.stringify({type:'begin',id}));await until(()=>a.messages.some(e=>e.type==='grant'&&e.id===id));assert.equal(a.messages.find(e=>e.type==='grant'&&e.id===id).maxFrames,750);
 }finally{a?.terminate();b?.terminate();await f.close();}
});
