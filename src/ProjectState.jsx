import React, { useState } from 'react';
import StructuredDetails from './StructuredDetails';

export default function ProjectState({ model, onNavigate, onChange, onEdit }) {
  const [query, setQuery] = useState('');
  const registry = model.projectState || { entries: [] };
  const entries = registry.entries.filter(item => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  return <main className="project-state">
    <div className="view-heading"><div className="breadcrumbs">{model.name} / Project</div><h1>State & storage</h1><p>Project-wide inventory · owners, consumers, persistence and source files.</p></div>
    <section className="next-page">
      <div className="next-summary"><p>{registry.entries.length} entries · Local state retains its component owner.</p><button onClick={onEdit}>Edit project JSON</button></div>
      <input aria-label="Search project state and storage" placeholder="Find state, storage key, owner, or file…" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="next-cards">{entries.map(item => <article key={item.id}>
        <small>{item.example ? 'Design example · not implemented' : 'Project inventory'}</small><h3>{item.name}</h3>
        <StructuredDetails item={item} />
        <details className="behavior-details"><summary>Notes</summary><p>{item.detail}</p></details>
        <div className="source-links"><h4>Used in</h4>{item.viewIds.map(id => { const view = model.views.find(v => v.id === id); return view && <button key={id} onClick={() => onNavigate(id)}>{view.name} →</button>; })}</div>
        {!!item.sources.length && <details className="behavior-details"><summary>Source files ({item.sources.length})</summary>{item.sources.map(ref => <p key={ref.path + ref.symbol}><b>{ref.symbol}</b><br/><code>{ref.path}</code></p>)}</details>}
      </article>)}</div>
      {!entries.length && <p>No matching state or storage entries.</p>}

    </section>
  </main>;
}
