import {cpSync,mkdirSync,readdirSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),out=join(root,'meshteam_relay'),check=process.argv.includes('--check');
const inputs=new Map();
function collect(dir,prefix,filter=()=>true){for(const entry of readdirSync(dir,{withFileTypes:true})){if(entry.isSymbolicLink())throw Error('Symlink forbidden');const path=join(dir,entry.name),name=prefix+entry.name;if(entry.isDirectory())collect(path,name+'/',filter);else if(filter(name))inputs.set(name,path);}}
collect(join(root,'packaging/ha'),'');
for(const folder of ['src','ha'])collect(join(root,folder),folder+'/',name=>!name.includes('/test/')&&/\.(mjs|js|html|css|svg)$/.test(name));
for(const file of ['package.json','package-lock.json','LICENSE'])inputs.set(file,join(root,file));
const manifest={version:JSON.parse(readFileSync(join(root,'package.json'))).version,files:{}};
for(const [name,path]of [...inputs].sort())manifest.files[name]=createHash('sha256').update(readFileSync(path)).digest('hex');
if(check){
 for(const [name,path]of inputs)if(!existsSync(join(out,name))||!readFileSync(join(out,name)).equals(readFileSync(path)))throw Error('Stale HA file: '+name);
 const actual=[];function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else actual.push(relative(out,p).replaceAll('\\','/'));}}walk(out);
 if(actual.some(name=>name!=='SOURCE-MANIFEST.json'&&!inputs.has(name)))throw Error('Unexpected HA output file');
 if(readFileSync(join(out,'SOURCE-MANIFEST.json'),'utf8')!==JSON.stringify(manifest,null,2)+'\n')throw Error('Stale manifest');
 console.log('Home Assistant source parity verified');
}else{
 if(existsSync(out)&&!existsSync(join(out,'SOURCE-MANIFEST.json')))throw Error('Refusing to replace unmarked output');
 rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
 for(const [name,path]of inputs){mkdirSync(resolve(out,name,'..'),{recursive:true});cpSync(path,join(out,name));}
 writeFileSync(join(out,'SOURCE-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('Home Assistant package generated');
}
