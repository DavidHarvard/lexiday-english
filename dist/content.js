import {wordMap} from './data.js';
import {readingLibrary} from './reading-library.js';
import {readingTargets,assembleArticle} from './reading-model.js';
import {practiceTargets,fallbackPractice,quizFromPractice} from './listening-practice.js';

// A complete authored story is also available when generation is offline.
export function createArticle(ids,learnedSenseIds=[],customWords={}){
 const targets=readingTargets(ids,learnedSenseIds,customWords);
 return readingLibrary.map(story=>assembleArticle(story,targets,{mode:'library',sourceId:story.id,dictionaryGloss:true})).sort((a,b)=>b.covered-a.covered)[0];
}
export function shuffle(a,random=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
export function makeQuiz(state,log,onlyWrong=false){
 const targets=practiceTargets(state,log.touched,log.passed);const pack=log.practicePack?.version===3&&log.practicePack?.passages.some(p=>log.passed.includes(p.senseId)&&!state.knownWords?.[p.wordId])?log.practicePack:fallbackPractice(state,targets);return quizFromPractice(pack,state,log,onlyWrong);
}
