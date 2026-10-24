// IELTS planning is deliberately independent of the legacy vocabulary storage.
export const SKILLS = ['listening', 'writing', 'speaking', 'reading'];
export const LABELS = { listening: '听力', writing: '写作', speaking: '口语', reading: '阅读' };
export const DATE = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function validDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s + 'T12:00:00Z')) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s; }
export function daysBetween(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000); }
export function plusDays(s, n) { return new Date(Date.parse(s + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
export function sixMonths(s) { const d = new Date(s + 'T12:00:00Z'); const date = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 6); const max = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(date, max)); return d.toISOString().slice(0, 10); }
export function initialIelts(day = DATE()) { return { version: 1, settings: { exam: 'general', hours: 12, start: day, target: sixMonths(day) }, checks: {}, notes: {}, drafts: {}, entries: [], chunks: [], mocks: [], clocks: {} }; }
export function validateIelts(s) {
  if (!s || s.version !== 1 || !s.settings || !['general', 'academic'].includes(s.settings.exam) || !Number.isFinite(s.settings.hours) || s.settings.hours < 6 || s.settings.hours > 20 || !validDate(s.settings.start) || !validDate(s.settings.target) || s.settings.target <= s.settings.start) throw Error('计划设置无效。');
  for (const k of ['checks', 'notes', 'drafts', 'clocks']) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) throw Error('学习记录格式无效。');
  for (const k of ['entries', 'chunks', 'mocks']) if (!Array.isArray(s[k]) || s[k].length > 10000) throw Error('学习记录格式无效。');
  for (const m of s.mocks) validateMock(m);
  for (const c of s.chunks) if (typeof c.id !== 'string' || typeof c.expression !== 'string' || !validDate(c.due) || !Number.isInteger(c.level) || c.level < 0 || c.level > 4) throw Error('词块记录无效。');
  for (const e of s.entries) if (!SKILLS.includes(e.skill) || typeof e.source !== 'string' || !validDate(e.date)) throw Error('复盘记录无效。');
  for (const d of Object.values(s.drafts)) if (!d || typeof d.first !== 'string' || typeof d.revised !== 'string' || typeof d.outline !== 'string') throw Error('写作草稿无效。');
  return s;
}
export const PHASES = [
  { from: 1, to: 2, title: '诊断与校准', focus: '先看真实差距', deliver: '完成一次未做过的听读整套、两篇独立写作和一次口语全程录音；按错因建立基线。', gate: '得到四科真实起点；写作与口语尽量请熟悉雅思评分标准的人各评一次。' },
  { from: 3, to: 8, title: '补齐听辨与句法', focus: '少翻译，多重写', deliver: '每周 4 次短音频精听、2 个段落重写；逐步达到每周 1 篇 Task 2 + 1 封信；完成六个语法专题。', gate: '不借助整段翻译写完一篇文章；听读错题能说清错因。若听力首测低于 23/40，保留更多基础听辨。' },
  { from: 9, to: 16, title: '题型与输出', focus: '把理解变成得分', deliver: '每周 1 套听力、1 套 GT 阅读（可替换当周分项）；2 篇 Task 2 + 1 封信，其中至少 1 篇反馈后重写；2 次口语录音。', gate: '听力向 30/40、GT 阅读向 35/40 靠近；写作能回应全部题意，口语能展开原因和例子。' },
  { from: 17, to: 22, title: '限时与稳定性', focus: '用新题检验', deliver: '每两周一次听读写连续模考，替换当周任务；写作严格 20 + 40 分钟；每周一次 11–14 分钟口语模拟。', gate: '最近三套未做过的限时卷：听力争取 ≥32/40，GT 阅读 ≥36/40；写作和口语取得外部反馈。' },
  { from: 23, to: 26, title: '考前巩固', focus: '保持节奏，不堆新题', deliver: '每周最多一套完整模考，复盘占一半时间；最后 3 天减量，复习高频错误和熟悉题型。', gate: '四科目标分别检查。写作或口语若仍明显低于 7，优先补弱或调整考试时间，不用听读高分掩盖短板。' }
];
export function planPosition(s, day = DATE()) { const duration = daysBetween(s.settings.start, s.settings.target); const elapsed = daysBetween(s.settings.start, day); const normalizedWeek = Math.min(26, Math.max(1, Math.floor(Math.max(0, elapsed) / duration * 26) + 1)); return { week: normalizedWeek, phase: PHASES.find(p => normalizedWeek <= p.to), remaining: Math.max(0, daysBetween(day, s.settings.target)), before: elapsed < 0, over: day >= s.settings.target, progress: Math.min(100, Math.max(0, elapsed / duration * 100)) }; }
// Minutes at 12 hours/week, Monday through Sunday. Every minute is allocated exactly once.
const BASE = [[45,45,0,0],[40,0,30,20],[45,45,0,0],[40,0,30,20],[40,50,0,0],[60,70,0,50],[0,30,60,0]];
export function weekSchedule(hours) {
  if (!Number.isFinite(hours) || hours < 6 || hours > 20) throw Error('每周时长需为 6–20 小时。');
  const target = Math.round(hours * 60), raw = BASE.flat().map(x => x * target / 720), flat = raw.map(Math.floor); let left = target - flat.reduce((a,b)=>a+b,0);
  const indexes = raw.map((v,i)=>({i,part:v-flat[i]})).sort((a,b)=>b.part-a.part);
  for (let j=0;j<left;j++) flat[indexes[j].i]++;
  return BASE.map((_,i)=>Object.fromEntries(SKILLS.map((k,j)=>[k,flat[i*4+j]])));
}
export function allocation(hours) { return Object.fromEntries(SKILLS.map(k=>[k,weekSchedule(hours).reduce((n,d)=>n+d[k],0)])); }
export function weekday(day) { return (new Date(day+'T12:00:00Z').getUTCDay()+6)%7; }
export function taskKey(day, skill) { return `${day}:${skill}`; }
export function weeklyCompletion(s, day = DATE()) { const start=plusDays(day,-weekday(day)), schedule=weekSchedule(s.settings.hours); let done=0,total=0; schedule.forEach((d,i)=>SKILLS.forEach(k=>{total+=d[k];if(s.checks[taskKey(plusDays(start,i),k)])done+=d[k];})); return { done,total,start }; }
export function wordCount(text) { return (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).length; }
export function validateMock(m) { if (!m || typeof m.id!=='string' || !['full','fresh','timed','assisted'].every(k=>typeof m[k]==='boolean') || !SKILLS.includes(m.skill) || !validDate(m.date) || !['general','academic'].includes(m.exam) || typeof m.source!=='string' || !m.source.trim() || !['self','teacher','official'].includes(m.assessor) || !Number.isFinite(m.score)) throw Error('请填写有效的模考记录。'); if(['listening','reading'].includes(m.skill)){if(!Number.isInteger(m.score)||m.score<0||m.score>40)throw Error('听读分数为 0–40 的整数。');}else if(m.score<0||m.score>9||m.score*2%1)throw Error('写作口语分数为 0–9，按 0.5 分填写。'); return m; }
export function evidence(s,skill) { const relevant=s.mocks.filter(m=>m.skill===skill&&(skill!=='reading'||m.exam===s.settings.exam)); const eligible=relevant.filter(m=>m.fresh&&m.timed&&!m.assisted&&m.full&&(skill==='listening'||skill==='reading'||m.assessor!=='self')); const unique=[];const seen=new Set(); for(const m of [...eligible].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))){const key=m.source.trim().toLowerCase();if(!seen.has(key)){seen.add(key);unique.push(m);}}const n=['listening','reading'].includes(skill)?3:2;const recent=unique.slice(0,n);const threshold=skill==='listening'?32:skill==='reading'?(s.settings.exam==='general'?36:32):7;return { recent,needed:n,threshold,met:recent.length===n&&recent.every(m=>m.score>=threshold),total:relevant.length }; }
export function reviewChunk(c,success,day=DATE()) { if(!success){c.level=0;c.due=plusDays(day,1);return c;}c.level=Math.min(4,c.level+1);c.due=plusDays(day,[1,3,7,14][c.level-1]);return c; }
export function timerRemaining(t,now=Date.now()) { if(!t)return 0;return t.running?Math.max(0,Math.ceil((t.end-now)/1000)):Math.max(0,t.remaining); }
export function setClock(clocks,key,action,seconds=2400,now=Date.now()) { let t=clocks[key]||{remaining:seconds,running:false,end:0};if(action==='reset')t={remaining:seconds,running:false,end:0};if(action==='start'){const rem=timerRemaining(t,now);t={remaining:rem||seconds,running:true,end:now+(rem||seconds)*1000};}if(action==='pause')t={remaining:timerRemaining(t,now),running:false,end:0};clocks[key]=t;return t; }
