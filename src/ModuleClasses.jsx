import React, {useState, useEffect, useRef} from 'react';
import LinkedTable from './LinkedTable';
import ModuleSource from './ModuleSource';

const base = 'apps/api/src/modules/assignments/';
export const classSourcePaths = [
  base+'graphql/assignment.type.ts', base+'graphql/assignments.resolver.ts',
  base+'graphql/assignment-fields.resolver.ts', base+'use-cases/change-assignment-status.ts',
  base+'policies/assignment.policy.ts', base+'domain/assignment.rules.ts',
  'apps/api/src/modules/auth/guards/authentication.guard.ts',
  'apps/api/src/platform/redis/pubsub.service.ts',
  base+'use-cases/create-assignment.ts', base+'use-cases/add-comment.ts', base+'graphql/assignment.input.ts',
];
const policyRows = [
  ['readScope(actor)', '{ organizationId: actor.organizationId }', 'Scopes database reads'],
  ['canCreate(actor)', 'actor.permissions.includes("assignments.write")', 'Create authorization'],
  ['canManage(actor)', 'actor.permissions.includes("assignments.manage")', 'Management authorization'],
  ['canEdit(actor, assignment)', 'same organization && canCreate(actor) && (canManage(actor) || assignment.assigneeId === actor.id)', 'Start / complete authorization'],
  ['canComment(actor, assignment)', 'same organization && canCreate(actor)', 'Comment authorization'],
];
const transitions = {
 startTransition:{title:'OPEN → IN_PROGRESS', trigger:'startAssignment(actor, id)', rule:'startReason(status): status must equal "OPEN"', next:'IN_PROGRESS'},
 completeTransition:{title:'OPEN → DONE', trigger:'completeAssignment(actor, id)', rule:'completionReason(status): status must not equal "DONE"', next:'DONE'},
 finishTransition:{title:'IN_PROGRESS → DONE', trigger:'completeAssignment(actor, id)', rule:'completionReason(status): status must not equal "DONE"', next:'DONE'},
};
export default function ModuleClasses({onNavigate}) {
 const [selected,setSelected]=useState(null);
 const [tab,setTab]=useState('domain');
 const dialog=useRef(null);
 useEffect(()=>{if(selected && dialog.current && !dialog.current.open) dialog.current.showModal(); if(dialog.current)dialog.current.scrollTop=0;},[selected]);

 const domainObjects = [
  {id:'assignment', name:'Assignment', kind:'Domain object', guard:true, source:0, policies:true,
   rows:[['id','string'],['title','string'],['description','string'],['status','string','states','State map'],['priority','string','priorityOptions','Options · 3'],['projectId','string','table:Project','Project.id'],['assigneeId','string'],['organizationId','string'],['capabilities','AssignmentCapabilities','capabilities','Permissions'],['updatedAt','Date']],
   actions:[['createAssignment','CreateAssignmentInput','Assignment','createAction','canCreate / canManage'],['startAssignment','id: string','Assignment','startTransition','canEdit'],['completeAssignment','id: string','Assignment','process','canEdit'],['addComment','AddCommentInput','Comment','commentAction','canComment']],
   note:'Actions are GraphQL mutations grouped by the object they affect; they are implemented by resolver and use-case classes.'},
  {id:'comment-object',name:'Comment',kind:'Domain object',source:0,policies:false,
   rows:[['id','string'],['assignmentId','string','table:Assignment','Assignment.id'],['body','string'],['authorId','string'],['createdAt','Date']],

   note:'Created through Assignment.addComment. No standalone comment mutations are defined. assignmentId is a persisted field, not exposed on CommentType.'},
 ];
 const link=(id,label)=><button className="uml-link" onClick={()=>setSelected(id)}>{label} ↗</button>;
 function source(i){return <ModuleSource path={classSourcePaths[i]} />;}
 function policy(){return <><p>One definition, referenced by enforcement and frontend capability derivation.</p><div className="table-scroll"><table><thead><tr><th>Method</th><th>Condition / result</th><th>Purpose</th></tr></thead><tbody>{policyRows.map(row=><tr key={row[0]}>{row.map((c,i)=><td key={i}>{i===1?<code>{c}</code>:c}</td>)}</tr>)}</tbody></table></div><h4>Used by</h4><ul><li>ChangeAssignmentStatus.execute — enforces canEdit.</li><li>AssignmentFieldsResolver — derives canComplete, canStart and canComment.</li><li>CreateAssignment / AddComment — enforce their operation policies.</li></ul>{source(4)}</>;}
 function process(t){return <><dl className="uml-facts"><dt>Trigger</dt><dd><code>{t?.trigger || 'ChangeAssignmentStatus.execute(actor, id, next)'}</code></dd><dt>Authorization</dt><dd>{link('edit','AssignmentPolicy.canEdit')}</dd><dt>State rule</dt><dd>{t?.rule || 'startReason / completionReason, according to next'}</dd></dl><h4>Inside PostgreSQL transaction</h4><ol><li>Load assignment by id and actor.organizationId; missing → NotFound.</li><li>Enforce canEdit; denied → Forbidden.</li><li>Check current state; invalid → Conflict.</li><li>Update status{t ? ` to ${t.next}` : ''}, matching original status and updatedAt. Concurrent change → Conflict.</li><li>Create activity with actor and organization.</li><li>Read the updated assignment and commit.</li></ol><h4>After commit</h4><ol><li>Log the status change.</li><li>Invalidate the organization’s dashboard cache.</li><li>Publish ASSIGNMENT_UPDATED through Redis.</li></ol><p className="muted">Notification failure cannot roll back the committed transaction. Redis Pub/Sub has no durable replay.</p>{source(3)} {link('effects','Realtime event · ASSIGNMENT_UPDATED')}</>;}
 const title=selected?.startsWith('table:') ? selected.slice(6) : selected==='priorityOptions' ? 'Priority · allowed values' : transitions[selected]?.title || ({createAction:'Create assignment',commentAction:'Add comment',policy:'AssignmentPolicy',edit:'Permission · canEdit',complete:'Permission · canComplete',start:'Permission · canStart',comment:'Permission · canComment',states:'Assignment.status · transitions',guard:'AuthenticationGuard',none:'Guard coverage',capabilities:'Permission derivation',process:'Change assignment status',effects:'Realtime event · ASSIGNMENT_UPDATED'})[selected];
 return <section className="next-page uml-view">
  <div className="next-summary"><div><small>MODULE · UML</small><h2>AssignmentsModule</h2><p>Domain objects with their attributes and available actions. Follow links to policies, transitions and implementation.</p></div><span className="uml-badge">Design preview · source snapshot</span></div>

  <nav className="next-tabs" aria-label="Module views">
   <button className={tab==='domain'?'active':''} aria-pressed={tab==='domain'} onClick={()=>{setTab('domain');setSelected(null);}}>Domain objects · {domainObjects.length}</button>
   <button className={tab==='api'?'active':''} aria-pressed={tab==='api'} onClick={()=>{setTab('api');setSelected(null);}}>Module API · 0</button>
  </nav>
  {tab==='api' && <section className="uml-class"><header><h3>Module API</h3><p>No module-wide queries or mutations documented yet.</p></header><footer>Operations that span multiple objects belong here. Assignment actions remain under Domain objects.</footer></section>}
  <div className="uml-workspace">
   <div className="uml-classes">{(tab==='domain'?domainObjects:[]).map(c=><article className="uml-class" key={c.id}>
    <header><small>«{c.kind}»</small><h3>{c.name}</h3><div className="uml-actions">{c.policies && link('policy','Policies · 1')}{source(c.source)}</div></header>
    <div className="table-scroll"><table><thead><tr><th>Attribute</th><th>Type</th><th>Explore</th></tr></thead><tbody>{c.rows.map(([name,type,id,label])=><tr key={name}><td><code>{name}</code></td><td><code>{type}</code></td><td>{id ? link(id,label) : '—'}</td></tr>)}</tbody></table></div>
    {c.actions && <section className="uml-object-actions"><h4>Actions · {c.actions.length}</h4><div className="table-scroll"><table><thead><tr><th>Mutation</th><th>Input → result</th><th>Policy</th><th>Behavior</th></tr></thead><tbody>{c.actions.map(([name,input,result,target,policyName])=><tr key={name}><td><code>{name}</code></td><td><code>{input} → {result}</code></td><td>{link('policy',policyName)}</td><td>{link(target,'Open')}</td></tr>)}</tbody></table></div></section>}
    <footer>{c.policies && <details><summary>▱ Policies · references</summary>{link('policy','AssignmentPolicy')}</details>}{c.id==='assignment' && <details><summary>▱ State maps</summary>{link('states','status')}</details>}<p>{c.note}</p></footer>
   </article>)}</div>
   {selected && <dialog ref={dialog} className="uml-detail uml-modal" aria-label="Linked detail" onCancel={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}}><header><div><small>LINKED DETAIL</small><h3>{title}</h3></div><button aria-label="Close class detail" onClick={()=>setSelected(null)}>×</button></header>
    {selected?.startsWith('table:') && <LinkedTable name={selected.slice(6)} onOpen={setSelected} />}
    {selected==='priorityOptions' && <><p>Allowed by CreateAssignmentInput validation. Stored as a string, not a database enum.</p><ul><li><code>LOW</code></li><li><code>MEDIUM</code> · default</li><li><code>HIGH</code></li></ul>{source(10)}</>}
    {selected==='policy' && policy()}
    {['createAction','commentAction'].includes(selected) && <><h4>Input DTO</h4><pre>{selected==='createAction'?'CreateAssignmentInput {\n  title: string\n  description: string = ""\n  projectId: string\n  assigneeId: string\n  priority: string = "MEDIUM"\n}':'AddCommentInput {\n  assignmentId: string\n  body: string\n}'}</pre>{source(10)}<h4>Policy</h4>{link('policy',selected==='createAction'?'canCreate / canManage':'canComment')}<h4>Process</h4>{selected==='createAction'?<ol><li>Require canCreate. Without canManage, assignee must be the actor.</li><li>Validate assignee belongs to actor’s organization.</li><li>In one transaction: load an organization-scoped project, create assignment with trimmed title, and create activity.</li><li>After commit: log creation and publish ASSIGNMENT_CREATED via events.changed.</li></ol>:<ol><li>In one transaction: load the organization-scoped assignment and enforce canComment.</li><li>Create comment with trimmed body and authorId from actor; create activity.</li><li>After commit: publish COMMENT_ADDED via events.changed.</li></ol>}<p>events.changed invalidates the organization’s dashboard cache before publishing.</p><h4>Implementation</h4>{source(selected==='createAction'?8:9)}{source(1)}</>}
    {selected==='states' && <><p>Click an arrow to inspect the transition. This map shows the application’s three known status values; the stored type is string.</p><div className="uml-state-map"><svg viewBox="0 0 440 250" role="group" aria-label="OPEN can start to IN_PROGRESS or complete to DONE; IN_PROGRESS can complete to DONE"><defs><marker id="uml-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#43816c"/></marker></defs>{[['OPEN',10,25],['IN_PROGRESS',265,25],['DONE',140,185]].map(([n,x,y])=><g key={n}><rect x={x} y={y} width="125" height="42" rx="8" fill="#e7f2ed" stroke="#43816c"/><text x={x+62.5} y={y+26} textAnchor="middle">{n}</text></g>)}{[['startTransition','M135 46 H265','Start',200,35],['completeTransition','M72 67 V205 H140','Complete',72,132],['finishTransition','M327 67 V205 H265','Complete',327,132]].map(([id,d,label,x,y])=><g key={id} role="button" tabIndex="0" aria-label={transitions[id].title} onClick={()=>setSelected(id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(id);}}}><path d={d} stroke="transparent" strokeWidth="22" fill="none"/><path d={d} stroke="#43816c" strokeWidth="2" fill="none" markerEnd="url(#uml-arrow)"/><rect x={x-38} y={y-16} width="76" height="25" rx="4" fill="white" stroke="#b4ccc1"/><text x={x} y={y+1} textAnchor="middle">{label}</text></g>)}</svg></div><div className="uml-actions">{Object.entries(transitions).map(([id,t])=><React.Fragment key={id}>{link(id,t.title)}</React.Fragment>)}</div><p>No outgoing transition from DONE is allowed by the current rules. Completion rejects DONE; other unexpected string values are not explicitly rejected by completionReason.</p>{source(5)}</>}
    {transitions[selected] && <>{link('states','Back to state map')}{process(transitions[selected])}</>}
    {selected==='process' && process()}
    {['edit','complete','start','comment','capabilities'].includes(selected) && <><h4>Central policy</h4>{link('policy',selected==='comment'?'AssignmentPolicy.canComment':'AssignmentPolicy.canEdit')}<h4>Derived capability</h4><pre>{selected==='comment' ? 'canComment = policy.canComment(actor, assignment)' : selected==='edit' ? 'sameOrganization\n&& canCreate(actor)\n&& (canManage(actor) || isAssignee)' : 'denied = policy.canEdit(actor, assignment)\n  ? null : "Only the assignee or a manager can do this."\n\ncompleteReason = denied ?? completionReason(status)\ncanComplete = !completeReason\n\nstartReason = denied ?? startReason(status)\ncanStart = !startReason'}</pre><p>Frontend capabilities display the decision. ChangeAssignmentStatus enforces canEdit again against the scoped record; state rules remain separate.</p>{link('states','State rules and transitions')}{source(2)}</>}
    {selected==='guard' && <><p><code>@UseGuards(AuthenticationGuard)</code> applies to AssignmentsResolver.</p><h4>canActivate(context): boolean</h4><p>Resolves x-demo-user against DEMO_USERS, attaches the actor to the request, or throws UnauthorizedException.</p><h4>Policy references · 0</h4><p>This is an identity guard. It does not invoke AssignmentPolicy. Record-level authorization is enforced by the use cases.</p>{link('policy','Related operation policy')}<p className="muted">Demo identities are spoofable; this is not production authentication.</p>{source(6)}</>}
    {selected==='none' && <><p>No NestJS guard is declared on this class or its attributes in the inspected source.</p><p>Requests enter through the guarded AssignmentsResolver. Protected mutations enforce the central policy in their use cases.</p>{link('guard','API entry guard')}{link('policy','Operation policy')}</>}
    {selected==='effects' && <>
      <p>A data-change signal sent over WebSocket so connected clients can refresh. No email, push notification or notification inbox is created.</p>
      <h4>Published after the status transaction commits</h4>
      <pre>{'ChangeAssignmentStatus.execute\n  → PubsubService.changed(event)\n  → Redis: fieldwork:changes\n  → workspace:<organizationId>\n  → GraphQL: workspaceChanged'}</pre>
      <h4>Internal event payload</h4>
      <table><thead><tr><th>Field</th><th>Type</th><th>Value</th></tr></thead><tbody><tr><td>organizationId</td><td>string</td><td>actor.organizationId</td></tr><tr><td>kind</td><td>string</td><td>ASSIGNMENT_UPDATED</td></tr><tr><td>entityId</td><td>string</td><td>Changed assignment id</td></tr></tbody></table>
      <h4>What the client receives</h4><pre>{'{ workspaceChanged: {\n  kind: "ASSIGNMENT_UPDATED",\n  entityId: "<assignment id>"\n} }'}</pre>
      <p>Only subscribers in the actor’s organization receive the event. organizationId is used for routing and is not exposed in the GraphQL payload.</p>
      <h4>Client behavior</h4><p>useWorkspace records the event kind and schedules a refresh of workspace data. The event does not contain the assignment record or its new status; the client fetches authorized data again.</p>
      <h4>Delivery</h4><p>The publisher invalidates the organization’s dashboard cache first. Redis Pub/Sub is transient, with no durable replay. Publish failures are logged after commit; reconnect/readiness triggers a client refresh.</p>
      <h4>Publisher source</h4>{source(7)}
      <h4>Subscription source</h4><ModuleSource path="apps/api/src/modules/assignments/realtime/assignments.subscription.ts" />
      <h4>Client handler source</h4><ModuleSource path="apps/web/src/features/workspace/hooks/use-workspace.ts" />
    </>}
   </dialog>}
  </div>
 </section>;
}
