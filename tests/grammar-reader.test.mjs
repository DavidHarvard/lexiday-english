import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshBookResults,grammarBook,grammarExercises,grammarItemMap,bookPart,bookState,setBookPage,checkGrammarItem,writeBookAnswer,submitBookAnswer,validateBookState} from '../dist/grammar-reader-model.js';
import {initialGrammar,validateGrammar} from '../dist/grammar-model.js';

test('full PDF has contiguous parts and exercise mappings for all 115 units and 35 additional exercises',()=>{
 assert.equal(grammarBook.pages,294);assert.equal(grammarBook.parts.length,17);
 for(let page=1;page<=294;page++){const p=bookPart(page);assert.ok(p);assert.ok(p.bytes<25*1024**2);assert.ok(page-p.start<18);}
 assert.equal(bookPart(295),undefined);
 for(let unit=1;unit<=115;unit++){const groups=grammarExercises.filter(g=>g.unit===unit);assert.ok(groups.length,unit);assert.ok(groups.every(g=>g.page===2*unit+1));}
 for(let n=1;n<=35;n++)assert.ok(grammarExercises.some(g=>g.id==='extra.'+n),'additional '+n);
 assert.equal(Object.keys(grammarItemMap).length,3373);
 const extras=grammarExercises.filter(g=>g.pages?.length>1);assert.equal(extras.length,2);for(const g of extras)assert.ok(g.items.every(q=>g.pages.includes(q.page)));
});
test('every objective key and curated alternative passes, including all multiple-blank variants',()=>{
 for(const[id,q]of Object.entries(grammarItemMap)){
  for(const answer of [q.answer,...(q.alternatives||[])]){
   assert.equal(checkGrammarItem(q,answer),q.mode==='self'?'self':'correct',id+': '+answer);
   if(q.mode==='objective'&&/\.{2,}|…/.test(answer))assert.equal(checkGrammarItem(q,answer.replace(/\s*(?:\.{2,}|…)\s*/g,' | ')),'correct',id+' multiple blanks: '+answer);
  }
  assert.equal(checkGrammarItem(q,''),null);
 }
});
test('natural or is part of an answer, and strict contractions differ from ordinary punctuation tolerance',()=>{
 const q=grammarItemMap['77.1:8'];assert.equal(checkGrammarItem(q,q.answer),'correct');assert.equal(checkGrammarItem(q,'sisters'),'incorrect');
 assert.equal(checkGrammarItem(grammarItemMap['97.1:7'],grammarItemMap['97.1:7'].answer),'correct');
 assert.equal(checkGrammarItem(grammarItemMap['1.1:2'],'they are'),'incorrect');assert.equal(checkGrammarItem(grammarItemMap['1.1:2'],'THEY’RE.'),'correct');
 assert.equal(checkGrammarItem({answer:'I am tired.',mode:'objective'},"I'm tired"),'correct');
 assert.equal(checkGrammarItem({answer:'He has been away.',mode:'objective'},'He is been away'),'incorrect');
 assert.equal(checkGrammarItem({answer:'is ... are',mode:'objective'},'is; are'),'correct');
 assert.equal(checkGrammarItem({answer:'is ... are',mode:'objective'},'are | is'),'incorrect');
});
test('book drafts and position validate within legacy grammar state; forged results are rejected',()=>{
 const s=initialGrammar();assert.equal(validateGrammar(s),s);bookState(s);setBookPage(s,294);s.grammarTab='book';
 writeBookAnswer(s,'1.1:2',"they're");assert.equal(submitBookAnswer(s,'1.1:2'),'correct');assert.equal(validateGrammar(s),s);
 writeBookAnswer(s,'1.1:2','wrong');assert.equal(s.pdfBook.exercises['1.1:2'].result,null);s.pdfBook.exercises['1.1:2'].result='correct';assert.throws(()=>validateGrammar(s));
 s.pdfBook.exercises['1.1:2'].result=null;s.pdfBook.scroll.y=1.1;assert.throws(()=>validateBookState(s.pdfBook));s.pdfBook.scroll.y=0;
 assert.throws(()=>setBookPage(s,295));assert.throws(()=>writeBookAnswer(s,'not-a-question','x'));assert.throws(()=>writeBookAnswer(s,'1.1:2','x'.repeat(2001)));
});

test('corrected keys refresh derived results without losing a reader position or draft',()=>{
 const s=initialGrammar();bookState(s);setBookPage(s,73);writeBookAnswer(s,'77.1:8',grammarItemMap['77.1:8'].answer);s.pdfBook.exercises['77.1:8'].result='incorrect';
 assert.throws(()=>validateGrammar(s));refreshBookResults(s);validateGrammar(s);assert.equal(s.pdfBook.page,73);assert.equal(s.pdfBook.exercises['77.1:8'].result,'correct');
});
