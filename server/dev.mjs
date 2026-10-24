import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync,statSync} from 'node:fs';
import {resolve,extname,relative,isAbsolute} from 'node:path';
import worker from './worker.js';
import {database} from './local-db.mjs';
const root=resolve('dist');mkdirSync('.local',{recursive:true});
if(!existsSync('.local/pepper'))writeFileSync('.local/pepper',crypto.randomUUID()+crypto.randomUUID(),{mode:0o600});
const env={DB:database('.local/lexiday.sqlite'),AUTH_PEPPER:readFileSync('.local/pepper','utf8'),ASSETS:{fetch:async request=>{
 const path=resolve(root,'.'+decodeURIComponent(new URL(request.url).pathname));
 const rel=relative(root,path);
 if(rel.startsWith('..')||isAbsolute(rel)||rel.split(/[\\/]/).some(part=>part.startsWith('_')))return new Response('Not found',{status:404});
 const file=path===root?resolve(root,'index.html'):path;
 if(!existsSync(file)||!statSync(file).isFile())return new Response('Not found',{status:404});
 const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.mp3':'audio/mpeg','.txt':'text/plain; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png'}[extname(file)]||'application/octet-stream';
 const bytes=readFileSync(file),headers={'Content-Type':mime,'Cache-Control':'no-store','Accept-Ranges':'bytes'};
 const range=request.headers.get('Range')?.match(/^bytes=(\d+)-(\d*)$/);
 if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),bytes.length-1):bytes.length-1;if(start>=bytes.length||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`}});return new Response(bytes.subarray(start,end+1),{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':String(end-start+1)}});}
 return new Response(bytes,{headers:{...headers,'Content-Length':String(bytes.length)}});
}}};
const port=Number(process.env.PORT||4190);
createServer(async(req,res)=>{try{const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>6000000){res.writeHead(413);res.end();return;}chunks.push(c);}const method=req.method;
 const request=new Request('http://127.0.0.1:'+port+req.url,{method,headers:req.headers,...(!['GET','HEAD'].includes(method)?{body:Buffer.concat(chunks)}:{})});
 const result=await worker.fetch(request,env,{waitUntil:p=>p.catch(()=>{})});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
}catch{res.writeHead(500);res.end('Local server error');}}).listen(port,'127.0.0.1',()=>console.log(`Lexiday account preview: http://127.0.0.1:${port}`));
