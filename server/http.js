export const json=(body,status=200,headers={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
export async function readJson(request,max=5_100_000){
 if(!request.headers.get('content-type')?.startsWith('application/json')) throw Error('Expected application/json.');
 if(Number(request.headers.get('content-length'))>max) throw Error('Request is too large.');
 const reader=request.body?.getReader();
 if(!reader) throw Error('Request body is required.');
 let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('Request is too large.');}chunks.push(value);}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
