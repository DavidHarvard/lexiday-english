import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
function worker({cacheFailure=false,matchFailure=false,offline=false,cached=null}={}){
 const handlers={},calls=[],cache={addAll:async()=>{},match:async()=>{if(matchFailure)throw Error('Cache read failed');return cached;}};
 const scope={location:{origin:'https://site.test'},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(name,fn)=>handlers[name]=fn};
 vm.runInNewContext(source,{self:scope,URL,Response,caches:{open:async()=>{if(cacheFailure)throw Error('Cache storage unavailable');return cache;},keys:async()=>[],delete:async()=>{}},fetch:async request=>{calls.push(request.url);if(offline)throw TypeError('Failed to fetch');return new Response('Live page',{headers:{'Content-Type':'text/html'}});}});
 return {calls,async navigate(path='/#learn'){let response;handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://site.test'+path},respondWith:value=>response=value});return response;},async install(){let promise;handlers.install({waitUntil:p=>promise=p});await promise;}};
}
test('unavailable Cache Storage still loads the live learning page',async()=>{const w=worker({cacheFailure:true});const response=await w.navigate();assert.equal(await response.text(),'Live page');assert.equal(w.calls.length,1);});
test('a corrupt cache entry falls back to the live page',async()=>{const w=worker({matchFailure:true});assert.equal(await (await w.navigate()).text(),'Live page');});
test('the replacement worker can install even when storage is unavailable',async()=>{await worker({cacheFailure:true}).install();});
test('cached content still opens offline; total failure shows a recovery page instead of ERR_FAILED',async()=>{const cached=new Response('Saved page');assert.equal(await (await worker({offline:true,cached}).navigate()).text(),'Saved page');const unavailable=await worker({offline:true,cacheFailure:true}).navigate();assert.equal(unavailable.status,503);assert.match(await unavailable.text(),/recover\.html/);});
test('recovery and account endpoints bypass interception',async()=>{const w=worker();assert.equal(await w.navigate('/recover.html'),undefined);assert.equal(await w.navigate('/api/session'),undefined);});
test('cached redirect metadata is removed before answering a navigation',async()=>{const cached=new Response('Canonical page');Object.defineProperty(cached,'redirected',{value:true});const response=await worker({cached}).navigate();assert.equal(response.redirected,false);assert.equal(await response.text(),'Canonical page');});
