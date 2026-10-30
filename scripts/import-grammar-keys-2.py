"""Import the supplied book's Units 61–115 and Additional exercises answer key.

Input: the original PDF, or the inspection cache outputs/grammar-reader/keys2-columns.json.
The cache contains per-page, per-column text. It is generated from the original PDF;
no rewritten PDF is created. Manual OCR corrections below were checked against page PNGs.
"""
import itertools
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'outputs/grammar-reader/keys2-columns.json'
DEST = ROOT / 'data/grammar-book/answers-2.json'
DEFAULT_PDF = Path(r'D:\英文学习\grammar\book\Essential Grammar in Use (Murphy Raymond) (z-library.sk, 1lib.sk, z-lib.sk).pdf')


def extract_pdf(path):
    import collections
    import pdfplumber
    pages = []
    with pdfplumber.open(path) as doc:
        for n in range(279, 295):
            p = doc.pages[n - 1]
            top = 68 if n == 292 else 35
            bottom = p.height - 24
            words = p.crop((0, top, p.width, bottom)).extract_words(x_tolerance=3, y_tolerance=3)
            nums = [w for w in words if re.fullmatch(r'\d+(?:\.\d+)?', w['text']) and 20 < w['x0'] < p.width - 15]
            peaks = collections.Counter(round(w['x0'] / 2) * 2 for w in nums)
            anchors = []
            for x, count in peaks.most_common():
                if all(abs(x - a) > 110 for a in anchors):
                    anchors.append(x)
                if len(anchors) == 3:
                    break
            anchors.sort()
            assert len(anchors) == 3, (n, anchors)
            bounds = [10, anchors[1] - 13, anchors[2] - 13, p.width - 5]
            columns = []
            for i in range(3):
                crop = p.crop((bounds[i], top, bounds[i + 1], bottom))
                columns.append({'text': crop.extract_text(x_tolerance=3, y_tolerance=3) or ''})
            pages.append({'page': n, 'columns': columns})
    return pages


COMPACT = set('61.1 62.4 63.1 64.2 65.1 66.1 66.2 66.4 74.3 76.1 77.2 77.4 80.1 80.3 80.5 82.1 83.1 84.1 84.4 89.3 92.2 103.1 103.2 104.2 107.2 108.1 111.3 112.1 113.1 113.3 extra.23 extra.28 extra.32 extra.35'.split())
EXTRA_PAGES = {1: 241, 2: 242, 3: 242, 4: 242, 5: 243, 6: 243, 7: 243, 8: 244, 9: 244, 10: 245, 11: 245, 12: 245, 13: 245, 14: 246, 15: 247, 16: 247, 17: 249, 18: 249, 19: 249, 20: 250, 21: 250, 22: 251, 23: 251, 24: 252, 25: 252, 26: 252, 27: 253, 28: 253, 29: 254, 30: 255, 31: 255, 32: 257, 33: 258, 34: 259, 35: 259}
SELF_GROUPS = set('61.4 65.4 72.1 72.2 75.3 77.4 90.1 94.4 95.2 97.2 97.3 98.4 99.3 100.4 108.5 109.3 112.5 113.4 115.2 extra.6 extra.18 extra.21 extra.22 extra.29 extra.34'.split())


