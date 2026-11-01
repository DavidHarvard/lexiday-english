import {wordEnrichment} from './word-enrichment.js';

const cleanPos=pos=>({'a.':'adj.','ad.':'adv.','vt.':'v.','vi.':'v.'}[pos]||pos);
export function splitDictionaryGloss(gloss){
 const text=String(gloss||'').replace(/\b(?:vt|vi)\.\s*\/\s*(?:vt|vi)\./g,'v.');
 const markers=[...text.matchAll(/\b(?:(?:n|v|vt|vi|a|adj|ad|adv|prep|pron|conj|excl|interj|num|det|aux)\.(?:\s*\/\s*)?)+/g)];
 if(!markers.length)return [{pos:'释义',meaning:text.trim()}];
 return markers.flatMap((match,i)=>{
  const meaning=text.slice(match.index+match[0].length,markers[i+1]?.index??text.length).trim();
  return [...new Set(match[0].match(/[a-z]+\./g).map(cleanPos))].map(pos=>({pos,meaning}));
 }).filter(entry=>entry.meaning);
}
export function wordEntries(word){
 const extra=wordEnrichment[word.id];
 if(extra?.length)return extra;
 return word.senses.flatMap(sense=>sense.pos==='词条'?splitDictionaryGloss(sense.meaning).map(entry=>({...entry,ipa:word.ipa,examples:sense.examples||[]})):[{...sense,ipa:sense.ipa||word.ipa}]);
}
export function wordPronunciation(word){return wordEntries(word)[0]?.ipa||word.ipa||'';}
export function spokenWord(word){return ({'bring around/round':'bring around. Bring round.','as for/to':'as for. As to.','as if/though':'as if. As though.'})[word.id]||word.word;}
export function entriesForSense(word,sense){
 if(word.imported)return wordEntries(word);
 const entries=wordEnrichment[word.id];
 if(entries){
  const examples=new Set((sense.examples||[]).map(ex=>exampleKey(ex.en)));
  const matching=entries.filter(entry=>entry.examples.some(ex=>examples.has(exampleKey(ex.en))));
  if(matching.length)return matching;
 }
 return [{...sense,ipa:sense.ipa||word.ipa}];
}
function exampleKey(text){return String(text||'').normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();}
export function examplesForSense(word,sense){
 if(sense.examples?.length)return sense.examples;
 return wordEntries(word)[0]?.examples||[];
}
export function studyMeaning(word,sense,example=examplesForSense(word,sense)[0]){
 const entries=entriesForSense(word,sense),key=exampleKey(example?.en);
 return entries.find(entry=>key&&entry.examples?.some(ex=>exampleKey(ex.en)===key))||entries[0]||sense;
}

export function normalizeMeaning(text){
 return String(text??'').normalize('NFKC').toLowerCase().trim()
  .replace(/^(?:(?:意思|含义|释义)(?:是|为|[:：])|意为|指的是)\s*/,'')
  .replace(/^(?:表示|指)\s*[:：]\s*/,'')
  .replace(/\s+/g,'').replace(/[。.!！?？]+$/,'');
}
const extraAliases={
 '配备家具的':['带家具的','带有家具的','有家具的','配有家具的','家具齐全的','附带家具的','配备了家具的'],
 '押金':['保证金','租房押金'], '存入款项':['存款','存钱','存入银行','把钱存进银行'],
 '租约':['租赁合同','租赁协议'],
 '居民':['住户','居住者'], '住宅的':['居住的','住宅用的'], '光线':['光','光亮'],
 '学习':['学','学会'], '书':['书籍'], '预订':['预定'], '明亮的':['明亮','亮的'],
 '轻的':['轻','重量轻的'], '发现':['发觉'], '阻碍':['妨碍','阻挡'],
 '地址':['住址'], '目标':['目的'], '住宅':['住所','住处'],
};
export function aliasesForMeaning(meaning){
 const values=splitDictionaryGloss(meaning).flatMap(part=>part.meaning.replace(/[（(][^）)]*[）)]/g,'').split(/[；;,，、/]|\s+or\s+/)),aliases=new Set();
 for(const value of values){const key=normalizeMeaning(value);if(!key)continue;for(const raw of [key,...(extraAliases[key]||[])]){const alias=normalizeMeaning(raw);aliases.add(alias);if(alias.endsWith('的')&&alias.length>1)aliases.add(alias.slice(0,-1));}}
 return [...aliases];
}
export function meaningAliases(word,sense,cue='word',example){
 const entries=cue==='context'?[studyMeaning(word,sense,example)]:entriesForSense(word,sense);
 return [...new Set(entries.flatMap(entry=>aliasesForMeaning(entry.meaning)))];
}
export function meaningDecision(word,sense,input,example){
 if(checkMeaning(word,sense,input,'context',example))return 'correct';
 const value=normalizeMeaning(input);if(!value||value.length>200||/[<>]/.test(value)||!/[\u3400-\u9fff]/.test(value))return 'incorrect';
 const accepted=new Set(meaningAliases(word,sense,'context',example));
 const others=new Set(wordEntries(word).flatMap(entry=>aliasesForMeaning(entry.meaning)).filter(alias=>!accepted.has(alias)));
 const parts=value.split(/[；;,，、/]|或者|或是/).map(normalizeMeaning).filter(Boolean);
 if(parts.some(part=>others.has(part)||[...accepted].some(alias=>part==='不是'+alias||part==='并非'+alias)))return 'incorrect';
 return 'unknown';
}
export function checkMeaning(word,sense,input,cue='word',example){
 const value=normalizeMeaning(input);
 if(!value||value.length>200||/[<>]/.test(value))return false;
 const parts=value.split(/[；;,，、/]|或者|或是/).map(normalizeMeaning).filter(Boolean);
 const accepted=new Set(meaningAliases(word,sense,cue,example));
 return parts.length>0&&parts.every(part=>accepted.has(part));
}
