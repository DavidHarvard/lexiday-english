import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {listeningKey,listeningTime,practiceSource,saveListeningPosition} from '../dist/listening-model.js';
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
test('practice metadata uses the material filename, Shanghai practice date and actual playhead',()=>{
 const notes={};saveListeningPosition(notes,tracks[0],130.4,new Date('2026-10-24T04:05:06Z'));
 assert.ok(notes['listen-source'].startsWith(tracks[0].filename));assert.match(notes['listen-source'],/2026\/10\/24 12:05:06 · 02:10$/);
 assert.equal(notes[listeningKey(tracks[0].id,'position')],'130.4');assert.equal(listeningTime(-1),'00:00');
});
test('dictation, answers and selection survive the existing IELTS backup and cloud validator independently',()=>{
 const state=initialIelts('2026-10-24');
 state.notes[listeningKey(tracks[0].id,'dictation')]='First dictation';state.notes[listeningKey(tracks[1].id,'dictation')]='Second dictation';
 state.notes[listeningKey(tracks[0].id,'answer-1')]='shopping';state.notes['listening:selected']=tracks[0].id;
 const copy=validateIelts(JSON.parse(JSON.stringify(state)));assert.equal(copy.notes[listeningKey(tracks[0].id,'dictation')],'First dictation');assert.equal(copy.notes[listeningKey(tracks[1].id,'dictation')],'Second dictation');
});
