const base = 'apps/web/src/';
const ref = (path, symbol) => ({ path: base + path, symbol });
const workspace = ref('features/workspace/components/workspace.tsx', 'WorkspaceSession');
const hook = ref('features/workspace/hooks/use-workspace.ts', 'useWorkspace');
const ops = (symbol) => ref('features/workspace/graphql/workspace.operations.ts', symbol);
export const pageSpec = {
  route: '/', rendering: 'Server page entry + hydrated Client Components',
  revalidation: 'No explicit ISR interval or route revalidation configured. Static shell eligibility inferred from source; deployment rendering not verified.',
  dataLoading: 'Workspace data loads client-side after mount; no server-side workspace fetch in page.tsx.',
  sections: {
    Components: [
      { name: 'Page → Workspace', detail: 'Server page composes the client entry. No props passed.', sources: [ref('app/page.tsx', 'Page'), ref('features/workspace/components/workspace.tsx', 'Workspace')] },
      { name: 'Workspace → WorkspaceSession', detail: 'Props: actor:string, setActor callback. key={actor} remounts the session and resets its state when identity changes.', sources: [workspace] },
      { name: 'WorkspaceSession → AssignmentDetail', detail: 'Props: assignment, data, actor, refresh, onClose. Rendered for the selected assignment. Owns comments, comment draft, busy and error state.', sources: [workspace, ref('features/workspace/components/assignment-detail.tsx', 'AssignmentDetail')] },
      { name: 'WorkspaceSession → CreateAssignment', detail: 'Props: data, actor, onClose, onDone. Shown when creating is true. Submission refreshes workspace data.', sources: [workspace, ref('features/workspace/components/create-assignment.tsx', 'CreateAssignment')] },
    ],
    Permissions: [
      { name: 'Complete / start assignment', detail: 'Server-provided canComplete / canStart disable actions; completeReason / startReason explain why. busy also disables action. Backend rechecks authorization and state.', sources: [workspace, ops('WORKSPACE')], target: 'process' },
      { name: 'Create and assign', detail: 'workspaceViewer.canCreate gates New assignment. canManage controls available assignees in the creation form.', sources: [workspace, ref('features/workspace/components/create-assignment.tsx', 'CreateAssignment'), ops('WORKSPACE')] },
      { name: 'Comment', detail: 'assignment.capabilities.canComment disables editor and submit. Busy and an empty body also disable submission.', sources: [ref('features/workspace/components/assignment-detail.tsx', 'AssignmentDetail')] },
    ],
    'API & triggers': [
      { name: 'Mount / filter change → Workspace query → data', detail: 'actor, projectId, status or search change schedules a query after 100ms. Previous effect aborts. In-flight refreshes coalesce into one follow-up.', sources: [hook, ops('WORKSPACE')] },
      { name: 'Complete / Start click → mutation → refresh', detail: 'Set busy; send id; on success refetch workspace; surface actionError on failure; clear busy in finally. No optimistic update.', sources: [workspace, ops('COMPLETE'), ops('START')], target: 'process' },
      { name: 'Open detail / data change → Comments query', detail: 'Effect depends on actor, assignment.id and data. Cleanup aborts the previous request.', sources: [ref('features/workspace/components/assignment-detail.tsx', 'AssignmentDetail'), ops('COMMENTS')] },
      { name: 'Submit forms → Create / Comment → refresh', detail: 'Mutations run on submission. Comment clears its draft after success. Creation invokes onDone. Requests POST to /graphql through the Next.js rewrite.', sources: [ops('CREATE'), ops('COMMENT'), ref('lib/graphql/client.ts', 'request')] },
    ],
    'State & cache': [
      { name: 'Local state ownership', detail: 'Workspace owns actor. WorkspaceSession owns project, status, search, selected, creating, busy, actionError and inspect. Filters are local, not URL state.', sources: [workspace] },
      { name: 'Remote data in React state', detail: 'useWorkspace owns data, error, connection and lastEvent. Custom fetch hook; no React Query / SWR cache or persisted browser store here.', sources: [hook] },
      { name: 'Next.js vs backend cache', detail: 'No explicit Next.js data-cache policy for workspace data: browser POST requests load it. Dashboard Redis caching is a separate backend concern; organization and permission scope must remain isolated.', sources: [ref('app/page.tsx', 'Page'), ref('lib/graphql/client.ts', 'request')], target: 'containers' },
    ],
    Realtime: [
      { name: 'Actor → connection → WorkspaceChanges', detail: 'graphql-ws connects with demo actor parameters. One subscription per hook instance; recreated when actor changes. Infinite retry attempts configured.', sources: [hook, ops('CHANGES')] },
      { name: 'Event / window focus → 200ms coalescing → refresh', detail: 'Event kind updates lastEvent. Notifications trigger a query rather than patching records. Reconnection recovery depends on server subscription readiness events; this hook has no durable replay.', sources: [hook, ops('CHANGES')] },
      { name: 'Unmount / actor switch → cleanup', detail: 'Clear timer, remove focus listener, unsubscribe and dispose socket. Query effect aborts old HTTP request. Connection UI reports Connected / Reconnecting / Unavailable.', sources: [hook] },
    ],
    'States & failures': [
      { name: 'Loading / error / empty / busy', detail: 'Hook starts with null data and exposes error. Components render pending and empty states. Mutations surface errors and clear busy in finally; no optimistic rollback needed.', sources: [workspace, hook] },
      { name: 'Identity boundary', detail: 'Changing actor remounts WorkspaceSession, clearing drafts, selection and data. Demo identities are spoofable; these are not production authentication controls.', sources: [workspace] },
    ],
  },
};
export function upgradeFrontend(model) {
  if (model.nextPageVersion === 1) return model;
  const result = structuredClone(model);
  result.nextPageVersion = 1;
  const parent = result.views.find(v => v.id === 'containers');
  const frontend = result.views.find(v => v.id === 'frontend');
  if (!parent || !frontend) return result;
  const id = 'next-workspace-page';
  if (!result.views.some(v => v.id === id)) result.views.push({ id, name: 'Workspace · /', template: 'NEXT', objectIds: [...frontend.objectIds], positions: structuredClone(frontend.positions), parentViewId: parent.id, ownerObjectId: 'web', pageSpec: structuredClone(pageSpec) });
  parent.drillTargets = { ...parent.drillTargets, web: id };
  return result;
}

