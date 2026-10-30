from pathlib import Path
from collections import Counter,defaultdict
import json,re,pdfplumber
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(r'D:\英文学习\grammar\book\Essential Grammar in Use (Murphy Raymond) (z-library.sk, 1lib.sk, z-lib.sk).pdf')
OUT=ROOT/'outputs/grammar-reader/keys1';OUT.mkdir(parents=True,exist_ok=True)

def clean(text):
 text=text.replace('’',"'").replace('‘',"'").replace('ﬂ','fl').replace('ﬁ','fi').replace('\u00ad','')
 text=re.sub(r'\s+',' ',text).strip()
 words=['why','what','where','when','who','which','whose','how','my','your','his','her','their','our','the','they','this','that','these','those','them','there','with','from','were','was','are','have','has','had','not','did','does','do','would','could','should','will','must','might','can','to','for','some','than','then','and','work','want','like','get','got','been','being','never','very','much','more','most','is','it','its','only','she','he','you','we','am']
 for word in sorted(words,key=len,reverse=True):
  pat=r'\b'+r'\s*'.join(map(re.escape,word))+r'\b'
  text=re.sub(pat,lambda m: re.sub(r'\s+','',m.group()),text,flags=re.I)
 text=re.sub(r"\b(don|doesn|didn|isn|aren|wasn|weren|haven|hasn|hadn|won|wouldn|couldn|shouldn|mustn)\s*'\s*t\b",r"\1't",text,flags=re.I)
 text=re.sub(r"\b(I|he|she|it|we|you|they|that|there|here|what|where|who)\s*'\s*(m|s|re|ve|d|ll)\b",r"\1'\2",text,flags=re.I)
 text=re.sub(r"\b[1l]\s*(?=am\b|have\b|haven't\b|don't\b|was\b)",'I ',text)
 text=re.sub(r"\bl'(?=m\b|ve\b|d\b|ll\b)","I'",text)
 text=text.replace('M artina','Martina').replace('M r','Mr').replace('M rs','Mrs')
 for a,b in {"doesn'the":"doesn't he",'haveI':'have I',"Idon't":"I don't",'Theyare':'They are','giveit':'give it','givethem':'give them','tom ake':'to make','beeri':'been','American,,':'American,',"Ve told":"'ve told"}.items():text=text.replace(a,b)
 text=re.sub(r'\s+([.,?!])',r'\1',text)
 return text.strip()

def lines(words):
 rows=[]
 for w in sorted(words,key=lambda w:(w['top'],w['x0'])):
  row=next((r for r in rows[-3:] if abs(r['top']-w['top'])<2.6),None)
  if row is None:row={'top':w['top'],'words':[]};rows.append(row)
  row['words'].append(w)
 for r in rows:r['words'].sort(key=lambda w:w['x0'])
 return sorted(rows,key=lambda r:r['top'])

def get_columns(page,n):
 words=page.extract_words(x_tolerance=3,y_tolerance=3)
 ystart=68 if n==265 else 37
 words=[w for w in words if ystart<=w['top']<page.height-20]
 primary=[]
 for lo,hi in [(10,90),(165,245),(320,400)]:
  xs=[w['x0'] for w in words if lo<=w['x0']<hi and re.fullmatch(r'\d{1,2}(?:[ab])?|\d{1,3}\.\d',w['text'])]
  bins=Counter(round(x/2)*2 for x in xs)
  peak=bins.most_common(1)[0][0];near=[x for x in xs if abs(x-peak)<2]
  primary.append(sum(near)/len(near))
 bounds=[max(0,primary[0]-6),primary[1]-6,primary[2]-6,page.width]
 return [(primary[c],[w for w in words if bounds[c]<=w['x0']<bounds[c+1]]) for c in range(3)]

