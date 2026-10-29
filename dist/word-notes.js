export function normalizedNoteWord(value){return String(value??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');}
export function deduplicateNotes(notes){
 const result=new Map();
 for(const note of notes){
  const key=normalizedNoteWord(note.word);if(!key)continue;
  const types=[...new Set((note.types||[note.type]).map(type=>type==='词族'?'同词族':type))],type=types[0];
  const differences=(note.differences||[note.difference]).filter(Boolean);
  const existing=result.get(key);
  if(!existing){result.set(key,{...note,word:note.word.trim(),type,types,differences});continue;}
  for(const type of types)if(!existing.types.includes(type))existing.types.push(type);
  for(const difference of differences)if(!existing.differences.includes(difference))existing.differences.push(difference);
 }
 return [...result.values()];
}
