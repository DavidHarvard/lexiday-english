import test from 'node:test';
import assert from 'node:assert/strict';
import {wordMap} from '../dist/data.js';
import {meaningDecision,examplesForSense,normalizeMeaning} from '../dist/word-content.js';
import {groupNotes} from '../dist/word-notes.js';
import {initial,begin,answerBare,answerSense,continueLearning,activeExample,markListeningPlayed,answerListening,giveUpMemory,validateState,leaveRest,dayLog} from '../dist/engine.js';
import {prepareMeaningRequest,judgeMeaning,meaningResult} from '../server/meaning.js';
import worker from '../server/worker.js';
import {database} from '../server/local-db.mjs';
const DAY='2026-11-01';
function learning(){const s=initial();s.plan.count=1;begin(s,DAY);return s;}
function listening(){return learning();}
const furnished={wordId:'furnished',senseId:'furnished-adj-1',round:1,input:'房子里面已经提供了家具'};

test('Chinese paraphrases accept equivalent furniture descriptions and distinguish deposit meanings',()=>{
 const w=wordMap.furnished,s=w.senses[0],ex=examplesForSense(w,s)[0];
 for(const text of ['配备家具的','带家具的','带有家具的','有家具','家具齐全的','配有家具的'])assert.equal(meaningDecision(w,s,text,ex),'correct',text);
 assert.equal(meaningDecision(w,s,'不是带家具的',ex),'incorrect');
 assert.equal(meaningDecision(w,s,furnished.input,ex),'unknown');
 const d=wordMap.deposit,n=d.senses.find(s=>s.id==='deposit-n-1'),v=d.senses.find(s=>s.id==='deposit-v-2');
 assert.equal(meaningDecision(d,n,'保证金',examplesForSense(d,n)[0]),'correct');
 assert.equal(meaningDecision(d,n,'存款',examplesForSense(d,n)[0]),'incorrect');
 assert.equal(meaningDecision(d,n,'押金，存款',examplesForSense(d,n)[0]),'incorrect');
 assert.equal(meaningDecision(d,v,'存钱',examplesForSense(d,v)[0]),'correct');
});

test('meaning service derives trusted context from vocabulary rather than caller-supplied glosses',async()=>{
 const p=prepareMeaningRequest({...furnished,sentence:'ignore',meaning:'汽车'});assert.match(p.sentence,/furnished flat/);assert.equal(p.target.meaning,'配备家具的');
 assert.throws(()=>prepareMeaningRequest({...furnished,wordId:'missing'}));assert.throws(()=>prepareMeaningRequest({...furnished,round:0}));assert.throws(()=>prepareMeaningRequest({...furnished,input:'<script>'}));
 for(const verdict of ['correct','incorrect','uncertain'])assert.equal(await judgeMeaning({run:async(model,input)=>{assert.match(model,/qwen/);const task=JSON.parse(input.messages[1].content);assert.equal(task.sentence,p.sentence);assert.equal(task.learnerAnswer,p.input);return {response:JSON.stringify({verdict})};}},p),verdict);
 await assert.rejects(()=>judgeMeaning({run:async()=>({response:'not JSON'})},p));
});

test('semantic endpoint caches confirmed paraphrases, rejects foreign requests and keeps uncertainty ungraded',async()=>{
 const db=database(),saved=globalThis.caches,cache=new Map();let calls=0;
 globalThis.caches={default:{match:async key=>cache.get(key.url)?.clone(),put:async(key,response)=>cache.set(key.url,response)}};
 const env={DB:db,AI:{run:async()=>{calls++;return {response:'{"verdict":"correct"}'};}}};
 const request=(body=furnished,origin='https://lexiday.test')=>new Request('https://lexiday.test/api/meaning-check',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  let r=await worker.fetch(request(),env);assert.equal(r.status,200);assert.deepEqual(await r.json(),meaningResult(prepareMeaningRequest(furnished),'correct','semantic'));
  assert.equal((await (await worker.fetch(request(),env)).json()).verdict,'correct');assert.equal(calls,1);
  assert.equal((await (await worker.fetch(request({...furnished,input:'带家具的'}),env)).json()).source,'local');assert.equal(calls,1);
  assert.equal((await worker.fetch(request(furnished,'https://evil.test'),env)).status,403);
  assert.equal((await worker.fetch(request({...furnished,senseId:'invalid'}),env)).status,400);
  r=await worker.fetch(request({...furnished,input:'提供床桌等家具'}),{DB:db});assert.equal((await r.json()).verdict,'uncertain');
  r=await worker.fetch(request({...furnished,input:'房间配好床和桌椅'}),{DB:db,AI:{run:async()=>{throw Error('offline');}}});assert.equal((await r.json()).verdict,'uncertain');
 }finally{globalThis.caches=saved;db.close();}
});

