import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initial,begin,dayLog,localDay,validateState} from '../dist/engine.js';
import {wordMap} from '../dist/data.js';
import {fallbackPractice,quizFromPractice} from '../dist/listening-practice.js';
import {createArticle} from '../dist/content.js';
import {speechAssets} from '../dist/speech-assets.js';
const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.LEXIDAY_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const base=process.env.LEXIDAY_TEST_URL||'http://127.0.0.1:4205',day=localDay(),errors=[],requests=[],out='outputs/word-updates';fs.mkdirSync(out,{recursive:true});
const wave=fs.readFileSync('dist'+Object.values(speechAssets)[0]);
function fixture(){const s=initial();s.plan.count=2;begin(s,day);const l=dayLog(s,day),targets=['furnished','residential'].map(wordId=>({wordId,senseId:wordMap[wordId].senses[0].id}));for(const t of targets)s.records[t.senseId]={wordId:t.wordId,level:1,due:'2099-01-01',audioVerified:true};l.newWords=targets.map(t=>t.wordId);l.touched=[...l.newWords];l.passed=targets.map(t=>t.senseId);l.article=createArticle(l.touched,l.passed);l.practicePack=fallbackPractice(s,targets);l.quiz=quizFromPractice(l.practicePack,s,l);s.session.stage='done';s.session.current=null;s.session.queue=[];return validateState(s);}
async function setup(width=1280,offline=false){const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Shanghai',serviceWorkers:offline?'allow':'block'});const state=fixture();await context.addInitScript(state=>{
 if(!localStorage.getItem('lexiday.v1'))localStorage.setItem('lexiday.v1',JSON.stringify(state));
 window.__players=[];window.__auto=false;
 Object.defineProperty(window,'Audio',{value:class{constructor(){window.__players.push(this);}async play(){setTimeout(()=>{this.onplaying?.();if(window.__auto)setTimeout(()=>this.onended?.(),30);},0);}pause(){}load(){}removeAttribute(){}}});
 Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'zh-CN',localService:true}],cancel(){}}});
 },state);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));if(!offline)await page.route('**/api/speech',async r=>{requests.push(r.request().postDataJSON().text);await r.fulfill({body:wave,contentType:'audio/wav'});});return {context,page,state};}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lexiday.v1')));
const quiz=async page=>(await saved(page)).days[day].quiz;
try{
 const f=await setup(),p=f.page;await p.goto(base+'/#quiz');await p.waitForFunction(()=>window.__players.length>0);assert.equal(await p.locator('[data-action="option"]').count(),0);assert.equal(await p.locator('[data-action="quiz-question"]').count(),0);
 const third=f.state.days[day].quiz.questions[2].spokenPrompt;for(let n=0;n<200&&!requests.includes(third);n++)await p.waitForTimeout(50);assert.ok(requests.includes(third),'later question loaded while first clip still playing');
 await p.locator('[data-action="quiz-show"]').click();assert.equal(await p.locator('.quiz-question').count(),3);assert.equal(await p.locator('[data-action="option"]:enabled').count(),12);assert.ok(!/[\u3400-\u9fff]/.test(await p.locator('.quiz-question-list').innerText()));
 let q=await quiz(p);await p.locator('[data-action="quiz-question"]').first().click();await p.waitForFunction(()=>window.__players.length>=2);
 await p.locator('[data-action="option"][data-question="0"][data-index="0"]').click();await p.reload();await p.locator('[data-action="option"][data-question="0"][aria-pressed="true"]').waitFor();assert.equal((await quiz(p)).choices[0],0);
 q=await quiz(p);for(let i=0;i<3;i++){const choice=q.questions[i].options.indexOf(q.questions[i].meaning);await p.locator(`[data-action="option"][data-question="${i}"][data-index="${i===2?(choice+1)%4:choice}"]`).click();}
 await p.locator('[data-action="quiz-submit"]').click();await p.locator('.quiz-transcript').waitFor();q=await quiz(p);assert.equal(q.answers.length,3);assert.deepEqual(q.answers.map(a=>a.correct),[true,true,false]);assert.ok(q.answers.every(a=>!a.assisted));assert.equal(q.submitted,true);
 await p.screenshot({path:out+'/quiz-desktop.png',fullPage:true});await p.locator('[data-action="quiz-next"]').click();assert.equal((await quiz(p)).index,3);await p.waitForFunction(()=>window.__players.at(-1)?.onerror);await p.evaluate(()=>window.__players.at(-1).onerror());await p.locator('[data-action="option"]:enabled').first().waitFor();assert.match(await p.locator('#quiz-audio-status').innerText(),/仍可/);
 for(let i=3;i<6;i++)await p.locator(`[data-action="option"][data-question="${i}"][data-index="0"]`).click();await p.locator('[data-action="quiz-submit"]').click();assert.equal((await quiz(p)).answers.length,6);await p.locator('[data-action="quiz-next"]').click();await p.locator('.score').waitFor();
 await p.locator('nav a[href="#today"]').click();await p.locator('[data-action="learn-more"]').click();assert.notEqual((await saved(p)).session.stage,'done');assert.equal((await saved(p)).plan.count,2);assert.ok((await saved(p)).days[day].newWords.includes('furnished'));await f.context.close();
 const mobile=await setup(390);await mobile.page.goto(base+'/#quiz');await mobile.page.waitForFunction(()=>window.__players.at(-1)?.onended);await mobile.page.evaluate(()=>{window.__auto=true;window.__players.at(-1).onplaying();window.__players.at(-1).onended();});await mobile.page.locator('.quiz-question').first().waitFor();assert.equal((await quiz(mobile.page)).played,true);assert.equal(await mobile.page.locator('[data-action="option"]:enabled').count(),12);await mobile.page.screenshot({path:out+'/quiz-mobile.png',fullPage:true});assert.equal(await mobile.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await mobile.context.close();
 // Cache Storage survives a new module instance and a full offline reload.
 const o=await setup(1000,true),op=o.page;await op.goto(base+'/#reading');await op.evaluate(async()=>{await navigator.serviceWorker.ready;});await op.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const cacheResult=await op.evaluate(async({asset,passage})=>{const {createSpeechAudioCache}=await import('/speech-cache.js');const first=createSpeechAudioCache();const blob=await first.load(asset);const {readingDictionary}=await import('/reading-dictionary.js');const cover=await readingDictionary.prepare(passage,{});await readingDictionary.lookup('kingfisher');return {bytes:blob.size,missing:cover.missing};},{asset:Object.keys(speechAssets)[0],passage:o.state.days[day].article});assert.ok(cacheResult.bytes>1000);assert.deepEqual(cacheResult.missing,[]);
 await o.context.setOffline(true);await op.reload();await op.locator('.article-body').waitFor();const offline=await op.evaluate(async text=>{const {createSpeechAudioCache}=await import('/speech-cache.js');const cache=createSpeechAudioCache();return (await cache.load(text)).size;},Object.keys(speechAssets)[0]);assert.equal(offline,cacheResult.bytes);
 const dictionary=await op.evaluate(async()=>{const {readingDictionary}=await import('/reading-dictionary.js');return (await readingDictionary.lookup('kingfisher')).record[1];});assert.match(dictionary,/翠鸟/);await o.context.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({groupedQuestions:true,englishChoices:true,preloadedLaterQuestion:true,answersDuringFailure:true,reloadDrafts:true,transcriptReplay:true,additionalBatch:true,mobile:true,offlineReload:true,persistentAudioBytes:offline}));
}finally{await browser.close();}



