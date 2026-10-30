import {listeningKey,saveListeningPosition,checkListeningAnswers,LISTENING_ANSWERS,saveListeningNote,createListeningAttempts} from './listening-model.js';
import {accountState,syncNow} from './account-store.js';
let catalogPromise;
let layoutsPromise;
const attempts=createListeningAttempts();
let currentWorkspace;
if(typeof window!=='undefined')window.addEventListener('pageshow',event=>{
 if(!event.persisted)return;attempts.reset();
 const current=currentWorkspace;if(current?.host.isConnected){delete current.host.dataset.mounted;mountListening(current.host,current.notes,current.save);}
});
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getCatalog(){
 if(!catalogPromise)catalogPromise=fetch('/listening/cambridge-04/catalog.json').then(r=>{if(!r.ok)throw Error('听力目录加载失败');return r.json();}).catch(e=>{catalogPromise=null;throw e;});
 return catalogPromise;
}
export async function mountListening(host,notes,save){
 if(!host||host.dataset.mounted)return;host.dataset.mounted='true';
 currentWorkspace={host,notes,save};
 try{
  if(!layoutsPromise)layoutsPromise=fetch('/listening/cambridge-04/question-layouts.json').then(r=>{if(!r.ok)throw Error('题页加载失败');return r.json();}).catch(e=>{layoutsPromise=null;throw e;});
  const [tracks,layouts]=await Promise.all([getCatalog(),layoutsPromise]);if(!host.isConnected)return;
  const scope=host.closest('.listening-layout');
  const questions=scope.querySelector('#listening-question-workspace');
  const transcript=scope.querySelector('#listening-transcript');
  let generation=0;
  function select(id){
   const track=tracks.find(t=>t.id===id)||tracks[0], key=field=>listeningKey(track.id,field),answers=attempts.forTrack(notes,track.id);
   const previousTrack=notes['listening:selected'],previousPosition=notes[key('position')];notes['listening:selected']=track.id;
   const revision=++generation;
   const position=Number(notes[key('position')])||0;
   saveListeningPosition(notes,track,position);if(previousTrack!==track.id||previousPosition!==notes[key('position')])save();
   transcript.hidden=true;transcript.textContent='';
   host.innerHTML=`<label for="listening-track">练习材料<select id="listening-track">${tracks.map(t=>`<option value="${t.id}" ${t.id===track.id?'selected':''}>Test ${t.test} · Section ${t.part} · ${escape(t.title)}</option>`).join('')}</select></label>
    <audio id="i-audio" controls preload="metadata" src="${track.audio}"></audio>
    <div class="listening-player-actions"><button type="button" id="listening-rewind">后退 5 秒</button><button type="button" class="primary" id="listening-transcript-button" aria-expanded="false" aria-controls="listening-transcript">显示英文原文</button></div>
    <p class="fine"><a href="${track.audio}" download="${track.filename}">下载音频</a></p>
    <p class="fine" id="listening-audio-error" role="status"></p>`;
   questions.innerHTML=`<h3>对应题目 · Questions ${(track.part-1)*10+1}–${track.part*10}</h3><p class="fine">填空题输入英文或数字；选择与配对题输入原题字母。单题多选可填 D, F；跨两个题号的多选题每题填一个字母，不限顺序。答案仅在本次打开期间保留，刷新或重新打开后从空白开始；笔记单独长期保存。</p>
    <p class="fine listening-pan-hint">直接在原题空白处填写。题页可左右滑动；选择题在题号右侧填写字母。</p>
    <div class="listening-paper-scroll" tabindex="0" aria-label="完整原题与答题区，可左右滚动">${layouts[track.id].map((page,i)=>`<div class="listening-paper" style="aspect-ratio:${page.width}/${page.height}"><img src="${page.image}" alt="Test ${track.test} Section ${track.part} 完整原题，第 ${i+1} 页" loading="lazy">${page.fields.map(f=>{
     const full=answers[f.number]||'',value=f.parts===1?full:full.split(' / ')[f.part]||'';
     return `<input id="listening-answer-${f.number}${f.part?'-'+f.part:''}" class="listening-paper-input" data-listening-answer="${f.number}" data-answer-part="${f.part}" data-answer-parts="${f.parts}" autocomplete="off" maxlength="300" value="${escape(value)}" aria-label="第 ${f.number} 题答案${f.parts>1?'，第 '+(f.part+1)+' 空':''}" aria-describedby="listening-feedback-${f.number}" title="第 ${f.number} 题" style="left:${f.x/page.width*100}%;top:${f.y/page.height*100}%;width:${f.width/page.width*100}%;height:${f.height/page.height*100}%">`;
    }).join('')}</div>`).join('')}</div>
    <div class="listening-results">${track.questions.map(q=>`<p id="listening-feedback-${q.number}" class="listening-feedback" hidden></p>`).join('')}</div>
    ${LISTENING_ANSWERS[track.id]?`<button type="button" id="listening-check" class="primary">检验答案</button><p id="listening-score" role="status" aria-live="polite"></p><p class="fine">按当前 Section 的 10 个题号计分；单题双空或多选需全部答对。<a href="${escape(LISTENING_ANSWERS[track.id].source)}" target="_blank" rel="noopener noreferrer">答案来源：IELTS EXTREMES · Test ${track.test}</a></p>`:'<p class="fine">此段暂未提供标准答案，可在本次打开期间填写，暂不自动判分。</p>'}`;
   const audio=host.querySelector('audio');
   const remember=()=>{if(revision!==generation)return;saveListeningPosition(notes,track,audio.currentTime);save();};
   audio.addEventListener('loadedmetadata',()=>{if(position>0&&position<audio.duration)audio.currentTime=position;});
   let last=-1;
   audio.addEventListener('timeupdate',()=>{const second=Math.floor(audio.currentTime);if(second!==last){last=second;remember();}});
   for(const name of ['play','pause','seeked','ended'])audio.addEventListener(name,remember);
   audio.addEventListener('error',()=>{host.querySelector('#listening-audio-error').textContent='音频加载失败，请检查网络后重新选择材料。已保存的备注及本次打开期间的答案仍保留。';});
   host.querySelector('#listening-track').onchange=e=>{remember();audio.pause();select(e.target.value);};
   host.querySelector('#listening-rewind').onclick=()=>{audio.currentTime=Math.max(0,audio.currentTime-5);};
   questions.querySelectorAll('[data-listening-answer]').forEach(el=>el.oninput=()=>{
    const number=el.dataset.listeningAnswer;
    answers[number]=Number(el.dataset.answerParts)>1?Array.from(questions.querySelectorAll(`[data-listening-answer="${number}"]`)).sort((a,b)=>Number(a.dataset.answerPart)-Number(b.dataset.answerPart)).map(input=>input.value).join(' / '):el.value;
    questions.querySelectorAll('.listening-feedback').forEach(p=>p.hidden=true);
    questions.querySelectorAll('[data-listening-answer]').forEach(input=>input.removeAttribute('aria-invalid'));
    const score=questions.querySelector('#listening-score');if(score)score.textContent='答案已更新，点击“检验答案”重新核对。';
   });
   const check=questions.querySelector('#listening-check');
   if(check)check.onclick=()=>{
    const result=checkListeningAnswers(track.id,track.questions.map(q=>answers[q.number]));
    for(const row of result.results){const feedback=questions.querySelector('#listening-feedback-'+row.number);feedback.hidden=false;feedback.className='listening-feedback '+(row.correct?'correct':'incorrect');feedback.textContent=`第 ${row.number} 题：`+(row.correct?'✓ 正确':`${row.answered?'✗ 不正确':'尚未作答'} · 参考答案：${row.expected}`);questions.querySelectorAll(`[data-listening-answer="${row.number}"]`).forEach(input=>input.setAttribute('aria-invalid',String(!row.correct)));}
    questions.querySelector('#listening-score').textContent=`答对 ${result.correct} / ${result.total} 题`;
   };
   const noteHost=document.getElementById('listening-note-workspace');
   if(noteHost){
    const first=notes[key('first-note')]||'',latest=notes[key('latest-note')]||'',legacy=notes[key('dictation')]||'';
    noteHost.innerHTML=`<h2>没听清的内容</h2><p class="fine">${escape(track.title)} · 首听备注长期保留，后续备注不会覆盖首次记录。</p><label for="listening-note">记录本次没有听清的内容</label><textarea id="listening-note" rows="7" maxlength="3000" placeholder="记下没听清的词句或问题。">${escape(notes[key('note-draft')])}</textarea><button type="button" id="listening-save-note" class="primary">保存备注</button><p id="listening-note-status" role="status" aria-live="polite"></p><button type="button" id="listening-first-note" aria-expanded="${!!first}" aria-controls="listening-first-note-content" ${first?'':'disabled'}>${first?'收起首听备注':'尚未保存首听备注'}</button><div id="listening-first-note-content" class="listening-transcript" ${first?'':'hidden'}>${escape(first)}</div><details id="listening-latest-note" ${latest&&latest!==first?'':'hidden'}><summary>最近一次保存的备注</summary><div class="listening-transcript">${escape(latest)}</div></details>${legacy&&legacy!==first?`<details open><summary>旧版听写笔记</summary><div class="listening-transcript">${escape(legacy)}</div></details>`:''}`;
    const field=noteHost.querySelector('textarea'),status=noteHost.querySelector('#listening-note-status'),button=noteHost.querySelector('#listening-first-note'),panel=noteHost.querySelector('#listening-first-note-content');
    field.oninput=()=>{notes[key('note-draft')]=field.value;save();};
    const savedStatus=()=>{const a=accountState();return !a.user?'备注已保存在本机。登录后可在账号中导入访客进度，再同步到服务器。':a.conflicts.includes('ielts')?'备注已保存在本机，但账号有同步冲突。请在“账号 / 同步详情”选择要保留的记录。':!a.verified||a.pending.includes('ielts')?'备注已保存在本机，等待同步到账号。请联网后查看“账号 / 同步详情”。':'首听备注已保存到服务器，重新登录后仍可查看。';};
    if(first||latest||legacy)status.textContent=savedStatus();
    const saveButton=noteHost.querySelector('#listening-save-note');
    saveButton.onclick=async()=>{
     saveButton.disabled=true;
     try{saveListeningNote(notes,track.id,field.value);if(save()===false)throw Error('备注尚未保存，请保留输入内容并检查浏览器存储。');field.value='';panel.textContent=notes[key('first-note')];panel.hidden=false;button.disabled=false;button.textContent='收起首听备注';button.setAttribute('aria-expanded','true');const recent=noteHost.querySelector('#listening-latest-note');recent.hidden=notes[key('latest-note')]===notes[key('first-note')];recent.querySelector('div').textContent=notes[key('latest-note')];status.textContent=accountState().user?'正在保存到服务器…':'正在保存备注…';await syncNow();status.textContent=savedStatus();}
     catch(e){status.textContent=e.message;}
     finally{saveButton.disabled=false;}
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
