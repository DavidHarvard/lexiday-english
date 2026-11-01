import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.LEXIDAY_TEST_URL;
if(!base)throw Error('Set LEXIDAY_TEST_URL to the verified deployment');
const browser=await chromium.launch({headless:true,executablePath:process.env.LEXIDAY_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',proxy:process.env.LEXIDAY_BROWSER_PROXY?{server:process.env.LEXIDAY_BROWSER_PROXY}:undefined});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},timezoneId:'Asia/Shanghai'});
 await context.addInitScript(()=>{window.__audioEvents=[];window.__audioPlayers=[];const NativeAudio=window.Audio;window.Audio=function(...args){const player=new NativeAudio(...args),index=window.__audioPlayers.length;window.__audioPlayers.push(player);for(const name of ['playing','ended','error'])player.addEventListener(name,()=>window.__audioEvents.push({index,name,currentTime:player.currentTime,duration:player.duration,muted:player.muted,volume:player.volume}));return player;};window.Audio.prototype=NativeAudio.prototype;});
 const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>{if(new URL(r.url()).pathname==='/api/speech')requests.push(JSON.parse(r.postData()).text);});
 await page.goto(base+'/#today',{timeout:60000});await page.locator('[data-action="start"]').first().click();
 await page.waitForFunction(()=>window.__audioEvents.filter(e=>e.name==='ended').length===2,null,{timeout:60000});
 const word=await page.locator('.bare-word').innerText();assert.notEqual(requests[0],word);assert.ok(requests.includes('What does '+word+' mean in this sentence?'));
 await page.locator('[data-action="bare-no"]').click();const example=await page.locator('.example-sentence').innerText();
 await page.waitForFunction(()=>window.__audioEvents.filter(e=>e.name==='ended').length>=4,null,{timeout:60000});assert.ok(requests.includes(example));
 await page.locator('[data-action="speak"]').first().click();await page.waitForFunction(()=>window.__audioEvents.filter(e=>e.name==='ended').length>=5,null,{timeout:60000});
 assert.equal(requests.filter(text=>text===example).length,1,'manual replay should reuse the cached audio');
 // Verify actual audio output has a decodable, non-silent English waveform.
 const sample=await context.request.post(base+'/api/speech',{headers:{Origin:base},data:{text:'The apartment is fully furnished.'},timeout:45000});assert.equal(sample.status(),200);assert.match(sample.headers()['content-type'],/^audio\/(mpeg|wav|ogg)/);const bytes=await sample.body();
 const decoded=await page.evaluate(async encoded=>{const data=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));const audioContext=new AudioContext(),buffer=await audioContext.decodeAudioData(data.buffer),samples=buffer.getChannelData(0);let peak=0,energy=0;for(const s of samples){peak=Math.max(peak,Math.abs(s));energy+=s*s;}await audioContext.close();return {duration:buffer.duration,sampleRate:buffer.sampleRate,peak,rms:Math.sqrt(energy/samples.length)};},bytes.toString('base64'));
 assert.ok(decoded.duration>1);assert.ok(decoded.peak>.01);assert.ok(decoded.rms>.001);
 await page.locator('[data-action="sense-yes"]').click();await page.locator('[data-action="continue"]').click();assert.ok(await page.locator('#meaning-submit').isDisabled());await page.locator('#meaning-submit:not([disabled])').waitFor({timeout:60000});
 const events=await page.evaluate(()=>window.__audioEvents);assert.ok(events.filter(e=>e.name==='ended').every(e=>e.currentTime>0&&!e.muted&&e.volume===1));assert.deepEqual(errors,[]);
 const voices=await page.evaluate(()=>speechSynthesis.getVoices().map(v=>({name:v.name,lang:v.lang,local:v.localService})));
 fs.mkdirSync('outputs/speech-fix',{recursive:true});fs.writeFileSync('outputs/speech-fix/real-audio-verification.json',JSON.stringify({base,voices,requests,events,decoded,bytes:bytes.length,errors},null,2));fs.writeFileSync('outputs/speech-fix/example.'+(sample.headers()['content-type'].includes('wav')?'wav':'mp3'),bytes);
 console.log(JSON.stringify({realAudioPlayback:true,completed:events.filter(e=>e.name==='ended').length,requests,decoded,errors},null,2));
}finally{await browser.close();}
