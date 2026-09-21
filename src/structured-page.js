const sessionPermissions = [
 ['data?.workspaceViewer.canCreate: boolean', 'New assignment button · disabled', '!data?.workspaceViewer.canCreate'],
 ['a.capabilities.canComplete: boolean', 'Complete button · disabled', 'busy === a.id || !a.capabilities.canComplete'],
 ['a.capabilities.completeReason: string | null', 'Complete button · tooltip', 'a.capabilities.completeReason ?? "Complete assignment"'],
 ['a.capabilities.canStart: boolean', 'Start button · disabled', 'busy === a.id || !a.capabilities.canStart'],
 ['a.status: string', 'Start button · visible', 'a.status === "OPEN"'],
 ['a.capabilities.startReason: string | null', 'Start button · tooltip', 'a.capabilities.startReason ?? "Start assignment"'],
];
const commentPermissions = [
 ['assignment.capabilities.canComment: boolean', 'Comment textarea · disabled', '!assignment.capabilities.canComment || busy'],
 ['assignment.capabilities.canComment: boolean', 'Post comment button · disabled', 'busy || !body.trim() || !assignment.capabilities.canComment'],
 ['assignment.capabilities.canComment: boolean', 'Read-only message · visible', '!assignment.capabilities.canComment'],
];
const createPermissions = [['data.workspaceViewer.canManage: boolean', 'Assignee options · filter', 'data.workspaceViewer.canManage || m.id === actor']];
const components = {
 'Page → Workspace': { props: [], facts: [['Component','Workspace'],['Boundary','Client'],['Parent','Page (Server)']] },
 'Workspace → WorkspaceSession': { props:[['actor','string','actor'],['setActor','(actor: string) => void','setActor']], facts:[['Component','WorkspaceSession'],['Boundary','Client'],['React key','actor']], permissions:sessionPermissions },
 'WorkspaceSession → AssignmentDetail': { props:[['assignment','Assignment','detail'],['data','WorkspaceData','data'],['actor','string','actor'],['refresh','() => void','refresh'],['onClose','() => void','() => setSelected("")']], facts:[['Component','AssignmentDetail'],['Boundary','Client'],['Rendered when','detail is truthy'],['React key','detail.id']], permissions:commentPermissions },
 'WorkspaceSession → CreateAssignment': { props:[['data','WorkspaceData','data'],['actor','string','actor'],['onClose','() => void','() => setCreating(false)'],['onDone','() => void','() => { setCreating(false); refresh(); }']], facts:[['Component','CreateAssignment'],['Boundary','Client'],['Rendered when','creating && data']], permissions:createPermissions },
 'Page → OrdersLab': { props:[], facts:[['Component','OrdersLab'],['Boundary','Client']], permissions:[['data?.viewer.canCreate: boolean','Create form · visible','data?.viewer.canCreate'],['order.capabilities.cancel.authorized: boolean','Cancel button · visible','order.capabilities.cancel.authorized'],['order.capabilities.cancel.available: boolean','Cancel button · disabled','busy || !order.capabilities.cancel.available']] },
 'Guide → static content + navigation': { props:[], facts:[['Component','Guide'],['Boundary','Server'],['Navigation','Next.js Link → /']], permissions:[] },
};
export function structureFor(item) {
 if(item.structure) return item.structure;
 if(item.section === 'Components') return components[item.name] || {};
 const symbols=new Set((item.sources || []).map(s=>s.symbol));
 const permissions=[];
 if(symbols.has('COMPLETE')) permissions.push(...sessionPermissions.filter(r=>r[0].includes('canComplete')));
 if(symbols.has('START')) permissions.push(...sessionPermissions.filter(r=>r[0].includes('canStart')));
 if(symbols.has('COMMENT')) permissions.push(commentPermissions[1]);
 if(symbols.has('CREATE')) permissions.push(sessionPermissions[0]);
 return {permissions, facts: symbols.has('WORKSPACE') ? [['Trigger','mount; actor/projectId/status/search change'],['Delay','100 ms'],['Variables','filter: { first: 100, projectId?, status?, search? }'],['Response owner','useWorkspace.data'],['Browser cache library','None'],['Browser storage','None'],['Concurrent refresh','running + dirty; one follow-up'],['Cleanup','AbortController.abort()']] : []};
}
