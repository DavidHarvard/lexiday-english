import {readingBooks} from './reading-books-data.js';
export const bookPassages=new Map(readingBooks.ielts.map(p=>[p.id,p]));
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s));
export const readingDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function readingProgress(state,day=readingDay()){return state.bookReading??={version:1,startDay:day,passages:{},leisure:{page:0,paragraph:0,offset:0}};}
export function availablePassages(progress,day=readingDay()){return Math.min(readingBooks.ielts.length,Math.max(1,Math.floor((Date.parse(day)-Date.parse(progress.startDay))/86400000)+1));}
export function passageProgress(state,id,day=readingDay()){if(!bookPassages.has(id))throw Error('阅读文章无效。');return readingProgress(state,day).passages[id]??={draft:{},attempts:[],note:'',noteUpdatedAt:''};}
export const normalizeBookAnswer=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'").replace(/[–—-]/g,' ').replace(/[^a-z0-9'\s]/g,' ').replace(/\s+/g,' ').trim();
export function bookAnswerVariants(answer){
 const expanded=new Set([answer,answer.replace(/\([^)]*\)/g,''),answer.replace(/[()]/g,'')]);
 for(const value of [...expanded]){
  const alternatives=value.split('/').map(x=>x.trim());for(const option of alternatives)expanded.add(option);
  if(alternatives.length===2&&!alternatives[0].includes(' ')&&alternatives[1].includes(' '))expanded.add(alternatives[0]+' '+alternatives[1].split(/\s+/).slice(1).join(' '));
  if(value.includes(',')){const parts=value.split(',').map(x=>x.trim());expanded.add(parts.join(' '));expanded.add(parts.join(' and '));expanded.add(parts.reverse().join(' '));expanded.add(parts.join(' and '));}
 }
 if(/mosquit/i.test(answer)){expanded.add('mosquitoes');expanded.add('mosquito');}
 if(/ten thousand/i.test(answer))expanded.add('10000');
 if(/fruits flies/i.test(answer))expanded.add('fruit flies');
 return [...new Set([...expanded].map(normalizeBookAnswer).filter(Boolean))];
}
export function gradeBookReading(id,answers){
 const passage=bookPassages.get(id);if(!passage)throw Error('阅读文章无效。');const results=[];
 for(const g of passage.groups){
  if(g.kind==='multi'){const chosen=Array.isArray(answers[g.id])?answers[g.id]:[],expected=new Set(g.answers.map(normalizeBookAnswer)),used=new Set();
   for(let i=0;i<g.answers.length;i++){const value=chosen[i]||'',normalized=normalizeBookAnswer(value),correct=expected.has(normalized)&&!used.has(normalized)&&chosen.length<=g.answers.length;used.add(normalized);results.push({number:g.first+i,chosen:value,correct,expected:g.answers.join(' / '),group:g.id});}
  }else for(let i=0;i<g.answers.length;i++){const number=g.first+i,chosen=answers[number]||'';results.push({number,chosen,correct:bookAnswerVariants(g.answers[i]).includes(normalizeBookAnswer(chosen)),expected:g.answers[i],group:g.id});}
 }
 return {correct:results.filter(r=>r.correct).length,total:results.length,results};
}
export function submitBookReading(state,id,at=new Date().toISOString()){
 const record=passageProgress(state,id),attempt={id:crypto.randomUUID(),at,answers:structuredClone(record.draft)};
 if(record.attempts.length>=30)throw Error('这篇文章已保存 30 次提交，请先查看已有答题记录。');
 record.attempts.push(attempt);return gradeBookReading(id,attempt.answers);
}
export function validateBookReading(progress){
 if(progress===undefined)return;
 if(!progress||progress.version!==1||!date(progress.startDay)||!progress.passages||Array.isArray(progress.passages))throw Error('阅读记录无效。');
 for(const [id,r] of Object.entries(progress.passages)){
  const p=bookPassages.get(id);if(!p||!r||!Array.isArray(r.attempts)||r.attempts.length>30||typeof r.note!=='string'||r.note.length>5000||typeof r.noteUpdatedAt!=='string'||r.noteUpdatedAt&&!Number.isFinite(Date.parse(r.noteUpdatedAt)))throw Error('阅读笔记或提交记录无效。');
  const fields=new Map(p.groups.flatMap(g=>g.kind==='multi'?[[g.id,g]]:g.answers.map((_,i)=>[String(g.first+i),g])));
  for(const answers of [r.draft,...r.attempts.map(a=>a.answers)]){if(!answers||typeof answers!=='object'||Array.isArray(answers))throw Error('阅读答案无效。');for(const [key,value] of Object.entries(answers)){const g=fields.get(key);if(!g)throw Error('阅读题号无效。');if(g.kind==='multi'){if(!Array.isArray(value)||value.length>g.answers.length||new Set(value).size!==value.length||value.some(v=>!g.options.includes(v)))throw Error('多选答案无效。');}else if(typeof value!=='string'||value.length>150||g.kind==='choice'&&value&&!g.options.includes(value))throw Error('阅读答案无效。');}}
  for(const a of r.attempts)if(typeof a.id!=='string'||a.id.length>80||!Number.isFinite(Date.parse(a.at)))throw Error('阅读提交时间无效。');
 }
 const l=progress.leisure;if(!l||!Number.isInteger(l.page)||l.page<0||l.page>=readingBooks.harry.pages||!Number.isInteger(l.paragraph)||l.paragraph<0||l.paragraph>200||!Number.isFinite(l.offset)||Math.abs(l.offset)>5000)throw Error('趣味阅读位置无效。');
}
