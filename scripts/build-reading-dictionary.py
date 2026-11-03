"""Build a 10,000-entry core and lazy full dictionary from ECDICT's MIT CSV.
Download the source and LICENSE from https://github.com/skywind3000/ECDICT
into outputs/reading-dictionary first. No external code is executed.
"""
import csv, hashlib, json, re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
source=root/'outputs/reading-dictionary/ecdict.csv'
destination=root/'dist/dictionary'
destination.mkdir(parents=True,exist_ok=True)
records={}; ranks={}
def clean(value,limit):
    return re.sub(r'[<>\x00-\x08]', '', value.replace('\\n','\n')).strip()[:limit]
for row in csv.DictReader(source.open(encoding='utf-8')):
    word=row['word'].lower().replace('’',"'")
    if not re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*",word) or len(word)>80 or not re.search(r'[\u3400-\u9fff]',row['translation']):continue
    frq=int(row['frq'] or 0);bnc=int(row['bnc'] or 0);rank=frq or (bnc+50000 if bnc else 1000000)
    if word in ranks and ranks[word]<=rank:continue
    lemma=re.search(r'(?:^|/)0:([^/]+)',row['exchange'])
    records[word]=[clean(row['phonetic'],120),clean(row['translation'],1600),clean(row['definition'],2200),lemma.group(1).lower() if lemma else '']
    ranks[word]=rank
# Modern function-word definitions and common story names, without pretending
# a character name means the currency / geographical sense of a homograph.
overrides={
 'a':['ə','art. 一个；一（用于单数可数名词前）','an indefinite article used before a singular countable noun',''],
 'an':['ən','art. 一个；一（用于元音音素前）','an indefinite article used before a vowel sound',''],
 'the':['ðə','art. 这；那；这些；那些（表示特指）','the definite article, referring to a particular person or thing',''],
}
records.update(overrides)
core_words=sorted(records,key=lambda w:(ranks.get(w,1),w))[:10000]
encode=lambda data:json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n'
(destination/'core.json').write_text(encode({w:records[w] for w in core_words}),encoding='utf-8')
shards={}
for word,entry in records.items():
    shard=re.sub('[^a-z]','_',word[:2].ljust(2,'_'))
    shards.setdefault(shard,{})[word]=entry
for key,value in shards.items():(destination/(key+'.json')).write_text(encode(value),encoding='utf-8')
(destination/'LICENSE.txt').write_bytes((source.parent/'LICENSE').read_bytes())
revision='ecdict-'+hashlib.sha256(source.read_bytes()).hexdigest()[:12]+'-v1'
manifest={'version':revision,'core':10000,'entries':len(records),'shards':sorted(shards),'source':'https://github.com/skywind3000/ECDICT','license':'MIT','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest()}
(destination/'manifest.json').write_text(encode(manifest),encoding='utf-8')
(root/'dist/dictionary-manifest.js').write_text('export const dictionaryManifest='+encode(manifest).strip()+';\n',encoding='utf-8')
article_path=source.parent/'articles.json'
articles=json.loads(article_path.read_text(encoding='utf-8')) if article_path.exists() else []
tokens={w.lower().replace('’',"'") for a in articles for p in a['paragraphs'] for w in re.findall(r"[A-Za-z]+(?:['’\-][A-Za-z]+)*",p['en'])}
missing=sorted(w for w in tokens if w not in records and not (w.endswith("'s") and w[:-2] in records))
print(json.dumps({'core':len(core_words),'entries':len(records),'shards':len(shards),'bytes':sum(p.stat().st_size for p in destination.glob('*.json')),'fallbackMissing':missing},ensure_ascii=False))
