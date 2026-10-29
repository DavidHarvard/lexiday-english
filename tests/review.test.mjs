import {answerReviewCorrect} from './word-learning-helpers.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {words,wordMap,courseMap} from '../dist/data.js';
import {importedInfo,importedIds,importedWords,englishDefinitions} from '../dist/imported-vocabulary.js';
import {scheduleReview} from '../dist/review-schedule.js';
import {initial,begin,answerBare,answerReview,reviewAudio,markReviewPlayed,useReviewText,continueLearning,correctAnswer,validateState,dayLog,dueSenses,remainingWords,excludeKnownWord,restoreKnownWord,activeExample,orderedNewWords,completedWords} from '../dist/engine.js';
import {createArticle,makeQuiz} from '../dist/content.js';
const DAY='2026-10-22',NEXT='2026-10-23';
function due(id='bright'){const s=initial();s.plan.count=1;s.records[wordMap[id].senses[0].id]={wordId:id,level:2,due:DAY,last:'2026-10-21',interval:8,audioVerified:true};begin(s,DAY);assert.equal(s.session.current.wordId,id);return s;}
function clone(s){return validateState(JSON.parse(JSON.stringify(s)));}
test('import keeps all 3610 unique entries and full phrases, without altering existing sense IDs',()=>{
 const report=JSON.parse(readFileSync('data/imports/ielts-import-report.json'));assert.equal(report.unparsed.length,0);assert.equal(report.unique,3610);assert.equal(report.duplicates.length,1);
 assert.equal(importedIds.length,3610);assert.equal(importedInfo.added,3451);assert.equal(words.length,3671);assert.equal(courseMap['ielts-basic'].words.length,3632);
 for(const id of importedIds)assert.ok(courseMap['ielts-basic'].words.includes(id));
 for(const id of ['notice board','ozone layer','in accordance with','vice versa','bring out','fact sheet'])assert.ok(importedIds.includes(id),id);
 assert.ok(wordMap.address.senses.some(s=>s.id==='address-n-2'));assert.equal(Object.keys(englishDefinitions).length,235);
});
test('imported words use enriched reading examples while preserving legacy source and progress IDs',()=>{
 const a=createArticle(['bright','emperor']);assert.equal(a.covered,2);assert.equal(a.total,2);assert.deepEqual(a.missing,[]);assert.equal(createArticle(['emperor']).covered,1);
 const s=initial();assert.throws(()=>makeQuiz(s,{touched:['emperor'],passed:['import:emperor']}));
 for(const w of importedWords){assert.equal(w.senses[0].examples.length,0);assert.ok(w.senses[0].meaning);}
});
test('relations distinguish meaning, spelling and family; related order never enrols unselected words',()=>{
 assert.ok(wordMap.purchase.notes.some(n=>n.type==='近义词'&&n.word==='buy'));assert.ok(wordMap.efficient.notes.some(n=>['同词族','词族'].includes(n.type)&&n.word==='efficiency'));
 assert.ok(wordMap.address.notes.filter(n=>n.type==='近义词'&&n.word==='solve').every(n=>n.difference.includes('问题')));
 const s=initial();s.course='ielts-basic';s.plan.order='family';const sorted=orderedNewWords(s);assert.equal(new Set(sorted).size,remainingWords(s).length);assert.ok(sorted.every(id=>courseMap[s.course].words.includes(id)));
 for(const w of words)for(const n of w.notes.filter(n=>n.difference.startsWith('拼写对比：')))assert.equal(n.type,'形近词');
});
test('unremembered new words survive exit before detail and become next-day reviews',()=>{
 const s=initial();s.plan.count=1;begin(s,DAY);answerBare(s,false);const r=clone(s);assert.equal(r.records['light-n'].pending,true);assert.equal(r.records['light-adj'].due,NEXT);assert.ok(remainingWords(r).includes('light'));begin(r,NEXT);assert.equal(r.session.types.light,'review');assert.equal(r.session.stage,'review');assert.equal(r.session.cue,'audio');
});
test('all four hint levels, submitted state and grade survive refresh',()=>{
 for(const [cue,grade,declines] of [['audio',4,0],['context',3,1],['spelling',2,2],['sentence',1,3]]){
 let s=due();assert.throws(()=>answerReview(s,true));assert.equal(reviewAudio(s),'bright');for(let i=0;i<declines;i++){answerReview(s,false);s=clone(s);}
 assert.equal(s.session.cue,cue);if(cue==='context')assert.match(reviewAudio(s),/bright/i);if(['audio','context'].includes(cue))markReviewPlayed(s);answerReviewCorrect(s);assert.equal(s.session.stage,'detail');assert.equal(s.session.reviewGrade,grade);s=clone(s);continueLearning(s,0);assert.equal(s.records['bright-adj'].grade,grade);assert.ok(s.records['bright-adj'].due>DAY);clone(s);
 }
});
test('failure at last cue stays unpassed and returns tomorrow; correcting a success produces the same schedule',()=>{
 let s=due();for(let i=0;i<4;i++)answerReview(s,false);assert.equal(s.session.reviewGrade,0);continueLearning(s,0);assert.equal(s.records['bright-adj'].due,NEXT);assert.equal(s.records['bright-adj'].pending,true);assert.ok(!dayLog(s,DAY).passed.includes('bright-adj'));assert.ok(!completedWords(s,DAY).includes('bright'));
 s=due();markReviewPlayed(s);answerReviewCorrect(s);assert.equal(correctAnswer(s),true);continueLearning(s,0);assert.equal(s.records['bright-adj'].grade,0);assert.equal(s.records['bright-adj'].due,NEXT);
});
test('text assistance cannot pass a word that has never been verified by audio input',()=>{
 const s=due();s.records['bright-adj'].audioVerified=false;s.session.states['bright-adj'].requiresAudio=true;
 useReviewText(s);answerReviewCorrect(s);assert.equal(s.session.reviewGrade,2);assert.equal(s.session.states['bright-adj'].passed,false);
 continueLearning(s,0);assert.equal(s.records['bright-adj'].pending,true);assert.equal(s.records['bright-adj'].audioVerified,false);assert.equal(s.records['bright-adj'].due,NEXT);
 const t=due();useReviewText(t);answerReviewCorrect(t);assert.equal(t.session.reviewGrade,2);assert.equal(t.session.audioUnavailable,true);
});
test('weights produce bounded increasing intervals without giving longer credit for more hints',()=>{
 for(const interval of [1,2,3,8,30,180]){const all=[0,1,2,3,4].map(g=>scheduleReview({interval},g).interval);assert.equal(all[0],1);assert.deepEqual([...all].sort((a,b)=>a-b),all);assert.ok(all.every(n=>n>=1&&n<=180));}
 assert.equal(scheduleReview({interval:1},4).interval,3);assert.equal(scheduleReview({interval:8},3).interval,13);assert.equal(scheduleReview({interval:8},2).interval,6);assert.equal(scheduleReview({interval:8},1).interval,3);
});
test('known marker removes every sense and pending queue entry; restoring makes it due again',()=>{
 const s=initial();s.plan.count=2;begin(s,DAY);answerBare(s,false);excludeKnownWord(s,'light',DAY);assert.ok(s.knownWords.light);assert.ok(!s.records['light-n']);assert.ok(!s.records['light-adj']);assert.ok(!s.session.queue.some(t=>t.wordId==='light'));assert.notEqual(s.session.current?.wordId,'light');assert.ok(!remainingWords(s).includes('light'));assert.ok(!dueSenses(s,NEXT).includes('light-n'));clone(s);restoreKnownWord(s,'light',DAY);assert.ok(!s.knownWords.light);assert.ok(dueSenses(s,DAY).includes('light-n'));clone(s);
});
test('old progress migrates without losing dates; corrupted new review fields are rejected',()=>{
 const s=initial();delete s.knownWords;s.records['bright-adj']={wordId:'bright',level:3,due:DAY};clone(s);begin(s,DAY);clone(s);const bad=clone(s);bad.session.cue='invented';assert.throws(()=>validateState(bad));s.records['bright-adj'].interval=-1;assert.throws(()=>validateState(s));
});
test('a failed same-day review cannot count as passed, and repeat submissions cannot inflate intervals',()=>{
 const s=due();markReviewPlayed(s);answerReviewCorrect(s);assert.throws(()=>answerReview(s,true));continueLearning(s,0);const saved=s.records['bright-adj'];assert.equal(saved.interval,20);assert.equal(saved.scheduledDay,DAY);assert.equal(continueLearning(s,0),false);assert.equal(s.records['bright-adj'].interval,20);
});
test('restore on the same day clears prior pass suppression and re-enrols active queue safely',()=>{
 const s=due();dayLog(s,DAY).passed.push('bright-adj');excludeKnownWord(s,'bright',DAY);restoreKnownWord(s,'bright',DAY);assert.ok(!dayLog(s,DAY).passed.includes('bright-adj'));assert.ok(s.session.queue.some(t=>t.senseId==='bright-adj'));assert.ok(dueSenses(s,DAY).includes('bright-adj'));clone(s);
});
