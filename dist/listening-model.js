export function listeningKey(id, field) { return `listening:${id}:${field}`; }
export function listeningTime(seconds) {
 const n=Math.max(0,Math.floor(Number(seconds)||0));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
}
export function practiceSource(track,seconds,date=new Date()) {
 const time=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);
 return `${track.filename} · ${time} · ${listeningTime(seconds)}`;
}
export function saveListeningPosition(notes,track,seconds,date) {
 notes[listeningKey(track.id,'position')]=String(Math.max(0,Number(seconds)||0));
 notes['listen-source']=practiceSource(track,seconds,date);
}
