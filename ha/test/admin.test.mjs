import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, readFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync, randomBytes} from 'node:crypto';
import {createHAApp} from '../admin.mjs';
import {Store, TTL} from '../../src/store.mjs';
const key = () => generateKeyPairSync('ec',{namedCurve:'prime256v1'}).publicKey.export({format:'der',type:'spki'}).toString('base64');
async function fixture(options={}) {
  const dir=mkdtempSync(join(tmpdir(),'mesh-ha-')),file=join(dir,'relay.json');
  const app=createHAApp({file,relayHost:'127.0.0.1',relayPort:0,allowedIPs:['127.0.0.1'],...options});
  await app.start({adminHost:'127.0.0.1',adminPort:0});
  const url=`http://127.0.0.1:${app.admin.address().port}`;
  return {app,file,url,async close(){await app.close();rmSync(dir,{recursive:true,force:true});}};
}
async function json(f,path,{data,csrf,headers={}}={}) {
  const response=await fetch(f.url+path,data===undefined?{headers}:{method:'POST',headers:{'Content-Type':'application/json',...(csrf?{'X-MeshTeam-CSRF':csrf}:{}),...headers},body:JSON.stringify(data)});
  return {status:response.status,body:await response.json(),headers:response.headers};
}
const setup={origin:'https://relay.example.com',name:'Team',owner:'Thomas'};
async function initialize(f) {
  const {body:{csrf}}=await json(f,'/api/session');
  assert.equal((await json(f,'/api/setup',{csrf,data:setup})).status,201);
  return csrf;
}
test('unconfigured ingress UI uses relative assets and no public relay',async()=>{
  const f=await fixture();try{
    const r=await fetch(f.url+'/');assert.equal(r.status,200);const html=await r.text();
    assert.match(html,/href="style.css"/);assert.match(html,/src="app.js"/);
    assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'self'/);
    const s=await json(f,'/api/status');assert.equal(s.body.configured,false);assert.equal(f.app.relay,null);assert.equal(existsSync(f.file),false);
  }finally{await f.close();}
});
test('socket source is authoritative: spoofed forwarded IP cannot access admin',async()=>{
  const f=await fixture({allowedIPs:['172.30.32.2']});try{
    const r=await json(f,'/api/status',{headers:{'X-Forwarded-For':'172.30.32.2','X-Remote-User-Id':'admin'}});assert.equal(r.status,403);
  }finally{await f.close();}
});
test('CSRF and JSON requirements reject setup without writes',async()=>{
  const f=await fixture();try{
    assert.equal((await json(f,'/api/setup',{data:setup})).status,403);
    assert.equal((await json(f,'/api/setup',{data:setup,csrf:'x'.repeat(43)})).status,403);
    const {body:{csrf}}=await json(f,'/api/session');
    assert.equal((await json(f,'/api/setup',{data:setup,csrf,headers:{'Content-Type':'text/plain'}})).status,400);
    assert.equal((await json(f,'/api/setup',{data:{...setup,origin:'http://unsafe.local'},csrf})).status,400);
    assert.equal(existsSync(f.file),false);
  }finally{await f.close();}
});
test('bootstrap remains memory-only; status excludes invite and hashes; enrollment clears QR',async()=>{
  const f=await fixture();try{
    const csrf=await initialize(f),r=await json(f,'/api/bootstrap');assert.equal(r.status,200);
    const uri=new URL(r.body.uri),invite=uri.searchParams.get('invite');assert.equal(uri.hash,'');assert.match(r.body.qr,/^data:image\/png;base64,/);
    const saved=readFileSync(f.file,'utf8');assert.ok(!saved.includes(invite));assert.ok(!saved.includes(r.body.uri));
    const status=await json(f,'/api/status');assert.ok(!JSON.stringify(status.body).includes(invite));assert.ok(!JSON.stringify(status.body).includes('tokenHash'));
    const store=new Store(f.file);store.enroll(invite,key(),randomBytes(32).toString('base64url'));
    assert.equal((await json(f,'/api/bootstrap')).status,404);
    assert.equal((await json(f,'/api/renew',{csrf,data:{}})).status,409);
    assert.equal((await json(f,'/api/setup',{csrf,data:setup})).status,409);
  }finally{await f.close();}
});
test('expired bootstrap is removed with monotonic time even after wall rollback',async()=>{
  let wall=1800000000000,mono=1000;const f=await fixture({now:()=>wall,mono:()=>mono});try{
    const csrf=await initialize(f);assert.equal((await json(f,'/api/bootstrap')).status,200);
    wall-=60000;mono+=TTL;
    assert.equal((await json(f,'/api/bootstrap')).status,404);
    assert.equal((await json(f,'/api/status')).body.bootstrapAvailable,false);
    assert.equal((await json(f,'/api/renew',{csrf,data:{}})).status,200);
    assert.equal((await json(f,'/api/bootstrap')).status,200);
  }finally{await f.close();}
});
test('renewal invalidates old unused invitation and does not replace group ID',async()=>{
  const f=await fixture();try{
    const csrf=await initialize(f),first=(await json(f,'/api/bootstrap')).body;
    const group=new Store(f.file).state.groupId;
    assert.equal((await json(f,'/api/renew',{csrf,data:{}})).status,200);
    const second=(await json(f,'/api/bootstrap')).body;assert.notEqual(first.uri,second.uri);
    const store=new Store(f.file);assert.equal(store.state.groupId,group);
    assert.throws(()=>store.enroll(new URL(first.uri).searchParams.get('invite'),key(),randomBytes(32).toString('base64url')));
  }finally{await f.close();}
});
test('member revocation requires confirmation and cannot revoke owner',async()=>{
  const f=await fixture();try{
    const csrf=await initialize(f),bootstrap=(await json(f,'/api/bootstrap')).body;
    const store=new Store(f.file),owner=store.enroll(new URL(bootstrap.uri).searchParams.get('invite'),key(),randomBytes(32).toString('base64url'));
    const invitation=store.invite(owner.token,'Member'),member=store.enroll(invitation.invite,key(),randomBytes(32).toString('base64url'));
    assert.equal((await json(f,'/api/revoke',{csrf,data:{id:member.id}})).status,400);
    assert.equal((await json(f,'/api/revoke',{csrf,data:{id:owner.id,confirm:true}})).status,409);
    assert.equal((await json(f,'/api/revoke',{csrf,data:{id:member.id,confirm:true}})).status,200);assert.equal(store.auth(member.token),null);
    assert.equal((await json(f,'/api/status')).body.members.length,1);
  }finally{await f.close();}
});
test('unknown or traversal routes never expose source, options or registry',async()=>{
  const f=await fixture();try{
    for(const path of ['/data/relay.json','/api/../main.mjs','/ha/main.mjs','/%2e%2e/src/store.mjs','/api/status?dump=1'])assert.equal((await fetch(f.url+path)).status,404);
  }finally{await f.close();}
});
test('restarted runtime restores group but never recovers original bootstrap secret',async()=>{
  const f=await fixture();let second;try{
    await initialize(f);const origin=(await json(f,'/api/status')).body.origin;await f.app.close();
    second=createHAApp({file:f.file,relayHost:'127.0.0.1',relayPort:0,allowedIPs:['127.0.0.1']});await second.start({adminHost:'127.0.0.1',adminPort:0});
    const view={url:`http://127.0.0.1:${second.admin.address().port}`};
    assert.equal((await json(view,'/api/status')).body.origin,origin);assert.equal((await json(view,'/api/bootstrap')).status,404);
  }finally{if(second)await second.close();await f.close();}
});

