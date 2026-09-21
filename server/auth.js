import {createHmac,createHash,randomBytes,timingSafeEqual} from 'node:crypto';
export const cookieName='studio_session';
const digest=value=>createHash('sha256').update(value).digest();
function secret(){return process.env.STUDIO_SESSION_SECRET||process.env.STUDIO_PASSWORD;}
export function configured(){return !!process.env.STUDIO_PASSWORD&&!!secret();}
export function validPassword(value){return typeof value==='string'&&configured()&&timingSafeEqual(digest(value),digest(process.env.STUDIO_PASSWORD));}
export function issueSession(){
 const payload=Buffer.from(JSON.stringify({expires:Date.now()+7*24*60*60*1000,nonce:randomBytes(16).toString('hex')})).toString('base64url');
 return payload+'.'+createHmac('sha256',secret()).update(payload).digest('base64url');
}
export function authorized(request){
 if(!configured()) return false;
 try {
  const token=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  const [payload,signature]=token.split('.');
  const expected=createHmac('sha256',secret()).update(payload).digest('base64url');
  return timingSafeEqual(digest(signature),digest(expected))&&JSON.parse(Buffer.from(payload,'base64url').toString()).expires>Date.now();
 }catch{return false;}
}
export function sameOrigin(request){
 const origin=request.headers.get('origin');
 return !!origin&&origin===(process.env.STUDIO_ORIGIN||new URL(request.url).origin);
}
export function sessionCookie(value,maxAge=604800){
 return `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.STUDIO_COOKIE_SECURE==='true'?'; Secure':''}`;
}
