"""Package the user-supplied PDF into small, original-layout PDF parts for the web reader.

The source PDF is never modified. PDF.js is vendored from an explicit local installation.
"""
import argparse, hashlib, json, logging, shutil
from pathlib import Path
from pypdf import PdfReader, PdfWriter

logging.getLogger('pypdf').setLevel(logging.ERROR)
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--source',required=True)
parser.add_argument('--pdfjs',required=True)
args=parser.parse_args()
source=Path(args.source).resolve()
reader=PdfReader(source)
if len(reader.pages)!=294:
    raise ValueError('This page mapping is for the supplied 294-page edition only.')
out=root/'dist/grammar-book';out.mkdir(parents=True,exist_ok=True)
parts=[];size=18
for start in range(0,len(reader.pages),size):
    end=min(start+size,len(reader.pages));name=f'part-{len(parts)+1:02d}.pdf'
    writer=PdfWriter()
    for page in reader.pages[start:end]:writer.add_page(page)
    writer.add_metadata({'/Title':f'Essential Grammar in Use - PDF pages {start+1}-{end}'})
    with (out/name).open('wb') as target:writer.write(target)
    length=(out/name).stat().st_size
    if length>=25*1024*1024:raise ValueError(f'{name} exceeds the Pages asset limit')
    parts.append({'file':name,'start':start+1,'end':end,'bytes':length})

titles=json.loads((root/'data/grammar-book/unit-titles.json').read_text(encoding='utf-8'))
assert [u['unit'] for u in titles]==list(range(1,116))
units=[{**u,'page':u['unit']*2,'exercisePage':u['unit']*2+1} for u in titles]
metadata={'id':'essential-grammar-2015-294','title':'Essential Grammar in Use',
          'pages':294,'partSize':size,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
          'parts':parts,'units':units,'sections':[{'title':'单元 1–115','page':2},{'title':'附录','page':232},
          {'title':'Additional exercises','page':241},{'title':'使用说明','page':260},
          {'title':'练习答案','page':265},{'title':'附加练习答案','page':292}]}
(out/'manifest.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'dist/grammar-book-data.js').write_text('export const grammarBook='+json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')

vendor=Path(args.pdfjs).resolve();version=json.loads((vendor/'package.json').read_text())['version']
dest=root/'dist/vendor/pdfjs';dest.mkdir(parents=True,exist_ok=True)
shutil.copy2(vendor/'build/pdf.min.mjs',dest/'pdf.min.js')
shutil.copy2(vendor/'build/pdf.worker.min.mjs',dest/'pdf.worker.min.js')
shutil.copy2(vendor/'LICENSE',dest/'LICENSE')
for folder in ['wasm','standard_fonts','cmaps']:
    shutil.copytree(vendor/folder,dest/folder,dirs_exist_ok=True)
(dest/'VERSION.txt').write_text(f'PDF.js {version}\nhttps://github.com/mozilla/pdf.js\nApache-2.0\n',encoding='utf-8')
print(json.dumps({'pages':294,'parts':len(parts),'pdfBytes':sum(p['bytes'] for p in parts),'largestPart':max(p['bytes'] for p in parts),'pdfjs':version}))
