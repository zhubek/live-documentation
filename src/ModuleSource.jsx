import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
export default function ModuleSource({path}) {
  const [code,setCode]=useState(null);
  const dialog=useRef(null);
  useEffect(()=>{if(code !== null && dialog.current && !dialog.current.open)dialog.current.showModal();},[code]);
  async function open(e) {
    e.stopPropagation(); setCode('Loading source…');
    try { const response=await fetch('/source-map.json'); if(!response.ok) throw Error('Source snapshot unavailable'); const files=await response.json(); setCode(files[path] || 'Source not included in this snapshot.'); }
    catch(e) { setCode(e.message); }
  }
  return <><button className="nodrag nopan module-source" title={path} onClick={open}>↗ Source file</button>{code !== null && createPortal(<dialog ref={dialog} className="next-source" aria-label="Module source" onCancel={()=>setCode(null)}><button onClick={()=>setCode(null)}>Close source</button><h3>{path}</h3><pre>{code}</pre></dialog>,document.body)}</>;
}
