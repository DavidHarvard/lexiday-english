export function listeningKey(id, field) { return `listening:${id}:${field}`; }
export function saveListeningPosition(notes,track,seconds) {
 notes[listeningKey(track.id,'position')]=String(Math.max(0,Number(seconds)||0));
}
export const FIRST_LISTENING_ID='test-1-section-1-social-programme-trips';
export const LISTENING_ANSWERS={
 [FIRST_LISTENING_ID]:[
  ['shopping','variety of shopping'],['guided tours'],['more than 12','over 12'],['notice board'],
  ['13th February','13 February','February 13th','February 13','13th Feb','13 Feb'],
  ['Tower of London'],['Bristol'],['American Museum'],['student newspaper'],['Yentob']
 ]
};
export function normalizeListeningAnswer(value){return String(value??'').normalize('NFKC').toLowerCase().trim().replace(/[.,!?]+$/,'').replace(/\s+/g,' ');}
export function checkListeningAnswers(id,answers){
 const key=LISTENING_ANSWERS[id];if(!key)return null;
 const results=key.map((accepted,i)=>{const answer=normalizeListeningAnswer(answers[i]);return {number:i+1,answered:!!answer,correct:!!answer&&accepted.some(x=>normalizeListeningAnswer(x)===answer),expected:accepted.slice(0,i===4?1:accepted.length).join(' / ')};});
 return {results,correct:results.filter(r=>r.correct).length,total:key.length};
}
export function saveListeningNote(notes,id,text){
 const value=String(text??'').trim();if(!value)throw Error('请先填写没有听清的内容。');
 if(value.length>3000)throw Error('备注最多 3000 个字符。');
 const first=listeningKey(id,'first-note');if(!notes[first])notes[first]=value;
 notes[listeningKey(id,'latest-note')]=value;
 notes[listeningKey(id,'note-draft')]='';
}
