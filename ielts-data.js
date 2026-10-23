export const SOURCES=[
 ['IELTS 官方评分说明','https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail'],
 ['GT 写作考试格式','https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-writing'],
 ['官方样题与答案入口','https://ielts.org/take-a-test/preparation-resources/sample-test-questions'],
 ['写作评分标准 PDF','https://cdn.ielts.org/Guides/ielts-writing-band-descriptors.pdf'],
 ['口语考试格式','https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking']
];
export const TASKS={
 listening:['先做听力首测，记录 /40 原始分；另选 30–60 秒错题片段精听。','独听 → 分句听写 → 对照原文标弱读/连读 → 跟读 → 次日盲听。','专项练填空、地图、多选及 Part 3/4；一套新卷检验，错题精听。','按考试模式完整听一遍、不暂停；复盘同义替换和干扰选项。','做保留的新题，重听高频错因片段；考前减量。'],
 writing:['完成一篇 Task 2 和一封 GT 书信，不查整段翻译；保留未经润色的初稿。','先写正确简单句，再扩展因果/让步；每篇初稿 → 自查 → 外部反馈 → 48 小时后重写。','每周 2 篇 Task 2 + 1 封信，其中至少 1 篇获得反馈；质量优先于篇数。','Task 1 20 分钟 + Task 2 40 分钟；留检查时间，逐条复核题意和语法。','复习自己的重复错误，不背整篇模板；按反馈修改最后两篇。'],
 speaking:['做一次 Part 1–3 全程模拟并录音；转写 60 秒，找语法和逻辑漏洞。','Part 2 准备 1 分钟、说 2 分钟；转写并修正 3 处问题，再录一遍。','Part 3 练“立场—理由—例子—限制条件”，每周两次录音复盘。','每周一次 11–14 分钟模拟；陌生话题也能解释与改述，请人提供反馈。','重练近期卡顿的话题和重音节奏，避免背诵答案。'],
 reading:['用 GT 阅读做一次完整 60 分钟首测；区分读懂、定位、同义替换和超时。','每周 3 次限时阅读；答案旁记录原文证据，重点区分 False 与 Not Given。','覆盖 GT 日常生活、工作场景与较长文章；每周一套整卷，精读错误证据。','完整 60 分钟，不用字典；目标 36/40，最后一部分预留充足时间。','用未做过的 GT 题核验稳定性；不再逐词精读所有文章。']
};
export const GRAMMAR=[
 ['完整句与句子边界','先找主语和限定动词；纠正残句、逗号拼接和一口气写到底。','Remote work saves time, it also reduces travel costs.','Remote work saves time and reduces travel costs.'],
 ['时态与主谓一致','明确过去/现在/将来；第三人称单数与复数名词逐句检查。','The company provide training last year.','The company provided training last year.'],
 ['冠词、可数性与搭配','重点检查 advice、information、equipment 等不可数名词，以及动词介词搭配。','She gave me many useful advices.','She gave me a lot of useful advice.'],
 ['因果与让步','用 because、although、while 连接两层意思；避免 because…so / although…but 重复。','Although it is convenient, but it can be expensive.','Although it is convenient, it can be expensive.'],
 ['定语从句与指代','先写清核心事实，再补信息；确保 this、it、they 指向明确。','The course which I attended it was useful.','The course that I attended was useful.'],
 ['比较、条件与语气','描述利弊时加限定条件；书信请求用恰当语气，不堆复杂句。','If the service will improve, more people will use it.','If the service improves, more people will use it.']
];
export const PROMPTS=[
 {id:'t2-remote',kind:'t2',title:'工作方式 · 讨论双方观点',text:'Some people believe employees should be allowed to work from home, while others think working in an office is more effective. Discuss both views and give your own opinion.',hint:'分别解释双方理由，再明确自己的判断；可用工作经验作例子，不编造统计数据。'},
 {id:'t2-skills',kind:'t2',title:'技能学习 · 同意或不同意',text:'Adults should continue to learn new skills throughout their working lives. To what extent do you agree or disagree?',hint:'明确同意程度，用两条充分展开的理由支持观点。'},
 {id:'t2-transport',kind:'t2',title:'公共交通 · 问题与解决',text:'Many towns have become increasingly dependent on private cars. What problems does this cause, and what measures could reduce these problems?',hint:'同时回答问题和措施；每个措施要对应前文的问题。'},
 {id:'t2-online',kind:'t2',title:'线上交流 · 利弊判断',text:'People increasingly communicate online rather than face to face. Do the advantages of this development outweigh the disadvantages?',hint:'必须作出利弊权衡，不只罗列优点与缺点。'},
 {id:'gt-complaint',kind:'gt',title:'正式信 · 服务投诉',text:'You recently attended a training course, but it did not meet your expectations. Write a letter to the course manager. Explain why you chose the course, describe the problems you experienced, and say what you would like the manager to do.',hint:'三个要点都展开；客观描述问题并提出具体补救要求，避免攻击性语气。'},
 {id:'gt-request',kind:'gt',title:'半正式信 · 工作请求',text:'You would like to attend a professional training course during working hours. Write a letter to your manager. Describe the course, explain how it could help your work, and suggest arrangements for your absence.',hint:'面向熟悉的经理，礼貌、具体；说明对工作有何帮助及如何安排交接。'},
 {id:'gt-friend',kind:'gt',title:'非正式信 · 邀请朋友',text:'A friend is planning to visit your town. Write a letter to your friend. Suggest a good time to visit, describe some activities you could do together, and explain where your friend could stay.',hint:'语气自然亲切，覆盖时间、活动和住宿；不用生硬的商务套话。'},
 {id:'ac-table',kind:'academic',title:'Academic 示例 · 数据概述',text:'The table shows the percentage of employees using three commuting methods in a fictional city in 2010 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',table:[['方式','2010','2025'],['Car','60%','40%'],['Public transport','25%','40%'],['Cycling','15%','20%']],hint:'原创练习数据：先写总体变化，再比较细节，不解释材料未提供的原因。'}
];
export const SPEAKING=[
 {id:'skill',title:'Describe a useful skill you learned.',points:['What the skill was','When and how you learned it','How you use it now','Explain why it is useful'],follow:['Why do some adults stop learning new skills?','Should employers pay for staff training?','How has technology changed the way people learn?']},
 {id:'problem',title:'Describe a time you solved a problem at work.',points:['What the problem was','Who was involved','What you did','Explain what you learned'],follow:['Is teamwork always better than working alone?','How should managers deal with mistakes?','What makes advice useful?']},
 {id:'place',title:'Describe a place you enjoy visiting.',points:['Where it is','When you go there','What you do there','Explain why you enjoy it'],follow:['Why do people need public spaces?','How can towns become better places to live?','Should cities prioritise tourists or residents?']}
];
export const ERROR_TYPES={listening:['词不认识','词认识但听不出来','连读/弱读','同义替换未识别','干扰项/改口','拼写/单复数','注意力/跟丢'],writing:['句子边界','时态/一致','冠词/可数性','搭配/介词','论证未展开','未回应全部题意','语气不合适'],speaking:['停顿/重复','时态/句法','细节不足','话题偏离','重音/发音','无法改述'],reading:['定位错误','同义替换','False/Not Given','逻辑范围/量词','生词','超时','拼写/格式']};
export const RUBRICS={writing:['回应题目所有部分；立场或写信目的清楚','段落有中心，原因和例子支持观点','用词与搭配准确，语气适合收信人或任务','检查主谓、时态、冠词和句子边界'],speaking:['回答紧扣问题，有原因和具体例子','卡词时能换一种说法，不靠整段背诵','简单句与复合句自然结合，修正反复出现的错误','重音、断句和发音让听者容易理解']};
