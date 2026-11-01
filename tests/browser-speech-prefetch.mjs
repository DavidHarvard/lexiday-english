import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {initial,begin,localDay} from '../dist/engine.js';
import {wordMap} from '../dist/data.js';
import {wordEntries,spokenWord} from '../dist/word-content.js';
const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.LEXIDAY_TEST_URL||'http://127.0.0.1:4198',realAudio=process.env.LEXIDAY_REAL_AUDIO==='1';
const state=initial();state.plan.count=3;begin(state,localDay());const next=state.session.queue.find(t=>t.wordId!==state.session.current.wordId),word=wordMap[next.wordId];
const expected=[...new Set([spokenWord(word),...wordEntries(word).flatMap(e=>e.examples.map(x=>x.en)),...word.senses.flatMap(s=>(s.examples||[]).map(x=>x.en))])];
// Short audible PCM fixture: browser playback remains real, while a deliberate
// network delay makes cache hits distinguishable from a fresh download.
const sampleRate=16000,samples=2400,wav=Buffer.alloc(44+samples*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)wav.writeInt16LE(Math.round(Math.sin(i/sampleRate*440*2*Math.PI)*3000),44+i*2);
const browser=await chromium.launch({headless:true,executablePath:process.env.LEXIDAY_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',proxy:process.env.LEXIDAY_BROWSER_PROXY?{server:process.env.LEXIDAY_BROWSER_PROXY}:undefined});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},timezoneId:'Asia/Shanghai'});
 await context.addInitScript(state=>{localStorage.setItem('lexiday.v1',JSON.stringify(state));window.__playing=[];window.__ended=[];const NativeAudio=Audio;window.Audio=function(...args){const audio=new NativeAudio(...args);audio.addEventListener('playing',()=>window.__playing.push(performance.now()));audio.addEventListener('ended',()=>window.__ended.push(performance.now()));return audio;};window.Audio.prototype=NativeAudio.prototype;Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'zh-CN',localService:true}],cancel(){}}});},state);
 const page=await context.newPage(),requests=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(realAudio)page.on('request',r=>{if(new URL(r.url()).pathname==='/api/speech')requests.push(JSON.parse(r.postData()).text);});
 else await page.route('**/api/speech',async route=>{requests.push(JSON.parse(route.request().postData()).text);await new Promise(resolve=>setTimeout(resolve,600));try{await route.fulfill({status:200,contentType:'audio/wav',body:wav});}catch{}});
 await page.goto(base+'/#today');await page.locator('[data-action="start"]').first().click();await page.waitForFunction(()=>window.__ended.length===1);
 await page.evaluate(async()=>{window.__cache=(await import('/speech-cache.js')).speechAudioCache;});
 await page.waitForFunction(texts=>texts.every(text=>window.__cache.has(text)),expected,{timeout:90000});
 assert.equal(await page.evaluate(()=>window.__playing.length),1,'preloading must stay silent');assert.ok(expected.every(text=>requests.filter(x=>x===text).length===1));
 const untouched=await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiday.v1')));assert.equal(Object.keys(untouched.records).length,0);assert.ok(Object.values(untouched.session.states).every(s=>!s.passed));
 const counts=Object.fromEntries(expected.map(text=>[text,requests.filter(x=>x===text).length]));await page.evaluate(()=>window.__nextClick=performance.now());await page.locator('[data-action="exclude-known"]').click();await page.waitForFunction(()=>window.__playing.length>=2);
 assert.equal(await page.locator('.bare-word').innerText(),word.word);const latency=await page.evaluate(()=>window.__playing[1]-window.__nextClick);assert.ok(latency<500,'cached playback should beat the simulated 600 ms network request: '+latency);
 await page.locator('[data-action="bare-no"]').click();await page.waitForFunction(()=>window.__ended.length>=3);for(const text of expected)assert.equal(requests.filter(x=>x===text).length,counts[text],'do not download prefetched next-word audio again');
 await page.locator('nav a[href="#report"]').click();await page.waitForTimeout(750);const stopped=requests.length;await page.waitForTimeout(1000);assert.equal(requests.length,stopped,'leaving learning stops background requests');assert.deepEqual(errors,[]);
 mkdirSync('outputs/speech-prefetch',{recursive:true});writeFileSync('outputs/speech-prefetch/browser.json',JSON.stringify({nextWord:word.word,preloaded:expected.length,cachedPlaybackMs:latency,realAudio,networkDelayMs:realAudio?null:600,silentPrefetch:true,noDuplicateRequests:true,stopsOnNavigation:true,errors},null,2));
 console.log(JSON.stringify({nextWord:word.word,preloaded:expected.length,cachedPlaybackMs:Math.round(latency),realAudio,networkDelayMs:realAudio?null:600,silentPrefetch:true,noDuplicateRequests:true,stopsOnNavigation:true}));
}finally{await browser.close();}
