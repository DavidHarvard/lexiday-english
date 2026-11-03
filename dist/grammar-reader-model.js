import {grammarBook} from './grammar-book-data.js';
import {grammarExercises} from './grammar-book-answers.js';
export {grammarBook,grammarExercises};
export const grammarExerciseMap=Object.fromEntries(grammarExercises.map(g=>[g.id,g]));
export const grammarItemMap=Object.fromEntries(grammarExercises.flatMap(g=>g.items.map(q=>[g.id+':'+q.id,{...q,groupId:g.id,mode:q.mode||g.mode,strictShort:g.strictShort||false}])));
export function bookState(state){return state.pdfBook??={id:grammarBook.id,page:2,zoom:1,sound:true,scroll:{x:0,y:0},exercises:{}};}
export function bookPart(page){return grammarBook.parts.find(part=>page>=part.start&&page<=part.end);}
export function setBookPage(state,page){if(!Number.isInteger(page)||page<1||page>grammarBook.pages)throw Error('请输入有效页码。');const book=bookState(state);book.page=page;book.scroll={x:0,y:0};}
export function normalizeGrammarAnswer(value){return String(value??'').normalize('NFKC').toLowerCase().replace(/[‘’`]/g,"'").replace(/\u00ad/g,'').replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'').replace(/\s*([,;:])\s*/g,'$1 ').trim();}
const contractions={"i'm":'i am',"you're":'you are',"we're":'we are',"they're":'they are',"isn't":'is not',"aren't":'are not',"wasn't":'was not',"weren't":'were not',"don't":'do not',"doesn't":'does not',"didn't":'did not',"can't":'cannot',"couldn't":'could not',"won't":'will not',"wouldn't":'would not',"shouldn't":'should not',"mustn't":'must not',"haven't":'have not',"hasn't":'has not',"hadn't":'had not',"i've":'i have',"you've":'you have',"we've":'we have',"they've":'they have',"i'll":'i will',"you'll":'you will',"he'll":'he will',"she'll":'she will',"it'll":'it will',"we'll":'we will',"they'll":'they will'};
function canonical(value){return normalizeGrammarAnswer(value).replace(/\b[a-z]+'[a-z]+\b/g,m=>contractions[m]||m).replace(/\bcan not\b/g,'cannot').replace(/\s+/g,' ');}
// Variants are curated as complete answers. Splitting natural "or" inside a
// sentence would accept fragments such as "brothers" and reject the full key.
function keyAlternatives(item){return [item.answer,...(item.alternatives||[])];}
export function checkGrammarItem(item,value){
 const input=normalizeGrammarAnswer(value);if(!input)return null;
 if(item.mode==='self')return 'self';
 if(item.strictShort&&!input.includes("'"))return 'incorrect';
 const normalize=item.strictShort?normalizeGrammarAnswer:canonical;
 const accepted=keyAlternatives(item).map(normalize);
 if(accepted.includes(normalize(value)))return 'correct';
 for(const answer of keyAlternatives(item)){
  const parts=answer.split(/\s*(?:\.{2,}|…)\s*/);
  const expected=(parts.length>1?parts:item.answerParts||parts).filter(Boolean).map(normalize);
  const supplied=value.split(/\s*(?:\||;|,|\.{2,}|…)\s*/).filter(Boolean).map(normalize);
  if(expected.length>1&&JSON.stringify(expected)===JSON.stringify(supplied))return 'correct';
 }
 return 'incorrect';
}
function keepLegacyCheck(id,record){
 if(!Array.isArray(record.attempts))record.attempts=record.result?[{id:'legacy:'+id,at:null,answer:record.draft,result:record.result,reference:null,source:'legacy'}]:[];
 return record;
}
export function writeBookAnswer(state,id,draft){if(!grammarItemMap[id]||typeof draft!=='string'||draft.length>2000)throw Error('练习答案格式无效。');const records=bookState(state).exercises,previous=records[id];records[id]={...(previous?keepLegacyCheck(id,previous):{attempts:[]}),draft,result:null,selfChecked:false};}
export function submitBookAnswer(state,id,at=new Date().toISOString()){
 const item=grammarItemMap[id],record=bookState(state).exercises[id];if(!item||!record?.draft.trim())throw Error('请先填写答案。');
 keepLegacyCheck(id,record);record.result=checkGrammarItem(item,record.draft);record.selfChecked=false;
 record.attempts.push({id:crypto.randomUUID(),at,answer:record.draft,result:record.result,reference:item.answer,source:'check'});return record.result;
}
export function bookMistakes(record){return (record?.attempts||[]).filter(a=>a.result==='incorrect');}
// Merge append-only checks at the server boundary as well: an older browser or
// imported backup may replace a draft, but must not erase checks already stored.
export function preserveBookHistory(incoming,stored){
 const previous=stored?.pdfBook?.exercises;if(!previous)return incoming;
 if(!incoming.pdfBook)incoming.pdfBook=structuredClone(stored.pdfBook);
 const records=bookState(incoming).exercises;
 for(const[id,old]of Object.entries(previous)){
  if(!grammarItemMap[id])continue;keepLegacyCheck(id,old);if(!old.attempts.length)continue;
  const current=records[id];if(!current){records[id]=structuredClone(old);continue;}
  if(!Array.isArray(current.attempts)&&old.attempts.some(a=>a.answer===current.draft&&a.result===current.result))current.attempts=[];
  keepLegacyCheck(id,current);const seen=new Set(old.attempts.map(a=>a.id));current.attempts=[...structuredClone(old.attempts),...current.attempts.filter(a=>!seen.has(a.id))];
 }
 return incoming;
}
// A corrected answer key must not discard an older reader position or draft.
// Only the browser's load/import path repairs derived results; server writes
// still validate the submitted result against the current key.
export function refreshBookResults(state){
 const records=state?.pdfBook?.exercises;if(!records||typeof records!=='object'||Array.isArray(records))return state;
 for(const[id,r]of Object.entries(records)){const q=grammarItemMap[id];if(q&&r&&typeof r.draft==='string'&&['correct','incorrect','self'].includes(r.result)){keepLegacyCheck(id,r);r.result=checkGrammarItem(q,r.draft);if(r.result!=='self')r.selfChecked=false;}}
 return state;
}
export function validateBookState(value){
 if(value===undefined)return;
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x),fail=()=>{throw Error('教材阅读记录无效。');};
 if(!object(value)||value.id!==grammarBook.id||!Number.isInteger(value.page)||value.page<1||value.page>grammarBook.pages||![.75,1,1.25,1.5,2].includes(value.zoom)||!object(value.scroll)||!['x','y'].every(key=>Number.isFinite(value.scroll[key])&&value.scroll[key]>=0&&value.scroll[key]<=1)||!object(value.exercises))fail();
 if(value.sound!==undefined&&typeof value.sound!=='boolean')fail();
 for(const[id,record]of Object.entries(value.exercises)){const item=grammarItemMap[id];if(!item||!object(record)||typeof record.draft!=='string'||record.draft.length>2000||!['correct','incorrect','self',null].includes(record.result)||typeof record.selfChecked!=='boolean'||(record.result!==null&&record.result!==checkGrammarItem(item,record.draft))||record.selfChecked&&record.result!=='self')fail();
  if(record.attempts!==undefined){if(!Array.isArray(record.attempts)||new Set(record.attempts.map(a=>a?.id)).size!==record.attempts.length)fail();
   for(const a of record.attempts)if(!object(a)||typeof a.id!=='string'||!a.id.length||a.id.length>100||typeof a.answer!=='string'||!a.answer.trim()||a.answer.length>2000||!['correct','incorrect','self'].includes(a.result)||!['check','legacy'].includes(a.source)||(a.reference!==null&&(typeof a.reference!=='string'||a.reference.length>2000))||(a.source==='check'&&(!/^\d{4}-\d{2}-\d{2}T/.test(a.at)||!Number.isFinite(Date.parse(a.at))||a.reference===null))||(a.source==='legacy'&&a.at!==null))fail();
  }
 }
}
