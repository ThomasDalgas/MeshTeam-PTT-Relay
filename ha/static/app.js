"use strict";
const $ = id => document.getElementById(id);
let csrf='', initialized=false, busy=false, refreshing=false, qrExpiry=0, lastStatus=null, lastSuccess=0;
const rows=new Map();
let selectedGroup='',creating=false,selectionEpoch=0;
const show=(id,visible)=>{$(id).hidden=!visible;};
const text=(id,value)=>{$(id).textContent=value;};
const finite=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const duration=v=>!finite(v)?'—':v<1000?T("Under 1 s"):v<60000?Math.floor(v/1000)+' s':v<3600000?Math.floor(v/60000)+' min':Math.floor(v/3600000)+T(" t ")+Math.floor(v%3600000/60000)+' min';
const bytes=v=>!finite(v)?'—':v<1024?Math.round(v)+' B':v<1048576?(v/1024).toFixed(1)+' KiB':(v/1048576).toFixed(1)+' MiB';
function notice(value){text('notice',value);}
async function request(path,data){
 if(selectedGroup&&['api/status','api/bootstrap','api/renew','api/revoke','api/reset'].includes(path))path+='?group='+encodeURIComponent(selectedGroup);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch(path,data===undefined?{cache:'no-store',signal:controller.signal}:{method:'POST',headers:{'Content-Type':'application/json','X-MeshTeam-CSRF':csrf},body:JSON.stringify(data),cache:'no-store',signal:controller.signal});
  const value=await response.json();if(!response.ok)throw Error(T(value.error)||T("Anmodningen blev afvist."));return value;
 }finally{clearTimeout(timer);}
}
function hideQr(){show('qrCard',false);$('qr').removeAttribute('src');$('invitation').value='';qrExpiry=0;}
function stale(){
 text('badge',T("Status utilgængelig"));$('badge').classList.add('warning');
 text('freshness',lastSuccess?T("Forbindelsen til dashboardet er afbrudt. Seneste svar ")+new Date(lastSuccess).toLocaleTimeString(relayLocale())+T(". Tallene kan være forældede."):T("Ingen kontakt til dashboardet. Genindlæs siden for at prøve igen."));
 text('speaking',T("Talestatus ukendt"));text('speakingDetail',T("Venter på en ny status fra relæet."));$('livePanel').classList.remove('active');
 for(const row of rows.values()){row.speaking.textContent=T("Status ukendt");row.el.classList.remove('talking');}
}
function memberRow(m){
 let row=rows.get(m.id);if(row)return row;
 const el=document.createElement('article');el.className='member';
 const top=document.createElement('div');top.className='memberhead';
 const name=document.createElement('strong'),speaking=document.createElement('span');speaking.className='memberstate';top.append(name,speaking);el.append(top);
 const stats=document.createElement('div');stats.className='membermetrics';
 const fields={};for(const [key,label] of [['connection',T("Forbindelse")],['rtt','RTT'],['codec',T("Codec-estimat")],['traffic',T("Trafik ↓ / ↑")]]){const item=document.createElement('div'),title=document.createElement('small'),value=document.createElement('span');title.textContent=label;item.append(title,value);stats.append(item);fields[key]=value;}el.append(stats);
 const revoke=document.createElement('button');revoke.className='danger';revoke.textContent=T("Tilbagekald adgang");
 row={el,name,speaking,revoke,...fields,member:m};revoke.onclick=()=>action(async()=>{
  if(!confirm(T("Tilbagekald relæadgang for ")+row.member.name+T("? Den gamle lydnøgle kan ikke slettes fra telefonen.")))return;
  await request('api/revoke',{id:row.member.id,confirm:true});notice(T("Adgangen er tilbagekaldt."));
 });el.append(revoke);rows.set(m.id,row);$('memberList').append(el);return row;
}
function render(s){
 if(s.configured)selectedGroup=s.groupId;
 const picker=$('selectedGroup');picker.replaceChildren();
 for(const group of s.groups??[]){const option=document.createElement('option');option.value=group.id;option.textContent=group.name+' · '+group.online+' online';picker.append(option);}
 picker.value=selectedGroup;picker.disabled=busy||creating;show('groupPicker',!!s.groups?.length);$('newGroup').disabled=busy||creating||(s.groups?.length??0)>=s.maxGroups;
 $('origin').readOnly=!!s.groups?.length;if(s.origin)$('origin').value=s.origin;
 show('cancelSetup',creating&&!!s.groups?.length);
 lastStatus=s;lastSuccess=Date.now();$('badge').classList.remove('warning');
 text('badge',s.running?T("Relæ startet"):s.configured?T("Relæet kører ikke"):T("Afventer opsætning"));
 text('freshness',T("Status opdateret ")+new Date(lastSuccess).toLocaleTimeString(relayLocale())+T(" · ekstern adgang er ikke automatisk testet"));
 show('setup',creating||!s.configured);show('group',s.configured&&!creating);show('people',s.configured&&!creating);show('technical',s.configured&&!creating);show('resetCard',s.configured&&!creating);
 if(!initialized){$('origin').value=s.defaults.public_origin;$('name').value=s.defaults.group_name;$('owner').value=s.defaults.owner_name;$('guide').open=!s.configured;initialized=true;restoreGuide(s);}
 text('groupName',s.groupName);text('address',s.origin);text('online',s.online);text('membersCount',s.members.length);text('pending',s.pendingMessages);
 show('showQr',s.bootstrapAvailable);show('renew',s.canRenewBootstrap);if(!s.bootstrapAvailable||(qrExpiry&&Date.now()>=qrExpiry))hideQr();
 const t=s.telemetry, speakers=t?.speakers??[];const names=speakers.map(p=>p.name||s.members.find(m=>m.id===p.id)?.name||T("Deltager"));
 text('speaking',!t?T("Talestatus ikke tilgængelig"):names.length?names.join(', ')+T(" sender tale"):T("Ingen sender tale"));
 text('speakingDetail',names.length?speakers.map((p,i)=>names[i]+' · '+duration(p.speakingForMs)+(p.liveOnly?T(" · kun live"):'')).join(' / '):T("Klar til næste transmission"));$('livePanel').classList.toggle('active',names.length>0);
 const present=new Set(s.members.map(m=>m.id));for(const [id,row]of rows){if(!present.has(id)){row.el.remove();rows.delete(id);}}
 for(const m of s.members){const row=memberRow(m),c=t?.connections?.find(c=>c.id===m.id),speaker=speakers.find(p=>p.id===m.id);row.member=m;row.name.textContent=m.name+(m.owner?T(" · Ejer"):'');row.revoke.hidden=m.owner;row.revoke.disabled=busy;row.el.classList.toggle('talking',!!speaker);row.speaking.textContent=speaker?T("Sender tale"):m.online?'Online':'Offline';
  row.connection.textContent=m.online?'Online · '+duration(c?.connectedForMs):finite(c?.lastSeenAgoMs)?T("Sidst set for ")+duration(c.lastSeenAgoMs)+T(" siden"):T("Ingen aktuel forbindelse");
  row.rtt.textContent=m.online&&finite(c?.rttMs)?Math.round(c.rttMs)+' ms'+(finite(c.rttAgeMs)?' · '+duration(c.rttAgeMs)+T(" gammel"):''):'—';
  row.codec.textContent=speaker?.codec?(speaker.codec==='mixed'?T("Blandet"):speaker.codec)+T(" · estimat"):speaker?T("Ukendt · krypteret"):T("Ingen aktiv tale");row.traffic.textContent=bytes(c?.receivedBytes)+' / '+bytes(c?.sentBytes);
 }
 text('tlsState',s.tls?.enabled?(s.tls.listenerRunning?T("Aktiv · indbygget TLS"):T("TLS valgt · afventer listener")):T("Ekstern proxy / ikke aktiveret"));text('tlsExpiry',finite(s.tls?.expiresAt)?new Date(s.tls.expiresAt).toLocaleString(relayLocale()):T("Ikke tilgængelig"));text('tlsReload',s.tls?.reloadHealthy===false?T("Seneste indlæsning afvist · kontrollér log"):s.tls?.enabled?T("Automatisk indlæsning aktiv"):T("Ikke administreret her"));text('uptime',duration(t?.uptimeMs));text('rx',bytes(t?.traffic?.receivedBytes));text('tx',bytes(t?.traffic?.sentBytes));text('frames',t?.traffic?.receivedFrames??'—');text('utterances',t?.traffic?.completedUtterances??'—');text('queueBytes',bytes(t?.queue?.bytes)+' / '+bytes(t?.queue?.maxBytes));text('queueAge',t?.queue?.messages?duration(t.queue.oldestAgeMs):T("Tom kø"));text('buffered',t?bytes((t.connections??[]).reduce((sum,c)=>sum+(finite(c.bufferedBytes)?c.bufferedBytes:0),0)):'—');renderGuide();
}
async function refresh(){
 if(refreshing)return;refreshing=true;const epoch=selectionEpoch;
 try{let s=await request('api/status');if(epoch!==selectionEpoch)return;
  if(!s.configured&&s.groups?.length){selectedGroup=s.groups[0].id;s=await request('api/status');}
  if(epoch===selectionEpoch)render(s);
 }finally{refreshing=false;}
}
async function action(work){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);$('selectedGroup').disabled=true;try{await work();await refresh();}catch(e){notice(e.name==='AbortError'?T("Anmodningen tog for lang tid. Genindlæs status før du prøver igen."):e.message);}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);if(lastStatus)render(lastStatus);}}
$('setupForm').onsubmit=e=>{e.preventDefault();action(async()=>{const result=await request(lastStatus?.groups?.length?'api/groups':'api/setup',{origin:$('origin').value.trim(),name:$('name').value.trim(),owner:$('owner').value.trim()});selectedGroup=result.groupId;selectionEpoch++;creating=false;hideQr();notice(T("Gruppen er oprettet. Vis QR-koden og tilmeld ejerens telefon."));});};
$('showQr').onclick=()=>action(async()=>{const invite=await request('api/bootstrap');$('qr').src=invite.qr;$('invitation').value=invite.uri;qrExpiry=invite.expiresAt;text('expires',T("Udløber ")+new Date(qrExpiry).toLocaleTimeString(relayLocale())+'.');show('qrCard',true);});
$('renew').onclick=()=>action(async()=>{if(!confirm(T("Lav en ny ejerinvitation? Den tidligere kode holder straks op med at virke.")))return;await request('api/renew',{});hideQr();notice(T("Ny invitation klar. Vis QR-koden for at tilmelde ejeren."));});$('hideQr').onclick=hideQr;
const guideKey='meshteam-installation-'+location.pathname;
function restoreGuide(s){let saved={};try{saved=JSON.parse(localStorage.getItem(guideKey)||'{}')||{};}catch{}let port='443';try{port=new URL(s.origin||s.defaults.public_origin).port||'443';}catch{}const localHost=location.hostname;const privateHost=/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(localHost)&&/^(?:\d{1,3}\.){3}\d{1,3}$/.test(localHost);$('guideLan').value=typeof saved.lan==='string'?saved.lan:privateHost?localHost:'';$('guideWan').value=saved.wan||port;$('guideHost').value=saved.host||'8443';$('guideRouter').value=['generic','unifi'].includes(saved.router)?saved.router:'generic';}
function guideValues(){return{lan:$('guideLan').value.trim(),wan:$('guideWan').value,host:$('guideHost').value,router:$('guideRouter').value};}
function renderGuide(){
 const v=guideValues(),validPort=x=>/^\d+$/.test(x)&&Number(x)>=1&&Number(x)<=65535,validIp=/^(?:\d{1,3}\.){3}\d{1,3}$/.test(v.lan)&&v.lan.split('.').every(x=>Number(x)<=255),ports=validPort(v.wan)&&validPort(v.host);let origin=null;try{const u=new URL(lastStatus?.origin||$('origin').value.trim());if(u.protocol==='https:'&&!u.username&&!u.password)origin=u;}catch{}
 text('guideValidation',!v.lan?T("Indtast Home Assistants lokale IPv4-adresse for at få en færdig portregel."):!validIp?T("Indtast en gyldig IPv4-adresse."):!ports?T("Porte skal være hele tal mellem 1 og 65535."):T("Vejledningen bruger dine valg. Lokal IP kan være foreslået fra denne Home Assistant-adresse; kontrollér den. Ændringer gemmes kun i denne browser."));
 text('guideOrigin',origin?T("Konfigureret relæadresse: ")+origin.origin:T("Angiv relæets HTTPS-adresse i gruppeopsætningen."));
 const mismatch=origin&&validPort(v.wan)&&Number(v.wan)!==Number(origin.port||443);show('guideMismatch',!!mismatch);text('guideMismatch',mismatch?T("Den valgte offentlige port matcher ikke relæadressen. Portreglen og relæets konfigurerede adresse skal bruge samme offentlige port. Guiden ændrer ikke den eksisterende gruppe."):'');
 const duck=origin?.hostname.endsWith('.duckdns.org')?origin.hostname:null;
 text('duckDomain',duck?T("Din konfigurerede DuckDNS-adresse: ")+duck:T("Du kan bruge DuckDNS eller dit eget domæne. Ved eget domæne skal DNS og certifikat sættes op hos den relevante udbyder."));
 text('duckConfig','domains:\n  - '+(duck||T("DIT-NAVN.duckdns.org"))+'\ntoken: TOKEN_ONLY_IN_DUCK_DNS_APP\naliases: []\nlets_encrypt:\n  accept_terms: false\n  certfile: meshteam-fullchain.pem\n  keyfile: meshteam-privkey.pem\nseconds: 300');
 text('haPort',T("Container 8443/tcp → Home Assistant-værtsport ")+(validPort(v.host)?v.host:T("[gyldig port kræves]")));
 const paths={generic:T("Find Port Forwarding, Portviderestilling, NAT eller Virtual Server i routerens indstillinger."),unifi:T("I UniFi Network: Indstillinger → Port Forwarding (eller Policy Engine, afhængigt af version) → Create New."),asus:'I ASUS-routeren: WAN → Virtual Server / Port Forwarding. Tilføj en ny regel.',tplink:'I TP-Link-routeren: Advanced → NAT Forwarding → Virtual Servers / Port Forwarding. Tilføj en ny regel.'};text('routerPath',paths[v.router]);
 text('portRule',validIp&&ports?T("Navn: MeshTeam Relay HTTPS\nProtokol: TCP\nOffentlig port: ")+v.wan+T("\nVideresend til IP: ")+v.lan+T("\nIntern port: ")+v.host:T("Portreglen vises, når lokal IP-adresse og begge porte er gyldige."));text('healthUrl',origin?origin.origin+'/health':T("Din HTTPS-adresse + /health"));
}
for(const id of ['guideLan','guideWan','guideHost','guideRouter'])$(id).addEventListener('input',()=>{try{localStorage.setItem(guideKey,JSON.stringify(guideValues()));}catch{}renderGuide();});$('origin').addEventListener('input',renderGuide);
(async()=>{try{csrf=(await request('api/session')).csrf;await refresh();}catch{stale();}})();setInterval(()=>{if(!busy)refresh().catch(stale);if(qrExpiry&&Date.now()>=qrExpiry)hideQr();},1000);

