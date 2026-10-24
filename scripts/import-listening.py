"""Package the supplied Cambridge 4 audio and corresponding listening questions.

Run with the bundled Python (pypdf, pypdfium2). Originals remain untouched.
"""
from pathlib import Path
import hashlib, html, json, re, shutil, urllib.request
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('D:/英文学习/Listening/Ielits-04')
OUT = ROOT / 'dist/listening/cambridge-04'
OUT.mkdir(parents=True, exist_ok=True)
PAGES = [[[1,2],[3,4],[5,6,7],[8]], [[33,34,35],[36,37],[38,39],[40,41,42]], [[64,65],[66,67],[68,69,70],[71,72,73]], [[98,99],[100,101],[102,103],[104,105,106]]]
NAMES = [
 ['social-programme-trips','riverside-industrial-village','assignment-extension','urban-landscape'],
 ['city-sightseeing','student-counselling','research-assignment','corporate-crime'],
 ['accommodation-request','arts-festival','study-skills','student-union-building'],
 ['johns-goodbye-party','walking-holidays','science-experiments','sharks-in-australia']]
# Short labels accompany the complete original question pages. Letter questions
# retain the original options; they are not silently rewritten into word questions.
CUES = [
 ['Places with good …','Places offering …','Minimum group size','Where to sign your name','St Ives: date','London: optional extra','Destination on 3rd March','Bath: optional extra','Read the …','Jane: surname'],
 ['Fuels (two items)','Who established the metal industry?','Number of mills','Road name (map)','Building 15 (map)','Building 16 (map)','Building 17 (map)','Building 18 (map)','Building 19 (map)','Building 20 (map)'],
 ['Why has Melanie not started? (A–C)','Reasonable extension excuse (A–C)','Jackson (A–G)','Roberts (A–G)','Morris (A–G)','Cooper (A–G)','Forster (A–G)','Chart: bar 2 (A–H)','Chart: bar 4 (A–H)','Chart: bar 6 (A–H)'],
 ['Planning our …','Cities more or less …','Inland cities more …','Local areas more …','Local areas less …','Water evaporates through …','Wind at … level','Trees … the wind force','… frequency noise','Trees need sunlight, water and …'],
 ['Peter wants to drink (A–C)','Bank problem (A–C)','Person at the bank (A–C)','Map of … (A–C)','What to order (A–C)','Open all day: … and Gardens','Closed Mondays: … and Castle','Free entry: … and Markets','First place to visit','At the Cathedral, Peter wants to …'],
 ['Contact tutors if … (A–C)','Cause of stress (A–C)','International students and stress (A–C)','Personal crisis (A–C)','Loss of self-esteem (A–C)','Consult Glenda Roberts (A–C)','Financial assistance (A–C)','Other loan eligibility (A–C)','Students counselled (A–C)','Service effectiveness (A–C)'],
 ['Two main methods of …','Essay word count','Minimum research subjects','Report word count','Questionnaire disadvantage 1 (A–E)','Questionnaire disadvantage 2 (A–E)','Author: Sample Surveys','Bell: title','Bell: publisher','Wilson: year'],
 ['Corporate crime committed … (A–C)','NOT corporate crime (A–C)','Ignored by … e.g. films','Also ignored by …','Complex crimes require …','Victims often …','Costs appear unimportant to …','Large … for company','Oil tanker explosion: factor 1 (A–F)','Oil tanker explosion: factor 2 (A–F)'],
 ['Time in Australia','539 … Road','Present … English course','Day: …, 7th September','Room type (A–C)','Live with … (A–C)','Accommodation type (A–C)','The … will be $320','Rent paid on a … basis','Share of the … bill'],
 ['Festival dates (A–C)','Review focus (A–C)','Number of circuses (A–C)','Circus Romano venue (A–C)','Romano: music and …','Romano: audience','Electrica: venue','Electrica: audience','Water Puppets: venue','Water Puppets: audience'],
 ['Course audience (A–C)','Seminar duration (A–C)','Writing aim (A–C)','Reading aim (A–C)','Seminar aim (A–C)','Key component (A–C)','Booking the seminar (A–C)','Course days (A–C)','Course feature (A–C)','Reason for choosing seminar (A–C)'],
 ['Design of a …','Number of respondents','Faculty of …','Site Three: near …','Site One: two problems','Site Two: close to …','Site Three: more …','Requested facilities (TWO letters A–G)','Against drama theatre (A–C)','Security measures (TWO letters A–E)'],
 ['Party venue','Invite the …','All the …','Invitation date','Collect money during …','Contribution per person ($)','Check prices for …','Guests bring: item 1','Guests bring: item 2','Student representative prepares a …'],
 ['Holiday cost: button (A–C)','Travelite destinations (A–C)','Walking abilities (A–C)','Solo traveller payment (A–C)','Entertainment frequency (A–C)','3 days: cost ($)','Pick-up point','Book of …','14 days: cost ($)','Membership of a …'],
 ['Experiment 1: equipment','Standard …','Experiment 3: equipment','How … grow','Experiment 4: equipment','How … is made up','Experiment 1 problem (A–H)','Experiment 2 problem (A–H)','Experiment 3 problem (A–H)','Experiment 5 problem (A–H)'],
 ['Heaviest shark (kg)','Swimming aid: fins and …','Food from ocean …','Sense used to locate food','Net direction (A–C)','Other meshing location (A–C)','Annual catch (A–C)','Main catch season (A–C)','Reduced benefits: factor 1 (A–G)','Reduced benefits: factor 2 (A–G)']]

pdf = pdfium.PdfDocument(str(SOURCE / 'Cambridge-IELTS-04.pdf'))
catalog = []
for test in range(1,5):
    url = f'https://ieltsvault.com/resources/listening/tests/cambridge-ielts-4-listening-test-{test}'
    request = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    source_html = urllib.request.urlopen(request, timeout=30).read().decode()
    section = source_html.split('Audio transcripts</p>',1)[1]
    paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', section, re.S)[:8]
    texts = [html.unescape(re.sub('<[^>]+>', '', p)).strip() for p in paragraphs]
    assert len(texts)==8 and all(len(texts[i])>1500 for i in [1,3,5,7])
    for part in range(1,5):
        stem=f'test-{test}-section-{part}-{NAMES[test-1][part-1]}'
        original=SOURCE / f'Cambridge-IELTS---Listening-04/Test {test}/IELTS04-Test {test}-Section {part}.mp3'
        shutil.copyfile(original, OUT / (stem+'.mp3'))
        (OUT / (stem+'.txt')).write_text(texts[(part-1)*2+1]+'\n',encoding='utf-8')
        pages=[]
        for number in PAGES[test-1][part-1]:
            target=f'question-page-{number}.webp'
            page=pdf[number-1]
            page.render(scale=1.7).to_pil().save(OUT/target, 'WEBP', quality=86)
            pages.append('/listening/cambridge-04/'+target)
        catalog.append(dict(id=stem,test=test,part=part,title=texts[(part-1)*2].split(' — ',1)[-1],filename=stem+'.mp3',audio='/listening/cambridge-04/'+stem+'.mp3',transcript='/listening/cambridge-04/'+stem+'.txt',transcriptSource=url,pages=pages,questions=[{'number':(part-1)*10+i+1,'prompt':p} for i,p in enumerate(CUES[(test-1)*4+part-1])],sha256=hashlib.sha256(original.read_bytes()).hexdigest()))
(OUT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Packaged {len(catalog)} audio files, transcripts and 160 question inputs: {OUT}')
