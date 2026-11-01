import {wordMap} from './data.js';
import {wordEntries,spokenWord,examplesForSense} from './word-content.js';
function taskExample(task){const word=wordMap[task?.wordId],sense=word?.senses.find(s=>s.id===task.senseId);if(!sense)return '';const examples=examplesForSense(word,sense);return examples[(task.round-1)%examples.length]?.en||'';}
function allAudio(word){if(!word)return [];return [spokenWord(word),...wordEntries(word).flatMap(entry=>(entry.examples||[]).map(ex=>ex.en)),...word.senses.flatMap(s=>(s.examples||[]).map(ex=>ex.en))];}
export function learningAudioLookahead(state){
 const q=state.session,current=q?.current;if(!current||q.stage==='done')return [];
 // Mirror next()'s rotation without changing the queue or any learning progress.
 const waiting=q.queue.filter(t=>!q.states[t.senseId]?.passed&&!state.knownWords?.[t.wordId]);
 const next=waiting.find(t=>t.wordId!==current.wordId)||waiting[0];
 const word=wordMap[current.wordId],nextWord=wordMap[next?.wordId];
 // Current context first, then the next word and every one of its examples.
 return [...new Set([spokenWord(word),taskExample(current),nextWord&&spokenWord(nextWord),taskExample(next),...allAudio(nextWord),...allAudio(word)].filter(Boolean))];
}
