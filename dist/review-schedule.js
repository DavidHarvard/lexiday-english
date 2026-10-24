// Transparent heuristic, not a fitted Ebbinghaus or FSRS model.
export const reviewGrades=[
 {grade:0,label:'看例句仍不认识',weight:0},
 {grade:1,label:'看到例句才认识',weight:.25},
 {grade:2,label:'看到拼写才认识',weight:.5},
 {grade:3,label:'听语境与英文解释后认识',weight:.75},
 {grade:4,label:'只听读音就认识',weight:1}
];
export function scheduleReview(previous,grade){
 if(!Number.isInteger(grade)||grade<0||grade>4)throw Error('无效复习评级。');
 const old=Math.max(1,previous?.interval||[1,3,7,14,30,60][Math.max(0,(previous?.level||1)-1)]||1);
 const weight=reviewGrades[grade].weight;
 const interval=grade===0?1:grade===1?Math.min(3,Math.max(1,Math.round(old*.5))):grade===2?Math.min(7,Math.max(2,Math.round(old*.8))):Math.min(180,Math.max(grade===4?3:2,Math.round(old*(grade===4?2.5:1.6))));
 return {grade,weight,interval,algorithm:'cue-srs-v1'};
}