test('reset requires CSRF and exact current group confirmation, disconnects runtime and allows a fresh group',async()=>{
 const f=await fixture();try{
  const csrf=await initialize(f),status=(await json(f,'/api/status')).body;
  const data={confirm:true,groupId:status.groupId,name:status.groupName};
  assert.equal((await json(f,'/api/reset',{data})).status,403);
  assert.equal((await json(f,'/api/reset',{csrf,data:{...data,name:'wrong'}})).status,409);
  assert.equal((await json(f,'/api/reset',{csrf,data:{...data,groupId:'0000000000000000'}})).status,409);
  assert.equal(existsSync(f.file),true);
  assert.equal((await json(f,'/api/reset',{csrf,data})).status,200);
  assert.equal(existsSync(f.file),false);assert.equal(f.app.relay,null);
  assert.equal((await json(f,'/api/status')).body.configured,false);
  assert.equal((await json(f,'/api/bootstrap')).status,404);
  assert.equal((await json(f,'/api/setup',{csrf,data:setup})).status,201);
  assert.notEqual((await json(f,'/api/status')).body.groupId,status.groupId);
 }finally{await f.close();}
});

test('HA selection scopes QR, renewal and reset while other groups stay running',async()=>{
 const f=await fixture();try{
  const csrf=await initialize(f),a=(await json(f,'/api/status')).body;
  const b=await json(f,'/api/groups',{csrf,data:{...setup,name:'Second'}});assert.equal(b.status,201);
  const aid=a.groupId,bid=b.body.groupId;
  const status=(await json(f,'/api/status')).body;assert.equal(status.groups.length,2);assert.equal(status.configured,false);
  assert.equal((await json(f,'/api/renew',{csrf,data:{}})).status,409);
  const bstatus=(await json(f,'/api/status?group='+bid)).body;assert.equal(bstatus.groupName,'Second');
  const qa=(await json(f,'/api/bootstrap?group='+aid)).body,qb=(await json(f,'/api/bootstrap?group='+bid)).body;assert.notEqual(qa.uri,qb.uri);
  assert.equal((await json(f,'/api/reset?group='+bid,{csrf,data:{confirm:true,groupId:aid,name:a.groupName}})).status,409);
  assert.equal((await json(f,'/api/reset?group='+aid,{csrf,data:{confirm:true,groupId:aid,name:a.groupName}})).status,200);
  assert.equal(f.app.relay.groups.size,1);assert.equal((await json(f,'/api/status?group='+bid)).body.running,true);
  assert.equal((await json(f,'/api/bootstrap?group='+bid)).body.uri,qb.uri);
  assert.equal((await json(f,'/api/status?group='+aid)).status,404);
 }finally{await f.close();}
});
