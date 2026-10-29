import {wordMap} from '../dist/data.js';
import {meaningAliases} from '../dist/word-content.js';
import {answerSense as visualAnswer,continueLearning,markListeningPlayed,answerListening,answerReviewMeaning,activeExample} from '../dist/engine.js';
export function expectedMeaning(state){const q=state.session,w=wordMap[q.current.wordId],s=w.senses.find(s=>s.id===q.current.senseId),cue=q.stage==='review'?(['context','sentence'].includes(q.cue)?'context':'word'):q.listenCue||'word';return meaningAliases(w,s,cue,activeExample(state))[0];}
export function answerSense(state,known){visualAnswer(state,known);continueLearning(state,0);markListeningPlayed(state);answerListening(state,known?expectedMeaning(state):'这不是正确的释义');}
export function answerReviewCorrect(state){return answerReviewMeaning(state,expectedMeaning(state));}
