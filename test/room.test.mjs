import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID}from'node:crypto';
import {RelayRoom}from'../src/room.mjs';import {TTL}from'../src/store.mjs';
const frame=Buffer.alloc(352,8).toString('base64'),pcm=Buffer.alloc(1308,9).toString('base64'),end=Buffer.alloc(28,7).toString('base64');
function fixture(maxBytes){let time=1800000000000,roster=['a','b','c'].map(id=>({id,name:id})),events=[];const room=new RelayRoom({send:(to,e)=>events.push({to,...e}),roster:()=>roster,now:()=>time,maxBytes});for(const id of ['a','b'])room.join(id,{groupId:'group'});return {room,events,setTime:t=>time=t,getTime:()=>time,setRoster:r=>roster=r.map(id=>({id,name:id})),id:()=>`${time}-${randomUUID()}`};}
function complete(f,data=frame){const id=f.id();f.room.begin('a',id);f.room.frame('a',{id,seq:0,data});f.room.end('a',{id,seq:1,data:end});return id;}
test('live ciphertext remains opaque and complete backlog available to offline recipient',()=>{const f=fixture(),id=complete(f);assert.equal(f.events.find(e=>e.to==='b'&&e.type==='frame').data,frame);assert.equal(f.room.messages.size,1);f.room.received('b',id);assert.equal(f.room.messages.size,1);f.room.join('c',{groupId:'group'});const backlog=f.events.findLast(e=>e.to==='c'&&e.type==='backlog');assert.equal(backlog.messages[0].id,id);f.room.fetch('c',id);assert.deepEqual(f.events.at(-1).frames,[frame]);f.room.received('c',id);assert.equal(f.room.messages.size,0);assert.equal(f.room.bytes,0);});
test('TTL from beginning cannot be extended by finish fetch or reconnect',()=>{const f=fixture(),start=f.getTime(),id=complete(f);f.setTime(start+TTL-1);f.room.fetch('c',id);assert.equal(f.events.at(-1).expiresAt,start+TTL);f.setTime(start+TTL);assert.throws(()=>f.room.fetch('c',id));assert.equal(f.room.messages.size,0);});
test('client timestamp shortens TTL and future/stale/reused IDs rejected',()=>{const f=fixture(),now=f.getTime(),id=`${now-10000}-${randomUUID()}`;f.room.begin('a',id);assert.equal(f.room.messages.get(id).expiresAt,now-10000+TTL);f.room.abort('a');assert.throws(()=>f.room.begin('a',id));assert.throws(()=>f.room.begin('a',`${now-TTL}-${randomUUID()}`));assert.throws(()=>f.room.begin('a',`${now+120001}-${randomUUID()}`));assert.throws(()=>f.room.begin('a',randomUUID()));});
test('newly enrolled recipient cannot fetch older group ciphertext',()=>{const f=fixture(),id=complete(f);f.setRoster(['a','b','c','d']);f.room.join('d',{groupId:'group'});assert.throws(()=>f.room.fetch('d',id));f.room.received('d',id);assert.equal(f.room.messages.get(id).pending.size,2);});
test('invalid frame sequence, plaintext, malformed end, premature ack rejected',()=>{const f=fixture(),id=f.id();f.room.begin('a',id);assert.throws(()=>f.room.frame('a',{id,seq:1,data:frame}));assert.throws(()=>f.room.frame('a',{id,seq:0,data:'hello'}));f.room.received('b',id);assert.equal(f.room.messages.get(id).pending.size,2);f.room.frame('a',{id,seq:0,data:pcm});assert.throws(()=>f.room.end('a',{id,seq:1,data:frame}));f.room.end('a',{id,seq:1,data:end});assert.equal(f.room.messages.size,1);});
test('memory quota is hard bounded including unfinished captures',()=>{const f=fixture(500),id=f.id();f.room.begin('a',id);f.room.frame('a',{id,seq:0,data:frame});assert.throws(()=>f.room.frame('a',{id,seq:1,data:frame}));assert.ok(f.room.bytes<=500);f.room.abort('a');assert.equal(f.room.bytes,0);});
test('interrupted streams deleted and never deferred',()=>{const f=fixture(),id=f.id();f.room.begin('a',id);f.room.frame('a',{id,seq:0,data:frame});f.room.leave('a');assert.equal(f.room.messages.size,0);assert.throws(()=>f.room.fetch('b',id));});
test('reconnect halfway does not receive orphan live frames and gets complete backlog',()=>{const f=fixture(),id=f.id();f.room.begin('a',id);f.room.frame('a',{id,seq:0,data:frame});f.room.leave('b');f.room.join('b',{groupId:'group'});const before=f.events.length;f.room.frame('a',{id,seq:1,data:frame});assert.equal(f.events.slice(before).filter(e=>e.to==='b'&&e.type==='frame').length,0);f.room.end('a',{id,seq:2,data:end});f.room.fetch('b',id);assert.equal(f.events.at(-1).frames.length,2);});
test('revoked users lose queued retrieval; acknowledged receipt is not playback',()=>{const f=fixture(),id=complete(f);f.setRoster(['a','c']);f.room.revoke('b');assert.throws(()=>f.room.fetch('b',id));f.room.received('c',id);assert.equal(f.room.messages.size,0);});
test('stream duration and inactivity bounded; restart intentionally loses backlog',()=>{const f=fixture(),id=f.id();f.room.begin('a',id);f.room.frame('a',{id,seq:0,data:frame});f.setTime(f.getTime()+5000);f.room.sweep();assert.equal(f.room.messages.size,0);complete(f);f.room.close();assert.equal(f.room.messages.size,0);assert.equal(f.room.bytes,0);});
test('monotonic retention expires even if wall clock moves backwards',()=>{let wall=1800000000000,mono=0;const room=new RelayRoom({send:()=>{},roster:()=>[{id:'a'},{id:'b'}],now:()=>wall,mono:()=>mono});room.connected.add('a');const id=wall+'-00000000-0000-0000-0000-000000000000';room.begin('a',id);room.frame('a',{id,seq:0,data:Buffer.alloc(352).toString('base64')});room.end('a',{id,seq:1,data:Buffer.alloc(28).toString('base64')});wall-=3600000;mono=TTL;room.sweep();assert.equal(room.messages.size,0);});

