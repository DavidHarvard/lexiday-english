import {answerSense} from './word-learning-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {words,wordMap,courseMap} from '../dist/data.js';
import {ieltsWords,ieltsBasicIds,ieltsPlusIds} from '../dist/ielts-vocabulary.js';
import {initial,begin,answerBare,continueLearning,leaveRest,dayLog,validateState,remainingWords} from '../dist/engine.js';
import {createArticle,makeQuiz} from '../dist/content.js';
const DAY='2026-10-22';
test('200 unique IELTS words, 210 senses, 630 examples, 20 topics and five-word groups',()=>{
 assert.equal(ieltsWords.length,200);assert.equal(words.filter(w=>!w.imported).length,220);
 assert.equal(new Set(words.map(w=>w.id)).size,words.length);
 const senses=words.flatMap(w=>w.senses);assert.equal(new Set(senses.map(s=>s.id)).size,senses.length);
 assert.equal(ieltsWords.flatMap(w=>w.senses).length,210);
 assert.equal(new Set(ieltsWords.map(w=>w.topic)).size,20);
 for(const group of new Set(ieltsWords.map(w=>w.group)))assert.equal(ieltsWords.filter(w=>w.group===group).length,5);
 for(const c of Object.values(courseMap))for(const id of c.words)assert.ok(wordMap[id],id);
 assert.equal(ieltsBasicIds.length,100);assert.equal(ieltsPlusIds.length,100);
 assert.equal(new Set([...ieltsBasicIds,...ieltsPlusIds]).size,200);
});
for(const course of ['ielts-basic','ielts-plus'])test(`${course}: complete first 100 curated words, serialize and restore, generate reading and quizzes`,()=>{
 const state=initial();state.course=course;state.plan.count=100;begin(state,DAY);
 let guard=1000;
 while(state.session.stage!=='done'&&guard--){
  if(state.session.stage==='rest')leaveRest(state,Number.MAX_SAFE_INTEGER);
  if(state.session.stage==='bare')answerBare(state,true);
  answerSense(state,true);continueLearning(state,0);
 }
 assert.ok(guard>0);const restored=validateState(JSON.parse(JSON.stringify(state)));
 assert.equal(remainingWords(restored,course).length,courseMap[course].words.length-100);
 const log=dayLog(restored,DAY);assert.equal(log.touched.length,100);
 const article=createArticle(log.touched,log.passed);assert.equal(article.covered,100);assert.equal(article.collection,true);
 // Check every sense as a singleton, avoiding gaps caused by random ten-question sampling.
 for(const id of log.touched)for(const sense of wordMap[id].senses){
  const quiz=makeQuiz(restored,{touched:[id],passed:[sense.id]});
  assert.equal(quiz.questions.length,1);const question=quiz.questions[0];
  assert.equal(question.senseId,sense.id);assert.equal(new Set(question.options).size,4);
  assert.equal(question.options.filter(o=>o===sense.meaning).length,1);
  assert.equal(createArticle([id],[sense.id]).paragraphs[0].senseId,sense.id);
 }
});
test('new multiple meanings do not pass just because detail was shown; original IDs remain usable',()=>{
 const state=initial();state.course='ielts-basic';state.plan.count=5;begin(state,DAY);
 let guard=30;
 while(state.session.current.wordId!=='deposit'&&guard--){if(state.session.stage==='bare')answerBare(state,true);answerSense(state,true);continueLearning(state,0);}
 assert.ok(guard>0);answerBare(state,false);answerSense(state,true);
 const pending=state.session.states['deposit-v-2'];assert.equal(pending.known,0);assert.equal(pending.passed,false);assert.equal(pending.strong,true);
 const copy=validateState(JSON.parse(JSON.stringify(state)));assert.deepEqual(copy.session,state.session);
 const old=initial();old.records['book-n']={wordId:'book',level:1,due:DAY};old.records['book-v']={wordId:'book',level:1,due:DAY};
 const migrated=validateState(JSON.parse(JSON.stringify(old)));assert.deepEqual(migrated.records,old.records);
 assert.ok(!remainingWords(migrated,'starter').includes('book'));assert.ok(!remainingWords(migrated,'middle').includes('book'));
});
test('mixed original and IELTS reading deduplicates words and binds tested senses',()=>{
 const article=createArticle(['light','deposit','address','deposit'],['light-adj','deposit-v-2','address-n-2']);
 assert.equal(article.total,3);assert.equal(article.paragraphs.length,3);
 assert.deepEqual(article.paragraphs.map(p=>p.senseId),['light-adj','deposit-v-2','address-n-2']);
 assert.match(article.subtitle,/例句合集/);
});
