import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {initial} from '../dist/engine.js';
import {words} from '../dist/data.js';
import {fallbackPractice} from '../dist/listening-practice.js';
import {speechChunks} from '../dist/speech.js';
// These are original authored teaching passages. Variable example sentences
// are prefetched from the speech endpoint during study, not baked into a story.
const state=initial(),targets=words.slice(0,5).map(w=>({wordId:w.id,senseId:w.senses[0].id}));
const pack=fallbackPractice(state,targets),clips=[...new Set(pack.passages.flatMap(p=>[p.audioParts[0],p.audioParts[2],...p.questions.slice(0,2).map(q=>q.spokenPrompt)]).flatMap(text=>speechChunks(text)))];
const jobs=clips.map(text=>({text,path:'dist/audio/listening/'+createHash('sha256').update(text).digest('hex').slice(0,20)+'.wav'}));
fs.mkdirSync('dist/audio/listening',{recursive:true});fs.mkdirSync('outputs/listening-audio',{recursive:true});
fs.writeFileSync('outputs/listening-audio/jobs.json',JSON.stringify(jobs,null,2));
fs.writeFileSync('dist/speech-assets.js','// Original teaching material, recorded with Microsoft Zira (en-US).\nexport const speechAssets='+JSON.stringify(Object.fromEntries(jobs.map(j=>[j.text,'/'+j.path.slice(5)])),null,2)+';\n');
console.log(JSON.stringify({clips:jobs.length}));
