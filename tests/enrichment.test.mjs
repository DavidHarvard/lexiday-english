import test from 'node:test';
import assert from 'node:assert/strict';
import {wordMap,courseMap} from '../dist/data.js';
import {wordEnrichment} from '../dist/word-enrichment.js';
import {wordEntries,examplesForSense,meaningAliases,checkMeaning} from '../dist/word-content.js';
import {createArticle} from '../dist/content.js';

const ids=[...new Set([...courseMap['ielts-basic'].words,...courseMap['ielts-plus'].words])];
test('every IELTS entry and note has separated meanings and at least two bilingual examples per meaning',()=>{
 assert.equal(ids.length,3655);
 for(const id of ids){
  const word=wordMap[id];assert.ok(wordEnrichment[id]?.length,`${id}: enrichment missing`);
  for(const entry of wordEntries(word)){
   assert.ok(entry.pos&&entry.pos!=='词条',`${id}: part of speech`);
   assert.match(entry.meaning,/[\u3400-\u9fff]/);assert.ok(entry.definition);
   assert.ok(entry.examples.length>=2,`${id}: examples`);assert.equal(new Set(entry.examples.map(ex=>ex.en)).size,entry.examples.length,`${id}: repeated example`);
   for(const ex of entry.examples){assert.match(ex.en,/[a-z]/i);assert.match(ex.zh,/[\u3400-\u9fff]/);}
  }
  for(const note of word.notes){
   const related=wordMap[note.word]||{id:note.word,senses:[]};
   assert.ok(wordEntries(related).length,`${id} -> ${note.word}: note missing`);
   for(const entry of wordEntries(related))assert.ok(entry.examples.length>=2,`${id} -> ${note.word}: note examples`);
  }
 }
});

test('all IELTS legacy learning senses retain usable retry examples and typed meaning answers',()=>{
 for(const id of ids){const word=wordMap[id];for(const sense of word.senses){
  const examples=examplesForSense(word,sense);assert.ok(examples.length>=2,id);
  assert.notEqual(examples[0].en,examples[1].en,id);
  for(const cue of ['word','context']){const aliases=meaningAliases(word,sense,cue);assert.ok(aliases.length,id);assert.ok(checkMeaning(word,sense,aliases[0],cue),id);}
 }}
});

test('the full IELTS lexicon can supply daily reading contexts, including inflected verbs',()=>{
 const article=createArticle(ids);assert.equal(article.covered,3655);assert.deepEqual(article.missing,[]);
 assert.equal(article.paragraphs.length,3655);
 for(const p of article.paragraphs)assert.ok(wordMap[p.wordId].senses.some(s=>s.id===p.senseId));
});
