export function upgradeInfrastructureExamples(model) {
 if(model.infrastructureExamplesVersion===1)return model;
 const next=structuredClone(model), parent=next.views.find(v=>v.id==='containers');
 if(!parent)return model;
 const redis=next.objects.find(o=>o.id==='redis');
 if(redis){next.views.push({id:'redis-details',name:'Redis · keys & channels',template:'REDIS',parentViewId:parent.id,ownerObjectId:redis.id,objectIds:[],positions:{}});redis.drillTo='redis-details';parent.drillTargets={...parent.drillTargets,redis:'redis-details'};}
 next.objects.push({id:'agent-service-example',kind:'service',name:'Assignment agent · example',technology:'NestJS · LangGraph JS',description:'Example design: plans assignments, pauses for approval, then invokes scoped business APIs. Not deployed.',drillTo:'agent-details'});
 parent.objectIds.push('agent-service-example');parent.positions['agent-service-example']={x:0,y:650};
 next.relations.push({id:'agent-api-example',source:'agent-service-example',target:'api',label:'Example · scoped tools',dashed:true});
 next.views.push({id:'agent-details',name:'Assignment agent · workflow example',template:'AGENT',parentViewId:parent.id,ownerObjectId:'agent-service-example',objectIds:[],positions:{}});
 next.infrastructureExamplesVersion=1;
 return next;
}
