import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/worker.js';
import {database} from '../server/local-db.mjs';
import {initialIelts,validateIelts} from '../dist/ielts-model.js';
import {FIRST_LISTENING_ID,listeningKey,saveListeningNote,createListeningAttempts} from '../dist/listening-model.js';

test('server retains first-listen notes through logout, new client login and updated state validation',async()=>{
 const env={DB:database(),AUTH_PEPPER:'isolated-listening-test-secret-at-least-32-characters'};
 function client(){let cookie='';return async(path,method='GET',data)=>{
  const response=await worker.fetch(new Request('https://example.test/api/'+path,{method,headers:{Origin:'https://example.test','Content-Type':'application/json',Cookie:cookie,'CF-Connecting-IP':'listening-persistence-test'},...(data?{body:JSON.stringify(data)}:{})}),env,{});
  if(response.headers.get('Set-Cookie'))cookie=response.headers.get('Set-Cookie').split(';')[0];return {status:response.status,body:await response.json()};
 };}
 try{
  const first=client(),credentials={username:'listening_notes',password:'only for the isolated listening persistence test'};
  assert.equal((await first('register','POST',credentials)).status,201);
  const state=initialIelts('2026-10-30');saveListeningNote(state.notes,FIRST_LISTENING_ID,'第一次没有听清：guided tours。');
  const current=createListeningAttempts().forTrack(state.notes,FIRST_LISTENING_ID);current[1]='shopping';
  assert.equal((await first('progress/ielts','PUT',{revision:0,data:state})).status,200);
  assert.equal((await first('logout','POST',{})).status,200);
  const second=client();assert.equal((await second('login','POST',credentials)).status,200);
  let remote=(await second('session')).body.progress.ielts,loaded=validateIelts(structuredClone(remote.data));
  assert.equal(loaded.notes[listeningKey(FIRST_LISTENING_ID,'first-note')],'第一次没有听清：guided tours。');
  assert.equal(loaded.notes[listeningKey(FIRST_LISTENING_ID,'answer-1')],undefined);
  assert.deepEqual(Object.keys(createListeningAttempts().forTrack(loaded.notes,FIRST_LISTENING_ID)),[]);
  saveListeningNote(loaded.notes,FIRST_LISTENING_ID,'第二次补充：连读问题。');
  assert.equal((await second('progress/ielts','PUT',{revision:remote.revision,data:loaded})).status,200);
  const third=client();assert.equal((await third('login','POST',credentials)).status,200);
  loaded=(await third('session')).body.progress.ielts.data;
  assert.equal(loaded.notes[listeningKey(FIRST_LISTENING_ID,'first-note')],'第一次没有听清：guided tours。');
  assert.equal(loaded.notes[listeningKey(FIRST_LISTENING_ID,'latest-note')],'第二次补充：连读问题。');
 }finally{env.DB.close();}
});
