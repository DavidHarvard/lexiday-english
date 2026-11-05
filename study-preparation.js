import {learningSessionAudio} from './learning-audio.js';
import {speechChunks} from './speech.js';
import {speechAudioCache} from './speech-cache.js';
import {invalidWordExamples,repairKnownExamples} from './example-target.js';
import {validateCustomWord} from './personal-words.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createStudyPreparation({getState,save,render,isLearning}){
 let owner=null,session=null,job=null;
 function status(){if(job?.repairError)return job.repairError;if(!job?.repaired)return '正在检查个人词条的例句…';return '已准备 '+job.completed+' / '+job.total+' 段'+(job.failed?' · '+job.failed+' 段等待重试':'');}
 function update(){const node=document.getElementById('study-preparation-status');if(node)node.textContent=status();const progress=document.getElementById('study-preparation-progress');if(progress){progress.max=Math.max(1,job.total);progress.value=job.completed;}}
 async function prepare(current){try{
  if(repairKnownExamples(owner))save();
  for(const word of Object.values(owner.customWords||{})){if(!invalidWordExamples(word).length)continue;
   const response=await fetch('/api/word-examples',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word}),signal:AbortSignal.any([current.controller.signal,AbortSignal.timeout(45000)])});if(!response.ok)throw Error('“'+word.word+'”的例句尚未校正完成，请重试。');const result=await response.json();const candidate={...word,senses:word.senses.map((sense,i)=>({...sense,examples:result.examples?.[i]}))};validateCustomWord(candidate);if(invalidWordExamples(candidate).length)throw Error('例句校验未通过，请重试。');if(job!==current||getState()!==owner)return;word.senses=candidate.senses;save();
  }
  current.repaired=true;const plan=learningSessionAudio(owner).flatMap(text=>speechChunks(text));
  const result=await speechAudioCache.prepare(plan,{signal:current.controller.signal,onProgress:value=>{if(job!==current)return;Object.assign(current,value);update();}});if(job!==current)return;current.failed=result.failed.length;current.done=!current.failed;current.finished=true;
 }catch(error){if(current.controller.signal.aborted)return;current.repairError=error.message;current.finished=true;}
 if(job===current&&getState()===owner&&isLearning()&&!current.bypass)render();}
 function ensure(){const state=getState(),q=state.session;if(!q||q.stage==='done')return;if(owner===state&&session===q&&job)return;job?.controller.abort();owner=state;session=q;job={controller:new AbortController(),completed:0,total:0,failed:0,repaired:false,done:false,bypass:false,finished:false};void prepare(job);}
 function ready(){return !job||job.done||job.repaired&&job.bypass;}
 function view(){if(ready())return '';return '<section class="panel preparation-card"><span class="eyebrow">TODAY’S AUDIO</span><h1>准备今天的单词与例句音频</h1><p>本轮新词、到期复习词和各词义例句会一起下载。已下载的音频下次直接使用。</p><progress id="study-preparation-progress" max="'+Math.max(1,job.total)+'" value="'+job.completed+'"></progress><p id="study-preparation-status" role="status">'+escape(status())+'</p>'+(job.finished?'<button class="primary" data-preparation="retry">重试未完成的音频</button>':'')+(job.repaired?'<button data-preparation="continue">先开始，后台继续下载</button>':'')+'<p class="fine">首次准备需要联网。页面会显示实际下载进度，准备完成后自动进入学习。</p></section>';}
 document.addEventListener('click',event=>{const button=event.target.closest('[data-preparation]');if(!button)return;if(button.dataset.preparation==='continue'&&job?.repaired){job.bypass=true;render();}if(button.dataset.preparation==='retry'){job?.controller.abort();job=null;ensure();render();}});
 return {ensure,ready,view};
}
