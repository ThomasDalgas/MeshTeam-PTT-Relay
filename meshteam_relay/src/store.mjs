import {readFileSync,writeFileSync,renameSync,mkdirSync,chmodSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomBytes,createHash,createPublicKey} from 'node:crypto';
export const TTL = 15 * 60 * 1000;
export const hash = token => createHash('sha256').update(token).digest('hex');
const secret = () => randomBytes(32).toString('base64url');
const memberId = () => randomBytes(8).toString('hex');
export function validName(value) {return typeof value === 'string' && value.trim().length > 0 && value.length <= 64 && !/[\x00-\x1f\x7f]/.test(value);}
export function validOrigin(value) {
  try {const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password && u.pathname==='/' && !u.search && !u.hash;} catch {return false;}
}
export class Store {
  constructor(file,now=Date.now){this.file=file;this.now=now;this.load();}
  static init(file,{origin,name,owner},now=Date.now){
    if(existsSync(file))throw Error('Existing relay configuration preserved');
    if(!validOrigin(origin)||!validName(name)||!validName(owner))throw Error('Invalid HTTPS origin or names');
    const invite=secret(),state={version:1,origin:new URL(origin).origin,groupId:memberId(),groupName:name,members:[],invites:[{hash:hash(invite),name:owner,owner:true,expiresAt:now()+TTL}]};
    mkdirSync(dirname(file),{recursive:true,mode:0o700});
    writeFileSync(file,JSON.stringify(state),{mode:0o600,flag:'wx'});
    return {invite,expiresAt:state.invites[0].expiresAt,origin:state.origin};
  }
  load(){
    const text=readFileSync(this.file,'utf8');if(text.length>131072)throw Error('Configuration too large');
    const s=JSON.parse(text);
    if(s.version!==1||!validOrigin(s.origin)||!Array.isArray(s.members)||s.members.length>128||!Array.isArray(s.invites)||s.invites.length>16||!/^[a-f0-9]{16}$/.test(s.groupId))throw Error('Invalid relay configuration');
    const revocations=this.file+'.revoked';
    if(existsSync(revocations)){
      const text=readFileSync(revocations,'utf8');if(text.length>4096)throw Error('Invalid revocations');
      const revoked=JSON.parse(text);if(!Array.isArray(revoked)||revoked.some(id=>!/^[a-f0-9]{16}$/.test(id)))throw Error('Invalid revocations');
      for(const m of s.members)if(revoked.includes(m.id))m.revoked=true;
    }
    this.state=s;return s;
  }
  save(){const tmp=this.file+'.tmp-'+randomBytes(6).toString('hex');writeFileSync(tmp,JSON.stringify(this.state),{mode:0o600,flag:'wx'});renameSync(tmp,this.file);chmodSync(this.file,0o600);}
  auth(token){
    if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
    const s=this.load(),digest=hash(token);return s.members.find(m=>!m.revoked&&m.tokenHash===digest)??null;
  }
  roster(){return this.load().members.filter(m=>!m.revoked).map(({id,name})=>({id,name}));}
  enroll(invite,deviceKey,enrollmentNonce){
    if(typeof enrollmentNonce!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(enrollmentNonce))throw Error('Invalid enrollment nonce');
    if(typeof invite!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(invite)||typeof deviceKey!=='string'||deviceKey.length>256)throw Error('Invalid enrollment');
    let key;try {key=createPublicKey({key:Buffer.from(deviceKey,'base64'),type:'spki',format:'der'});}catch{throw Error('Invalid device key');}
    if(key.asymmetricKeyType!=='ec'||key.asymmetricKeyDetails.namedCurve!=='prime256v1'||key.export({format:'der',type:'spki'}).toString('base64')!==deviceKey)throw Error('Use a P-256 device public key');
    const s=this.load(),inv=s.invites.find(i=>i.hash===hash(invite)&&i.expiresAt>this.now());
    if(!inv)throw Error('Invitation unavailable');
    if(inv.claimed){
      if(inv.nonceHash!==hash(enrollmentNonce))throw Error('Invitation unavailable');
      const member=s.members.find(m=>m.id===inv.claimed&&!m.revoked&&m.deviceKey===deviceKey);
      if(!member)throw Error('Invitation unavailable');
      const token=secret();member.tokenHash=hash(token);this.save();return this.enrollment(member,token);
    }
    if(s.members.filter(m=>!m.revoked).length>=6||s.members.length>=128||s.members.some(m=>m.deviceKey===deviceKey))throw Error('Invitation unavailable');
    if(inv.owner&&s.members.some(m=>m.owner))throw Error('Owner already enrolled');
    const token=secret(),member={id:createHash('sha256').update(Buffer.from(deviceKey,'base64')).digest('hex').slice(0,16),name:inv.name,owner:!!inv.owner,deviceKey,tokenHash:hash(token),revoked:false};
    s.members.push(member);inv.claimed=member.id;inv.nonceHash=hash(enrollmentNonce);s.invites=s.invites.filter(i=>i.expiresAt>this.now());this.save();
    return this.enrollment(member,token);
  }
  enrollment(member,token){const s=this.state;return {token,id:member.id,owner:member.owner,groupId:s.groupId,groupName:s.groupName,participants:s.members.filter(m=>!m.revoked).map(({id,name})=>({id,name}))};}
  invite(token,name){
    const owner=this.auth(token);if(!owner?.owner)throw Error('Owner required');
    if(!validName(name))throw Error('Invalid name');
    const s=this.state;s.invites=s.invites.filter(i=>i.expiresAt>this.now());
    if(s.invites.length>=16||s.members.length>=128||s.members.filter(m=>!m.revoked).length+s.invites.filter(i=>!i.claimed).length>=6)throw Error('Group capacity reached');
    const invite=secret(),expiresAt=this.now()+TTL;s.invites.push({hash:hash(invite),name,owner:false,expiresAt});this.save();return {invite,expiresAt};
  }
  rename(token,name){
    if(!validName(name))throw Error('Invalid name');
    const member=this.auth(token);if(!member)throw Error('Authentication required');
    if(member.name===name.trim())return false;
    member.name=name.trim();this.save();return true;
  }
  revoke(id){
    const s=this.load(),m=s.members.find(m=>m.id===id);if(!m)throw Error('Unknown member');m.revoked=true;
    // Separate fail-closed tombstones cannot be overwritten by a concurrent enrollment save.
    const file=this.file+'.revoked',revoked=s.members.filter(m=>m.revoked).map(m=>m.id);
    const tmp=file+'.tmp-'+randomBytes(6).toString('hex');writeFileSync(tmp,JSON.stringify(revoked),{mode:0o600,flag:'wx'});renameSync(tmp,file);
  }
}
export function invitationURI(origin,invite){const u=new URL('meshteam://relay');u.searchParams.set('v','1');u.searchParams.set('server',origin);u.searchParams.set('invite',invite);return u.toString();}
