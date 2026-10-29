"""Compile our original, hand-authored teaching rows. No API or scraping required."""
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent
rows = []
for line in (root/'data/ielts-vocabulary.txt').read_text().splitlines():
    if not line: continue
    if line.startswith('# '):
        level, topic = line[2:].split('|'); group_index = 0
        continue
    parts = line.split('|')
    assert len(parts) == 10, (parts[0], len(parts))
    word, ipa, pos, meaning, *examples = parts
    rows.append(dict(id=word, word=word, ipa=f'/{ipa}/', topic=topic, level=level,
        group=f'{topic} · {group_index // 5 + 1}', senses=[dict(id=f'{word}-{pos.rstrip(".")}-1',pos=pos,meaning=meaning,
        examples=[dict(en=examples[i],zh=examples[i+1]) for i in range(0,6,2)])], notes=[]))
    group_index += 1
assert len(rows) == 200 and len({r['id'] for r in rows}) == 200
# Distinct, distant concepts are deliberately used as distractors, never synonyms of the tested sense.
pools={'n.':['退款','栖息地','截止日期','算法','奖学金','行李'], 'v.':['招聘员工','提取现金','回收利用','禁止进入','推迟会议','澄清含义'],
       'adj.':['宽敞的','可再生的','有害的','独立的','数字化的','足够的'], 'conj.':['因为','除非','一旦']}
for index, row in enumerate(rows):
    sense=row['senses'][0]; pool=pools[sense['pos']]
    # Manually excluded related meanings, so only the target option fits the authored sentence.
    excluded={'refund':['退款'],'habitat':['栖息地'],'deadline':['截止日期'],'algorithm':['算法'],'scholarship':['奖学金'],'luggage':['行李'],
      'recruit':['招聘员工'],'withdraw':['提取现金'],'recycle':['回收利用'],'prohibit':['禁止进入'],'postpone':['推迟会议'],'clarify':['澄清含义'],
      'spacious':['宽敞的'],'renewable':['可再生的'],'detrimental':['有害的'],'independent':['独立的'],'digital':['数字化的'],'sufficient':['足够的']}
    candidates=[p for p in pool if p not in excluded.get(row['id'],[]) and p != sense['meaning']]
    offset=index % len(candidates)
    sense['distractors']=(candidates[offset:]+candidates[:offset])[:3]
