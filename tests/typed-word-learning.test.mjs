import test from 'node:test';
import assert from 'node:assert/strict';
import {wordMap,words} from '../dist/data.js';
import {initial,begin,answerBare,answerSense,continueLearning,markListeningPlayed,answerListening,setListeningCue,setMeaningDraft,listeningAudio,listeningUnavailable,activeExample,leaveRest,validateState,excludeKnownWord,dueSenses,remainingWords,LEARNING_PROTOCOL,markReviewPlayed,answerReviewMeaning} from '../dist/engine.js';
import {checkMeaning,splitDictionaryGloss,wordEntries,normalizeMeaning,studyMeaning} from '../dist/word-content.js';
import {deduplicateNotes,normalizedNoteWord} from '../dist/word-notes.js';
import {createSpeechController} from '../dist/speech.js';
const DAY='2026-10-29';
function study(){const state=initial();state.plan.count=1;begin(state,DAY);return state;}
function reachListen(state,known=true){if(state.session.stage==='bare')answerBare(state,known);answerSense(state,known);continueLearning(state,0);assert.equal(state.session.stage,'listen');}

test('visual recognition and details never pass or schedule a new word without typed audio input',()=>{
 const state=study();answerBare(state,true);answerSense(state,true);
 assert.equal(state.session.stage,'detail');assert.equal(state.session.states['light-n'].known,0);assert.equal(state.session.states['light-n'].passed,false);
 continueLearning(state);assert.equal(state.session.stage,'listen');assert.equal(continueLearning(state),false);
 assert.throws(()=>answerListening(state,'光线'),/先完整听/);assert.equal(state.records['light-n'],undefined);
 markListeningPlayed(state);assert.throws(()=>answerListening(state,'   '),/输入中文/);
 answerListening(state,'光线');assert.equal(state.session.stage,'result');assert.equal(state.session.states['light-n'].passed,true);
 assert.throws(()=>answerListening(state,'光线'));continueLearning(state,0);
 assert.equal(state.records['light-n'].audioVerified,true);assert.equal(state.records['light-n'].pending,false);
 assert.ok(dueSenses(state,'2026-10-30').includes('light-n'));
});
test('wrong typed meaning and unknown both remain unpassed, then show another same-day example',()=>{
 for(const unknown of [false,true]){
  const state=study(),first=activeExample(state).en;reachListen(state);markListeningPlayed(state);
  answerListening(state,unknown?'':'汽车',{unknown});assert.equal(state.session.states['light-n'].passed,false);assert.equal(state.session.states['light-n'].known,0);
  continueLearning(state,0);let guard=20;
  while(state.session.current.senseId!=='light-n'&&guard--){
   if(state.session.stage==='rest')leaveRest(state,Number.MAX_SAFE_INTEGER);reachListen(state);markListeningPlayed(state);answerListening(state,'轻的');continueLearning(state,0);
  }
  assert.ok(guard>0);if(state.session.stage==='rest')leaveRest(state,Number.MAX_SAFE_INTEGER);
  assert.equal(state.session.stage,'sentence');assert.notEqual(activeExample(state).en,first);
  answerSense(state,true);continueLearning(state);assert.equal(state.session.stage,'listen');assert.equal(state.session.listenCue,'context');assert.equal(listeningAudio(state),activeExample(state).en);
  markListeningPlayed(state);answerListening(state,'光线');assert.equal(state.session.states['light-n'].known,1);assert.equal(state.session.states['light-n'].passed,false);
 }
});
test('audio cue changes require replay; unavailable speech cannot grant a pass',()=>{
 const state=study();reachListen(state);markListeningPlayed(state);
 setListeningCue(state,'context');assert.equal(state.session.listenPlayed,false);assert.throws(()=>answerListening(state,'光线'));
 listeningUnavailable(state);assert.equal(state.session.audioUnavailable,true);assert.equal(state.session.states['light-n'].passed,false);
 markListeningPlayed(state);answerListening(state,'光线');assert.equal(state.session.states['light-n'].passed,true);
});
test('typed draft, current cue and result survive backup validation',()=>{
 let state=study();reachListen(state);setListeningCue(state,'context');setMeaningDraft(state,'  光线  ');
 state=validateState(JSON.parse(JSON.stringify(state)));assert.equal(state.session.listenDraft,'  光线  ');assert.equal(state.session.listenCue,'context');
 markListeningPlayed(state);answerListening(state,'光线');state=validateState(JSON.parse(JSON.stringify(state)));assert.equal(state.session.listenVerdict.correct,true);assert.equal(state.session.protocol,LEARNING_PROTOCOL);
 const bad=structuredClone(state);bad.session.listenVerdict.round++;assert.throws(()=>validateState(bad));
});
test('old active sessions gain an audio gate without deleting completed history or changing IDs',()=>{
 const state=study();answerBare(state,true);answerSense(state,true);delete state.session.protocol;
 state.session.states['light-n'].passed=true;state.session.states['light-n'].known=1;
 state.records['book-n']={wordId:'book',level:2,due:'2026-11-10'};
 const oldRecord=structuredClone(state.records['book-n']);const restored=validateState(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(restored.records['book-n'],oldRecord);assert.equal(restored.session.current.senseId,'light-n');assert.equal(restored.session.states['light-n'].passed,false);
 continueLearning(restored);assert.equal(restored.session.stage,'listen');
});
test('completely remembered is an explicit all-sense exclusion, independent of audio checks',()=>{
 const state=study();reachListen(state);excludeKnownWord(state,'light',DAY);
 assert.ok(state.knownWords.light);assert.ok(!remainingWords(state).includes('light'));assert.ok(!dueSenses(state,'2027-10-29').some(id=>id.startsWith('light-')));
 assert.ok(!state.session.queue.some(task=>task.wordId==='light'));validateState(JSON.parse(JSON.stringify(state)));
});

test('split legacy meanings follow the current sentence, so bias is not confused with prejudice',()=>{
 const word=wordMap.bias,sense=word.senses[0];
 const statistical=sense.examples[0],prejudice=sense.examples[1];
 assert.match(studyMeaning(word,sense,statistical).meaning,/系统偏差/);
 assert.equal(checkMeaning(word,sense,'系统偏差','context',statistical),true);
 assert.equal(checkMeaning(word,sense,'偏差','context',statistical),true);
 assert.equal(checkMeaning(word,sense,'偏倚','context',statistical),true);
 assert.equal(checkMeaning(word,sense,'偏见','context',statistical),false);
 assert.equal(checkMeaning(word,sense,'偏见','context',prejudice),true);
 assert.equal(checkMeaning(word,sense,'系统偏差','context',prejudice),false);
 for(const [round,input,expected]of [[1,'偏见',false],[1,'系统偏差',true],[2,'偏见',true]]){
  const state=initial();state.course='ielts-plus';state.plan.count=100;begin(state,DAY);
  const q=state.session,task=[q.current,...q.queue].find(t=>t.wordId==='bias');assert.ok(task);
  q.current={...task,round};q.stage='listen';q.listenCue='context';markListeningPlayed(state);
  assert.equal(answerListening(state,input).correct,expected);
 }
});

test('old unsubmitted review grades cannot create audio verification without typed input',()=>{
 const state=initial();state.plan.count=1;state.records['bright-adj']={wordId:'bright',level:2,interval:3,due:DAY};begin(state,DAY);
 const q=state.session;assert.equal(q.current.senseId,'bright-adj');delete q.protocol;
 q.stage='detail';q.reviewGrade=4;q.states['bright-adj'].passed=true;q.lastAnswer=true;q.cuePlayed=true;
 const original=structuredClone(state.records['bright-adj']);const restored=validateState(JSON.parse(JSON.stringify(state)));
 assert.equal(restored.session.stage,'review');assert.equal(restored.session.cue,'audio');assert.equal(restored.session.reviewGrade,null);
 assert.equal(continueLearning(restored),false);assert.deepEqual(restored.records['bright-adj'],original);
 assert.equal(restored.session.states['bright-adj'].passed,false);assert.throws(()=>answerReviewMeaning(restored,'明亮'));
 markReviewPlayed(restored);answerReviewMeaning(restored,'明亮');continueLearning(restored);
 assert.equal(restored.records['bright-adj'].audioVerified,true);
});
test('Chinese meaning matching accepts known synonyms and punctuation but not English or negated guesses',()=>{
 const w=wordMap.residential,s=w.senses[0];
 for(const value of ['住宅的',' 住宅的。 ','意思是住宅的','住宅用的','住宅的；居住用的'])assert.equal(checkMeaning(w,s,value),true,value);
 for(const value of ['resident','residential','居民','不是住宅的','住宅的或汽车','住宅的，汽车','住','<script>'])assert.equal(checkMeaning(w,s,value),false,value);
 assert.deepEqual(splitDictionaryGloss('n. 居民 adj. 居住的').map(s=>s.pos),['n.','adj.']);
 for(const value of ['指导','指挥','表示'])assert.equal(normalizeMeaning(value),value);
 const entry={pos:'v.',meaning:'指导'};assert.equal(checkMeaning({id:'fixture'},entry,'导'),false);assert.equal(checkMeaning({id:'fixture'},entry,'指导'),true);
});
test('all vocabulary notes deduplicate by word across relationship categories',()=>{
 for(const w of words)assert.equal(new Set(w.notes.map(n=>normalizedNoteWord(n.word))).size,w.notes.length,w.id);
 assert.equal(wordMap.residential.notes.filter(n=>n.word==='resident').length,1);
 const notes=deduplicateNotes([{type:'词族',word:'Resident',meaning:'居民',difference:'noun'},{type:'形近词',word:' resident ',meaning:'居民',difference:'spelling'}]);
 assert.equal(notes.length,1);assert.deepEqual(notes[0].types,['同词族','形近词']);assert.deepEqual(notes[0].differences,['noun','spelling']);
 assert.deepEqual(deduplicateNotes(notes),notes);
});
test('speech queues word then sentence and cancels stale success callbacks on navigation',()=>{
 const spoken=[],errors=[];let completed=0,cancels=0;
 const synthesis={cancel(){cancels++;},getVoices(){return [{lang:'en-US',name:'test'}];},speak(utterance){spoken.push(utterance);}};
 const speech=createSpeechController({getSynthesis:()=>synthesis,makeUtterance:text=>({text}),onError:error=>errors.push(error)});
 speech.play(['residential','This is a residential area.'],()=>completed++);assert.equal(spoken[0].text,'residential');assert.equal(completed,0);
 spoken[0].onend();assert.equal(spoken[1].text,'This is a residential area.');assert.equal(completed,0);spoken[1].onend();assert.equal(completed,1);
 speech.play('first',()=>completed++);const stale=spoken.at(-1);speech.play('second',()=>completed++);stale.onend();assert.equal(completed,1);
 spoken.at(-1).onerror({error:'not-allowed'});assert.deepEqual(errors,['not-allowed']);spoken.at(-1).onend();assert.equal(completed,1);
 speech.play('third',()=>completed++);const stopped=spoken.at(-1);speech.stop();stopped.onend();assert.equal(completed,1);assert.ok(cancels>=4);
});
