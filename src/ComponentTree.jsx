import React from 'react';
import StructuredDetails from './StructuredDetails';

export default function ComponentTree({ items, layouts, openSource, onNavigate, query = '' }) {
  function information(item) {
    return <><StructuredDetails item={{ ...item, section: 'Components' }} />
      {item.detail && <details className="behavior-details"><summary>Notes</summary><p>{item.detail}</p></details>}
      {!!item.sources?.length && <details className="behavior-details"><summary>Source files ({item.sources.length})</summary><div className="source-links">{item.sources.map(ref => <button key={ref.path + ref.symbol} onClick={() => openSource(ref)}><b>↗ {ref.symbol}</b><code>{ref.path}</code></button>)}</div></details>}
      {item.target && <button onClick={() => onNavigate(item.target)}>Open related diagram →</button>}</>;
  }
  const ids = new Set(items.map(i => i.componentId));
  function matches(item, visited = new Set(), scope = items) {
    if (visited.has(item)) return false;
    if (!query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase())) return true;
    return !!item.componentId && scope.some(child => child.parentComponentId === item.componentId && matches(child, new Set([...visited, item]), scope));
  }
  function branch(item, depth, visited = new Set(), scope = items) {
    if (visited.has(item) || !matches(item, new Set(), scope)) return null;
    const next = new Set([...visited, item]);
    const children = item.componentId ? scope.filter(i => i.parentComponentId === item.componentId && i !== item) : [];
    return <details className="component-block" key={item.componentId || item.name} open={!!query || depth < 2}>
      <summary><strong>{item.componentName || item.name}</strong><span className="component-label">{item.boundary || 'Component'}</span>{item.example && <span className="component-label">Example</span>}{children.length > 0 && <small>{children.length} children</small>}</summary>
      <div className="component-body">{information(item)}{children.length > 0 && <div className="component-children"><small>CHILD COMPONENTS</small>{children.map(child => branch(child, depth + 1, next, scope))}</div>}</div>
    </details>;
  }
  const roots = items.filter(i => !i.parentComponentId || !ids.has(i.parentComponentId));
  return <div className="component-tree">
    <section className="layout-region"><h3>Layouts <span className="component-label">Shared · outermost first</span></h3>{layouts.length ? layouts.map(layout => <details className="component-block layout-block" key={layout.id}><summary><strong>{layout.name}</strong><span className="component-label">Layout · {layout.boundary}</span></summary><div className="component-body">{information(layout)}{layout.children?.filter(child=>child.parentComponentId===layout.componentId).map(child=>branch(child,2,new Set(),layout.children))}</div></details>) : <p className="muted">No layout references documented.</p>}</section>
    <section><h3>Page components</h3><p className="muted">Inside the layout’s children slot. Open a block to see its props and nested components.</p><div className="component-roots">{roots.map(item => branch(item, 0))}</div>{items.length > 0 && !roots.length && <p>Component hierarchy has a cycle. Check parentComponentId in the page model.</p>}</section>
  </div>;
}
