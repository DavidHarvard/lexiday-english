import {getWord} from './personal-words.js';
import {examplesForSense,studyMeaning,checkMeaning} from './word-content.js';
import {findWord} from './reading-model.js';
const safe=(s,max=8000)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&!/[<>]/.test(s);
export function practiceTargets(state,ids,senseIds){return ids.flatMap(id=>{const w=getWord(state,id);return w&&!state.knownWords?.[id]?w.senses.filter(s=>senseIds.includes(s.id)).map(s=>({wordId:id,senseId:s.id})):[];}).slice(0,5);}
export function validatePractice(raw,state,targets){
 if(!raw||raw.version!==2||!Array.isArray(raw.passages)||!raw.passages.length||raw.passages.length>5)throw Error('听力材料格式无效。');
 const seen=new Set();
 for(const p of raw.passages){const w=getWord(state,p.wordId),se=w?.senses.find(s=>s.id===p.senseId);if(!se||!targets.some(t=>t.wordId===p.wordId&&t.senseId===p.senseId)||seen.has(p.senseId))throw Error('听力目标词义无效。');seen.add(p.senseId);
  if(!safe(p.en,5000)||!safe(p.zh,5000)||(p.en.match(/[A-Za-z]+/g)||[]).length<90||(p.en.match(/[A-Za-z]+/g)||[]).length>260||(!findWord(p.en,w.id)&&!examplesForSense(w,se).some(ex=>p.en.includes(ex.en)))||!Array.isArray(p.questions)||p.questions.length!==3)throw Error('听力段落需要 90–260 词及三道题。');
  for(const [i,q] of p.questions.entries())if(q.kind!==(i===2?'meaning':'content')||!safe(q.prompt,300)||!safe(q.spokenPrompt,300)||!safe(q.explanation,800)||!Array.isArray(q.options)||q.options.length!==4||q.options.some(o=>!safe(o,180))||new Set(q.options).size!==4||!Number.isInteger(q.correct)||q.correct<0||q.correct>3)throw Error('听力选项或答案无效。');
  const vocabularyQuestion=p.questions[2],example=examplesForSense(w,se)[0],answer=vocabularyQuestion.options[vocabularyQuestion.correct];if(answer!==studyMeaning(w,se,example).meaning&&!checkMeaning(w,se,answer,'context',example))throw Error('听力词义答案不符合目标词义。');
 }
 return raw;
}
export function fallbackPractice(state,targets){
 const scenes=[['Maya','Tuesday','the community library','星期二','社区图书馆'],['Daniel','Friday','a small language centre','星期五','语言中心'],['Sofia','Monday','the university study room','星期一','大学自习室'],['Leo','Thursday','the neighbourhood learning club','星期四','社区学习小组'],['Anna','Wednesday','the public reading room','星期三','公共阅览室']];
 return {version:2,mode:'library',passages:targets.map((t,i)=>{
  const w=getWord(state,t.wordId),s=w.senses.find(s=>s.id===t.senseId),ex=examplesForSense(w,s)[0],meaning=studyMeaning(w,s,ex),[name,day,place,zhDay,zhPlace]=scenes[i%scenes.length];
  const en=`On ${day} afternoon, ${name} joined a small English listening group at ${place}. The group had planned to use a recording, but the loudspeaker was not working. Instead of cancelling the lesson, the tutor read a short example aloud: "${ex.en}" ${name} wrote the sentence in a notebook and underlined the word ${w.word}. At first, some people offered different meanings. The tutor asked them to use the whole sentence as a clue. After they discussed their ideas in pairs, everyone explained an answer without looking at a dictionary. Before leaving, ${name} recorded the example on a phone so that it could be played again on the bus home. The group agreed to meet in the same place the following week.`;
  const distractors=[...new Set([...(s.distractors||[]),'修理屋顶','露天停车场','备用钥匙','推迟会议','可再生的','行李'])].filter(text=>text!==meaning.meaning&&!checkMeaning(w,s,text,'context',ex));
  const options=[meaning.meaning,...distractors.slice(0,3)];
  const variant=authoredScene(i,ex);
  return {...t,en:variant?.en||en,zh:variant?.zh||`${zhDay}下午，${name}在${zhPlace}参加英语听力小组。扬声器坏了，老师便朗读例句：“${ex.zh}”${name}记下句子并给${w.word}画了下划线。大家最初给出了不同意思，老师让他们根据整句寻找线索。两人讨论后，每个人不用词典解释答案。离开前，${name}用手机录下例句，准备在回家的公交车上重听。大家约好下周在同一地点见面。`,questions:[...(variant?variant.questions:[
   {kind:'content',prompt:'小组为什么改由老师现场朗读？',spokenPrompt:'Why did the tutor read the example aloud?',options:['因为扬声器坏了','因为所有人忘带笔记本','因为老师取消了课程','因为图书馆已经关门'],correct:0,explanation:'开头说明扬声器无法工作，老师因此改为现场朗读。'},
   {kind:'content',prompt:`${name}为什么用手机录下例句？`,spokenPrompt:`Why did ${name} record the example on a phone?`,options:['为了发给词典编辑','为了回家坐公交时重听','为了更换学习地点','为了测试新的扬声器'],correct:1,explanation:'结尾说明录音是为了在回家的公交车上再次播放。'}]),
   {kind:'meaning',prompt:'选择目标词在材料中的意思',spokenPrompt:`What does ${w.word} mean in this passage?`,options,correct:0,explanation:`例句中 ${w.word} 表示“${meaning.meaning}”。`}
  ]};
 })};
}
function authoredScene(index,ex){
 const question=(prompt,spokenPrompt,options,correct,explanation)=>({kind:'content',prompt,spokenPrompt,options,correct,explanation});
 const scenes=[null,{
  en:`Daniel volunteered at a local history museum on Friday. He was helping to prepare a new audio guide for visitors. One recording contained this sentence: "${ex.en}" Before the guide could be published, a colleague needed to check whether every sentence was clear. Daniel's headphones stopped working halfway through the recording. He went to the reception desk and borrowed a spare pair from the receptionist. With the new headphones, he could hear the entire recording clearly. He marked two places where the speaker needed to slow down. At the end of the afternoon, he printed a short checklist for his colleague. The museum planned to test the guide with a small group of visitors the following Monday.`,
  zh:`星期五，丹尼尔在当地历史博物馆做志愿者，帮助制作新的语音导览。其中一段录音包含这句话：“${ex.zh}”发布前，同事需要确认所有句子都清晰。丹尼尔的耳机在播放中途坏了。他到接待处向接待员借了一副备用耳机，终于能清楚地听完整段录音。他标出了两处需要放慢语速的地方。下午结束时，他为同事打印了一份简短检查表。博物馆计划在下周一请一小组参观者测试导览。`,
  questions:[question('丹尼尔在哪里借到备用耳机？','Where did Daniel borrow the spare headphones?',['接待处','礼品商店','火车站','学校办公室'],0,'录音明确说他向博物馆接待处的接待员借耳机。'),question('博物馆计划哪天请参观者测试导览？','On which day would visitors test the audio guide?',['下周四','下周一','周六晚上','当天中午'],1,'结尾说明测试安排在下周一。')]
 },{
  en:`Sofia was preparing a short newsletter for her neighbourhood on Monday evening. An older neighbour had sent her a paragraph in English, including the line: "${ex.en}" Sofia understood most of it, but she wanted to check the meaning of the important words before translating it. She read the whole paragraph twice and then discussed it with the newsletter editor. They agreed on a clear translation and saved both versions in the shared folder. The editor asked Sofia to finish the layout by one o'clock on Friday. She also needed to print fifteen copies for people who did not use email. Sofia wrote both tasks on a note beside her computer so she would not forget them during the busy week.`,
  zh:`星期一晚上，索菲娅正在为社区制作简报。一位年长的邻居发来英文段落，其中一句是：“${ex.zh}”索菲娅理解大部分内容，但翻译前还想确认关键词的意思。她把整段读了两遍，然后与编辑讨论。两人确定了清晰的译文，并把两个版本存入共享文件夹。编辑要求她在星期五一点前完成排版，还要为不用电子邮件的居民打印十五份。索菲娅把两项任务写在电脑旁的便条上，以免忙碌时忘记。`,
  questions:[question('简报排版最晚要在什么时候完成？','When was the newsletter layout due?',['周五一点','周一八点','周三中午','周日五点'],0,'编辑给出的截止时间是星期五一点。'),question('索菲娅需要打印多少份简报？','How many copies did Sofia need to print?',['五份','十份','十五份','五十份'],2,'材料明确说明要打印十五份。')]
 },{
  en:`Leo and Aisha were rehearsing a short play for their school festival. Their rehearsal was meant to take place in the courtyard, but heavy rain forced them to move into room B7. Aisha had a line that she found difficult to say naturally: "${ex.en}" Leo read the lines before and after it so that she could understand the situation. They repeated the scene slowly and then tried it at a normal speaking speed. The rehearsal began at six and finished at seven. Before they left, Aisha recorded the final version on her phone. Their drama teacher, Mrs Green, had agreed to listen to the recording the next morning and send them suggestions before the festival.`,
  zh:`利奥和艾莎正在排练学校节庆的短剧。排练本来在院子里进行，但大雨迫使他们移到B7教室。艾莎觉得一句台词不容易自然地说出来：“${ex.zh}”利奥读出前后的台词，帮助她理解场景。他们先慢速重复，再尝试正常语速。排练从六点持续到七点。离开前，艾莎用手机录下了最后一遍。戏剧老师格林夫人答应第二天早上听录音，并在节庆前给出建议。`,
  questions:[question('他们最终在哪里排练？','Where did they finally rehearse?',['院子里','B7教室','学校食堂','公共图书馆'],1,'大雨使排练地点改为B7教室。'),question('谁会在第二天听录音并给建议？','Who would listen to the recording the next morning?',['格林夫人','博物馆接待员','简报编辑','艾莎的弟弟'],0,'结尾指明戏剧老师格林夫人会听录音。')]
 },{
  en:`Anna arrived at the community radio station early on Wednesday to help with a programme for English learners. The producer had selected a short sentence from an interview: "${ex.en}" Anna practised reading the sentence clearly while the technician checked the sound. During their first attempt, the background music was too loud, so the technician lowered it. They made a second recording and listened carefully to the result. This time every word could be heard. The complete practice recording lasted forty seconds. Anna saved it on the studio computer and sent a copy to the producer by email. The producer would choose the final clips that afternoon, before the programme was broadcast on Thursday morning.`,
  zh:`星期三，安娜早早来到社区广播站，协助制作英语学习节目。制作人从采访中选了一句话：“${ex.zh}”安娜练习清楚朗读，技术员则检查声音。第一次录音的背景音乐太响，技术员把音乐调低。他们录了第二遍并仔细回听，这次每个词都听得清楚。整段练习录音持续四十秒。安娜把它保存在录音室电脑里，再用电子邮件发给制作人。制作人将在当天下午选出最终片段，节目于星期四早上播出。`,
  questions:[question('技术员对背景音乐做了什么调整？','What did the technician do to the background music?',['完全删除了音乐','把音量调低','把音量调高','换成另一首歌'],1,'第一次录音中音乐太响，因此技术员调低了音量。'),question('完整的练习录音有多长？','How long was the complete practice recording?',['十四秒','四分钟','四十秒','四十五分钟'],2,'材料明确说完整练习录音持续四十秒。')]
 }];return scenes[index%scenes.length];
}
export function quizFromPractice(pack,state,log,onlyWrong=false,random=Math.random){
 const wrong=new Set(log.quiz?.answers.filter(a=>a&&!a.correct).map(a=>a.senseId)||[]);
 const passages=pack.passages.filter(p=>log.passed.includes(p.senseId)&&!state.knownWords?.[p.wordId]&&(!onlyWrong||wrong.has(p.senseId)));
 if(!passages.length)throw Error('请先完成今天的单词听音验证。');
 const questions=passages.flatMap((p,passageIndex)=>p.questions.map((q,questionInPassage)=>{
  const answer=q.options[q.correct],options=[...q.options];for(let i=3;i>0;i--){const j=Math.floor(random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
  return {...p,...q,questions:undefined,meaning:answer,options,passageIndex,questionInPassage,pos:getWord(state,p.wordId).senses.find(s=>s.id===p.senseId).pos};
 }));
 return {version:2,questions,index:0,answers:[],revealed:false,played:false,submitted:false,onlyWrong,passages:passages.length,mode:pack.mode};
}
