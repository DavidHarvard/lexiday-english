import {speechStorage} from './speech-storage.js';
// One shared cache for playback and silent look-ahead. A foreground consumer
// joins an existing download, so clicking a prefetched word never requests it twice.
export function createSpeechAudioCache({fetcher=(...args)=>fetch(...args),maxEntries=64,maxBytes=16*1024*1024,timeoutMs=30000,storage=speechStorage}={}){
 const cache=new Map(),jobs=new Map();let bytes=0,targets=[],scheduled=false,backgroundPauseUntil=0;
 const aborted=()=>new DOMException('Audio request canceled','AbortError');
 function cached(text){const value=cache.get(text);if(value){cache.delete(text);cache.set(text,value);}return value;}
 function remember(text,blob){if(cache.has(text))bytes-=cache.get(text).size;cache.delete(text);cache.set(text,blob);bytes+=blob.size;while(cache.size>maxEntries||bytes>maxBytes){const oldest=cache.keys().next().value;bytes-=cache.get(oldest).size;cache.delete(oldest);}}
 function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;pump();});}
 function discard(job){if(jobs.get(job.text)!==job)return;jobs.delete(job.text);job.controller?.abort();schedule();}
 function jobFor(text){let job=jobs.get(text);if(!job){job={text,consumers:new Set(),background:false,running:false,controller:null};jobs.set(text,job);}return job;}
 function settle(job,error,blob){for(const consumer of job.consumers){consumer.cleanup();if(error)consumer.reject(error);else consumer.resolve(blob);}job.consumers.clear();}
 async function start(job){
  job.running=true;job.controller=new AbortController();const timer=setTimeout(()=>job.controller.abort(),timeoutMs);timer.unref?.();
  try{let blob;try{blob=await storage?.get(job.text,job.controller.signal);}catch(error){if(job.controller.signal.aborted)throw error;}
   if(!blob){const response=await fetcher('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:job.text}),signal:job.controller.signal});
    if(!response.ok||!response.headers.get('Content-Type')?.startsWith('audio/'))throw Error('audio-unavailable');
    blob=await response.blob();if(blob.size<100)throw Error('audio-unavailable');await storage?.put(job.text,blob);
   }
   if(jobs.get(job.text)!==job)return;remember(job.text,blob);settle(job,null,blob);
  }catch(error){if(jobs.get(job.text)!==job)return;if(job.background){backgroundPauseUntil=Date.now()+30000;const retry=setTimeout(schedule,30000);retry.unref?.();}settle(job,error);}
  finally{clearTimeout(timer);if(jobs.get(job.text)===job)jobs.delete(job.text);schedule();}
 }
 function pump(){
  // At most one speculative transfer; active playback can use the second slot
  // immediately. Never start another background download while playback waits.
  let running=[...jobs.values()].filter(j=>j.running);
  if(running.length>=2&&[...jobs.values()].some(j=>!j.running&&j.consumers.size)){
   // Rapid replay can leave two formerly foreground transfers as preloads.
   // Yield the less urgent one so a new playback never waits behind both.
   const victim=running.filter(j=>!j.consumers.size).sort((a,b)=>targets.indexOf(b.text)-targets.indexOf(a.text))[0];
   if(victim){discard(victim);if(targets.includes(victim.text))jobFor(victim.text).background=true;running=running.filter(j=>j!==victim);}
  }
  for(const job of jobs.values())if(!job.running&&job.consumers.size&&running.length<2){void start(job);running.push(job);}
  if(running.some(j=>j.consumers.size)||running.some(j=>j.background)||running.length>=2||Date.now()<backgroundPauseUntil)return;
  const job=targets.map(text=>jobs.get(text)).find(j=>j&&!j.running&&j.background);if(job)void start(job);
 }
 function load(text,signal){
  if(signal?.aborted)return Promise.reject(aborted());const value=cached(text);if(value)return Promise.resolve(value);
  const job=jobFor(text);
  return new Promise((resolve,reject)=>{
   const consumer={resolve,reject,cleanup:()=>signal?.removeEventListener('abort',cancel)};
   function cancel(){if(!job.consumers.delete(consumer))return;consumer.cleanup();reject(aborted());if(!job.background&&!job.consumers.size)discard(job);else schedule();}
   job.consumers.add(consumer);signal?.addEventListener('abort',cancel,{once:true});schedule();
  });
 }
 function prefetch(texts){
  const next=[...new Set(texts.filter(Boolean))];if(next.length===targets.length&&next.every((text,i)=>text===targets[i]))return;
  targets=next;const wanted=new Set(targets);
  for(const job of jobs.values()){job.background=wanted.has(job.text);if(!job.background&&!job.consumers.size)discard(job);}
  for(const text of targets)if(!cache.has(text))jobFor(text).background=true;
  schedule();
 }
 return {load,prefetch,has:text=>cache.has(text)};
}
export const speechAudioCache=createSpeechAudioCache();
