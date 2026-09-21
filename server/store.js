import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {validateModel} from '../src/model.js';

export class ConflictError extends Error {}
export function openStore(path) {
 if(path!==':memory:') mkdirSync(dirname(path),{recursive:true});
 const db=new DatabaseSync(path,{timeout:5000});
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS models(workspace TEXT PRIMARY KEY, body TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS model_history(workspace TEXT NOT NULL, revision INTEGER NOT NULL, body TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(workspace,revision));
 PRAGMA user_version=1;`);
 const read=(workspace)=>{
  const row=db.prepare('SELECT body,revision,updated_at FROM models WHERE workspace=?').get(workspace);
  return row?{model:JSON.parse(row.body),revision:row.revision,updatedAt:row.updated_at}:{model:null,revision:0,updatedAt:null};
 };
 const head=workspace=>{const row=db.prepare('SELECT revision,updated_at FROM models WHERE workspace=?').get(workspace);return {revision:row?.revision||0,updatedAt:row?.updated_at||null};};
 return {db,read,head,close:()=>db.close(),write(workspace,model,revision){
  if(!Number.isSafeInteger(revision)||revision<0) throw Error('A valid base revision is required.');
  validateModel(model);
  const body=JSON.stringify(model);
  if(Buffer.byteLength(body)>5_000_000) throw Error('Model exceeds 5 MB.');
  db.exec('BEGIN IMMEDIATE');
  try {
   const current=read(workspace);
   if(current.revision!==revision) throw new ConflictError('Another editor saved a newer version.');
   const updatedAt=new Date().toISOString(),next=revision+1;
   db.prepare('INSERT INTO models VALUES(?,?,?,?) ON CONFLICT(workspace) DO UPDATE SET body=excluded.body,revision=excluded.revision,updated_at=excluded.updated_at').run(workspace,body,next,updatedAt);
   db.prepare('INSERT INTO model_history VALUES(?,?,?,?)').run(workspace,next,body,updatedAt);
   db.prepare('DELETE FROM model_history WHERE workspace=? AND revision<=?').run(workspace,next-50);
   db.exec('COMMIT');
   return {revision:next,updatedAt};
  } catch(error){db.exec('ROLLBACK');throw error;}
 }};
}
export function getStore(){
 if(!globalThis.__studioStore) globalThis.__studioStore=openStore(process.env.STUDIO_DB_PATH||'./data/studio.sqlite');
 return globalThis.__studioStore;
}
