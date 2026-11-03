import fs from 'node:fs';
import {createHash} from 'node:crypto';
const files=fs.readdirSync('dist').filter(x=>/\.(js|css|html)$/.test(x)&&!x.startsWith('_')&&x!=='sw.js').sort();
const revision=createHash('sha256').update(Buffer.concat(files.map(x=>fs.readFileSync('dist/'+x)))).digest('hex').slice(0,16);
fs.writeFileSync('dist/sw.js',`// Generated offline application shell. Account API responses are never cached.
const CACHE='lexiday-shell-${revision}',FILES=${JSON.stringify(files.map(x=>'/'+x))};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(FILES);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('lexiday-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 const path=url.pathname==='/'?'/index.html':url.pathname;if(!FILES.includes(path))return;
 event.respondWith((async()=>{const cached=await (await caches.open(CACHE)).match(path);return cached||fetch(event.request);})());
});
`);
console.log(JSON.stringify({offlineFiles:files.length,revision}));
