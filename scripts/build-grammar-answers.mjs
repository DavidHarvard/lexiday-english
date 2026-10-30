import fs from 'node:fs';
const paths=['data/grammar-book/answers-1.json','data/grammar-book/answers-2.json'];
const groups=paths.flatMap(path=>JSON.parse(fs.readFileSync(path,'utf8'))),ids=new Set();
for(const group of groups){
 if(!group.id||ids.has(group.id)||!Number.isInteger(group.page)||group.page<3||group.page>259||!Array.isArray(group.items)||!group.items.length||!Array.isArray(group.keyPages)||!group.keyPages.length)throw Error('Invalid grammar group: '+group.id);
 ids.add(group.id);const itemIds=new Set();
 for(const item of group.items){if(!item.id||itemIds.has(item.id)||typeof item.answer!=='string'||!item.answer.trim()||!['objective','self'].includes(item.mode||group.mode))throw Error('Invalid grammar item: '+group.id+'/'+item.id);itemIds.add(item.id);}
}
for(let unit=1;unit<=115;unit++)if(!groups.some(g=>g.unit===unit))throw Error('Missing grammar unit '+unit);
for(let n=1;n<=35;n++)if(!groups.some(g=>g.id==='extra.'+n))throw Error('Missing additional exercise '+n);
const ordered=groups.sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'en',{numeric:true}));
fs.writeFileSync('dist/grammar-book-answers.js','export const grammarExercises='+JSON.stringify(ordered)+';\n');
fs.writeFileSync('data/grammar-book/coverage.json',JSON.stringify({units:115,groups:groups.length,items:groups.reduce((n,g)=>n+g.items.length,0),objective:groups.reduce((n,g)=>n+g.items.filter(q=>(q.mode||g.mode)==='objective').length,0),selfCheck:groups.reduce((n,g)=>n+g.items.filter(q=>(q.mode||g.mode)==='self').length,0)},null,2)+'\n');
console.log('Built grammar exercise groups:',groups.length);

const titles=JSON.parse(fs.readFileSync('data/grammar-book/unit-titles.json','utf8'));
if(titles.length!==115||titles.some((u,i)=>u.unit!==i+1||!u.title))throw Error('Incomplete unit navigation titles');
const book=JSON.parse(fs.readFileSync('dist/grammar-book/manifest.json','utf8'));
book.units=titles.map(u=>({...u,page:u.unit*2,exercisePage:u.unit*2+1}));
fs.writeFileSync('dist/grammar-book/manifest.json',JSON.stringify(book,null,2)+'\n');
fs.writeFileSync('dist/grammar-book-data.js','export const grammarBook='+JSON.stringify(book)+';\n');
