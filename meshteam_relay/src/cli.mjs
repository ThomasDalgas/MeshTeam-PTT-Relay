import {Store,invitationURI} from './store.mjs';
import {Registry} from './registry.mjs';
import QRCode from 'qrcode';
import {writeFileSync} from 'node:fs';
const args=process.argv.slice(2),command=args.shift(),options={};
for(let i=0;i<args.length;i+=2){if(!args[i]?.startsWith('--')||!args[i+1])throw Error('Expected --option value');options[args[i].slice(2)]=args[i+1];}
const file=options.config??process.env.RELAY_CONFIG??'./data/relay.json';
if(command==='init'||command==='add-group'){
  const config={origin:options.origin,name:options.name,owner:options.owner};
  const result=command==='init'?Store.init(file,config):new Registry(file).create(config);
  if(command==='add-group')console.log('Restart the standalone relay to load the added group.');
  console.log('One-time owner invitation (expires in 15 minutes; no audio key):');
  const uri=invitationURI(result.origin,result.invite);
  console.log(uri);
  console.log(await QRCode.toString(uri,{type:'terminal',small:true}));
  if(options.qr){writeFileSync(options.qr,await QRCode.toString(uri,{type:'svg'}),{mode:0o600,flag:'wx'});console.log('Private bootstrap QR written. Remove it after enrollment.');}
}else if(command==='groups'){
  console.log(JSON.stringify([...new Registry(file).stores.values()].map(s=>({id:s.state.groupId,name:s.state.groupName})),null,2));
}else if(command==='revoke'){
  selected().revoke(options.id);console.log('Member revoked. Restart/rekey the group to protect future audio from previously authorized members.');
}else if(command==='members'){
  console.log(JSON.stringify(selected().roster(),null,2));
}else throw Error('Usage: relay init --origin https://relay.example.com --name Team --owner Owner [--config path]; relay members; relay revoke --id MEMBER');

function selected(){const registry=new Registry(file);const store=options.group?registry.stores.get(options.group):registry.stores.size===1?[...registry.stores.values()][0]:null;if(!store)throw Error('Choose --group GROUP_ID from relay groups');return store;}
