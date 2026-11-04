// Generated offline application shell. Account API responses are never cached.
// Cloudflare redirects /index.html to /. Cache the canonical URL so browser
// navigation never receives a redirected response from Cache Storage.
const CACHE='lexiday-shell-0ad39af37fd58bb0',FILES=["/account-store.js","/account-ui.js","/account.css","/app.js","/bootstrap.js","/content.js","/data.js","/dictionary-manifest.js","/engine.js","/grammar-book-answers.js","/grammar-book-data.js","/grammar-data.js","/grammar-model.js","/grammar-page-turn.js","/grammar-reader-model.js","/grammar-reader.css","/grammar-reader.js","/grammar-retry-data.js","/grammar.css","/grammar.js","/ielts-data.js","/ielts-model.js","/ielts-vocabulary.js","/ielts.css","/ielts.js","/imported-vocabulary.js","/","/learning-audio.js","/listening-answers.js","/listening-model.js","/listening-practice.js","/listening-ui.js","/personal-words.js","/quiz-session.js","/quiz-view.js","/reading-dictionary.js","/reading-library.js","/reading-model.js","/review-schedule.js","/speech-assets.js","/speech-cache.js","/speech-storage.js","/speech.js","/style.css","/unit1-model.js","/unit1-reading.js","/unit1-ui.js","/word-content.js","/word-enrichment.js","/word-notes.js"];
self.addEventListener('install',event=>event.waitUntil((async()=>{try{const cache=await caches.open(CACHE);await cache.addAll(FILES);}catch{}await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{try{for(const key of await caches.keys())if(key.startsWith('lexiday-shell-')&&key!==CACHE)await caches.delete(key);}catch{}await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 const path=url.pathname==='/index.html'?'/':url.pathname;if(!FILES.includes(path))return;
 event.respondWith((async()=>{
  try{const cached=await (await caches.open(CACHE)).match(path);if(cached)return cached.redirected?new Response(cached.body,{status:cached.status,statusText:cached.statusText,headers:cached.headers}):cached;}catch{}
  try{return await fetch(event.request);}catch{
   if(event.request.mode==='navigate')return new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>连接暂未恢复 · 词序</title><main style="max-width:36em;margin:15vh auto;padding:24px;font-family:system-ui"><h1>连接暂未恢复</h1><p>请联网后重试。学习记录仍保存在原位置。</p><p><a href="/recover.html">恢复网站访问</a></p></main></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
   return new Response('Resource temporarily unavailable',{status:503});
  }
 })());
});
