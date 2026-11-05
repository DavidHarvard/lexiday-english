import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,begin,answerBare,answerSense,continueLearning,answerListening,markListeningPlayed,markWordUnremembered,answerReview,answerReviewMeaning,markReviewPlayed,giveUpMemory,leaveRest,validateState,dayLog,activeExample,dailyReadingPlan,addReadingWord} from '../dist/engine.js';
import {addWordNote,getWord,lookupLocalWord,validateCustomWord} from '../dist/personal-words.js';
import {wordEnrichment} from '../dist/word-enrichment.js';
import {wordMap,words} from '../dist/data.js';
import {practiceTargets,fallbackPractice,validatePractice,quizFromPractice} from '../dist/listening-practice.js';
import {prepareLookup,lookupWord} from '../server/lookup.js';
import worker from '../server/worker.js';
import {database} from '../server/local-db.mjs';
const DAY='2026-11-03';
const custom={id:'reading:kingfisher',word:'kingfisher',ipa:'',notes:[],senses:[{id:'reading:kingfisher:1',pos:'n.',meaning:'翠鸟',distractors:[],examples:[{en:'A kingfisher waited above the quiet stream.',zh:'一只翠鸟在安静的溪流上方等候。'},{en:'We saw a kingfisher dive into the water.',zh:'我们看见一只翠鸟俯冲入水。'}]}]};
test('word notes keep independent dated entries and survive backup without duplicate submission',()=>{
 const s=initial();addWordNote(s,'commute','It is similar to the word communicate',DAY,'2026-11-03T01:02:03.000Z');addWordNote(s,'commute','Travel to work every day.',DAY,'2026-11-03T01:03:03.000Z');
 const restored=validateState(structuredClone(s));assert.equal(restored.wordNotes.commute.length,2);assert.equal(restored.wordNotes.commute[0].day,DAY);assert.equal(restored.wordNotes.communicate,undefined);assert.throws(()=>addWordNote(s,'commute','<script>',DAY));
});
test('recognition skips visual hints, success persists immediately, and forgetting removes that pass',()=>{
 const s=initial();s.plan.count=1;begin(s,DAY);assert.equal(s.session.stage,'listen');markListeningPlayed(s);answerListening(s,'光线');assert.equal(s.session.stage,'detail');assert.equal(s.records['light-n'].audioVerified,true);assert.ok(dayLog(s,DAY).passed.includes('light-n'));
 markWordUnremembered(s,'light',DAY);assert.equal(s.records['light-n'].pending,true);assert.equal(s.records['light-n'].due,DAY);assert.ok(!dayLog(s,DAY).passed.includes('light-n'));continueLearning(s,0);assert.ok([s.session.current,...s.session.queue].some(t=>t.senseId==='light-n'));validateState(structuredClone(s));
});
test('failed review repeats today, requires understanding the sentence and then an audio answer',()=>{
 const s=initial();s.plan.count=1;s.records['bright-adj']={wordId:'bright',level:2,due:DAY,audioVerified:false};begin(s,DAY);answerReview(s,false);assert.equal(s.session.cue,'sentence');answerReview(s,false);continueLearning(s,0);
 let guard=10;while(s.session.current.senseId!=='bright-adj'&&guard--){if(s.session.stage==='rest')leaveRest(s,1e15);giveUpMemory(s);continueLearning(s,0);}assert.ok(guard>0);if(s.session.stage==='rest')leaveRest(s,1e15);
 assert.equal(s.session.cue,'sentence');assert.equal(s.records['bright-adj'].due,DAY);assert.equal(s.records['bright-adj'].pending,true);answerReviewMeaning(s,'明亮');assert.equal(s.session.states['bright-adj'].passed,false);continueLearning(s,0);
 assert.ok(s.session.stage==='rest'||s.session.current.wordId!=='bright','never immediately test the reviewed word');guard=12;while(s.session.current.senseId!=='bright-adj'&&guard--){if(s.session.stage==='rest')leaveRest(s,1e15);giveUpMemory(s);continueLearning(s,61000);}assert.ok(guard>0);if(s.session.stage==='rest')leaveRest(s,1e15);
 assert.equal(s.session.cue,'context');assert.equal(s.session.cuePlayed,false);answerReviewMeaning(s,'明亮');continueLearning(s,61000);assert.equal(s.records['bright-adj'].pending,false);assert.equal(s.records['bright-adj'].audioVerified,true);
});
test('a missed sentence cannot pass just by accumulating auditory answers',()=>{
 const s=initial();s.plan.count=1;begin(s,DAY);s.session.stage='sentence';answerSense(s,false);s.session.states['light-n'].known=2;continueLearning(s,0);markListeningPlayed(s);answerListening(s,'光线');assert.equal(s.session.states['light-n'].passed,false);
});
test('reading collection adds known and new dictionary words to tomorrow without leaking private entries',()=>{
 const s=initial();addReadingWord(s,wordMap.commute,'A passage about commuting.',DAY);addReadingWord(s,custom,'A kingfisher sat near a stream.',DAY);assert.equal(addReadingWord(s,custom,'Repeated selection',DAY),false);assert.equal(s.records[custom.senses[0].id].due,'2026-11-04');
 const restored=validateState(structuredClone(s));assert.equal(getWord(restored,custom.id).word,'kingfisher');assert.equal(getWord(initial(),custom.id),undefined);assert.equal(wordMap[custom.id],undefined);begin(restored,'2026-11-04');assert.ok([restored.session.current,...restored.session.queue].some(t=>t.wordId===custom.id));assert.equal(lookupLocalWord('commuting',s).id,'commute');
 const bad=structuredClone(restored);bad.customWords[custom.id].senses[0].examples=[];assert.throws(()=>validateState(bad));
});
test('daily reading plan includes the whole queue before words are completed',()=>{
 const s=initial();s.plan.count=5;begin(s,DAY);const p=dailyReadingPlan(s,DAY);assert.equal(p.ids.length,5);assert.equal(dayLog(s,DAY).touched.length,1);assert.ok(p.ids.includes(s.session.queue.at(-1).wordId));assert.ok(p.senseIds.includes(s.session.queue.at(-1).senseId));
});
test('related words and phrases outside the main dictionary can join the same-day queue',()=>{
 for(const [name,entries] of Object.entries(wordEnrichment).filter(([id])=>!wordMap[id])){const id='reading:'+name,word={id,word:name,ipa:entries[0].ipa||'',notes:[],senses:entries.map((entry,i)=>({...entry,id:id+':'+(i+1),distractors:[]}))},s=initial();validateCustomWord(word);addReadingWord(s,word,'单词笔记关联词',DAY);markWordUnremembered(s,id,DAY);validateState(s);assert.equal(s.records[word.senses[0].id].due,DAY);}
});
test('long listening passages have two content questions and one word-meaning question with valid answers',async()=>{
 const s=initial(),ids=['furnished','commute','deposit','lease','residential'],targets=practiceTargets(s,ids,ids.map(id=>wordMap[id].senses[0].id)),pack=fallbackPractice(s,targets);validatePractice(pack,s,targets);
 assert.equal(pack.passages.length,5);assert.equal(new Set(pack.passages.map(p=>p.questions[0].prompt)).size,5);
 for(const p of pack.passages){assert.ok(p.en.split(/\s+/).length>=90);assert.deepEqual(p.questions.map(q=>q.kind),['content','content','meaning']);}
 const log={touched:targets.map(t=>t.wordId),passed:targets.map(t=>t.senseId)},quiz=quizFromPractice(pack,s,log);assert.equal(quiz.questions.length,targets.length*3);assert.ok(quiz.questions.every(q=>q.options.filter(x=>x===q.meaning).length===1));
 const invalid=structuredClone(pack);invalid.passages[0].questions.pop();assert.throws(()=>validatePractice(invalid,s,targets));
});
test('dictionary lookup validates selection and builds usable custom entries',async()=>{
 assert.equal(prepareLookup({word:'commuting',context:'I am commuting.'}).local.id,'commute');assert.throws(()=>prepareLookup({word:'<script>'}));
 const w=await lookupWord({run:async()=>({response:{word:'kingfisher',senses:custom.senses}})},prepareLookup({word:'kingfisher',context:'A kingfisher.'}));assert.equal(w.id,custom.id);assert.equal(w.senses[0].examples.length,2);
});
test('authored listening scenes support every dictionary sense and reject duplicate choices',()=>{
 const s=initial(),targets=words.flatMap(w=>w.senses.map(s=>({wordId:w.id,senseId:s.id})));
 for(let i=0;i<targets.length;i+=5){const part=targets.slice(i,i+5);validatePractice(fallbackPractice(s,part),s,part);}
 const part=targets.slice(0,1),invalid=fallbackPractice(s,part);invalid.passages[0].questions[0].options[3]=invalid.passages[0].questions[0].options[0];assert.throws(()=>validatePractice(invalid,s,part),/选项/);
});
test('dated notes and reading vocabulary persist in the account database across logout and another login',async()=>{
 const db=database(),env={DB:db,AUTH_PEPPER:'test-pepper-with-sufficient-length-000'},password='a unique notes test password 7429';let cookie='';
 async function call(path,method='GET',data){const r=await worker.fetch(new Request('https://notes.test/api/'+path,{method,headers:{Origin:'https://notes.test','Content-Type':'application/json',Cookie:cookie},...(data?{body:JSON.stringify(data)}:{})}),env,{});if(r.headers.has('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,body:await r.json()};}
 try{await call('register','POST',{username:'notes_user',password});const s=initial();addWordNote(s,'commute','It is similar to the word communicate',DAY);addReadingWord(s,custom,'A kingfisher sat by the water.',DAY);assert.equal((await call('progress/words','PUT',{revision:0,data:s})).status,200);await call('logout','POST',{});assert.equal((await call('session')).status,401);await call('login','POST',{username:'notes_user',password});const restored=(await call('session')).body.progress.words.data;assert.equal(restored.wordNotes.commute[0].text,'It is similar to the word communicate');assert.equal(restored.wordNotes.commute[0].day,DAY);assert.equal(restored.records[custom.senses[0].id].due,'2026-11-04');cookie='';await call('register','POST',{username:'other_user',password});assert.equal((await call('session')).body.progress.words,undefined);
 }finally{db.close();}
});

