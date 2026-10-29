import {validateReadingArticle} from './reading-model.js';
import {scheduleReview} from './review-schedule.js';
import {wordMap,courseMap} from './data.js';
import {examplesForSense,studyMeaning,checkMeaning,spokenWord} from './word-content.js';
export const LEARNING_PROTOCOL='typed-audio-v1';
export const localDay=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function addDays(day,n){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return localDay(d)}
export function initial(){return {version:1,course:'starter',plan:{count:5,mode:'count',target:'',paused:false,order:'source'},records:{},knownWords:{},unknownSenses:{},days:{},session:null};}
export function dayLog(state,day=localDay()){return state.days[day]??={newWords:[],reviewWords:[],touched:[],passed:[],quiz:null,article:null};}
export function remainingWords(state,course=state.course){return courseMap[course].words.filter(id=>!state.knownWords?.[id]&&wordMap[id].senses.some(s=>!state.records[s.id]?.level||state.records[s.id]?.pending));}
export function dueSenses(state,day=localDay()){return Object.entries(state.records).filter(([,r])=>r.due<=day&&!state.knownWords?.[r.wordId]).map(([id])=>id);}
export function plannedCount(state,day=localDay()){if(state.plan.mode!=='date')return state.plan.count;const days=Math.max(1,Math.round((new Date(state.plan.target+'T12:00:00')-new Date(day+'T12:00:00'))/86400000)+1);const completedToday=dayLog(state,day).newWords.filter(id=>courseMap[state.course].words.includes(id)&&wordMap[id].senses.every(s=>state.records[s.id]?.level&&!state.records[s.id]?.pending)).length;return Math.max(1,Math.ceil((remainingWords(state).length+completedToday)/days));}
export function projectedFinish(state,day=localDay()){const remaining=remainingWords(state),count=plannedCount(state,day),l=dayLog(state,day);const inProgress=l.newWords.filter(id=>remaining.includes(id)).length;const capacity=Math.max(0,count-l.newWords.length)+inProgress;return addDays(day,Math.max(0,Math.ceil((remaining.length-capacity)/count)));}
export function dailyStats(state,day=localDay()){const l=dayLog(state,day);return {new:l.newWords.length,review:l.reviewWords.length,passed:l.passed.length,touched:l.touched.length,due:dueSenses(state,day).length};}
function senseState(state,id){return {strong:!!(state.unknownSenses?.[id]||state.records[id]?.everUnknown||state.records[id]?.weak),known:0,passed:false,lastRound:0,requiresAudio:!state.records[id]?.audioVerified};}
export function begin(state,day=localDay()){
 if(state.plan.paused)throw new Error('计划已暂停，请先恢复计划。');
 if(state.session?.day===day&&state.session.stage!=='done')return state.session;
 const log=dayLog(state,day);const due=new Set(dueSenses(state,day));
 const tasks=[];const types={};const states={};
 // Due review spans courses because progress belongs to meanings, not books.
 const review=Object.values(wordMap).filter(w=>w.senses.some(s=>due.has(s.id)));
 review.sort(()=>Math.random()-.5);
 for(const w of review){types[w.id]='review';for(const se of w.senses.filter(s=>due.has(s.id))){if(log.passed.includes(se.id))continue;states[se.id]=senseState(state,se.id);tasks.push({wordId:w.id,senseId:se.id,round:1});}}
 const allowance=Math.max(0,plannedCount(state,day)-log.newWords.length);
 const unfinished=log.newWords.filter(id=>!state.knownWords?.[id]&&wordMap[id].senses.some(s=>!state.records[s.id]?.level||state.records[s.id]?.pending)&&!types[id]);
 const fresh=[...unfinished,...orderedNewWords(state).filter(id=>!log.newWords.includes(id)&&!types[id]).slice(0,allowance)];
 for(const id of fresh){types[id]='new';for(const se of wordMap[id].senses.filter(s=>!state.records[s.id]?.level||state.records[s.id]?.pending)){states[se.id]=senseState(state,se.id);tasks.push({wordId:id,senseId:se.id,round:1});}}
 // Keep adjacent new-word groups, but rotate meanings to avoid same-word repetition.
 state.session={protocol:LEARNING_PROTOCOL,day,course:state.course,queue:tasks,states,types,bareDone:{},stage:'done',current:null,lastWord:null,round:1};
 next(state,0);return state.session;
}
export function next(state,now=Date.now()){
 const q=state.session; q.snapshot=null;q.lastAnswer=null;q.reviewGrade=null;q.cuePlayed=false;q.listenPlayed=false;q.listenDraft='';q.listenVerdict=null;q.audioUnavailable=false;q.meaningFeedback='';
 q.queue=q.queue.filter(t=>!q.states[t.senseId].passed);
 if(!q.queue.length){q.stage='done';q.current=null;return;}
 let idx=q.queue.findIndex(t=>t.wordId!==q.lastWord);if(idx<0)idx=0;
 const task=q.queue.splice(idx,1)[0];q.current=task;q.round=Math.max(q.round,task.round);
 const w=wordMap[task.wordId];const log=dayLog(state,q.day);
 if(!log.touched.includes(w.id)){log.touched.push(w.id);log.article=null;if(log.quiz){(log.quizHistory??=[]).push(log.quiz);log.quiz=null;}}
 const list=q.types[w.id]==='new'?log.newWords:log.reviewWords;if(!list.includes(w.id))list.push(w.id);
 if(q.lastWord===w.id){q.stage='rest';q.readyAt=now+8000;return;}
 setTestStage(q);
}
export function leaveRest(state,now=Date.now()){const q=state.session;if(q.stage!=='rest'||now<q.readyAt)return false;setTestStage(q);return true;}
export function answerBare(state,known){const q=state.session;if(q?.stage!=='bare')throw new Error('当前不是裸词自测。');const id=q.current.wordId;q.bareDone[id]=true;q.bareAnswer=known;
 if(!known)for(const se of wordMap[id].senses)if(q.states[se.id]){q.states[se.id].strong=true;q.states[se.id].passed=false;(state.unknownSenses??={})[se.id]=true;persistUnknown(state,id,se.id,q.day);}
 q.stage='sentence';
}
export function answerSense(state,known){const q=state.session;if(q?.stage!=='sentence')throw new Error('当前不是例句自测。');const task=q.current;const st=q.states[task.senseId];q.snapshot=structuredClone(st);q.lastAnswer=known;
 if(!known){st.strong=true;st.passed=false;(state.unknownSenses??={})[task.senseId]=true;persistUnknown(state,task.wordId,task.senseId,q.day);}
 // Visual self-assessment prepares learning; only the typed audio check can earn a pass.
 q.stage='detail';
}
export function correctAnswer(state){const q=state.session;if(!['detail','result'].includes(q?.stage)||q.lastAnswer!==true)return false;q.states[q.current.senseId]={...q.snapshot,strong:true,passed:false};q.lastAnswer=false;if(q.listenVerdict)q.listenVerdict.correct=false;(state.unknownSenses??={})[q.current.senseId]=true;persistUnknown(state,q.current.wordId,q.current.senseId,q.day);if(q.types[q.current.wordId]==='review')q.reviewGrade=0;return true;}
export function continueLearning(state,now=Date.now()){
 const q=state.session;if(!['detail','result'].includes(q?.stage))return false;const t=q.current;const st=q.states[t.senseId];
 if(q.stage==='detail'&&q.types[t.wordId]!=='review'){
  q.stage='listen';q.listenCue=t.round>1&&activeExample(state)?'context':'word';q.listenPlayed=false;q.listenDraft='';q.listenVerdict=null;q.meaningFeedback='';return true;
 }
 if(q.types[t.wordId]!=='review'&&q.stage!=='result')return false;
 if(q.types[t.wordId]==='review'&&q.reviewGrade!==null&&q.reviewGrade!==undefined){
  const old=state.records[t.senseId];
  if(old?.scheduledDay!==q.day){const result=scheduleReview(old,q.reviewGrade);if(!st.passed)result.interval=1;state.records[t.senseId]={...old,wordId:t.wordId,level:Math.min(6,(old?.level||0)+(q.reviewGrade>=3?1:0))||1,last:q.day,due:addDays(q.day,result.interval),weak:q.reviewGrade<3,everUnknown:!!state.unknownSenses?.[t.senseId],pending:!st.passed,audioVerified:!!old?.audioVerified||q.reviewGrade>=3,scheduledDay:q.day,...result};}
  const log=dayLog(state,q.day);(log.reviewResults??=[]).push({senseId:t.senseId,grade:q.reviewGrade,cue:q.cue,at:new Date(now).toISOString()});if(st.passed&&!log.passed.includes(t.senseId))log.passed.push(t.senseId);
 } else if(st.passed){const old=state.records[t.senseId];const level=Math.min(6,(old?.pending?0:old?.level||0)+1);state.records[t.senseId]={wordId:t.wordId,level,due:addDays(q.day,1),last:q.day,interval:1,pending:false,audioVerified:true,weak:st.strong,everUnknown:!!state.unknownSenses?.[t.senseId]};const log=dayLog(state,q.day);if(!log.passed.includes(t.senseId))log.passed.push(t.senseId);}
 else q.queue.push({...t,round:t.round+1});
 q.lastWord=t.wordId;next(state,now);return true;
}
export function activeExample(state){const t=state.session.current,w=wordMap[t.wordId],sense=w.senses.find(s=>s.id===t.senseId),examples=examplesForSense(w,sense);return examples[(t.round-1)%examples.length]||null;}
export function listeningAudio(state){const q=state.session;if(q?.stage!=='listen')return '';const word=wordMap[q.current.wordId];return q.listenCue==='context'?(activeExample(state)?.en||spokenWord(word)):spokenWord(word);}
export function markListeningPlayed(state){if(state.session?.stage==='listen')state.session.listenPlayed=true;}
export function setListeningCue(state,cue){const q=state.session;if(q?.stage!=='listen'||!['word','context'].includes(cue)||cue==='context'&&!activeExample(state))return false;q.listenCue=cue;q.listenPlayed=false;q.meaningFeedback='';return true;}
export function setMeaningDraft(state,text){const q=state.session;if(!['listen','review'].includes(q?.stage))return;const value=String(text??'');if(value.length>200||/[<>]/.test(value))throw Error('中文释义最多 200 字，请勿输入 HTML 符号。');q.listenDraft=value;}
export function answerListening(state,input,{unknown=false}={}){
 const q=state.session;if(q?.stage!=='listen')throw Error('当前不是听音输入验证。');
 const text=String(input??'').trim();if(!unknown&&(!q.listenPlayed||!text))throw Error(!q.listenPlayed?'请先完整听一遍，再输入中文释义。':'请先输入中文释义，或选择“没听懂 / 不知道”。');
 if(text.length>200||/[<>]/.test(text))throw Error('中文释义格式无效。');
 const t=q.current,w=wordMap[t.wordId],sense=w.senses.find(s=>s.id===t.senseId),st=q.states[t.senseId];
 const correct=!unknown&&checkMeaning(w,sense,text,q.listenCue,activeExample(state));
 q.snapshot=structuredClone(st);q.lastAnswer=correct;q.listenDraft=text;q.listenVerdict={correct,input:text,cue:q.listenCue,round:t.round};
 if(correct&&t.round>st.lastRound){st.known++;st.lastRound=t.round;st.passed=st.known>=(st.strong?3:1);st.requiresAudio=false;}
 if(!correct){st.strong=true;st.passed=false;(state.unknownSenses??={})[t.senseId]=true;persistUnknown(state,t.wordId,t.senseId,q.day);}
 q.stage='result';return q.listenVerdict;
}
export function listeningUnavailable(state){const q=state.session;if(q?.stage==='listen'){q.audioUnavailable=true;q.listenPlayed=false;}return false;}
export function completedWords(state,day=localDay()){const log=dayLog(state,day);return log.touched.filter(id=>wordMap[id].senses.every(s=>log.passed.includes(s.id)||(state.records[s.id]?.due>day&&!state.records[s.id]?.pending)));}
export function quizMistake(state,senseId,day=localDay()){const r=state.records[senseId];if(r&&!state.knownWords?.[r.wordId]){r.due=addDays(day,1);r.interval=1;r.grade=0;r.weak=true;}}
export function validateState(value){
 function safe(v){if(typeof v==='string'&&/[<>]/.test(v))throw new Error('备份包含无效文本。');if(v&&typeof v==='object')for(const [k,x]of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))throw new Error('备份包含无效字段。');safe(x);}}safe(value);
 if(!value||value.version!==1||!courseMap[value.course]||!value.plan||!Number.isInteger(value.plan.count)||value.plan.count<1||value.plan.count>100||!['count','date'].includes(value.plan.mode)||!value.records||!value.days)throw new Error('备份格式不正确。');
 const all=new Set(Object.values(wordMap).flatMap(w=>w.senses.map(s=>s.id)));
 for(const [id,r]of Object.entries(value.records))if(!all.has(id)||!wordMap[r.wordId]?.senses.some(s=>s.id===id)||!Number.isInteger(r.level)||r.level<1||r.level>6||!/^\d{4}-\d{2}-\d{2}$/.test(r.due))throw new Error('学习记录无效。');
 if(value.knownWords!==undefined&&(!value.knownWords||Array.isArray(value.knownWords)||typeof value.knownWords!=='object'))throw Error('熟知词标记无效。');
 for(const [id,k] of Object.entries(value.knownWords||{}))if(!wordMap[id]||!k||typeof k.at!=='string')throw Error('熟知词标记无效。');
 for(const r of Object.values(value.records))if((r.interval!==undefined&&(!Number.isInteger(r.interval)||r.interval<1||r.interval>180))||(r.grade!==undefined&&(!Number.isInteger(r.grade)||r.grade<0||r.grade>4))||(r.pending!==undefined&&typeof r.pending!=='boolean'))throw Error('复习间隔无效。');
 if(value.session?.stage==='review'&&(!['audio','context','spelling','sentence'].includes(value.session.cue)||value.session.types[value.session.current?.wordId]!=='review'))throw Error('复习步骤无效。');
 if(value.session?.reviewGrade!=null&&(!Number.isInteger(value.session.reviewGrade)||value.session.reviewGrade<0||value.session.reviewGrade>4))throw Error('复习评级无效。');
 if(value.session){const q=value.session;if(!courseMap[q.course]||!/^\d{4}-\d{2}-\d{2}$/.test(q.day))throw new Error('会话日期或课程无效。');if(!['bare','sentence','detail','rest','done','review','listen','result'].includes(q.stage)||!Array.isArray(q.queue)||!q.states||!q.types||!q.bareDone)throw new Error('练习进度无效。');if(q.stage!=='done'&&!q.current)throw new Error('缺少当前卡片。');for(const st of Object.values(q.states))if(typeof st.strong!=='boolean'||typeof st.passed!=='boolean'||!Number.isInteger(st.known)||st.known<0||!Number.isInteger(st.lastRound)||(st.requiresAudio!==undefined&&typeof st.requiresAudio!=='boolean'))throw new Error('词义状态无效。');for(const t of [...q.queue,...(q.current?[q.current]:[])])if(!wordMap[t.wordId]?.senses.some(s=>s.id===t.senseId)||!q.states[t.senseId]||!Number.isInteger(t.round)||t.round<1)throw new Error('练习卡片无效。');
  if(q.protocol!==undefined&&q.protocol!==LEARNING_PROTOCOL)throw Error('学习流程版本无效。');
  if(['listen','result'].includes(q.stage)&&(q.types[q.current.wordId]!=='new'||!['word','context'].includes(q.listenCue)))throw Error('听音验证步骤无效。');
  for(const key of ['listenPlayed','cuePlayed','audioUnavailable'])if(q[key]!==undefined&&typeof q[key]!=='boolean')throw Error('听音状态无效。');
  if(q.listenDraft!==undefined&&(typeof q.listenDraft!=='string'||q.listenDraft.length>200))throw Error('输入释义无效。');
  if(q.listenVerdict!=null&&(typeof q.listenVerdict.correct!=='boolean'||typeof q.listenVerdict.input!=='string'||q.listenVerdict.input.length>200||!['word','context'].includes(q.listenVerdict.cue)||q.listenVerdict.round!==q.current?.round))throw Error('听音结果无效。');
  if(q.stage==='result'&&!q.listenVerdict)throw Error('缺少听音结果。');
  if(!q.protocol){
   q.protocol=LEARNING_PROTOCOL;
   // Keep completed records. Active unverified new-word counters must now pass audio input.
   for(const task of [...q.queue,...(q.current?[q.current]:[])]){const st=q.states[task.senseId];st.requiresAudio=!value.records[task.senseId]?.audioVerified;if(q.types[task.wordId]==='new'){st.known=0;st.lastRound=0;st.passed=false;}}
   if(q.current&&q.types[q.current.wordId]==='review'&&q.stage==='detail'){
    // An old self-assessed grade is not evidence of a typed answer under this protocol.
    q.states[q.current.senseId].passed=false;q.reviewGrade=null;q.stage='review';q.cue='audio';
   }
   q.snapshot=null;q.lastAnswer=null;q.listenPlayed=false;q.listenDraft='';q.listenVerdict=null;q.cuePlayed=false;
  }
 }
 for(const record of Object.values(value.records))if(record.audioVerified!==undefined&&typeof record.audioVerified!=='boolean')throw Error('听音验证记录无效。');
 for(const [day,l] of Object.entries(value.days)){if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!['newWords','reviewWords','touched','passed'].every(k=>Array.isArray(l[k])))throw new Error('日期记录无效。');for(const k of ['newWords','reviewWords','touched'])if(l[k].some(id=>!wordMap[id]))throw new Error('词汇记录无效。');if(l.passed.some(id=>!all.has(id)))throw new Error('词义记录无效。');if(l.article){if(l.article.version===2)validateReadingArticle(l.article);else if(!Array.isArray(l.article.paragraphs)||l.article.paragraphs.some(p=>!wordMap[p.wordId]?.senses.some(s=>s.id===p.senseId)))throw new Error('阅读记录无效。');}if(l.quizHistory&&(!Array.isArray(l.quizHistory)||l.quizHistory.some(q=>!Array.isArray(q.answers))))throw new Error('历史测验记录无效。');if(l.quiz&&(!Array.isArray(l.quiz.questions)||!Array.isArray(l.quiz.answers)||!Number.isInteger(l.quiz.index)||l.quiz.index<0||l.quiz.index>l.quiz.questions.length||l.quiz.questions.some(q=>!wordMap[q.wordId]?.senses.some(s=>s.id===q.senseId)||!Array.isArray(q.options)||q.options.length!==4||!q.options.includes(q.meaning))))throw new Error('测验记录无效。');}
 return value;
}

