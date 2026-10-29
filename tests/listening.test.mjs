import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {listeningKey,saveListeningPosition,checkListeningAnswers,FIRST_LISTENING_ID,saveListeningNote,LISTENING_ANSWERS} from '../dist/listening-model.js';
import {initialIelts,validateIelts} from '../dist/ielts-model.js';
const tracks=JSON.parse(readFileSync(new URL('../dist/listening/cambridge-04/catalog.json',import.meta.url)));
const layouts=JSON.parse(readFileSync(new URL('../dist/listening/cambridge-04/question-layouts.json',import.meta.url)));
test('original question pages have inputs for all 160 questions without replacing any page image',()=>{
 for(const track of tracks){
  const pages=layouts[track.id];assert.deepEqual(pages.map(p=>p.image),track.pages);
  const fields=pages.flatMap(p=>p.fields);
  assert.deepEqual([...new Set(fields.map(f=>f.number))].sort((a,b)=>a-b),track.questions.map(q=>q.number));
  for(const page of pages)for(const f of page.fields){assert.ok(f.x>=0&&f.y>=0&&f.width>0&&f.height>0);assert.ok(f.x+f.width<=page.width&&f.y+f.height<=page.height);}
 }
});
test('two-blank questions keep two separate fields with stable fragment ordering',()=>{
 for(const [id,q] of [[tracks[1].id,11],[tracks[11].id,35]]){
  const fields=layouts[id].flatMap(p=>p.fields).filter(f=>f.number===q);assert.equal(fields.length,2);assert.deepEqual(fields.map(f=>f.part),[0,1]);assert.ok(fields.every(f=>f.parts===2));
 }
});
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
 assert.equal(checkListeningAnswers('unavailable-section',[]),null);
});
// Independent answer-sheet fixtures keep question alignment and imports auditable.
const completeAnswers=[
 ['shopping','guided tours','over 12','notice board','13th February','Tower of London','Bristol','American Museum','student newspaper','Yentob',
  'coal / firewood','local craftsmen','160','Woodside','Ticket Office','Gift Shop','Workshop','Showroom','Cafe','cottages',
  'A','C','E','G','B','F','C','D','A','B',
  'environment','windy','humid','shaded','dangerous','leaves','ground','considerably reduce','low','room'],
 ['C','C','B','B','A','Cathedral','Markets','Gardens','Art Gallery','see the view',
  'C','B','A','C','B','C','A','B','B','A',
  'data collection','1,500','5','3,000 – 4,000','B','C','Mehta','Research','London University Press','1988',
  'C','A','media','academics','specialist knowledge','unaware','individuals','illegal profits','D','E'],
 ['1-1/2 years','Forrest','Academic','Thursday','B','B','A','deposit','monthly','phone',
  'C','A','C','B','lights','adults','Studio Theatre','families','City Gardens','children',
  'A','B','C','A','B','A','C','B','B','B',
  'questionnaire','about 2,000','Education','living quarters','traffic / parking','lecture theaters','facilities','D, F','B','A, C'],
 ['College Dining Room','office staff','students','10th December','coffee breaks','6','a good dictionary','tapes','photographs','speech',
  'B','A','A','A','B','180','nearest station','local history','690','local walking club',
  '20 balloons','measurement units','salt','crystals','pieces of string','white light','H','B','E','C',
  '795','tail','bottom','sense of smell','A','A','B','B','B','E']
];
const sectionAnswers=track=>completeAnswers[track.test-1].slice((track.part-1)*10,track.part*10);
test('all 160 sourced answers grade in their own sections with original question numbers',()=>{
 assert.deepEqual(Object.keys(LISTENING_ANSWERS).sort(),tracks.map(t=>t.id).sort());
 const sources=JSON.parse(readFileSync(new URL('../data/imports/cambridge-4-listening-answers.json',import.meta.url)));
 for(const track of tracks){
  const key=LISTENING_ANSWERS[track.id],result=checkListeningAnswers(track.id,sectionAnswers(track));
  assert.equal(result.correct,10,`${track.id}: ${JSON.stringify(result.results.filter(r=>!r.correct))}`);
  assert.equal(result.total,10);
  assert.deepEqual(result.results.map(r=>r.number),track.questions.map(q=>q.number));
  assert.equal(key.source,`https://ieltsextremes.com/cambridge-book-4-test-${track.test}-listening-answers/`);
  for(const q of key.questions){assert.equal(q.display,sources[track.test-1].answers[q.number]);assert.ok(q.accepted.every(v=>v.trim()));}
  assert.equal(checkListeningAnswers(track.id,[]).correct,0);
  assert.equal(checkListeningAnswers(track.id,Array(10).fill('definitely wrong')).correct,0);
 }
});
test('numeric separators, full-width characters, dash variants and ranges preserve numeric meaning',()=>{
 const track=tracks[6],answers=sectionAnswers(track);
 answers[1]='１５００';answers[3]='3000 to 4000';assert.equal(checkListeningAnswers(track.id,answers).correct,10);
 answers[3]='3,000—4,000';assert.equal(checkListeningAnswers(track.id,answers).correct,10);
 answers[3]='3000';assert.equal(checkListeningAnswers(track.id,answers).results[3].correct,false);
 answers[1]='15,00';assert.equal(checkListeningAnswers(track.id,answers).results[1].correct,false);
});
test('source optional wording and spelling variants work without accepting missing answer words',()=>{
 for(const [index,number,values] of [[1,17,['Workshop','main Workshop']],[9,17,['Studio Theatre','at Studio Theatre','the Studio Theatre','Studio Theater']],[9,19,['City Gardens','in City Gardens','the City Gardens','outdoors']],[11,37,['facilities','choice of facilities','room for facilities']],[14,26,['light','ordinary light','white light']],[7,37,['individual customers','individual consumers','individuals']]]){
  const track=tracks[index],answers=sectionAnswers(track),offset=number-track.questions[0].number;
  for(const value of values){answers[offset]=value;assert.equal(checkListeningAnswers(track.id,answers).results[offset].correct,true,`${track.id} Q${number} ${value}`);}
  answers[offset]='';assert.equal(checkListeningAnswers(track.id,answers).results[offset].correct,false);
 }
});
test('date and fractional duration variants are accepted without accepting incorrect values',()=>{
 for(const [index,offset,values,bad] of [[0,4,['13 February','Feb 13th'],'February 14'],[8,0,['1.5 years','1 1/2 years','one and a half years'],'1/2 years'],[12,3,['December 10','10 Dec'],'11 December']]){
  const track=tracks[index],answers=sectionAnswers(track);
  for(const value of values){answers[offset]=value;assert.equal(checkListeningAnswers(track.id,answers).results[offset].correct,true);}
  answers[offset]=bad;assert.equal(checkListeningAnswers(track.id,answers).results[offset].correct,false);
 }
});
test('single numbered two-item answers require both unique items and allow either order',()=>{
 for(const [index,number,valid,invalid] of [[1,11,['firewood / coal','coal, firewood','firewood and coal'],['coal','coal / coal','coal / ','coal / firewood / gas']],[11,35,['parking / traffic','traffic, parking'],['traffic','parking / parking']],[11,38,['F,D','df','f d','D and F'],['D','D,D','D,F,A','D/F/F']],[11,40,['C A','AC','C/A'],['A','C,C','A,B,C']]]){
  const track=tracks[index],answers=sectionAnswers(track),offset=number-track.questions[0].number;
  for(const value of valid){answers[offset]=value;assert.equal(checkListeningAnswers(track.id,answers).results[offset].correct,true,value);}
  for(const value of invalid){answers[offset]=value;assert.equal(checkListeningAnswers(track.id,answers).results[offset].correct,false,value);}
 }
});
test('two-question multiple choice groups allow swaps but never count repeated letters twice',()=>{
 for(const [index,offset,left,right] of [[6,4,'B','C'],[7,8,'D','E'],[15,8,'B','E']]){
  const track=tracks[index],answers=sectionAnswers(track);
  answers[offset]=right.toLowerCase();answers[offset+1]=left;assert.equal(checkListeningAnswers(track.id,answers).correct,10);
  answers[offset]=left;assert.equal(checkListeningAnswers(track.id,answers).correct,9);
  answers[offset]='';assert.equal(checkListeningAnswers(track.id,answers).correct,9);
  answers[offset]=left+right;assert.equal(checkListeningAnswers(track.id,answers).correct,9);
  answers[offset]='Z';answers[offset+1]='Z';assert.equal(checkListeningAnswers(track.id,answers).correct,8);
 }
 // Ordinary matching questions must not be treated as an unordered group.
 const answers=sectionAnswers(tracks[2]);[answers[2],answers[3]]=[answers[3],answers[2]];
 assert.equal(checkListeningAnswers(tracks[2].id,answers).correct,8);
});
test('answers for all sections survive backup and cloud validation with independent IDs',()=>{
 const state=initialIelts('2026-10-29');
 for(const track of tracks)track.questions.forEach((q,i)=>state.notes[listeningKey(track.id,'answer-'+q.number)]=sectionAnswers(track)[i]);
 const restored=validateIelts(JSON.parse(JSON.stringify(state)));
 const before=JSON.stringify(restored);
 for(const track of tracks){const answers=track.questions.map(q=>restored.notes[listeningKey(track.id,'answer-'+q.number)]);assert.equal(checkListeningAnswers(track.id,answers).correct,10);}
 assert.equal(JSON.stringify(restored),before);
});
test('first-listen note remains immutable, drafts clear after saving and notes stay scoped to audio across sync',()=>{
 const state=initialIelts('2026-10-27'),notes=state.notes,id=tracks[0].id,other=tracks[1].id;
 notes[listeningKey(id,'note-draft')]='Original unclear phrase';saveListeningNote(notes,id,'Original unclear phrase');
 assert.equal(notes[listeningKey(id,'note-draft')],'');saveListeningNote(notes,id,'Second listen');saveListeningNote(notes,other,'Different audio');
 assert.equal(notes[listeningKey(id,'first-note')],'Original unclear phrase');assert.equal(notes[listeningKey(id,'latest-note')],'Second listen');
 const restored=validateIelts(JSON.parse(JSON.stringify(state)));assert.equal(restored.notes[listeningKey(other,'first-note')],'Different audio');
 assert.throws(()=>saveListeningNote(notes,id,'  '));assert.equal(notes[listeningKey(id,'first-note')],'Original unclear phrase');
});