$('resetGroup').onclick=()=>action(async()=>{
 const snapshot=lastStatus;
 if(!snapshot?.configured||$('resetName').value!==snapshot.groupName)throw Error(T("Skriv gruppens navn præcist for at bekræfte."));
 if(!confirm(T("Slet gruppen permanent? Alle telefoner skal tilmeldes på ny.")))return;
 await request('api/reset',{confirm:true,groupId:snapshot.groupId,name:$('resetName').value});
 selectedGroup='';selectionEpoch++;hideQr();$('resetName').value='';notice(T("Gruppen er slettet. Opret en ny gruppe for at starte forfra."));
});
$('language').onchange=()=>{setRelayLanguage($('language').value);for(const row of rows.values())row.el.remove();rows.clear();hideQr();notice('');if(lastStatus)render(lastStatus);};

$('selectedGroup').onchange=()=>{if(busy)return;selectedGroup=$('selectedGroup').value;selectionEpoch++;hideQr();$('resetName').value='';notice('');for(const row of rows.values())row.el.remove();rows.clear();stale();refresh().catch(stale);};
$('newGroup').onclick=()=>{creating=true;hideQr();$('name').value='';$('owner').value='';if(lastStatus)render(lastStatus);$('name').focus();};
$('cancelSetup').onclick=()=>{creating=false;if(lastStatus)render(lastStatus);};

$('createReviewGroup').onclick=()=>{
 if(!confirm(T("Create a separate demo group with six reusable review credentials? Anyone with an invitation can reuse its slot. Do not use it for private conversations.")))return;
 action(async()=>{
  const keyBytes=new Uint8Array(32);crypto.getRandomValues(keyBytes);
  const key=btoa(String.fromCharCode(...keyBytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');keyBytes.fill(0);
  const result=await request('api/review-group',{confirm:true});
  const values=result.invites.map((invite,i)=>'Phone '+(i+1)+'\nmeshteam://relay?v=1&server='+encodeURIComponent(result.origin)+'&invite='+invite+'#key='+key);
  $('reviewInvitations').value=values.join('\n\n');$('reviewInvitations').hidden=false;
  selectedGroup=result.groupId;selectionEpoch++;creating=false;
  notice(T("Review group created. Save the private invitations now."));
 });
};