blocks=[]; current=None;unit=0
with pdfplumber.open(SOURCE) as doc:
 for n in range(265,280):
  for col,(anchor,words) in enumerate(get_columns(doc.pages[n-1],n)):
   for line in lines(words):
    ws=line['words'];text=' '.join(w['text'] for w in ws)
    if len(ws)==1 and re.fullmatch(r'\d{3}',text):continue
    if re.match(r'^UN\s*IT\s+\d+',text,re.I):continue
    heading=re.fullmatch(r'(\d{1,3})\s*\.\s*(\d{1,2})',text)
    if heading and abs(ws[0]['x0']-anchor)<5:
     unit=int(heading[1]);current={'id':f'{unit}.{int(heading[2])}','unit':unit,'page':unit*2+1,'keyPages':[n],'lines':[]};blocks.append(current)
    elif current is not None and unit<=60:
     if n not in current['keyPages']:current['keyPages'].append(n)
     current['lines'].append({'page':n,'col':col,'anchor':anchor,'top':line['top'],'words':ws,'text':text})
blocks=[b for b in blocks if 1<=b['unit']<=60]
(OUT/'blocks.json').write_text(json.dumps(blocks,ensure_ascii=False),encoding='utf-8')

# Extract numbered answers, preserving extra labels such as Helen / Paul.
def parse(block):
 ls=block['lines'];numeric=[]
 for line in ls:
  for w in line['words']:
   if re.fullmatch(r'\d{1,2}',w['text']):
    offset=w['x0']-line['anchor']
    if 45<offset<125:numeric.append((round(offset/3)*3,int(w['text'])))
 count=Counter(x for x,n in numeric);second=next((x for x,c in count.most_common() if c>=2 and len({n for y,n in numeric if y==x})>=2),None)
 # Keep each internal column independent so wrapped lines cannot cross answers.
 streams=[[],[]]
 for line in ls:
  if second is not None:
   a=[w for w in line['words'] if w['x0']<line['anchor']+second-9];b=[w for w in line['words'] if w['x0']>=line['anchor']+second-9]
   # Only apply a two-column split to this line when it is a compact list row.
   if b and (re.fullmatch(r'\d{1,2}',b[0]['text']) or any(streams[1])):
    streams[0].append((line,a));streams[1].append((line,b));continue
  streams[0].append((line,line['words']))
 items=[];unassigned=[]
 for stream_no,stream in enumerate(streams):
  active=None;label='';example=False
  for line,ws in stream:
   if not ws:continue
   text=clean(' '.join(w['text'] for w in ws))
   if re.match(r'^(?:Example|Possible|Suggested) a(?:i)?nswers?:?$',text,re.I):example=True;continue
   if re.fullmatch(r'[A-Z][A-Za-z ]{1,25}(?: \(example answers\))?:',text):
    label=text.split(' (')[0].rstrip(':');example=example or '(example answers)' in text;active=None;continue
   head=re.match(r'^(\d{1,2})([ab])?(?:\s+|(?=\.\.))(.+)$',text)
   at_start=ws[0]['x0']-line['anchor']<(second+10 if stream_no else 7)
   if head and at_start:
    number=head[1]+(head[2] or '')
    active={'id':((label.lower().replace(' ','-')+'-') if label else '')+number,'label':(label+' · ' if label else '')+number,'answer':head[3],'alternatives':[],'mode':'self' if example else 'objective'}
    items.append(active)
   elif re.fullmatch(r'\d{1,2}[–-]\d{1,2}',text):
    active={'id':text,'label':text,'answer':'','alternatives':[],'mode':'self'};items.append(active)
   elif active is not None:
    active['answer']+=' '+text
   else:unassigned.append(text)
 for item in items:
  item['answer']=clean(item['answer'])
  if '(Example answer)' in item['answer']:item['mode']='self';item['answer']=item['answer'].replace('(Example answer)','').strip()
  if ' or ' in item['answer'] and (re.search(r"\b(?:I|my|we)\b",item['answer'],re.I) or re.match(r'Yes\b',item['answer'])):item['mode']='self'
  if '(or ' in item['answer']:item['mode']='self'
  if re.match(r'\d+[–-]\d+',item['id']):item['mode']='self'
 duplicates=[k for k,c in Counter(i['id'] for i in items).items() if c>1]
 if unassigned:
  for i in items:i['mode']='self'
 block={k:v for k,v in block.items() if k!='lines'}
 block.update({'instruction':'按教材题号作答；造句/改写写完整句，填空题按空格顺序以 | 分隔多个答案。','mode':'self' if items and all(i['mode']=='self' for i in items) else 'objective','items':items})
 return block,{'id':block['id'],'unassigned':unassigned,'duplicates':duplicates,'second':second} if unassigned or duplicates else None

