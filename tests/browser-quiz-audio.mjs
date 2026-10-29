import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {initial,begin,dayLog,localDay,validateState} from '../dist/engine.js';
import {wordMap} from '../dist/data.js';
const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.LEXIDAY_CHROME_PATH?{executablePath:process.env.LEXIDAY_CHROME_PATH}:{})});
const base=process.env.LEXIDAY_TEST_URL||'http://127.0.0.1:4193';
await mkdir('outputs/quiz-audio',{recursive:true});
const errors=[];
function fixture(){
 const state=initial(),day=localDay();begin(state,day);state.session.stage='done';state.session.current=null;state.session.queue=[];
 const log=dayLog(state,day),questions=['furnished','residential'].map(wordId=>{
  const sense=wordMap[wordId].senses[0],ex=sense.examples[1];log.touched.push(wordId);log.passed.push(sense.id);
  state.records[sense.id]={wordId,level:1,due:day,audioVerified:true};
  return {wordId,senseId:sense.id,en:ex.en,zh:ex.zh,pos:sense.pos,meaning:sense.meaning,options:[sense.meaning,...sense.distractors]};
 });
 log.quiz={questions,index:0,answers:[],revealed:false,played:false,submitted:false,onlyWrong:false};
 return {state:validateState(state),questions};
}
async function open(state){
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai'});
 await context.addInitScript(state=>{
  if(!localStorage.getItem('lexiday.v1'))localStorage.setItem('lexiday.v1',JSON.stringify(state));
  window.__speechLog=[];window.__utterances=[];window.__cancelCount=0;
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'en-US',name:'Test'}],cancel(){window.__cancelCount++;},speak(utterance){window.__speechLog.push(utterance.text);window.__utterances.push(utterance);}}});
 },state);
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(base+'/#quiz');
 try{await page.locator('.quiz-card').waitFor();}catch(error){console.error({errors,text:await page.locator('body').innerText()});throw error;}return {context,page};
}
const finish=page=>page.evaluate(()=>window.__utterances.at(-1).onend?.());
const spoken=page=>page.evaluate(()=>window.__speechLog);
try{
 const {state,questions}=fixture(),{context,page}=await open(state),[first,second]=questions;
 assert.deepEqual(await spoken(page),[first.en]);
 assert.ok(!/furnished|在句中是什么意思/i.test(await page.locator('#main').innerText()));
 assert.equal(await page.locator('.quiz-transcript').count(),0);assert.ok(await page.locator('[data-action="option"]').first().isDisabled());
 await finish(page);assert.deepEqual(await spoken(page),[first.en,'What does furnished mean in this sentence?']);
 assert.ok(await page.locator('[data-action="option"]').first().isDisabled());
 await finish(page);assert.ok(await page.locator('[data-action="option"]').first().isEnabled());
 await page.evaluate(()=>window.dispatchEvent(new HashChangeEvent('hashchange')));
 assert.equal((await spoken(page)).length,2,'rendering the same question must not restart it');
 await page.locator('[data-action="option"][data-index="0"]').click();
 assert.equal(await page.locator('.quiz-transcript').innerText(),first.en);
 assert.ok((await page.locator('.answer-explanation').innerText()).includes('回答正确'));
 assert.deepEqual(await spoken(page),[first.en,'What does furnished mean in this sentence?',first.en]);
 assert.ok(await page.locator('[data-action="option"]').first().isDisabled());
 await page.locator('[data-action="quiz-next"]').click();
 assert.equal((await spoken(page)).at(-1),second.en);assert.equal(await page.locator('.quiz-transcript').count(),0);
 assert.ok(!/residential/i.test(await page.locator('#main').innerText()));
 await page.evaluate(()=>window.__utterances[0].onend?.());
 assert.equal((await spoken(page)).at(-1),second.en);assert.ok(await page.locator('[data-action="option"]').first().isDisabled());
 await finish(page);assert.equal((await spoken(page)).at(-1),'What does residential mean in this sentence?');
 await finish(page);await page.locator('[data-action="option"][data-index="1"]').click();
 assert.equal(await page.locator('.quiz-transcript').innerText(),second.en);
 assert.ok((await page.locator('.answer-explanation').innerText()).includes('这次再巩固一下'));
 assert.equal((await spoken(page)).at(-1),second.en);
 await page.screenshot({path:'outputs/quiz-audio/answered-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.reload();await page.locator('.quiz-transcript').waitFor();
 assert.deepEqual(await spoken(page),[second.en],'a restored answer replays its original sentence');
 const cancelBefore=await page.evaluate(()=>window.__cancelCount);
 await page.locator('nav a[href="#report"]').click();
 assert.ok(await page.evaluate(()=>window.__cancelCount)>cancelBefore);
 await finish(page);assert.deepEqual(await spoken(page),[second.en]);
 await page.locator('nav a[href="#quiz"]').click();await page.locator('.quiz-transcript').waitFor();
 assert.deepEqual(await spoken(page),[second.en,second.en]);await context.close();

 const retry=await open(fixture().state);
 await retry.page.evaluate(()=>window.__utterances.at(-1).onerror({error:'not-allowed'}));
 assert.ok(await retry.page.locator('[data-action="option"]').first().isDisabled());
 assert.match(await retry.page.locator('#quiz-audio-status').innerText(),/未完成/);
 await retry.page.locator('[data-action="quiz-play"]').click();await finish(retry.page);await finish(retry.page);
 assert.ok(await retry.page.locator('[data-action="option"]').first().isEnabled());
 await retry.page.reload();await retry.page.locator('.quiz-card').waitFor();
 assert.deepEqual(await spoken(retry.page),[first.en]);assert.ok(await retry.page.locator('[data-action="option"]').first().isDisabled());
 await retry.page.locator('[data-action="reveal"]').click();assert.equal(await retry.page.locator('.quiz-transcript').innerText(),first.en);
 await retry.page.locator('[data-action="option"][data-index="0"]').click();assert.equal((await spoken(retry.page)).at(-1),first.en);
 const assisted=await retry.page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('lexiday.v1')).days).at(-1).quiz.answers[0].assisted);
 assert.equal(assisted,true);await retry.context.close();assert.deepEqual(errors,[]);
 console.log('Quiz browser checks passed: automatic sentence and spoken question, hidden target, completion gate, correct/wrong transcript replay, next question, restore, errors, stale callbacks, route cancellation, assisted answers and mobile layout. Speech was mocked.');
}finally{await browser.close();}
