import {authorized} from '../../../server/auth.js';
import {json} from '../../../server/http.js';
import {modelSchema} from '../../../src/model-schema.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export function GET(request){
 if(!authorized(request))return json({error:'Sign in to read the model schema.'},401);
 return json(modelSchema);
}
