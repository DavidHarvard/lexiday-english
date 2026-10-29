import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {initial,begin,dayLog,localDay} from '../dist/engine.js';
import {wordMap} from '../dist/data.js';
import {readingLibrary} from '../dist/reading-library.js';
import {assembleArticle,readingTargets} from '../dist/reading-model.js';
const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.LEXIDAY_CHROME_PATH?{executablePath:process.env.LEXIDAY_CHROME_PATH}:{})});
const base=process.env.LEXIDAY_TEST_URL||'http://127.0.0.1:4193',errors=[];
await mkdir('outputs/reading-update',{recursive:true});
function fixture(){
 const state=initial(),day=localDay();begin(state,day);state.session.stage='done';state.session.current=null;state.session.queue=[];
 const log=dayLog(state,day);log.touched=['furnished','residential','landlord'];log.passed=log.touched.map(id=>wordMap[id].senses[0].id);
 log.article={title:'Old sentence collection',collection:true,paragraphs:log.touched.map(id=>({wordId:id,senseId:wordMap[id].senses[0].id,...wordMap[id].senses[0].examples[0]}))};
 return {state,article:assembleArticle(readingLibrary[0],readingTargets(log.touched,log.passed))};
}
async function open(state){
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai'});
 await context.addInitScript(state=>{if(!localStorage.getItem('lexiday.v1'))localStorage.setItem('lexiday.v1',JSON.stringify(state));},state);
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));return {context,page};
}
try{
 const {state,article}=fixture(),{context,page}=await open(state);let calls=0;
 await page.route('**/api/reading',async route=>{calls++;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({article})});});
 await page.goto(base+'/#reading');await page.locator('[data-action="article"]').click();await page.locator('.article-body').waitFor();
 assert.equal(await page.locator('.article-body > p').count(),6);assert.ok(!(await page.locator('.article').innerText()).includes('例句合集'));
 await page.locator('.article-body [data-id="landlord"][data-paragraph="3"]').click();
 assert.ok((await page.locator('.glossary').innerText()).includes(article.paragraphs[3].en));
 assert.ok(!(await page.locator('.glossary').innerText()).includes(article.paragraphs[1].en));
 await page.locator('[data-action="translation"]').click();assert.equal(await page.locator('.article-body .translation').count(),6);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'outputs/reading-update/reading-mobile.png',fullPage:true});
 await page.reload();await page.locator('.article-body').waitFor();assert.equal(calls,1,'saved article must not regenerate on refresh');
 assert.equal(await page.locator('.article h1').innerText(),article.title);await context.close();
 const offline=await open(fixture().state);await offline.page.route('**/api/reading',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporarily unavailable'})}));
 await offline.page.goto(base+'/#reading');await offline.page.locator('[data-action="article"]').click();await offline.page.locator('.article-body').waitFor();
 assert.equal(await offline.page.locator('.article-body > p').count(),6);assert.match(await offline.page.locator('.article').innerText(),/完整主题文章/);
 assert.equal(await offline.page.evaluate(()=>JSON.parse(localStorage.getItem('lexiday.v1')).days[Object.keys(JSON.parse(localStorage.getItem('lexiday.v1')).days)[0]].article.mode),'library');
 await offline.context.close();assert.deepEqual(errors,[]);
 console.log('Reading browser checks passed: complete article, paragraph glossary, translations, old-format replacement, refresh persistence, offline story, mobile layout.');
}finally{await browser.close();}
