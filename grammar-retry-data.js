// Original, reviewed practice variants. Existing question IDs remain stable.
export const GRAMMAR_RETRY = {
  "g1": [
    {
      "id": "q1-r1-1",
      "prompt": "选出有完整主语和谓语的句子。",
      "options": [
        "The train is late.",
        "The train very late.",
        "Because the train is late."
      ],
      "answer": 0,
      "explanation": "The train 是主语，is 是谓语；形容词或孤立的 because 从句不能替代完整主句。"
    },
    {
      "id": "q1-r1-2",
      "prompt": "在 The chef prepares dinner. 中，哪个词是谓语动词？",
      "options": [
        "chef",
        "prepares",
        "dinner"
      ],
      "answer": 1,
      "explanation": "prepares 表示主语 chef 所做的动作；dinner 是宾语。"
    },
    {
      "id": "q1-r1-3",
      "prompt": "在 Our neighbours grow vegetables. 中，主语是什么？",
      "options": [
        "vegetables",
        "grow",
        "Our neighbours"
      ],
      "answer": 2,
      "explanation": "Our neighbours 说明谁种菜，是主语；grow 是谓语，vegetables 是宾语。"
    },
    {
      "id": "q1-r2-1",
      "prompt": "表示“这间办公室很安静”，哪一句结构完整？",
      "options": [
        "This office quiet.",
        "This office is quiet.",
        "Because this office is quiet."
      ],
      "answer": 1,
      "explanation": "描述状态时需要 be 动词：主语 This office＋is＋quiet。"
    },
    {
      "id": "q1-r2-2",
      "prompt": "在 The students carry heavy bags. 中，宾语是什么？",
      "options": [
        "The students",
        "carry",
        "heavy bags"
      ],
      "answer": 2,
      "explanation": "问“学生搬什么”，答案是 heavy bags，因此它是宾语。"
    },
    {
      "id": "q1-r2-3",
      "prompt": "选出完整的普通陈述句。",
      "options": [
        "My phone is broken.",
        "My phone broken.",
        "Because my phone is broken."
      ],
      "answer": 0,
      "explanation": "is 构成谓语；broken 单独放在主语后缺少限定谓语。"
    }
  ],
  "g2": [
    {
      "id": "q2-r1-1",
      "prompt": "The nurse checked the label ___.（仔细地）",
      "options": [
        "care",
        "careful",
        "carefully"
      ],
      "answer": 2,
      "explanation": "修饰动作 checked 用副词 carefully，而不是形容词 careful 或名词 care。"
    },
    {
      "id": "q2-r1-2",
      "prompt": "在 They book tickets online. 中，book 是什么词性？",
      "options": [
        "名词",
        "动词",
        "形容词"
      ],
      "answer": 1,
      "explanation": "book 在这里表示“预订”，作谓语动词，不是名词“书”。"
    },
    {
      "id": "q2-r1-3",
      "prompt": "We need a ___ answer.（迅速的）",
      "options": [
        "quickly",
        "quick",
        "speed"
      ],
      "answer": 1,
      "explanation": "空格修饰名词 answer，用形容词 quick。"
    },
    {
      "id": "q2-r2-1",
      "prompt": "在 This is a clean kitchen. 中，clean 是什么词性？",
      "options": [
        "形容词",
        "名词",
        "副词"
      ],
      "answer": 0,
      "explanation": "clean 修饰 kitchen，描述厨房的特征，是形容词。"
    },
    {
      "id": "q2-r2-2",
      "prompt": "The guide explained the route ___.（耐心地）",
      "options": [
        "patient",
        "patience",
        "patiently"
      ],
      "answer": 2,
      "explanation": "修饰 explained 的方式用副词 patiently。"
    },
    {
      "id": "q2-r2-3",
      "prompt": "在 I drink water after exercise. 中，drink 是什么词性？",
      "options": [
        "名词",
        "动词",
        "副词"
      ],
      "answer": 1,
      "explanation": "drink 表示“喝”的动作，在本句中作谓语动词。"
    }
  ],
  "g3": [
    {
      "id": "q3-r1-1",
      "prompt": "She is ___ honest person.",
      "options": [
        "a",
        "an",
        "some"
      ],
      "answer": 1,
      "explanation": "honest 的 h 不发音，起始为元音音素，单数可数名词前用 an。"
    },
    {
      "id": "q3-r1-2",
      "prompt": "We need ___ information about the course.",
      "options": [
        "an",
        "a",
        "some"
      ],
      "answer": 2,
      "explanation": "information 在此不可数，不能直接用 a 或 an。"
    },
    {
      "id": "q3-r1-3",
      "prompt": "I saw a dog outside. ___ dog was wearing a red collar.",
      "options": [
        "The",
        "An",
        "Some"
      ],
      "answer": 0,
      "explanation": "第二句特指刚提到的那只狗，用 The。"
    },
    {
      "id": "q3-r2-1",
      "prompt": "He studies at ___ university in London.",
      "options": [
        "an",
        "a",
        "some"
      ],
      "answer": 1,
      "explanation": "university 以辅音音素 /j/ 开头，因此用 a。"
    },
    {
      "id": "q3-r2-2",
      "prompt": "请选择正确表达“一件行李”的词组。",
      "options": [
        "a luggage",
        "one luggage",
        "a piece of luggage"
      ],
      "answer": 2,
      "explanation": "luggage 不可数，用 a piece of luggage 表示一件行李。"
    },
    {
      "id": "q3-r2-3",
      "prompt": "She bought ___ umbrella because it was raining.",
      "options": [
        "an",
        "a",
        "many"
      ],
      "answer": 0,
      "explanation": "umbrella 以元音音素开头，是单数可数名词，用 an。"
    }
  ],
  "g4": [
    {
      "id": "q4-r1-1",
      "prompt": "Tom and I ___ classmates.",
      "options": [
        "am",
        "is",
        "are"
      ],
      "answer": 2,
      "explanation": "Tom and I 相当于 we，用 are。"
    },
    {
      "id": "q4-r1-2",
      "prompt": "I know Anna. I often talk to ___.",
      "options": [
        "she",
        "her",
        "hers"
      ],
      "answer": 1,
      "explanation": "介词 to 后用宾格 her。"
    },
    {
      "id": "q4-r1-3",
      "prompt": "把 They are in the kitchen. 改为一般疑问句。",
      "options": [
        "Do they are in the kitchen?",
        "Are they in the kitchen?",
        "They in the kitchen?"
      ],
      "answer": 1,
      "explanation": "be 动词 are 提到主语 they 前，无需 do。"
    },
    {
      "id": "q4-r2-1",
      "prompt": "I ___ ready for the interview.",
      "options": [
        "am",
        "is",
        "are"
      ],
      "answer": 0,
      "explanation": "现在时 be 与主语 I 搭配用 am。"
    },
    {
      "id": "q4-r2-2",
      "prompt": "These are our neighbours. Please help ___.",
      "options": [
        "they",
        "their",
        "them"
      ],
      "answer": 2,
      "explanation": "help 后需要宾格 them，而不是主格 they 或限定词 their。"
    },
    {
      "id": "q4-r2-3",
      "prompt": "This is Maya. ___ desk is near the window.",
      "options": [
        "She",
        "Her",
        "Hers"
      ],
      "answer": 1,
      "explanation": "名词 desk 前用形容词性物主代词 Her。"
    }
  ],
  "g5": [
    {
      "id": "q5-r1-1",
      "prompt": "My father ___ dinner every evening.",
      "options": [
        "cook",
        "cooks",
        "cooking"
      ],
      "answer": 1,
      "explanation": "父亲是第三人称单数，一般现在时肯定句用 cooks。"
    },
    {
      "id": "q5-r1-2",
      "prompt": "The children ___ to school on weekdays.",
      "options": [
        "walks",
        "walking",
        "walk"
      ],
      "answer": 2,
      "explanation": "复数主语 The children 在一般现在时中用动词原形 walk。"
    },
    {
      "id": "q5-r1-3",
      "prompt": "Nina ___ English after work every day.",
      "options": [
        "studies",
        "study",
        "studying"
      ],
      "answer": 0,
      "explanation": "Nina 是第三人称单数；study 的辅音字母＋y 变为 -ies。"
    },
    {
      "id": "q5-r2-1",
      "prompt": "Our teacher ___ a bicycle.",
      "options": [
        "have",
        "has",
        "having"
      ],
      "answer": 1,
      "explanation": "单数主语 Our teacher 与 has 搭配。"
    },
    {
      "id": "q5-r2-2",
      "prompt": "We ___ the kitchen every Saturday.",
      "options": [
        "cleans",
        "cleaning",
        "clean"
      ],
      "answer": 2,
      "explanation": "主语 We 用一般现在时原形 clean。"
    },
    {
      "id": "q5-r2-3",
      "prompt": "My uncle ___ the news every morning.",
      "options": [
        "watches",
        "watch",
        "watching"
      ],
      "answer": 0,
      "explanation": "第三人称单数 watch 在肯定句中变 watches。"
    }
  ],
  "g6": [
    {
      "id": "q6-r1-1",
      "prompt": "___ your parents work nearby?",
      "options": [
        "Does",
        "Do",
        "Are"
      ],
      "answer": 1,
      "explanation": "work 是实义动词，复数主语 your parents 用助动词 Do。"
    },
    {
      "id": "q6-r1-2",
      "prompt": "The shop does not ___ on Sundays.",
      "options": [
        "opens",
        "opening",
        "open"
      ],
      "answer": 2,
      "explanation": "does not 后的动词用原形 open。"
    },
    {
      "id": "q6-r1-3",
      "prompt": "选择正确的一般现在时否定句。",
      "options": [
        "He does not drive.",
        "He does not drives.",
        "He not drive."
      ],
      "answer": 0,
      "explanation": "does not 承担时态和人称变化，后接原形 drive。"
    },
    {
      "id": "q6-r2-1",
      "prompt": "___ Lucy need a new laptop?",
      "options": [
        "Is",
        "Does",
        "Do"
      ],
      "answer": 1,
      "explanation": "Lucy 是第三人称单数，need 的一般现在时疑问用 Does。"
    },
    {
      "id": "q6-r2-2",
      "prompt": "We do not ___ meat.",
      "options": [
        "eats",
        "eating",
        "eat"
      ],
      "answer": 2,
      "explanation": "do not 后接原形 eat。"
    },
    {
      "id": "q6-r2-3",
      "prompt": "选出正确问句。",
      "options": [
        "What does your sister teach?",
        "What does your sister teaches?",
        "What your sister teach?"
      ],
      "answer": 0,
      "explanation": "疑问词＋does＋主语＋动词原形 teach。"
    }
  ],
  "g7": [
    {
      "id": "q7-r1-1",
      "prompt": "Listen! Someone ___ at the door.",
      "options": [
        "is knocking",
        "knock",
        "are knocking"
      ],
      "answer": 0,
      "explanation": "Someone 为单数；正在敲门用 is knocking。"
    },
    {
      "id": "q7-r1-2",
      "prompt": "Right now, I ___ a report.",
      "options": [
        "am write",
        "am writing",
        "is writing"
      ],
      "answer": 1,
      "explanation": "现在进行时为 am/is/are＋-ing，I 配 am。"
    },
    {
      "id": "q7-r1-3",
      "prompt": "Look! The birds ___ over the lake.",
      "options": [
        "is flying",
        "flies",
        "are flying"
      ],
      "answer": 2,
      "explanation": "复数 birds 配 are，进行时用 flying。"
    },
    {
      "id": "q7-r2-1",
      "prompt": "Please wait. Sarah ___ her shoes now.",
      "options": [
        "puts on",
        "is putting on",
        "are putting on"
      ],
      "answer": 1,
      "explanation": "此刻正在穿鞋，用 is putting on；Sarah 配 is。"
    },
    {
      "id": "q7-r2-2",
      "prompt": "选出正确的现在进行时句子。",
      "options": [
        "We waiting outside.",
        "We is waiting outside.",
        "We are waiting outside."
      ],
      "answer": 2,
      "explanation": "We 的进行时需要 are＋waiting。"
    },
    {
      "id": "q7-r2-3",
      "prompt": "Ben usually ___ to work, but today he is walking.",
      "options": [
        "drives",
        "driving",
        "is drive"
      ],
      "answer": 0,
      "explanation": "usually 描述习惯，单数 Ben 的一般现在时用 drives。"
    }
  ],
  "g8": [
    {
      "id": "q8-r1-1",
      "prompt": "I ___ a new coat last weekend.",
      "options": [
        "buy",
        "bought",
        "buying"
      ],
      "answer": 1,
      "explanation": "last weekend 指已结束的过去时间；buy 的过去式为 bought。"
    },
    {
      "id": "q8-r1-2",
      "prompt": "We did not ___ the bus yesterday.",
      "options": [
        "caught",
        "catching",
        "catch"
      ],
      "answer": 2,
      "explanation": "did not 已表示过去时，后接原形 catch。"
    },
    {
      "id": "q8-r1-3",
      "prompt": "___ you tired after the trip last night?",
      "options": [
        "Were",
        "Was",
        "Are"
      ],
      "answer": 0,
      "explanation": "last night 用过去时，you 配 were；be 问句直接提前。"
    },
    {
      "id": "q8-r2-1",
      "prompt": "She ___ to the bank yesterday morning.",
      "options": [
        "goes",
        "went",
        "going"
      ],
      "answer": 1,
      "explanation": "go 的过去式为 went，与 yesterday morning 对应。"
    },
    {
      "id": "q8-r2-2",
      "prompt": "Did they ___ the bill last night?",
      "options": [
        "paid",
        "paying",
        "pay"
      ],
      "answer": 2,
      "explanation": "did 后使用动词原形 pay。"
    },
    {
      "id": "q8-r2-3",
      "prompt": "The weather ___ cold yesterday.",
      "options": [
        "was",
        "were",
        "is"
      ],
      "answer": 0,
      "explanation": "weather 为单数不可数名词，过去状态用 was。"
    }
  ],
  "g9": [
    {
      "id": "q9-r1-1",
      "prompt": "I promise I will ___ the documents tonight.",
      "options": [
        "sends",
        "send",
        "sent"
      ],
      "answer": 1,
      "explanation": "will 后接原形 send，不随主语变形。"
    },
    {
      "id": "q9-r1-2",
      "prompt": "She ___ going to start a new course next month.",
      "options": [
        "are",
        "will",
        "is"
      ],
      "answer": 2,
      "explanation": "be going to 结构中主语 She 配 is。"
    },
    {
      "id": "q9-r1-3",
      "prompt": "We will eat when Dad ___ home this evening.",
      "options": [
        "gets",
        "will get",
        "got"
      ],
      "answer": 0,
      "explanation": "when 引导将来的时间从句，用一般现在时 gets。"
    },
    {
      "id": "q9-r2-1",
      "prompt": "They are going to ___ a flat next year.",
      "options": [
        "renting",
        "rent",
        "rented"
      ],
      "answer": 1,
      "explanation": "be going to 后接动词原形 rent。"
    },
    {
      "id": "q9-r2-2",
      "prompt": "选出结构正确的否定承诺。",
      "options": [
        "I will not forgetting.",
        "I will not forgot.",
        "I will not forget."
      ],
      "answer": 2,
      "explanation": "will not 后接动词原形 forget。"
    },
    {
      "id": "q9-r2-3",
      "prompt": "I will send the address before you ___ tomorrow.",
      "options": [
        "leave",
        "will leave",
        "left"
      ],
      "answer": 0,
      "explanation": "before 引导将来时间状语从句，使用一般现在时 leave。"
    }
  ],
  "g10": [
    {
      "id": "q10-r1-1",
      "prompt": "We have ___ the tickets already.",
      "options": [
        "buy",
        "bought",
        "buying"
      ],
      "answer": 1,
      "explanation": "have 后用过去分词，buy 的过去分词为 bought。"
    },
    {
      "id": "q10-r1-2",
      "prompt": "She has worked here ___ five years and still works here.",
      "options": [
        "since",
        "during",
        "for"
      ],
      "answer": 2,
      "explanation": "five years 表时长，完成时中用 for；since 后接起点。"
    },
    {
      "id": "q10-r1-3",
      "prompt": "He ___ his keys, so he cannot get into his flat now.",
      "options": [
        "has lost",
        "has lose",
        "have lost"
      ],
      "answer": 0,
      "explanation": "现在完成时 has＋过去分词 lost 表示对现在的影响。"
    },
    {
      "id": "q10-r2-1",
      "prompt": "They have ___ this restaurant before.",
      "options": [
        "visit",
        "visited",
        "visiting"
      ],
      "answer": 1,
      "explanation": "have 后接过去分词 visited。"
    },
    {
      "id": "q10-r2-2",
      "prompt": "I have known Sam ___ we were children.",
      "options": [
        "for",
        "during",
        "since"
      ],
      "answer": 2,
      "explanation": "since 引出开始认识的时间起点；for 后接时长。"
    },
    {
      "id": "q10-r2-3",
      "prompt": "We ___ the contract last Tuesday.",
      "options": [
        "signed",
        "have signed",
        "sign"
      ],
      "answer": 0,
      "explanation": "last Tuesday 是明确结束的过去时间，用一般过去时 signed。"
    }
  ],
  "g11": [
    {
      "id": "q11-r1-1",
      "prompt": "He can ___ very well.",
      "options": [
        "swims",
        "swim",
        "swimming"
      ],
      "answer": 1,
      "explanation": "情态动词 can 后接原形 swim。"
    },
    {
      "id": "q11-r1-2",
      "prompt": "“禁止在这里吸烟”对应哪一句？",
      "options": [
        "You do not have to smoke here.",
        "You should smoke here.",
        "You must not smoke here."
      ],
      "answer": 2,
      "explanation": "must not 表禁止；do not have to 表不必。"
    },
    {
      "id": "q11-r1-3",
      "prompt": "选出正确的能力问句。",
      "options": [
        "Can you repair this?",
        "Do you can repair this?",
        "Can you repairs this?"
      ],
      "answer": 0,
      "explanation": "can 提到主语前，其后仍用原形 repair，不加 do。"
    },
    {
      "id": "q11-r2-1",
      "prompt": "You should ___ a doctor about that pain.",
      "options": [
        "seeing",
        "see",
        "saw"
      ],
      "answer": 1,
      "explanation": "should 后接动词原形 see，表达建议。"
    },
    {
      "id": "q11-r2-2",
      "prompt": "“你不必穿制服”对应哪一句？",
      "options": [
        "You must not wear a uniform.",
        "You cannot wear a uniform.",
        "You do not have to wear a uniform."
      ],
      "answer": 2,
      "explanation": "没有穿制服的必要用 do not have to，不表示禁止。"
    },
    {
      "id": "q11-r2-3",
      "prompt": "Visitors must ___ their phones off.",
      "options": [
        "turn",
        "turns",
        "turned"
      ],
      "answer": 0,
      "explanation": "must 后接动词原形 turn。"
    }
  ],
  "g12": [
    {
      "id": "q12-r1-1",
      "prompt": "This suitcase is ___ than mine.",
      "options": [
        "heavy",
        "heavier",
        "more heavier"
      ],
      "answer": 1,
      "explanation": "heavy 的比较级为 heavier，不再加 more。"
    },
    {
      "id": "q12-r1-2",
      "prompt": "The driver stopped ___.（安全地）",
      "options": [
        "safe",
        "safety",
        "safely"
      ],
      "answer": 2,
      "explanation": "修饰 stopped 的方式用副词 safely。"
    },
    {
      "id": "q12-r1-3",
      "prompt": "This route is ___ than the old one.（更好）",
      "options": [
        "better",
        "gooder",
        "best"
      ],
      "answer": 0,
      "explanation": "good 的比较级是 better；best 是最高级。"
    },
    {
      "id": "q12-r2-1",
      "prompt": "The new printer is ___ expensive than the old one.",
      "options": [
        "most",
        "more",
        "much"
      ],
      "answer": 1,
      "explanation": "与 than 搭配作比较，使用 more expensive。"
    },
    {
      "id": "q12-r2-2",
      "prompt": "She is a ___ speaker.（自信的）",
      "options": [
        "confidently",
        "confidence",
        "confident"
      ],
      "answer": 2,
      "explanation": "空格修饰名词 speaker，用形容词 confident。"
    },
    {
      "id": "q12-r2-3",
      "prompt": "Of all the buildings on this street, this one is the ___.",
      "options": [
        "tallest",
        "taller",
        "tall"
      ],
      "answer": 0,
      "explanation": "of all 表示整个范围内最高程度，用最高级 tallest。"
    }
  ],
  "g13": [
    {
      "id": "q13-r1-1",
      "prompt": "The interview is ___ Friday.",
      "options": [
        "in",
        "on",
        "at"
      ],
      "answer": 1,
      "explanation": "具体某一天前用 on。"
    },
    {
      "id": "q13-r1-2",
      "prompt": "He enjoys ___ in the sea.",
      "options": [
        "swim",
        "to swim",
        "swimming"
      ],
      "answer": 2,
      "explanation": "enjoy 后接动名词 swimming。"
    },
    {
      "id": "q13-r1-3",
      "prompt": "Please wash your hands before ___.",
      "options": [
        "eating",
        "eat",
        "to eat"
      ],
      "answer": 0,
      "explanation": "before 在这里是介词，后接动作时用 -ing。"
    },
    {
      "id": "q13-r2-1",
      "prompt": "We plan ___ a small business.",
      "options": [
        "starting",
        "to start",
        "start"
      ],
      "answer": 1,
      "explanation": "plan 的常见搭配为 plan to do。"
    },
    {
      "id": "q13-r2-2",
      "prompt": "Her birthday is ___ September.",
      "options": [
        "at",
        "on",
        "in"
      ],
      "answer": 2,
      "explanation": "月份前用 in，不使用 on 或 at。"
    },
    {
      "id": "q13-r2-3",
      "prompt": "Thank you for ___ me.",
      "options": [
        "helping",
        "help",
        "to help"
      ],
      "answer": 0,
      "explanation": "介词 for 后接动名词 helping。"
    }
  ],
  "g14": [
    {
      "id": "q14-r1-1",
      "prompt": "The bridge ___ built in 1998.",
      "options": [
        "is",
        "was",
        "were"
      ],
      "answer": 1,
      "explanation": "过去时间 1998，单数 bridge 的被动用 was built。"
    },
    {
      "id": "q14-r1-2",
      "prompt": "These forms are ___ by the receptionist every morning.",
      "options": [
        "check",
        "checking",
        "checked"
      ],
      "answer": 2,
      "explanation": "被动结构为 be＋过去分词 checked。"
    },
    {
      "id": "q14-r1-3",
      "prompt": "选出表达“这些照片昨天被拍摄”的句子。",
      "options": [
        "These photos were taken yesterday.",
        "These photos was taken yesterday.",
        "These photos took yesterday."
      ],
      "answer": 0,
      "explanation": "复数主语配 were；take 的过去分词为 taken。"
    },
    {
      "id": "q14-r2-1",
      "prompt": "English ___ spoken in many countries.",
      "options": [
        "are",
        "is",
        "has"
      ],
      "answer": 1,
      "explanation": "English 作语言名称为单数，被动用 is spoken。"
    },
    {
      "id": "q14-r2-2",
      "prompt": "The parcel was ___ to the wrong address.",
      "options": [
        "deliver",
        "delivering",
        "delivered"
      ],
      "answer": 2,
      "explanation": "was 后需过去分词 delivered 构成被动。"
    },
    {
      "id": "q14-r2-3",
      "prompt": "把 They repaired the road last week. 改为被动。",
      "options": [
        "The road was repaired last week.",
        "The road is repairing last week.",
        "The road repaired by them last week."
      ],
      "answer": 0,
      "explanation": "过去时被动为 was repaired，保留过去时间。"
    }
  ],
  "g15": [
    {
      "id": "q15-r1-1",
      "prompt": "表达“尽管很累，她还是完成了工作”，选出正确句子。",
      "options": [
        "Although she was tired, but she finished the work.",
        "Although she was tired, she finished the work.",
        "Because she was tired, so she finished the work."
      ],
      "answer": 1,
      "explanation": "although 引导让步从句，不与 but 重复连接同一主句。"
    },
    {
      "id": "q15-r1-2",
      "prompt": "If he ___ early tomorrow, we will have lunch together.",
      "options": [
        "will arrive",
        "arrived",
        "arrives"
      ],
      "answer": 2,
      "explanation": "真实将来条件中 if 从句用一般现在时，单数主语配 arrives。"
    },
    {
      "id": "q15-r1-3",
      "prompt": "表达“因为道路封闭，我们走了另一条路”，选出规范句子。",
      "options": [
        "Because the road was closed, we took another route.",
        "Because the road was closed, so we took another route.",
        "Because the road was closed."
      ],
      "answer": 0,
      "explanation": "because 从句后需要主句，但不重复加 so。"
    },
    {
      "id": "q15-r2-1",
      "prompt": "If you ___ help later, I will be available.",
      "options": [
        "will need",
        "need",
        "needed"
      ],
      "answer": 1,
      "explanation": "表达真实将来条件，if 从句用一般现在时 need。"
    },
    {
      "id": "q15-r2-2",
      "prompt": "用让步关系连接“下雨了”和“比赛仍继续”，选出正确句子。",
      "options": [
        "Although it rained, but the match continued.",
        "Because it rained, so the match continued.",
        "Although it rained, the match continued."
      ],
      "answer": 2,
      "explanation": "although 表让步，后面直接接主句，不再加 but。"
    },
    {
      "id": "q15-r2-3",
      "prompt": "选出没有逗号拼接错误的书面表达。",
      "options": [
        "The bus was late, so I took a taxi.",
        "The bus was late, I took a taxi.",
        "Because the bus was late, so I took a taxi."
      ],
      "answer": 0,
      "explanation": "两个独立分句可用 so 正确连接；不能仅用逗号拼接或重复 because…so…。"
    }
  ],
  "g16": [
    {
      "id": "q16-r1-1",
      "prompt": "The nurse ___ lives next door is very friendly.",
      "options": [
        "which",
        "who",
        "where"
      ],
      "answer": 1,
      "explanation": "nurse 指人，关系词在从句中作主语，用 who。"
    },
    {
      "id": "q16-r1-2",
      "prompt": "选出正确的定语从句表达。",
      "options": [
        "The film that we watched it was exciting.",
        "The film that we watched exciting.",
        "The film that we watched was exciting."
      ],
      "answer": 2,
      "explanation": "that 已充当 watched 的宾语，无需 it；主句还需要 was。"
    },
    {
      "id": "q16-r1-3",
      "prompt": "在 The laptop that I use is old. 中，主句骨架是什么？",
      "options": [
        "The laptop is old.",
        "that I use",
        "The laptop that I use"
      ],
      "answer": 0,
      "explanation": "that I use 修饰 laptop，去掉从句后主句为 The laptop is old。"
    },
    {
      "id": "q16-r2-1",
      "prompt": "The machine ___ makes coffee is broken.",
      "options": [
        "who",
        "which",
        "where"
      ],
      "answer": 1,
      "explanation": "machine 指物，关系词在从句中作主语，用 which。"
    },
    {
      "id": "q16-r2-2",
      "prompt": "选出完整且没有重复宾语的句子。",
      "options": [
        "The letter that she wrote it is on the desk.",
        "The letter that she wrote on the desk.",
        "The letter that she wrote is on the desk."
      ],
      "answer": 2,
      "explanation": "that 代表 wrote 的宾语；主句用 is on the desk 作谓语。"
    },
    {
      "id": "q16-r2-3",
      "prompt": "在 The man who repaired our roof is a neighbour. 中，主句谓语是什么？",
      "options": [
        "is",
        "repaired",
        "who"
      ],
      "answer": 0,
      "explanation": "repaired 是定语从句内的谓语，主句谓语是 is。"
    }
  ]
};
