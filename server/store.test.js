import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openStore,ConflictError} from './store.js';
import {seed} from '../src/seed.js';
import {issueSession,authorized,validPassword,sameOrigin} from './auth.js';
test('SQLite survives reopening, rejects stale writes, and retains revision history',()=>{
 const dir=mkdtempSync(join(tmpdir(),'studio-test-')),path=join(dir,'studio.sqlite');
 let store=openStore(path);
 try{
  assert.equal(store.read('studio').revision,0);
  store.write('studio',seed,0);
  store.close();store=openStore(path);
  assert.deepEqual(store.read('studio').model,seed);
  const next={...seed,name:'Updated model'};
  store.write('studio',next,1);
  assert.throws(()=>store.write('studio',seed,1),ConflictError);
  assert.equal(store.read('studio').model.name,'Updated model');
  assert.equal(store.db.prepare('SELECT COUNT(*) AS count FROM model_history').get().count,2);
  assert.throws(()=>store.write('studio',{version:1},2));
  assert.equal(store.read('studio').revision,2);
  assert.equal(store.read('another-workspace').model,null);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
test('sessions require correct password and signed cookie; writes require same origin',()=>{
 process.env.STUDIO_PASSWORD='test-only-password';process.env.STUDIO_SESSION_SECRET='test-only-secret';process.env.STUDIO_ORIGIN='http://localhost:5185';
 assert.equal(validPassword('wrong'),false);assert.equal(validPassword('test-only-password'),true);
 const token=issueSession();
 assert.equal(authorized(new Request('http://localhost:5185',{headers:{cookie:'studio_session='+token}})),true);
 assert.equal(authorized(new Request('http://localhost:5185',{headers:{cookie:'studio_session='+token+'tampered'}})),false);
 assert.equal(authorized(new Request('http://localhost:5185')),false);
 assert.equal(sameOrigin(new Request('http://localhost:5185',{headers:{origin:'https://other.example'}})),false);
 assert.equal(sameOrigin(new Request('http://localhost:5185',{headers:{origin:'http://localhost:5185'}})),true);
});
