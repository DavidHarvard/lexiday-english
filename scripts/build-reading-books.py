"""Extract the user's PDFs into selectable reading pages and answerable groups.
Sources remain unchanged; no instructions from their contents are executed.
"""
import json,re,shutil,subprocess,hashlib
from PIL import Image
from pathlib import Path
from pypdf import PdfReader
import pdfplumber
root=Path(__file__).resolve().parent.parent
out=root/'dist/reading-books';out.mkdir(parents=True,exist_ok=True)
source=Path(r'C:\Users\18218\Downloads\IELTS Reading Recent Actual Tests with Answer Key ( etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf')
novel=Path(r'C:\Users\18218\Downloads\Harry Potter and the Sorcerers Stone (J.K. Rowling) (z-library.sk, 1lib.sk, z-lib.sk).pdf')
write=lambda p,o:p.write_text(json.dumps(o,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
clean=lambda t:re.sub(r'[ \t]+',' ',t).strip()
pages=[re.sub(r'^\s*\d+\s*\|\s*P a g e\s*','',p.extract_text() or '') for p in PdfReader(source).pages]
book=pdfplumber.open(source);answer_rows=[];errata=[]
for pi in range(157,len(pages)):
 for table in book.pages[pi].extract_tables():
  for row in table:
   if row[0] and re.search(r'^\d+\s+\S',row[0]) and all(x is None for x in row[1:]):
    pairs=re.findall(r'(\d{1,2})\s+(.+?)(?=\s+\d{1,2}\s+|$)',row[0].replace('\n',' '))
   else:pairs=[(row[i] or '',row[i+1]) for i in range(0,len(row)-1,2) if row[i+1]]
   for printed,answer in pairs:
    test=len(answer_rows)//40+1;number=len(answer_rows)%40+1;answer=clean(answer.replace('\n',' '))
    if clean(printed)!=str(number):errata.append({'test':test,'number':number,'printed':printed,'page':pi+1,'reason':'题号按答案表连续位置核正'})
    if test==7 and number==37:answer='(with the) industrialization'
    answer_rows.append({'test':test,'number':number,'answer':answer,'page':pi+1})
assert len(answer_rows)==400,len(answer_rows)
answers={(a['test'],a['number']):a for a in answer_rows}
# The original table has a duplicated 18 at Test 8 Q19 and several 3-for-9
# misprints. Sequence is corroborated by the numbered question groups.
parts=[];joined='';offsets=[]
for i,text in enumerate(pages[:157]):offsets.append((len(joined),i+1));joined+=text+'\n'
sections=list(re.finditer(r'(?m)^\s*SECTION\s+([123])\s*$',joined));assert len(sections)==30
question_re=re.compile(r'(?mi)^\s*Questions?\s+(\d+)(?:\s*[-–—]\s*(\d+))?[.。]?\s*$')
metadata=[]
for index,m in enumerate(sections):
 test=index//3+1;section=index%3+1;text=joined[m.end():sections[index+1].start() if index+1<len(sections) else len(joined)]
 text=re.sub(r'\s*Reading Test \d+\s*$','',text).strip();text_start=joined.find(text[:50],m.end());groups=list(question_re.finditer(text));assert groups,(test,section)
 article=text[:groups[0].start()].strip();lines=[clean(x) for x in article.splitlines() if x.strip()]
 if lines[0].lower().startswith('you should spend'):
  while lines and not re.search(r'(?:below\.?|following pages\.?)$',lines.pop(0),re.I):pass
 title=lines.pop(0);body='\n'.join(lines).strip();paragraphs=[clean(p) for p in re.split(r'(?m)(?=^(?:[A-Z](?:\s|$)|Section [A-Z]:))',body) if p.strip()]
 # Untagged passages keep prose paragraphs instead of PDF line wrapping.
 if len(paragraphs)<2:paragraphs=[clean(p) for p in re.split(r'\n(?=[A-Z][a-z]+\b)',body) if p.strip()]
 paragraphs=[p.replace('\n',' ') for p in paragraphs]
 start_page=max(p for off,p in offsets if off<=m.start());id=f'ielts-{test:02d}-{section}'
 item={'id':id,'test':test,'section':section,'title':title,'page':start_page,'paragraphs':paragraphs,'groups':[]};group_meta=[]
 for gi,g in enumerate(groups):
  first=int(g.group(1));last=int(g.group(2) or first)
  if test==6 and section==1 and first==1:last=5;errata.append({'test':6,'number':5,'page':83,'reason':'原题组标题写1–4，实际包含第5题，按题目补齐'})
  block=text[g.end():groups[gi+1].start() if gi+1<len(groups) else len(text)].strip();numbers=list(range(first,last+1));keys=[answers[test,n]['answer'] for n in numbers]
  # Match the source task's TRUE/FALSE wording when the answer table says YES/NO.
  tf=bool(re.search(r'\bTRUE\b',block)) and bool(re.search(r'\bFALSE\b',block));yn=bool(re.search(r'\bYES\b',block)) and bool(re.search(r'\bNO\b',block))
  if tf:keys=[{'YES':'TRUE','NO':'FALSE'}.get(k.upper(),k.upper()) for k in keys]
  elif yn:keys=[{'TRUE':'YES','FALSE':'NO'}.get(k.upper(),k.upper()) for k in keys]
  multi=bool(re.search(r'Choose\s+(?:TWO|THREE|FOUR|FIVE|SIX)\b',block,re.I))
  letters=re.findall(r'(?m)^\s*([A-K])(?:[.．)]|\s)',block)
  roman=re.findall(r'(?mi)^\s*([ivx]+)[.．)]?\s+',block)
  if multi:
   kind='multi';options=list('ABCDEFGHIJK'[:max([ord(k)-64 for k in keys+letters if re.fullmatch('[A-K]',k)] or [8])])
  elif tf or yn:kind='choice';options=['TRUE','FALSE','NOT GIVEN'] if tf else ['YES','NO','NOT GIVEN']
  elif all(re.fullmatch(r'[ivx]+',k,re.I) for k in keys):kind='choice';options=['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii'][:max([{'i':1,'ii':2,'iii':3,'iv':4,'v':5,'vi':6,'vii':7,'viii':8,'ix':9,'x':10,'xi':11,'xii':12}.get(v.lower(),0) for v in roman+keys])];keys=[k.lower() for k in keys]
  elif all(re.fullmatch('[A-K]',k) for k in keys):kind='choice';options=list('ABCDEFGHIJK'[:max([ord(k)-64 for k in keys+letters] or [4])])
  else:kind='fill';options=[]
  first_page=max(p for off,p in offsets if off<=text_start+g.start());last_page=max(p for off,p in offsets if off<=text_start+(groups[gi+1].start() if gi+1<len(groups) else len(text))-1)
  gid=f'{first}-{last}';item['groups'].append({'id':gid,'first':first,'last':last,'kind':kind,'options':options,'text':block,'pages':list(range(first_page,last_page+1))})
  group_meta.append({'id':gid,'first':first,'last':last,'kind':kind,'options':options,'answers':keys,'answerPages':sorted(set(answers[test,n]['page'] for n in numbers))})
 write(out/(id+'.json'),item);metadata.append({k:item[k] for k in ['id','test','section','title','page']}|{'groups':group_meta})
 parts.append(item)
assert sum(g['last']-g['first']+1 for p in metadata for g in p['groups'])==400
# Source-page images preserve diagrams, tables and matching layouts that text
# extraction cannot represent. They are loaded only on opening the source view.
for page in sorted({page for part in parts for group in part['groups'] for page in group['pages']}):
 target=out/f'ielts-page-{page:03d}'
 if not target.with_suffix('.webp').exists():
  subprocess.run(['pdftoppm','-f',str(page),'-l',str(page),'-scale-to','1600','-png','-singlefile',str(source),str(target)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
  Image.open(target.with_suffix('.png')).convert('RGB').save(target.with_suffix('.webp'),quality=85)
  target.with_suffix('.png').unlink()
raw=pdfplumber.open(novel);chapters=[];fun=[];chapter=0
for pi,page in enumerate(raw.pages):
 if pi==0:continue
 # Preserve the PDF's actual vertical paragraph gaps. Plain text extraction
 # otherwise merges entire pages into a single paragraph and loses readability.
 lines=[line for line in page.extract_text_lines() if not (line['text'].strip().isdigit() and line['top']>page.height-80)]
 text='';previous=None
 for line in lines:
  if previous:text+='\n\n' if line['top']-previous['top']>24 else '\n'
  text+=line['text'];previous=line
 text=text.replace("Harry Potter and the Sorcerer's Stone\n",'')
 matches=list(re.finditer(r'CHAPTER ([A-Z-]+)\n\s*([^\n]+)',text));current_title=chapters[-1]['title'] if chapters else ''
 for match in matches:
  chapter+=1;current_title=match.group(2).title().replace('Foribidden','Forbidden');chapters.append({'number':chapter,'title':current_title,'page':len(fun),'pdfPage':pi+1})
 # Preserve dialogue boundaries; join printed lines into readable paragraphs.
 text=re.sub(r'CHAPTER ([A-Z-]+)\n\s*([^\n]+)',lambda m:'\n\n'+m.group(2).title()+'\n\n',text)
 paras=[clean(part.replace('\n',' ')) for part in re.split(r'\n\s*\n',text) if part.strip()]
 fun.append({'page':len(fun),'pdfPage':pi+1,'chapter':chapter,'chapterTitle':current_title,'paragraphs':paras})
assert len(chapters)==17 and len(fun)==249,(len(chapters),len(fun))
for page in fun:write(out/f'harry-{page["page"]:03d}.json',page)
revision=hashlib.sha256(json.dumps([parts,fun,metadata],ensure_ascii=False).encode()).hexdigest()[:16]
catalog={'version':1,'revision':revision,'ielts':metadata,'harry':{'title':"Harry Potter and the Sorcerer's Stone",'pages':len(fun),'chapters':chapters},'errata':errata}
(root/'dist/reading-books-data.js').write_text('// Extracted from the user-provided PDFs.\nexport const readingBooks='+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
shutil.copyfile(source,out/'ielts-reading.pdf');shutil.copyfile(novel,out/'harry-potter.pdf')
print(json.dumps({'passages':len(metadata),'questions':400,'novelPages':len(fun),'chapters':len(chapters),'errata':errata,'articleTitles':[m['title'] for m in metadata]},ensure_ascii=False))
