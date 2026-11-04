import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {readingBooks} from '../dist/reading-books-data.js';
import {readingProgress,availablePassages,passageProgress,gradeBookReading,submitBookReading,validateBookReading} from '../dist/book-reading-model.js';
import {initial,validateState,begin,markReviewPlayed,answerReviewMeaning,continueLearning,giveUpMemory,leaveRest} from '../dist/engine.js';
import {learningSessionAudio} from '../dist/learning-audio.js';import {wordEntries} from '../dist/word-content.js';
import {createSpeechAudioCache} from '../dist/speech-cache.js';import {speechAssets} from '../dist/speech-assets.js';
import worker from '../server/worker.js';import {database} from '../server/local-db.mjs';
import {words} from '../dist/data.js';import {wordEnrichment} from '../dist/word-enrichment.js';
import {containsTarget,repairKnownExamples} from '../dist/example-target.js';
import {prepareLookup,lookupWord} from '../server/lookup.js';
test('30 extracted passages have 400 distinct questions and every original key passes including unordered selections',()=>{
 assert.equal(readingBooks.ielts.length,30);let total=0;for(const p of readingBooks.ielts){const file=JSON.parse(fs.readFileSync('dist/reading-books/'+p.id+'.json','utf8'));assert.equal(file.groups.length,p.groups.length);assert.ok(file.paragraphs.join(' ').split(/\s+/).length>500,p.id);
 const answers={};for(const g of p.groups){if(g.kind==='multi')answers[g.id]=[...g.answers].reverse();else for(const [i,a] of g.answers.entries())answers[g.first+i]=a;}
 const result=gradeBookReading(p.id,answers);assert.equal(result.correct,result.total,p.id+JSON.stringify(result.results.filter(x=>!x.correct)));assert.equal(gradeBookReading(p.id,{}).correct,0);total+=result.total;}
 assert.equal(total,400);assert.equal(readingBooks.harry.chapters.length,17);for(let i=0;i<249;i++){const p=JSON.parse(fs.readFileSync('dist/reading-books/harry-'+String(i).padStart(3,'0')+'.json'));assert.equal(p.page,i);assert.ok(p.paragraphs.length);}
});
test('daily unlocking, immutable attempts, notes and novel positions survive validation without touching review words',()=>{
 const s=initial(),p=readingProgress(s,'2026-11-04');assert.equal(availablePassages(p,'2026-11-04'),1);assert.equal(availablePassages(p,'2026-11-06'),3);assert.equal(availablePassages(p,'2027-11-06'),30);
 const r=passageProgress(s,'ielts-01-1');r.draft['1']='B';r.note='错题原因';r.noteUpdatedAt=new Date().toISOString();submitBookReading(s,'ielts-01-1');r.draft['1']='C';submitBookReading(s,'ielts-01-1');assert.equal(r.attempts[0].answers['1'],'B');Object.assign(p.leisure,{page:72,paragraph:3,offset:120});
 const restored=validateState(structuredClone(s));assert.equal(restored.bookReading.leisure.page,72);assert.equal(restored.bookReading.passages['ielts-01-1'].note,'错题原因');assert.deepEqual(restored.records,{});const bad=structuredClone(p);bad.leisure.page=250;assert.throws(()=>validateBookReading(bad));
});
test('every fixed word and enrichment example actually includes its target or a grammatical phrase/inflection',()=>{
 const missing=[];for(const w of words)for(const s of w.senses)for(const ex of s.examples||[])if(!containsTarget(ex.en,w))missing.push([w.word,ex.en]);for(const [word,senses] of Object.entries(wordEnrichment))for(const s of senses)for(const ex of s.examples)if(!containsTarget(ex.en,word))missing.push([word,ex.en]);assert.deepEqual(missing,[]);
 assert.equal(containsTarget('Take the main road to the city center.','way'),false);assert.equal(containsTarget('The railway is closed.','way'),false);assert.equal(containsTarget('The children were bound by the rules.','bind'),true);
});
test('way repair preserves personal IDs and history; lookup rejects synonym substitution and missing-target examples',async()=>{
 const w={id:'reading:way',word:'way',notes:[],senses:[{id:'reading:way:1',pos:'n.',meaning:'路；方向',examples:[{en:'Take the main road to the city center.',zh:'走大路去市中心。'},{en:'Which road goes to the station?',zh:'哪条路通向车站？'}]}]},s={customWords:{[w.id]:w},records:{'reading:way:1':{level:3}},wordNotes:{[w.id]:[{text:'Keep my note'}]}};const before=JSON.stringify([s.records,s.wordNotes]);assert.ok(repairKnownExamples(s));assert.ok(w.senses[0].examples.every(ex=>containsTarget(ex.en,'way')));assert.equal(JSON.stringify([s.records,s.wordNotes]),before);
 await assert.rejects(()=>lookupWord({run:async()=>({word:'way',senses:w.senses})},prepareLookup({word:'road',context:'Take the road.'})),/原形/);
 await assert.rejects(()=>lookupWord({run:async()=>({word:'way',senses:[{...w.senses[0],examples:[{en:'A road leads home.',zh:'路通向家。'}]}]})},prepareLookup({word:'way',context:'This way.'})),/目标单词/);
});
test('warranty mistakes are deferred behind other words, retain same-day debt, and resume with a different example',()=>{
 const day='2026-11-05',s=initial(),w=words.find(w=>w.word==='warranty'),sense=w.senses[0];s.plan.count=3;s.records[sense.id]={wordId:w.id,level:2,due:day,audioVerified:true};begin(s,day);assert.equal(s.session.current.wordId,w.id);markReviewPlayed(s);answerReviewMeaning(s,'汽车');assert.equal(s.session.cue,'sentence');giveUpMemory(s);continueLearning(s,1000);assert.notEqual(s.session.current.wordId,w.id);assert.ok(s.session.queue.some(t=>t.wordId===w.id&&t.notBefore===61000));assert.equal(s.records[sense.id].pending,true);assert.equal(s.records[sense.id].due,day);assert.ok(!s.days[day].passed.includes(sense.id));validateState(structuredClone(s));
});
test('whole-session preloading includes the last due/new word; bounded retries download each successful clip once',async()=>{
 const s=initial();s.plan.count=5;begin(s,'2026-11-05');const plan=learningSessionAudio(s);for(const id of Object.keys(s.session.types)){const w=words.find(w=>w.id===id);assert.ok(plan.includes(w.word));for(const sense of wordEntries(w))for(const example of sense.examples)assert.ok(plan.includes(example.en));}
 const calls=new Map(),stored=new Map(),cache=createSpeechAudioCache({storage:{get:async text=>stored.get(text),put:async(text,blob)=>stored.set(text,blob)},fetcher:async(url,init)=>{const text=JSON.parse(init.body).text,n=(calls.get(text)||0)+1;calls.set(text,n);if(text==='retry'&&n===1)return new Response('temporary',{status:503});return new Response(new Uint8Array(160),{headers:{'Content-Type':'audio/wav'}});}});const result=await cache.prepare(['first','retry','last','first']);assert.equal(result.completed,3);assert.deepEqual(result.failed,[]);assert.equal(calls.get('retry'),2);await cache.prepare(['first','retry','last']);assert.equal(calls.get('first'),1);assert.ok(Object.values(speechAssets).every(path=>path.startsWith('/audio/listening/melo-')));
});
test('reading submissions, notes and novel position persist across logout/login and remain private to the account',async()=>{
 const db=database(),env={DB:db,AUTH_PEPPER:'test-pepper-for-reading-persistence-000'},password='reading account test 783001';let cookie='';
 async function call(path,method='GET',data){const r=await worker.fetch(new Request('https://reading.test/api/'+path,{method,headers:{Origin:'https://reading.test','Content-Type':'application/json',Cookie:cookie},...(data?{body:JSON.stringify(data)}:{})}),env,{});if(r.headers.has('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,body:await r.json()};}
 try{await call('register','POST',{username:'reading_user',password});const s=initial(),p=readingProgress(s,'2026-11-05'),r=passageProgress(s,'ielts-01-1');r.draft['1']='B';r.note='我的阅读笔记';r.noteUpdatedAt=new Date().toISOString();submitBookReading(s,'ielts-01-1');r.draft['1']='C';submitBookReading(s,'ielts-01-1');Object.assign(p.leisure,{page:38,paragraph:2,offset:80});assert.equal((await call('progress/words','PUT',{revision:0,data:s})).status,200);await call('logout','POST',{});await call('login','POST',{username:'reading_user',password});const restored=(await call('session')).body.progress.words.data.bookReading;assert.equal(restored.passages['ielts-01-1'].note,'我的阅读笔记');assert.equal(restored.passages['ielts-01-1'].attempts[0].answers['1'],'B');assert.equal(restored.leisure.page,38);assert.equal(restored.leisure.offset,80);cookie='';await call('register','POST',{username:'reading_other',password});assert.equal((await call('session')).body.progress.words,undefined);
 }finally{db.close();}
});
