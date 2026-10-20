import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,randomBytes,randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {Registry,MAX_GROUPS} from '../src/registry.mjs';
import {Store} from '../src/store.mjs';
import {createMultiRelay} from '../src/multi-server.mjs';
const options={origin:'https://relay.example.com',name:'A',owner:'Owner'};
const key=()=>generateKeyPairSync('ec',{namedCurve:'prime256v1'}).publicKey.export({format:'der',type:'spki'}).toString('base64');
const nonce=()=>randomBytes(32).toString('base64url');
async function until(fn){const deadline=Date.now()+2000;while(!fn()){if(Date.now()>deadline)throw Error('Timeout');await new Promise(r=>setTimeout(r,5));}}
function connect(url,token){const ws=new WebSocket(url.replace('http:','ws:')+'/ptt',{headers:{Authorization:'Bearer '+token,'X-PTT-Protocol':'3'}});ws.events=[];ws.on('message',raw=>ws.events.push(JSON.parse(raw)));ws.on('error',()=>{});return ws;}
test('legacy data preserved, multiple membership persists, group cap bounds resources',()=>{
 const dir=mkdtempSync(join(tmpdir(),'multi-')),file=join(dir,'relay.json');try{
  const legacy=Store.init(file,options),before=readFileSync(file,'utf8'),registry=new Registry(file);
  assert.equal(readFileSync(file,'utf8'),before);
  const b=registry.create({...options,name:'B'}),device=key(),aStore=[...registry.stores.values()][0];
  const a=aStore.enroll(legacy.invite,device,nonce()),bb=b.store.enroll(b.invite,device,nonce());
  assert.equal(a.id,bb.id);assert.notEqual(a.token,bb.token);assert.notEqual(a.groupId,bb.groupId);
  const loaded=new Registry(file);assert.equal(loaded.stores.size,2);assert.equal(loaded.forToken(a.token).state.groupId,a.groupId);assert.equal(loaded.forToken(bb.token).state.groupId,bb.groupId);
  assert.throws(()=>loaded.create({...options,origin:'https://other.example.com'}));
  loaded.remove(a.groupId);assert.equal(loaded.forToken(a.token),null);assert.ok(loaded.forToken(bb.token));
  for(let i=1;i<MAX_GROUPS;i++)loaded.create({...options,name:'Group '+i});
  assert.throws(()=>loaded.create(options));assert.equal(new Registry(file).stores.size,MAX_GROUPS);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('same device in separate rooms: real WS audio, backlog, revocation and deletion never cross groups',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'multi-wire-')),registry=new Registry(join(dir,'relay.json'));
 const a=registry.create(options),b=registry.create({...options,name:'B'}),app=createMultiRelay({registry});let sockets=[];
 try{
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const url='http://127.0.0.1:'+app.server.address().port;
  const post=async(path,data,token)=>{const res=await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});assert.equal(res.status,200);return res.json();};
  const shared=key();
  const aa=await post('/v1/enroll',{invite:a.invite,deviceKey:shared,enrollmentNonce:nonce()});
  const bb=await post('/v1/enroll',{invite:b.invite,deviceKey:shared,enrollmentNonce:nonce()});
  const memberKey=key();
  const ai=await post('/v1/invites',{name:'Second phone'},aa.token),bi=await post('/v1/invites',{name:'Second phone'},bb.token);
  const am=await post('/v1/enroll',{invite:ai.invite,deviceKey:memberKey,enrollmentNonce:nonce()}),bm=await post('/v1/enroll',{invite:bi.invite,deviceKey:memberKey,enrollmentNonce:nonce()});
  const aw=connect(url,aa.token),bw=connect(url,bb.token);sockets.push(aw,bw);
  await until(()=>aw.events.some(e=>e.type==='hello')&&bw.events.some(e=>e.type==='hello'));
  assert.equal(aw.events.find(e=>e.type==='hello').groupId,aa.groupId);assert.equal(bw.events.find(e=>e.type==='hello').groupId,bb.groupId);
  const id=Date.now()+'-'+randomUUID();aw.send(JSON.stringify({type:'begin',id}));await until(()=>aw.events.some(e=>e.type==='grant'));
  aw.send(JSON.stringify({type:'frame',id,seq:0,data:Buffer.alloc(352).toString('base64')}));aw.send(JSON.stringify({type:'end',id,seq:1,data:Buffer.alloc(28).toString('base64')}));await until(()=>aw.events.some(e=>e.type==='accepted'));
  const ar=connect(url,am.token),br=connect(url,bm.token);sockets.push(ar,br);await until(()=>ar.events.some(e=>e.type==='backlog')&&br.events.some(e=>e.type==='backlog'));
  assert.ok(ar.events.find(e=>e.type==='backlog').messages.some(m=>m.id===id));assert.equal(br.events.find(e=>e.type==='backlog').messages.length,0);
  br.send(JSON.stringify({type:'fetch',id}));await until(()=>br.events.some(e=>e.type==='error'));assert.ok(!br.events.some(e=>e.id===id));assert.ok(!bw.events.some(e=>e.id===id));
  a.store.revoke(am.id);assert.equal(registry.forToken(am.token),null);assert.ok(registry.forToken(bm.token));
  registry.remove(aa.groupId);await app.remove(aa.groupId);await until(()=>aw.readyState===WebSocket.CLOSED);
  assert.equal(bw.readyState,WebSocket.OPEN);assert.equal(br.readyState,WebSocket.OPEN);assert.equal(app.groups.get(bb.groupId).room.connected.size,2);
  const profile=await fetch(url+'/v1/profile',{headers:{Authorization:'Bearer '+bb.token}});assert.equal((await profile.json()).groupId,bb.groupId);
 }finally{for(const ws of sockets)ws.terminate();await app.close();rmSync(dir,{recursive:true,force:true});}
});
