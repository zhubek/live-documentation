import React, { useState, useEffect } from 'react';
import { architectureFolders } from './explorer-groups';
import { pagePath } from './RouteExplorer';

// Logical model directories; these are not claims about repository file paths.
export default function DiagramFolders({ views, model, activeId, query, onSelect, type }) {
  const [expanded, setExpanded] = useState({});
  const objects = new Map(model.objects.map(o => [o.id, o]));
  const root = { name: type === 'ALL' ? 'Workspace' : type === 'ARCH' ? 'Architecture' : type, path: type, folders: new Map(), views: [] };
  function segments(view) {
    const base = typeof view.folderPath === 'string'
      ? view.folderPath.split('/').filter(Boolean)
      : ['ARCH','ALL'].includes(type) ? architectureFolders(model, view) : [objects.get(view.ownerObjectId)?.name].filter(Boolean);
    if (view.template === 'NEXT') {
      const source = pagePath(view);
      const marker = source?.indexOf('/app/');
      if (marker >= 0) return [...base, 'app', ...source.slice(marker + 5).split('/').slice(0,-1)];
    }
    return base;
  }
  for (const view of views) {
    let folder = root;
    for (const name of segments(view)) {
      if (!folder.folders.has(name)) folder.folders.set(name, { name, path: `${folder.path}/${name}`, folders: new Map(), views: [] });
      folder = folder.folders.get(name);
    }
    folder.views.push(view);
  }
  const active = views.find(v => v.id === activeId);
  const activeFolder = active ? [type, ...segments(active)].join('/') : '';
  useEffect(() => {
    if (!activeFolder) return;
    setExpanded(current => {
      const next = { ...current }; const parts = activeFolder.split('/');
      // Reveal the selected row, without expanding the selected folder itself.
      for (let i = 1; i < parts.length; i++) next[parts.slice(0,i).join('/')] = true;
      return next;
    });
  }, [activeFolder]);
  function match(view) {
    return [view.name, view.template, ...segments(view), ...view.objectIds.map(id => objects.get(id)?.name)].join(' ').toLowerCase().includes(query);
  }
  function count(folder) { return folder.views.filter(match).length + [...folder.folders.values()].reduce((n,f) => n + count(f), 0); }
  function render(folder) {
    const total = count(folder);
    if (!total) return null;
    const open = !!query || (expanded[folder.path] ?? false);
    const destination = folder.views.length === 1 && match(folder.views[0]) ? folder.views[0] : null;
    const remaining = folder.views.filter(view => view !== destination && match(view));
    const hasChildren = remaining.length > 0 || [...folder.folders.values()].some(child => count(child) > 0);
    const toggle = () => setExpanded(e => ({ ...e, [folder.path]: !open }));
    return <div key={folder.path} className="route-folder">
      <div className={`directory-row ${destination?.id === activeId ? 'active' : ''}`}>
        {hasChildren ? <button className="directory-chevron" aria-label={`${open ? 'Collapse' : 'Expand'} ${folder.name}`} aria-expanded={open} onClick={toggle}>{open ? '▾' : '▸'}</button> : <span className="directory-chevron-placeholder" />}
        <button className="directory-label" aria-current={destination?.id === activeId ? 'page' : undefined} title={destination ? `Open ${destination.name}` : `Model folder: ${folder.path}`} onClick={() => destination ? onSelect(destination.id) : toggle()}>
          <span aria-hidden="true">▱</span><span className="directory-label-text">{folder.name}</span><small>{total}</small>
        </button>
      </div>
      {open && hasChildren && <div className="route-children">{[...folder.folders.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(render)}{remaining.map(view => <button key={view.id} className={`route-page ${view.id === activeId ? 'active' : ''}`} aria-current={view.id === activeId ? 'page' : undefined} onClick={() => onSelect(view.id)}><span aria-hidden="true">▤</span><span>{view.template === "NEXT" ? (pagePath(view)?.split("/").pop() || view.name) : view.name}</span></button>)}</div>}
    </div>;
  }
  return <div className="route-explorer" aria-label={`${type} model folders`}>{render(root)}{!count(root) && <p className="muted">{views.length ? 'No matching diagrams.' : 'No diagrams yet.'}</p>}</div>;
}
