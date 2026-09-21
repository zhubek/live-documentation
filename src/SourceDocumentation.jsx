import React,{useState} from 'react';
export default function SourceDocumentation({documentation}){
 const [active,setActive]=useState(0),[query,setQuery]=useState('');
 const section=documentation.sections[active];
 return <section className="next-page source-documentation">
  <div className="next-summary"><div><small>SOURCE SNAPSHOT · {documentation.revision?.slice(0,8)}</small><h2>{documentation.title}</h2><p>{documentation.summary}</p></div></div>
  <nav className="next-tabs">{documentation.sections.map((s,i)=><button key={s.title} className={active===i?'active':''} onClick={()=>{setActive(i);setQuery('');}}>{s.title}{s.rows?` · ${s.rows.length}`:''}</button>)}</nav>
  {section.body&&<p style={{whiteSpace:'pre-wrap'}}>{section.body}</p>}
  {section.rows&&<><input aria-label="Search documentation" placeholder="Find an operation, policy or source…" value={query} onChange={e=>setQuery(e.target.value)}/><div className="table-scroll contract-table"><table><thead><tr>{section.headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{section.rows.filter(row=>JSON.stringify(row).toLowerCase().includes(query.toLowerCase())).map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{typeof cell==='object'?<a href={cell.url?.startsWith('https://github.com/')?cell.url:undefined} target="_blank" rel="noreferrer">{cell.label} ↗</a>:cell}</td>)}</tr>)}</tbody></table></div></>}
  <p className="muted">Repository analysis, not a runtime trace. Source links are pinned to the reviewed commit.</p>
 </section>;
}
