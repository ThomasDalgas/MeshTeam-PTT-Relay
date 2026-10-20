import {existsSync,readdirSync,mkdirSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {Store,hash} from './store.mjs';
export const MAX_GROUPS=8;
/** Keep the legacy registry intact; additional groups have independent atomic stores. */
export class Registry {
 constructor(file,now=Date.now){
  this.file=file;this.directory=file+'.groups';this.now=now;this.stores=new Map();
  const files=[...(existsSync(file)?[file]:[]),...(existsSync(this.directory)?readdirSync(this.directory).filter(n=>/^[a-f0-9]{16}\.json$/.test(n)).sort().map(n=>join(this.directory,n)):[])];
  if(files.length>MAX_GROUPS)throw Error('Too many groups');
  for(const path of files){const store=new Store(path,now);if(this.stores.has(store.state.groupId))throw Error('Duplicate group');this.stores.set(store.state.groupId,store);}
  if(new Set([...this.stores.values()].map(s=>s.state.origin)).size>1)throw Error('Groups must share one HTTPS origin');
 }
 createReview({origin,name}){
  const result=this.create({origin,name,owner:'Review setup'}),s=result.store.state;
  const invites=Array.from({length:6},()=>randomBytes(32).toString('base64url'));
  s.reviewOnly=true;s.invites=[];
  s.reviewSlots=invites.map((invite,i)=>({hash:hash(invite),name:'Reviewer '+(i+1),disabled:false}));
  result.store.save();return {store:result.store,invites,origin:s.origin};
 }
 get origin(){return this.stores.values().next().value?.state.origin??'';}
 create(options){
  if(this.stores.size>=MAX_GROUPS)throw Error('Group capacity reached');
  if(this.origin&&new URL(options.origin).origin!==this.origin)throw Error('Use existing relay origin');
  let file=this.file;
  if(this.stores.size){mkdirSync(this.directory,{recursive:true,mode:0o700});file=join(this.directory,randomBytes(8).toString('hex')+'.json');}
  const invitation=Store.init(file,options,this.now),store=new Store(file,this.now);
  this.stores.set(store.state.groupId,store);return {store,...invitation};
 }
 forToken(token){return [...this.stores.values()].find(s=>s.auth(token))??null;}
 forInvite(invite){
  if(typeof invite!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(invite))return null;
  const digest=hash(invite);return [...this.stores.values()].find(s=>((s.load().reviewOnly===true&&s.state.reviewSlots?.some(i=>!i.disabled&&i.hash===digest))||s.state.invites.some(i=>i.hash===digest&&i.expiresAt>this.now())))??null;
 }
 remove(id){const store=this.stores.get(id);if(!store)throw Error('Unknown group');unlinkSync(store.file);if(existsSync(store.file+'.revoked'))unlinkSync(store.file+'.revoked');this.stores.delete(id);}
}
