import React, {useEffect,useState} from 'react';
export default function DatabaseView({view,model}) {
 const [schema,setSchema]=useState(null),[error,setError]=useState(''),[query,setQuery]=useState('');
 const [domains,setDomains]=useState({}),[tables,setTables]=useState({}),[target,setTarget]=useState(null);
 useEffect(()=>{
  let cancelled=false;
  if(view.databaseSchema){setSchema(view.databaseSchema);return;}
  if(view.id!=='data') { setSchema({sourcePath:null,grouping:'Model definitions',tables:view.objectIds.map(id=>model.objects.find(o=>o.id===id)).filter(Boolean).map(o=>({name:o.name,domain:'Tables',fields:(o.fields || '').split('\n').filter(Boolean).map(line=>({name:line.split(':')[0],type:line.split(':').slice(1).join(':').trim() || 'Not documented'})),indexes:[]}))}); return; }
  fetch('/database-schema.json').then(r=>{if(!r.ok)throw Error('Schema snapshot unavailable');return r.json();}).then(data=>{if(!cancelled)setSchema(data);}).catch(e=>{if(!cancelled)setError(e.message);});
  return ()=>{cancelled=true;};
 },[view.id,view.databaseSchema]);
 useEffect(()=>{if(target) document.getElementById(`db-table-${target}`)?.scrollIntoView({block:'nearest',behavior:'smooth'});},[target,tables]);
 function jump(name) {
  const table=schema.tables.find(t=>t.name===name); if(!table)return;
  setQuery('');setDomains(d=>({...d,[table.domain]:true}));setTables(t=>({...t,[name]:true}));setTarget(name);
 }
 if(error)return <section className="next-page"><p role="alert">{error}</p></section>;
 if(!schema)return <section className="next-page">Loading database…</section>;
 const grouped=Object.groupBy(schema.tables,t=>t.domain);
 const matches=t=>!query || JSON.stringify(t).toLowerCase().includes(query.toLowerCase());
 const domainOpen=domain=>domains[domain]??!!query;
 const tableOpen=name=>tables[name]??!!query;
 function toggleAll(domain,items) {
  const open=!(domainOpen(domain)&&items.every(table=>tableOpen(table.name)));
  setDomains(d=>({...d,[domain]:true}));
  setTables(current=>({...current,...Object.fromEntries(items.map(table=>[table.name,open]))}));
  setTarget(null);
 }
 return <section className="next-page database-view">
  <div className="next-summary"><div><h2>Domains & tables</h2><p>{schema.grouping} · {schema.tables.length} tables</p></div></div>
  <input aria-label="Search database tables and fields" placeholder="Find a domain, table or field…" value={query} onChange={e=>{setQuery(e.target.value);setDomains({});setTables({});setTarget(null);}}/>
  <div className="db-domains">{Object.entries(grouped).filter(([domain,items])=>domain.toLowerCase().includes(query.toLowerCase())||items.some(matches)).map(([domain,items])=><section className="db-domain" key={domain}>
   <div className="db-domain-header">
    <button className="db-domain-heading" aria-expanded={domainOpen(domain)} onClick={()=>setDomains(d=>({...d,[domain]:!domainOpen(domain)}))}>{domainOpen(domain)?'▾':'▸'} {domain} <small>{items.length} tables</small></button>
    <button className="db-domain-toggle-all" aria-label={`${domainOpen(domain)&&items.every(table=>tableOpen(table.name))?'Collapse':'Expand'} all tables in ${domain}`} onClick={()=>toggleAll(domain,items)}>{domainOpen(domain)&&items.every(table=>tableOpen(table.name))?'Collapse all':'Expand all'}</button>
   </div>
   {domainOpen(domain) && <div className="db-tables">{items.filter(t=>domain.toLowerCase().includes(query.toLowerCase())||matches(t)).map(table=><article id={`db-table-${table.name}`} className={`db-table ${target===table.name?'db-target':''}`} key={table.name}>
    <button className="db-table-heading" aria-expanded={tableOpen(table.name)} onClick={()=>setTables(t=>({...t,[table.name]:!tableOpen(table.name)}))}>{tableOpen(table.name)?'▾':'▸'} {table.name} <small>{table.fields.filter(f=>!f.relation).length} columns</small></button>
    {tableOpen(table.name) && <div className="db-table-body"><div className="table-scroll"><table><thead><tr><th>Attribute</th><th>Type</th><th>Constraints / default</th><th>Reference</th></tr></thead><tbody>{table.fields.map(field=><tr key={field.name}><td><code>{field.name}</code></td><td><code>{field.type}</code>{field.enumValues && <details><summary>Options · {field.enumValues.length}</summary>{field.enumValues.map(value=><div key={value}><code>{value}</code></div>)}</details>}</td><td>{field.relation?'Prisma relation':<>{field.primary?'PK · ':''}{field.reference?'FK · ':''}{field.nullable?'nullable':'required'}{field.default && ` · ${field.default}`}</>}</td><td>{field.reference ? <><button className="db-reference" onClick={()=>jump(field.reference.table)}>→ {field.reference.table}.{field.reference.field}</button>{field.reference.onDelete && <small>delete: {field.reference.onDelete}</small>}</> : field.target ? <button className="db-reference" onClick={()=>jump(field.target)}>→ {field.target}</button> : '—'}</td></tr>)}</tbody></table></div>{table.indexes.length>0 && <details><summary>Indexes ({table.indexes.length})</summary>{table.indexes.map(index=><pre key={index}>{index}</pre>)}</details>}</div>}
   </article>)}</div>}
  </section>)}</div>
  {!schema.tables.some(matches) && !Object.keys(grouped).some(d=>d.toLowerCase().includes(query.toLowerCase())) && <p>No matching tables or fields.</p>}
  <p className="muted">{schema.sourcePath ? `Source snapshot: ${schema.sourcePath}. Rebuild to refresh schema definitions.` : 'Fields from this diagram model.'} Click a reference to open its table.</p>
 </section>;
}
