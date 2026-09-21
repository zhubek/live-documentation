import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateModel} from '../src/model.js';
import {validateFragment} from '../src/model-schema.js';
import {seed} from '../src/seed.js';
import {openStore} from './store.js';
const rich=JSON.parse(readFileSync(new URL('../examples/sb2/model.json',import.meta.url)));

test('nested documentation types reject invalid edits without coercion',()=>{
 const changes=[
  [m=>m.objects[0].notes=42,/notes.*string/],
  [m=>m.objects[0].infrastructure='false',/infrastructure.*boolean/],
  [m=>m.views.find(v=>v.moduleSpec).moduleSpec.domains[0].fields[0].type=123,/type.*string/],
  [m=>m.views.find(v=>v.pageSpec).pageSpec.sections.Components[0].structure.props=[[123]],/props.*string/],
  [m=>m.views.find(v=>v.pageSpec).pageSpec.sections.Components[0].sources[0].path=8,/path.*string/],
  [m=>m.views[0].agentCanvas={edges:{a:{animated:'yes'}}},/animated.*boolean/],
  [m=>m.views[0].positons={},/positons.*additional/],
 ];
 for(const [change,pattern]of changes){const model=structuredClone(rich);change(model);assert.throws(()=>validateModel(model),pattern);}
 validateModel(rich);validateModel(seed);
 assert.throws(()=>validateFragment({edges:{a:{width:'2'}}},'agentCanvas'));
});
test('invalid JSON model writes leave SQLite body, revision and history untouched',()=>{
 const store=openStore(':memory:');
 try{
  store.write('studio',rich,0);const before=store.read('studio');
  const bad=structuredClone(rich);bad.views.find(v=>v.moduleSpec).moduleSpec.policies='wrong';
  assert.throws(()=>store.write('studio',bad,1),/policies.*array/);
  assert.deepEqual(store.read('studio'),before);
  assert.equal(store.db.prepare('select count(*) as n from model_history').get().n,1);
 }finally{store.close();}
});
