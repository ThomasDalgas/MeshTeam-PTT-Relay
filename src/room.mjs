import {TTL} from './store.mjs';
export const MAX_LIVE_FRAMES=1000000000, MAX_FRAMES=750, MAX_BYTES=16*1024*1024, MAX_MESSAGES=256;
function ciphertext(s,size){if(typeof s!=='string'||s.length>1744)return false;const b=Buffer.from(s,'base64');return size.includes(b.length)&&b.toString('base64')===s;}
export class RelayRoom {
  constructor({send,roster,now=Date.now,mono=now,maxBytes=MAX_BYTES,canExtend=()=>false}){this.canExtend=canExtend;this.send=send;this.roster=roster;this.now=now;this.mono=mono;this.maxBytes=maxBytes;this.connected=new Set();this.active=new Map();this.messages=new Map();this.bytes=0;this.order=0;this.delivery=0;this.seen=new Map();}
  meta(m){return {id:m.id,sender:m.sender,order:m.order};}
  members(){return this.roster().map(m=>m.id);}
  emit(m,e){for(const id of m.live)if(this.connected.has(id))this.send(id,e);}
  join(id,group){
    if(!this.members().includes(id)||this.connected.has(id))throw Error('Cannot join');
    this.connected.add(id);
    this.send(id,{type:'hello',protocol:3,id,groupId:group.groupId,groupName:group.groupName,mode:'free',members:[...this.connected],participants:this.roster()});
    this.broadcastMembers();this.backlog(id);
    // Do not inject a partial live utterance into a reconnecting receiver; the complete
    // encrypted utterance is available as deferred delivery when the sender finishes.
  }
  broadcastMembers(){for(const id of this.connected)this.send(id,{type:'members',members:[...this.connected],participants:this.roster()});}
  begin(id,messageId){
    this.sweep();if(!this.connected.has(id)||this.active.has(id))throw Error('Cannot begin');
    if(this.messages.size>=MAX_MESSAGES||this.bytes>=this.maxBytes)throw Error('Relay queue full');
    const now=this.now();
    if(typeof messageId!=='string'||!/^\d{13}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(messageId))throw Error('Invalid message ID');
    const created=Number(messageId.slice(0,13));
    if(created>now+120000||created+TTL<=now||this.seen.has(messageId)||this.seen.size>=4096)throw Error('Stale or reused message ID');
    const expiresAt=Math.min(now+TTL,created+TTL);this.seen.set(messageId,{wall:expiresAt,mono:this.mono()+expiresAt-now});
    const m={id:messageId,sender:id,order:++this.order,delivery:++this.delivery,createdAt:now,expiresAt,monoCreated:this.mono(),monoExpires:this.mono()+expiresAt-now,lastFrame:this.mono(),recipients:this.members().filter(x=>x!==id),pending:new Set(this.members().filter(x=>x!==id)),live:new Set(this.connected),frames:[],frameCount:0,codecs:new Set(),retained:true,extended:this.canExtend(id),end:null,bytes:0};
    this.messages.set(m.id,m);this.active.set(id,m);
    this.send(id,{type:'grant',...this.meta(m),mode:'free',maxFrames:m.extended?MAX_LIVE_FRAMES:MAX_FRAMES});
    this.emit(m,{type:'start',...this.meta(m),mode:'free',delivery:m.delivery,nextSeq:0});
  }
  frame(id,e){
    const m=this.active.get(id);
    if(!m||e.id!==m.id||!Number.isInteger(e.seq)||e.seq!==m.frameCount||e.seq>=(m.extended?MAX_LIVE_FRAMES:MAX_FRAMES)||!ciphertext(e.data,[352,1308])||(!m.extended&&this.mono()-m.monoCreated>=32000))throw Error('Invalid audio frame');
    if(m.retained&&(m.frameCount>=MAX_FRAMES||this.mono()-m.monoCreated>30000))this.liveOnly(m);
    if(m.retained){
      if(this.bytes+e.data.length>this.maxBytes)throw Error('Relay queue full');
      m.frames.push(e.data);m.bytes+=e.data.length;this.bytes+=e.data.length;
    }
    m.frameCount++;m.codecs.add(e.data.length);m.lastFrame=this.mono();
    this.emit(m,{type:'frame',...this.meta(m),seq:e.seq,data:e.data});
  }
  end(id,e){
    const m=this.active.get(id);
    if(!m||e.id!==m.id||!Number.isInteger(e.seq)||e.seq!==m.frameCount||e.seq<1||!ciphertext(e.data,[28])||(!m.extended&&this.mono()-m.monoCreated>=32000))throw Error('Invalid audio end');
    if(m.retained&&this.mono()-m.monoCreated>30000)this.liveOnly(m);
    if(m.retained){
      if(this.bytes+e.data.length>this.maxBytes)throw Error('Relay queue full');
      m.end=e.data;m.bytes+=e.data.length;this.bytes+=e.data.length;
    }
    this.active.delete(id);
    this.send(id,{type:'accepted',id:m.id,liveOnly:!m.retained});this.emit(m,{type:'end',...this.meta(m),seq:e.seq,data:e.data});
    if(!m.retained)return;
    if(!m.pending.size)this.remove(m);else for(const target of m.pending)if(this.connected.has(target))this.backlog(target);
  }
  liveOnly(m){
    if(!m.retained)return;
    if(this.messages.delete(m.id))this.bytes-=m.bytes;
    m.bytes=0;m.frames=[];m.pending.clear();m.retained=false;
    this.emit(m,{type:'live_only',id:m.id});
  }
  remove(m){if(this.messages.delete(m.id))this.bytes-=m.bytes;if(this.active.get(m.sender)===m)this.active.delete(m.sender);}
  abort(id,reason='Speech interrupted'){
    const m=this.active.get(id);if(!m)return;this.emit(m,{type:'abort',id:m.id,reason});this.send(id,{type:'rejected',id:m.id,reason});this.remove(m);
  }
  received(id,message){this.sweep();const m=this.messages.get(message);if(!m?.end||!m.pending.has(id))return; m.pending.delete(id);if(!m.pending.size)this.remove(m);}
  backlog(id){this.sweep();this.send(id,{type:'backlog',messages:[...this.messages.values()].filter(m=>m.end&&m.pending.has(id)).map(m=>({...this.meta(m),frames:m.frames.length,expiresAt:m.expiresAt}))});}
  fetch(id,message){this.sweep();const m=this.messages.get(message);if(!m?.end||!m.pending.has(id))throw Error('Message unavailable');this.send(id,{type:'deferred',...this.meta(m),frames:m.frames,end:m.end,expiresAt:m.expiresAt});}
  sweep(){
    const now=this.now(),mono=this.mono();
    for(const [id,expiry] of this.seen)if(expiry.wall<=now||expiry.mono<=mono)this.seen.delete(id);
    for(const m of [...this.active.values()]){
      if(mono-m.lastFrame>=5000||(!m.extended&&mono-m.monoCreated>=32000))this.abort(m.sender,'Speech timed out');
      else if(m.extended&&mono-m.monoCreated>30000)this.liveOnly(m);
    }
    for(const m of [...this.messages.values()])if(m.expiresAt<=now||m.monoExpires<=mono){
      if(!m.end)this.abort(m.sender,'Message expired');else this.remove(m);
    }
  }
  leave(id){this.abort(id);this.connected.delete(id);for(const m of this.active.values())m.live.delete(id);this.broadcastMembers();}
  revoke(id){this.leave(id);for(const m of [...this.messages.values()]){m.pending.delete(id);m.recipients=m.recipients.filter(x=>x!==id);if(!m.pending.size&&m.end)this.remove(m);}}
  close(){this.active.clear();this.messages.clear();this.connected.clear();this.bytes=0;this.seen.clear();}
}