test('extended live drops the entire retained prefix after 30 seconds, keeps streaming and never offers backlog',()=>{
 const f=fixture(),start=f.getTime();f.room.canExtend=()=>true;const id=f.id();f.room.begin('a',id);
 assert.equal(f.events.find(e=>e.type==='grant').maxFrames,1000000000);
 for(let seq=0;seq<1000;seq++){f.setTime(start+seq*40);f.room.frame('a',{id,seq,data:frame});}
 assert.equal(f.room.active.get('a').frameCount,1000);assert.equal(f.room.messages.size,0);assert.equal(f.room.bytes,0);assert.equal(f.room.active.get('a').frames.length,0);
 assert.ok(f.events.some(e=>e.to==='b'&&e.type==='frame'&&e.seq===999));assert.throws(()=>f.room.fetch('c',id));
 f.room.end('a',{id,seq:1000,data:end});assert.equal(f.room.active.size,0);assert.ok(f.events.some(e=>e.type==='accepted'&&e.liveOnly));assert.equal(f.room.messages.size,0);
});
test('legacy peers retain 30 second limit and short extended messages still defer',()=>{
 const f=fixture(),id=f.id();f.room.begin('a',id);assert.equal(f.events.find(e=>e.type==='grant').maxFrames,750);
 for(let seq=0;seq<750;seq++)f.room.frame('a',{id,seq,data:frame});
 assert.throws(()=>f.room.frame('a',{id,seq:750,data:frame}));f.room.end('a',{id,seq:750,data:end});assert.equal(f.room.messages.get(id).frames.length,750);
 const second=fixture();second.room.canExtend=()=>true;const short=complete(second);assert.equal(second.room.messages.get(short).frames.length,1);
});
test('live only inactivity clears active state even though it is no longer queued',()=>{
 const f=fixture(),start=f.getTime();f.room.canExtend=()=>true;const id=f.id();f.room.begin('a',id);
 for(let seq=0;seq<751;seq++){f.setTime(start+seq*40);f.room.frame('a',{id,seq,data:frame});}
 f.setTime(start+36000);f.room.sweep();assert.equal(f.room.active.size,0);assert.equal(f.room.bytes,0);
});
