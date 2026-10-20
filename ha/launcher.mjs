// Root is restricted to copying the two fixed SSL files into a read-only bundle
// and supervising the unprivileged runtime. No HTTP listener runs as root.
import {readFileSync, mkdirSync, chmodSync, chownSync, writeFileSync, renameSync, lstatSync, unlinkSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {validateTLS} from './tls.mjs';
const options=JSON.parse(readFileSync('/data/options.json','utf8'));
const directory='/run/meshteam-tls', bundle=directory+'/bundle.json';
let timer, child, stopping=false, last='';
if(options.tls_enabled===true){
  mkdirSync(directory,{recursive:true,mode:0o750});
  if(lstatSync(directory).isSymbolicLink())throw Error('Invalid TLS directory');
  chownSync(directory,0,1000);chmodSync(directory,0o750);
  const copy=()=>{
    const value={cert:readFileSync('/ssl/meshteam-fullchain.pem','utf8'),key:readFileSync('/ssl/meshteam-privkey.pem','utf8')};
    validateTLS(value);
    const encoded=JSON.stringify(value);if(encoded===last)return;
    const temporary=directory+'/bundle.new';
    try{unlinkSync(temporary);}catch(e){if(e.code!=='ENOENT')throw e;}
    writeFileSync(temporary,encoded,{mode:0o640,flag:'wx'});chownSync(temporary,0,1000);
    renameSync(temporary,bundle);last=encoded;
  };
  copy(); // Fail closed at startup if certificates are missing or invalid.
  timer=setInterval(()=>{try{copy();}catch{console.error('TLS renewal files unavailable or invalid; retaining last valid certificate.');}},30000);
}
child=spawn(process.execPath,['ha/main.mjs'],{uid:1000,gid:1000,stdio:'inherit',env:{...process.env,HA_TLS_BUNDLE:bundle}});
const stop=signal=>{if(stopping)return;stopping=true;clearInterval(timer);child.kill(signal);setTimeout(()=>child.kill('SIGKILL'),10000).unref();};
process.on('SIGTERM',()=>stop('SIGTERM'));process.on('SIGINT',()=>stop('SIGINT'));
child.on('error',()=>{clearInterval(timer);process.exitCode=1;});
child.on('exit',(code,signal)=>{clearInterval(timer);process.exitCode=code??(stopping?0:1);});
