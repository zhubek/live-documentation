import React, { useState } from 'react';
import NetworkCard from './NetworkCard';
import ComponentTree from './ComponentTree';
import StructuredDetails from './StructuredDetails';
import { contractsFor } from './contracts';
import { pageTabs, compactPageRows } from './compact-page';
const tabs = ['Components', 'Permissions', 'API & triggers', 'State & cache', 'Browser storage', 'Realtime', 'States & failures'];
export default function NextPage({ view, onChange, onNavigate, layouts = [], onEdit }) {
  const spec = view.pageSpec || { route: '', rendering: 'Not documented', revalidation: 'Not documented', dataLoading: 'Not documented', sections: {} };
  const [tab, setTab] = useState('Components');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState(null);
  const rows = Object.entries(spec.sections).flatMap(([section, items]) => items.map(item => ({ ...item, section })));
  const compact = compactPageRows(spec.sections);
  const shown = compact.filter(row => query ? JSON.stringify(row).toLowerCase().includes(query.toLowerCase()) : row.tab === tab);
  async function openSource(ref) {
    if(ref.url?.startsWith('https://github.com/')) {setSource({...ref,code:null});return;}
    setSource({ ...ref, code: 'Loading source…' });
    try {
      const response = await fetch('/source-map.json');
      if (!response.ok) throw Error('Source snapshot unavailable');
      const files = await response.json();
      const code = files[ref.path];
      if (typeof code !== 'string') throw Error('This file is not included in the published source snapshot.');
      const lines = code.split('\n');
      const line = lines.findIndex(l => l.includes(`function ${ref.symbol}(`) || l.includes(`const ${ref.symbol} =`));
      setSource({ ...ref, code, line: line < 0 ? null : line + 1 });
    } catch(e) { setSource({ ...ref, code: e.message }); }
  }
  return <section className="next-page">
    <div className="next-summary"><div><span className="next-badge">NEXT.JS PAGE</span><h2>{spec.route || 'Route not set'}</h2><p>{spec.rendering}</p></div><button onClick={onEdit}>Edit page JSON</button></div>
    <details className="page-details"><summary>Page settings · rendering & data</summary><p><b>Data loading:</b> {spec.dataLoading}</p><p><b>Rendering & revalidation:</b> {spec.revalidation}</p><details><summary>Failure notes</summary>{[...(spec.sections["States & failures"] || [])].map((item,i) => <p key={i}><b>{item.name}</b> — {item.detail}</p>)}</details></details>
    <input aria-label="Find frontend behavior or source" placeholder="Find a component, capability, API, file path, or symbol…" value={query} onChange={e => setQuery(e.target.value)} />
    <nav className="next-tabs" aria-label="Page behavior views">{pageTabs.map(t => <button className={tab === t && !query ? 'active' : ''} key={t} onClick={() => { setTab(t); setQuery(''); }}>{t} <span className="next-tab-count">{compact.filter(r => r.tab === t).length}</span></button>)}</nav>
    {(tab === "Components" && !query || query && shown.some(i => i.section === "Components")) && <ComponentTree key={query || "tree"} items={compact.filter(i => i.section === "Components")} layouts={layouts} openSource={openSource} onNavigate={onNavigate} query={query} />}
    <div className="next-cards">{shown.filter(i => i.section !== "Components").map((item, index) => <article key={`${item.section}-${index}`}><small>{item.section}</small><h3>{item.name}</h3>{item.contract ? <NetworkCard item={item} /> : <><StructuredDetails item={item} /><details className="behavior-details"><summary>Notes</summary><p>{item.detail}</p></details></>}<details className="behavior-details"><summary>Source files ({item.sources?.length || 0})</summary><div className="source-links">{item.sources?.map(ref => <button key={ref.path + ref.symbol} onClick={() => openSource(ref)}><b>↗ {ref.symbol}</b><code>{ref.path}</code></button>)}</div></details>{!item.contract && item.target && <button onClick={() => onNavigate(item.target)}>Open related diagram →</button>}</article>)}</div>
    {!shown.length && <p>{query ? "No matching behavior." : `No ${tab.toLowerCase()} entries documented for this page.`}</p>}
    <p className="muted">Source-backed documentation snapshot. Rebuild to refresh code excerpts; changes here edit the model, not application code.</p>
    {source && <div className="next-source" role="dialog" aria-label="Source reference"><button onClick={() => setSource(null)}>Close source</button><h3>{source.symbol}</h3><code>{source.path}{source.line ? `:${source.line}` : ''}</code>{source.code===null ? <p><a href={source.url} target="_blank" rel="noreferrer">Open source at the documented commit ↗</a></p> : <><p>Repository-relative path · line resolved from the published source snapshot.</p><pre>{source.code.split('\n').map((line, i) => <div className={i + 1 === source.line ? 'source-highlight' : ''} key={i}><span>{i + 1}</span>{line || ' '}</div>)}</pre></>}<h4>Related behavior in this page</h4>{compact.filter(r => r.sources?.some(s => s.path === source.path)).map((r,i) => <button key={i} onClick={() => { setTab(r.tab); setQuery(r.name); setSource(null); }}>{r.name}</button>)}</div>}

  </section>;
}
