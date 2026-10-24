export const GRAMMAR_UNITS = [
  {
    "id": "u1",
    "title": "句子从哪里开始",
    "description": "建立句子、词性和名词的基础。"
  },
  {
    "id": "u2",
    "title": "把日常与过去说清楚",
    "description": "理解时态，掌握否定与疑问。"
  },
  {
    "id": "u3",
    "title": "连接时间与表达态度",
    "description": "学习将来、完成、建议和比较。"
  },
  {
    "id": "u4",
    "title": "从句子走向写作",
    "description": "掌握搭配、被动和复合句，迁移到书信与议论文。"
  }
];
export const GRAMMAR_LESSONS = [
  {
    "id": "g1",
    "unit": 0,
    "title": "句子骨架：谁，做什么",
    "goal": "先找到主语和谓语，不急着背术语。",
    "minutes": 12,
    "rule": "主语告诉我们“谁或什么”，谓语说明“做什么或处于什么状态”。英语完整陈述句通常需要主语和带时态的谓语；祈使句可以省略 you。中文能说“我很忙”，英语却需要 I am busy. 中的 am。",
    "examples": [
      {
        "en": "I work.",
        "zh": "我工作。",
        "note": "I 是主语；work 是谓语。"
      },
      {
        "en": "She likes music.",
        "zh": "她喜欢音乐。",
        "note": "She 是主语；likes 是谓语；music 是动作的对象（宾语）。"
      }
    ],
    "extend": "常见骨架有：主语＋动词；主语＋动词＋宾语；主语＋be＋描述。先写出骨架，再添加时间、地点等细节。",
    "mistake": "I busy. → I am busy.｜形容词 busy 不能独自充当这里的谓语。",
    "practice": [
      {
        "id": "q1-1",
        "prompt": "选出一个完整的普通陈述句。",
        "options": [
          "My colleague very kind.",
          "My colleague is very kind.",
          "Because my colleague is kind."
        ],
        "answer": 1,
        "explanation": "需要谓语 is；because 引导的原因从句单独放在这里还没有主句。"
      },
      {
        "id": "q1-2",
        "prompt": "在 She reads emails. 中，哪个是宾语？",
        "options": [
          "She",
          "reads",
          "emails"
        ],
        "answer": 2,
        "explanation": "emails 是 reads 的对象：她读什么？邮件。"
      }
    ],
    "exam": {
      "id": "q1-3",
      "prompt": "请选择完整句子：The children ___ happy today.",
      "options": [
        "are",
        "very",
        "happiness"
      ],
      "answer": 0,
      "explanation": "主语 The children 后需要谓语 are；happy 描述状态。"
    }
  },
  {
    "id": "g2",
    "unit": 0,
    "title": "词性：一个词在句子里做什么",
    "goal": "认识名词、动词、形容词和副词。",
    "minutes": 12,
    "rule": "名词通常命名人或事物，如 teacher、book；动词表达动作或状态，如 read、be；形容词描述名词，如 a useful book；副词常修饰动作或形容词，如 speak clearly、very useful。词性要结合语境判断，不能只看拼写。",
    "examples": [
      {
        "en": "This is a clear message.",
        "zh": "这是一条清楚的信息。",
        "note": "clear 修饰名词 message，是形容词。"
      },
      {
        "en": "She explains it clearly.",
        "zh": "她解释得很清楚。",
        "note": "clearly 修饰 explains，是副词。"
      }
    ],
    "extend": "同一个词可以有不同词性：I work here. 中 work 是动词；My work is interesting. 中 work 是名词。并不是所有副词都以 -ly 结尾：fast 可直接作副词。",
    "mistake": "She speaks clear. → She speaks clearly.｜这里要描述“说得怎么样”，用 clearly。",
    "practice": [
      {
        "id": "q2-1",
        "prompt": "Please speak ___ so everyone can understand.",
        "options": [
          "clear",
          "clearly",
          "clarity"
        ],
        "answer": 1,
        "explanation": "clearly 修饰动作 speak，说明说话的方式。"
      },
      {
        "id": "q2-2",
        "prompt": "在 My work is difficult. 中，work 是什么词性？",
        "options": [
          "动词",
          "形容词",
          "名词"
        ],
        "answer": 2,
        "explanation": "My work 是主语，表示“我的工作”，这里 work 是名词。"
      }
    ],
    "exam": {
      "id": "q2-3",
      "prompt": "It is a ___ explanation.",
      "options": [
        "carefully",
        "careful",
        "care"
      ],
      "answer": 1,
      "explanation": "空格描述名词 explanation，要用形容词 careful。"
    }
  },
  {
    "id": "g3",
    "unit": 0,
    "title": "名词与冠词：a、an、the",
    "goal": "区分一个、特指和不可数。",
    "minutes": 12,
    "rule": "可数名词表示能按个数的事物，单数一般需要 a/an、the、my 等限定词。a/an 表示不特指的一个，按后面词的起始读音选择：an hour、a university。the 用于双方能确定的对象。不可数名词如 advice、information，不能直接说 an advice。",
    "examples": [
      {
        "en": "I bought a book. The book is useful.",
        "zh": "我买了一本书。这本书很有用。",
        "note": "首次引入用 a，再次提到明确的同一本用 the。"
      },
      {
        "en": "I need some advice.",
        "zh": "我需要一些建议。",
        "note": "advice 不直接加 -s；一条建议是 a piece of advice。"
      }
    ],
    "extend": "复数泛指可不用冠词：Books are useful. 特指某些书用 the books。不要把“不可数”等同于现实中完全不能计量，英语常用 a glass of water 等单位来计量。",
    "mistake": "an information → some information｜information 在这种用法中不可数。",
    "practice": [
      {
        "id": "q3-1",
        "prompt": "She gave me ___ useful advice.",
        "options": [
          "an",
          "some",
          "a"
        ],
        "answer": 1,
        "explanation": "advice 不可数，用 some；若说一条可用 a piece of advice。"
      },
      {
        "id": "q3-2",
        "prompt": "I bought a bag yesterday. ___ bag is blue.",
        "options": [
          "A",
          "An",
          "The"
        ],
        "answer": 2,
        "explanation": "第二句指刚提到的那一个包，用 The。"
      }
    ],
    "exam": {
      "id": "q3-3",
      "prompt": "It took me ___ hour to finish.",
      "options": [
        "a",
        "an",
        "some"
      ],
      "answer": 1,
      "explanation": "hour 的 h 不发音，起始是元音音素，单数前用 an。"
    }
  },
  {
    "id": "g4",
    "unit": 0,
    "title": "代词与 be：I am、she is、they are",
    "goal": "用代词替代名词，并让 be 与主语匹配。",
    "minutes": 12,
    "rule": "主语位置常用 I、you、he、she、it、we、they；宾语位置常用 me、you、him、her、it、us、them。现在时 be：I am，he/she/it is，you/we/they are。my/your/her/their 等放在名词前表示所属。",
    "examples": [
      {
        "en": "She is my manager.",
        "zh": "她是我的经理。",
        "note": "She 是主语，单数配 is；my 修饰 manager。"
      },
      {
        "en": "Please help me.",
        "zh": "请帮帮我。",
        "note": "help 后的宾语用 me，不用 I。"
      }
    ],
    "extend": "be 的否定是在后面加 not：They are not ready. 疑问句把 be 提到主语前：Are they ready? 不需要再加 do。",
    "mistake": "They is busy. → They are busy.｜they 配 are。",
    "practice": [
      {
        "id": "q4-1",
        "prompt": "My friends ___ ready.",
        "options": [
          "am",
          "is",
          "are"
        ],
        "answer": 2,
        "explanation": "My friends 为复数，相当于 they，配 are。"
      },
      {
        "id": "q4-2",
        "prompt": "Please call ___ tomorrow.（请明天给我打电话。）",
        "options": [
          "I",
          "my",
          "me"
        ],
        "answer": 2,
        "explanation": "call 后是宾语，需要 me。"
      }
    ],
    "exam": {
      "id": "q4-3",
      "prompt": "把 She is at home. 改为一般疑问句。",
      "options": [
        "Does she is at home?",
        "Is she at home?",
        "She at home?"
      ],
      "answer": 1,
      "explanation": "句中已有 be，把 is 提到主语 she 前即可。"
    }
  },
  {
    "id": "g5",
    "unit": 1,
    "title": "一般现在时：习惯与事实",
    "goal": "表达经常发生的事，注意第三人称单数。",
    "minutes": 12,
    "rule": "一般现在时常表示习惯或事实。I/you/we/they 用动词原形；he/she/it 或一个人名作主语，肯定句动词通常加 -s/-es：works、watches。辅音字母＋y 常变为 -ies，如 studies；have 变 has。",
    "examples": [
      {
        "en": "I work from home on Fridays.",
        "zh": "我每周五居家办公。",
        "note": "on Fridays 表示规律。"
      },
      {
        "en": "Mina studies English every day.",
        "zh": "米娜每天学英语。",
        "note": "Mina 是第三人称单数，study 变 studies。"
      }
    ],
    "extend": "第三人称单数看主语，不看离动词最近的词。My brother likes books. 的主语是 brother，不能因为 books 是复数就用 like。",
    "mistake": "She work here. → She works here.｜肯定句中主语 she 要求 works。",
    "practice": [
      {
        "id": "q5-1",
        "prompt": "Leo ___ the bus to work every day.",
        "options": [
          "take",
          "takes",
          "taking"
        ],
        "answer": 1,
        "explanation": "Leo 是第三人称单数；日常习惯用 takes。"
      },
      {
        "id": "q5-2",
        "prompt": "They ___ English on Mondays.",
        "options": [
          "studies",
          "study",
          "studying"
        ],
        "answer": 1,
        "explanation": "They 是复数主语，一般现在时用原形 study。"
      }
    ],
    "exam": {
      "id": "q5-3",
      "prompt": "My sister ___ two cats.",
      "options": [
        "have",
        "having",
        "has"
      ],
      "answer": 2,
      "explanation": "My sister 为第三人称单数，have 对应 has。"
    }
  },
  {
    "id": "g6",
    "unit": 1,
    "title": "否定与提问：do 和 does",
    "goal": "让助动词承担变化，后面的动词回到原形。",
    "minutes": 12,
    "rule": "一般现在时的普通实义动词，否定常用 do not / does not＋原形，疑问常用 Do / Does＋主语＋原形。does 用于第三人称单数，后面的动词不再加 -s。be 和情态动词的问句规则不同，不要硬套 do。",
    "examples": [
      {
        "en": "She does not like coffee.",
        "zh": "她不喜欢咖啡。",
        "note": "does 已承担第三人称变化，like 用原形。"
      },
      {
        "en": "Where do you work?",
        "zh": "你在哪里工作？",
        "note": "疑问词 where 放在 do 问句之前。"
      }
    ],
    "extend": "比较：Are you tired?（be 问句）与 Do you work here?（普通动词问句）。简短回答为 Yes, I do. / No, I do not.，不要把 do 当作没有意义就省去。",
    "mistake": "Does she likes tea? → Does she like tea?｜does 后用原形。",
    "practice": [
      {
        "id": "q6-1",
        "prompt": "___ your brother live here?",
        "options": [
          "Do",
          "Does",
          "Is"
        ],
        "answer": 1,
        "explanation": "live 是实义动词，your brother 为单数，用 Does。"
      },
      {
        "id": "q6-2",
        "prompt": "She does not ___ coffee.",
        "options": [
          "drinks",
          "drinking",
          "drink"
        ],
        "answer": 2,
        "explanation": "does not 后用动词原形 drink。"
      }
    ],
    "exam": {
      "id": "q6-3",
      "prompt": "选择正确问句。",
      "options": [
        "Where does he works?",
        "Where he work?",
        "Where does he work?"
      ],
      "answer": 2,
      "explanation": "疑问词＋does＋主语＋动词原形。"
    }
  },
  {
    "id": "g7",
    "unit": 1,
    "title": "现在进行时：正在发生",
    "goal": "用 be＋动词 -ing，不漏掉 be。",
    "minutes": 12,
    "rule": "现在进行时的形式是 am/is/are＋动词 -ing，用于正在发生或当前一段时间内进行的活动。一般现在时更常表示习惯。时间词只是线索，最终要看表达的意思。",
    "examples": [
      {
        "en": "I usually walk to work, but today I am taking the bus.",
        "zh": "我通常步行上班，但今天我正在乘公交车。",
        "note": "usually walk 表习惯；am taking 表今天的临时情况。"
      },
      {
        "en": "They are discussing the plan now.",
        "zh": "他们现在正在讨论计划。",
        "note": "are 与复数主语匹配。"
      }
    ],
    "extend": "写 -ing 时：write → writing，run → running。know、believe 等状态动词在常见基础用法中通常不用进行时：I know the answer.",
    "mistake": "She working now. → She is working now.｜进行时需要 be＋-ing。",
    "practice": [
      {
        "id": "q7-1",
        "prompt": "Please be quiet. The baby ___ now.",
        "options": [
          "sleeps every day",
          "is sleeping",
          "sleep"
        ],
        "answer": 1,
        "explanation": "现在正在睡觉，用 is sleeping。"
      },
      {
        "id": "q7-2",
        "prompt": "Look! They ___ football.",
        "options": [
          "are playing",
          "is playing",
          "plays"
        ],
        "answer": 0,
        "explanation": "They 配 are，正在进行的动作接 playing。"
      }
    ],
    "exam": {
      "id": "q7-3",
      "prompt": "I usually ___ tea, but right now I am drinking water.",
      "options": [
        "drink",
        "am drink",
        "drinking"
      ],
      "answer": 0,
      "explanation": "前半句是习惯，用一般现在时 I drink。"
    }
  },
  {
    "id": "g8",
    "unit": 1,
    "title": "一般过去时：已经结束的事情",
    "goal": "用过去式叙述完成的事件。",
    "minutes": 12,
    "rule": "一般过去时常描述过去已结束的事件。规则动词通常加 -ed；不规则形式需随例句积累，如 go → went、buy → bought。普通动词否定用 did not＋原形，疑问用 Did＋主语＋原形。过去的 be 为 was/were。",
    "examples": [
      {
        "en": "I visited a friend yesterday.",
        "zh": "我昨天拜访了一位朋友。",
        "note": "yesterday 是已经结束的过去时间。"
      },
      {
        "en": "Did you go to the meeting?",
        "zh": "你去参加那次会议了吗？",
        "note": "did 后的 go 不再变 went。"
      }
    ],
    "extend": "I/he/she/it 常配 was，you/we/they 配 were。Were you busy yesterday? 中直接把 were 提前，不加 did。",
    "mistake": "I did not went. → I did not go.｜did 已体现过去时，go 保持原形。",
    "practice": [
      {
        "id": "q8-1",
        "prompt": "We ___ the museum last Sunday.",
        "options": [
          "visit",
          "visited",
          "are visiting"
        ],
        "answer": 1,
        "explanation": "last Sunday 是明确的过去时间，用 visited。"
      },
      {
        "id": "q8-2",
        "prompt": "Did she ___ the email yesterday?",
        "options": [
          "sent",
          "sending",
          "send"
        ],
        "answer": 2,
        "explanation": "did 后用原形 send。"
      }
    ],
    "exam": {
      "id": "q8-3",
      "prompt": "They ___ at home last night.",
      "options": [
        "was",
        "were",
        "are"
      ],
      "answer": 1,
      "explanation": "过去时间 last night；复数 they 配 were。"
    }
  },
  {
    "id": "g9",
    "unit": 2,
    "title": "将来表达：will 与 be going to",
    "goal": "区分当下决定、已有计划与预测。",
    "minutes": 12,
    "rule": "will＋原形常用于当下的决定、承诺和预测；am/is/are going to＋原形常用于已有打算，或基于眼前迹象的预测。这些用法有重叠，不要机械认定所有未来时间只能用 will。",
    "examples": [
      {
        "en": "The phone is ringing. I will answer it.",
        "zh": "电话响了，我来接。",
        "note": "听到电话后当下作决定。"
      },
      {
        "en": "We are going to move next month.",
        "zh": "我们打算下个月搬家。",
        "note": "表达已有计划。"
      }
    ],
    "extend": "两种结构后都接动词原形：will call；is going to call。否定是 will not（won’t）和 be not going to。将来时间状语从句中常用现在时：I will call when I arrive.",
    "mistake": "She will calls you. → She will call you.｜will 后用原形。",
    "practice": [
      {
        "id": "q9-1",
        "prompt": "I promise I will ___ you tomorrow.",
        "options": [
          "help",
          "helps",
          "helped"
        ],
        "answer": 0,
        "explanation": "will 后面接原形 help。"
      },
      {
        "id": "q9-2",
        "prompt": "We ___ going to visit our parents next week.",
        "options": [
          "is",
          "are",
          "will"
        ],
        "answer": 1,
        "explanation": "be going to 结构中 we 对应 are。"
      }
    ],
    "exam": {
      "id": "q9-3",
      "prompt": "I will text you when I ___ home tomorrow.",
      "options": [
        "will get",
        "get",
        "got"
      ],
      "answer": 1,
      "explanation": "when 引导将来时间状语从句时常用一般现在时 get。"
    }
  },
  {
    "id": "g10",
    "unit": 2,
    "title": "现在完成时：过去与现在的联系",
    "goal": "理解 have/has＋过去分词，而不只背时间词。",
    "minutes": 12,
    "rule": "现在完成时由 have/has＋过去分词构成，常表达截至现在的经历、过去动作带来的当前结果，或持续到现在的状态。与明确结束的过去时间 yesterday、last year 搭配时，基础叙事通常用一般过去时。",
    "examples": [
      {
        "en": "I have lost my key, so I cannot open the door.",
        "zh": "我的钥匙丢了，所以现在开不了门。",
        "note": "强调当前结果。"
      },
      {
        "en": "She has lived here for three years and still lives here.",
        "zh": "她在这里住了三年，现在仍住在这里。",
        "note": "for＋时长；since＋起点。"
      }
    ],
    "extend": "过去分词不一定与过去式相同：go—went—gone，see—saw—seen。比较 I saw him yesterday. 与 I have seen him before.；前者说明特定过去时间，后者谈到现在的经历。",
    "mistake": "I have seen him yesterday. → I saw him yesterday.｜yesterday 明确指结束的过去时间。",
    "practice": [
      {
        "id": "q10-1",
        "prompt": "She has ___ this film before.",
        "options": [
          "see",
          "saw",
          "seen"
        ],
        "answer": 2,
        "explanation": "has 后用过去分词 seen。"
      },
      {
        "id": "q10-2",
        "prompt": "He has lived here ___ 2020 and still lives here.",
        "options": [
          "for",
          "since",
          "during"
        ],
        "answer": 1,
        "explanation": "2020 是起点，使用 since；for 后接时长。"
      }
    ],
    "exam": {
      "id": "q10-3",
      "prompt": "I ___ her yesterday afternoon.",
      "options": [
        "have met",
        "meet",
        "met"
      ],
      "answer": 2,
      "explanation": "yesterday afternoon 是结束的过去时间，选一般过去时 met。"
    }
  },
  {
    "id": "g11",
    "unit": 2,
    "title": "情态动词：能力、建议与义务",
    "goal": "掌握 can、should、must 后的原形。",
    "minutes": 12,
    "rule": "can 表能力或许可，should 常给建议，must 常表达强烈义务。它们后接动词原形，不因 he/she/it 加 -s。疑问把情态动词提前，否定在后面加 not。",
    "examples": [
      {
        "en": "She can speak English.",
        "zh": "她会说英语。",
        "note": "can 后 speak 用原形。"
      },
      {
        "en": "You should check your answer.",
        "zh": "你应该检查答案。",
        "note": "should 表建议，强度通常低于 must。"
      }
    ],
    "extend": "must not 表禁止；do not have to 表没有必要。You must not park here. 是不许停车，You do not have to drive. 是不必开车，不等于禁止开车。",
    "mistake": "He can speaks English. → He can speak English.｜情态动词后不用三单形式。",
    "practice": [
      {
        "id": "q11-1",
        "prompt": "You should ___ more carefully.",
        "options": [
          "reads",
          "read",
          "reading"
        ],
        "answer": 1,
        "explanation": "should 后接原形 read。"
      },
      {
        "id": "q11-2",
        "prompt": "“你不必明天来”应选哪一句？",
        "options": [
          "You must not come tomorrow.",
          "You do not have to come tomorrow.",
          "You cannot come tomorrow."
        ],
        "answer": 1,
        "explanation": "do not have to 表不必；must not 表禁止；cannot 表不能。"
      }
    ],
    "exam": {
      "id": "q11-3",
      "prompt": "She can ___ the problem.",
      "options": [
        "solves",
        "solved",
        "solve"
      ],
      "answer": 2,
      "explanation": "can 后接动词原形 solve。"
    }
  },
  {
    "id": "g12",
    "unit": 2,
    "title": "形容词、副词与比较",
    "goal": "把“怎么样”和“比……更……”说清楚。",
    "minutes": 12,
    "rule": "形容词描述名词或位于 be 等系动词后：a careful driver / She is careful。副词描述动作：She drives carefully。比较级常用 -er 或 more：smaller、more useful；用 than 引出比较对象。",
    "examples": [
      {
        "en": "This room is bigger than that one.",
        "zh": "这个房间比那个大。",
        "note": "big → bigger，不再加 more。"
      },
      {
        "en": "This explanation is more useful.",
        "zh": "这个解释更有用。",
        "note": "useful 用 more useful。"
      }
    ],
    "extend": "常见不规则形式：good/well → better，bad/badly → worse。最高级用于一组中的最高程度：the tallest student in the class。不要同时使用 more 和 -er。",
    "mistake": "more easier → easier｜easy 的比较级是 easier。",
    "practice": [
      {
        "id": "q12-1",
        "prompt": "This exercise is ___ than the last one.",
        "options": [
          "more easy",
          "easier",
          "easy"
        ],
        "answer": 1,
        "explanation": "easy 变 easier，再用 than 比较。"
      },
      {
        "id": "q12-2",
        "prompt": "She answered the question ___.",
        "options": [
          "careful",
          "carefully",
          "care"
        ],
        "answer": 1,
        "explanation": "描述 answered 的方式，选副词 carefully。"
      }
    ],
    "exam": {
      "id": "q12-3",
      "prompt": "This book is ___ useful than that one.",
      "options": [
        "more",
        "most",
        "much"
      ],
      "answer": 0,
      "explanation": "两者比较用 more useful than；most 是最高级形式。"
    }
  },
  {
    "id": "g13",
    "unit": 3,
    "title": "介词与非谓语：to do、doing",
    "goal": "先掌握位置关系和常见动词搭配。",
    "minutes": 12,
    "rule": "介词表达时间、地点等关系：at 9 am、on Monday、in October；at the station、on the table、in the room。介词后若接动作，通常用 -ing：after finishing。动词后的形式取决于搭配：want to do、enjoy doing。",
    "examples": [
      {
        "en": "I want to improve my writing.",
        "zh": "我想提高写作能力。",
        "note": "want 后接 to＋原形。"
      },
      {
        "en": "She enjoys reading.",
        "zh": "她喜欢阅读。",
        "note": "enjoy 后接 -ing。"
      }
    ],
    "extend": "to 不一定都是不定式标记：look forward to 中的 to 是介词，所以用 I look forward to hearing from you.。先按完整词块积累，不把所有 to 都套成 to do。",
    "mistake": "I enjoy to read. → I enjoy reading.｜enjoy 后的常用搭配是 doing。",
    "practice": [
      {
        "id": "q13-1",
        "prompt": "The meeting starts ___ 9 am.",
        "options": [
          "in",
          "on",
          "at"
        ],
        "answer": 2,
        "explanation": "具体钟点前常用 at。"
      },
      {
        "id": "q13-2",
        "prompt": "I look forward to ___ from you.",
        "options": [
          "hear",
          "hearing",
          "heard"
        ],
        "answer": 1,
        "explanation": "look forward to 中 to 是介词，后面用 hearing。"
      }
    ],
    "exam": {
      "id": "q13-3",
      "prompt": "They decided ___ early.",
      "options": [
        "leave",
        "leaving",
        "to leave"
      ],
      "answer": 2,
      "explanation": "decide 的常用搭配是 decide to do。"
    }
  },
  {
    "id": "g14",
    "unit": 3,
    "title": "被动语态：把动作承受者放前面",
    "goal": "用 be＋过去分词，保留正确时态。",
    "minutes": 12,
    "rule": "主动句强调谁做：The team finished the report. 被动句把承受动作的对象放到主语位置：The report was finished by the team. 被动结构是 be＋过去分词；时态变化主要体现在 be 上。",
    "examples": [
      {
        "en": "The office is cleaned every day.",
        "zh": "办公室每天被打扫。",
        "note": "一般现在时被动：is cleaned。"
      },
      {
        "en": "The email was sent yesterday.",
        "zh": "邮件昨天发出了。",
        "note": "一般过去时被动：was sent。"
      }
    ],
    "extend": "不知道或不必强调执行者时，可以省略 by。不是所有动词都能直接变被动，例如 happen 没有这种宾语结构，不能说 was happened。进行时与被动不同：is writing 表正在写，is written 表被写。",
    "mistake": "The email sent yesterday. → The email was sent yesterday.｜在这里要表达邮件被发送，需 was＋sent。",
    "practice": [
      {
        "id": "q14-1",
        "prompt": "The windows ___ cleaned every week.",
        "options": [
          "is",
          "are",
          "have"
        ],
        "answer": 1,
        "explanation": "复数 windows；一般现在时被动为 are cleaned。"
      },
      {
        "id": "q14-2",
        "prompt": "The letter was ___ yesterday.",
        "options": [
          "send",
          "sending",
          "sent"
        ],
        "answer": 2,
        "explanation": "被动用 be＋过去分词 sent。"
      }
    ],
    "exam": {
      "id": "q14-3",
      "prompt": "选择正确的一般过去时被动句。",
      "options": [
        "The report was finished yesterday.",
        "The report is finishing yesterday.",
        "The report finished by Leo yesterday."
      ],
      "answer": 0,
      "explanation": "was＋finished 表过去被完成，另两项结构或时态不对。"
    }
  },
  {
    "id": "g15",
    "unit": 3,
    "title": "连接句子：原因、让步与条件",
    "goal": "让每个连接词承担清晰的逻辑关系。",
    "minutes": 12,
    "rule": "because 引出原因，although 引出让步，if 引出条件。它们引导的从句通常要与主句共同构成完整句子。标准书面英语不要把 because…so…、although…but…成对叠加。",
    "examples": [
      {
        "en": "Because it was raining, we stayed indoors.",
        "zh": "因为下雨，我们待在室内。",
        "note": "原因从句＋主句；没有再加 so。"
      },
      {
        "en": "Although the task was difficult, she finished it.",
        "zh": "虽然任务很难，她还是完成了。",
        "note": "让步从句＋主句；不用再加 but。"
      }
    ],
    "extend": "真实的将来条件常用 If＋一般现在时，主句＋will：If I have time, I will help. 两个独立句不能只靠逗号拼接：用句号，或用 and/but 等恰当连接。",
    "mistake": "Although it was late, but we continued. → Although it was late, we continued.｜保留一个让步连接结构。",
    "practice": [
      {
        "id": "q15-1",
        "prompt": "___ it was expensive, I bought it because I needed it.",
        "options": [
          "Although",
          "Because",
          "So"
        ],
        "answer": 0,
        "explanation": "“虽然贵但仍购买”是让步关系，用 Although。"
      },
      {
        "id": "q15-2",
        "prompt": "If it ___ tomorrow, we will stay home.",
        "options": [
          "will rain",
          "rains",
          "rained"
        ],
        "answer": 1,
        "explanation": "真实将来条件中的 if 从句常用一般现在时 rains。"
      }
    ],
    "exam": {
      "id": "q15-3",
      "prompt": "选择规范的书面表达。",
      "options": [
        "Because I was tired, so I left.",
        "Because I was tired, I left.",
        "Although I was tired, but I left."
      ],
      "answer": 1,
      "explanation": "because 从句连接主句，不再重复使用 so。"
    }
  },
  {
    "id": "g16",
    "unit": 3,
    "title": "定语从句与书面表达自查",
    "goal": "用从句说明“哪一个”，再检查整句结构。",
    "minutes": 12,
    "rule": "定语从句跟在名词后补充说明。基础限定性从句中，who 常指人，which 常指物，that 可指人或物：The person who called is my manager. 先找主句，再看从句，避免丢掉主句谓语。",
    "examples": [
      {
        "en": "The book that you recommended is useful.",
        "zh": "你推荐的那本书很有用。",
        "note": "主句骨架：The book is useful；that you recommended 限定是哪本书。"
      },
      {
        "en": "The woman who works here is my neighbour.",
        "zh": "在这里工作的那位女士是我的邻居。",
        "note": "who 在从句中当主语，指 woman。"
      }
    ],
    "extend": "关系词已充当从句宾语时，不再重复 it：the book that I bought，而非 that I bought it。写作自查顺序：每句主谓是否齐全 → 时间与一致 → 名词限定 → 动词搭配 → 连接逻辑。",
    "mistake": "The book that I bought it is useful. → The book that I bought is useful.｜that 已代表 bought 的宾语，不再加 it。",
    "practice": [
      {
        "id": "q16-1",
        "prompt": "The person ___ helped me was very kind.",
        "options": [
          "which",
          "who",
          "where"
        ],
        "answer": 1,
        "explanation": "person 指人，关系词在从句中作主语，用 who。"
      },
      {
        "id": "q16-2",
        "prompt": "选择正确句子。",
        "options": [
          "The book that I bought it is useful.",
          "The book that I bought is useful.",
          "The book that I bought useful."
        ],
        "answer": 1,
        "explanation": "第二句既无重复宾语 it，也保留主句谓语 is。"
      }
    ],
    "exam": {
      "id": "q16-3",
      "prompt": "在 The woman who called is my teacher. 中，主句骨架是什么？",
      "options": [
        "The woman is my teacher.",
        "who called is",
        "The woman who called"
      ],
      "answer": 0,
      "explanation": "who called 修饰 woman；去掉从句，主句仍是 The woman is my teacher。"
    }
  }
];
