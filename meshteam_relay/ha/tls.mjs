import {readFileSync} from 'node:fs';
import {X509Certificate, createPrivateKey} from 'node:crypto';
import {createSecureContext} from 'node:tls';

// A single atomically replaced bundle avoids observing a half-renewed key/cert pair.
export function validateTLS(value, {hostname, now = Date.now()} = {}) {
  if (!value || typeof value.cert !== 'string' || typeof value.key !== 'string') throw Error('TLS bundle missing');
  const cert = new X509Certificate(value.cert), key = createPrivateKey(value.key);
  if (!cert.checkPrivateKey(key)) throw Error('TLS key mismatch');
  if (Date.parse(cert.validFrom) > now || Date.parse(cert.validTo) <= now) throw Error('TLS certificate not current');
  if (hostname && !cert.checkHost(hostname)) throw Error('TLS hostname mismatch');
  const options = {cert:value.cert, key:value.key, minVersion:'TLSv1.2'};
  createSecureContext(options);
  return options;
}
export function readTLS(file, options) { return validateTLS(JSON.parse(readFileSync(file,'utf8')),options); }
export function certificateStatus(options) {
  const cert=new X509Certificate(options.cert);
  return {subject:cert.subject,issuer:cert.issuer,fingerprint256:cert.fingerprint256,expiresAt:Date.parse(cert.validTo),validFrom:Date.parse(cert.validFrom)};
}
export function watchTLS(server, file, {intervalMs=30000, hostname, initialOptions, onError=()=>{}}={}) {
  // Initial metadata describes the context installed on the server, not just files on disk.
  let current = null;
  let loaded={...certificateStatus(initialOptions??readTLS(file,{hostname})),loadedAt:Date.now(),reloadErrors:0,lastReloadErrorAt:null,reloadHealthy:true};
  const reload = () => {
    try {
      const next=readFileSync(file,'utf8');
      if(next===current)return false;
      const options=validateTLS(JSON.parse(next),{hostname});
      server.setSecureContext(options); current=next;loaded={...loaded,...certificateStatus(options),loadedAt:Date.now(),reloadHealthy:true}; return true;
    } catch { loaded.reloadErrors++;loaded.lastReloadErrorAt=Date.now();loaded.reloadHealthy=false;onError(); return false; }
  };
  const timer=setInterval(reload,intervalMs);timer.unref();
  return {reload,status:()=>({...loaded}),close:()=>clearInterval(timer)};
}
