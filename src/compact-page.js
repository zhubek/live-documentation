import { contractsFor } from './contracts.js';
export const pageTabs = ['Components', 'API & realtime'];
export function compactPageRows(sections = {}) {
 const rows=(sections.Components || []).map(item=>({...item,section:'Components',tab:'Components',related:[]}));
 const streams=new Map();
 for(const section of ['API & triggers','Realtime']) for(const item of sections[section] || []) {
  const contracts=contractsFor(item);
  const entries=contracts.length ? contracts : section==='API & triggers' ? [{name:item.name,request:'Not documented',response:'Not documented'}] : [];
  for(const contract of entries) {
   const realtime=section==='Realtime';
   const row={...item, name:contract.name, section:realtime?'Realtime':'API',tab:'API & realtime',related:[],contract,originalName:item.name, transport:item.transport || (realtime?'WebSocket':'POST /graphql'),trigger:item.trigger || item.name.split('→')[0].trim()};
   if(realtime) { if(!streams.has(contract.name)) streams.set(contract.name,row); }
   else rows.push(row);
  }
 }
 return [...rows,...streams.values()];
}
