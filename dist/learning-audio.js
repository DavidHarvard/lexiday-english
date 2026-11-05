import {getWord} from './personal-words.js';
import {audioQuestion} from './engine.js';
import {wordMap} from './data.js';
import {wordEntries,spokenWord,examplesForSense} from './word-content.js';
function taskExample(state,task){const word=getWord(state,task?.wordId),sense=word?.senses.find(s=>s.id===task.senseId);if(!sense)return '';const examples=examplesForSense(word,sense);return examples[task.exampleIndex??(task.round-1)%examples.length]?.en||'';}
function allAudio(word){if(!word)return [];return [spokenWord(word),audioQuestion(word),...wordEntries(word).flatMap(entry=>(entry.examples||[]).map(ex=>ex.en)),...word.senses.flatMap(s=>(s.examples||[]).map(ex=>ex.en))];}
export function learningAudioLookahead(state){
 const q=state.session,current=q?.current;if(!current||q.stage==='done')return [];
 // Mirror next()'s rotation without changing the queue or any learning progress.
 const waiting=q.queue.filter(t=>!q.states[t.senseId]?.passed&&!state.knownWords?.[t.wordId]);
 const next=waiting.find(t=>t.wordId!==current.wordId)||waiting[0];
 const word=getWord(state,current.wordId),nextWord=getWord(state,next?.wordId);
 // Current context first, then the next word and every one of its examples.
 return [...new Set([spokenWord(word),taskExample(state,current),audioQuestion(word),nextWord&&spokenWord(nextWord),taskExample(state,next),nextWord&&audioQuestion(nextWord),...allAudio(nextWord),...allAudio(word)].filter(Boolean))];
}
export function learningSessionAudio(state){
 const q=state.session;if(!q||q.stage==='done')return [];
 const ids=[...new Set([q.current?.wordId,...q.queue.map(t=>t.wordId),...Object.keys(q.types)])].filter(id=>id&&!state.knownWords?.[id]);
 return [...new Set([...learningAudioLookahead(state),...ids.flatMap(id=>allAudio(getWord(state,id)))])];
}
