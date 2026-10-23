import {wordMap} from './data.js';
const story={
 light:['Morning light came through Maya’s window.','晨光透过玛雅的窗户照了进来。'],
 bright:['The sky was bright and clear.','天空明亮而晴朗。'],
 sound:['The sound of birds came from the garden.','花园里传来鸟叫声。'],
 book:['Maya opened a book about the world around her.','玛雅打开了一本介绍周围世界的书。'],
 read:['She decided to read one page before breakfast.','她决定在早餐前读一页。'],
 learn:['There was always something new to learn.','总有新的东西可以学习。'],
 write:['She liked to write a sentence about each new idea.','她喜欢为每个新想法写一个句子。'],
 share:['Later, she would share her ideas with her classmates.','稍后，她会和同学们分享自己的想法。'],
 plan:['Her plan for the afternoon was to visit a museum.','她下午的计划是参观博物馆。'],
 travel:['She would travel there by train with a friend.','她会和一位朋友乘火车前往那里。'],
 journey:['The journey took them along a beautiful river.','这段旅程带他们沿着一条美丽的河流前行。'],
 notice:['At the museum, visitors could notice small details in every painting.','在博物馆，参观者能注意到每幅画中的细节。'],
 discover:['Maya hoped to discover something she had never seen before.','玛雅希望发现一些自己从未见过的东西。'],
 change:['One painting showed how seasons change the colors of a forest.','一幅画展示了季节如何改变森林的颜色。'],
 shot:['In a film playing nearby, a loud shot came from a firing range.','附近播放的一部电影里，射击场传来一声响亮的枪声。'],
 aim:['The museum’s aim was to help visitors understand everyday life.','博物馆的目标是帮助参观者理解日常生活。'],
 hinder:['A little rain did not hinder Maya’s walk through the outdoor exhibits.','一点雨并没有阻碍玛雅步行参观户外展品。'],
 hinge:['An old door had a rusty hinge that made a noise when it moved.','一扇旧门的铰链生锈了，转动时会发出声音。'],
 defect:['A guide explained that a small defect could stop a machine from working.','一位导游解释说，一个小缺陷就可能使机器停止工作。'],
 deficient:['In the garden exhibit, plants grew poorly in soil deficient in nutrients.','在园艺展区，植物在缺乏养分的土壤中长势不佳。']
};
export function createArticle(ids,learnedSenseIds=[]){
 const unique=[...new Set(ids)];
 if(!unique.length)throw new Error('先完成今天的学习，再来阅读。');
 if(unique.some(id=>!wordMap[id]))throw new Error('文章覆盖校验未通过：存在未知单词。');
 const collection=unique.some(id=>!story[id]);
 const ordered=collection?unique:Object.keys(story).filter(id=>unique.includes(id));
 const missing=[];const paragraphs=ordered.map(id=>{
  const w=wordMap[id],sense=w.senses.find(s=>learnedSenseIds.includes(s.id))||w.senses[0];
  if(!sense.examples.length){missing.push(id);return null;}
  const text=!collection&&sense.id===w.senses[0].id?story[id]:[sense.examples[0].en,sense.examples[0].zh];
  return {wordId:id,senseId:sense.id,en:text[0],zh:text[1]};
 }).filter(Boolean);
 if(paragraphs.some(p=>!new RegExp(`\\b${p.wordId}\\b`,'i').test(p.en)))throw new Error('文章覆盖校验未通过，请重试。');
 return {title:collection?'English in everyday contexts':'A day of small discoveries',
 subtitle:collection?'今日语境摘读 · 离线例句合集，非连贯文章':'发现，从细微处开始',
 intro:collection?'Read each example in its own context. Notice how the meaning of each word fits the situation.':'Maya enjoyed finding new things in ordinary places. Every day gave her a few more ideas for her notebook.',
 introZh:collection?'每个例句是独立语境。注意单词的含义如何与情境相匹配。':'玛雅喜欢在平凡的地方发现新事物。每一天都会给她的笔记本带来一些新想法。',
 paragraphs,
 ending:collection?'Choose a few useful expressions and try using them in your own sentences.':'That evening, Maya looked through her notes. A little attention had turned an ordinary day into a day worth remembering.',
 endingZh:collection?'选几个实用表达，试着用它们写出自己的句子。':'那天晚上，玛雅翻看自己的笔记。一点细心，让平凡的一天变成了值得记住的一天。',
 covered:paragraphs.length,total:unique.length,missing,mode:'demo',collection};
}
export function shuffle(a,random=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
export function makeQuiz(state,log,onlyWrong=false){const wrong=new Set(log.quiz?.answers.filter(a=>!a.correct).map(a=>a.senseId)||[]);let candidates=log.touched.flatMap(id=>wordMap[id].senses.filter(s=>log.passed.includes(s.id)&&s.examples.length>=2&&s.distractors.length===3&&!state.knownWords?.[id]).map(s=>({...s,wordId:id,weak:state.records[s.id]?.weak})));if(onlyWrong)candidates=candidates.filter(s=>wrong.has(s.id));candidates=shuffle(candidates).sort((a,b)=>Number(b.weak)-Number(a.weak)).slice(0,10);if(!candidates.length)throw new Error('暂无有完整例句和选项的已通过词义。导入词表中缺少语境材料的词不生成听力选择题。');return {questions:candidates.map(s=>{const ex=s.examples[1];const options=shuffle([...new Set([s.meaning,...s.distractors])]);if(options.length!==4)throw new Error('题目选项校验失败。');return {senseId:s.id,wordId:s.wordId,en:ex.en,zh:ex.zh,meaning:s.meaning,pos:s.pos,options};}),index:0,answers:[],revealed:false,played:false,submitted:false,onlyWrong};}
