import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {listeningKey,saveListeningPosition,checkListeningAnswers,FIRST_LISTENING_ID,saveListeningNote} from '../dist/listening-model.js';
import {initialIelts,validateIelts} from '../dist/ielts-model.js';
const tracks=JSON.parse(readFileSync(new URL('../dist/listening/cambridge-04/catalog.json',import.meta.url)));
test('16 uniquely named audio files match their original hashes and have substantial transcripts',()=>{
 assert.equal(tracks.length,16);assert.equal(new Set(tracks.map(t=>t.filename)).size,16);
 for(const track of tracks){
  assert.match(track.filename,/^test-[1-4]-section-[1-4]-[a-z-]+\.mp3$/);
  const audio=readFileSync(new URL('../dist'+track.audio,import.meta.url));assert.equal(createHash('sha256').update(audio).digest('hex'),track.sha256);
  const transcript=readFileSync(new URL('../dist'+track.transcript,import.meta.url),'utf8');assert.ok(transcript.length>1500);assert.ok(!transcript.includes('<html'));
  assert.ok(track.pages.length);for(const page of track.pages)assert.ok(existsSync(new URL('../dist'+page,import.meta.url)));
 }
});
test('all 160 original question numbers are assigned to their matching audio sections',()=>{
 for(let test=1;test<=4;test++){
  const rows=tracks.filter(t=>t.test===test).flatMap(t=>t.questions);assert.deepEqual(rows.map(q=>q.number),Array.from({length:40},(_,i)=>i+1));
  for(const track of tracks.filter(t=>t.test===test)){assert.equal(track.questions.length,10);for(const q of track.questions)assert.equal(Math.ceil(q.number/10),track.part);}
 }
});
test('audio resume position is saved without automatically recording practice metadata',()=>{
 const notes={};saveListeningPosition(notes,tracks[0],130.4);
 assert.equal(notes[listeningKey(tracks[0].id,'position')],'130.4');assert.equal(notes['listen-source'],undefined);
});
test('dictation, answers and selection survive the existing IELTS backup and cloud validator independently',()=>{
 const state=initialIelts('2026-10-24');
 state.notes[listeningKey(tracks[0].id,'dictation')]='First dictation';state.notes[listeningKey(tracks[1].id,'dictation')]='Second dictation';
 state.notes[listeningKey(tracks[0].id,'answer-1')]='shopping';state.notes['listening:selected']=tracks[0].id;
 const copy=validateIelts(JSON.parse(JSON.stringify(state)));assert.equal(copy.notes[listeningKey(tracks[0].id,'dictation')],'First dictation');assert.equal(copy.notes[listeningKey(tracks[1].id,'dictation')],'Second dictation');
});
test('Test 1 Section 1 accepts supplied alternatives, dates, case and surrounding whitespace',()=>{
 const answers=['  Variety   of SHOPPING ','guided tours','over 12','notice board','13th February','Tower of London','Bristol','American Museum','student newspaper','Yentob.'];
 assert.equal(checkListeningAnswers(FIRST_LISTENING_ID,answers).correct,10);
 answers[0]='shopping';answers[2]='more than 12';answers[4]='13 February';assert.equal(checkListeningAnswers(FIRST_LISTENING_ID,answers).correct,10);
});
test('blank and incorrect answers fail; absent answer keys are never graded',()=>{
 const result=checkListeningAnswers(FIRST_LISTENING_ID,['shop','guided tour','12','noticeboard','14 February']);
 assert.equal(result.correct,0);assert.equal(result.results[5].answered,false);assert.equal(result.results[0].answered,true);
 assert.equal(checkListeningAnswers(tracks[1].id,[]),null);
});
test('first-listen note remains immutable, drafts clear after saving and notes stay scoped to audio across sync',()=>{
 const state=initialIelts('2026-10-27'),notes=state.notes,id=tracks[0].id,other=tracks[1].id;
 notes[listeningKey(id,'note-draft')]='Original unclear phrase';saveListeningNote(notes,id,'Original unclear phrase');
 assert.equal(notes[listeningKey(id,'note-draft')],'');saveListeningNote(notes,id,'Second listen');saveListeningNote(notes,other,'Different audio');
 assert.equal(notes[listeningKey(id,'first-note')],'Original unclear phrase');assert.equal(notes[listeningKey(id,'latest-note')],'Second listen');
 const restored=validateIelts(JSON.parse(JSON.stringify(state)));assert.equal(restored.notes[listeningKey(other,'first-note')],'Different audio');
 assert.throws(()=>saveListeningNote(notes,id,'  '));assert.equal(notes[listeningKey(id,'first-note')],'Original unclear phrase');
});
