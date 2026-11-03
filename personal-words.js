import {wordMap,words} from './data.js';
import {wordForms} from './reading-model.js';
export const getWord=(state,id)=>Object.hasOwn(wordMap,id)?wordMap[id]:state?.customWords?.[id];
export const stateWords=state=>[...words,...Object.values(state?.customWords||{})];
const plain=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&!/[<>]/.test(s);
export function validateCustomWord(word){
 if(!word||!/^reading:[a-z]+(?:[-' ][a-z]+)*$/.test(word.id)||word.id.length>108||word.word!==word.id.slice(8)||!Array.isArray(word.senses)||word.senses.length<1||word.senses.length>6)throw Error('阅读词条无效。');
 if(!Array.isArray(word.notes)||word.notes.length)throw Error('阅读词条关联无效。');
 for(const [i,s] of word.senses.entries())if(s.id!==word.id+':'+(i+1)||!plain(s.pos,30)||!plain(s.meaning,180)||!/[\u3400-\u9fff]/.test(s.meaning)||!Array.isArray(s.examples)||s.examples.length<(word.source==='dictionary'?1:2)||s.examples.length>4||s.examples.some(ex=>!plain(ex.en,word.source==='dictionary'?5000:380)||!plain(ex.zh,word.source==='dictionary'?5000:400)))throw Error('阅读词义或例句无效。');
 return word;
}
export function validatePersonalData(state){
 for(const key of ['customWords','wordNotes','readingWords'])if(state[key]!==undefined&&(!state[key]||typeof state[key]!=='object'||Array.isArray(state[key])))throw Error('个人单词数据无效。');
 if(Object.keys(state.customWords||{}).length>2000)throw Error('个人词库数量过多。');
 for(const [id,w] of Object.entries(state.customWords||{})){validateCustomWord(w);if(id!==w.id)throw Error('阅读词条 ID 不一致。');}
 let total=0;
 for(const [id,notes] of Object.entries(state.wordNotes||{})){
  if(!getWord(state,id)||!Array.isArray(notes)||notes.length>100||new Set(notes.map(n=>n.id)).size!==notes.length)throw Error('单词笔记格式无效。');
  for(const n of notes){if(!plain(n.id,100)||!plain(n.text,2000)||!/^\d{4}-\d{2}-\d{2}$/.test(n.day)||!/^\d{4}-\d{2}-\d{2}T/.test(n.createdAt)||!Number.isFinite(Date.parse(n.createdAt)))throw Error('单词笔记内容或时间无效。');total+=n.text.length;}
 }
 if(total>200000)throw Error('单词笔记超过容量，请先导出备份。');
 for(const [id,r] of Object.entries(state.readingWords||{}))if(!getWord(state,id)||!/^\d{4}-\d{2}-\d{2}$/.test(r.day)||!/^\d{4}-\d{2}-\d{2}$/.test(r.due)||!plain(r.source,5000))throw Error('阅读收词记录无效。');
 return state;
}
export function addWordNote(state,wordId,text,day,createdAt=new Date().toISOString()){
 if(!getWord(state,wordId)||!plain(text,2000))throw Error('请填写 1–2000 字的笔记，不使用 HTML 符号。');
 const notes=state.wordNotes?.[wordId]||[],note={id:crypto.randomUUID(),text:text.trim(),day,createdAt};
 const next={...state,wordNotes:{...state.wordNotes,[wordId]:[...notes,note]}};validatePersonalData(next);state.wordNotes=next.wordNotes;return note;
}
let formIndex;
export function lookupLocalWord(text,state){
 const value=String(text).toLowerCase().replace(/[’]/g,"'").trim();if(Object.hasOwn(wordMap,value))return wordMap[value];
 if(!formIndex){formIndex=new Map();for(const w of words)for(const form of wordForms(w.id))if(!formIndex.has(form))formIndex.set(form,w.id);}
 return getWord(state,'reading:'+value)||wordMap[formIndex.get(value)];
}
