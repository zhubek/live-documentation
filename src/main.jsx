import JsonEditor, {JsonDialog} from './JsonEditor';
import SourceDocumentation from "./SourceDocumentation";
import SourceModule from "./SourceModule";
import useSidebarResize from "./useSidebarResize";
import ModuleRelations, {ModuleRelationsContext, matchesRelation} from "./ModuleRelations";
import InfrastructureExample from "./InfrastructureExample";
import { upgradeInfrastructureExamples } from "./infrastructure-examples";
import { retireProcessSketch } from "./retire-process-sketch";
import ModuleClasses from "./ModuleClasses";
import { upgradePermissionExamples } from "./permission-examples";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  memo,
  createContext,
  useContext,
} from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  ConnectionMode,
  MarkerType,
  applyNodeChanges,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";


import { seed } from "./seed";
import Explorer from "./Explorer";
import NextPage from "./NextPage";
import DatabaseView from "./DatabaseView";
import ProjectState from "./ProjectState";
import { upgradeNestModules } from "./nest-modules";
import ModuleSource from "./ModuleSource";
import { upgradeUnifiedDirectory } from "./unified-directory";
import { upgradeComponentTree } from "./component-tree";
import { upgradeProjectState } from "./project-state";
import { upgradeFrontend, upgradePageExamples } from "./next-page";
import { upgradeInlineQueryExamples } from "./query-examples";
import NodeIcon from "./NodeIcon";
import { ancestors, upgradeHierarchy as upgradeBase, drillTarget } from "./hierarchy";
import {
  templates,
  uid,
  validateModel,
  removeFromView,
  removeView,
  instantiate,
} from "./model";
const isInfra = (object) => object?.infrastructure ?? ["sentry", "postgres", "redis"].includes(object?.id);
const upgradeHierarchy = (model) => upgradeInfrastructureExamples(retireProcessSketch(upgradePermissionExamples(upgradeUnifiedDirectory(upgradeNestModules(upgradeComponentTree(upgradeInlineQueryExamples(upgradeProjectState(upgradePageExamples(upgradeFrontend(upgradeBase(model)))))))))));
const STORAGE = "fieldwork-model-studio-v1";
const Navigate = createContext(() => {});
const Card = memo(function Card({ data, selected }) {
  const go = useContext(Navigate);
  return (
    <article className={`node ${data.kind} ${selected ? "selected" : ""}`}>
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map(
        (side) => (
          <Handle
            key={side}
            id={side}
            type="source"
            position={side}
            aria-label={`${data.name}: ${side} connection`}
          />
        ),
      )}
      <div className="node-type">
        <NodeIcon kind={data.kind} />
        {isInfra(data) ? "Infra" : data.kind}
      </div>
      <strong>{data.name}</strong>
      {data.technology && <div className="technology">{data.technology}</div>}
      <p>{data.description}</p>
      {<details className="service-notes nodrag nopan nowheel" onDoubleClick={e => e.stopPropagation()}>
        <summary>Notes{data.notes ? '' : ' · add'}</summary>
        {data.notes ? <div className="service-notes-text">{data.notes}</div> : <p>Select this card and edit the notes field in its JSON. Logging, middleware, authorization, workers…</p>}
      </details>}
      {data.kind === "module" && <div className="module-facts">{!data.relations && <p><b>Imports:</b> {data.moduleImports?.join(', ') || 'None'}</p>}{data.moduleExports?.length>0 && <p><b>Exports:</b> {data.moduleExports.join(', ')}</p>}{data.sourcePath && <ModuleSource path={data.sourcePath} />}</div>}
      {data.relations && <ModuleRelations id={data.id} name={data.name} relations={data.relations}/>}
      {data.fields && <pre>{data.fields}</pre>}
      {data.drillTo && (
        <button
          className="drill nodrag nopan"
          onClick={(e) => {
            e.stopPropagation();
            go(data.drillTo);
          }}
        >
          Explore inside <span>↗</span>
        </button>
      )}
    </article>
  );
});
const nodeTypes = { model: Card };
// Keep transient dragging/measurement state in the canvas. Persist only a completed move.
// Rebuilding model nodes on every pointer move discarded React Flow's dragging state.
function FlowCanvas({ nodes, onPositionsCommit, ...props }) {
  const [canvasNodes, setCanvasNodes] = useState(nodes);
  useEffect(() => {
    setCanvasNodes((current) => {
      const previous = new Map(current.map((n) => [n.id, n]));
      return nodes.map((n) => ({ ...previous.get(n.id), ...n }));
    });
  }, [nodes]);
  const onNodesChange = useCallback((changes) => {
    setCanvasNodes((current) => applyNodeChanges(changes, current));
  }, []);
  return (
    <ReactFlow
      {...props}
      nodes={canvasNodes}
      onNodesChange={onNodesChange}
      onNodeDragStop={(_, node, moved) =>
        onPositionsCommit(moved?.length ? moved : [node])
      }
    />
  );
}
function arrowMarker(kind, color = "#718b91") {
  return kind === "none"
    ? undefined
    : {
        type: kind === "open" ? MarkerType.Arrow : MarkerType.ArrowClosed,
        color,
        width: 20,
        height: 20,
      };
}
export function initial() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw)
      return validateModel(upgradeHierarchy(validateModel(JSON.parse(raw))));
  } catch {}
  return upgradeHierarchy(structuredClone(seed));
}
export default function App({initialModel, onModelChange, saveStatus, backendControls}) {
  const [model, setModel] = useState(initialModel),
    [viewId, setView] = useState("service-landscape"),
    [projectOpen, setProjectOpen] = useState(false),
    [showInfra, setShowInfra] = useState(true),
    [selection, setSelection] = useState(null),
    [modal, setModal] = useState(false),
    [template, setTemplate] = useState("C1"),
    [notice, setNotice] = useState(""),

    [search, setSearch] = useState(""),
    [kind, setKind] = useState(""),
    [panel, setPanel] = useState(false);
  const [jsonTarget,setJsonTarget]=useState(null);
  const [relationFocus,setRelationFocus]=useState(null),[relationPreview,setRelationPreview]=useState(null);
  const sidebar=useSidebarResize(!projectOpen && !!(panel || selection));
  const history = useRef([]),
    future = useRef([]),
    file = useRef(),
    flow = useRef();
  const view = model.views.find((v) => v.id === viewId) || model.views[0];
  const moduleCanvas=view.template==='C3';
  useEffect(()=>{setRelationFocus(null);setRelationPreview(null);},[view.id,showInfra,projectOpen]);
  useEffect(()=>{
    if(!moduleCanvas)return;
    const escape=event=>{if(event.key==='Escape'){setRelationFocus(null);setRelationPreview(null);setSelection(current=>current?.type==='edge'?null:current);}};
    window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);
  },[moduleCanvas]);
  useEffect(() => { onModelChange(model); }, [model, onModelChange]);
  function commit(next) {
    validateModel(next);
    history.current.push(model);
    if (history.current.length > 80) history.current.shift();
    future.current = [];
    setModel(next);
  }
  function undo() {
    if (history.current.length) {
      future.current.push(model);
      setModel(history.current.pop());
      setSelection(null);
    }
  }
  function redo() {
    if (future.current.length) {
      history.current.push(model);
      setModel(future.current.pop());
      setSelection(null);
    }
  }
  const go = useCallback(
    (id) => {
      setProjectOpen(false);
      if (id === view.id) return;

      setView(id);
      setSelection(null);
      setPanel(false);
      setKind("");
    },
    [view.id],
  );
  const objects = useMemo(
    () => new Map(model.objects.map((o) => [o.id, o])),
    [model.objects],
  );
  const visibleRelations=useMemo(()=>model.relations.filter(relation=>
    view.objectIds.includes(relation.source)&&view.objectIds.includes(relation.target)&&
    (showInfra||(!isInfra(objects.get(relation.source))&&!isInfra(objects.get(relation.target))))
  ),[model.relations,view.objectIds,objects,showInfra]);
  const nodes = useMemo(
    () =>
      view.objectIds.map((id, i) => ({
        id,
        type: "model",
        hidden: !showInfra && isInfra(objects.get(id)),
        position: view.positions[id] || { x: i * 330, y: 100 },
        data: {
          ...objects.get(id),
          drillTo: drillTarget(model, view, objects.get(id)),
          relations: moduleCanvas ? visibleRelations.filter(relation=>relation.source===id||relation.target===id) : undefined,
        },
        selected: selection?.type === "node" && selection.id === id,
      })),
    [view, objects, selection, model.views, showInfra, moduleCanvas, visibleRelations],
  );
  const edges = useMemo(
    () =>
      model.relations
        .filter(
          (r) =>
            view.objectIds.includes(r.source) &&
            view.objectIds.includes(r.target),
        )
        .map((r) => ({
          ...r,
          hidden: (!showInfra && (isInfra(objects.get(r.source)) || isInfra(objects.get(r.target)))) ||
            (moduleCanvas && !matchesRelation(relationFocus,r) && !matchesRelation(relationPreview,r) && !(selection?.type==='edge'&&selection.id===r.id)),
          type: r.lineType || "smoothstep",
          sourceHandle: r.sourceHandle || "right",
          targetHandle: r.targetHandle || "left",
          reconnectable: true,
          interactionWidth: 24,
          animated: r.animated || false,
          selected: selection?.type === "edge" && selection.id === r.id,
          markerStart: arrowMarker(r.startArrow || "none", r.color),
          markerEnd: arrowMarker(r.endArrow || "closed", r.color),
          style: {
            stroke: r.color || "#718b91",
            strokeWidth: r.width || 1.5,
            strokeDasharray: r.dashed ? "8 5" : undefined,
          },
          labelStyle: { fill: "#435c64", fontSize: 11 },
          labelBgStyle: { fill: "#ffffff", stroke: "#b8ccca", strokeWidth: 1 },
          labelBgPadding: [9, 6],
          labelBgBorderRadius: 4,
        })),
    [model.relations, view, selection, showInfra, objects, moduleCanvas, relationFocus, relationPreview],
  );
  const selected =
    selection?.type === "node"
      ? objects.get(selection.id)
      : model.relations.find((r) => r.id === selection?.id);
  const selectedDrill =
    selection?.type === "node" && selected
      ? drillTarget(model, view, selected)
      : undefined;
  function replaceRecord(collection,id,value) {
    if(value?.id!==id)throw Error('Keep the existing id. Use workspace JSON to rename references together.');
    return validateModel({...model,[collection]:model[collection].map(item=>item.id===id?value:item)});
  }
  function jsonValue() {
    if(jsonTarget.type==='model')return model;
    if(jsonTarget.type==='project')return model.projectState||{entries:[]};
    if(['new','relation'].includes(jsonTarget.type))return jsonTarget.value;
    const target=model.views.find(v=>v.id===jsonTarget.id);
    return jsonTarget.type==='page'?target.pageSpec:target;
  }
  function jsonModel(value) {
    if(jsonTarget.type==='model')return validateModel(value);
    if(jsonTarget.type==='project')return validateModel({...model,projectState:value});
    if(jsonTarget.type==='relation')return validateModel({...model,relations:[...model.relations,value]});
    if(jsonTarget.type==='new'){
      if(!value||Object.keys(value).some(k=>!['view','objects'].includes(k))||!Array.isArray(value.objects))throw Error('Expected {view: object, objects: array}.');
      return validateModel({...model,objects:[...model.objects,...value.objects],views:[...model.views,value.view]});
    }
    const target=model.views.find(v=>v.id===jsonTarget.id);
    return replaceRecord('views',target.id,jsonTarget.type==='page'?{...target,pageSpec:value}:value);
  }
  function updateView(patch) {
    commit({
      ...model,
      views: model.views.map((v) =>
        v.id === view.id ? { ...v, ...patch } : v,
      ),
    });
  }
  function add() {
    const id = uid("object");
    const k = kind || templates[view.template].kinds[0];
    const pos = flow.current?.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }) || { x: 200, y: 200 };
    commit({
      ...model,
      objects: [
        ...model.objects,
        { id, kind: k, name: `New ${k}`, description: "" },
      ],
      views: model.views.map((v) =>
        v.id === view.id
          ? {
              ...v,
              objectIds: [...v.objectIds, id],
              positions: { ...v.positions, [id]: pos },
            }
          : v,
      ),
    });
    setSelection({ type: "node", id });
  }
  function connect(c) {
    if(!c.source||!c.target)return false;
    if (
      c.source === c.target ||
      model.relations.some(
        (r) => r.source === c.source && r.target === c.target,
      )
    ) {
      setNotice(
        "That connection already exists, or connects an object to itself.",
      );
      return false;
    }
    const r = {
      id: uid("relation"),
      source: c.source,
      target: c.target,
      sourceHandle: c.sourceHandle || "right",
      targetHandle: c.targetHandle || "left",
      label: "relates to",
    };
    commit({ ...model, relations: [...model.relations, r] });
    setSelection({ type: "edge", id: r.id });
    if(moduleCanvas)setRelationFocus({type:'edge',id:r.id});
    return true;
  }
  function updateRelation(id, patch) {
    const current = model.relations.find((r) => r.id === id);
    const next = { ...current, ...patch };
    if (
      next.source === next.target ||
      model.relations.some(
        (r) =>
          r.id !== id && r.source === next.source && r.target === next.target,
      )
    ) {
      setNotice(
        "Choose different endpoints without duplicating an existing relationship.",
      );
      return;
    }
    commit({
      ...model,
      relations: model.relations.map((r) => (r.id === id ? next : r)),
    });
  }
  function layout() {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: "LR", nodesep: 90, ranksep: 110 });
    graph.setDefaultEdgeLabel(() => ({}));
    const measured=new Map((flow.current?.getNodes()||[]).map(node=>[node.id,node.measured]));
    nodes.forEach((n) => graph.setNode(n.id, { width: measured.get(n.id)?.width||250, height: measured.get(n.id)?.height||250 }));
    edges.forEach((e) => graph.setEdge(e.source, e.target));
    dagre.layout(graph);
    updateView({
      positions: Object.fromEntries(
        nodes.map((n) => {
          const p = graph.node(n.id);
          return [n.id, { x: p.x - p.width/2, y: p.y - p.height/2 }];
        }),
      ),
    });
    setTimeout(
      () => flow.current?.fitView({ padding: 0.22, duration: 250 }),
      80,
    );
  }
  function remove() {
    if (!selected) return;
    if (selection.type === "node")
      commit(removeFromView(model, view.id, [selected.id]));
    else
      commit({
        ...model,
        relations: model.relations.filter((r) => r.id !== selected.id),
      });
    setSelection(null);
  }
  function exportModel() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(model, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "fieldwork-model.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Exported model, relationships, views, and layouts.");
  }
  async function importModel(e) {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 5_000_000) throw Error("File is too large (maximum 5 MB).");
      const m = validateModel(
        upgradeHierarchy(validateModel(JSON.parse(await f.text()))),
      );
      commit(m);
      setView(m.views[0].id);

      setSelection(null);
      setNotice("Model imported. Undo restores your previous model.");
    } catch (err) {
      setNotice(`Import failed: ${err.message}`);
    }
    e.target.value = "";
  }
  return (
    <Navigate.Provider value={go}>
    <ModuleRelationsContext.Provider value={{
      focus:relationFocus,selection,names:new Map(model.objects.map(object=>[object.id,object.name])),
      objects:view.objectIds.map(id=>objects.get(id)).filter(object=>showInfra||!isInfra(object)),
      preview:setRelationPreview,connect,
      draftRelation:source=>{const target=view.objectIds.find(id=>id!==source&&!model.relations.some(r=>r.source===source&&r.target===id));if(!target){setNotice('No other modules available to connect.');return;}setJsonTarget({type:'relation',value:{id:uid('relation'),source,target,label:'relates to',sourceHandle:'right',targetHandle:'left'}});},
      pinNode:id=>{setRelationFocus(current=>current?.type==='node'&&current.id===id?null:{type:'node',id});setSelection(null);setPanel(false);setRelationPreview(null);},
      pinEdge:id=>{setRelationFocus({type:'edge',id});setSelection({type:'edge',id});setPanel(false);setRelationPreview(null);},
    }}>
      <div style={{'--sidebar-width':`${sidebar.width}px`}} className={`app ${sidebar.dragging ? "resizing-sidebar" : ""} ${projectOpen ? "project-mode" : ""} ${projectOpen || (!panel && !selection) ? "inspector-hidden" : ""}`}>
        <header>
          <div className="brand">
            <span className="logo">L</span>
            <div>
              <b>Live documentation</b>
            </div>
            <span className="version">PREVIEW 01</span>
          </div>
          <div className="header-actions">
            <span className="saved">● {saveStatus}</span>{backendControls}<button onClick={()=>setJsonTarget({type:'model'})}>Edit JSON</button>
            <button onClick={() => file.current.click()}>Import JSON</button>
            <button onClick={exportModel}>Export JSON ↗</button>
            <button className="primary" onClick={() => setModal(true)}>
              ＋ New view
            </button>
            <input
              ref={file}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={importModel}
            />
          </div>
        </header>
        <aside className="sidebar" id="workspace-sidebar">
          <div className="workspace-title">WORKSPACE</div>
          <h2>{model.name || "My system"}</h2>
          <p className="muted">One model. Multiple perspectives.</p>
          <button className={`project-state-link ${projectOpen ? "active" : ""}`} onClick={() => { setProjectOpen(true); setSelection(null); }}>State & storage <span>{model.projectState?.entries.length || 0}</span></button>
          <div className="section-label">
            EXPLORER <span>{model.views.length}</span>
          </div>
          <Explorer
            model={model}
            activeId={projectOpen ? null : view.id}
            onSelect={go}
            search={search}
            onSearch={setSearch}
          />
        </aside>
        <div className="sidebar-resizer" {...sidebar.resizeProps}/>
        {projectOpen ? <ProjectState onEdit={()=>setJsonTarget({type:'project'})} model={model} onNavigate={go} onChange={projectState => commit({ ...model, projectState })} /> : <main>
          <div className="view-heading">
            <div className="breadcrumbs">
              <button
                onClick={() => {
                  setView(model.views[0].id);
                  setSelection(null);
                }}
              >
                Workspace
              </button>
              {ancestors(model, view.id).map((parent) => (
                <React.Fragment key={parent.id}>
                  <span>/</span>
                  <button onClick={() => go(parent.id)}>{parent.name}</button>
                </React.Fragment>
              ))}
              <span>/</span>
              <span>{view.template}</span>
            </div>
            <div className="view-title">
              <div>
                <h1>{view.name}</h1>
                <p>{templates[view.template].hint}</p>
              </div>
              <span className="level">{view.template}</span>
            </div>
          </div>
          <div className="toolbar">
            <div style={(view.moduleSpec || view.documentation || ["NEXT","ERD","REDIS","AGENT"].includes(view.template) || view.id === "components") ? { display: "none" } : undefined}>
              <select
                aria-label="New object type"
                value={kind || templates[view.template].kinds[0]}
                onChange={(e) => setKind(e.target.value)}
              >
                {templates[view.template].kinds.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <button onClick={add}>＋ Add object</button>
              <button onClick={layout}>Auto layout</button>
              <label className="infra-toggle"><input type="checkbox" checked={showInfra} onChange={(e) => { setShowInfra(e.target.checked); setSelection(null); }} />Show infrastructure</label>
            </div>
            <div>
              <button
                className="inspector-toggle"
                aria-expanded={panel}
                onClick={() => {
                  setSelection(null);
                  setPanel(!panel);
                }}
              >
                View settings
              </button>
              <button
                onClick={undo}
                disabled={!history.current.length}
                aria-label="Undo"
              >
                ↶
              </button>
              <button
                onClick={redo}
                disabled={!future.current.length}
                aria-label="Redo"
              >
                ↷
              </button>
            </div>
          </div>
          {view.moduleSpec ? <SourceModule key={view.id} spec={view.moduleSpec} schema={model.views.find(v=>v.id===view.moduleSpec.databaseViewId)?.databaseSchema} onNavigate={go}/> : view.documentation ? <SourceDocumentation key={view.id} documentation={view.documentation} /> : ["REDIS","AGENT"].includes(view.template) ? <InfrastructureExample key={view.id} type={view.template} view={view} onChange={updateView} /> : view.id === "components" ? <ModuleClasses onNavigate={go} /> : view.template === "ERD" ? <DatabaseView key={view.id} view={view} model={model} /> : view.template === "NEXT" ? <NextPage onEdit={()=>setJsonTarget({type:'page',id:view.id})} key={view.id} layouts={(view.pageSpec?.layoutIds || []).map(id => model.layouts?.find(l => l.id === id)).filter(Boolean)} view={view} onChange={updateView} onNavigate={go} /> : <div className="canvas">
            <FlowCanvas
              key={view.id}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onInit={(i) => (flow.current = i)}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.15}
              maxZoom={1.6}
              onNodeClick={(_, n) => setSelection({ type: "node", id: n.id })}
              onEdgeClick={(_, e) => setSelection({ type: "edge", id: e.id })}
              onPaneClick={() => {setSelection(null);setRelationFocus(null);setRelationPreview(null);}}
              onNodeDoubleClick={(_, n) => n.data.drillTo && go(n.data.drillTo)}
              onPositionsCommit={(dragged) => {
                const changed = dragged.filter((n) => {
                  const p = view.positions[n.id];
                  return !p || p.x !== n.position.x || p.y !== n.position.y;
                });
                if (changed.length)
                  updateView({
                    positions: {
                      ...view.positions,
                      ...Object.fromEntries(
                        changed.map((n) => [n.id, n.position]),
                      ),
                    },
                  });
              }}
              onReconnect={(edge, connection) =>
                updateRelation(edge.id, {
                  source: connection.source,
                  target: connection.target,
                  sourceHandle: connection.sourceHandle || "right",
                  targetHandle: connection.targetHandle || "left",
                })
              }
              connectionMode={ConnectionMode.Loose}
              reconnectRadius={16}
              onConnect={connect}
              deleteKeyCode={null}
            >
              <Background color="#cbd5da" gap={22} size={1} />
              <Controls showInteractive={false} />
              <MiniMap
                nodeColor="#b3cac3"
                maskColor="rgba(241,245,244,.75)"
                pannable
                zoomable
              />
            </FlowCanvas>
            <div className="canvas-tip">
              {moduleCanvas ? 'Hover Relations to preview · Click to pin and edit · Click canvas or Esc to hide' : 'Drag to arrange · Connect any side · Explore inside to drill down'}
            </div>
          </div>
          }
          <footer>
            <span>
              {nodes.length} objects · {edges.length} relationships
            </span>
            <span>Changes edit the model · application code is unchanged</span>
          </footer>
        </main>}
        {!projectOpen && (panel || selection) && <aside className="inspector panel-open json-inspector">
          <button className="close-inspector" aria-label="Close inspector" onClick={()=>{setPanel(false);setSelection(null);}}>×</button>
          <div className="section-label">{selected?'OBJECT / RELATIONSHIP JSON':'VIEW JSON'}</div>
          <h2>{selected?(selection.type==='node'?selected.name:'Connection'):view.name}</h2>
          {selected?<>
            <JsonEditor key={selected.id} label={selection.type==='node'?'Object JSON':'Relationship JSON'} value={selected} validate={value=>replaceRecord(selection.type==='node'?'objects':'relations',selected.id,value)} onSave={value=>commit(replaceRecord(selection.type==='node'?'objects':'relations',selected.id,value))}/>
            {selectedDrill&&<button onClick={()=>go(selectedDrill)}>Open linked view ↗</button>}
            <p className="muted">Shared definition. View-specific drillTargets are in View JSON. Drag cards and connection endpoints directly on the canvas.</p>
            <button onClick={()=>setJsonTarget({type:'view',id:view.id})}>Open view JSON</button>
            <button className="danger" onClick={remove}>{selection.type==='node'?'Remove from this view':'Delete relationship'}</button>
          </>:<>
            <button onClick={()=>setJsonTarget({type:'view',id:view.id})}>Open expanded JSON editor</button>
            <JsonEditor key={view.id} label="View JSON" value={view} validate={value=>replaceRecord('views',view.id,value)} onSave={value=>commit(replaceRecord('views',view.id,value))}/>
            <button className="danger" disabled={model.views.length<2} onClick={()=>{const next=removeView(model,view.id);commit(next);setView(next.views[0].id);setPanel(false);}}>Delete this view</button>
          </>}
        </aside>}
        {jsonTarget&&<JsonDialog key={jsonTarget.type+(jsonTarget.id||'')} title={jsonTarget.type==='model'?'Workspace JSON':jsonTarget.type==='new'?'New view JSON':jsonTarget.type==='relation'?'New relationship JSON':jsonTarget.type==='page'?'Page JSON':jsonTarget.type==='project'?'State & storage JSON':'View JSON'} label="Documentation JSON" value={jsonValue()} allowUnchanged={['new','relation'].includes(jsonTarget.type)} validate={jsonModel} onSave={value=>{commit(jsonModel(value));if(jsonTarget.type==='new'){setView(value.view.id);setSelection(null);}if(jsonTarget.type==='relation'){setSelection({type:'edge',id:value.id});setRelationFocus({type:'edge',id:value.id});}setJsonTarget(null);}} onCancel={()=>setJsonTarget(null)}/>}
        {notice && (
          <div role="status" className="toast">
            {notice}
            <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        )}
        {modal && (
          <div className="modal-backdrop">
            <section
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-label="Create view"
            >
              <div className="modal-head">
                <span className="eyebrow">START WITH A PERSPECTIVE</span>
                <button
                  aria-label="Close templates"
                  onClick={() => setModal(false)}
                >
                  ×
                </button>
              </div>
              <h2>A new view of your system</h2>
              <p className="muted">
                Templates define a starting structure. Objects remain editable
                and reusable.
              </p>
              <div className="template-grid">
                {Object.entries(templates).map(([key, t]) => (
                  <button
                    className={template === key ? "chosen" : ""}
                    key={key}
                    onClick={() => setTemplate(key)}
                  >
                    <b>{key}</b>
                    <strong>{t.name}</strong>
                    <small>{t.hint}</small>
                  </button>
                ))}
              </div>
              <div className="modal-actions">
                <button onClick={() => setModal(false)}>Cancel</button>
                <button
                  className="primary"
                  onClick={() => {
                    const result = instantiate(model,template,templates[template].name,template==='C0'?undefined:view.id);
                    setModal(false);
                    setJsonTarget({type:'new',value:{view:result.model.views.at(-1),objects:result.model.objects.slice(model.objects.length)}});
                  }}
                >
                  Prepare {template} JSON →
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </ModuleRelationsContext.Provider>
    </Navigate.Provider>
  );
}
