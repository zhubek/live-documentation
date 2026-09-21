const path='apps/web/src/';
const source=(file,symbol)=>({path:path+file,symbol});
const ws=source('features/workspace/components/workspace.tsx','WorkspaceSession');
const hook=source('features/workspace/hooks/use-workspace.ts','useWorkspace');
const lab=source('features/orders/components/orders-lab.tsx','OrdersLab');
const card=(name,headers,values,sources,detail='')=>({name,section:'State & storage',tab:'State & storage',table:{headers,values},sources,detail,related:[]});
export function stateRows(spec) {
 if(spec.stateRows) return spec.stateRows.map(row=>({...row,section:'State & storage',tab:'State & storage',related:[]}));
 const route=spec.route;
 const rows=[];
 if(route==='/') {
 rows.push(card('Shared page state',['Name','Type / initial','Owner','Used by','Updated by'],[
 ['actor','string / "maya"','Workspace','WorkspaceSession; HTTP identity; WebSocket identity','Identity picker → setActor'],
 ['project','string / ""','WorkspaceSession','useWorkspace projectId; project selection','Project buttons → setProject'],
 ['status','string / ""','WorkspaceSession','useWorkspace filter','Status filter → setStatus'],
 ['search','string / ""','WorkspaceSession','useWorkspace filter','Search input → setSearch'],
 ['selected','string / ""','WorkspaceSession','AssignmentDetail lookup','Assignment click / onClose'],
 ['creating','boolean / false','WorkspaceSession','CreateAssignment visibility','New assignment / onClose / onDone'],
 ['busy','string / ""','WorkspaceSession','Start and Complete buttons','change(): assignment id → ""'],
 ['actionError','string / ""','WorkspaceSession','Action error display','change() catch / next action'],
 ['inspect','boolean / false','WorkspaceSession','Query inspector','Inspector toggle'],
 ],[source('features/workspace/components/workspace.tsx','Workspace'),ws],'Persistence: memory only. Actor change remounts WorkspaceSession via key={actor}; session state resets. Reload resets all state.'));
 rows.push(card('Remote data & connection state',['Name','Type / initial','Owner','Used by','Updated by'],[
 ['data','WorkspaceData | null / null','useWorkspace','WorkspaceSession, AssignmentDetail, CreateAssignment','WORKSPACE response → setData'],
 ['error','string / ""','useWorkspace','Workspace error display','Query catch / success'],
 ['connection','string / "Connecting"','useWorkspace','Connection indicator','connected / closed / error callbacks'],
 ['lastEvent','string / "Waiting for subscription"','useWorkspace','Event indicator','workspaceChanged.kind'],
 ],[hook],'React state; not localStorage or a global store. Events and focus cause HTTP refetch; the response replaces data.'));
 } else if(route==='/orders-lab') {
 rows.push(card('Page state',['Name','Type / initial','Owner','Used by','Updated by'],[
 ['actor','string / "alice"','OrdersLab','Query / mutation identity','Identity select'],
 ['includeTotal','boolean / false','OrdersLab','ordersQuery selection set','Checkbox'],
 ['identities','Identity[] / []','OrdersLab','Identity selector','DEMO_USERS response'],
 ['result','GraphQLResult<PageData> | null / null','OrdersLab','Orders table / response inspector','Query response'],
 ['revision','number / 0','OrdersLab','Query effect dependency','Refresh action'],
 ['busy','boolean / false','OrdersLab','Action controls','runMutation start / finally'],
 ['error','string / ""','OrdersLab','Error display','Request failure / action start'],
 ['title','string / ""','OrdersLab','Create form','Input / successful mutation'],
 ['mutation','{ query: string; variables: unknown; response: unknown } | null / null','OrdersLab','Mutation inspector','runMutation response'],
 ['identityRetry','number / 0','OrdersLab','Identity effect dependency','Retry action'],
 ],[lab],'Memory only; reset on remount/reload. No global state store.'));
 }
 if(['/', '/orders-lab','/guide'].includes(route)) rows.push(card('Browser storage',['Storage','Keys','Reads / writes','Expiry','Cross-tab sync'],[
 ['localStorage','None','None','Not applicable','None'],['sessionStorage','None','None','Not applicable','None']
 ],route==='/'?[ws,hook]:route==='/orders-lab'?[lab]:[source('app/guide/page.tsx','Guide')],'These Next.js pages do not use browser storage. Model Studio diagram persistence is a separate application.'));
 return rows;
}
