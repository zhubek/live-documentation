import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
if(!process.env.FIELDWORK_SOURCE_ROOT)throw Error('Set FIELDWORK_SOURCE_ROOT to the Fieldwork checkout to refresh the example snapshots. Normal builds use the bundled snapshots.');
const sourcePath='apps/api/prisma/schema.prisma';
const schema=readFileSync(resolve(process.env.FIELDWORK_SOURCE_ROOT,sourcePath),'utf8');
const groups={Project:'Projects',Assignment:'Assignments',Comment:'Assignments',Activity:'Activity'};
const models=[...schema.matchAll(/model\s+(\w+)\s*\{([^}]+)\}/g)];
const names=new Set(models.map(m=>m[1]));
const tables=models.map(([,name,body])=>{
 const fields=[]; const indexes=[];
 for(const line of body.split('\n').map(l=>l.trim()).filter(Boolean)) {
  if(line.startsWith('@@')) { indexes.push(line); continue; }
  const match=line.match(/^(\w+)\s+(\w+)(\[\]|\?)?(.*)$/);
  if(!match) continue;
  const [,field,type,modifier,attributes]=match;
  fields.push({name:field,type:type+(modifier||''),nullable:modifier==='?',primary:attributes.includes('@id'),default:attributes.match(/@default\((.*)\)/)?.[1] || (attributes.includes('@updatedAt')?'@updatedAt':''),relation:names.has(type),target:names.has(type)?type:null,attributes});
 }
 for(const field of fields.filter(f=>f.relation)) {
  const keys=field.attributes.match(/fields:\s*\[([^\]]+)\]/)?.[1].split(',').map(s=>s.trim()) || [];
  const refs=field.attributes.match(/references:\s*\[([^\]]+)\]/)?.[1].split(',').map(s=>s.trim()) || [];
  keys.forEach((key,i)=>{ const scalar=fields.find(f=>f.name===key); if(scalar) scalar.reference={table:field.target,field:refs[i],onDelete:field.attributes.match(/onDelete:\s*(\w+)/)?.[1]}; });
 }
 return {name,domain:groups[name] || 'Other',fields,indexes};
});
writeFileSync(new URL('./public/database-schema.json',import.meta.url),JSON.stringify({sourcePath,grouping:'Logical domains, not PostgreSQL schemas',tables},null,2));
