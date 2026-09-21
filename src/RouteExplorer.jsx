import React, { useEffect, useState } from 'react';

export function pagePath(view) {
  if (view.pageSpec?.filePath) return view.pageSpec.filePath;
  const sources = Object.values(view.pageSpec?.sections || {}).flatMap(items => items.flatMap(item => item.sources || []));
  const source = sources.find(ref => /\/app\/(?:.*\/)?page\.[jt]sx?$/.test(ref.path));
  if (source) return source.path;
  return null;
}

export default function RouteExplorer({ views, activeId, query, onSelect, model }) {
  const [expanded, setExpanded] = useState({});
  const roots = new Map();
  const unplaced = [];
  for (const view of views) {
    const path = pagePath(view);
    if (!path) { unplaced.push(view); continue; }
    const marker = path.indexOf('/app/');
    if (marker < 0) { unplaced.push(view); continue; }
    const base = path.slice(0, marker + 4);
    if (!roots.has(base)) roots.set(base, { name: 'app', path: base, folders: new Map(), pages: [] });
    let folder = roots.get(base);
    for (const segment of path.slice(marker + 5).split('/').slice(0, -1)) {
      const childPath = `${folder.path}/${segment}`;
      if (!folder.folders.has(segment)) folder.folders.set(segment, { name: segment, path: childPath, folders: new Map(), pages: [] });
      folder = folder.folders.get(segment);
    }
    folder.pages.push(view);
  }
  const activePath = pagePath(views.find(v => v.id === activeId) || {});
  useEffect(() => {
    if (!activePath) return;
    setExpanded(current => {
      const next = { ...current };
      const parts = activePath.split('/');
      for (let i = 1; i < parts.length; i++) next[parts.slice(0, i).join('/')] = true;
      return next;
    });
  }, [activePath]);
  function matches(view) {
    return [view.name, view.pageSpec?.route, pagePath(view), ...view.objectIds.map(id => model.objects.find(o => o.id === id)?.name)].join(' ').toLowerCase().includes(query);
  }
  function visible(folder) { return folder.pages.some(matches) || [...folder.folders.values()].some(visible); }
  function page(view, unknown = false) {
    return <button key={view.id} className={`route-page ${view.id === activeId ? 'active' : ''}`} aria-current={view.id === activeId ? 'page' : undefined} onClick={() => onSelect(view.id)} title={pagePath(view) || 'Source path not documented'}><span><b>{unknown ? view.name : 'page.tsx'}</b><small>{view.pageSpec?.route || view.name}</small></span></button>;
  }
  function folder(node, root = false) {
    if (!visible(node)) return null;
    const open = !!query || (expanded[node.path] ?? root);
    return <div className="route-folder" key={node.path}>
      <button className="route-folder-toggle" aria-expanded={open} title={node.path} onClick={() => setExpanded(current => ({ ...current, [node.path]: !open }))}><span className="route-folder-icon" aria-hidden="true">{open ? '▾' : '▸'} ▱</span><span className="route-folder-name">{node.name}/</span></button>
      {open && <div className="route-children">{node.pages.filter(matches).map(v => page(v))}{[...node.folders.values()].sort((a,b) => a.name.localeCompare(b.name)).map(child => folder(child))}</div>}
    </div>;
  }
  const hasMatches = views.some(matches);
  return <div className="route-explorer" aria-label="Next.js app folders">{[...roots.values()].map(root => folder(root, true))}{unplaced.filter(matches).length > 0 && <div><small>Source path not documented</small>{unplaced.filter(matches).map(v => page(v, true))}</div>}{!hasMatches && <p className="muted">No matching pages.</p>}</div>;
}
