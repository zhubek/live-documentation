import JsonEditor from './JsonEditor';
import {validateFragment} from './model-schema';
import React, {useState,useEffect} from 'react';
import {ReactFlow, Background, Controls, MiniMap, Handle, Position, MarkerType, applyNodeChanges, applyEdgeChanges, ConnectionMode, BaseEdge, EdgeLabelRenderer, getSmoothStepPath, getBezierPath, getStraightPath} from '@xyflow/react';

function Step({data}) {
 return <article className={`agent-canvas-node ${data.terminal?'terminal':''}`}>
  {Object.entries({left:Position.Left,top:Position.Top,right:Position.Right,bottom:Position.Bottom}).map(([id,position])=><Handle key={id} id={id} type="source" position={position} aria-label={`${data.name}: ${id} connection`}/>)}
  <small>{data.kind}</small><strong>{data.name}</strong>
  <button className="nodrag nopan" onClick={data.open}>Details ↗</button>
 </article>;
}
const nodeTypes={step:Step};
function TransitionEdge(props) {
 const [path,x,y]=props.data.lineType==='straight'?getStraightPath(props):props.data.lineType==='default'?getBezierPath(props):getSmoothStepPath({...props,borderRadius:props.data.lineType==='step'?0:5});
 return <>
  <BaseEdge id={props.id} path={path} markerStart={props.markerStart} markerEnd={props.markerEnd} style={{...props.style,...(props.selected?{filter:'drop-shadow(0 0 2px #215f50)'}:{})}} interactionWidth={20}/>
  <EdgeLabelRenderer><button className="agent-transition-label nodrag nopan" style={{position:'absolute',transform:`translate(-50%, -50%) translate(${x}px, ${y}px)`,pointerEvents:'all'}} onClick={event=>{event.stopPropagation();props.data.open();}}>{props.label}</button></EdgeLabelRenderer>
 </>;
}
const edgeTypes={transition:TransitionEdge};
const positions=[{x:0,y:80},{x:300,y:80},{x:600,y:80},{x:900,y:80},{x:1200,y:80},{x:1500,y:80}];
const routes=[
 ['0','1','Context loaded','Only permitted project context is passed to the model.'],
 ['1','2','Draft ready','Validate the structured proposal before asking for approval.'],
 ['2','3','Valid','All schema and reference checks passed.'],
 ['2','1','Invalid · retry ≤ 2','Return validation errors to Draft plan. Retry at most twice.','branch','return'],
 ['2','failed','Retries exhausted','Stop after the validation retry budget is exhausted.','branch'],
 ['3','4','Approved','Verify approver, organization and exact proposal version before executing.'],
 ['3','1','Revise','Resume the interrupted run with feedback and generate a new proposal requiring approval.','branch','return'],
 ['3','cancelled','Rejected','End without executing business actions.','branch'],
 ['4','5','Results collected','Summarize committed IDs and per-item failures; do not claim failed writes succeeded.'],
 ['5','completed','All succeeded','All approved actions succeeded.'],
 ['5','partial','Some failed','Retain successful results and report each failure.','branch'],
];
export default function AgentWorkflowCanvas({steps,showStep,show,config={},onChange}) {
 const [selectedId,setSelectedId]=useState(null);
 const [nodes,setNodes]=useState(()=>[
  ...steps.map((s,i)=>({id:String(i),type:'step',position:positions[i],data:{...s,open:()=>showStep(s)}})),
  ...[['failed','Failed',600,380],['cancelled','Cancelled',950,530],['completed','Completed',1800,80],['partial','Partial failure',1800,380]].map(([id,name,x,y])=>({id,type:'step',position:{x,y},data:{name,kind:'Outcome',terminal:true,open:()=>show(name,<p>{name==='Failed'?'Execution stops on an unrecoverable error or exhausted budget. Previously committed actions remain committed.':name==='Cancelled'?'The proposal was rejected. No business actions are executed.':name==='Completed'?'All approved actions succeeded.':'Some actions succeeded; failed items are reported explicitly.'}</p>)}}))
 ]);
 useEffect(()=>{if(config?.positions)setNodes(current=>current.map(n=>({...n,position:config.positions[n.id]||n.position})));},[config?.positions]);
 const [edges,setEdges]=useState(()=>routes.map(([source,target,label,description,sourceHandle,targetHandle],i)=>({id:String(i),source,target,label,sourceHandle:sourceHandle==='branch'?'bottom':'right',targetHandle:targetHandle==='return'?'top':'left',type:'transition',reconnectable:true,data:{description,open:()=>show(label,<p>{description}</p>)},markerEnd:{type:MarkerType.ArrowClosed,color:'#557c78'},style:{stroke:'#557c78',strokeWidth:1.5,...(target==='1'?{strokeDasharray:'6 4'}:{})}})));
 const savedEdges=edges.map(edge=>{
  const saved=config?.edges?.[edge.id]||{};
  const color=saved.color||'#557c78';
  const arrow=kind=>kind==='none'?undefined:{type:kind==='open'?MarkerType.Arrow:MarkerType.ArrowClosed,color};
  const label=saved.label??edge.label;
  return {...edge,...saved,markerStart:arrow(saved.startArrow||'none'),markerEnd:arrow(saved.endArrow||'closed'),animated:!!saved.animated,style:{stroke:color,strokeWidth:saved.width||1.5,strokeDasharray:(saved.dashed??!!edge.style.strokeDasharray)?'6 4':undefined},data:{...edge.data,lineType:saved.lineType||'smoothstep',open:()=>show(label,<p>{edge.data.description}</p>)}};
 });
 const selected=savedEdges.find(e=>e.id===selectedId);
 const editable=selected?Object.fromEntries(['id','source','target','label','sourceHandle','targetHandle','lineType','color','width','startArrow','endArrow','dashed','animated'].map(key=>[key,selected[key]??{lineType:'smoothstep',color:'#557c78',width:1.5,startArrow:'none',endArrow:'closed',dashed:!!selected.style.strokeDasharray,animated:false}[key]])):null;
 const checked=value=>{
   validateFragment({edges:{[selectedId]:value}},'agentCanvas');
   if(value.id!==selectedId)throw Error('Keep the existing transition id.');
   if(!nodes.some(n=>n.id===value.source)||!nodes.some(n=>n.id===value.target))throw Error('Both endpoints must reference workflow node ids.');
 };
 return <>
  <p className="muted">Drag nodes to arrange · select a line, then drag either endpoint to any side of a box · click a transition label for details.</p>
  <div className="agent-workflow-canvas" aria-label="Assignment planner workflow canvas">
   <ReactFlow nodes={nodes} edges={savedEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={changes=>setNodes(current=>applyNodeChanges(changes,current))} onNodeDragStop={(_,node)=>onChange?.({...config,positions:{...config?.positions,[node.id]:node.position}})} onEdgesChange={changes=>setEdges(current=>applyEdgeChanges(changes,current))} onEdgeClick={(_,edge)=>setSelectedId(edge.id)} onPaneClick={()=>setSelectedId(null)} onReconnect={(edge,connection)=>onChange?.({...config,edges:{...config?.edges,[edge.id]:{...config?.edges?.[edge.id],...connection}}})} connectionMode={ConnectionMode.Loose} reconnectRadius={16} onNodeDoubleClick={(_,node)=>node.data.open()} fitView minZoom={0.2} maxZoom={2} deleteKeyCode={null} fitViewOptions={{padding:0.18}}>
    <Background gap={22} size={1} color="#cbd5da"/><Controls showInteractive={false}/><MiniMap pannable zoomable/>
   </ReactFlow>
  </div>
  {selected&&<aside className="agent-arrow-inspector" aria-label="Transition properties">
   <button className="close-inspector" aria-label="Close transition properties" onClick={()=>setSelectedId(null)}>×</button>
   <small>PROPERTIES · TRANSITION</small><h2>Connection</h2>
   <p>{nodes.find(n=>n.id===selected.source)?.data.name} → {nodes.find(n=>n.id===selected.target)?.data.name}</p>
   <JsonEditor key={selectedId} label="Transition JSON" value={editable} validate={checked} onSave={value=>onChange?.({...config,edges:{...config.edges,[selectedId]:value}})}/>
   <p className="muted">Drag either endpoint to reconnect. Changes are saved in this view and included in JSON exports. They edit the workflow design, not executable routing code.</p>
  </aside>}
  <p className="muted">Dashed paths return to drafting. Unrecoverable errors from any active step end the run as Failed; these shared error paths are omitted to keep the graph readable. This canvas documents the proposed workflow.</p>
 </>;
}