def clean(text):
    text = text.replace('\u2019', "'").replace('\u2018', "'").replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2026', '...').replace('TTiey', 'They')
    text = re.sub(r'\b1 (?=(?:am|have|haven\'t|would|already)\b)', 'I ', text)
    text = re.sub(r'\bl(?=\'(?:m|ve|ll|d))', 'I', text)
    text = re.sub(r'(?<=/)l(?= (?:have|am|would))', 'I', text)
    text = text.replace('Noneofit.', 'None of it.').replace('ajar of honey', 'a jar of honey')
    text = text.replace('int he', 'in the').replace('inthe ', 'in the ')
    text = re.sub(r'\s*\.\.\.\s*', ' ... ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'(?<=[A-Za-z])/ (?=[A-Za-z])', '/', text)
    return text


def fixed_column(n, ci, text):
    text = text.replace('711.4', '71.4').replace('71 .3', '71.3')
    if n == 280 and ci == 0:
        text = text.replace('2-8\nTom never wears a hat.\nI can\'t ride a bike.\nMy brother is an artist.\nRebecca works in a bookshop.\nJane wants to learn a foreign\nlanguage.\nMike lives in an old house.\nThis evening I\'m going to a\nparty.',
            "2 Tom never wears a hat.\n3 I can't ride a bike.\n4 My brother is an artist.\n5 Rebecca works in a bookshop.\n6 Jane wants to learn a foreign language.\n7 Mike lives in an old house.\n8 This evening I'm going to a party.")
    if n == 281 and ci == 1:
        text = text.replace("2-8 Example answers:\nI don't like dogs.\nI hate museums.\nI love big cities.\nTennis is all right.\nI love chocolate.",
            "Example answers:\n2 I don't like dogs.\n3 I hate museums.\n4 I love big cities.\n5 Tennis is all right.\n6 I love chocolate.")
    if n == 281 and ci == 2:
        text = text.replace("I don't like computer games.\nI hate parties.", "7 I don't like computer games.\n8 I hate parties.")
    if n == 283 and ci == 2:
        text = text.replace('\nNone of\n', '\n8 None of\n')
        text = text.replace('82.1\nBoth 9 Neither\nNeither 10 either of\nNeither 11 Both\nboth 12 neither of\nEither 13 Both', '82.1\n3 Both 9 Neither\n4 Neither 10 either of\n5 Neither 11 Both\n6 both 12 neither of\n7 Either 13 Both')
    if n == 283 and ci == 1:
        text = text.replace('everyday', 'every day')
    if n == 284 and ci == 0:
        text = text.replace('2 much me\n3 many juntries\n4 many ?ople\n5 much ggage\n6 many nes', '2 much time\n3 many countries\n4 many people\n5 much luggage\n6 many times')
    if n == 285 and ci == 2:
        text = text.replace('3-6\nBrazil is', '3 Brazil is').replace('\nAlaska is', '\n4 Alaska is').replace('\nThe Nile is', '\n5 The Nile is').replace('\nJupiter is', '\n6 Jupiter is')
    if n == 292 and ci == 1:
        text = '6\n' + text
    if n == 293 and ci == 0:
        text = text.replace('11 m/am trying', "11 'm/am trying")
    if n == 293 and ci == 1:
        text = text.replace("12 've/have never i", "12 've/have never made")
    if n == 294 and ci == 0:
        text = '29\n' + text
    if n == 294 and ci == 2:
        text = text.replace('21 After dinner\nwatched TV (-)', '21 After dinner (-) ... watched TV (-)')
    return text


def parse(pages):
    groups = []
    group = None
    item = None
    skip_note = False
    for row in pages:
        n = row['page']
        for ci, col in enumerate(row['columns']):
            text = fixed_column(n, ci, col['text'])
            for raw in text.splitlines():
                line = clean(raw)
                if not line or re.match(r'UN\s*IT \d+', line, re.I):
                    continue
                match = re.fullmatch(r'(\d{2,3})\.(\d)', line) if n < 292 else re.fullmatch(r'(\d{1,2})', line)
                if match:
                    if n < 292:
                        unit = int(match[1])
                        gid = line
                        if unit < 61:
                            group = item = None
                            continue
                        page = 2 * unit + 1
                    else:
                        unit = None
                        gid = 'extra.' + match[1]
                        page = EXTRA_PAGES[int(match[1])]
                    group = {'id': gid, 'unit': unit, 'page': page, 'keyPages': [n], 'instruction': '按书中题号填写词语或完整句子。多空答案按顺序用分号分隔；无需补充词语时填写 –。', 'mode': 'objective', 'items': []}
                    groups.append(group)
                    item = None
                    skip_note = False
                    continue
                if group is None:
                    continue
                if n not in group['keyPages']:
                    group['keyPages'].append(n)
                if line == 'Example answers:':
                    group['mode'] = 'self'
                    continue
                if line.startswith('* American'):
                    skip_note = True
                    continue
                is_item = re.match(r'^(\d{1,2})([ab]?)\s+(.+)$', line)
                if is_item:
                    skip_note = False
                    pieces = re.split(r'(?<!\S)(\d{1,2}[ab]?)\s+', line)[1:] if group['id'] in COMPACT else [is_item[1] + is_item[2], is_item[3]]
                    for k in range(0, len(pieces), 2):
                        label, answer = pieces[k], pieces[k + 1].strip()
                        if group['id'] == '78.3' and re.match(r'^[ab] ', answer):
                            label += answer[0]
                            answer = answer[2:]
                        item = {'id': label, 'label': label, 'answer': answer, 'alternatives': [], 'mode': 'objective'}
                        group['items'].append(item)
                    continue
                if skip_note:
                    continue
                if item is not None:
                    item['answer'] += ' ' + line
                else:
                    raise ValueError((n, ci, group['id'], line))
    return groups


def cartesian_replace(text, pattern, options):
    m = re.search(pattern, text)
    if not m:
        return [text]
    result = []
    for option in options(m):
        result.extend(cartesian_replace(text[:m.start()] + option + text[m.end():], pattern, options))
    return result


def expand_variants(reference):
    # Printed keys frequently put an expanded contraction beside its abbreviated
    # form with a shared sentence ending. Keep the unambiguous expanded form.
    text = reference
    pairs = [
        ("I'm/I am", 'I am'), ("I've/I have", 'I have'), ("I'd/I would", 'I would'),
        ("He's/He is", 'He is'), ("He's/He has", 'He has'),
        ("She's/She is", 'She is'), ("She's/She has", 'She has'),
        ("It's/It is", 'It is'), ("It's/It has", 'It has'),
        ("They're/They are", 'They are'), ("They've/They have", 'They have'),
        ("We're/We are", 'We are'), ("We've/We have", 'We have'),
        ("You've/You have", 'You have'), ("She's got/She has got", 'She has got'),
    ]
    for old, new in pairs:
        text = re.sub(re.escape(old), new, text, flags=re.I)
    # Standard, complete alternatives separated with spaces or 'or'.
    choices = re.split(r'\s+/\s+|[,.]?\s+or\s+', text)
    variants = []
    for choice in choices:
        # Optional parenthetical words, not explanatory notes.
        if re.search(r'\([^()]*\)', choice):
            if re.search(r'\((?:See|which|who|that|You|without|American|already|or)\b', choice, re.I):
                return None
            options = cartesian_replace(choice, r'\(([^()]*)\)', lambda m: ['', m[1]])
        else:
            options = [choice]
        for option in options:
            # A word choice has a common prefix/suffix: further/farther,
            # day was/were the same, telephone/phone, etc.
            expanded = cartesian_replace(option, r"([A-Za-z'-]+(?:\./[A-Za-z'-]+|/[A-Za-z'-]+)+)", lambda m: re.split(r'\.?/', m[1]))
            for v in expanded:
                v = re.sub(r'\s+', ' ', v).strip(' .')
                if v and v not in variants:
                    variants.append(v)
    return variants if variants and len(variants) <= 32 else None


def finalise(groups):
    byid = {g['id']: g for g in groups}
    dialogue_references = {
        '1': "I stayed; did you do; I watched; Are you going; I'm going; are you going to see; I don't know. I haven't decided",
        '2': "have you been; We arrived; are you staying / are you going to stay; do you like; we're having",
        '3': "I'm going ... Do you want; are you going; Have you ever eaten; I've been ... I went",
        '4': "I've lost ... Have you seen; You were wearing ... I came; I'm not wearing; Have you looked / Did you look; I'll go",
    }
    for i in byid['extra.29']['items']:
        i['answer'] = dialogue_references[i['id']]
    # Reconstructed only when the PDF image and exercise both support the result.
    corrected = {
        ('63.3', '6'): ('They gave each other presents.', ['They gave each other a present.']),
        ('77.1', '8'): ("Tom doesn't have any brothers or sisters.", ["Tom hasn't got any brothers or sisters."]),
        ('82.2', '4'): ('Both men have beards.', ['Both men have got beards.', 'Both of them have beards.', 'Both of them have got beards.']),
        ('86.3', '10'): ('nice', []),
        ('92.3', '5'): ("It isn't big enough.", ["It's not big enough."]),
        ('95.3', '2'): ('Is Helen here yet?', ['Has Helen arrived yet?', 'Has Helen come yet?']),
        ('96.2', '4'): ('I gave Emma some chocolates.', ['I gave Emma a box of chocolates.']),
        ('96.2', '5'): ('I gave Rachel some flowers.', ['I gave Rachel a bunch of flowers.']),
        ('97.1', '7'): ('Do you want me to come with you, or shall I wait here?', []),
        ('100.3', '8'): ('we would buy a bigger house', ['we could buy a bigger house', 'we would have a bigger house', 'we could have a bigger house']),
        ('112.2', '7'): ('from', ['to', 'than']),
        ('110.3', '8'): ('out of', ['from']),
        ('112.2', '12'): ('for getting angry with you', ['about getting angry with you']),
        ('112.3', '5'): ('sorry for waking', ['sorry about waking']),
        ('115.4', '8'): ('gave it up', ['gave up']),
        ('extra.5', '9'): ("She isn't interested in sport.", ["She's not interested in sport."]),
    }
    for g in groups:
        if g['id'] in SELF_GROUPS:
            g['mode'] = 'self'
        seen = set()
        g['items'].sort(key=lambda i: (int(re.match(r'\d+', i['id'])[0]), i['id']))
        for i in g['items']:
            assert i['id'] not in seen, (g['id'], i['id'])
            seen.add(i['id'])
            raw = clean(i['answer'])
            raw = re.sub(r'\(American speakers say.*?\)', '', raw).strip()
            raw = re.sub(r'that is also correct in all these sentences\.?', '', raw).strip()
            raw = raw.replace('(See Unit 8SC.)', '').replace('(See Unit 85C.)', '').strip()
            i['answer'] = raw
            i['reference'] = raw
            i['mode'] = g['mode']
            if g['id'] == '101.3':
                i['alternatives'] = ['that']
            elif (g['id'], i['id']) in corrected:
                i['answer'], i['alternatives'] = corrected[(g['id'], i['id'])]
            elif raw in ['- (already complete)', '– (already complete)']:
                i['answer'] = '–'
                i['alternatives'] = ['-', 'no word', 'already complete', '不填']
            elif '*' in raw and raw.strip('*') == 'at':
                i['answer'] = 'at'
                i['alternatives'] = ['on']
            elif i['mode'] == 'self':
                pass
            elif '...' in raw:
                parts = [x.strip() for x in raw.split('...')]
                # These are distinct blanks, not abbreviated model sentences.
                if all(parts) and all(len(x.split()) <= 4 for x in parts) and all('(' not in x for x in parts):
                    i['answerParts'] = parts
                    choices = [expand_variants(x) for x in parts]
                    if all(choices):
                        combinations = list(itertools.product(*choices))
                        i['answer'] = ' ... '.join(combinations[0])
                        i['alternatives'] = ['; '.join(values) for values in combinations] + [' '.join(values) for values in combinations]
                    else:
                        i['mode'] = 'self'
                else:
                    i['mode'] = 'self'
            elif '(-)' in raw:
                i['mode'] = 'self'
            else:
                variants = expand_variants(raw)
                if variants is None or any(len(v) < 1 for v in variants):
                    i['mode'] = 'self'
                else:
                    i['answer'] = variants[0]
                    i['alternatives'] = variants[1:] + i['alternatives']
            if g['id'] == '65.3' and i['id'] == '8':
                i['mode'] = 'self'
            if g['id'] == 'extra.3' and i['id'] == '7':
                i['mode'] = 'self'
            if g['id'] == '90.3' and int(i['id']) >= 3:
                # The book gives a range 3–6; any order of these model sentences
                # is valid, so the assigned display order must not affect a mark.
                i['mode'] = 'self'
            if g['id'] == 'extra.16':
                i['page'] = 247 if int(i['id']) <= 4 else 248
            if g['id'] == 'extra.31':
                i['page'] = 255 if int(i['id']) <= 13 else 256
        if g['id'] == 'extra.16':
            g['pages'] = [247, 248]
        if g['id'] == 'extra.31':
            g['pages'] = [255, 256]
        if all(i['mode'] == 'self' for i in g['items']):
            g['mode'] = 'self'
        if g['mode'] == 'self':
            g['instruction'] = '先按书中题号完成作答，再检查并对照参考答案。开放式、对话或缩略参考答案允许合理的不同表达，需要自行核对。'
        elif any(i['answer'] == 'OK' for i in g['items']):
            g['instruction'] += ' 原句正确时填写 OK。'
    return groups


def main():
    if len(sys.argv) > 1:
        pages = extract_pdf(Path(sys.argv[1]))
    elif CACHE.exists():
        pages = json.loads(CACHE.read_text(encoding='utf-8-sig'))
    else:
        pages = extract_pdf(DEFAULT_PDF)
    groups = finalise(parse(pages))
    assert len({g['id'] for g in groups}) == len(groups)
    assert {g['unit'] for g in groups if g['unit']} == set(range(61, 116))
    assert {g['id'] for g in groups if not g['unit']} == {f'extra.{i}' for i in range(1, 36)}
    assert all(g['items'] and all(i['answer'] for i in g['items']) for g in groups)
    assert len(groups) == 237 and sum(len(g['items']) for g in groups) == 1789
    byid = {g['id']: g for g in groups}
    assert [i['answer'] for i in byid['61.1']['items']] == ['mine', 'ours', 'hers', 'theirs', 'yours', 'mine', 'his']
    assert [i['id'] for i in byid['111.3']['items']] == [str(n) for n in range(1, 17)]
    assert [i['answer'] for i in byid['83.2']['items']] == ['much time', 'many countries', 'many people', 'much luggage', 'many times']
    assert all(i['page'] == (255 if int(i['id']) <= 13 else 256) for i in byid['extra.31']['items'])
    assert all(not re.search(r'/|\(|\)|\*', i['answer']) for g in groups for i in g['items'] if i['mode'] == 'objective')
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(groups, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'groups': len(groups), 'items': sum(len(g['items']) for g in groups), 'selfItems': sum(i['mode'] == 'self' for g in groups for i in g['items']), 'path': str(DEST)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
