import {validateBookState} from './grammar-reader-model.js';
import {validateUnit1} from './unit1-model.js';
import {GRAMMAR_RETRY} from './grammar-retry-data.js';
import {GRAMMAR_LESSONS as lessons, GRAMMAR_UNITS as units} from './grammar-data.js';
export {lessons,units};
export const questionMap=Object.fromEntries(lessons.flatMap(l=>[...l.practice.map(q=>({...q,type:'lesson'})),{...l.exam,type:'exam'},...GRAMMAR_RETRY[l.id].map((q,i)=>({...q,type:i%3===2?'exam':'lesson'}))].map(q=>[q.id,{...q,lessonId:l.id}])));
export const lessonMap=Object.fromEntries(lessons.map(l=>[l.id,l]));
export function initialGrammar(){return {version:1,view:'home',cursor:{type:'lesson',id:lessons[0].id},lessons:{},exams:{},mistakes:{}};}
export function lessonRecord(s,id){if(!lessonMap[id])throw Error('课程不存在。');return s.lessons[id]??={step:0,passed:false,attempts:[],session:null};}
export function unitReady(s,id){const i=units.findIndex(u=>u.id===id);return i>=0&&lessons.filter(l=>l.unit===i).every(l=>s.lessons[l.id]?.passed);}
export const QUESTION_SETS=3;
export function questionsFor(type,id,round=0){
 if(!Number.isSafeInteger(round)||round<0)throw Error('练习轮次无效。');
 const set=round%QUESTION_SETS;
 const forLesson=l=>set===0?l.practice:GRAMMAR_RETRY[l.id].slice((set-1)*3,(set-1)*3+2);
 const forExam=l=>set===0?l.exam:GRAMMAR_RETRY[l.id][(set-1)*3+2];
 if(type==='lesson'){if(!lessonMap[id])throw Error('课程不存在。');return forLesson(lessonMap[id]);}
 if(type!=='exam')throw Error('练习类型无效。');
 const i=units.findIndex(u=>u.id===id);if(i<0)throw Error('阶段不存在。');return lessons.filter(l=>l.unit===i).map(forExam);
}
export function newSession(type,id,round=0){return {round,questions:questionsFor(type,id,round).map(q=>q.id),index:0,choice:null,answers:[],finished:false};}
export function openLesson(s,id){lessonRecord(s,id);s.cursor={type:'lesson',id};s.view='lesson';}
export function openExam(s,id){if(!unitReady(s,id))throw Error('请先通过本阶段四节随堂练习。');s.exams[id]??={passed:false,attempts:[],session:newSession('exam',id)};s.cursor={type:'exam',id};s.view='exam';}
export function activeRecord(s){return s.cursor.type==='lesson'?lessonRecord(s,s.cursor.id):s.exams[s.cursor.id];}
export function startPractice(s){const r=activeRecord(s);if(s.cursor.type==='lesson'&&r.step<2)throw Error('请先完成本节讲解。');r.session??=newSession(s.cursor.type,s.cursor.id);}
export function choose(s,index){const x=activeRecord(s)?.session;if(!x||x.finished||x.answers.length>x.index)throw Error('这道题已提交。');const q=questionMap[x.questions[x.index]];if(!Number.isInteger(index)||index<0||index>=q.options.length)throw Error('请选择有效选项。');x.choice=index;}
export function submit(s){const r=activeRecord(s),x=r?.session;if(!x||x.finished||x.answers.length>x.index)throw Error('这道题已提交。');if(x.choice===null)throw Error('请先选择一个答案。');const q=questionMap[x.questions[x.index]],correct=x.choice===q.answer;x.answers.push({qid:q.id,choice:x.choice,correct});if(!correct)s.mistakes[q.id]={count:(s.mistakes[q.id]?.count||0)+1,resolved:false};else if(s.mistakes[q.id])s.mistakes[q.id].resolved=true;return correct;}
export function advance(s){const r=activeRecord(s),x=r?.session;if(!x||x.finished||x.answers.length!==x.index+1)throw Error('请先提交答案。');if(x.index<x.questions.length-1){x.index++;x.choice=null;return;}x.finished=true;const score=x.answers.filter(a=>a.correct).length,pass=score>=(s.cursor.type==='lesson'?x.questions.length:Math.ceil(x.questions.length*.75));r.passed=r.passed||pass;r.attempts.push({score,total:x.questions.length,passed:pass,at:new Date().toISOString()});r.attempts=r.attempts.slice(-100);}
export function retry(s){const r=activeRecord(s);if(!r?.session?.finished)throw Error('请先完成本轮练习。');r.session=newSession(s.cursor.type,s.cursor.id,(r.session.round??0)+1);}
export function nextTarget(s){for(const [i,u] of units.entries()){const next=lessons.find(l=>l.unit===i&&!s.lessons[l.id]?.passed);if(next)return {type:'lesson',id:next.id};if(!s.exams[u.id]?.passed)return {type:'exam',id:u.id};}return null;}
export function validateGrammar(s){validateUnit1(s?.unit1);validateBookState(s?.pdfBook);if(s?.grammarTab!==undefined&&!['book','unit1','legacy'].includes(s.grammarTab))throw Error('语法界面记录无效。');const fail=()=>{throw Error('语法备份格式不正确，现有进度未替换。');};const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);if(!obj(s)||s.version!==1||!['home','lesson','exam','mistakes'].includes(s.view)||!obj(s.cursor)||!['lesson','exam'].includes(s.cursor.type))fail();try{questionsFor(s.cursor.type,s.cursor.id);}catch{fail();}for(const key of ['lessons','exams','mistakes'])if(!obj(s[key]))fail();for(const [type,records] of [['lesson',s.lessons],['exam',s.exams]])for(const [id,r] of Object.entries(records)){let qs;try{qs=questionsFor(type,id,r?.session?.round??0).map(q=>q.id);}catch{fail();}if(!obj(r)||typeof r.passed!=='boolean'||!Array.isArray(r.attempts)||r.attempts.length>100)fail();if(type==='lesson'&&(!Number.isInteger(r.step)||r.step<0||r.step>2))fail();for(const a of r.attempts)if(!obj(a)||a.total!==qs.length||!Number.isInteger(a.score)||a.score<0||a.score>a.total||typeof a.passed!=='boolean'||a.passed!==(a.score>=(type==='lesson'?qs.length:Math.ceil(qs.length*.75)))||typeof a.at!=='string')fail();if(r.passed&&!r.attempts.some(a=>a.passed))fail();const x=r.session;if(x!==null){if(!obj(x)||('round' in x&&(!Number.isSafeInteger(x.round)||x.round<0))||JSON.stringify(x.questions)!==JSON.stringify(qs)||!Number.isInteger(x.index)||x.index<0||x.index>=qs.length||typeof x.finished!=='boolean'||!Array.isArray(x.answers)||(x.choice!==null&&(!Number.isInteger(x.choice)||x.choice<0||x.choice>=questionMap[qs[x.index]].options.length)))fail();if(x.answers.length!==x.index&&x.answers.length!==x.index+1)fail();for(const [i,a]of x.answers.entries()){const q=questionMap[qs[i]];if(!obj(a)||a.qid!==q.id||!Number.isInteger(a.choice)||a.choice<0||a.choice>=q.options.length||a.correct!==(a.choice===q.answer))fail();}if(x.finished&&(x.answers.length!==qs.length||x.index!==qs.length-1))fail();}}
for(const[id,m]of Object.entries(s.mistakes))if(!questionMap[id]||!obj(m)||!Number.isInteger(m.count)||m.count<1||typeof m.resolved!=='boolean')fail();if(s.view==='lesson'&&!s.lessons[s.cursor.id]||s.view==='exam'&&(!s.exams[s.cursor.id]||!unitReady(s,s.cursor.id)))fail();return s;}
