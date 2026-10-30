import {validateState} from '../dist/engine.js';
import {validateGrammar} from '../dist/grammar-model.js';
import {validateIelts} from '../dist/ielts-model.js';
import {prepareReadingRequest,generateReading,READING_GENERATOR_VERSION,READING_DAILY_LIMIT} from './reading.js';
const validators={words:validateState,grammar:validateGrammar,ielts:validateIelts};
const enc=new TextEncoder();
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const token=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const digest=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
const now=()=>Math.floor(Date.now()/1000);
class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});}
function cookie(value,request,age=604800){const secure=new URL(request.url).protocol==='https:';return `${secure?'__Host-lexiday':'lexiday_local'}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?'; Secure':''}`;}
function cookieToken(request){const name=new URL(request.url).protocol==='https:'?'__Host-lexiday':'lexiday_local';return request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';}
async function body(request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'请使用 JSON 请求。');if(Number(request.headers.get('content-length'))>6000000)throw new HttpError(413,'数据超过 6 MB，请先导出并整理历史记录。');const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'缺少请求内容。');let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>6000000){await reader.cancel();throw new HttpError(413,'数据超过 6 MB。');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpError(400,'请求格式不正确。');}}
function credentials(b){if(!b||typeof b.username!=='string'||! /^[a-zA-Z0-9_\-]{3,32}$/.test(b.username))throw new HttpError(400,'用户名需为 3–32 位英文字母、数字、下划线或短横线。');if(typeof b.password!=='string'||b.password.length<12||b.password.length>128)throw new HttpError(400,'密码需为 12–128 个字符，建议使用一段不重复的长密码。');return b.username.toLowerCase();}
// PBKDF2 uses native WebCrypto within Workers' per-call iteration limit; a secret pepper
// separately protects database-only leaks. Never deploy without the server-only AUTH_PEPPER.
async function passwordHash(password,salt,pepper){const hmac=await crypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);const input=await crypto.subtle.sign('HMAC',hmac,enc.encode(password));const key=await crypto.subtle.importKey('raw',input,'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256));}
function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function limit(db,key,max,seconds){const stamp=now(),bucket=Math.floor(stamp/seconds);const row=await db.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key+':'+bucket,stamp+seconds*2).first();if(row.count>max)throw new HttpError(429,'操作过于频繁，请稍后重试。');}
async function auth(request,env){const raw=cookieToken(request);if(!/^[a-f0-9]{64}$/.test(raw))throw new HttpError(401,'请先登录。');const hash=await digest(raw);const user=await env.DB.prepare('SELECT users.id,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?').bind(hash,now()).first();if(!user)throw new HttpError(401,'登录已过期，请重新登录；本机待同步记录仍保留。');return {...user,sessionHash:hash};}
async function session(request,env,user){const raw=token();await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await digest(raw),user.id,now()+604800).run();return cookie(raw,request);}
async function allProgress(db,id){const {results}=await db.prepare('SELECT module,data,revision,updated_at FROM progress WHERE user_id=?').bind(id).all();return Object.fromEntries(results.map(r=>[r.module,{data:JSON.parse(r.data),revision:r.revision,updatedAt:r.updated_at}]));}
export default {async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
 try{
  if(!env.DB||(path!=='/api/reading'&&(!env.AUTH_PEPPER||env.AUTH_PEPPER.length<32)))throw new HttpError(503,'账号服务尚未配置完成。访客学习仍可使用。');
  if(path==='/api/health'&&request.method==='GET'){await env.DB.prepare('SELECT id FROM users LIMIT 1').first();return json({ok:true,version:'accounts-v1'});}
  if(!['GET','POST','PUT'].includes(request.method))throw new HttpError(405,'不支持此操作。');
  if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)throw new HttpError(403,'请求来源不正确，请刷新网站后重试。');
  const ip=request.headers.get('CF-Connecting-IP')||'local';
  if(path==='/api/reading'&&request.method==='POST'){
   let prepared;try{prepared=prepareReadingRequest(await body(request));}catch(error){throw new HttpError(400,error.message);}
   if(!env.AI?.run)throw new HttpError(503,'今日文章服务暂不可用，已为你准备完整的主题文章。');
   const signature=await digest(JSON.stringify(prepared.targets)),cache=globalThis.caches?.default;
   const cacheKey=new Request(url.origin+'/api/reading-cache/'+READING_GENERATOR_VERSION+'/'+signature);
   const cached=await cache?.match(cacheKey);if(cached)return json(await cached.json());
   // A hard site-wide ceiling bounds use of the existing free AI allocation.
   // Each model attempt, including one content-repair retry, uses this ceiling.
   try{await limit(env.DB,'reading-ip:'+await digest(ip),8,86400);}
   catch(error){if(error.status===429)throw new HttpError(429,'今日文章生成额度已用完，可先阅读完整主题文章，明天再生成。');throw error;}
   let article;
   for(let attempt=0;attempt<2;attempt++){
    try{await limit(env.DB,'reading-global-v2',READING_DAILY_LIMIT,86400);}catch(error){if(error.status===429)throw new HttpError(429,'今日文章生成额度已用完，可先阅读完整主题文章，明天再生成。');throw error;}
    try{article=await generateReading(env.AI,prepared);break;}
    catch(error){
     if(attempt===0&&error.readingValidation){prepared={...prepared,messages:[...prepared.messages,{role:'user',content:'The draft did not meet the length, paragraph structure, or vocabulary requirements. Rewrite the whole story with 6 or more substantial connected paragraphs, at least 400 English words, at least 4 sentences in every paragraph, accurate Chinese translations, and all supplied vocabulary in natural contexts. Return the complete JSON object only.'}]};continue;}
     console.error('Reading generation failed:',error.message);throw new HttpError(503,'今日文章生成暂未完成，已为你准备完整的主题文章，可稍后重试。');
    }
   }
   if(cache){const stored=new Response(JSON.stringify({article}),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=604800'}});const pending=cache.put(cacheKey,stored);if(ctx?.waitUntil)ctx.waitUntil(pending);else await pending;}
   return json({article});
  }
  if(['/api/register','/api/login','/api/recover'].includes(path)&&request.method==='POST'){
   await limit(env.DB,'auth-ip:'+await digest(ip),40,900);
   const b=await body(request),username=credentials(b);
   await limit(env.DB,'auth-user:'+await digest(username),12,900);
   if(path==='/api/register'){
    const id=crypto.randomUUID(),salt=token(),recovery=token();
    const hash=await passwordHash(b.password,salt,env.AUTH_PEPPER);
    const r=await env.DB.prepare('INSERT OR IGNORE INTO users(id,username,password_hash,salt,recovery_hash,created_at) VALUES (?,?,?,?,?,?)').bind(id,username,hash,salt,await digest(recovery),now()).run();
    if(!r.meta.changes)throw new HttpError(409,'该用户名已被使用，请换一个。');
    return json({user:{id,username},recoveryCode:recovery},201,{'Set-Cookie':await session(request,env,{id})});
   }
   const user=await env.DB.prepare('SELECT * FROM users WHERE username=?').bind(username).first();
   if(path==='/api/recover'){
    const code=typeof b.recoveryCode==='string'?b.recoveryCode.trim():'';
    if(!user||!/^[a-f0-9]{64}$/.test(code)||!equal(await digest(code),user.recovery_hash))throw new HttpError(401,'用户名或恢复码不正确。');
    const salt=token(),recovery=token(),recoveryHash=await digest(recovery),hash=await passwordHash(b.password,salt,env.AUTH_PEPPER);
    // Conditional update makes recovery codes single-use even for concurrent requests.
    const result=await env.DB.batch([
     env.DB.prepare('UPDATE users SET password_hash=?,salt=?,recovery_hash=? WHERE id=? AND recovery_hash=?').bind(hash,salt,recoveryHash,user.id,user.recovery_hash),
     env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND EXISTS (SELECT 1 FROM users WHERE id=? AND recovery_hash=?)').bind(user.id,user.id,recoveryHash)
    ]);
    if(!result[0].meta.changes)throw new HttpError(409,'恢复码已使用，请使用最新恢复码。');
    return json({user:{id:user.id,username},recoveryCode:recovery},200,{'Set-Cookie':await session(request,env,user)});
   }
   const calculated=await passwordHash(b.password,user?.salt||'unknown-user-dummy-salt',env.AUTH_PEPPER);
   if(!user||!equal(calculated,user.password_hash))throw new HttpError(401,'用户名或密码不正确。');
   // Expired rows contain no active sessions and can be removed without touching progress.
   ctx?.waitUntil?.(env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now()),env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now())]));
   return json({user:{id:user.id,username}},200,{'Set-Cookie':await session(request,env,user)});
  }
  const user=await auth(request,env);
  if(path==='/api/session'&&request.method==='GET')return json({user:{id:user.id,username:user.username},progress:await allProgress(env.DB,user.id)});
  if(path==='/api/logout'&&request.method==='POST'){await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(user.sessionHash).run();return json({ok:true},200,{'Set-Cookie':cookie('',request,0)});}
  if(path==='/api/password'&&request.method==='POST'){
   await limit(env.DB,'password:'+user.id,8,900);const b=await body(request);credentials({username:user.username,password:b.password});
   const stored=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(user.id).first();
   if(typeof b.currentPassword!=='string'||b.currentPassword.length>128||!equal(await passwordHash(b.currentPassword,stored.salt,env.AUTH_PEPPER),stored.password_hash))throw new HttpError(401,'当前密码不正确。');
   const salt=token();await env.DB.batch([env.DB.prepare('UPDATE users SET password_hash=?,salt=? WHERE id=?').bind(await passwordHash(b.password,salt,env.AUTH_PEPPER),salt,user.id),env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]);
   return json({ok:true},200,{'Set-Cookie':await session(request,env,user)});
  }
  const module=path.split('/')[3];
  if(path===`/api/progress/${module}`&&request.method==='PUT'&&Object.hasOwn(validators,module)){
   await limit(env.DB,'sync:'+user.id,300,60);const b=await body(request);
   if(!Number.isSafeInteger(b.revision)||b.revision<0)throw new HttpError(400,'版本号无效。');
   try{validators[module](b.data);}catch{throw new HttpError(400,'学习数据校验失败，云端原记录未改变。');}
   const serialized=JSON.stringify(b.data),stamp=now();if(enc.encode(serialized).length>1800000)throw new HttpError(413,'此模块数据超过 1.8 MB，请先导出备份并整理历史记录。');let result;
   if(b.revision===0)result=await env.DB.prepare('INSERT OR IGNORE INTO progress(user_id,module,data,revision,updated_at) VALUES (?,?,?,1,?)').bind(user.id,module,serialized,stamp).run();
   else result=await env.DB.prepare('UPDATE progress SET data=?,revision=revision+1,updated_at=? WHERE user_id=? AND module=? AND revision=?').bind(serialized,stamp,user.id,module,b.revision).run();
   if(!result.meta.changes)return json({error:'另一台设备已更新进度，请先选择要保留的版本。',conflict:true},409);
   return json({revision:b.revision+1,updatedAt:stamp});
  }
  throw new HttpError(404,'接口不存在。');
 }catch(err){return json({error:err instanceof HttpError?err.message:'服务暂时不可用，数据未同步，请稍后重试。'},err instanceof HttpError?err.status:503);}
}};
