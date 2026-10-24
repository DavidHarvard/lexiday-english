export const MODULES={'lexiday.v1':'words','lexiday.grammar.v1':'grammar','lexiday.ielts.v1':'ielts'};
export const LABELS={words:'单词学习',grammar:'语法课堂',ielts:'雅思计划与写作'};
const ACTIVE='lexiday.account.v1';
let user=null,available=false,verified=false,status='正在连接账号服务',timer,busy=false,locked=false;
const listeners=new Set();
const cacheKey=(id,module)=>`lexiday.account.${id}.${module}`;
const readJSON=key=>{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null;};
const cache=module=>readJSON(cacheKey(user.id,module));
function put(module,record){localStorage.setItem(cacheKey(user.id,module),JSON.stringify(record));}
function emit(){for(const listener of listeners)listener();}
export function subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function accountState(){let pending=[],conflicts=[];if(user)for(const module of Object.values(MODULES)){const r=cache(module);if(r?.dirty)pending.push(module);if(r?.conflict)conflicts.push(module);}return {user,available,verified,status,pending,conflicts,locked};}
export async function api(path,method='GET',data){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{const r=await fetch('/api/'+path,{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});let b;try{b=await r.json();}catch{throw Object.assign(Error('账号服务尚未部署，访客学习仍可使用。'),{status:503});}if(!r.ok)throw Object.assign(Error(b.error||'账号请求失败。'),{status:r.status});return b;}catch(e){if(e.name==='AbortError')throw Error('连接超时，本机记录仍然保留。');throw e;}finally{clearTimeout(timeout);}}
export async function initAccount(){
 try{const selected=readJSON(ACTIVE);const remote=await api('session');user=remote.user;available=true;verified=true;
  // A cookie is authoritative; a stale local user selection never chooses a server account.
  localStorage.setItem(ACTIVE,JSON.stringify(user));
  for(const module of Object.values(MODULES)){
   const existing=cache(module),cloud=remote.progress[module]||{data:null,revision:0};
   if(existing?.dirty){if(existing.revision!==cloud.revision)put(module,{...existing,conflict:true});}
   else put(module,{...cloud,dirty:false,seq:existing?.seq||0,conflict:false});
  }
  status='已连接，学习后自动同步';
 }catch(e){
  if(e.status===401){available=true;verified=false;user=null;localStorage.removeItem(ACTIVE);status='访客进度仅存本机，登录后可同步';}
  else {try{user=readJSON(ACTIVE);}catch{}status=user?'当前离线，记录暂存本机，联网后重试':'账号服务暂不可用，仍可访客学习';}
 }
 emit();if(user&&verified)queueSync();
}
export function readState(key){const module=MODULES[key];if(!module||!user)return localStorage.getItem(key);const record=cache(module);return record?.data?JSON.stringify(record.data):null;}
export function writeState(key,value){
 if(locked)throw Error('其他标签页已更改进度，请重新载入后继续。');
 const module=MODULES[key];if(!module||!user){localStorage.setItem(key,value);return;}
 const previous=cache(module)||{revision:0,seq:0};put(module,{...previous,data:JSON.parse(value),dirty:true,seq:previous.seq+1});status='已保存本机，等待同步';emit();queueSync();
}
function queueSync(){clearTimeout(timer);timer=setTimeout(()=>syncNow(),1200);}
export async function syncNow(){
 if(!user||busy||locked)return;busy=true;clearTimeout(timer);
 try{
  if(!verified){const remote=await api('session');if(remote.user.id!==user.id)throw Error('登录账号已改变，请重新载入；待同步记录保留在原账号。');verified=true;available=true;}
  for(const module of Object.values(MODULES)){
   const record=cache(module);if(!record?.dirty||record.conflict)continue;
   const sent=structuredClone(record);
   try{const result=await api('progress/'+module,'PUT',{revision:sent.revision,data:sent.data});const latest=cache(module);put(module,{...latest,revision:result.revision,updatedAt:result.updatedAt,dirty:latest.seq!==sent.seq,conflict:false});}
   catch(e){if(e.status===409){put(module,{...cache(module),conflict:true});}else throw e;}
  }
  const a=accountState();status=a.conflicts.length?'发现多设备冲突，请在账号页处理':a.pending.length?'已保存本机，等待同步':'云端已同步';
 }catch(e){if(e.status===401)verified=false;status=e.message||'同步失败，本机记录已保留';}
 finally{busy=false;emit();if(verified&&accountState().pending.some(m=>!cache(m)?.conflict)&&status==='已保存本机，等待同步')queueSync();}
}
export function guestData(){return Object.fromEntries(Object.entries(MODULES).map(([key,module])=>[module,readJSON(key)]).filter(([,value])=>value));}
export async function importGuest(){
 if(!user||!verified||locked)throw Error('请先登录并连接服务器。');
 const data=guestData();for(const [module,value] of Object.entries(data)){const r=cache(module)||{revision:0,seq:0};put(module,{...r,data:value,dirty:true,seq:r.seq+1});}
 await syncNow();return accountState();
}
export async function resolveConflict(module,useLocal){
 if(!Object.values(MODULES).includes(module)||!user)throw Error('模块无效。');
 const remote=await api('session');if(remote.user.id!==user.id)throw Error('账号已改变，请重新登录。');
 const cloud=remote.progress[module]||{data:null,revision:0},local=cache(module);
 if(useLocal)put(module,{...local,revision:cloud.revision,conflict:false,dirty:true,seq:local.seq+1});
 else put(module,{...cloud,seq:(local?.seq||0)+1,dirty:false,conflict:false});
 await syncNow();
}
export function exportAccount(){return {exportedAt:new Date().toISOString(),username:user?.username||'访客',modules:user?Object.fromEntries(Object.values(MODULES).map(m=>[m,cache(m)?.data||null])):guestData()};}
export async function signOut(){await syncNow();if(accountState().pending.length)throw Error('还有未同步或冲突的记录。请先处理同步，再退出账号。');await api('logout','POST',{});for(const module of Object.values(MODULES))localStorage.removeItem(cacheKey(user.id,module));localStorage.removeItem(ACTIVE);location.reload();}
export function chooseUser(next){localStorage.setItem(ACTIVE,JSON.stringify(next));}
export function mountAccountWatchers(){
 window.addEventListener('online',()=>syncNow());
 window.addEventListener('pagehide',()=>{clearTimeout(timer);});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncNow();});
 window.addEventListener('storage',e=>{if(e.key===ACTIVE||(user&&e.key?.startsWith(`lexiday.account.${user.id}.`))){locked=true;status='其他标签页已修改账号或进度，请重新载入后继续';emit();}});
 // Retrying never drops pending data or silently resolves revision conflicts.
 setInterval(()=>{if(user&&accountState().pending.length)syncNow();},30000);
}
