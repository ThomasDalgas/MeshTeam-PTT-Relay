import http from 'node:http';
import {readFileSync} from 'node:fs';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import QRCode from 'qrcode';
import {TTL, hash, invitationURI, validName, validOrigin} from '../src/store.mjs';
import {createMultiRelay} from '../src/multi-server.mjs';
import {Registry,MAX_GROUPS} from '../src/registry.mjs';
import {validateTLS,certificateStatus} from './tls.mjs';

const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/i18n.js', ['i18n.js', 'text/javascript; charset=utf-8']],
  ['/logo.svg', ['logo.svg', 'image/svg+xml']],
]);
const staticRoot = fileURLToPath(new URL('./static/', import.meta.url));
function headers(res, type) {
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'");
}
function json(res, status, value) { headers(res, 'application/json'); res.writeHead(status); res.end(JSON.stringify(value)); }
async function body(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw Error('JSON required');
  let length = 0; const chunks = [];
  for await (const chunk of req) { length += chunk.length; if (length > 2048) throw Error('Too large'); chunks.push(chunk); }
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Object required');
  return value;
}
function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    const failed = error => { server.off('listening', ready); reject(error); };
    const ready = () => { server.off('error', failed); resolve(); };
    server.once('error', failed); server.once('listening', ready); server.listen(port, host);
  });
}
export function createHAApp({file, defaults = {}, relayHost = '0.0.0.0', relayPort = 8788,
    tlsOptions, tlsPort = 8443, getTLSStatus = () => null, onTLSReady = () => {}, allowedIPs = ['172.30.32.2'], now = Date.now, mono = () => performance.now()} = {}) {
  if (!file) throw Error('Registry path required');
  const allowed = new Set(allowedIPs), csrf = randomBytes(32).toString('base64url');
  const registry=new Registry(file,now), bootstraps=new Map();
  let relay=null,starting=false,stopped=false;
  const safeDefaults = {
    public_origin: validOrigin(defaults.public_origin) ? new URL(defaults.public_origin).origin : '',
    group_name: validName(defaults.group_name) ? defaults.group_name : 'MeshTeam',
    owner_name: validName(defaults.owner_name) ? defaults.owner_name : 'Owner',
  };
  function pruneBootstrap(id) {
    const bootstrap=bootstraps.get(id),store=registry.stores.get(id);
    if(bootstrap&&(!store||now()>=bootstrap.expiresAt||mono()>=bootstrap.monoExpires||store.load().members.length))bootstraps.delete(id);
    return bootstraps.get(id);
  }
  function remember(id,invite,expiresAt,origin){bootstraps.set(id,{invite,expiresAt,origin,monoExpires:mono()+Math.min(TTL,Math.max(0,expiresAt-now()))});}
  async function startRelay() {
    if (relay) return;
    const origin=registry.origin;
    if(tlsOptions)validateTLS(tlsOptions,{hostname:new URL(origin).hostname});
    const next = createMultiRelay({registry, now, mono, tlsOptions});
    try { await listen(next.server, relayPort, relayHost);
      if (next.tlsServer) { await listen(next.tlsServer, tlsPort, relayHost); onTLSReady(next.tlsServer,new URL(origin).hostname); }
      relay = next; }
    catch (error) { await next.close(); throw error; }
  }
  function status(id) {
    const store=registry.stores.get(id),bootstrap=pruneBootstrap(id),runtime=relay?.groups.get(id);
    const state=store?.load();
    runtime?.room.sweep();
    return {
      groups:[...registry.stores.values()].map(s=>({id:s.state.groupId,name:s.state.groupName,online:relay?.groups.get(s.state.groupId)?.room.connected.size??0})),maxGroups:MAX_GROUPS,
      configured: !!state, running: !!runtime, groupId: state?.groupId ?? '', groupName: state?.groupName ?? '',
      origin: state?.origin ?? registry.origin, defaults: safeDefaults,
      members: state?.members.filter(m => !m.revoked).map(m => ({id: m.id, name: m.name, owner: m.owner,
        online: runtime?.room.connected.has(m.id) ?? false})) ?? [],
      online: runtime?.room.connected.size ?? 0, pendingMessages: runtime?.room.messages.size ?? 0,
      telemetry: runtime?.telemetry() ?? null,
      tls: {enabled:!!tlsOptions,listenerRunning:!!relay?.tlsServer?.listening,
        ...(tlsOptions?(getTLSStatus()??{...certificateStatus(tlsOptions),loadedAt:null,reloadErrors:0,lastReloadErrorAt:null,reloadHealthy:true}):{})},
      pendingBytes: runtime?.room.bytes ?? 0, bootstrapAvailable: !!bootstrap,
      canRenewBootstrap: !!state && state.members.length === 0,
      retentionMinutes: 15, maxMembers: 6, maxDeferredSpeechSeconds: 30,
    };
  }
  const admin = http.createServer(async (req, res) => {
    const peer = (req.socket.remoteAddress ?? '').replace(/^::ffff:/, '');
    if (!allowed.has(peer)) { json(res, 403, {error: 'Kun adgang gennem Home Assistant.'}); req.resume(); return; }
    try {
      const url=new URL(req.url,'http://localhost'),path=url.pathname;
      if([...url.searchParams.keys()].some(k=>k!=='group')||url.searchParams.getAll('group').length>1){json(res,404,{error:'Siden findes ikke.'});return;}
      const selected=url.searchParams.get('group');
      const id=selected??(registry.stores.size===1?registry.stores.keys().next().value:null);
      const store=registry.stores.get(id),runtime=relay?.groups.get(id);
      if(selected&&!store){json(res,404,{error:'Gruppen findes ikke.'});req.resume();return;}

      if (req.method === 'GET' && staticFiles.has(path)) {
        const [fileName, type] = staticFiles.get(path); headers(res, type); res.end(readFileSync(staticRoot + fileName)); return;
      }
      if (req.method === 'GET' && path === '/api/session') { json(res, 200, {csrf}); return; }
      if (req.method === 'GET' && path === '/health') { json(res, 200, {status: 'ok', configured: !!relay}); return; }
      if (req.method === 'GET' && path === '/api/status') { json(res, 200, status(id)); return; }
      if (req.method === 'GET' && path === '/api/bootstrap') {
        const bootstrap=pruneBootstrap(id);
        if (!bootstrap) { json(res, 404, {error: 'Ingen aktiv ejerinvitation. Opret en ny, hvis gruppen stadig er tom.'}); return; }
        const invitation = bootstrap;
        const uri = invitationURI(invitation.origin, invitation.invite);
        const qr = await QRCode.toDataURL(uri, {margin: 2, width: 400});
        if (pruneBootstrap(id) !== invitation) { json(res, 410, {error: 'Invitationen er udløbet eller brugt.'}); return; }
        json(res, 200, {uri, qr, expiresAt: invitation.expiresAt}); return;
      }
      if (req.method !== 'POST' || !['/api/setup', '/api/groups', '/api/renew', '/api/revoke', '/api/reset'].includes(path)) {
        json(res, 404, {error: 'Siden findes ikke.'}); req.resume(); return;
      }
      const supplied = req.headers['x-meshteam-csrf'];
      if (typeof supplied !== 'string' || supplied.length !== csrf.length
          || !timingSafeEqual(Buffer.from(supplied), Buffer.from(csrf))) {
        json(res, 403, {error: 'Genindlæs siden før ændringer.'}); req.resume(); return;
      }
      const input = await body(req);
      if(starting){json(res,409,{error:'Operation in progress'});return;}
      if (path === '/api/setup'||path==='/api/groups') {
        if (path==='/api/setup'&&registry.stores.size) { json(res, 409, {error: 'Gruppen er allerede oprettet. Den eksisterende gruppe bevares.'}); return; }
        if (!validOrigin(input.origin) || !validName(input.name) || !validName(input.owner)) throw Error('Invalid setup');
        if(tlsOptions)validateTLS(tlsOptions,{hostname:new URL(input.origin).hostname});
        starting = true;
        try {
          const result=registry.create({origin:input.origin,name:input.name,owner:input.owner});
          const newId=result.store.state.groupId;
          remember(newId,result.invite,result.expiresAt,result.origin);
          if(relay)relay.add(result.store);else await startRelay();
          json(res,201,{ok:true,groupId:newId});
        } finally { starting = false; }
        return;
      }
      if (!store) { json(res, 409, {error: 'Opret gruppen først.'}); return; }
      if (path === '/api/reset') {
        const state=store.load();
        if(input.confirm!==true||input.groupId!==state.groupId||input.name!==state.groupName){json(res,409,{error:'Group confirmation does not match'});return;}
        starting=true;
        try {
          bootstraps.delete(id);
          registry.remove(id);
          await relay?.remove(id);
          if(!registry.stores.size){const old=relay;relay=null;await old?.close();}
          json(res,200,{ok:true});
        } finally {starting=false;}
        return;
      }
      if (path === '/api/renew') {
        const state = store.load();
        if (state.members.length) { json(res, 409, {error: 'Ejeren er allerede tilmeldt. Lav deltagerinvitationer på ejerens telefon.'}); return; }
        const owner = state.invites.find(i => i.owner)?.name;
        if (!validName(owner)) throw Error('Missing owner');
        const invite = randomBytes(32).toString('base64url'), expiresAt = now() + TTL;
        // Synchronous load/write: enrollment cannot interleave before this replacement.
        state.invites = [{hash: hash(invite), name: owner, owner: true, expiresAt}];
        store.save(); remember(id, invite, expiresAt, state.origin);
        json(res, 200, {ok: true}); return;
      }
      if (path === '/api/revoke') {
        if (input.confirm !== true || typeof input.id !== 'string' || !/^[a-f0-9]{16}$/.test(input.id)) throw Error('Invalid revocation');
        const member = store.load().members.find(m => m.id === input.id && !m.revoked);
        if (!member) { json(res, 404, {error: 'Deltageren findes ikke.'}); return; }
        if (member.owner) { json(res, 409, {error: 'Ejeren kan ikke fjernes her. En ny gruppe kræver ny lydnøgle og ny tilmelding.'}); return; }
        store.revoke(input.id); runtime?.room.revoke(input.id); json(res, 200, {ok: true}); return;
      }
    } catch { if (!res.headersSent) json(res, 400, {error: 'Handlingen kunne ikke gennemføres. Kontrollér HTTPS-adresse og navne.'}); else res.end(); req.resume(); }
  });
  admin.headersTimeout = 10000; admin.requestTimeout = 10000; admin.keepAliveTimeout = 5000;
  const expiryTimer=setInterval(()=>{for(const id of bootstraps.keys())try{pruneBootstrap(id);}catch{bootstraps.delete(id);}},1000);
  expiryTimer.unref();
  return {
    admin,
    async start({adminHost = '0.0.0.0', adminPort = 8099} = {}) {
      if (registry.stores.size) await startRelay();
      await listen(admin, adminPort, adminHost);
    },
    async close() {
      if (stopped) return; stopped = true; clearInterval(expiryTimer); bootstraps.clear();
      if (relay) await relay.close();
      await new Promise(resolve => admin.listening ? admin.close(resolve) : resolve());
    },
    // Expose only local runtime handles for tests; no HTTP route exposes them.
    get relay() { return relay; },
  };
}
