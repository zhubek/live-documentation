import React, {createContext, useContext} from 'react';

export const ModuleRelationsContext=createContext(null);
export function matchesRelation(focus,relation) {
 return !!focus && (focus.type==='edge' ? focus.id===relation.id : relation.source===focus.id || relation.target===focus.id);
}

export default function ModuleRelations({id,name,relations}) {
 const context=useContext(ModuleRelationsContext);
 const pinned=context.focus?.type==='node'&&context.focus.id===id;
 const preview=focus=>({onMouseEnter:()=>context.preview(focus),onMouseLeave:()=>context.preview(null),onFocus:()=>context.preview(focus),onBlur:()=>context.preview(null)});
 return <section className="module-relations nodrag nopan nowheel" aria-label={`Relations for ${name}`} onClick={event=>event.stopPropagation()} onDoubleClick={event=>event.stopPropagation()}>
  <div className="module-relations-heading">
   <button className="module-relations-title" aria-label={`Show all relations for ${name}`} aria-pressed={pinned} title="Hover to preview all lines; click to keep them visible." {...preview({type:'node',id})} onClick={()=>context.pinNode(id)}>
    <span>Relations <small>{relations.length}</small></span><span className="relation-pin">{pinned?'Pinned':'◇'}</span>
   </button>
   <button className="module-relation-add" aria-label={`Add relation from ${name}`} title="Create a connection with JSON" onClick={()=>context.draftRelation(id)}>+</button>
  </div>
  {relations.length ? <div className="module-relation-list">{relations.map(relation=>{
   const outgoing=relation.source===id,other=context.names.get(outgoing?relation.target:relation.source);
   const active=context.selection?.type==='edge'&&context.selection.id===relation.id;
   return <button key={relation.id} className={`module-relation-row ${active?'active':''}`} aria-label={`${outgoing?'Outgoing to':'Incoming from'} ${other}: ${relation.label||'Unlabelled relation'}`} aria-pressed={active} title="Hover to preview; click to edit." {...preview({type:'edge',id:relation.id})} onClick={()=>context.pinEdge(relation.id)}>
    <span className="relation-direction" aria-hidden="true">{outgoing?'→':'←'}</span><span className="relation-description"><span>{other}</span><small>{relation.label||'Unlabelled relation'}</small></span>
   </button>;
  })}</div> : <p className="module-relations-empty">No relations in this view.</p>}
 </section>;
}
