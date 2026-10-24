"""Parse user-supplied dictionary without executing the supplied HTML/JS."""
import re,json,collections
from pathlib import Path
source=Path('data/imports/ielts-user-list.txt').read_text()
entries={}; skipped=[]; chapter=0; duplicates=[]
for lineno,line in enumerate(source.splitlines(),1):
 line=line.strip()
 if line.startswith('Word List '):chapter=int(line.split()[-1]);continue
 if not chapter or not line:continue
 m=re.match(r"^([A-Za-z][A-Za-z'’ ()/-]*?)(\*)?\s+(?=[/\[{\u4e00-\u9fff]|[a-z]+\.)(.+)$",line)
 if not m:skipped.append({'line':lineno,'text':line});continue
 word=m[1].strip().lower();rest=m[3].strip();ipa=''
 phon=re.match(r'^(/[^/]+/|\[[^\]]+\]|\{[^}]+\})\s*(.*)$',rest)
 if phon:ipa,rest=phon.groups()
 if not re.search('[\u4e00-\u9fff]',rest):skipped.append({'line':lineno,'text':line});continue
 if word in entries:
  duplicates.append({'word':word,'line':lineno});entries[word]['sourceDefinitions'].append(rest);continue
 entries[word]={'word':word,'ipa':ipa,'sourceDefinitions':[rest],'chapter':chapter,'line':lineno}
Path('data/imports/ielts-parsed.json').write_text(json.dumps(list(entries.values()),ensure_ascii=False,indent=2)+'\n')
Path('data/imports/ielts-import-report.json').write_text(json.dumps({'unique':len(entries),'duplicates':duplicates,'unparsed':skipped},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'unique':len(entries),'duplicates':len(duplicates),'unparsed':skipped},ensure_ascii=False))
existing=json.loads(Path('data/imports/existing-vocabulary.json').read_text()); old={w['word']:w for w in existing}
new=[]
for word,e in entries.items():
 if word in old:continue
 # Preserve source gloss as a labelled dictionary entry; do not invent sense-specific examples.
 new.append({'id':word,'word':word,'ipa':e['ipa'],'group':f"上传词表 · {e['chapter']:02}",'topic':'上传雅思词表','imported':True,'sourceLine':e['line'],'senses':[{'id':'import:'+word,'pos':'词条','meaning':'；'.join(dict.fromkeys(e['sourceDefinitions'])),'examples':[],'distractors':[]}],'notes':[]})
allwords={w['id']:w for w in existing+new}; notes=collections.defaultdict(list)
rels=json.loads(Path('data/word-relations.json').read_text())
def add(a,b,t,d,meaning=None):
 if a not in allwords or b not in allwords:return
 if any(n['word']==b and n['type']==t for n in notes[a]):return
 notes[a].append({'type':t,'word':b,'meaning':meaning or allwords[b]['senses'][0]['meaning'],'difference':d})
for group,meaning,difference in rels['synonyms']:
 for a in group.split(','):
  for b in group.split(','):
   if a!=b:add(a,b,'近义词',f'关联含义：{meaning}。{difference}',meaning+'（仅对应此义）')
for group in rels['families']:
 for a in group.split(','):
  for b in group.split(','):
   if a!=b:add(a,b,'同词族','同词族词汇，注意派生形式、词性和各自释义；有共同来源不代表含义相同。')
# One-character edits only; spelling similarity does not assert meaning or shared roots.
buckets=collections.defaultdict(set)
for w in allwords:
 if re.fullmatch('[a-z]{4,18}',w):
  buckets[w].add(w)
  for i in range(len(w)):buckets[w[:i]+w[i+1:]].add(w)
def oneedit(a,b):
 if abs(len(a)-len(b))>1:return False
 if len(a)==len(b):return sum(x!=y for x,y in zip(a,b))==1
 if len(a)>len(b):a,b=b,a
 return any(b[:i]+b[i+1:]==a for i in range(len(b)))
for a in allwords:
 if not re.fullmatch('[a-z]{4,18}',a):continue
 candidates=set(buckets[a])
 for i in range(len(a)):candidates.update(buckets[a[:i]+a[i+1:]])
 for b in sorted(candidates):
  if a!=b and oneedit(a,b) and sum(n['type']=='形近词' for n in notes[a])<3:add(a,b,'形近词',f'拼写对比：{a} ↔ {b}，只差一个字母的替换、增加或删除。此项按拼写识别，不表示同义或同词根。')
defs={}
for line in Path('data/english-definitions.txt').read_text().splitlines():
 if line.strip():k,v=line.split('|',1);defs[k.strip()]=v
assert set(defs)=={s['id'] for w in existing for s in w['senses']}
info={'entries':len(entries),'added':len(new),'overlap':len(entries)-len(new),'duplicateLines':len(duplicates),'unparsed':len(skipped),'source':'用户上传 IELTS Word List.txt；非 IELTS 官方词表；来源释义待逐条审校','withoutExamples':len(new)}
Path('dist/imported-vocabulary.js').write_text('export const importedInfo='+json.dumps(info,ensure_ascii=False)+';\nexport const importedWords='+json.dumps(new,ensure_ascii=False)+';\nexport const importedIds='+json.dumps(list(entries),ensure_ascii=False)+';\nexport const relationNotes='+json.dumps(notes,ensure_ascii=False)+';\nexport const englishDefinitions='+json.dumps(defs,ensure_ascii=False)+';\n')
print(json.dumps(info,ensure_ascii=False))

with Path("dist/imported-vocabulary.js").open("a") as f:f.write("export const importedGloss="+json.dumps({w:e["sourceDefinitions"] for w,e in entries.items()},ensure_ascii=False)+";\n")
