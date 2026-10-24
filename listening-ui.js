import {listeningKey,saveListeningPosition} from './listening-model.js';
let catalogPromise;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getCatalog(){
 if(!catalogPromise)catalogPromise=fetch('/listening/cambridge-04/catalog.json').then(r=>{if(!r.ok)throw Error('听力目录加载失败');return r.json();}).catch(e=>{catalogPromise=null;throw e;});
 return catalogPromise;
}
export async function mountListening(host,notes,save){
 if(!host||host.dataset.mounted)return;host.dataset.mounted='true';
 try{
  const tracks=await getCatalog();if(!host.isConnected)return;
  let generation=0;
  function select(id){
   const track=tracks.find(t=>t.id===id)||tracks[0], key=field=>listeningKey(track.id,field);
   notes['listening:selected']=track.id;
   // Keep old unscoped dictation in the backup; new exercises are isolated.
   if(!notes['listening:legacy-migrated']&&notes['listen-dictation'])notes[key('dictation')]=notes['listen-dictation'];
   notes['listening:legacy-migrated']='true';
   const revision=++generation;
   const position=Number(notes[key('position')])||0;
   saveListeningPosition(notes,track,position);save();
   host.innerHTML=`<label for="listening-track">练习材料<select id="listening-track">${tracks.map(t=>`<option value="${t.id}" ${t.id===track.id?'selected':''}>Test ${t.test} · Section ${t.part} · ${escape(t.title)}</option>`).join('')}</select></label>
    <audio id="i-audio" controls preload="metadata" src="${track.audio}"></audio>
    <div class="i-audio-controls"><button type="button" id="listening-rewind">后退 5 秒</button><label>播放速度<select id="listening-rate"><option value="1">1× 正常</option><option value="0.85">0.85× 辅助</option><option value="1.1">1.1×</option></select></label><a href="${track.audio}" download="${track.filename}">下载音频</a></div>
    <p class="fine" id="listening-audio-error" role="status"></p>
    <label for="listening-source">材料与时间点 · 自动记录</label><input id="listening-source" readonly value="${escape(notes['listen-source'])}">
    <label for="listening-dictation">不看原文，先听写</label><textarea id="listening-dictation" rows="5" placeholder="写下听到的内容，不确定处用 […] 标记。">${escape(notes[key('dictation')])}</textarea>
    <button type="button" id="listening-transcript-button" aria-expanded="false" aria-controls="listening-transcript">显示英文原文</button>
    <div id="listening-transcript" class="listening-transcript" hidden></div>
    <section class="listening-questions"><h3>对应题目 · Questions ${(track.part-1)*10+1}–${track.part*10}</h3><p class="fine">填空题输入英文或数字；选择与配对题输入原题字母，多选题按提示填写。答案自动保存。</p>
    <details class="listening-original"><summary>查看完整原题、选项与图表</summary>${track.pages.map((p,i)=>`<img src="${p}" alt="Test ${track.test} Section ${track.part} 原题，第 ${i+1} 页" loading="lazy">`).join('')}</details>
    ${track.questions.map(q=>`<label class="listening-answer" for="listening-answer-${q.number}"><span><b>${q.number}.</b> ${escape(q.prompt)}</span><input id="listening-answer-${q.number}" data-listening-answer="${q.number}" autocomplete="off" maxlength="300" value="${escape(notes[key('answer-'+q.number)])}" aria-label="第 ${q.number} 题答案"></label>`).join('')}</section>`;
   const audio=host.querySelector('audio'),source=host.querySelector('#listening-source');
   const reviewSource=document.querySelector('form[data-skill="listening"] input[name="source"]');
   if(reviewSource){reviewSource.value=notes['listen-source'];reviewSource.readOnly=true;}
   const remember=()=>{if(revision!==generation)return;saveListeningPosition(notes,track,audio.currentTime);source.value=notes['listen-source'];if(reviewSource)reviewSource.value=notes['listen-source'];save();};
   audio.addEventListener('loadedmetadata',()=>{if(position>0&&position<audio.duration)audio.currentTime=position;});
   let last=-1;
   audio.addEventListener('timeupdate',()=>{const second=Math.floor(audio.currentTime);if(second!==last){last=second;remember();}});
   for(const name of ['play','pause','seeked','ended'])audio.addEventListener(name,remember);
   audio.addEventListener('error',()=>{host.querySelector('#listening-audio-error').textContent='音频加载失败，请检查网络后重新选择材料。已保存的听写和答案仍保留。';});
   host.querySelector('#listening-track').onchange=e=>{remember();audio.pause();select(e.target.value);};
   host.querySelector('#listening-rewind').onclick=()=>{audio.currentTime=Math.max(0,audio.currentTime-5);};
   host.querySelector('#listening-rate').onchange=e=>{audio.playbackRate=Number(e.target.value);};
   host.querySelector('#listening-dictation').oninput=e=>{notes[key('dictation')]=e.target.value;save();};
   host.querySelectorAll('[data-listening-answer]').forEach(el=>el.oninput=()=>{notes[key('answer-'+el.dataset.listeningAnswer)]=el.value;save();});
   let text=null,requesting=false;
   host.querySelector('#listening-transcript-button').onclick=async e=>{
    if(requesting)return;const button=e.currentTarget,panel=host.querySelector('#listening-transcript');
    if(!panel.hidden){panel.hidden=true;button.textContent='显示英文原文';button.setAttribute('aria-expanded','false');return;}
    requesting=true;button.disabled=true;button.textContent='正在加载原文…';
    try{if(text===null){const r=await fetch(track.transcript);if(!r.ok)throw Error();text=await r.text();}if(revision!==generation)return;panel.textContent=text;panel.hidden=false;button.textContent='收起英文原文';button.setAttribute('aria-expanded','true');}
    catch{if(revision===generation){button.textContent='加载失败，点击重试';}}
    finally{requesting=false;button.disabled=false;}
   };
  }
  select(notes['listening:selected']);
 }catch{if(host.isConnected){host.innerHTML='<p class="warning" role="alert">听力材料加载失败，请检查网络。</p><button type="button">重新加载</button>';host.querySelector('button').onclick=()=>{delete host.dataset.mounted;mountListening(host,notes,save);};}}
}