const lab = ref('features/orders/components/orders-lab.tsx', 'OrdersLab');
const labApi = ref('features/orders/api/orders.client.ts', 'graphqlRequest');
const guide = ref('app/guide/page.tsx', 'Guide');
export const extraPages = [
  { id: 'next-orders-page', name: 'Orders Lab · /orders-lab', spec: {
    route: '/orders-lab', rendering: 'Server page entry + client OrdersLab; business data fetched after mount',
    revalidation: 'No explicit ISR interval. Browser GraphQL requests use cache: no-store.', dataLoading: 'Two independent effects fetch demo identities and orders. No server data fetch in the page entry.',
    sections: {
      Components: [{ name: 'Page → OrdersLab', detail: 'No props. OrdersLab owns controls, table, create form, response inspector, and learning notes in one file.', sources: [ref('app/orders-lab/page.tsx','Page'), lab] }],
      Permissions: [{ name: 'Create / cancel / field selection', detail: 'viewer.canCreate shows creation form. cancel.authorized controls button presence; cancel.available and busy disable it; reason explains restrictions. Selecting total requests a field, not permission to read it.', sources: [lab] }],
      'API & triggers': [
        { name: 'Mount / retry → demo identities', detail: 'DEMO_USERS runs on mount and identityRetry changes. Cleanup aborts the request.', sources:[lab,labApi] },
        { name: 'Actor / selected fields / refresh → orders query', detail: 'Effect depends on query, actor and revision. includeTotal changes the generated document. Cleanup aborts stale requests.', sources:[lab,labApi] },
        { name: 'Create / cancel → mutation → refetch', detail: 'runMutation sets busy, records the response, and refetches only when the GraphQL envelope has no errors. No optimistic update.', sources:[lab,labApi] }
      ],
      'State & cache': [{ name:'Local state + uncached requests', detail:'actor, includeTotal, identities, result, revision, busy, error, mutation, title and identityRetry live in OrdersLab React state. No query cache library. graphqlRequest explicitly sets no-store.', sources:[lab,labApi] }],
      'Browser storage': [{ name:'localStorage / sessionStorage: not used', detail:'No browser storage reads or writes in this page. Identity, selected fields and form draft reset on remount/reload. No keys, TTL, migration or cross-tab storage listeners.', sources:[lab] }],
      Realtime: [],
      'States & failures': [{ name:'HTTP and GraphQL errors', detail:'HTTP 200 can contain GraphQL errors. The client preserves the envelope for inspection. Mutation refresh is skipped on GraphQL errors; busy resets in finally. Aborted effects do not show errors.', sources:[lab,labApi] }]
    }
  }},
  { id:'next-guide-page', name:'Code guide · /guide', spec: {
    route:'/guide', rendering:'Server Component with static content; no page-owned Client Component',
    revalidation:'No data fetching or explicit revalidation policy. Static-render eligibility inferred from source, not verified against deployment output.', dataLoading:'Content is defined in the route file. No page-owned API requests.',
    sections: {
      Components:[{name:'Guide → static content + navigation',detail:'One server component renders the learning guide and a Next.js Link to /. No business props or client state.',sources:[guide]}],
      Permissions: [], 'API & triggers': [],
      'State & cache':[{name:'Static content',detail:'No page-owned React state or remote-data cache. Updating the guide requires changing source and rebuilding.',sources:[guide]}],
      'Browser storage':[{name:'localStorage / sessionStorage: not used',detail:'This page does not persist browser data. No keys, expiry, hydration synchronization or storage event listeners.',sources:[guide]}],
      Realtime: [], 'States & failures': []
    }
  }}
];
pageSpec.sections['Browser storage'] = [{name:'localStorage / sessionStorage: not used',detail:'Workspace uses memory-only React state. Actor, filters, selection and drafts reset on reload; no storage keys, expiry or cross-tab storage listeners. The separate Model Studio persists its diagram model in localStorage; that is not workspace page behavior.',sources:[workspace,hook]}];
export function upgradePageExamples(model) {
  if (model.pageExamplesVersion === 1) return model;
  const result=structuredClone(model);
  result.pageExamplesVersion=1;
  const original=result.views.find(v=>v.id==='next-workspace-page');
  const parent=result.views.find(v=>v.id==='containers');
  if(!original || !parent) return result;
  if(!original.pageSpec.sections['Browser storage']) original.pageSpec.sections['Browser storage']=structuredClone(pageSpec.sections['Browser storage']);
  for(const page of extraPages) {
    if(result.views.some(v=>v.id===page.id)) continue;
    const objectId=page.id+'-component';
    result.objects.push({id:objectId,kind:'component',name:page.spec.route,description:page.spec.rendering});
    result.views.push({id:page.id,name:page.name,template:'NEXT',objectIds:[objectId],positions:{[objectId]:{x:0,y:0}},parentViewId:parent.id,ownerObjectId:'web',pageSpec:structuredClone(page.spec)});
  }
  return result;
}

