import {useEffect,useRef,useState} from 'react';

const STORAGE='fieldwork-studio-sidebar-width';
const defaultWidth=()=>window.innerWidth<=1000?220:window.innerWidth<=1150?240:280;
export default function useSidebarResize(inspectorVisible){
 const [preferred,setPreferred]=useState(()=>{
  try{const saved=localStorage.getItem(STORAGE),value=Number(saved);if(saved&&Number.isFinite(value))return Math.max(180,Math.min(600,value));}catch{}
  return defaultWidth();
 });
 const [viewport,setViewport]=useState(()=>window.innerWidth),[dragging,setDragging]=useState(false);
 const drag=useRef(null);
 // Keep useful space for the canvas and an open desktop inspector.
 const inspector=inspectorVisible&&viewport>850?(viewport>1150?275:240):0;
 const max=Math.max(180,Math.min(600,viewport-inspector-320));
 const width=Math.min(preferred,max);
 const clamp=value=>Math.max(180,Math.min(max,value));
 useEffect(()=>{const resize=()=>setViewport(window.innerWidth);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 useEffect(()=>{try{localStorage.setItem(STORAGE,String(preferred));}catch{}},[preferred]);
 const stop=()=>{drag.current=null;setDragging(false);};
 return {width,dragging,resizeProps:{
  role:'separator',tabIndex:0,'aria-label':'Resize workspace sidebar','aria-orientation':'vertical','aria-controls':'workspace-sidebar','aria-valuemin':180,'aria-valuemax':max,'aria-valuenow':Math.round(width),
  title:'Drag to resize sidebar. Arrow keys adjust width; double-click resets.',
  onPointerDown:event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,width};setDragging(true);},
  onPointerMove:event=>{if(drag.current)setPreferred(clamp(drag.current.width+event.clientX-drag.current.x));},
  onPointerUp:event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);stop();},
  onPointerCancel:stop,onLostPointerCapture:stop,
  onDoubleClick:()=>setPreferred(defaultWidth()),
  onKeyDown:event=>{let next;if(event.key==='ArrowLeft')next=width-(event.shiftKey?50:10);else if(event.key==='ArrowRight')next=width+(event.shiftKey?50:10);else if(event.key==='Home')next=180;else if(event.key==='End')next=max;else return;event.preventDefault();setPreferred(clamp(next));},
 }};
}
