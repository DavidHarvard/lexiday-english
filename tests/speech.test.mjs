import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpeechController,speechChunks} from '../dist/speech.js';
import {prepareSpeechRequest,generateSpeech,SPEECH_MODEL} from '../server/speech.js';
import worker from '../server/worker.js';
import {database} from '../server/local-db.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(voices=[{lang:'zh-CN',localService:true}],loader=async()=>new Blob(['audio'])){
 const players=[],utterances=[],errors=[],loads=[],timers=new Map(),listeners=new Map();let id=0,cancels=0;
 const synthesis={getVoices:()=>voices,cancel(){cancels++;},speak(u){utterances.push(u);},addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);}};
 const speech=createSpeechController({getSynthesis:()=>synthesis,makeUtterance:text=>({text}),loadAudio:(text,signal)=>{loads.push(text);return loader(text,signal);},makeAudio:()=>{const p={pause(){this.paused=true;},async play(){this.played=true;}};players.push(p);return p;},createAudioUrl:()=> 'blob:test',revokeAudioUrl:()=>{},onError:e=>errors.push(e),setTimer:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimer:id=>timers.delete(id)});
 return {speech,players,utterances,errors,loads,timers,listeners,synthesis,get cancels(){return cancels;}};
}
test('Chinese-only devices play server word and example audio, completing only after both ended',async()=>{
 const h=harness();let completed=0;h.speech.play(['residential','This is a residential area.'],()=>completed++);await tick();assert.deepEqual(h.loads,['residential']);assert.equal(h.utterances.length,0);assert.equal(completed,0);
 h.players[0].onplaying();h.players[0].onended();await tick();assert.deepEqual(h.loads,['residential','This is a residential area.']);assert.equal(completed,0);h.players[1].onplaying();h.players[1].onended();assert.equal(completed,1);assert.deepEqual(h.errors,[]);h.speech.stop();
});
test('voice discovery waits for local English; interruption and silent stalls recover to MP3',async()=>{
 const voices=[],h=harness(voices);h.speech.play('word');assert.equal(h.loads.length,0);voices.push({lang:'en-GB',localService:true});h.listeners.get('voiceschanged')();assert.equal(h.utterances.length,1);
 const stale=h.utterances[0];stale.onerror({error:'interrupted'});await tick();assert.equal(h.loads[0],'word');stale.onend();assert.equal(h.players.length,1);h.speech.stop();
 const stalled=harness([{lang:'en-US',localService:true}]);stalled.speech.play('sentence');const watchdog=[...stalled.timers.values()].find(t=>t.ms===5000);watchdog.fn();await tick();assert.deepEqual(stalled.loads,['sentence']);stalled.speech.stop();
});
test('navigation aborts pending audio and ignores old ended callbacks; autoplay rejection never completes',async()=>{
 let resolve;const h=harness(undefined,()=>new Promise(r=>resolve=r));let completed=0;h.speech.play('old',()=>completed++);h.speech.stop();resolve(new Blob(['old']));await tick();assert.equal(h.players.length,0);assert.equal(completed,0);
 const playing=harness();playing.speech.play('one',()=>completed++);await tick();playing.players[0].onplaying();const oldEnd=playing.players[0].onended;playing.speech.play('two');oldEnd();await tick();assert.equal(completed,0);assert.equal(playing.players[0].paused,true);playing.speech.stop();
 const denied=harness();denied.speech.play('blocked',()=>completed++);await tick();denied.players[0].onerror();assert.equal(completed,0);assert.deepEqual(denied.errors,['audio-unavailable']);
});
test('missing voices time out into server audio and audio errors remain visible',async()=>{
 const h=harness([],async()=>{throw Error('offline');});h.speech.play('hello');[...h.timers.values()].find(t=>t.ms===700).fn();await tick();assert.deepEqual(h.loads,['hello']);assert.deepEqual(h.errors,['audio-unavailable']);
});
test('long readings split at word boundaries below the server limit',()=>{
 const text='This is a complete sentence. '.repeat(150),chunks=speechChunks(text);assert.ok(chunks.length>1);assert.ok(chunks.every(c=>c.length<=380));assert.equal(chunks.join(' '),text.trim());
});
const mp3=new Uint8Array(160);mp3.set([0x49,0x44,0x33]);
test('speech service validates input and accepts supported MP3 output forms',async()=>{
 assert.equal(prepareSpeechRequest({text:'  residential \n area '}),'residential area');assert.throws(()=>prepareSpeechRequest({text:'x'.repeat(401)}));assert.throws(()=>prepareSpeechRequest({text:''}));
 for(const result of [{audio:Buffer.from(mp3).toString('base64')},new Response(mp3),mp3])assert.deepEqual(await generateSpeech({run:async(model,input)=>{assert.equal(model,SPEECH_MODEL);assert.equal(input.lang,'en');return result;}},'hello'),{bytes:mp3,contentType:'audio/mpeg'});
 const wav=new Uint8Array(160);wav.set(new TextEncoder().encode('RIFF1234WAVE'));assert.equal((await generateSpeech({run:async()=>({audio:Buffer.from(wav).toString('base64')})},'hello')).contentType,'audio/wav');
 await assert.rejects(()=>generateSpeech({run:async()=>({audio:btoa('<html>'+'x'.repeat(200))})},'hello'));
});
test('speech endpoint returns MP3, caches repeats and rejects foreign origins and oversized input',async()=>{
 const db=database(),oldCache=globalThis.caches,memory=new Map();let calls=0;
 globalThis.caches={default:{match:async key=>memory.get(key.url)?.clone(),put:async(key,response)=>memory.set(key.url,response)}};
 const env={DB:db,AI:{run:async()=>{calls++;return {audio:Buffer.from(mp3).toString('base64')};}}};
 const request=(text,origin='https://lexiday.test')=>new Request('https://lexiday.test/api/speech',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({text})});
 try{const r=await worker.fetch(request('residential'),env);assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'audio/mpeg');assert.deepEqual(new Uint8Array(await r.arrayBuffer()),mp3);
  assert.equal((await worker.fetch(request('residential'),env)).status,200);assert.equal(calls,1);
  assert.equal((await worker.fetch(request('other','https://evil.test'),env)).status,403);assert.equal((await worker.fetch(request('x'.repeat(401)),env)).status,400);assert.equal(calls,1);
  assert.equal((await worker.fetch(request('not cached'),{DB:db})).status,503);
 }finally{globalThis.caches=oldCache;db.close();}
});
