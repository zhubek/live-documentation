import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Uses the same shared-password session and revision checks as the browser.
export async function studioClient({url,password,fetcher=fetch}){
 const base=new URL(url).origin;
 const login=await fetcher(base+'/api/session',{method:'POST',signal:AbortSignal.timeout(30000),headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({password})});
 if(!login.ok)throw Error('Studio sign-in failed. Check STUDIO_URL and STUDIO_PASSWORD.');
 const cookie=login.headers.get('set-cookie')?.split(';')[0];
 if(!cookie)throw Error('Studio did not issue a session.');
 return async(path,method='GET',body)=>{
  const response=await fetcher(base+path,{method,signal:AbortSignal.timeout(30000),headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json();
  if(!response.ok){const error=new Error(`${response.status}: ${data.error||'Studio request failed'}`);error.status=response.status;throw error;}
  return data;
 };
}
export async function run(command,file,{url=process.env.STUDIO_URL,password=process.env.STUDIO_PASSWORD}={}){
 if(!['pull','schema','validate','push'].includes(command)||!file)throw Error('Usage: node studio-client.mjs pull|schema|validate|push file.json');
 if(!url||!password)throw Error('Set STUDIO_URL and STUDIO_PASSWORD in the environment. Never put credentials in JSON or commit them.');
 const request=await studioClient({url,password});
 if(command==='pull'||command==='schema'){
  const body=await request(command==='pull'?'/api/model':'/api/schema');
  await writeFile(file,JSON.stringify(body,null,2)+'\n',{flag:'wx'});
  return {file,...(command==='pull'?{revision:body.revision}:{}),message:'Saved. Existing files are never overwritten.'};
 }
 const proposal=JSON.parse(await readFile(file,'utf8'));
 if(!proposal.model||!Number.isSafeInteger(proposal.revision))throw Error('Keep the {model, revision} envelope returned by pull.');
 await request('/api/model/validate','POST',{model:proposal.model});
 if(command==='validate')return {valid:true,revision:proposal.revision};
 return request('/api/model','PUT',{model:proposal.model,revision:proposal.revision});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await run(...process.argv.slice(2)),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
