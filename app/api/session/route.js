import {authorized,configured,validPassword,issueSession,sessionCookie,sameOrigin} from '../../../server/auth.js';
import {json,readJson} from '../../../server/http.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const attempts=new Map();
export async function GET(request){return json({authenticated:authorized(request),configured:configured()});}
export async function POST(request){
 if(!configured()) return json({error:'Set STUDIO_PASSWORD on the server before signing in.'},503);
 if(!sameOrigin(request)) return json({error:'Invalid request origin.'},403);
 // A shared deployment-wide budget does not trust client-supplied forwarding headers.
 const now=Date.now(),recent=(attempts.get('login')||[]).filter(t=>now-t<60_000);
 attempts.set('login',recent);
 if(recent.length>=10) return json({error:'Too many attempts. Try again in one minute.'},429);
 recent.push(now);
 let body;try{body=await readJson(request,4096);}catch{return json({error:'Invalid login request.'},400);}
 if(!validPassword(body.password)) return json({error:'Incorrect password.'},401);
 return json({authenticated:true},200,{'Set-Cookie':sessionCookie(issueSession())});
}
export async function DELETE(request){
 if(!sameOrigin(request)) return json({error:'Invalid request origin.'},403);
 return json({authenticated:false},200,{'Set-Cookie':sessionCookie('',0)});
}