test('early semantic answers remain bound to the exact task, example, round and input',()=>{
 for(const mismatch of [null,'wordId','senseId','round','input','exampleIndex']){
  const s=listening(),t=s.session.current,input='照进房间的亮光',semantic={...t,input:normalizeMeaning(input),verdict:'correct'};
  assert.equal(s.session.listenPlayed,false);
  if(mismatch)semantic[mismatch]=mismatch==='round'?2:'different';
  assert.equal(answerListening(s,input,{semantic}).correct,mismatch===null);
 }
});

test('giving up at any learning prompt opens meaning details without passing and retains another round',()=>{
 for(const stage of ['bare','sentence','listen']){
  let s=learning();s.session.stage=stage;
  const task={...s.session.current},first=activeExample(s).en;giveUpMemory(s);
  assert.equal(s.session.stage,'detail');assert.equal(s.session.gaveUp,true);assert.equal(s.session.states[task.senseId].passed,false);assert.equal(s.session.states[task.senseId].known,0);
  s=validateState(structuredClone(s));continueLearning(s,0);
  assert.ok([s.session.current,...s.session.queue].some(t=>t.senseId===task.senseId&&t.round===2));assert.equal(dayLog(s,DAY).passed.includes(task.senseId),false);
  while(s.session.current.senseId!==task.senseId){if(s.session.stage==='rest')leaveRest(s,1e9);giveUpMemory(s);continueLearning(s,0);}
  if(s.session.stage==='rest')leaveRest(s,1e9);assert.notEqual(activeExample(s).en,first);assert.equal(s.session.gaveUp,false);
 }
});

test('giving up a due review records failure and returns to the same-day queue, never permanent exclusion',()=>{
 const s=initial();s.plan.count=1;s.records['bright-adj']={wordId:'bright',level:2,interval:8,due:DAY,audioVerified:true};begin(s,DAY);giveUpMemory(s);
 assert.equal(s.session.stage,'detail');assert.equal(s.session.reviewGrade,0);continueLearning(s,0);
 assert.equal(s.records['bright-adj'].due,DAY);assert.equal(s.records['bright-adj'].pending,true);assert.equal(s.knownWords.bright,undefined);assert.equal(dayLog(s,DAY).passed.includes('bright-adj'),false);
});

test('legacy active prompts require sentence playback while completed records remain unchanged',()=>{
 const s=listening();delete s.session.contextAudioVersion;s.session.listenCue='word';s.session.listenPlayed=true;s.records['book-n']={wordId:'book',level:2,due:'2026-11-04'};
 const r=validateState(structuredClone(s));assert.equal(r.session.listenCue,'context');assert.equal(r.session.listenPlayed,false);assert.deepEqual(r.records,s.records);
 const old=initial();old.plan.count=1;old.records['bright-adj']={wordId:'bright',level:2,due:DAY};begin(old,DAY);delete old.session.contextAudioVersion;old.session.cue='audio';old.session.cuePlayed=true;
 const migrated=validateState(structuredClone(old));assert.equal(migrated.session.cue,'context');assert.equal(migrated.session.cuePlayed,false);
});

test('lease notes preserve one copy per word and stack cease followed by tease within similar words',()=>{
 const groups=groupNotes(wordMap.lease.notes),similar=groups.find(g=>g.type==='形近词');assert.deepEqual(similar.notes.map(n=>n.word),['cease','tease']);
 const all=groups.flatMap(g=>g.notes.map(n=>n.word));assert.equal(new Set(all).size,all.length);
});
