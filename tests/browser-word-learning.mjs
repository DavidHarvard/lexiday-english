import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {initial,begin,localDay} from '../dist/engine.js';
const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.LEXIDAY_CHROME_PATH?{executablePath:process.env.LEXIDAY_CHROME_PATH}:{})});
const base=process.env.LEXIDAY_TEST_URL||'http://127.0.0.1:4192';
await mkdir('outputs/word-learning',{recursive:true});
const pageErrors=[];
async function contextFor(state,viewport={width:1280,height:900}){
 const context=await browser.newContext({viewport,timezoneId:'Asia/Shanghai'});
 await context.addInitScript(({state})=>{
  if(!localStorage.getItem('lexiday.v1'))localStorage.setItem('lexiday.v1',JSON.stringify(state));
  window.__speechLog=[];window.__speechAutoEnd=true;
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'en-US',name:'Test voice'}],cancel(){},speak(utterance){window.__speechLast=utterance;window.__speechLog.push(utterance.text);if(window.__speechAutoEnd)setTimeout(()=>utterance.onend?.(),30);}}});
 },{state});
 const page=await context.newPage();page.on('pageerror',error=>pageErrors.push(error.message));
 return {context,page};
}
async function speechIncludes(page,text){await page.waitForFunction(value=>window.__speechLog.some(spoken=>spoken===value),text);}
async function finishVisual(page){
 if(await page.locator('[data-action="bare-no"]').count())await page.locator('[data-action="bare-no"]').click();
 await page.locator('[data-action="sense-yes"]').click();
 await page.locator('[data-action="continue"]').click();
 await page.locator('#meaning-submit:not([disabled])').waitFor();
}
try{
 const state=initial();state.plan.count=1;const {context,page}=await contextFor(state);
 await page.goto(base+'/#today');await page.locator('[data-action="start"]').first().click();
 await speechIncludes(page,'light');assert.equal(await page.locator('.bare-word').innerText(),'light');
 await page.locator('[data-action="bare-no"]').click();const first=await page.locator('.example-sentence').innerText();await speechIncludes(page,first);
 await page.locator('[data-action="sense-yes"]').click();await page.locator('.detail-card').waitFor();
 await page.locator('[data-action="continue"]').click();await page.locator('#meaning-submit:not([disabled])').waitFor();
 assert.equal(await page.locator('.options').count(),0);assert.equal(await page.locator('.bare-word,.sentence-word,.example-sentence').count(),0);
 assert.ok(!/\blight\b/i.test(await page.locator('#main').innerText()));
 await page.locator('#meaning-answer').fill('光线');await page.reload();await page.locator('#meaning-submit:not([disabled])').waitFor();assert.equal(await page.locator('#meaning-answer').inputValue(),'光线');
 await page.evaluate(()=>window.__speechAutoEnd=false);await page.locator('[data-action="listen-play"]').click();
 assert.ok(await page.locator('#meaning-submit').isDisabled());await page.evaluate(()=>window.__speechLast.onerror({error:'not-allowed'}));
 assert.ok(await page.locator('#meaning-submit').isDisabled());assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiday.v1')).session.listenPlayed),false);
 await page.evaluate(()=>window.__speechAutoEnd=true);await page.locator('[data-action="listen-play"]').click();await page.locator('#meaning-submit:not([disabled])').waitFor();
 await page.locator('#meaning-answer').fill('汽车');await page.locator('#meaning-submit').click();await page.getByRole('heading',{name:'这次还没有答对'}).waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiday.v1')).session.states['light-n'].passed),false);
 await page.locator('[data-action="continue"]').click();await page.locator('#rest-button:not([disabled])').waitFor({timeout:12000});await page.locator('#rest-button').click();
 await finishVisual(page);await page.locator('#meaning-answer').fill('轻的');await page.locator('#meaning-submit').click();
 await page.locator('[data-action="continue"]').click();await page.locator('#rest-button:not([disabled])').waitFor({timeout:12000});await page.locator('#rest-button').click();
 const second=await page.locator('.example-sentence').innerText();assert.notEqual(second,first);await speechIncludes(page,second);
 await page.screenshot({path:'outputs/word-learning/retry-example.png',fullPage:true});
 await page.locator('[data-action="exclude-known"]').click();
 assert.equal(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('lexiday.v1')).knownWords.light),true);
 await context.close();

 const detail=initial();detail.course='ielts-basic';detail.plan.count=100;begin(detail,localDay());
 const q=detail.session,task=[q.current,...q.queue].find(t=>t.wordId==='residential');assert.ok(task);
 q.current=task;q.queue=q.queue.filter(t=>t!==task);q.stage='detail';q.bareDone.residential=true;
 const mobile=await contextFor(detail,{width:390,height:844});await mobile.page.goto(base+'/#learn');
 await mobile.page.locator('.word-notes').waitFor();assert.equal(await mobile.page.locator('[data-note-word="resident"]').count(),1);
 assert.ok(await mobile.page.locator('[data-note-word="resident"] .meaning-row').count()>=2);
 assert.ok(await mobile.page.locator('[data-note-word="resident"] [data-action="speak"]').count()>=3);
 const overflow=await mobile.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
 await mobile.page.screenshot({path:'outputs/word-learning/residential-notes-mobile.png',fullPage:true});
 await mobile.page.locator('[data-note-word="resident"]').screenshot({path:'outputs/word-learning/resident-note.png'});
 await mobile.context.close();
 const due=initial();due.plan.count=1;due.records['bright-adj']={wordId:'bright',level:2,due:localDay(),audioVerified:true};begin(due,localDay());
 const review=await contextFor(due);await review.page.goto(base+'/#learn');await review.page.locator('#meaning-submit:not([disabled])').waitFor();
 await speechIncludes(review.page,'bright');assert.equal(await review.page.locator('.options').count(),0);
 await review.page.locator('#meaning-answer').fill('明亮');await review.page.locator('#meaning-submit').click();await review.page.locator('.detail-card').waitFor();
 assert.equal(await review.page.evaluate(()=>JSON.parse(localStorage.getItem('lexiday.v1')).session.reviewGrade),4);
 await review.context.close();assert.deepEqual(pageErrors,[]);
 console.log('Browser checks passed: autoplay events, hidden prompts, typed input, reload recovery, retry examples, explicit exclusion, deduplicated notes, mobile layout. Speech output was mocked; device audio was not recorded.');
}finally{await browser.close();}
