import {authorized,sameOrigin} from '../../../../server/auth.js';
import {json,readJson} from '../../../../server/http.js';
import {validateModel} from '../../../../src/model.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request){
 if(!authorized(request))return json({error:'Sign in to validate documentation.'},401);
 if(!sameOrigin(request))return json({error:'Invalid request origin.'},403);
 try{const {model}=await readJson(request);validateModel(model);return json({valid:true});}
 catch(error){return json({valid:false,error:error.message,errors:error.validationErrors||[]},400);}
}
