let activeTurn=null,audioContext=null;
export function captureBookPage(canvas){
 if(!canvas?.dataset.page||canvas.hidden||!canvas.width)return null;
 const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(canvas,0,0);
 return {canvas:copy,width:parseFloat(canvas.style.width),height:parseFloat(canvas.style.height),page:Number(canvas.dataset.renderedPage||canvas.dataset.page)};
}
export function cancelBookTurn(){activeTurn?.cancel();activeTurn=null;}
export function prepareBookSound(enabled){
 if(!enabled)return;
 try{const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;audioContext??=new AudioContext();void audioContext.resume().catch(()=>{});}catch{}
}
function pageSound(){
 if(!audioContext||audioContext.state!=='running')return;
 try{
  const duration=.34,buffer=audioContext.createBuffer(1,Math.ceil(audioContext.sampleRate*duration),audioContext.sampleRate),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++){const t=i/samples.length;samples[i]=(Math.random()*2-1)*Math.sin(Math.PI*t)**1.8*(.65+.35*Math.sin(t*46));}
  const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1900;filter.Q.value=.65;gain.gain.value=.2;
  source.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();
 }catch{}
}
const copyInto=(source)=>{const c=document.createElement('canvas');c.width=source.width;c.height=source.height;c.getContext('2d').drawImage(source,0,0);return c;};
export async function turnBookPage(host,canvas,previous,{sound=true}={}){
 cancelBookTurn();if(!previous||!host.isConnected)return;
 const direction=Number(canvas.dataset.renderedPage)>previous.page?'forward':'backward';
 if(sound)pageSound();
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const layer=document.createElement('div');layer.className='book-turn-layer '+direction;layer.setAttribute('aria-hidden','true');
 const width=parseFloat(canvas.style.width),height=parseFloat(canvas.style.height);layer.style.width=width+'px';layer.style.height=height+'px';
 const leaf=document.createElement('div');leaf.className='book-turn-leaf';
 const front=document.createElement('div'),back=document.createElement('div');front.className='book-turn-front';back.className='book-turn-back';
 front.append(direction==='forward'?previous.canvas:copyInto(canvas));back.append(copyInto(direction==='forward'?previous.canvas:canvas));leaf.append(front,back);
 if(direction==='backward'){const base=document.createElement('div');base.className='book-turn-base';base.append(previous.canvas);layer.append(base);}
 const shadow=document.createElement('div');shadow.className='book-turn-shadow';layer.append(shadow,leaf);host.append(layer);host.classList.add('is-turning');
 const frames=direction==='forward'?[{transform:'rotateY(0deg)',opacity:1},{transform:'rotateY(-78deg)',opacity:1,offset:.5},{transform:'rotateY(-166deg)',opacity:0}]:[{transform:'rotateY(-166deg)',opacity:0},{transform:'rotateY(-78deg)',opacity:1,offset:.5},{transform:'rotateY(0deg)',opacity:1}];
 const animation=leaf.animate(frames,{duration:620,easing:'cubic-bezier(.24,.55,.3,1)',fill:'forwards'}),shade=shadow.animate([{opacity:0},{opacity:.34,offset:.45},{opacity:0}],{duration:620,fill:'forwards'});
 const job={cancel(){animation.cancel();shade.cancel();layer.remove();host.classList.remove('is-turning');}};activeTurn=job;
 try{await animation.finished;}catch{}finally{job.cancel();if(activeTurn===job)activeTurn=null;}
}