# Explicit comparisons; no automatically inferred synonyms or spelling neighbours.
notes={
 'accommodation': [('用法','accommodation','住宿','通常为不可数名词；表示一处住处可用 a place to stay，不说 an accommodation。')],
 'tenant':[('词义关联','landlord','房东','tenant 租住，landlord 出租；两者是租赁关系中的不同角色。')],
 'landlord':[('词义关联','tenant','租户','landlord 是出租方，tenant 是承租方，不能互换。')],
 'deposit':[('词义关联','instalment','分期款项','deposit 此处为可退还的租房押金；instalment 是分期支付的一笔款项。')],
 'lease':[('近义词','contract','合同','lease 专指租赁合同；contract 是更广泛的合同。')],
 'furnished':[('词族','furniture','家具','furnished 描述配备家具；furniture 是不可数名词。')],
 'residential':[('词族','resident','居民','residential 强调住宅用途；resident 作名词指居民，作形容词指居住的或常驻的。')],
 'commute':[('近义词','travel','旅行；出行','commute 特指经常往返住所与工作或学习地点，travel 范围更广。')],
 'fare':[('词义关联','fee','服务费','fare 用于车船等交通票价；fee 用于课程、服务等收费。'),('形近词','fair','公平的','fare 与 fair 常同音，但拼写和含义不同。')],
 'departure':[('反义词','arrival','到达','departure 指出发，arrival 指到达；注意听力中的时间变更。')],
 'luggage':[('近义词','baggage','行李','两者常可互换，通常都不可数；一件行李用 a piece of luggage。')],
 'reservation':[('近义词','booking','预订','预订房间或座位时意思接近；reservation 还可表示保留意见。')],
 'refund':[('词义关联','replacement','替换品','refund 退还款项；replacement 提供替换商品。')],
 'receipt':[('形近词','recipe','食谱','receipt 表示收据，p 不发音；recipe 表示食谱，末尾 e 发音。')],
 'purchase':[('近义词','buy','购买','purchase 比 buy 正式，常见于商业书面语。')],
 'complaint':[('词族','complain','抱怨；投诉','make a complaint；动词用 complain about something。')],
 'reliable':[('词族','rely','依赖','reliable 是形容词；rely on 表示依赖。')],
 'applicant':[('词族','application','申请','applicant 是申请人，application 是申请或申请材料。')],
 'qualification':[('词义关联','experience','实践经验','qualification 指取得的资格或学历，experience 指实践积累。')],
 'experience':[('用法','experience','经验；经历','表示经验通常不可数；an experience 指一次具体经历。')],
 'salary':[('近义词','wage','工资','salary 常指按月领取的固定薪资；wage 常按小时或周计算。')],
 'colleague':[('形近词','college','学院','colleague 是同事；college 是学院，词尾和读音均不同。')],
 'responsibility':[('词族','responsible','负责任的','take responsibility for；be responsible for 都接负责的事情。')],
 'efficient':[('近义词','effective','有效的','efficient 强调省时省力；effective 强调达到预期效果。'),('形近词','deficient','缺乏的','efficient 是高效，deficient 是不足，常用 deficient in。')],
 'prescription':[('词族','prescribe','开处方','prescribe 是动词，prescription 是处方名词。')],
 'prevent':[('近义词','avoid','避免','prevent something from happening 是阻止发生；avoid doing 是避免做。')],
 'curriculum':[('词义关联','syllabus','教学大纲','curriculum 指整体课程体系；syllabus 常指一门课的大纲。')],
 'tuition':[('用法','tuition fees','学费','tuition 在英式英语常指教学或辅导；tuition fees 指学费。')],
 'practical':[('形近词','practise','练习','practical 是实用的；practise 是英式动词拼写，名词为 practice。')],
 'income':[('词义关联','revenue','营收','income 可指个人收入或企业收益；revenue 常指机构营收，不能等同于利润。')],
 'expense':[('词族','expensive','昂贵的','expense 是开支名词；expensive 是昂贵的形容词。')],
 'debt':[('用法','debt','债务','b 不发音；pay off a debt 表示还清债务。')],
 'insurance':[('形近词','assurance','保证；信心','insurance 常指风险保险；assurance 常指保证或信心。')],
 'eligible':[('用法','eligible for','符合资格','eligible for + 名词；eligible to + 动词原形。')],
 'enquire':[('拼写变体','inquire','询问','两者都可用；英式英语一般询问常用 enquire，美式常用 inquire。')],
 'apologise':[('拼写变体','apologize','道歉','常见英美拼写差异；apologise to someone for something。')],
 'appreciate':[('用法','appreciate it if','如能…将不胜感激','用 I would appreciate it if you could…；appreciate 后不用 to do 表示感谢某事。')],
 'recommend':[('用法','recommend doing','建议做某事','recommend doing 或 recommend that someone do；不要直接用 recommend to do。')],
 'sustainable':[('词义关联','renewable','可再生的','renewable 指能自然补充；sustainable 指能长期维持而不过度损害资源，两者不等同。')],
 'emission':[('词族','emit','排放','emit 是动词；emission 是排放名词，讨论各类排放常用 emissions。')],
 'conservation':[('近义词','preservation','保存；保护','conservation 常强调合理管理自然资源；preservation 常强调避免改变或损坏。')],
 'consumption':[('词族','consume','消耗','consume 是动词；consumption 是消耗量或消费的名词。')],
 'urbanisation':[('拼写变体','urbanization','城市化','这里采用常见英式 -isation 拼写；-ization 也是通行拼写。')],
 'rural':[('反义词','urban','城市的','rural 描述乡村，urban 描述城市。')],
 'renovate':[('近义词','repair','修理','renovate 通常是整体翻新；repair 侧重修复损坏。')],
 'allocate':[('用法','allocate to','分配给','allocate money/time/resources to something；也可 allocate someone something。')],
 'productivity':[('词族','productive','高产的；富有成效的','productivity 是产出效率；production 是生产过程或产量，不能直接互换。')],
 'revenue':[('词义关联','profit','利润','revenue 是收入；profit 通常是扣除成本后的利润。')],
 'inequality':[('反义词','equality','平等','inequality 表示不平等；equity 更侧重公平对待和合理分配。')],
 'innovation':[('近义词','invention','发明','invention 指发明新东西；innovation 也包括将新方法投入使用。')],
 'misinformation':[('词义关联','disinformation','故意传播的虚假信息','misinformation 泛指错误信息，不要求传播者有意误导；disinformation 强调蓄意。')],
 'adopt':[('形近词','adapt','适应；改编','adopt a method 是采用方法；adapt to change 是适应变化。')],
 'heritage':[('词义关联','tradition','传统','heritage 是传承下来的文化或遗产；tradition 常指世代延续的习俗。')],
 'integration':[('词族','integrate','融入；整合','integration 是名词；integrate into a community 表示融入社区。')],
 'cohesion':[('词义关联','coherence','连贯性','social cohesion 是社会凝聚力；写作中 cohesion 侧重衔接，coherence 侧重整体逻辑。')],
 'legislation':[('词义关联','regulation','规章','legislation 指法律或立法，通常不可数；a regulation 是一项具体规定。')],
 'enforce':[('近义词','implement','实施','enforce 强调确保法律规则被遵守；implement 强调将计划政策付诸行动。')],
 'evidence':[('用法','evidence','证据','通常不可数；a piece of evidence 表示一项证据，不用 an evidence。')],
 'research':[('用法','research','研究','通常不可数；可说 a research study，不能用 a research 表示一项研究。')],
 'analysis':[('词族','analyse','分析','analyse 是英式动词；analysis 是单数名词，复数为 analyses。')],
 'significant':[('用法','statistically significant','统计上显著的','一般语境可指重要或明显；研究中统计显著不一定等于实际影响很大。')],
 'objective':[('反义词','subjective','主观的','objective 强调基于事实；subjective 受个人感受影响。objective 作名词还可表示目标。')],
 'assumption':[('近义词','hypothesis','假说','assumption 是作为前提的假定；hypothesis 通常是有待检验的解释。')],
 'consequence':[('近义词','result','结果','consequence 常指行为带来的后果；result 用途更广。')],
 'contribute':[('用法','contribute to','促成；有助于','to 是介词，后接名词或动名词；不一定表示唯一原因。')],
 'alleviate':[('近义词','mitigate','减轻','alleviate 常缓解痛苦、压力或贫困；mitigate 常减轻风险或负面影响。')],
 'exacerbate':[('反义词','alleviate','缓解','exacerbate 使问题更严重；alleviate 减轻问题或痛苦。')],
 'address':[('多义提醒','address','地址；处理','名词 address 可指地址；动词 address a problem 是处理问题。')],
 'advantage':[('反义词','drawback','缺点','advantage 是有利之处；drawback 是不利之处。')],
 'beneficial':[('反义词','detrimental','有害的','beneficial to 表示有益于；detrimental to 表示有害于。')],
 'sufficient':[('近义词','adequate','足够的；合乎需要的','两者可描述足以满足需求；sufficient evidence 强调证据数量或力度足够。')],
 'whereas':[('近义词','while','而；虽然；当…时','whereas 明确表达对比；while 还可表示时间或让步，需结合语境。')]
}
for row in rows:
    row['notes']=[dict(type=t,word=w,meaning=m,difference=d) for t,w,m,d in notes.get(row['id'],[])]
