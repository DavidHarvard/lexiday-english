// One cancellable queue for autoplay and manual replay; stale callbacks never pass a test.
export function createSpeechController({getSynthesis=()=>globalThis.speechSynthesis,makeUtterance=text=>new SpeechSynthesisUtterance(text),onError=()=>{}}={}){
 let generation=0,active=null;
 function stop(){generation++;active=null;getSynthesis()?.cancel();}
 function play(texts,onEnd){
  stop();const token=generation,synthesis=getSynthesis();
  const queue=(Array.isArray(texts)?texts:[texts]).filter(Boolean).map(String);
  if(!synthesis||!queue.length){onError('unavailable');return false;}
  function next(){
   if(token!==generation)return;
   const text=queue.shift();if(!text){onEnd?.();return;}
   try{
    const utterance=makeUtterance(text);active=utterance;utterance.lang='en-US';utterance.rate=.88;
    const voices=synthesis.getVoices(),voice=voices.find(v=>v.lang==='en-US')||voices.find(v=>v.lang?.startsWith('en'));
    if(voice)utterance.voice=voice;
    utterance.onend=()=>{if(token===generation){active=null;next();}};
    utterance.onerror=event=>{if(token!==generation)return;active=null;generation++;if(!['canceled','interrupted'].includes(event.error))onError(event.error||'unavailable');};
    synthesis.speak(utterance);
   }catch{if(token===generation){generation++;onError('unavailable');}}
  }
  next();return true;
 }
 return {play,stop};
}
