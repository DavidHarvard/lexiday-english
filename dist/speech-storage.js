import {speechAssets} from './speech-assets.js';
const normalized=text=>String(text).trim().replace(/\s+/g,' ');
export const recordedAsset=text=>speechAssets[normalized(text)];
export function createSpeechStorage({storage=globalThis.caches,fetcher=(...args)=>fetch(...args),limit=120,assets=speechAssets}={}){
 let ready;
 const cache=()=>ready??=storage?.open('lexiday-speech-v2').catch(()=>null);
 async function key(text){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized(text)));return '/__speech-cache/v2/'+[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
 async function get(text,signal){const store=await cache(),url=await key(text);let response;try{response=await store?.match(url);}catch{}
  if(response)return response.blob();const asset=assets[normalized(text)];if(!asset)return null;
  response=await fetcher(asset,{signal});if(!response.ok||!response.headers.get('Content-Type')?.startsWith('audio/'))return null;const blob=await response.blob();if(blob.size<100)return null;await put(text,blob);return blob;
 }
 async function put(text,blob){try{const store=await cache();if(!store)return;const url=await key(text);await store.delete(url);await store.put(url,new Response(blob,{headers:{'Content-Type':blob.type||'audio/wav','Content-Length':String(blob.size)}}));const keys=await store.keys();for(const old of keys.slice(0,Math.max(0,keys.length-limit)))await store.delete(old);}catch{}}
 return {get,put};
}
export const speechStorage=globalThis.caches?createSpeechStorage():null;