function persistUnknown(state,wordId,senseId,day){
 if(state.knownWords?.[wordId])return;
 const old=state.records[senseId],due=addDays(day,1);
 state.records[senseId]={...old,wordId,level:old?.level||1,last:old?.last||day,due:old?.due&&old.due<due?old.due:due,interval:1,pending:old?.pending??!old?.level,weak:true,everUnknown:true};
}
function setTestStage(q){if(q.types[q.current.wordId]==='review'){q.stage='review';q.cue='audio';q.cuePlayed=false;}else q.stage=!q.bareDone[q.current.wordId]?'bare':'sentence';}
export function reviewAudio(state){const q=state.session;if(q?.stage!=='review')return '';const w=wordMap[q.current.wordId];if(q.cue==='audio')return spokenWord(w);if(q.cue==='context')return activeExample(state)?.en||'';return '';}
export function markReviewPlayed(state){const q=state.session;if(q?.stage==='review'&&['audio','context'].includes(q.cue))q.cuePlayed=true;}
export function answerReview(state,known){
 const q=state.session;if(q?.stage!=='review')throw Error('当前不是到期复习。');
 if(known)throw Error('请通过输入中文释义验证，不能直接选择认识。');
 const w=wordMap[q.current.wordId],se=w.senses.find(s=>s.id===q.current.senseId),ex=activeExample(state);
 if(!known&&q.cue!=='sentence'){
  q.cue=q.cue==='audio'?(ex?'context':'spelling'):q.cue==='context'?'spelling':'sentence';q.cuePlayed=false;q.listenDraft='';
  if(q.cue==='sentence'&&!ex)return finishReview(state,0);
  return;
 }
 return finishReview(state,known?{audio:4,context:3,spelling:2,sentence:1}[q.cue]:0);
}
export function answerReviewMeaning(state,input){
 const q=state.session;if(q?.stage!=='review')throw Error('当前不是到期复习。');const value=String(input??'').trim();
 if(!value||value.length>200||/[<>]/.test(value))throw Error('请填写有效的中文释义，或选择“没听懂 / 不知道”。');
 if(['audio','context'].includes(q.cue)&&!q.cuePlayed)throw Error('请先完整听一遍，再输入中文释义。');
 const w=wordMap[q.current.wordId],sense=w.senses.find(s=>s.id===q.current.senseId);
 q.listenDraft=value;
 if(checkMeaning(w,sense,value,['context','sentence'].includes(q.cue)?'context':'word',activeExample(state)))return finishReview(state,{audio:4,context:3,spelling:2,sentence:1}[q.cue]);
 answerReview(state,false);q.meaningFeedback='输入释义未匹配本次词义，继续下一步提示。';return false;
}
function finishReview(state,grade){const q=state.session,st=q.states[q.current.senseId];q.snapshot=structuredClone(st);q.reviewGrade=grade;q.lastAnswer=grade>0;st.passed=grade>0&&(!st.requiresAudio||grade>=3);if(grade>=3)st.requiresAudio=false;if(!st.passed)(state.unknownSenses??={})[q.current.senseId]=true;q.stage='detail';return st.passed;}
export function useReviewText(state){const q=state.session;if(q?.stage==='review'&&['audio','context'].includes(q.cue)){q.cue='spelling';q.cuePlayed=false;q.audioUnavailable=true;}}
export function excludeKnownWord(state,wordId,day=localDay()){
 if(!wordMap[wordId])throw Error('单词不存在。');(state.knownWords??={})[wordId]={at:day};
 const todayLog=dayLog(state,day);if(!wordMap[wordId].senses.some(s=>todayLog.passed.includes(s.id))){for(const key of ['newWords','reviewWords','touched'])todayLog[key]=todayLog[key].filter(id=>id!==wordId);todayLog.article=null;}
 for(const s of wordMap[wordId].senses){delete state.records[s.id];delete state.unknownSenses?.[s.id];}
 const q=state.session;if(q){q.queue=q.queue.filter(t=>t.wordId!==wordId);for(const s of wordMap[wordId].senses)delete q.states[s.id];if(q.current?.wordId===wordId){q.lastWord=wordId;next(state);} }
}
export function restoreKnownWord(state,wordId,day=localDay()){
 if(!state.knownWords?.[wordId])return;delete state.knownWords[wordId];const log=dayLog(state,day),q=state.session;
 for(const se of wordMap[wordId].senses){state.records[se.id]={wordId,level:1,due:day,interval:1,pending:true,weak:true};log.passed=log.passed.filter(id=>id!==se.id);if(q?.day===day&&q.stage!=='done'){q.states[se.id]=senseState(state,se.id);q.queue.push({wordId,senseId:se.id,round:q.round+1});q.types[wordId]='review';}}
}

export function orderedNewWords(state){const candidates=remainingWords(state),type={meaning:'近义词',spelling:'形近词',family:'同词族'}[state.plan.order];if(!type)return candidates;const pool=new Set(candidates),result=[];for(const id of candidates){if(!pool.delete(id))continue;result.push(id);let count=1;for(const n of wordMap[id].notes){if(count>=5)break;if((n.types||[n.type]).includes(type)&&pool.delete(n.word)){result.push(n.word);count++;}}}return result;}
