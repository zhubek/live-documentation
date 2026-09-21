import React, {useEffect, useState} from 'react';
export default function LinkedTable({name,onOpen}) {
 const [schema,setSchema]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;fetch('/database-schema.json').then(r=>{if(!r.ok)throw Error('Schema unavailable');return r.json();}).then(s=>{if(active)setSchema(s);}).catch(e=>{if(active)setError(e.message);});return ()=>{active=false;};},[]);
 if(error)return <p role="alert">{error}</p>;
 if(!schema)return <p>Loading table…</p>;
 const table=schema.tables.find(t=>t.name===name);
 if(!table)return <p>No table definition found for {name}.</p>;
 return <><p>Database table · {table.domain}</p><table><thead><tr><th>Attribute</th><th>Type</th><th>Reference</th></tr></thead><tbody>{table.fields.map(f=><tr key={f.name}><td><code>{f.name}</code>{f.primary?' · PK':''}</td><td><code>{f.type}</code></td><td>{f.reference || f.target ? <button className="uml-link" onClick={()=>onOpen('table:'+ (f.reference?.table || f.target))}>{f.reference ? `${f.reference.table}.${f.reference.field}`:f.target} ↗</button> : '—'}</td></tr>)}</tbody></table><p className="muted">Source: {schema.sourcePath}</p></>;
}
