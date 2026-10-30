import {grammarBook} from './grammar-book-data.js';
import {grammarExercises} from './grammar-book-answers.js';
export {grammarBook,grammarExercises};
export const grammarExerciseMap=Object.fromEntries(grammarExercises.map(g=>[g.id,g]));
export const grammarItemMap=Object.fromEntries(grammarExercises.flatMap(g=>g.items.map(q=>[g.id+':'+q.id,{...q,groupId:g.id,mode:q.mode||g.mode,strictShort:g.strictShort||false}])));
export function bookState(state){return state.pdfBook??={id:grammarBook.id,page:2,zoom:1,scroll:{x:0,y:0},exercises:{}};}
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
export function writeBookAnswer(state,id,draft){if(!grammarItemMap[id]||typeof draft!=='string'||draft.length>2000)throw Error('练习答案格式无效。');bookState(state).exercises[id]={draft,result:null,selfChecked:false};}
export function submitBookAnswer(state,id){const item=grammarItemMap[id],record=bookState(state).exercises[id];if(!item||!record?.draft.trim())throw Error('请先填写答案。');record.result=checkGrammarItem(item,record.draft);record.selfChecked=false;return record.result;}
// A corrected answer key must not discard an older reader position or draft.
// Only the browser's load/import path repairs derived results; server writes
// still validate the submitted result against the current key.
export function refreshBookResults(state){
 const records=state?.pdfBook?.exercises;if(!records||typeof records!=='object'||Array.isArray(records))return state;
 for(const[id,r]of Object.entries(records)){const q=grammarItemMap[id];if(q&&r&&typeof r.draft==='string'&&['correct','incorrect','self'].includes(r.result)){r.result=checkGrammarItem(q,r.draft);if(r.result!=='self')r.selfChecked=false;}}
 return state;
}
export function validateBookState(value){
 if(value===undefined)return;
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x),fail=()=>{throw Error('教材阅读记录无效。');};
 if(!object(value)||value.id!==grammarBook.id||!Number.isInteger(value.page)||value.page<1||value.page>grammarBook.pages||![.75,1,1.25,1.5,2].includes(value.zoom)||!object(value.scroll)||!['x','y'].every(key=>Number.isFinite(value.scroll[key])&&value.scroll[key]>=0&&value.scroll[key]<=1)||!object(value.exercises))fail();
 for(const[id,record]of Object.entries(value.exercises)){const item=grammarItemMap[id];if(!item||!object(record)||typeof record.draft!=='string'||record.draft.length>2000||!['correct','incorrect','self',null].includes(record.result)||typeof record.selfChecked!=='boolean'||(record.result!==null&&record.result!==checkGrammarItem(item,record.draft))||record.selfChecked&&record.result!=='self')fail();}
}
