import {lookupLocalWord,validateCustomWord} from './personal-words.js';
import {readingDictionary,dictionaryWord} from './reading-dictionary.js';
import {invalidWordExamples} from './example-target.js';
const novelNames={harry:'哈利；故事的主人公',potter:'波特；哈利的姓',ron:'罗恩；哈利的朋友',hermione:'赫敏；哈利的朋友',granger:'格兰杰；赫敏的姓',weasley:'韦斯莱；罗恩一家的姓',dursley:'德思礼；哈利姨父一家的姓',dudley:'达力；哈利的表兄',vernon:'弗农；哈利的姨父',petunia:'佩妮；哈利的姨妈',hogwarts:'霍格沃茨魔法学校',hagrid:'海格；霍格沃茨的猎场看守',dumbledore:'邓布利多；霍格沃茨校长',mcgonagall:'麦格；霍格沃茨的教授',snape:'斯内普；魔药课教授',quirrell:'奇洛；黑魔法防御术教授',voldemort:'伏地魔；故事中的黑巫师',malfoy:'马尔福；德拉科一家的姓',draco:'德拉科；哈利的同学',gryffindor:'格兰芬多学院',slytherin:'斯莱特林学院',hufflepuff:'赫奇帕奇学院',ravenclaw:'拉文克劳学院',muggle:'麻瓜；魔法世界对非魔法人士的称呼',muggles:'麻瓜们；不会魔法的人',quidditch:'魁地奇；骑飞天扫帚进行的球类运动',hedwig:'海德薇；哈利的猫头鹰',neville:'纳威；哈利的同学',longbottom:'隆巴顿；纳威的姓',gringotts:'古灵阁；魔法世界的银行',ollivander:'奥利凡德；魔杖制作师',fang:'牙牙；海格的猎犬',fluffy:'路威；三头犬',diagon:'对角巷（Diagon Alley）名称的一部分'};
export async function lookupBookWord(text,context,novel,state){
 const token=text.toLowerCase().replace(/[’‘]/g,"'");
 if(novel&&novelNames[token])return dictionaryWord({word:token,record:['','n. '+novelNames[token],'','']},{en:context,zh:''});
 const local=lookupLocalWord(token,state);if(local&&!invalidWordExamples(local).length)return local;
 const entry=await readingDictionary.lookup(token);if(entry){try{return dictionaryWord(entry,{en:context,zh:''});}catch{}}
 const response=await fetch('/api/word-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:token,context:context.slice(0,5000)}),signal:AbortSignal.timeout(30000)});const result=await response.json();if(!response.ok)throw Error(result.error||'暂时未找到可靠释义，请稍后重试。');
 const word=result.word;if(word.id?.startsWith('reading:'))validateCustomWord(word);if(invalidWordExamples(word).length)throw Error('此词的例句正在校正，请稍后重试。');return word;
}
