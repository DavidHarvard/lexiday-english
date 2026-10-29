"""Locate answer blanks on unchanged PDF page images for the HTML overlay.

Uses local supplied PDF only; never rewrites questions or regenerates page images.
"""
from pathlib import Path
import json, re
import pdfplumber

root=Path(__file__).resolve().parent.parent
folder=root/'dist/listening/cambridge-04'
catalog=json.loads((folder/'catalog.json').read_text(encoding='utf8'))
pdf=pdfplumber.open('D:/英文学习/Listening/Ielits-04/Cambridge-IELTS-04.pdf')
layouts={}
for track in catalog:
    wanted={q['number'] for q in track['questions']}
    pages=[]
    seen=set()
    for image in track['pages']:
        number=int(re.search(r'page-(\d+)',image)[1])
        page=pdf.pages[number-1]
        words=page.extract_words()
        runs=[]
        for char in sorted((c for c in page.chars if c['text']=='_'),key=lambda c:(round(c['top']),c['x0'])):
            if runs and abs(runs[-1]['y']-char['top'])<1 and abs(runs[-1]['right']-char['x0'])<2:
                runs[-1]['right']=char['x1']
            else:
                runs.append(dict(x=char['x0'],y=char['top'],right=char['x1']))
        fields=[]
        for run in runs:
            if run['right']-run['x']<14: continue
            candidates=[]
            for word in words:
                match=re.match(r'^(\d{1,2})(?:_|$)',word['text'])
                if not match:continue
                q=int(match[1])
                if number==8 and q==43:q=34  # PDF's printed typo is retained in the image.
                if q not in wanted:continue
                if abs(word['top']-run['y'])<2 and word['x0']<run['x']:
                    candidates.append((run['x']-word['x0'],q))
            q=min(candidates)[1] if candidates else None
            if number==3 and 300<run['y']<320:q=11
            if number==72 and 300<run['y']<310 and 210<run['x']<290:q=35
            if q is None or q in seen and not (number==3 and q==11 or number==72 and q==35):continue
            fields.append(dict(number=q,x=round(run['x'],2),y=round(run['y']-3,2),width=round(run['right']-run['x'],2),height=20))
            seen.add(q)
        # The source map has no underline after 19; the input sits in its blank area.
        if number==4:
            fields.append(dict(number=19,x=178,y=334,width=38,height=20));seen.add(19)
        # Multiple-choice questions: answer in the unused right page margin,
        # beside the original question number, without covering any option.
        for word in words:
            if word['text'].isdigit() and word['x0']<65 and word['top']>70:
                q=int(word['text'])
                if q in wanted and q not in seen:
                    fields.append(dict(number=q,x=548,y=round(word['top']-3,2),width=35,height=20));seen.add(q)
        # Multi-answer questions use one field per printed question number.
        extra={39:[(25,320,280,44),(26,380,280,44)],42:[(39,320,355,44),(40,380,355,44)],72:[(38,330,425,110)],73:[(39,465,80,80),(40,330,330,110)],106:[(39,320,455,44),(40,380,455,44)]}
        for q,x,y,width in extra.get(number,[]):
            if q not in seen:
                fields.append(dict(number=q,x=x,y=y,width=width,height=20));seen.add(q)
        fields.sort(key=lambda field:field['number'])
        pages.append(dict(image=image,width=float(page.width),height=float(page.height),fields=fields))
    assert seen==wanted, (track['id'],sorted(wanted-seen),sorted(seen-wanted))
    # Give each visual input a stable fragment index (Q11 has two original blanks).
    counts={}
    for page in pages:
        for field in page['fields']:
            q=field['number'];field['part']=counts.get(q,0);counts[q]=field['part']+1
    for page in pages:
        for field in page['fields']:field['parts']=counts[field['number']]
    layouts[track['id']]=pages
(folder/'question-layouts.json').write_text(json.dumps(layouts,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Created original-page input positions for all 160 questions.')
