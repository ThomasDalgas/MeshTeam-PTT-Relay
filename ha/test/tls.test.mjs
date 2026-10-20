import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import https from 'node:https';
import {generateKeyPairSync,randomBytes} from 'node:crypto';
import {WebSocket} from 'ws';
import {validateTLS,watchTLS,certificateStatus} from '../tls.mjs';
import {createHAApp} from '../admin.mjs';
import {Store} from '../../src/store.mjs';
function certificate(dir,name){
 const key=join(dir,name+'.key'),cert=join(dir,name+'.pem');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost'],{stdio:'ignore'});
 return {key:readFileSync(key,'utf8'),cert:readFileSync(cert,'utf8')};
}
function request(port,path,ca){return new Promise((resolve,reject)=>{
 const req=https.get({host:'127.0.0.1',port,path,servername:'localhost',ca,agent:false},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);
});}
test('TLS health, WSS, isolated admin and certificate renewal fail safely',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'mesh-tls-')),first=certificate(dir,'one'),second=certificate(dir,'two'),file=join(dir,'relay.json'),bundle=join(dir,'bundle.json');
 const init=Store.init(file,{origin:'https://localhost',name:'TLS',owner:'Owner'}),store=new Store(file);
 const key=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).publicKey.export({format:'der',type:'spki'}).toString('base64');
 const member=store.enroll(init.invite,key,randomBytes(32).toString('base64url'));writeFileSync(bundle,JSON.stringify(first));
 let watcher,errors=0,ws;
 const app=createHAApp({file,relayHost:'127.0.0.1',relayPort:0,tlsPort:0,tlsOptions:validateTLS(first,{hostname:'localhost'}),onTLSReady:s=>{watcher=watchTLS(s,bundle,{hostname:'localhost',onError:()=>errors++});}});
 try{
  await app.start({adminHost:'127.0.0.1',adminPort:0});const port=app.relay.tlsServer.address().port;
  assert.equal(await request(port,'/health',first.cert),200);
  assert.equal(await request(port,'/api/status',first.cert),401);
  assert.equal((await fetch(`http://127.0.0.1:${app.admin.address().port}/api/status`)).status,403);
  ws=new WebSocket(`wss://127.0.0.1:${port}/ptt`,{ca:first.cert,servername:'localhost',headers:{Authorization:`Bearer ${member.token}`,'X-PTT-Protocol':'3'}});
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  assert.equal(watcher.status().fingerprint256,certificateStatus(first).fingerprint256);
  writeFileSync(bundle,JSON.stringify(second));assert.equal(watcher.reload(),true);assert.equal(watcher.status().fingerprint256,certificateStatus(second).fingerprint256);assert.equal(watcher.status().reloadHealthy,true);
  assert.equal(await request(port,'/health',second.cert),200);await assert.rejects(request(port,'/health',first.cert));assert.equal(ws.readyState,WebSocket.OPEN);
  writeFileSync(bundle,JSON.stringify({cert:first.cert,key:second.key}));assert.equal(watcher.reload(),false);
  writeFileSync(bundle,'{broken');assert.equal(watcher.reload(),false);assert.equal(errors,2);assert.equal(watcher.status().reloadErrors,2);assert.equal(watcher.status().reloadHealthy,false);assert.equal(watcher.status().fingerprint256,certificateStatus(second).fingerprint256);assert.equal(await request(port,'/health',second.cert),200);
  assert.throws(()=>validateTLS(second,{hostname:'wrong.example'}));assert.throws(()=>validateTLS(second,{now:Date.now()+3*86400000}));
 }finally{ws?.terminate();watcher?.close();await app.close();rmSync(dir,{recursive:true,force:true});}
});
test('first-time TLS setup rejects wrong hostname before persisting and starts both listeners',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'mesh-tls-setup-')),file=join(dir,'relay.json'),cert=certificate(dir,'setup');
 const app=createHAApp({file,relayHost:'127.0.0.1',relayPort:0,tlsPort:0,tlsOptions:validateTLS(cert),allowedIPs:['127.0.0.1']});
 try{
  await app.start({adminHost:'127.0.0.1',adminPort:0});const base=`http://127.0.0.1:${app.admin.address().port}`;
  const {csrf}=await (await fetch(base+'/api/session')).json();
  const setup=origin=>fetch(base+'/api/setup',{method:'POST',headers:{'Content-Type':'application/json','X-MeshTeam-CSRF':csrf},body:JSON.stringify({origin,name:'TLS',owner:'Owner'})});
  assert.equal((await setup('https://wrong.example')).status,400);assert.equal(app.relay,null);
  assert.equal((await setup('https://localhost')).status,201);
  assert.equal(await request(app.relay.tlsServer.address().port,'/health',cert.cert),200);
  assert.equal((await fetch(`http://127.0.0.1:${app.relay.server.address().port}/health`)).status,200);
 }finally{await app.close();rmSync(dir,{recursive:true,force:true});}
});