# Reviewed against the answer-key layouts and exercise pages. Ranges are separate
# response fields; free-order tasks are self-assessed rather than position graded.
RANGES={
 '11.5':(2,["I got up late yesterday.","I met some friends at lunchtime.","I went to the supermarket.","I phoned a lot of people.","I lost my keys."],True),
 '17.3':(2,["She has done a lot of interesting things.","She has travelled all over the world. / She has been all over the world.","She has been married three times.","She has written ten books.","She has met a lot of interesting people."],True),
 '25.3':(3,["I'm going away at the weekend.","I'm playing basketball tomorrow.","I'm meeting a friend this evening.","I'm going to the cinema on Thursday evening."],True),
 '26.4':(1,["I'm going to phone Maria this evening.","I'm going to get up early tomorrow.","I'm going to buy some shoes tomorrow."],True),
 '29.4':(1,["I might buy some new clothes.","I might go out with some friends.","I might have an egg for breakfast."],True),
 '36.2':(2,["She used to play volleyball.","She used to go out most evenings. / She used to go out a lot.","She used to play the guitar.","She used to read a lot. / She used to like reading.","She used to go away two or three times a year. / She used to travel a lot."],True),
 '37.2':(3,["There is a university in ...","There are a lot of big shops.","There isn't an airport.","There aren't many factories."],True),
 '37.4':(2,["There are eight planets in the solar system.","There are fifteen players in a rugby team.","There are twenty-six letters in the English alphabet.","There are thirty days in September.","There are fifty states in the USA."],True),
 '54.1':(2,["I went to a coffee shop to meet a friend.","I went to the chemist to get some medicine.","I went to the market to buy some vegetables."],True)
}
OVERRIDES={
 ('7.1','4'):"Do Tom's friends play tennis? / Do his friends play tennis? / Do they play tennis?",
 ('10.1','5'):"Ben was on the beach. / Ben was on a beach. / Ben was at the beach. / Ben was at the seaside.",
 ('10.3','4'):"Were ... was ... wasn't / Were ... wasn't ... was",
 ('19.4','7'):"David has played the piano since he was seven years old. / David has been playing the piano since he was seven years old.",
 ('20.4','3'):"has worked... was... worked... didn't enjoy / has been working... was... worked... didn't enjoy",
 ('20.4','4'):"have seen... have never spoken... Have you ever spoken... met",
 ('21.2','2'):"Football is played in most countries of the world.",
 ('21.2','3'):"Why was the letter sent to the wrong address?",
 ('21.2','4'):"A film studio is a place where films are made.",
 ('21.2','6'):"How many languages are spoken in Switzerland?",
 ('21.2','7'):"Somebody broke into our house, but nothing was stolen.",
 ('57.2','10'):"He is taking a picture. / He is taking a photo. / He is taking a photograph.",
 ('15.2','6'):"'ve told / have told",
 ('18.2','2'):"How long have they been there? / How long have they been in Brazil?",
 ('18.2','3'):"How long have you known her? / How long have you known Amy?",
 ('18.2','5'):"How long has he lived in Canada? / How long has he been living in Canada?",
 ('29.2','5'):"I might get a taxi. / I might take a taxi. / I might go by taxi.",
 ('33.5','5'):"must stop / have to stop",
 ('33.5','7'):"must tell / have to tell",
 ('34.1','3'):"Would you like some coffee? / Would you like a cup of coffee?",
 ('34.1','4'):"Would you like some cheese? / Would you like a piece of cheese?",
 ('34.1','6'):"Would you like some cake? / Would you like a piece of cake?",
 ('37.3','9'):"There is ... There aren't",
 ('44.4','12'):"When did you do it? / When did you do the shopping?",
 ('48.4','2'):"It took us 20 minutes to walk home. / It took us 20 minutes to get home.",
 ('48.4','4'):"It took Mark three hours to drive to London. / It took him three hours to drive to London. / It took Mark three hours to get to London. / It took him three hours to get to London.",
 ('48.4','5'):"It took Lisa a long time to find a job. / It took her a long time to find a job. / It took Lisa a long time to get a job. / It took her a long time to get a job.",
 ('49.5','3'):"Do you know if/whether she is working today? / Do you know if/whether she's working today?",
 ('50.1','7'):"They said (that) they would be home late. / They said (that) they'd be home late.",
 ('50.1','8'):"She said (that) she had just come back from holiday. / She said (that) she'd just come back from holiday.",
 ('50.2','6'):"He said (that) he would send me a postcard. / He said (that) he'd send me a postcard.",
 ('50.2','7'):"Nicola said (that) he had gone home. / Nicola said (that) he'd gone home.",
 ('50.2','9'):"She said (that) she was going to the cinema.",
 ('51.3','19'):"to know ... tell",
 ('53.2','4'):"She asked me to help her. / She asked me if I could help her.",
 ('53.2','7'):"I told her not to phone before 8 o'clock. / I told her not to call (me) before 8 o'clock.",
 ('53.3','9'):"to make / to get",
 ('57.2','5'):"They are doing an exam. / They are taking an exam.",
}
SELF_GROUPS={'1.4','2.5','3.4','4.4','5.5','6.2','7.4','11.5','12.3','19.2','19.5','25.3','26.4','27.2','29.4','32.5','33.6','37.2','40.4','40.6','42.3','48.2','52.4','54.3'}
SELF_ITEMS={'1.6':{'2','3','8','9','10'},'9.3':{'7','8','9'},'10.1':{'6'},'13.1':{'6'},'21.4':{'4','5'},'30.1':{'7','8','9','10','11','12'},'48.4':{'6'}}