# Additional high-utility senses are separate units, not automatically passed with the first sense.
extra = [
('deposit','v.','存入款项', [('You can deposit cash at this branch.','你可以在这家分行存入现金。'),('Please deposit the money into your savings account.','请将钱存入储蓄账户。'),('Customers can deposit cheques using the banking app.','顾客可以使用银行应用存入支票。')], ['提取现金','租住房屋','签署合同']),
('platform','n.','网络平台', [('The platform connects tutors with learners online.','这个平台在线连接导师和学习者。'),('Our online platform allows users to share documents.','我们的网络平台允许用户共享文件。'),('The digital platform offers courses in several languages.','这个数字平台提供多种语言的课程。')], ['火车站台','演讲台','房屋地基']),
('application','n.','软件应用程序', [('This mobile application tracks your daily spending.','这款手机应用记录你的每日支出。'),('You can download the application from the official store.','你可以从官方商店下载这个应用程序。'),('The application needs an update before it can run.','这个应用程序需要更新后才能运行。')], ['书面申请','职位空缺','操作规章']),
('reference','n.','参考；查阅', [('Keep this guide for future reference.','请保留这份指南以供日后查阅。'),('The manual is available for reference in the office.','办公室有这本手册供查阅。'),('The website provides useful reference material.','这个网站提供有用的参考资料。')], ['推荐信','退款','面试']),
('address','n.','地址', [('Please write your home address on the form.','请在表格上填写家庭地址。'),('The parcel was sent to the wrong address.','包裹被寄到了错误的地址。'),('Have you updated your postal address?','你更新邮寄地址了吗？')], ['处理问题','发表演说','联系方式的姓名']),
('objective','n.','目标', [('The main objective is to reduce traffic accidents.','主要目标是减少交通事故。'),('Set a clear objective before starting the project.','开始项目前设定明确目标。'),('Our objective is to improve access to education.','我们的目标是改善受教育机会。')], ['偏见','客观的','后果']),
('experience','n.','一次经历；体验', [('Living abroad was a valuable experience.','在国外生活是一次宝贵的经历。'),('The trip was an unforgettable experience.','这次旅行是一次难忘的经历。'),('She described her first experience of travelling alone.','她描述了第一次独自旅行的经历。')], ['工作经验的积累','资格证书','课程考核']),
('impact','v.','影响', [('The new rules may impact small businesses.','新规则可能影响小企业。'),('Long commutes can impact family life.','长时间通勤可能影响家庭生活。'),('The change will impact how we manage the budget.','这一变化将影响我们管理预算的方式。')], ['实施','得出结论','翻新']),
('approach','v.','接近；靠近', [('Please slow down as you approach the junction.','接近路口时请减速。'),('Visitors must not approach the wild animals.','游客不得靠近野生动物。'),('We could see the coast as we began to approach the island.','开始靠近小岛时，我们能看见海岸。')], ['研究方法','推迟','削弱']),
('shift','v.','转变；转移', [('We need to shift our attention to prevention.','我们需要把注意力转向预防。'),('Consumers may shift from cars to public transport.','消费者可能从汽车转向公共交通。'),('The policy could shift investment towards renewable energy.','该政策可能使投资转向可再生能源。')], ['轮班','申请','禁止'])
]
by_id={w['id']:w for w in rows}
for word,pos,meaning,examples,distractors in extra:
    by_id[word]['senses'].append(dict(id=f'{word}-{pos.rstrip(".")}-2',pos=pos,meaning=meaning,examples=[dict(en=en,zh=zh) for en,zh in examples],distractors=distractors))
