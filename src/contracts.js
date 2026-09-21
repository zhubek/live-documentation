// Documentation of selected operation payloads, not runtime request captures.
const idStatus = '{ id: string; status: string }';
const workspaceTypes = `type Assignment = {
  id: string; title: string; description: string;
  projectId: string; assigneeId: string;
  status: string; priority: string; updatedAt: string;
  capabilities: {
    canComplete: boolean; completeReason: string | null;
    canStart: boolean; startReason: string | null;
    canComment: boolean;
  };
};`;
const workspace = {
 WORKSPACE: {name:'Workspace', request:`{ filter: {
  first?: number; // 1–100; server default 50; page sends 100
  projectId?: string | null;
  status?: "OPEN" | "IN_PROGRESS" | "DONE" | null;
  search?: string | null; // max 120 characters
} }`, response:`{
  workspaceViewer: { id: string; name: string; organizationId: string; canCreate: boolean; canManage: boolean };
  workspaceMembers: { id: string; name: string }[];
  projects: { id: string; name: string; description: string; color: string }[];
  assignments: Assignment[];
  dashboard: { total: number; open: number; inProgress: number; completed: number; computedAt: string; cacheSource: string };
  activity: { id: string; actorName: string; message: string; createdAt: string }[];
}

${workspaceTypes}`},
 START:{name:'Start',request:'{ id: string }',response:`{ startAssignment: ${idStatus} }`},
 COMPLETE:{name:'Complete',request:'{ id: string }',response:`{ completeAssignment: ${idStatus} }`},
 COMMENTS:{name:'Comments',request:'{ id: string }',response:'{ assignmentComments: { id: string; body: string; authorId: string; createdAt: string }[] }'},
 CREATE:{name:'Create assignment',request:`{ input: {
  title: string; // nonblank, max 120 characters
  projectId: string;
  assigneeId: string;
  description?: string; // default "", max 2000 characters
  priority?: "LOW" | "MEDIUM" | "HIGH"; // default MEDIUM
} }`,response:'{ createAssignment: { id: string } }'},
 COMMENT:{name:'Add comment',request:'{ input: { assignmentId: string; body: string /* nonblank, max 2000 characters */ } }',response:'{ addComment: { id: string } }'},
 CHANGES:{name:'WorkspaceChanges',transport:'WebSocket · GraphQL subscription',request:'variables: none\nconnectionParams: { "x-demo-user": actor: string }',response:'{ workspaceChanged: { kind: string; entityId: string } }'},
};
const orders = {
 DEMO_USERS:{name:'DemoUsers',request:'{} // no variables; no actor header',response:'{ demoUsers: { id: string; name: string; role: string }[] }'},
 ordersQuery:{name:'OrdersPage',request:'{} // no variables; orders(first: 100) in document\nincludeTotal: boolean // client option changes selection set',response:'{ viewer: { name: string; role: string; canCreate: boolean };\n  orders: { id: string; title: string; customerName: string; status: string; total?: number; capabilities: { cancel: { authorized: boolean; available: boolean; reason: string | null } } }[]\n}\n// total only selected when includeTotal = true'},
 CREATE_ORDER:{name:'CreateOrder',request:'{ input: { title: string; total: number /* GraphQL Int */ } }',response:'{ createOrder: { id: string } }'},
 CANCEL_ORDER:{name:'CancelOrder',request:'{ id: string /* GraphQL ID */ }',response:`{ cancelOrder: ${idStatus} }`},
};
export function contractsFor(item) {
 if (item.contracts) return item.contracts;
 const contracts = [];
 for(const ref of item.sources || []) {
   const table=ref.path.endsWith('workspace.operations.ts') ? workspace : ref.path.endsWith('orders.operations.ts') ? orders : null;
   if(table?.[ref.symbol]) contracts.push({...table[ref.symbol], source: ref});
 }
 if (!contracts.length && item.sources?.some(ref => ref.path.endsWith('orders-lab.tsx'))) {
   const keys = { 'Mount / retry → demo identities': ['DEMO_USERS'], 'Actor / selected fields / refresh → orders query': ['ordersQuery'], 'Create / cancel → mutation → refetch': ['CREATE_ORDER', 'CANCEL_ORDER'] }[item.name] || [];
   for(const key of keys) contracts.push({...orders[key], source: {path:'apps/web/src/features/orders/graphql/orders.operations.ts',symbol:key}});
 }
 return contracts;
}
