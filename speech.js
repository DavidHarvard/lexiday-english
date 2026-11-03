import {recordedAsset} from './speech-storage.js';
import {speechAudioCache} from './speech-cache.js';
// Word, sentence and quiz playback share one cancellable queue. Local English
// voices are preferred; missing/broken engines fall back to same-origin audio.
export function speechChunks(text,limit=380){
 const words=String(text).trim().split(/\s+/),chunks=[];let chunk='';
 for(const word of words){if(word.length>limit)throw Error('朗读文字过长。');if(chunk&&chunk.length+word.length+1>limit){chunks.push(chunk);chunk='';}chunk+=(chunk?' ':'')+word;}if(chunk)chunks.push(chunk);return chunks;
}
export function createSpeechController({getSynthesis=()=>globalThis.speechSynthesis,makeUtterance=text=>new SpeechSynthesisUtterance(text),makeAudio=()=>new Audio(),loadAudio=(text,signal)=>speechAudioCache.load(text,signal),prefetchAudio=texts=>speechAudioCache.prefetch(texts),createAudioUrl=blob=>URL.createObjectURL(blob),revokeAudioUrl=url=>URL.revokeObjectURL(url),onError=()=>{},setTimer=(fn,ms)=>{const timer=setTimeout(fn,ms);timer.unref?.();return timer;},clearTimer=clearTimeout}={}){
 let generation=0,active=null,audio=null,objectUrl=null,request=null,timer=null,voiceCleanup=null,preferAudio=false,prefetchTexts=[];
 function clearWatch(){if(timer!==null)clearTimer(timer);timer=null;}
 function clearMedia(){if(audio){audio.onended=audio.onerror=audio.onplaying=audio.ontimeupdate=null;audio.pause();audio.removeAttribute?.('src');audio.load?.();audio=null;}if(objectUrl){revokeAudioUrl(objectUrl);objectUrl=null;}}
 function stop(){generation++;active=null;clearWatch();voiceCleanup?.();voiceCleanup=null;request?.abort();request=null;clearMedia();try{getSynthesis()?.cancel();}catch{}}
 function play(texts,onEnd,{preferRecorded=false}={}){
  stop();const token=generation,synthesis=getSynthesis();let queue;
  try{queue=(Array.isArray(texts)?texts:[texts]).filter(Boolean).flatMap(text=>speechChunks(text));}catch{onError('unavailable');return false;}
  if(!queue.length){onError('unavailable');return false;}
  const current=()=>token===generation;
  const watch=(callback,ms)=>{clearWatch();timer=setTimer(()=>{timer=null;if(current())callback();},ms);};
  function fail(reason){if(!current())return;stop();onError(reason||'unavailable');}
  function next(){if(!current())return;clearWatch();active=null;clearMedia();const text=queue.shift();if(text===undefined){onEnd?.();return;}choose(text);}
  async function media(text){
   if(!current())return;clearWatch();active=null;
   if(!loadAudio){fail('unavailable');return;}
   preferAudio=true;prefetchAudio([...queue,...prefetchTexts]);request=new AbortController();const pending=request;
   watch(()=>fail('audio-timeout'),30000);
   try{const blob=await loadAudio(text,pending.signal);if(!current()||pending.signal.aborted)return;request=null;clearWatch();objectUrl=createAudioUrl(blob);const player=makeAudio();audio=player;player.preload='auto';player.volume=1;player.muted=false;player.playbackRate=.95;player.src=objectUrl;let started=false;
    player.onplaying=()=>{if(current()&&audio===player){started=true;watch(()=>fail('audio-timeout'),30000);}};
    player.ontimeupdate=()=>{if(current()&&audio===player&&started)watch(()=>fail('audio-timeout'),30000);};
    player.onended=()=>{if(current()&&audio===player){if(started)next();else fail('audio-unavailable');}};
    player.onerror=()=>{if(current()&&audio===player)fail('audio-unavailable');};
    watch(()=>fail('audio-timeout'),15000);await player.play();
   }catch(error){if(current())fail(error.name==='NotAllowedError'?'not-allowed':'audio-unavailable');}
  }
  function native(text,voice){
   if(!current())return;
   try{const utterance=makeUtterance(text);active=utterance;utterance.lang=voice.lang||'en-US';utterance.voice=voice;utterance.rate=.88;utterance.volume=1;
    const recover=()=>{if(!current()||active!==utterance)return;active=null;clearWatch();try{synthesis.cancel();}catch{}void media(text);};
    utterance.onstart=()=>{if(current()&&active===utterance)watch(recover,Math.max(20000,text.length*120+10000));};
    utterance.onend=()=>{if(current()&&active===utterance)next();};
    utterance.onerror=event=>{if(!current()||active!==utterance)return;if(event.error==='not-allowed'){fail('not-allowed');return;}recover();};
    if(synthesis.paused)synthesis.resume?.();watch(recover,5000);synthesis.speak(utterance);
   }catch{void media(text);}
  }
  function choose(text,waited=false){
   if(!current())return;const voices=synthesis?.getVoices?.()||[],english=voices.filter(v=>/^en(?:[-_]|$)/i.test(v.lang||''));
   // Remote browser voices can silently fail behind a firewall. The server
   // route also covers devices with only Chinese voices, without OS changes.
   const voice=english.find(v=>v.localService===true)||english.find(v=>v.localService===undefined);
   if(voice&&!preferAudio&&!preferRecorded&&!recordedAsset(text)){native(text,voice);return;}
   if(!voices.length&&synthesis?.addEventListener&&!waited&&!preferAudio&&!preferRecorded&&!recordedAsset(text)){
    const ready=()=>{if(!current())return;clearWatch();voiceCleanup?.();voiceCleanup=null;choose(text,true);};
    synthesis.addEventListener('voiceschanged',ready);voiceCleanup=()=>synthesis.removeEventListener('voiceschanged',ready);watch(ready,700);return;
   }
   void media(text);
  }
  next();return true;
 }
 function preload(texts,{recorded=false}={}){
  prefetchTexts=[...new Set(texts.filter(Boolean).flatMap(text=>speechChunks(text)))];
  const synthesis=getSynthesis(),voices=synthesis?.getVoices?.()||[],local=voices.some(v=>/^en(?:[-_]|$)/i.test(v.lang||'')&&v.localService!==false);
  prefetchAudio(recorded?prefetchTexts:!prefetchTexts.length||local&&!preferAudio?[]:preferAudio||!synthesis||voices.length?prefetchTexts:[]);
 }
 return {play,stop,preload};
}
