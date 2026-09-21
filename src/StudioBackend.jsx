import React,{useState,useRef,useEffect,useCallback} from 'react';
import App,{initial} from './main.jsx';
import {validateModel} from './model.js';
const DRAFT='fieldwork-studio-server-draft-v1';
const LEGACY='fieldwork-model-studio-v1';
function download(model){const url=URL.createObjectURL(new Blob([JSON.stringify(model,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='studio-local-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function request(path,options){const response=await fetch(path,{cache:'no-store',...options});const body=await response.json();if(!response.ok){const error=new Error(body.error||'The server is unavailable.');error.status=response.status;throw error;}return body;}
export default function StudioBackend(){
 const [availableRevision,setAvailableRevision]=useState(0);
 const [phase,setPhase]=useState('loading'),[model,setModel]=useState(null),[epoch,setEpoch]=useState(0),[password,setPassword]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState('Loading…'),[blocked,setBlocked]=useState(false),[legacy,setLegacy]=useState(false);
 const revision=useRef(0),last=useRef(''),pending=useRef(null),busy=useRef(false),halted=useRef(false),timer=useRef(null),current=useRef(null);
 const backupDraft=()=>{try{const raw=localStorage.getItem(DRAFT);if(raw)localStorage.setItem(DRAFT+'-recovery-'+Date.now(),raw);}catch{}};
 async function load(ignoreDraft=false){
  setError('');
  try{
   const remote=await request('/api/model');revision.current=remote.revision;setAvailableRevision(0);last.current=remote.model?JSON.stringify(remote.model):'';
   let next=remote.model||initial();
   let conflict=false;
   if(!ignoreDraft){try{const draft=JSON.parse(localStorage.getItem(DRAFT));if(draft?.model&&draft.dirty!==false&&JSON.stringify(draft.model)!==last.current){validateModel(draft.model);next=draft.model;conflict=draft.revision!==remote.revision;}}catch{}}
   halted.current=conflict;setBlocked(conflict);setStatus(conflict?'Conflict · local edits preserved':'Saved to server');
   if(conflict)setError('The server has a newer revision. Export your local edits, then load the server version and reapply the changes you want.');
   current.current=next;pending.current=null;setModel(next);setEpoch(e=>e+1);setPhase('ready');
   setLegacy(!!remote.model&&!!localStorage.getItem(LEGACY)&&!localStorage.getItem('studio-legacy-reviewed'));
  }catch(e){if(e.status===401)setPhase('login');else {setPhase('error');setError(e.message);}}
 }
 useEffect(()=>{load();return()=>clearTimeout(timer.current);},[]);
 useEffect(()=>{
  if(phase!=='ready')return;
  let active=true;
  const check=async()=>{if(document.hidden||busy.current)return;try{const head=await request('/api/model?revisionOnly=true');if(active)setAvailableRevision(head.revision>revision.current?head.revision:0);}catch{}};
  const poll=setInterval(check,15000);window.addEventListener('focus',check);
  return()=>{active=false;clearInterval(poll);window.removeEventListener('focus',check);};
 },[phase]);
 async function flush(){
  if(busy.current||halted.current||!pending.current)return;
  const next=pending.current,body=JSON.stringify(next);
  if(body===last.current){pending.current=null;setStatus('Saved to server');return;}
  busy.current=true;pending.current=null;setStatus('Saving…');
  try{
   const saved=await request('/api/model',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:revision.current,model:next,dirty:JSON.stringify(next)!==last.current||busy.current})});
   revision.current=saved.revision;setAvailableRevision(0);last.current=body;
   try{localStorage.setItem(DRAFT,JSON.stringify({revision:saved.revision,model:current.current,dirty:JSON.stringify(current.current)!==body}));}catch{}
   setStatus(pending.current?'Saving…':'Saved to server');setError('');
  }catch(e){pending.current=current.current;halted.current=true;setBlocked(true);setStatus('Not saved · local edits preserved');setError(e.message);}
  finally{busy.current=false;if(pending.current&&!halted.current)timer.current=setTimeout(flush,400);}
 }
 const changed=useCallback(next=>{
  current.current=next;
  try{localStorage.setItem(DRAFT,JSON.stringify({revision:revision.current,model:next,dirty:JSON.stringify(next)!==last.current||busy.current}));}catch{setError('Browser backup is unavailable. Export JSON if the server cannot save.');}
  if(JSON.stringify(next)===last.current&&!busy.current){pending.current=null;setStatus('Saved to server');return;}
  pending.current=next;setStatus(halted.current?'Not saved · local edits preserved':'Saving…');clearTimeout(timer.current);timer.current=setTimeout(flush,600);
 },[]);
 useEffect(()=>{const warn=e=>{if(pending.current||busy.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
 async function login(e){e.preventDefault();setError('');try{await request('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});setPassword('');await load();}catch(e){setError(e.message);}}
 if(phase==='loading')return <p className="studio-loading">Connecting to Live documentation…</p>;
 if(phase==='login')return <main className="studio-login"><form onSubmit={login}><small>LIVE DOCUMENTATION</small><h1>Open your documentation</h1><p>Your diagrams are stored on this server.</p><label>Shared password<input autoFocus type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary">Sign in</button>{error&&<p role="alert">{error}</p>}</form></main>;
 if(phase==='error')return <main className="studio-login"><div><h1>Could not load the documentation</h1><p role="alert">{error}</p><button onClick={()=>load()}>Retry</button></div></main>;
 return <>
  {(error||legacy)&&<div className="studio-sync-banner" role="status">
   {error&&<span>{error}</span>}
   {blocked&&<><button onClick={()=>download(current.current)}>Export local edits</button><button onClick={()=>{backupDraft();load(true);}}>Keep backup & load server</button><button onClick={()=>{halted.current=false;setBlocked(false);flush();}}>Retry save</button><button onClick={()=>setPhase('login')}>Sign in again</button></>}
   {legacy&&<><span>Your previous browser model is still available.</span><button onClick={()=>download(initial())}>Export browser model</button><button onClick={()=>{backupDraft();download(current.current);setModel(initial());setEpoch(e=>e+1);setLegacy(false);localStorage.setItem('studio-legacy-reviewed','1');}}>Back up server model & import browser model</button><button onClick={()=>{setLegacy(false);localStorage.setItem('studio-legacy-reviewed','1');}}>Keep server model</button></>}
  </div>}
  {availableRevision>0&&<div className="studio-sync-banner" role="status"><span>Documentation revision {availableRevision} is available. Loading it resets open JSON drafts.</span><button onClick={()=>{if(busy.current||pending.current){setError('Save or export your local changes before loading the newer revision.');return;}load(true);}}>Load latest documentation</button></div>}
  <App key={epoch} initialModel={model} onModelChange={changed} saveStatus={status} backendControls={<button onClick={async()=>{if(busy.current||pending.current){setError('Wait for your changes to save, or export them before signing out.');return;}await request('/api/session',{method:'DELETE'});setPhase('login');}}>Sign out</button>}/>
 </>;
}