export function upgradeTanstackExample(model) {
 if(model.tanstackExampleVersion===1) return model;
 const result=structuredClone(model); result.tanstackExampleVersion=1;
 const parent=result.views.find(v=>v.id==='containers');
 if(!parent) return result;
 const id='next-tanstack-example';
 if(result.views.some(v=>v.id===id)) return result;
 const spec={route:'/examples/assignments (design example)',rendering:'ILLUSTRATIVE · TanStack Query v5 · not implemented in the application',dataLoading:'useQuery loads assignments; useMutation completes an assignment and invalidates the scoped list.',revalidation:'Browser query cache only. staleTime: 30 seconds; gcTime: 5 minutes after the query becomes inactive. No localStorage persistence.',sections:{
 Components:[],
 'API & triggers':[
 {name:'Assignments query',detail:'Example configuration',sources:[],trigger:'Mount; organization / actor / filters change; focus or reconnect when stale',transport:'POST /graphql',contracts:[{name:'Assignments · useQuery example',request:'{ filter: { projectId?: string; status?: string; first: 100 } }',response:'{ assignments: { id: string; title: string; status: string; capabilities: { canComplete: boolean; completeReason: string | null } }[] }'}],tanstackQuery:{hook:'useQuery',queryKey:'["assignments", organizationId, actorId, { projectId, status }]',queryFn:'({ signal }) => request(actorId, ASSIGNMENTS, { filter }, signal)',enabled:'Boolean(organizationId && actorId)',staleTime:30000,gcTime:300000,retry:1,refetchOnWindowFocus:true,refetchOnReconnect:true,refetchInterval:false}},
 {name:'Complete mutation',detail:'Example configuration',sources:[],trigger:'Complete button click → mutate({ id })',transport:'POST /graphql',contracts:[{name:'Complete · useMutation example',request:'{ id: string }',response:'{ completeAssignment: { id: string; status: string } }'}],tanstackQuery:{hook:'useMutation',mutationKey:'["completeAssignment", organizationId, actorId]',mutationFn:'({ id }) => request(actorId, COMPLETE, { id })',retry:0,onSuccess:'() => queryClient.invalidateQueries({ queryKey: ["assignments", organizationId, actorId] })'}}
 ],Realtime:[],Permissions:[],'State & cache':[],'Browser storage':[],'States & failures':[]},stateRows:[{name:'Query cache',table:{headers:['Store','Key / scope','Lifetime'],values:[['TanStack Query memory','assignments + organizationId + actorId + filters','Fresh: 30s; inactive cleanup: 5m'],['localStorage / sessionStorage','None','No persisted cache']]},sources:[],detail:'Illustrative configuration. Query keys separate identity and filters; server authorization remains required.'}]};
 result.views.unshift({id,name:'TanStack Query · example',template:'NEXT',objectIds:[],positions:{},parentViewId:parent.id,ownerObjectId:'web',pageSpec:spec});
 return result;
}
