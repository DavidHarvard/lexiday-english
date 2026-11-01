import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpeechAudioCache} from '../dist/speech-cache.js';
import {learningAudioLookahead} from '../dist/learning-audio.js';
import {initial,begin} from '../dist/engine.js';
import {wordMap} from '../dist/data.js';
import {wordEntries,spokenWord} from '../dist/word-content.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(options={}){
 const requests=[];const cache=createSpeechAudioCache({...options,fetcher:(url,init)=>new Promise((resolve,reject)=>{
  const record={text:JSON.parse(init.body).text,signal:init.signal,finish:()=>resolve(new Response(new Uint8Array(160),{headers:{'Content-Type':'audio/wav'}})),fail:()=>reject(Error('offline'))};
  requests.push(record);init.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});
 })});return {cache,requests};
}
test('playback has priority; look-ahead downloads sequentially and cached playback makes no request',async()=>{
 const h=harness();h.cache.prefetch(['current','next','example']);const current=h.cache.load('current');await tick();assert.deepEqual(h.requests.map(r=>r.text),['current']);
 h.requests[0].finish();await current;await tick();assert.deepEqual(h.requests.map(r=>r.text),['current','next']);h.requests[1].finish();await tick();assert.equal(h.requests[2].text,'example');h.requests[2].finish();await tick();
 const count=h.requests.length;assert.equal((await h.cache.load('next')).size,160);assert.equal(h.requests.length,count);h.cache.prefetch([]);
});
test('a click joins an in-flight preload; queued speculation never blocks an uncached foreground clip',async()=>{
 const h=harness();h.cache.prefetch(['next','later']);await tick();const clicked=h.cache.load('next');await tick();assert.equal(h.requests.length,1);
 const urgent=h.cache.load('urgent');await tick();assert.deepEqual(h.requests.map(r=>r.text),['next','urgent']);
 h.requests[0].finish();await clicked;await tick();assert.equal(h.requests.length,2,'later must wait until the foreground request finishes');
 h.requests[1].finish();await urgent;await tick();assert.equal(h.requests[2].text,'later');h.requests[2].finish();await tick();h.cache.prefetch([]);
});
test('changing the look-ahead drops obsolete jobs but keeps a download with a playback subscriber',async()=>{
 const h=harness();h.cache.prefetch(['shared','obsolete']);await tick();const playing=h.cache.load('shared');h.cache.prefetch(['new']);await tick();assert.equal(h.requests[0].signal.aborted,false);
 h.requests[0].finish();await playing;await tick();assert.deepEqual(h.requests.map(r=>r.text),['shared','new']);h.cache.prefetch([]);assert.equal(h.requests[1].signal.aborted,true);await tick();assert.equal(h.cache.has('new'),false);
});
test('canceling playback does not cancel a useful preload; background failures stay retryable',async()=>{
 const h=harness(),controller=new AbortController();h.cache.prefetch(['next']);const playing=h.cache.load('next',controller.signal);await tick();controller.abort();await assert.rejects(playing,{name:'AbortError'});assert.equal(h.requests[0].signal.aborted,false);
 h.requests[0].finish();await tick();assert.equal(h.cache.has('next'),true);h.cache.prefetch(['bad']);await tick();h.requests[1].fail();await tick();assert.equal(h.cache.has('bad'),false);
 const retry=h.cache.load('bad');await tick();assert.equal(h.requests.length,3);h.requests[2].finish();await retry;h.cache.prefetch([]);
});
test('preload cache keeps bounded bytes and does not endlessly re-download evicted targets',async()=>{
 const h=harness({maxEntries:2,maxBytes:320});h.cache.prefetch(['a','b','c']);await tick();h.requests[0].finish();await tick();h.requests[1].finish();await tick();h.requests[2].finish();await tick();assert.equal(h.cache.has('a'),false);assert.equal(h.cache.has('b'),true);assert.equal(h.cache.has('c'),true);
 h.cache.prefetch(['a','b','c']);await tick();assert.equal(h.requests.length,3);h.cache.prefetch([]);
});
test('rapid replay yields a background slot instead of blocking new playback behind two preloads',async()=>{
 const h=harness(),controller=new AbortController();h.cache.prefetch(['a','b','c']);await tick();const second=h.cache.load('b',controller.signal);await tick();controller.abort();await assert.rejects(second,{name:'AbortError'});
 const urgent=h.cache.load('c');await tick();assert.equal(h.requests[1].signal.aborted,true);assert.equal(h.requests[2].text,'c');h.requests[0].finish();h.requests[2].finish();await urgent;await tick();assert.equal(h.requests[3].text,'b');h.requests[3].finish();await tick();h.cache.prefetch([]);
});
test('next word follows meaning rotation and includes all of that word’s examples without changing progress',()=>{
 const state=initial();state.plan.count=3;begin(state,'2026-11-01');const q=state.session,current=q.current.wordId,next=q.queue.find(t=>t.wordId!==current),before=JSON.stringify(state);
 assert.ok(next);const plan=learningAudioLookahead(state),word=wordMap[next.wordId];assert.ok(plan.includes(spokenWord(word)));for(const entry of wordEntries(word))for(const ex of entry.examples)assert.ok(plan.includes(ex.en));
 assert.equal(new Set(plan).size,plan.length);assert.equal(JSON.stringify(state),before);
 const third=q.queue.find(t=>t.wordId!==current&&t.wordId!==next.wordId);assert.ok(third);assert.ok(!plan.includes(spokenWord(wordMap[third.wordId])));
 state.knownWords[next.wordId]=true;const revised=learningAudioLookahead(state);assert.ok(revised.includes(spokenWord(wordMap[third.wordId])));assert.ok(!revised.includes(spokenWord(word)));
 q.stage='done';assert.deepEqual(learningAudioLookahead(state),[]);
});
