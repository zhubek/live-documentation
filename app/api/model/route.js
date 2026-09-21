import {authorized,sameOrigin} from '../../../server/auth.js';
import {getStore,ConflictError} from '../../../server/store.js';
import {json,readJson} from '../../../server/http.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request){
 if(!authorized(request)) return json({error:'Sign in to load the Studio.'},401);
 return json(new URL(request.url).searchParams.get('revisionOnly')==='true'?getStore().head('studio'):getStore().read('studio'));
}
export async function PUT(request){
 if(!authorized(request)) return json({error:'Your session expired. Sign in again; your local edits are preserved.'},401);
 if(!sameOrigin(request)) return json({error:'Invalid request origin.'},403);
 let body;
 try{body=await readJson(request);}catch{return json({error:'Invalid JSON or request exceeds 5 MB.'},400);}
 try{return json(getStore().write('studio',body.model,body.revision));}
 catch(error){
  if(error instanceof ConflictError) return json({error:error.message},409);
  if(error.code?.startsWith('ERR_SQLITE')) return json({error:'Storage unavailable. Your edits are still in this browser.'},503);
  return json({error:error.message,errors:error.validationErrors||[]},400);
 }
}