# Keep the same part-of-speech pronunciation on every sense, including heteronyms.
for word, sense_index, ipa in [('deposit',1,'/dɪˈpɒzɪt/'),('address',1,'/əˈdres/'),('impact',1,'/ɪmˈpækt/')]:
    by_id[word]['senses'][sense_index]['ipa']=ipa
metadata=dict(version='2026-10-22',title='IELTS GT 7 分目标 · 自主整理精选词库',
    description='依据 GT 生活、职场及议论主题自主选词，释义与例句为原创教学材料；不是 IELTS 官方词表，不代表完整考试范围，也不承诺分数。',
    sources=[dict(title='IELTS 官方：GT 阅读内容与题型',url='https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-reading'),dict(title='IELTS 官方：写作评分与备考资源',url='https://ielts.org/take-a-test/preparation-resources/writing-test-resources')])
output='// Generated by scripts/build-vocabulary.py from original teaching material. Do not edit directly.\n'
output+='export const vocabularyInfo='+json.dumps(metadata,ensure_ascii=False)+';\n'
output+='export const ieltsWords='+json.dumps(rows,ensure_ascii=False,indent=2)+';\n'
output+='export const ieltsBasicIds=ieltsWords.filter(w=>w.level==="basic").map(w=>w.id);\n'
output+='export const ieltsPlusIds=ieltsWords.filter(w=>w.level==="plus").map(w=>w.id);\n'
(root/'dist/ielts-vocabulary.js').write_text(output)
print(f'Compiled {len(rows)} words / {sum(len(w["senses"]) for w in rows)} senses / {sum(len(w["senses"])*3 for w in rows)} bilingual examples')
