import {wordMap} from './data.js';
import {examplesForSense,studyMeaning,wordEntries} from './word-content.js';

export const READING_VERSION=2;
export const countWords=text=>(String(text).match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).length;
export const escapeRegExp=text=>String(text).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const irregular={be:['is','are','was','were','been'],bring:['brought'],buy:['bought'],come:['came'],do:['did','done'],find:['found'],get:['got'],go:['went','gone'],have:['has','had'],hold:['held'],keep:['kept'],know:['knew','known'],lead:['led'],leave:['left'],make:['made'],meet:['met'],read:['read'],run:['ran'],say:['said'],see:['saw','seen'],send:['sent'],take:['took','taken'],teach:['taught'],think:['thought'],write:['wrote','written'],child:['children'],person:['people']};
export function wordForms(id){
 const forms=new Set([id]);
 if(/^[a-z]+$/i.test(id)){
  const word=wordMap[id],pos=word?wordEntries(word).map(e=>e.pos).join(' '):'';
  if(/\bn\.|\bv\./.test(pos)){
   forms.add(/[^aeiou]y$/.test(id)?id.slice(0,-1)+'ies':/(?:s|x|z|ch|sh|o)$/.test(id)?id+'es':id+'s');
   if(/\bv\./.test(pos)){
    forms.add(id.endsWith('e')?id+'d':/[^aeiou]y$/.test(id)?id.slice(0,-1)+'ied':id+'ed');
    forms.add(id.endsWith('ie')?id.slice(0,-2)+'ying':/[^e]e$/.test(id)?id.slice(0,-1)+'ing':id+'ing');
    if(/[^aeiou][aeiou][^aeiouwxy]$/.test(id)){forms.add(id+id.at(-1)+'ed');forms.add(id+id.at(-1)+'ing');}
   }
  }
 }
 for(const form of irregular[id]||[])forms.add(form);
 return [...forms];
}
export function findWord(text,id){
 const pattern=wordForms(id).sort((a,b)=>b.length-a.length).map(escapeRegExp).join('|');
 const match=new RegExp(`(?<![A-Za-z])(?:${pattern})(?![A-Za-z])`,'i').exec(text);
 return match?{form:match[0],index:match.index}:null;
}
export function readingTargets(ids,learnedSenseIds=[]){
 if(!Array.isArray(ids)||!ids.length||ids.some(id=>typeof id!=='string'||!Object.hasOwn(wordMap,id)))throw Error('阅读词汇无效，请先完成今日学习。');
 if(!Array.isArray(learnedSenseIds)||learnedSenseIds.some(id=>typeof id!=='string'))throw Error('阅读词义无效。');
 return [...new Set(ids)].map(wordId=>{
  const word=wordMap[wordId],sense=word.senses.find(s=>learnedSenseIds.includes(s.id))||word.senses[0],entry=studyMeaning(word,sense,examplesForSense(word,sense)[0]);
  return {wordId,senseId:sense.id,pos:entry.pos,meaning:entry.meaning};
 });
}
export function assembleArticle(raw,targets,{mode='generated',sourceId='daily',dictionaryGloss=false}={}){
 if(!raw||typeof raw.title!=='string'||!raw.title.trim()||raw.title.length>160||typeof raw.subtitle!=='string'||raw.subtitle.length>240||!Array.isArray(raw.paragraphs)||raw.paragraphs.length<4||raw.paragraphs.length>24)throw Error('文章结构不完整。');
 const paragraphs=raw.paragraphs.map(p=>{
  if(!p||typeof p.en!=='string'||typeof p.zh!=='string'||countWords(p.en)<25||p.en.length>5000||p.zh.length>5000||!/[\u3400-\u9fff]/.test(p.zh)||/[<>]/.test(p.en+p.zh))throw Error('文章段落或翻译不完整。');
  return {en:p.en.trim(),zh:p.zh.trim()};
 });
 const wordCount=paragraphs.reduce((n,p)=>n+countWords(p.en),0);
 if(wordCount<250||wordCount>3000)throw Error('文章长度不符合阅读要求。');
 const glossary=[];
 for(const target of targets){
  const paragraphIndex=paragraphs.findIndex(p=>findWord(p.en,target.wordId));if(paragraphIndex<0)continue;
  const p=paragraphs[paragraphIndex],match=findWord(p.en,target.wordId);
  glossary.push({...target,form:match.form,paragraphIndex,dictionaryGloss});
 }
 const coveredIds=new Set(glossary.map(g=>g.wordId));
 return {version:READING_VERSION,title:raw.title.trim(),subtitle:raw.subtitle.trim(),paragraphs,glossary,wordCount,covered:glossary.length,total:targets.length,missing:targets.filter(t=>!coveredIds.has(t.wordId)).map(t=>t.wordId),targetWordIds:targets.map(t=>t.wordId),mode,sourceId,collection:false};
}
export function validateReadingArticle(article){
 if(!article||article.version!==READING_VERSION||!['generated','library'].includes(article.mode)||typeof article.sourceId!=='string'||article.sourceId.length>100)throw Error('阅读版本无效。');
 const targets=readingTargets(article.targetWordIds,article.glossary?.map(g=>g.senseId)||[]);
 const rebuilt=assembleArticle(article,targets,{mode:article.mode,sourceId:article.sourceId,dictionaryGloss:article.mode==='library'});
 if(article.covered!==rebuilt.covered||article.total!==rebuilt.total||article.wordCount!==rebuilt.wordCount||!Array.isArray(article.missing)||JSON.stringify(article.missing)!==JSON.stringify(rebuilt.missing)||!Array.isArray(article.glossary)||article.glossary.length!==rebuilt.glossary.length||article.glossary.some((g,i)=>['wordId','senseId','paragraphIndex','form','en','zh','pos','meaning','dictionaryGloss'].some(key=>g[key]!==rebuilt.glossary[i][key])))throw Error('阅读词卡与正文不一致。');
 return rebuilt;
}
