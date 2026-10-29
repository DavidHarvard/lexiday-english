import {listeningKey,saveListeningPosition,checkListeningAnswers,LISTENING_ANSWERS,saveListeningNote} from './listening-model.js';
let catalogPromise;
let layoutsPromise;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getCatalog(){
 if(!catalogPromise)catalogPromise=fetch('/listening/cambridge-04/catalog.json').then(r=>{if(!r.ok)throw Error('听力目录加载失败');return r.json();}).catch(e=>{catalogPromise=null;throw e;});
 return catalogPromise;
}
export async function mountListening(host,notes,save){
 if(!host||host.dataset.mounted)return;host.dataset.mounted='true';
 try{
  if(!layoutsPromise)layoutsPromise=fetch('/listening/cambridge-04/question-layouts.json').then(r=>{if(!r.ok)throw Error('题页加载失败');return r.json();}).catch(e=>{layoutsPromise=null;throw e;});
  const [tracks,layouts]=await Promise.all([getCatalog(),layoutsPromise]);if(!host.isConnected)return;
  const scope=host.closest('.listening-layout');
  const questions=scope.querySelector('#listening-question-workspace');
  const transcript=scope.querySelector('#listening-transcript');
  let generation=0;
  function select(id){
   const track=tracks.find(t=>t.id===id)||tracks[0], key=field=>listeningKey(track.id,field);
   notes['listening:selected']=track.id;
   const revision=++generation;
   const position=Number(notes[key('position')])||0;
   saveListeningPosition(notes,track,position);save();
   transcript.hidden=true;transcript.textContent='';
   host.innerHTML=`<label for="listening-track">练习材料<select id="listening-track">${tracks.map(t=>`<option value="${t.id}" ${t.id===track.id?'selected':''}>Test ${t.test} · Section ${t.part} · ${escape(t.title)}</option>`).join('')}</select></label>
    <audio id="i-audio" controls preload="metadata" src="${track.audio}"></audio>
    <div class="listening-player-actions"><button type="button" id="listening-rewind">后退 5 秒</button><button type="button" class="primary" id="listening-transcript-button" aria-expanded="false" aria-controls="listening-transcript">显示英文原文</button></div>
    <p class="fine"><a href="${track.audio}" download="${track.filename}">下载音频</a></p>
    <p class="fine" id="listening-audio-error" role="status"></p>`;
   questions.innerHTML=`<h3>对应题目 · Questions ${(track.part-1)*10+1}–${track.part*10}</h3><p class="fine">填空题输入英文或数字；选择与配对题输入原题字母，多选题按提示填写。答案自动保存。</p>
    <p class="fine listening-pan-hint">直接在原题空白处填写。题页可左右滑动；选择题在题号右侧填写字母。</p>
    <div class="listening-paper-scroll" tabindex="0" aria-label="完整原题与答题区，可左右滚动">${layouts[track.id].map((page,i)=>`<div class="listening-paper" style="aspect-ratio:${page.width}/${page.height}"><img src="${page.image}" alt="Test ${track.test} Section ${track.part} 完整原题，第 ${i+1} 页" loading="lazy">${page.fields.map(f=>{
     const full=notes[key('answer-'+f.number)]||'',value=f.parts===1?full:full.split(' / ')[f.part]||'';
     return `<input id="listening-answer-${f.number}${f.part?'-'+f.part:''}" class="listening-paper-input" data-listening-answer="${f.number}" data-answer-part="${f.part}" data-answer-parts="${f.parts}" autocomplete="off" maxlength="300" value="${escape(value)}" aria-label="第 ${f.number} 题答案${f.parts>1?'，第 '+(f.part+1)+' 空':''}" aria-describedby="listening-feedback-${f.number}" title="第 ${f.number} 题" style="left:${f.x/page.width*100}%;top:${f.y/page.height*100}%;width:${f.width/page.width*100}%;height:${f.height/page.height*100}%">`;
    }).join('')}</div>`).join('')}</div>
    <div class="listening-results">${track.questions.map(q=>`<p id="listening-feedback-${q.number}" class="listening-feedback" hidden></p>`).join('')}</div>
    ${LISTENING_ANSWERS[track.id]?'<button type="button" id="listening-check" class="primary">检验答案</button><p id="listening-score" role="status" aria-live="polite"></p>':'<p class="fine">此段暂未提供标准答案，可填写保存，暂不自动判分。</p>'}`;
   const audio=host.querySelector('audio');
   const remember=()=>{if(revision!==generation)return;saveListeningPosition(notes,track,audio.currentTime);save();};
   audio.addEventListener('loadedmetadata',()=>{if(position>0&&position<audio.duration)audio.currentTime=position;});
   let last=-1;
   audio.addEventListener('timeupdate',()=>{const second=Math.floor(audio.currentTime);if(second!==last){last=second;remember();}});
   for(const name of ['play','pause','seeked','ended'])audio.addEventListener(name,remember);
   audio.addEventListener('error',()=>{host.querySelector('#listening-audio-error').textContent='音频加载失败，请检查网络后重新选择材料。已保存的备注和答案仍保留。';});
   host.querySelector('#listening-track').onchange=e=>{remember();audio.pause();select(e.target.value);};
   host.querySelector('#listening-rewind').onclick=()=>{audio.currentTime=Math.max(0,audio.currentTime-5);};
   questions.querySelectorAll('[data-listening-answer]').forEach(el=>el.oninput=()=>{
    const number=el.dataset.listeningAnswer;
    notes[key('answer-'+number)]=Number(el.dataset.answerParts)>1?Array.from(questions.querySelectorAll(`[data-listening-answer="${number}"]`)).sort((a,b)=>Number(a.dataset.answerPart)-Number(b.dataset.answerPart)).map(input=>input.value).join(' / '):el.value;save();
    questions.querySelectorAll('.listening-feedback').forEach(p=>p.hidden=true);
    questions.querySelectorAll('[data-listening-answer]').forEach(input=>input.removeAttribute('aria-invalid'));
    const score=questions.querySelector('#listening-score');if(score)score.textContent='答案已更新，点击“检验答案”重新核对。';
   });
   const check=questions.querySelector('#listening-check');
   if(check)check.onclick=()=>{
    const result=checkListeningAnswers(track.id,track.questions.map(q=>notes[key('answer-'+q.number)]));
    for(const row of result.results){const feedback=questions.querySelector('#listening-feedback-'+row.number);feedback.hidden=false;feedback.className='listening-feedback '+(row.correct?'correct':'incorrect');feedback.textContent=`第 ${row.number} 题：`+(row.correct?'✓ 正确':`${row.answered?'✗ 不正确':'尚未作答'} · 参考答案：${row.expected}`);questions.querySelectorAll(`[data-listening-answer="${row.number}"]`).forEach(input=>input.setAttribute('aria-invalid',String(!row.correct)));}
    questions.querySelector('#listening-score').textContent=`答对 ${result.correct} / ${result.total} 题`;
   };
   const noteHost=document.getElementById('listening-note-workspace');
   if(noteHost){
    noteHost.innerHTML=`<h2>没听清的内容</h2><p class="fine">${escape(track.title)}</p><label for="listening-note">记录本次没有听清的内容</label><textarea id="listening-note" rows="7" maxlength="3000" placeholder="记下没听清的词句或问题。">${escape(notes[key('note-draft')])}</textarea><button type="button" id="listening-save-note" class="primary">保存备注</button><p id="listening-note-status" role="status" aria-live="polite"></p><button type="button" id="listening-first-note" aria-expanded="false" aria-controls="listening-first-note-content" ${notes[key('first-note')]?'':'disabled'}>查看首听备注</button><div id="listening-first-note-content" class="listening-transcript" hidden></div>`;
    const field=noteHost.querySelector('textarea'),status=noteHost.querySelector('#listening-note-status'),button=noteHost.querySelector('#listening-first-note'),panel=noteHost.querySelector('#listening-first-note-content');
    field.oninput=()=>{notes[key('note-draft')]=field.value;save();};
    noteHost.querySelector('#listening-save-note').onclick=()=>{
     try{saveListeningNote(notes,track.id,field.value);save();field.value='';panel.hidden=true;button.disabled=false;button.textContent='查看首听备注';button.setAttribute('aria-expanded','false');status.textContent='备注已保存到当前音频，首听备注默认隐藏。';}
     catch(e){status.textContent=e.message;}
    };
    button.onclick=()=>{panel.hidden=!panel.hidden;panel.textContent=notes[key('first-note')]||'';button.setAttribute('aria-expanded',String(!panel.hidden));button.textContent=panel.hidden?'查看首听备注':'收起首听备注';};
   }
   let text=null,requesting=false;
   host.querySelector('#listening-transcript-button').onclick=async e=>{
    if(requesting)return;const button=e.currentTarget,panel=transcript;
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
