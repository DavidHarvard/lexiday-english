import {speechAssets} from './speech-assets.js';
const normalized=text=>String(text).trim().replace(/\s+/g,' ');
export const recordedAsset=text=>speechAssets[normalized(text)];
export function createSpeechStorage({storage=globalThis.caches,fetcher=(...args)=>fetch(...args),limit=1500,maxBytes=256*1024*1024,assets=speechAssets}={}){
 let ready,writes=Promise.resolve(),sizes;
 const cache=()=>ready??=storage?.open('lexiday-speech-melo-v3').catch(()=>null);
 async function key(text){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized(text)));return '/__speech-cache/melo-v3/'+[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
 async function get(text,signal){const store=await cache(),url=await key(text);let response;try{response=await store?.match(url);}catch{}
  if(response)return response.blob();const asset=assets[normalized(text)];if(!asset)return null;
  response=await fetcher(asset,{signal});if(!response.ok||!response.headers.get('Content-Type')?.startsWith('audio/'))return null;const blob=await response.blob();if(blob.size<100)return null;await put(text,blob);return blob;
 }
 async function put(text,blob){const write=async()=>{try{const store=await cache();if(!store)return;if(!sizes){sizes=new Map();for(const request of await store.keys()){const response=await store.match(request);sizes.set(typeof request==='string'?request:request.url,Number(response?.headers.get('Content-Length'))||0);}}
  const url=await key(text),absolute=new URL(url,globalThis.location?.origin||'http://localhost').href;await store.delete(url);await store.put(url,new Response(blob,{headers:{'Content-Type':blob.type||'audio/wav','Content-Length':String(blob.size)}}));sizes.delete(absolute);sizes.set(absolute,blob.size);let total=[...sizes.values()].reduce((a,b)=>a+b,0);while(sizes.size>limit||total>maxBytes){const oldest=sizes.keys().next().value;total-=sizes.get(oldest);sizes.delete(oldest);await store.delete(oldest);}
 }catch{sizes=null;}};writes=writes.then(write,write);await writes;}
 return {get,put};
}
export const speechStorage=globalThis.caches?createSpeechStorage():null;