def normalize_variants(text):
 # Each slash pair below represents equivalent verb phrases sharing a tail.
 pairs=[
  ("They're","They are"),("He's","He is"),("She's","She is"),("It's","It is"),("I'm","I am"),("You're","You are"),("We're","We are"),("That's","That is"),("There's","There is"),("Here's","Here is"),("Where's","Where is"),("What's","What is"),("Who's","Who is"),
  ("He's","He has"),("She's","She has"),("It's","It has"),("I've","I have"),("They've","They have"),("We've","We have"),("You've","You have"),("There's been","There has been"),
  ("She isn't","She's not"),("He isn't","He's not"),("It isn't","It's not"),("They aren't","They're not"),("You aren't","You're not"),
  ("isn't","is not"),("aren't","are not"),("wasn't","was not"),("weren't","were not"),("don't","do not"),("doesn't","does not"),("haven't","have not"),("hasn't","has not"),("'s got","has got"),("'m not","am not"),("isn't","'s not"),("aren't","'re not"),
  ("'m","am"),("'s","is"),("'s","has"),("'re","are"),("'ve","have"),("'ll","will")
 ]
 queue=[text]
 for a,b in pairs:
  pat=re.compile(re.escape(a)+r'\s*/\s*'+re.escape(b)+r'(?![A-Za-z])',re.I)
  rev=re.compile(re.escape(b)+r'\s*/\s*'+re.escape(a)+r'(?![A-Za-z])',re.I)
  out=[]
  for t in queue:
   m=pat.search(t) or rev.search(t)
   if m:
    # Preserve capitalization as printed by using matched parts.
    opts=re.split(r'\s*/\s*',m.group())
    out.extend(t[:m.start()]+o+t[m.end():] for o in opts)
   else:out.append(t)
  queue=out
 # Parenthesized text in objective answers is explicitly optional.
 for _ in range(5):
  out=[];changed=False
  for t in queue:
   m=re.search(r'\(([^()]*)\)',t)
   if m:
    if m[1].startswith('or ') or 'answer' in m[1].lower():return []
    out += [t[:m.start()]+m[1]+t[m.end():],t[:m.start()]+t[m.end():]];changed=True
   else:out.append(t)
  queue=out
  if not changed:break
 # Whole-phrase alternatives are separated by a spaced slash or 'or'.
 split=[]
 for t in queue:split.extend(re.split(r'\s+/\s+|(?:[.,]?\s+)or\s+',t))
 queue=split
 # Word alternatives share the surrounding sentence.
 for _ in range(8):
  out=[];changed=False
  for t in queue:
   m=re.search(r"([A-Za-z]+(?:'[A-Za-z]+)?)/([A-Za-z]+(?:'[A-Za-z]+)?)",t)
   if m:
    out += [t[:m.start()]+m[1]+t[m.end():],t[:m.start()]+m[2]+t[m.end():]];changed=True
   else:out.append(t)
  queue=out
  if not changed:break
 return list(dict.fromkeys(clean(t).strip(' ,') for t in queue if clean(t).strip(' ,')))

