import {wordMap} from './data.js';
import {readingLibrary} from './reading-library.js';
import {readingTargets,assembleArticle} from './reading-model.js';

// A complete authored story is also available when generation is offline.
export function createArticle(ids,learnedSenseIds=[]){
 const targets=readingTargets(ids,learnedSenseIds);
 return readingLibrary.map(story=>assembleArticle(story,targets,{mode:'library',sourceId:story.id,dictionaryGloss:true})).sort((a,b)=>b.covered-a.covered)[0];
}
export function shuffle(a,random=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
export function makeQuiz(state,log,onlyWrong=false){const wrong=new Set(log.quiz?.answers.filter(a=>!a.correct).map(a=>a.senseId)||[]);let candidates=log.touched.flatMap(id=>wordMap[id].senses.filter(s=>log.passed.includes(s.id)&&s.examples.length>=2&&s.distractors.length===3&&!state.knownWords?.[id]).map(s=>({...s,wordId:id,weak:state.records[s.id]?.weak})));if(onlyWrong)candidates=candidates.filter(s=>wrong.has(s.id));candidates=shuffle(candidates).sort((a,b)=>Number(b.weak)-Number(a.weak)).slice(0,10);if(!candidates.length)throw new Error('这些词暂未提供四选一课后题，可在学习卡中进行听音输入练习。');return {questions:candidates.map(s=>{const ex=s.examples[1];const options=shuffle([...new Set([s.meaning,...s.distractors])]);if(options.length!==4)throw new Error('题目选项校验失败。');return {senseId:s.id,wordId:s.wordId,en:ex.en,zh:ex.zh,meaning:s.meaning,pos:s.pos,options};}),index:0,answers:[],revealed:false,played:false,submitted:false,onlyWrong};}
