import React,{useEffect,useMemo,useRef,useState} from 'react';

export default function JsonEditor({value,validate,onSave,label='JSON',onCancel,allowUnchanged=false}){
 const current=JSON.stringify(value,null,2);
 const [base,setBase]=useState(current),[draft,setDraft]=useState(current),[saveError,setSaveError]=useState('');
 const dirty=draft!==base,stale=current!==base;
 useEffect(()=>{if(!dirty){setBase(current);setDraft(current);}},[current,dirty]);
 const result=useMemo(()=>{try{const parsed=JSON.parse(draft);validate(parsed);return {parsed};}catch(error){return {error:error.message};}},[draft,validate]);
 const reset=()=>{setBase(current);setDraft(current);setSaveError('');};
 return <div className="json-editor">
  <label>{label}<textarea aria-label={label} spellCheck={false} value={draft} onChange={e=>{setDraft(e.target.value);setSaveError('');}}/></label>
  <p className={result.error?'json-invalid':'muted'} role={result.error?'alert':'status'}>{result.error||'Valid JSON · types and references checked'}</p>
  {stale&&dirty&&<p role="alert">The saved value changed while this draft was open. Copy your draft, then reload the current JSON before applying it.</p>}
  {saveError&&<p role="alert">{saveError}</p>}
  <div className="json-editor-actions"><button className="primary" disabled={!!result.error||(!dirty&&!allowUnchanged)||stale} onClick={()=>{try{onSave(result.parsed);setBase(draft);setSaveError('');}catch(error){setSaveError(error.message);}}}>Apply JSON</button><button onClick={reset}>{stale?'Reload current JSON':'Reset draft'}</button>{onCancel&&<button onClick={onCancel}>Close</button>}</div>
 </div>;
}

export function JsonDialog({title,...props}){
 const dialog=useRef(null);
 useEffect(()=>{dialog.current.showModal();},[]);
 return <dialog ref={dialog} className="json-dialog" aria-label={title} onCancel={event=>{event.preventDefault();props.onCancel();}}><header><h2>{title}</h2><button aria-label="Close JSON editor" onClick={props.onCancel}>×</button></header><p className="muted">Edits stay in this draft until applied. Invalid JSON, wrong types and broken references cannot be saved.</p><JsonEditor {...props}/></dialog>;
}
