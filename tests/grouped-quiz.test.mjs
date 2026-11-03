import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,begin,dayLog,validateState} from '../dist/engine.js';
import {wordMap} from '../dist/data.js';
import {fallbackPractice,quizFromPractice} from '../dist/listening-practice.js';
import {quizGroup,selectQuizOption,submitQuizGroup,nextQuizGroup,quizLookahead} from '../dist/quiz-session.js';
import {speechAssets} from '../dist/speech-assets.js';
import {speechChunks} from '../dist/speech.js';
import fs from 'node:fs';
const day='2026-11-03';
function fixture(){const state=initial(),log=dayLog(state,day),targets=['furnished','residential','lease','deposit','commute'].map(wordId=>({wordId,senseId:wordMap[wordId].senses[0].id}));log.touched=targets.map(t=>t.wordId);log.passed=targets.map(t=>t.senseId);const pack=fallbackPractice(state,targets),quiz=quizFromPractice(pack,state,log);log.quiz=quiz;return {state,pack,quiz,log};}
test('one passage submits three English answers even if audio never completes; drafts survive reload',()=>{
 const {state,quiz}=fixture();assert.equal(quizGroup(quiz).length,3);assert.equal(quiz.played,false);assert.throws(()=>submitQuizGroup(quiz),/每一道/);
 for(const {question,index} of quizGroup(quiz)){assert.ok(question.options.every(s=>!/[\u3400-\u9fff]/.test(s)));selectQuizOption(quiz,index,question.options.indexOf(question.meaning));}
 const restored=validateState(structuredClone(state)).days[day].quiz;const answers=submitQuizGroup(restored);assert.equal(answers.length,3);assert.ok(answers.every(a=>a.correct&&!a.assisted));assert.equal(restored.played,false);assert.equal(submitQuizGroup(restored).length,0);nextQuizGroup(restored);assert.equal(restored.index,3);assert.equal(restored.optionsVisible,false);
});
test('look-ahead includes current and following passages; published fixed audio is valid non-silent PCM',()=>{
 const {pack,quiz}=fixture(),texts=quizLookahead(quiz);assert.ok(texts.includes(pack.passages[1].questions[1].spokenPrompt));assert.ok(!texts.includes(pack.passages[2].questions[1].spokenPrompt));
 for(const p of pack.passages)for(const text of [p.audioParts[0],p.audioParts[2],...p.questions.slice(0,2).map(q=>q.spokenPrompt)].flatMap(t=>speechChunks(t))){assert.ok(speechAssets[text],text);const bytes=fs.readFileSync(new URL('../dist'+speechAssets[text],import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');assert.ok(bytes.length>1000);let peak=0;for(let i=100;i+1<bytes.length;i+=2)peak=Math.max(peak,Math.abs(bytes.readInt16LE(i)));assert.ok(peak>500);}
});
test('an extra batch preserves the daily plan, prior progress and future reviews',()=>{
 const s=initial();s.plan.count=2;begin(s,day);const previous=[s.session.current,...s.session.queue],log=dayLog(s,day);log.newWords=[...new Set(previous.map(t=>t.wordId))];
 for(const task of previous){s.records[task.senseId]={wordId:task.wordId,level:1,due:'2026-11-04',audioVerified:true};log.passed.push(task.senseId);}s.session.stage='done';const plan=structuredClone(s.plan),records=structuredClone(s.records),passed=[...log.passed];
 begin(s,day,2);const tasks=[s.session.current,...s.session.queue];assert.equal(new Set(tasks.map(t=>t.wordId)).size,2);assert.ok(tasks.every(t=>!previous.some(p=>p.wordId===t.wordId)));assert.deepEqual(s.plan,plan);assert.deepEqual(s.records,records);assert.deepEqual(log.passed,passed);assert.notEqual(validateState(structuredClone(s)).session.stage,'done');
});
