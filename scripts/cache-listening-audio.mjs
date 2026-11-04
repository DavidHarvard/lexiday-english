import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {speechAssets} from '../dist/speech-assets.js';
const base=process.env.LEXIDAY_SPEECH_ORIGIN||'https://lexiday-english.pages.dev',assets={};
fs.mkdirSync('dist/audio/listening',{recursive:true});
for(const text of Object.keys(speechAssets)){
 const path='/audio/listening/melo-'+createHash('sha256').update(text).digest('hex').slice(0,20)+'.wav';
 if(!fs.existsSync('dist'+path)){
  let response;for(let attempt=0;attempt<5;attempt++){try{response=await fetch(base+'/api/speech',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({text}),signal:AbortSignal.timeout(60000)});if(response.ok||response.status===429)break;}catch(error){if(attempt===4)throw error;}await new Promise(r=>setTimeout(r,1500*(attempt+1)));}
  if(!response.ok)throw Error('Speech recording failed: '+response.status+' '+(await response.text()).slice(0,160));
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error('Expected WAV audio');fs.writeFileSync('dist'+path,bytes);
 }
 assets[text]=path;console.log('Prepared '+Object.keys(assets).length+'/'+Object.keys(speechAssets).length);
}
fs.writeFileSync('dist/speech-assets.js','// All listening material uses the same Melo English voice as Play question.\nexport const speechAssets='+JSON.stringify(assets,null,2)+';\n');
