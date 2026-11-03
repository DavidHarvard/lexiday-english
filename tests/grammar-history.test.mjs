import test from 'node:test';
import assert from 'node:assert/strict';
import {initialGrammar,validateGrammar} from '../dist/grammar-model.js';
import {bookState,writeBookAnswer,submitBookAnswer,bookMistakes,refreshBookResults,grammarItemMap,preserveBookHistory} from '../dist/grammar-reader-model.js';
import worker from '../server/worker.js';
import {database} from '../server/local-db.mjs';
const id='1.1:2',answer=grammarItemMap[id].answer;
test('every check freezes the submitted text and result, while later drafts and corrections preserve earlier errors',()=>{
 const state=initialGrammar();writeBookAnswer(state,id,'they is');submitBookAnswer(state,id,'2026-11-03T02:00:00.000Z');const first=structuredClone(state.pdfBook.exercises[id].attempts[0]);
 writeBookAnswer(state,id,'new draft');assert.equal(state.pdfBook.exercises[id].result,null);assert.equal(bookMistakes(state.pdfBook.exercises[id])[0].answer,'they is');
 writeBookAnswer(state,id,answer);submitBookAnswer(state,id,'2026-11-03T02:05:00.000Z');submitBookAnswer(state,id,'2026-11-03T02:06:00.000Z');
 const record=validateGrammar(structuredClone(state)).pdfBook.exercises[id];assert.equal(record.draft,answer);assert.equal(record.result,'correct');assert.equal(record.attempts.length,3);assert.deepEqual(record.attempts[0],first);assert.equal(bookMistakes(record).length,1);assert.notEqual(record.attempts[1].id,record.attempts[2].id);
 const bad=structuredClone(state);bad.pdfBook.exercises[id].attempts[0].at='not a date';assert.throws(()=>validateGrammar(bad));
 const duplicate=structuredClone(state);duplicate.pdfBook.exercises[id].attempts.push({...first});assert.throws(()=>validateGrammar(duplicate));
 const older=structuredClone(state);delete older.pdfBook.exercises[id].attempts;preserveBookHistory(older,state);assert.equal(older.pdfBook.exercises[id].attempts.length,3,'an old autosave must not invent another check for the same answer');
});
test('legacy results are preserved with an unknown timestamp, including results changed by a later key correction',()=>{
 const state=initialGrammar();bookState(state).exercises[id]={draft:answer,result:'incorrect',selfChecked:false};refreshBookResults(state);const r=state.pdfBook.exercises[id];assert.equal(r.result,'correct');assert.equal(r.attempts[0].result,'incorrect');assert.equal(r.attempts[0].at,null);assert.equal(r.attempts[0].source,'legacy');refreshBookResults(state);assert.equal(r.attempts.length,1);validateGrammar(state);
 writeBookAnswer(state,id,'edited');assert.equal(r.attempts[0].answer,answer);assert.equal(state.pdfBook.exercises[id].attempts[0].answer,answer);
});
test('server stores and merges grammar check history across corrections, stale-version uploads and account sessions',async()=>{
 const db=database(),env={DB:db,AUTH_PEPPER:'test-only-grammar-history-pepper-32-characters'};let cookie='';
 async function call(path,method='GET',data){const response=await worker.fetch(new Request('https://history.test/api/'+path,{method,headers:{Origin:'https://history.test','Content-Type':'application/json',Cookie:cookie},...(data?{body:JSON.stringify(data)}:{})}),env,{});if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,body:await response.json()};}
 const credentials={username:'history_test',password:'history account unique password'};
 try{
  await call('register','POST',credentials);const s=initialGrammar();writeBookAnswer(s,id,'they is');submitBookAnswer(s,id);assert.equal((await call('progress/grammar','PUT',{revision:0,data:s})).status,200);
  writeBookAnswer(s,id,answer);submitBookAnswer(s,id);assert.equal((await call('progress/grammar','PUT',{revision:1,data:s})).status,200);
  const older=structuredClone(s);older.pdfBook.exercises[id]={draft:'they are',result:null,selfChecked:false};assert.equal((await call('progress/grammar','PUT',{revision:2,data:older})).status,200);
  assert.equal((await call('progress/grammar','PUT',{revision:2,data:s})).status,409);
  await call('logout','POST',{});await call('login','POST',credentials);let saved=(await call('session')).body.progress.grammar;assert.equal(saved.data.pdfBook.exercises[id].draft,'they are');assert.equal(saved.data.pdfBook.exercises[id].attempts.length,2);assert.equal(saved.data.pdfBook.exercises[id].attempts[0].answer,'they is');assert.equal(saved.data.pdfBook.exercises[id].attempts[1].result,'correct');
  const tampered=structuredClone(saved.data);tampered.pdfBook.exercises[id].attempts[0].answer='changed history';assert.equal((await call('progress/grammar','PUT',{revision:saved.revision,data:tampered})).status,200);saved=(await call('session')).body.progress.grammar;assert.equal(saved.data.pdfBook.exercises[id].attempts[0].answer,'they is');
  await call('logout','POST',{});await call('register','POST',{...credentials,username:'other_history'});assert.equal((await call('session')).body.progress.grammar,undefined);
 }finally{db.close();}
});
