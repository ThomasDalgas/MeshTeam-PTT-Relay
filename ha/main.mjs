import {readFileSync, existsSync} from 'node:fs';
import {readTLS, watchTLS} from './tls.mjs';
import {createHAApp} from './admin.mjs';
const optionsPath = process.env.HA_OPTIONS ?? '/data/options.json';
const defaults = existsSync(optionsPath) ? JSON.parse(readFileSync(optionsPath, 'utf8')) : {};
const port = Number(process.env.PORT ?? 8788), adminPort = Number(process.env.HA_ADMIN_PORT ?? 8099);
if (![port, adminPort].every(p => Number.isInteger(p) && p > 0 && p <= 65535) || port === adminPort)
  throw Error('Invalid service ports');
const tlsFile=process.env.HA_TLS_BUNDLE ?? '/run/meshteam-tls/bundle.json';
const tlsOptions=defaults.tls_enabled===true?readTLS(tlsFile):undefined;
let tlsWatcher;
const app = createHAApp({file: process.env.RELAY_CONFIG ?? '/data/relay.json', defaults,
  tlsOptions, getTLSStatus:()=>tlsWatcher?.status(), onTLSReady: (server,hostname) => { tlsWatcher?.close(); tlsWatcher=watchTLS(server,tlsFile,{hostname,initialOptions:tlsOptions,onError:()=>console.error('TLS reload rejected; retaining last valid certificate.')}); },
  relayHost: process.env.HOST ?? '0.0.0.0', relayPort: port});
await app.start({adminPort});
console.log('MeshTeam Relay administration ready through Home Assistant ingress.');
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  tlsWatcher?.close();
  app.close().then(() => process.exit(0)); setTimeout(() => process.exit(1), 5000).unref();
});
