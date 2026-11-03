import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createReadingDictionary,dictionaryWord,articleTokens} from '../dist/reading-dictionary.js';
import {readingLibrary} from '../dist/reading-library.js';
import {dictionaryManifest} from '../dist/dictionary-manifest.js';
import {initial,addReadingWord,validateState,begin} from '../dist/engine.js';
const requests=[];
const dictionary=createReadingDictionary({storage:null,fetcher:async path=>{requests.push(path);return new Response(await fs.readFile(new URL('../dist'+path,import.meta.url)));}});
test('10,000-word core plus full dictionary covers every token in every fallback article',async()=>{
 const core=JSON.parse(await fs.readFile(new URL('../dist/dictionary/core.json',import.meta.url)));assert.equal(Object.keys(core).length,10000);assert.equal(dictionaryManifest.entries,399200);
 for(const article of readingLibrary){const coverage=await dictionary.prepare(article,initial());assert.deepEqual(coverage.missing,[],article.title);assert.ok(coverage.total>100);}
 assert.equal(requests.filter(x=>x.endsWith('/core.json')).length,1);
});
test('unselected-book vocabulary, inflections, contractions and new dictionary words remain usable tomorrow',async()=>{
 for(const [word,lemma] of [['hesitated','hesitate'],['children','child'],["kingfisher's",'kingfisher']])assert.equal((await dictionary.lookup(word)).word,lemma);
 assert.match((await dictionary.lookup("couldn't")).record[1],/could not/);assert.equal(await dictionary.lookup('qzxyzznoentry'),null);
 const entry=await dictionary.lookup('kingfisher');assert.match(entry.record[1],/翠鸟/);
 const word=dictionaryWord(entry,{en:'A kingfisher waited above the stream.',zh:'一只翠鸟在溪流上方等候。'}),state=initial();addReadingWord(state,word,'A kingfisher waited above the stream.','2026-11-03');
 const restored=validateState(structuredClone(state));begin(restored,'2026-11-04');assert.ok([restored.session.current,...restored.session.queue].some(t=>t.wordId==='reading:kingfisher'));
 assert.deepEqual(articleTokens({title:'The Kingfisher',paragraphs:[{en:"Children couldn't see the kingfisher's nest."}]}),['the','kingfisher','children',"couldn't",'see',"kingfisher's",'nest']);
});
