import Ajv from 'ajv';

const text = {type:'string'}, bool = {type:'boolean'}, number = {type:'number'};
const id = {type:'string',minLength:1}, nullableText = {type:['string','null']};
const list = items => ({type:'array',items});
const ref = name => ({$ref:`#/definitions/${name}`});
const object = (properties,required=[]) => ({type:'object',properties,required,additionalProperties:false});
const record = values => ({type:'object',additionalProperties:values});
const strings = list(text), matrix = list(strings);
const source = object({path:text,symbol:text,url:text,line:{type:'integer',minimum:1}},['path','symbol']);
const point = object({x:number,y:number},['x','y']);
const edgeProperties = {
 id,source:id,target:id,label:text,
 sourceHandle:{enum:['top','right','bottom','left']},targetHandle:{enum:['top','right','bottom','left']},
 lineType:{enum:['smoothstep','step','default','straight']},color:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},
 width:{enum:[1,1.5,2,3,4,6]},startArrow:{enum:['none','open','closed']},endArrow:{enum:['none','open','closed']},dashed:bool,animated:bool,
};
const querySettings = object({hook:text,queryKey:text,mutationKey:text,enabled:{type:['boolean','string']},staleTime:number,gcTime:number,retry:{type:['number','boolean']},refetchOnWindowFocus:bool,refetchOnReconnect:bool,onSuccess:text});
const contract = object({name:text,request:text,response:text,source,transport:text,tanstackExample:querySettings},['name','request','response']);
const entryProperties = {
 id,name:text,detail:text,section:text,tab:text,sources:list(source),target:text,example:bool,
 componentId:id,componentName:text,parentComponentId:nullableText,boundary:text,
 structure:object({props:matrix,permissions:matrix,facts:matrix}),
 contracts:list(contract),contract,transport:text,trigger:text,onEvent:text,cleanup:text,tanstackQuery:querySettings,
 table:object({headers:strings,values:matrix},['headers','values']),viewIds:strings,related:strings,
};
const field = object({
 name:id,type:text,nullable:bool,primary:bool,default:text,relation:bool,target:nullableText,attributes:text,
 reference:object({table:id,field:id,onDelete:text},['table','field']),enumValues:strings,
 capabilities:object({name:id,fields:list(ref('field')),policyIds:strings,source},['name','fields','policyIds']),
},['name','type']);
const tableProperties = {name:id,domain:text,fields:list(ref('field')),indexes:strings,source,policyIds:strings};
const operation = object({
 id,name:text,feature:text,kind:text,endpoint:text,owner:nullableText,input:text,result:text,source,implementation:source,code:text,
 dtos:list(object({name:id,code:text,source},['name','code','source'])),
 policyCalls:list(object({policyId:id,expression:text},['policyId','expression'])),policyIds:strings,transaction:text,
},['id','name','kind','endpoint','input','result','source','implementation','code','dtos','policyCalls','policyIds','transaction']);
const policy = object({id,name:text,feature:text,source,methods:list(object({name:id,signature:text,code:text,source},['name','signature','code']))},['id','name','source','methods']);
const sectionNames=['Components','Permissions','API & triggers','State & cache','Browser storage','Realtime','States & failures','State & storage'];
const page = object({route:text,filePath:text,repositoryRevision:text,rendering:text,revalidation:text,dataLoading:text,layoutIds:strings,sections:object(Object.fromEntries(sectionNames.map(name=>[name,list(ref('entry'))])))},['route','rendering','revalidation','dataLoading','sections']);
const documentation = object({title:text,summary:text,revision:text,sections:{...list(object({title:text,body:text,headers:strings,rows:list(list({anyOf:[text,object({label:text,url:text},['label','url'])]}))},['title'])),minItems:1}},['title','summary','sections']);
const versions=['hierarchyVersion','productLandscapeVersion','nextPageVersion','pageExamplesVersion','tanstackExampleVersion','projectStateVersion','inlineQueryExamplesVersion','componentTreeVersion','nestModulesVersion','unifiedDirectoryVersion','permissionExamplesVersion','retiredProcessSketchVersion','infrastructureExamplesVersion','sb2RichDocumentationVersion'];

// One contract for the editor, imports, server saves and coding agents. No coercion or stripping.
export const modelSchema = {
 $schema:'http://json-schema.org/draft-07/schema#',title:'Fieldwork Studio model',
 ...object({
  version:{const:1},name:text,objects:list(ref('object')),relations:list(ref('relation')),views:{...list(ref('view')),minItems:1},
  layouts:list(ref('layout')),projectState:object({entries:list(object(entryProperties,['id','name','viewIds','sources','table']))},['entries']),
  sourceRepository:text,sourceRevision:text,sourceProjects:list(object({repository:text,revision:text},['repository','revision'])),
  ...Object.fromEntries(versions.map(name=>[name,{type:'integer',minimum:0}])),
 },['version','objects','relations','views']),
 definitions:{
  object:object({id,kind:id,name:text,description:text,technology:text,notes:text,fields:text,drillTo:text,infrastructure:bool,moduleImports:strings,moduleExports:strings,sourcePath:text},['id','kind','name']),
  relation:object(edgeProperties,['id','source','target','label']),
  agentCanvas:object({positions:record(point),edges:record(object(edgeProperties))}),
  entry:object(entryProperties,['name','detail']),
  layout:object({...entryProperties,file:text,children:list(ref('entry'))},['id','name','boundary']),
  field,
  page,
  view:object({
   id,name:text,template:{enum:['C0','C1','C2','C3','INTERNAL','ERD','BPMN','NEXT','REDIS','AGENT']},objectIds:{...strings,uniqueItems:true},positions:record(point),
   parentViewId:text,ownerObjectId:text,drillTargets:record(text),pageSpec:ref('page'),agentCanvas:ref('agentCanvas'),documentation,
   databaseSchema:object({sourcePath:text,grouping:text,tables:list(object(tableProperties,['name','fields','indexes'])),enums:record(strings)},['sourcePath','tables']),
   moduleSpec:object({title:text,summary:text,revision:text,databaseViewId:id,domains:list(object(tableProperties,['name','fields','policyIds'])),operations:list(operation),policies:list(policy),notes:text},['title','summary','revision','databaseViewId','domains','operations','policies']),
  },['id','name','template','objectIds','positions']),
 },
};
const ajv = new Ajv({allErrors:true,allowUnionTypes:true});
const check = ajv.compile(modelSchema);
export function validateShape(model){
 if(check(model))return model;
 const errors=check.errors.slice(0,12).map(error=>({path:(error.instancePath||'')+(error.params.missingProperty?'/'+error.params.missingProperty:error.params.additionalProperty?'/'+error.params.additionalProperty:''),message:error.message}));
 const failure=new Error(errors.map(e=>`${e.path||'/'} ${e.message}`).join('\n'));
 failure.validationErrors=errors;throw failure;
}
export function validateFragment(value,definition){
 if(!modelSchema.definitions[definition])throw Error('Unknown JSON type.');
 const validate=fragmentChecks[definition]??=ajv.compile({...modelSchema,...modelSchema.definitions[definition],definitions:modelSchema.definitions});
 if(!validate(value))throw Error(validate.errors.map(e=>`${e.instancePath||'/'} ${e.message}`).join('\n'));
 return value;
}
const fragmentChecks={};
