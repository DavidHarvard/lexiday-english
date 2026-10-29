import {LISTENING_ANSWERS} from './listening-answers.js';
export {LISTENING_ANSWERS};
export function listeningKey(id, field) { return `listening:${id}:${field}`; }
export function saveListeningPosition(notes,track,seconds) {
 notes[listeningKey(track.id,'position')]=String(Math.max(0,Number(seconds)||0));
}
export const FIRST_LISTENING_ID='test-1-section-1-social-programme-trips';
export function normalizeListeningAnswer(value){
 return String(value??'').normalize('NFKC').toLowerCase().trim()
  .replace(/[.,!?]+$/,'').replace(/[‐‑‒–—−]/g,'-')
  .replace(/(\d),(?=\d{3}(?:\D|$))/g,'$1')
  .replace(/(\d)\s*(?:-|\bto\b)\s*(?=\d)/g,'$1-')
  .replace(/\s+/g,' ');
}
function matchesItems(answer,items){
 const expected=items.map(normalizeListeningAnswer);
 const letters=expected.every(item=>/^[a-z]$/.test(item));
 let parts=answer.split(/\s*(?:[,/;&+]|\band\b)\s*|\s+/).filter(Boolean);
 if(letters&&parts.length===1&&/^[a-z]+$/.test(parts[0]))parts=[...parts[0]];
 return parts.length===expected.length&&new Set(parts).size===expected.length&&expected.every(item=>parts.includes(item));
}
export function checkListeningAnswers(id,answers=[]){
 const key=LISTENING_ANSWERS[id];if(!key)return null;
 const normalized=key.questions.map((q,i)=>normalizeListeningAnswer(answers[i]));
 const results=key.questions.map((question,i)=>{
  const answer=normalized[i];
  return {number:question.number,answered:!!answer,correct:!!answer&&(question.items?matchesItems(answer,question.items):question.accepted.some(value=>normalizeListeningAnswer(value)===answer)),expected:question.display};
 });
 for(const group of key.choiceGroups){
  const used=new Set(),letters=group.letters.map(normalizeListeningAnswer);
  for(const number of group.numbers){
   const i=key.questions.findIndex(question=>question.number===number),answer=normalized[i];
   results[i].correct=letters.includes(answer)&&!used.has(answer);
   if(results[i].correct)used.add(answer);
   results[i].expected=`${group.letters.join(' + ')}（第 ${group.numbers.join('、')} 题各填一个，不限顺序，不能重复）`;
  }
 }
 return {results,correct:results.filter(r=>r.correct).length,total:key.questions.length};
}
export function saveListeningNote(notes,id,text){
 const value=String(text??'').trim();if(!value)throw Error('请先填写没有听清的内容。');
 if(value.length>3000)throw Error('备注最多 3000 个字符。');
 const first=listeningKey(id,'first-note');if(!notes[first])notes[first]=value;
 notes[listeningKey(id,'latest-note')]=value;
 notes[listeningKey(id,'note-draft')]='';
}
