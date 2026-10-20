import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,generateKeyPairSync} from 'node:crypto';
import {Registry} from '../src/registry.mjs';
const key=()=>generateKeyPairSync('ec',{namedCurve:'prime256v1'}).publicKey.export({type:'spki',format:'der'}).toString('base64');
const nonce=()=>randomBytes(32).toString('base64url');
test('six reusable slots survive time and restart, replace only their slot and isolate groups',()=>{
 const dir=mkdtempSync(join(tmpdir(),'mesh-review-'));try{
  let now=1800000000000;let registry=new Registry(join(dir,'relay.json'),()=>now);
  const normal=registry.create({origin:'https://relay.example.com',name:'Private',owner:'Owner'});
  const review=registry.createReview({origin:registry.origin,name:'Demo'});
  const old=review.store.enroll(review.invites[0],key(),nonce());
  for(let i=1;i<6;i++)review.store.enroll(review.invites[i],key(),nonce());
  assert.equal(review.store.roster().length,6);assert.equal(normal.store.roster().length,0);
  assert.throws(()=>normal.store.enroll(review.invites[0],key(),nonce()));
  now+=100*86400000;registry=new Registry(join(dir,'relay.json'),()=>now);
  const store=registry.forInvite(review.invites[0]);assert.ok(store);
  const next=store.enroll(review.invites[0],key(),nonce());
  assert.equal(store.roster().length,6);assert.equal(store.auth(old.token),null);assert.ok(store.auth(next.token));assert.equal(next.owner,false);
  assert.throws(()=>store.invite(next.token,'No admin'));
  store.revoke(next.id);assert.equal(registry.forInvite(review.invites[0]),null);assert.throws(()=>store.enroll(review.invites[0],key(),nonce()));
  assert.equal(registry.stores.get(normal.store.state.groupId).state.groupName,'Private');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
