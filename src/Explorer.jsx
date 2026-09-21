import React, { useState } from 'react';
import DiagramFolders from './DiagramFolders';
export default function Explorer({ model, activeId, onSelect, search, onSearch }) {
  const [searchOpen, setSearchOpen] = useState(false);
  function closeSearch() { setSearchOpen(false); onSearch(''); }
  return <div className="diagram-explorer"><nav aria-label="Project directory"><div className="type-picker selected">
    <div className="type-search-row"><span className="type-name">Directory</span><span className="type-count">{model.views.length}</span>
      <button className="folder-search-toggle" aria-label={searchOpen ? 'Close diagram search' : 'Search diagrams'} aria-expanded={searchOpen} onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}>
        {searchOpen ? '×' : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>}
      </button>
    </div>
    <div className="inline-diagram-results">
      {searchOpen && <input autoFocus className="diagram-search" type="search" aria-label="Search project directory" placeholder="Search pages, diagrams, folders…" value={search} onChange={e=>onSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Escape') closeSearch();}}/>}
      <DiagramFolders views={model.views} model={model} activeId={activeId} query={search.trim().toLowerCase()} onSelect={onSelect} type="ALL" />
    </div>
  </div></nav></div>;
}
