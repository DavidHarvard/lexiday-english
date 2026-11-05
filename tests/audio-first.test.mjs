import test from 'node:test';import assert from 'node:assert/strict';
import {initial,begin,answerListening,activeExample,continueLearning,leaveRest,answerSense,giveUpMemory,validateState,answerReviewMeaning} from '../dist/engine.js';
import {prepareMeaningRequest,meaningResult} from '../server/meaning.js';
import {getWord} from '../dist/personal-words.js';import {meaningAliases} from '../dist/word-content.js';
const day='2026-11-05';const answer=s=>{const q=s.session,w=getWord(s,q.current.wordId),se=w.senses.find(x=>x.id===q.current.senseId);return meaningAliases(w,se,'context',activeExample(s))[0];};
test('new words start with a hidden context prompt, accept early input, and remain scheduled for tomorrow',()=>{
 const s=initial();s.plan.count=1;begin(s,day);assert.equal(s.session.stage,'listen');assert.equal(s.session.listenPlayed,false);answerListening(s,answer(s));assert.equal(s.session.stage,'detail');assert.equal(s.records['light-n'].pending,false);assert.equal(s.records['light-n'].due,'2026-11-06');assert.equal(s.knownWords.light,undefined);assert.equal(s.records['light-adj'],undefined);
});
test('new-word retries rotate the example; after visual help grading uses a different, frozen context across reload',()=>{
 const s=initial();s.plan.count=1;begin(s,day);const first=activeExample(s).en,id=s.session.current.senseId;answerListening(s,'汽车');continueLearning(s,0);let guard=12;
 while(s.session.current.senseId!==id&&guard--){if(s.session.stage==='rest')leaveRest(s,1e15);giveUpMemory(s);continueLearning(s,61000);}assert.ok(guard>0);if(s.session.stage==='rest')leaveRest(s,1e15);assert.equal(s.session.stage,'sentence');const hint=activeExample(s).en;assert.notEqual(hint,first);answerSense(s,true);continueLearning(s,62000);const assessment=activeExample(s).en;assert.notEqual(assessment,hint);assert.notEqual(assessment,first);const restored=validateState(structuredClone(s));assert.equal(activeExample(restored).en,assessment);
 const q=restored.session,t=q.current,p=prepareMeaningRequest({...t,input:answer(restored)});assert.equal(p.sentence,assessment);assert.equal(p.exampleIndex,t.exampleIndex);assert.equal(answerListening(restored,answer(restored),{semantic:meaningResult(p,'correct','semantic')}).correct,true);
});
test('review answers also submit before ended; the next review chooses another available example',()=>{
 const s=initial();s.plan.count=1;s.records['bright-adj']={wordId:'bright',level:1,due:day,lastExampleIndex:0};begin(s,day);assert.equal(s.session.current.wordId,'bright');assert.equal(s.session.current.exampleIndex,1);assert.equal(s.session.cuePlayed,false);answerReviewMeaning(s,answer(s));continueLearning(s,0);assert.equal(s.records['bright-adj'].pending,false);assert.equal(s.records['bright-adj'].lastExampleIndex,1);
});
test('old bare-word sessions migrate without answering on behalf of the learner or erasing history',()=>{
 const s=initial();s.plan.count=1;begin(s,day);s.session.stage='bare';delete s.session.audioFirstVersion;delete s.session.current.exampleIndex;s.wordNotes={light:[{id:'kept',text:'Keep this note',day,createdAt:'2026-11-05T00:00:00.000Z'}]};const restored=validateState(structuredClone(s));assert.equal(restored.session.stage,'listen');assert.equal(restored.session.current.exampleIndex,0);assert.equal(restored.session.states['light-n'].passed,false);assert.equal(restored.records['light-n'],undefined);assert.equal(restored.wordNotes.light[0].text,'Keep this note');
});

test('two-example entries rotate audio on new-word retries instead of repeatedly testing the first context',()=>{
 const s=initial();s.plan.count=1;begin(s,day);const id=s.session.current.senseId,st=s.session.states[id];
 const word={id:'reading:beacon',word:'beacon',notes:[],senses:[{id:'reading:beacon:1',pos:'n.',meaning:'信标',examples:[{en:'The beacon guides ships into the harbour.',zh:'信标指引船只进入港口。'},{en:'We saw the beacon on the coast.',zh:'我们看到了海岸上的信标。'}]}]};
 s.customWords={[word.id]:word};Object.assign(s.session,{current:{wordId:word.id,senseId:word.senses[0].id,round:1,exampleIndex:0},states:{[word.senses[0].id]:{...st,lastAudioExample:0}},types:{[word.id]:'new'},queue:[],bareDone:{[word.id]:true}});
 answerListening(s,'汽车');continueLearning(s,0);leaveRest(s,1e15);answerSense(s,true);continueLearning(s,62000);assert.equal(s.session.current.exampleIndex,1);
 answerListening(s,'汽车');continueLearning(s,63000);leaveRest(s,1e15);answerSense(s,true);continueLearning(s,130000);assert.equal(s.session.current.exampleIndex,0);
});

