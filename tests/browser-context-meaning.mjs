import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {initial,begin,localDay,activeExample,audioQuestion} from '../dist/engine.js';
import {wordMap} from '../dist/data.js';
const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.LEXIDAY_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',proxy:process.env.LEXIDAY_BROWSER_PROXY?{server:process.env.LEXIDAY_BROWSER_PROXY}:undefined});
const base=process.env.LEXIDAY_TEST_URL||'http://127.0.0.1:4202',errors=[];
mkdirSync('outputs/context-meaning',{recursive:true});
function stateFor(id,stage='review'){
 const state=initial();state.plan.count=1;const sense=wordMap[id].senses[0];state.records[sense.id]={wordId:id,level:2,interval:8,due:localDay(),audioVerified:true};begin(state,localDay());
 if(stage==='listen'){state.session.types[id]='new';state.session.stage='listen';state.session.listenCue='context';}if(stage==='detail')state.session.stage='detail';return state;
}
async function fixture(state,{auto=true,width=1280}={}){
 const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Shanghai'});
 await context.addInitScript(({state,auto})=>{if(!localStorage.getItem('lexiday.v1'))localStorage.setItem('lexiday.v1',JSON.stringify(state));window.__spoken=[];window.__auto=auto;Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'en-US',localService:true}],cancel(){},speak(u){window.__spoken.push(u.text);window.__utterance=u;if(window.__auto)setTimeout(()=>u.onend?.(),20);}}});},{state,auto});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));return {context,page};
}
async function open(state,opts){const f=await fixture(state,opts);await f.page.goto(base+'/#learn');return f;}
async function ready(page){await page.locator('#meaning-submit:not([disabled])').waitFor();}
async function saved(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('lexiday.v1')));}
try{
 // Two spoken parts, no visible answer clues, and no pass until both have ended.
 const state=stateFor('deposit','listen'),f=await open(state,{auto:false});
 await f.page.waitForFunction(()=>window.__spoken.length===1);assert.equal((await f.page.evaluate(()=>window.__spoken))[0],activeExample(state).en);assert.ok(await f.page.locator('#meaning-submit').isDisabled());
 await f.page.evaluate(()=>window.__utterance.onend());await f.page.waitForFunction(()=>window.__spoken.length===2);assert.equal((await f.page.evaluate(()=>window.__spoken))[1],audioQuestion(wordMap.deposit));assert.ok(await f.page.locator('#meaning-submit').isDisabled());
 assert.equal(await f.page.locator('[data-action="listen-cue"]').count(),0);assert.ok(!/deposit|押金|存款/i.test(await f.page.locator('#main').innerText()));
 await f.page.evaluate(()=>window.__utterance.onend());await ready(f.page);await f.page.locator('#meaning-answer').fill('存款');await f.page.locator('#meaning-submit').click();await f.page.getByRole('heading',{name:'这次还没有答对'}).waitFor();assert.equal((await saved(f.page)).session.states['deposit-n-1'].known,0);await f.context.close();

 // A common synonym requires no server call.
 const synonym=await open(stateFor('furnished','listen'));let requests=0;await synonym.page.route('**/api/meaning-check',route=>{requests++;return route.abort();});await ready(synonym.page);await synonym.page.locator('#meaning-answer').fill('带家具的');await synonym.page.locator('#meaning-submit').click();await synonym.page.getByRole('heading',{name:'本轮输入正确'}).waitFor();assert.equal(requests,0);await synonym.context.close();

 // Network uncertainty does not count as an error; abandoning goes directly to details.
 const uncertain=await fixture(stateFor('furnished','listen'));await uncertain.page.route('**/api/meaning-check',route=>route.fulfill({json:{...route.request().postDataJSON(),verdict:'uncertain'}}));await uncertain.page.goto(base+'/#learn');await ready(uncertain.page);await uncertain.page.locator('#meaning-answer').fill('屋里已经有现成的家具');await uncertain.page.locator('#meaning-submit').click();await uncertain.page.getByText(/暂时无法确认这种表述，未计错/).waitFor();assert.equal((await saved(uncertain.page)).session.stage,'listen');assert.equal((await saved(uncertain.page)).session.states['furnished-adj-1'].strong,false);await uncertain.page.locator('[data-action="give-up"]').click();await uncertain.page.locator('.detail-card').waitFor();assert.equal((await saved(uncertain.page)).session.gaveUp,true);assert.equal((await saved(uncertain.page)).session.states['furnished-adj-1'].passed,false);await uncertain.context.close();

 // An answer returned after typing, giving up or leaving cannot overwrite progress.
 for(const change of ['typing','give-up','navigation']){
  const f=await fixture(stateFor('furnished','listen'));let release,started;const pending=new Promise(r=>started=r),wait=new Promise(r=>release=r);
  await f.page.route('**/api/meaning-check',async route=>{started();await wait;try{await route.fulfill({json:{...route.request().postDataJSON(),verdict:'correct'}});}catch{}});
  await f.page.goto(base+'/#learn');await ready(f.page);await f.page.locator('#meaning-answer').fill('屋里已经有现成的家具');await f.page.locator('#meaning-submit').click();await pending;
  if(change==='typing')await f.page.locator('#meaning-answer').fill('改成其他表述');else if(change==='give-up')await f.page.locator('[data-action="give-up"]').click();else await f.page.locator('nav a[href="#report"]').click();
  release();await f.page.waitForTimeout(150);const s=await saved(f.page);assert.equal(s.session.states['furnished-adj-1'].known,0);assert.equal(s.session.states['furnished-adj-1'].passed,false);if(change==='typing')assert.equal(s.session.listenDraft,'改成其他表述');await f.context.close();
 }

 const semantic=await fixture(stateFor('furnished','listen'));if(process.env.LEXIDAY_REAL_MEANING!=='1')await semantic.page.route('**/api/meaning-check',route=>route.fulfill({json:{...route.request().postDataJSON(),verdict:'correct'}}));await semantic.page.goto(base+'/#learn');await ready(semantic.page);await semantic.page.locator('#meaning-answer').fill('屋里已经有现成的家具');await semantic.page.locator('#meaning-submit').click();await semantic.page.getByRole('heading',{name:'本轮输入正确'}).waitFor();await semantic.context.close();
 for(const width of [1280,390]){
  const detail=stateFor('lease','detail'),layout=await open(detail,{width,auto:false});await layout.page.locator('.word-notes').waitFor();assert.ok(!/区别对比|拼写对比/.test(await layout.page.locator('.word-notes').innerText()));
  await layout.page.waitForFunction(()=>window.__spoken.length===1);await layout.page.evaluate(()=>window.__utterance.onend());assert.deepEqual(await layout.page.evaluate(()=>window.__spoken),[activeExample(detail).en],'meaning details read only the example, without a question');
  const group=layout.page.locator('[data-note-group="形近词"]');assert.deepEqual(await group.locator('[data-note-word]').evaluateAll(nodes=>nodes.map(n=>n.dataset.noteWord)),['cease','tease']);
  const cease=await group.locator('[data-note-word="cease"]').boundingBox(),tease=await group.locator('[data-note-word="tease"]').boundingBox();assert.equal(Math.round(cease.x),Math.round(tease.x));assert.ok(tease.y>=cease.y+cease.height);
  assert.equal(await layout.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await layout.page.locator('.word-notes').screenshot({path:`outputs/context-meaning/lease-notes-${width}.png`});await layout.context.close();
 }
 // The same give-up control exists on both review levels.
 const review=await open(stateFor('lease'));await ready(review.page);await review.page.locator('[data-action="review-no"]').click();await review.page.locator('.example-sentence').waitFor();await review.page.locator('[data-action="give-up"]').click();await review.page.locator('.detail-card').waitFor();assert.equal((await saved(review.page)).session.reviewGrade,0);await review.context.close();
 assert.deepEqual(errors,[]);console.log('Context browser checks passed: sentence + spoken question gate, local and semantic paraphrases, uncertain and stale responses, give-up, category stacking and mobile layout.');
}finally{await browser.close();}
