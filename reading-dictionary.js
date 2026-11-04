import {dictionaryManifest} from './dictionary-manifest.js';
import {lookupLocalWord,validateCustomWord} from './personal-words.js';
import {splitDictionaryGloss} from './word-content.js';
import {containsTarget} from './example-target.js';
const normalize=text=>String(text).toLowerCase().replace(/[’‘]/g,"'").trim();
export const articleTokens=article=>[...new Set(([article.title,...article.paragraphs.map(p=>p.en)].join(' ').match(/[A-Za-z]+(?:['’\-][A-Za-z]+)*/g)||[]).map(normalize))];
const contractions={"i'm":'I am',"you're":'you are',"we're":'we are',"they're":'they are',"it's":'it is / it has',"that's":'that is',"there's":'there is',"he's":'he is / he has',"she's":'she is / she has',"don't":'do not',"doesn't":'does not',"didn't":'did not',"can't":'cannot',"couldn't":'could not',"won't":'will not',"wouldn't":'would not',"isn't":'is not',"aren't":'are not',"wasn't":'was not',"weren't":'were not',"haven't":'have not',"hasn't":'has not',"hadn't":'had not',"shouldn't":'should not',"let's":'let us',"i've":'I have',"we've":'we have',"they've":'they have',"you've":'you have',"i'll":'I will',"you'll":'you will',"we'll":'we will',"they'll":'they will',"i'd":'I would / I had',"you'd":'you would / you had'};
export function createReadingDictionary({fetcher=(...args)=>fetch(...args),storage=globalThis.caches}={}){
 const memory=new Map(),pending=new Map();let corePromise;
 async function file(name){
  if(memory.has(name))return memory.get(name);if(pending.has(name))return pending.get(name);
  const promise=(async()=>{const url='/dictionary/'+name+'.json',key=url+'?v='+dictionaryManifest.version;let cache,response;
   try{cache=await storage?.open('lexiday-dictionary-'+dictionaryManifest.version);response=await cache?.match(key);}catch{}
   if(!response){response=await fetcher(url);if(!response.ok)throw Error('词典尚未下载，请联网后重试。');try{await cache?.put(key,response.clone());}catch{}}
   const data=await response.json();memory.set(name,data);if(memory.size>64)for(const old of memory.keys()){if(old!=='core'){memory.delete(old);break;}}return data;
  })();pending.set(name,promise);try{return await promise;}finally{pending.delete(name);}
 }
 async function raw(text){const word=normalize(text);const core=await (corePromise??=file('core').catch(e=>{corePromise=null;throw e;}));if(Object.hasOwn(core,word))return core[word];const shard=word.slice(0,2).padEnd(2,'_').replace(/[^a-z]/g,'_');if(!dictionaryManifest.shards.includes(shard))return null;const entries=await file(shard);return Object.hasOwn(entries,word)?entries[word]:null;}
 async function lookup(text){
  const word=normalize(text);if(!/^[a-z]+(?:[-'][a-z]+)*$/.test(word))return null;
  if(contractions[word])return {word,record:['','缩写：'+contractions[word],contractions[word],''],form:'contraction'};
  if(word.endsWith("'s")){const base=await lookup(word.slice(0,-2));if(base)return {...base,form:word+'：所有格形式；词典原形 '+base.word};}
  const record=await raw(word);if(!record)return null;
  if(record[3]&&record[3]!==word&&/^[a-z]+$/.test(record[3])){const base=await raw(record[3]);if(base)return {word:record[3],record:base,form:word+' → '+record[3]};}
  return {word,record,form:''};
 }
 async function prepare(article,state){const tokens=articleTokens(article),missing=[];let index=0;
  await Promise.all(Array.from({length:4},async()=>{while(index<tokens.length){const token=tokens[index++];if(lookupLocalWord(token,state))continue;if(!await lookup(token))missing.push(token);}}));
  return {total:tokens.length,missing};
 }
 return {lookup,prepare};
}
export const readingDictionary=createReadingDictionary();
export function dictionaryWord(entry,paragraph){
 const id='reading:'+entry.word,definitions=entry.record[2].split('\n').filter(Boolean);
 const sentence=(paragraph.en.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[paragraph.en]).find(text=>containsTarget(text,entry.word))?.trim();if(!sentence)throw Error('本段中未找到该词的例句，请重新选择单词。');
 const senses=splitDictionaryGloss(entry.record[1]).slice(0,6).map((s,i)=>({id:id+':'+(i+1),pos:s.pos==='释义'?'词条':s.pos,meaning:s.meaning.slice(0,180),definition:(definitions[i]||definitions[0]||'').replace(/^[a-z]\.\s*/, '').slice(0,500),examples:[{en:paragraph.zh?paragraph.en:sentence,zh:paragraph.zh||''}],distractors:[]}));
 return validateCustomWord({id,word:entry.word,ipa:entry.record[0],source:'dictionary',sourceUrl:dictionaryManifest.source,notes:[],senses});
}
