export function upgradeNestModules(model) {
  if (model.nestModulesVersion === 1) return model;
  const next = structuredClone(model);
  const parent = next.views.find(v => v.id === 'containers');
  if (!parent?.objectIds.includes('api')) return model;
  const specs = [
    ['assignments','AssignmentsModule','modules/assignments/assignments.module.ts',['AuthModule'],['AssignmentPolicy'],'Assignment queries, writes, policies and subscriptions.'],
    ['projects','ProjectsModule','modules/projects/projects.module.ts',['AuthModule','AssignmentsModule'],[],'Project queries and field resolution.'],
    ['dashboard','DashboardModule','modules/dashboard/dashboard.module.ts',['AuthModule'],[],'Dashboard queries and cached aggregates.'],
    ['orders','OrdersModule','modules/orders/orders.module.ts',['AuthModule'],['CreateOrder','CancelOrder'],'Original orders learning example.'],
    ['auth','AuthModule','modules/auth/auth.module.ts',[],['AuthenticationGuard'],'Demo identities and authentication guard.'],
    ['database','DatabaseModule','platform/database/database.module.ts',[],['PrismaService'],'Global module providing database access.',true],
    ['redis-module','RedisModule','platform/redis/redis.module.ts',[],['RedisService','PubsubService'],'Global module providing optional cache and transient Pub/Sub.',true],
    ['graphql-module','GraphQLModule','app.module.ts',[],[],'GraphQLModule.forRoot: Apollo transport and subscription configuration.',true],
  ];
  const viewId = 'api-modules';
  const positions = [[0,0],[0,300],[0,600],[0,900],[470,380],[900,0],[900,300],[900,600]];
  for (const [id,name,path,imports,exports,description,infrastructure] of specs) {
    if (!next.objects.some(o=>o.id===`nest-${id}`)) next.objects.push({id:`nest-${id}`,kind:'module',name,description,infrastructure:!!infrastructure,technology:'NestJS',moduleImports:imports,moduleExports:exports,sourcePath:`apps/api/src/${path}`});
  }
  if (!next.views.some(v=>v.id===viewId)) next.views.push({id:viewId,name:'API modules',template:'C3',parentViewId:'containers',ownerObjectId:'api',objectIds:specs.map(s=>`nest-${s[0]}`),positions:Object.fromEntries(specs.map((s,i)=>[`nest-${s[0]}`,{x:positions[i][0],y:positions[i][1]}]))});
  for (const [id,, ,imports] of specs) for (const target of imports) {
    const to = specs.find(s=>s[1]===target);
    const rid=`module-import-${id}-${to[0]}`;
    if (!next.relations.some(r=>r.id===rid)) next.relations.push({id:rid,source:`nest-${id}`,target:`nest-${to[0]}`,label:'imports',sourceHandle:'right',targetHandle:'left'});
  }
  parent.drillTargets={...parent.drillTargets,api:viewId};
  const api=next.objects.find(o=>o.id==='api'); if(api) api.drillTo=viewId;
  const detail=next.views.find(v=>v.id==='components');
  if(detail) {
    Object.assign(detail,{name:'Assignments · module internals',template:'INTERNAL',parentViewId:viewId,ownerObjectId:'nest-assignments'});
    next.objects.find(o=>o.id==='nest-assignments').drillTo=detail.id;
  }
  const frontend=next.views.find(v=>v.id==='frontend');
  if(frontend?.template==='C3') { frontend.template='INTERNAL'; frontend.name='Frontend · legacy component sketch'; }
  next.nestModulesVersion=1;
  return next;
}
