import test from 'node:test';
import assert from 'node:assert/strict';
import {readingLibrary} from '../dist/reading-library.js';
import {createArticle} from '../dist/content.js';
import {readingTargets,assembleArticle,validateReadingArticle,countWords,findWord} from '../dist/reading-model.js';
import {initial,dayLog,validateState} from '../dist/engine.js';
import {prepareReadingRequest,generateReading,READING_MODEL,READING_DAILY_LIMIT} from '../server/reading.js';
import worker from '../server/worker.js';
import {database} from '../server/local-db.mjs';

test('offline readings are complete multi-paragraph articles with truthful word coverage',()=>{
 assert.equal(readingLibrary.length,4);
 for(const source of readingLibrary){
  const article=assembleArticle(source,readingTargets(['furnished','residential','research','journey']),{mode:'library'});
  assert.ok(article.wordCount>=350,source.id);assert.ok(article.paragraphs.length>=5);
  for(const p of article.paragraphs){assert.ok((p.en.match(/[.!?](?:\s|$)/g)||[]).length>=3,source.id);assert.match(p.zh,/[\u3400-\u9fff]/);}
  assert.equal(article.covered+article.missing.length,4);assert.equal(article.collection,false);
  for(const g of article.glossary)assert.ok(findWord(article.paragraphs[g.paragraphIndex].en,g.wordId));
 }
 const article=createArticle(['furnished','residential','furnished']);assert.equal(article.total,2);assert.ok(article.covered>=1);validateReadingArticle(article);
});
test('generated article validation rejects sentence lists, missing translation, HTML and forged word cards',()=>{
 const targets=readingTargets(['furnished']),source=readingLibrary[0];
 assert.throws(()=>assembleArticle({...source,paragraphs:source.paragraphs.map(p=>({...p,en:'A furnished room.'}))},targets));
 assert.throws(()=>assembleArticle({...source,paragraphs:source.paragraphs.map(p=>({...p,zh:''}))},targets));
 assert.throws(()=>assembleArticle({...source,paragraphs:[{...source.paragraphs[0],en:'<img onerror=alert(1)>'+source.paragraphs[0].en},...source.paragraphs.slice(1)]},targets));
 const a=assembleArticle(source,targets);assert.equal(a.covered,1);a.glossary[0].en='Invented context.';assert.throws(()=>validateReadingArticle(a));
 const broken=createArticle(['furnished']);broken.missing=null;assert.throws(()=>validateReadingArticle(broken));
 const forged=createArticle(['furnished']);forged.glossary[0].meaning='错误释义';assert.throws(()=>validateReadingArticle(forged));
});
test('coverage handles real inflections without matching a different word',()=>{
 assert.equal(findWord('Planes fly overhead.','plan'),null);
 assert.equal(findWord('She booked a room.','book')?.form,'booked');
 assert.equal(findWord('He deposited the money.','deposit')?.form,'deposited');
});
test('new article format syncs without changing vocabulary progress and old article format still loads',()=>{
 const state=initial(),log=dayLog(state,'2026-10-30');log.touched=['furnished'];log.passed=['furnished-adj-1'];log.article=createArticle(log.touched);
 // Use real stable sense IDs rather than coupling migration to an assumed spelling.
 log.passed=log.article.glossary.map(g=>g.senseId);
 assert.deepEqual(validateState(structuredClone(state)).days['2026-10-30'].article,log.article);
 log.article={paragraphs:[{wordId:'light',senseId:'light-n',en:'Light came in.',zh:'光照进来了。'}]};
 assert.ok(validateState(structuredClone(state)).days['2026-10-30'].article);
});
test('generation prompt uses known vocabulary and enforces a complete story and matching coverage',async()=>{
 const input=prepareReadingRequest({ids:['furnished','residential'],senseIds:[]});let called;
 const ai={async run(model,args){called={model,args};return {choices:[{message:{content:JSON.stringify(readingLibrary[0])}}]};}};
 const article=await generateReading(ai,input);assert.equal(called.model,READING_MODEL);assert.ok(called.args.max_tokens<=7000);assert.match(called.args.messages[0].content,/Do NOT concatenate/);assert.equal(article.mode,'generated');assert.equal(article.covered,2);
 assert.throws(()=>prepareReadingRequest({ids:['__proto__'],senseIds:[]}));assert.throws(()=>prepareReadingRequest({ids:Array(501).fill('light'),senseIds:[]}));
 await assert.rejects(()=>generateReading({run:async()=>({response:'not JSON'})},input));
});
test('reading API supports guests, checks origin and vocabulary, and caps generation without changing accounts',async()=>{
 const env={DB:database(),AUTH_PEPPER:'test-only-pepper-not-for-production-12345',AI:{run:async()=>({response:readingLibrary[0]})}};
 let caller=0;const call=(ids=['furnished'],origin='https://example.test')=>worker.fetch(new Request('https://example.test/api/reading',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'reading-test-'+caller++},body:JSON.stringify({ids,senseIds:[]})}),env,{});
 try{
  assert.equal((await call(['furnished'],'https://elsewhere.test')).status,403);
  assert.equal((await call(['not-a-real-word'])).status,400);
  const response=await call();assert.equal(response.status,200);assert.equal((await response.json()).article.version,2);
  for(let i=1;i<READING_DAILY_LIMIT;i++)assert.equal((await call()).status,200);
  assert.equal((await call()).status,429);assert.equal((await env.DB.prepare('SELECT count(*) as n FROM users').first()).n,0);
 }finally{env.DB.close();}
});