def review(group):
 gid=group['id']
 if gid=='1.1':group['strictShort']=True;group['instruction']='按要求写缩写形式（short form）。'
 if gid=='50.2':group['instruction']='写完整的转述部分，包括 He/She/Nicola said；也接受只填教材空缺的从句。'
 if gid in RANGES:
  start,answers,free=RANGES[gid]
  group['items']=[{'id':str(start+n),'label':str(start+n),'answer':a,'alternatives':[],'mode':'self' if free else 'objective'} for n,a in enumerate(answers)]
  group['instruction']='按教材写句子。本题允许个人回答或不同顺序；提交后对照参考答案自评。'
 if gid=='56.5':
  group['items']=[{'id':str(n),'label':str(n),'answer':a,'alternatives':[],'mode':'objective'} for n,a in [(2,'got off'),(3,'got out of'),(4,'got on')]]
 for item in group['items']:
  key=(gid,item['id'])
  item['answer']=OVERRIDES.get(key,item['answer'])
  if key in OVERRIDES:item['mode']='objective'
  if gid=='24.2':item['answer']=item['answer'].replace(' ', ' ... ',1)
  if gid in SELF_GROUPS or item['id'] in SELF_ITEMS.get(gid,set()):item['mode']='self'
  # Ellipses at the beginning/end omit a sentence fragment; avoid exact marking.
  if item['answer'].startswith('...') or re.search(r'\.\.\.\s*[?.]?$',item['answer']) or ' /...' in item['answer']:item['mode']='self'
  if '(no preposition)' in item['answer']:
   item['answer']='-';item['alternatives']=['无','不填','no preposition'];item['mode']='objective';group['instruction']='填空；多空按顺序用 | 分隔。不需要介词时填写 -。';continue
  variants=normalize_variants(item['answer'])
  if gid=='50.2':
   variants+= [re.sub(r'^(?:She|He|Nicola) said (?:that )?', '',v,flags=re.I) for v in variants.copy()]
  variants=list(dict.fromkeys(variants))
  if item['mode']=='objective':
   if variants and all('/' not in v and not re.search(r'\b(?:or|both are correct)\b',v) for v in variants):item['answer']=variants[0];item['alternatives']=variants[1:]
   else:item['mode']='self'
 group['mode']='self' if all(i['mode']=='self' for i in group['items']) else 'objective'
 if group['mode']=='self' and gid not in RANGES:group['instruction']='结合教材要求填写答案；本题允许个人回答，请提交后对照参考答案自评。'
 return group

result=[];issues=[]
for b in blocks:
 value,issue=parse(b);value=review(value);result.append(value)
 if issue and b['id'] not in RANGES:issues.append(issue)
assert len(result)==252 and {g['unit'] for g in result}==set(range(1,61))
assert all(g['items'] and len({i['id'] for i in g['items']})==len(g['items']) for g in result)
assert not issues, issues
(ROOT/'data/grammar-book').mkdir(exist_ok=True,parents=True)
(ROOT/'data/grammar-book/answers-1.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'issues.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'groups':len(result),'units':len(set(g['unit'] for g in result)),'items':sum(len(g['items']) for g in result),'issues':issues},ensure_ascii=False))
