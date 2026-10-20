import {Registry} from './registry.mjs';
import {createMultiRelay} from './multi-server.mjs';
const port=Number(process.env.PORT??8788),host=process.env.HOST??'127.0.0.1';
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port');
const relay=createMultiRelay({registry:new Registry(process.env.RELAY_CONFIG??'./data/relay.json')});
relay.server.listen(port,host,()=>console.log('MeshTeam Relay v1 started. Expose only through HTTPS/WSS.'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{relay.close().then(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();});
