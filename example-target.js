// Match actual word forms, including irregular verbs and separable phrases.
// This is independent of saved reading-article glossary offsets.
const irregular={be:'am is are was were been being',have:'has had',do:'does did done',go:'went gone',get:'got gotten',bring:'brought',buy:'bought',come:'came',find:'found',hold:'held',keep:'kept',know:'knew known',lead:'led',leave:'left',make:'made',meet:'met',run:'ran',say:'said',see:'saw seen',send:'sent',take:'took taken',teach:'taught',think:'thought',write:'wrote written',bind:'bound',creep:'crept',flee:'fled',foresee:'foresaw foreseen',forgo:'forwent forgone',fuel:'fuelled fuelling',grind:'ground',hang:'hung hanged',hide:'hid hidden',kneel:'knelt',larva:'larvae',millennium:'millennia',outdo:'outdid outdone',outsell:'outsold',overcome:'overcame',oversee:'oversaw overseen',panic:'panicked panicking',repay:'repaid',shrink:'shrank shrunk',slide:'slid',spin:'spun',spit:'spat',spring:'sprang sprung',stick:'stuck',strike:'struck stricken',string:'strung',swear:'swore sworn',swing:'swung',undertake:'undertook undertaken',withdraw:'withdrew withdrawn',child:'children',person:'people',man:'men',woman:'women',foot:'feet',tooth:'teeth',mouse:'mice',ox:'oxen',lie:'lay lain lying',lay:'laid',sit:'sat',stand:'stood',speak:'spoke spoken',eat:'ate eaten',drink:'drank drunk',drive:'drove driven',give:'gave given',fall:'fell fallen',feel:'felt',fight:'fought',hear:'heard',lose:'lost',pay:'paid',sell:'sold',sleep:'slept',spend:'spent',wear:'wore worn',win:'won',break:'broke broken',choose:'chose chosen',fly:'flew flown',forget:'forgot forgotten',grow:'grew grown',rise:'rose risen',steal:'stole stolen',swim:'swam swum',throw:'threw thrown',wake:'woke woken',life:'lives',knife:'knives',leaf:'leaves'};
const normal=s=>String(s||'').toLowerCase().replace(/^reading:/,'').replace(/[’‘]/g,"'");
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function targetForms(value){const w=normal(value),forms=new Set([w,...(irregular[w]||'').split(' ').filter(Boolean)]);if(!/^[a-z]+$/.test(w))return [...forms];
 for(const suffix of ['s','ed','ing','er','est'])forms.add(w+suffix);
 if(/(?:s|x|z|ch|sh|o)$/.test(w))forms.add(w+'es');
 if(/[^aeiou]y$/.test(w))for(const suffix of ['ies','ied','ier','iest'])forms.add(w.slice(0,-1)+suffix);
 if(w.endsWith('e')){forms.add(w+'d');for(const suffix of ['ing','er','est'])forms.add(w.slice(0,-1)+suffix);}
 if(w.endsWith('ie'))forms.add(w.slice(0,-2)+'ying');
 if(/[^aeiou][aeiou][^aeiouwxy]$/.test(w)||w==='equip')for(const suffix of ['ed','ing','er','est'])forms.add(w+w.at(-1)+suffix);
 return [...forms];
}
export function sameLexeme(form,lemma){return targetForms(lemma).includes(normal(form));}
export function containsTarget(text,target){const word=normal(typeof target==='string'?target:target.word),input=normal(text);let alternatives=[word];
 if(word.includes('/')){const parts=word.split('/'),prefix=parts[0].split(' ').slice(0,-1).join(' ');alternatives=[parts[0],...parts.slice(1).map(p=>prefix+' '+p)];}
 return alternatives.some(phrase=>{const parts=phrase.trim().split(/\s+/),patterns=parts.map((p,i)=>p==='doing'&&parts[0]==='recommend'?'[a-z]+ing':'(?:'+targetForms(p).map(escape).join('|')+')');const gap=parts.length>1?'(?:\\s+[a-z\x27-]+){0,6}\\s+':' ';
  return new RegExp('(?<![a-z])'+patterns.join(gap)+'(?![a-z])','i').test(input);
 });
}
export function invalidWordExamples(word){return word.senses.flatMap((sense,index)=>(sense.examples||[]).filter(ex=>!containsTarget(ex.en,word)).map(ex=>({index,example:ex.en})));}
export function repairKnownExamples(state){let changed=false;for(const word of Object.values(state.customWords||{})){
 if(word.word!=='way')continue;
 for(const sense of word.senses){if(!sense.examples.some(ex=>!containsTarget(ex.en,word)))continue;
 const method=/方法|方式|手段/.test(sense.meaning)&&!/路|方向/.test(sense.meaning);
 const examples=method?[{en:'There is a better way to solve this problem.',zh:'有更好的方法解决这个问题。'},{en:'Reading every day is a useful way to build your vocabulary.',zh:'每天阅读是扩大词汇量的有效方法。'}]:[{en:'This road is the quickest way to the city centre.',zh:'这条路是去市中心最快的路线。'},{en:'Could you show me the way to the station?',zh:'你能告诉我去车站的路吗？'}];
 sense.examples=sense.examples.map((ex,i)=>containsTarget(ex.en,word)?ex:examples[i%examples.length]);changed=true;
 }}return changed;}
