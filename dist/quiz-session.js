export function quizGroup(quiz){const current=quiz?.questions[quiz.index];if(!current)return [];return quiz.questions.map((question,index)=>({question,index})).filter(x=>x.question.passageIndex===current.passageIndex);}
export function passageAudio(question){return question.audioParts?.length===3?question.audioParts:[question.en];}
export function quizLookahead(quiz){const current=quiz?.questions[quiz.index];if(!current)return [];const passages=new Set();return quiz.questions.filter(q=>q.passageIndex>=current.passageIndex&&q.passageIndex<=current.passageIndex+1).flatMap(q=>{const first=!passages.has(q.passageIndex);passages.add(q.passageIndex);return [...(first?passageAudio(q):[]),q.spokenPrompt];});}
export function selectQuizOption(quiz,index,choice){if(quiz.submitted)return;const q=quiz.questions[index];if(!quizGroup(quiz).some(x=>x.index===index)||!Number.isInteger(choice)||choice<0||choice>=q.options.length)throw Error('选项无效。');(quiz.choices??={})[index]=choice;}
export function submitQuizGroup(quiz){
 if(quiz.submitted)return [];
 const group=quizGroup(quiz);if(!group.length||group.some(({index})=>!Number.isInteger(quiz.choices?.[index])))throw Error('请先为本段每一道题选择答案。');
 const results=group.map(({question:q,index})=>({index,senseId:q.senseId,chosen:q.options[quiz.choices[index]],correct:q.options[quiz.choices[index]]===q.meaning,assisted:!!quiz.revealed,passageIndex:q.passageIndex,kind:q.kind}));
 for(const answer of results)quiz.answers[answer.index]=answer;quiz.submitted=true;quiz.optionsVisible=true;return results;
}
export function nextQuizGroup(quiz){if(!quiz.submitted)return;quiz.index+=quizGroup(quiz).length;Object.assign(quiz,{submitted:false,revealed:false,played:false,audioPlaying:false,audioUnavailable:false,optionsVisible:false});}
