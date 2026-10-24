import assert from 'node:assert/strict';
import {initialGrammar} from '../dist/grammar-model.js';
import {initialUnit1,submitUnit1} from '../dist/unit1-model.js';
const base=process.argv[2];if(!base)throw Error('Supply target URL');let cookie='';
async function req(path,method='GET',body){const r=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const data=await r.json();return {status:r.status,data};}
const credentials={username:'unit1_check_'+Date.now(),password:crypto.randomUUID()+'Aa1!'};
assert.equal((await req('/api/health')).status,200);
assert.equal((await req('/api/register','POST',credentials)).status,201);
const state=initialGrammar();state.unit1=initialUnit1();state.unit1.view='practice';state.unit1.step=2;state.unit1.drafts['book-0-0']="she's";submitUnit1(state.unit1);
assert.equal((await req('/api/progress/grammar','PUT',{revision:0,data:state})).status,200);
cookie='';assert.equal((await req('/api/login','POST',credentials)).status,200);
const restored=(await req('/api/session')).data.progress.grammar;assert.deepEqual(restored.data,state);
assert.equal((await req('/api/progress/grammar','PUT',{revision:0,data:state})).status,409);
await req('/api/logout','POST',{});
assert.equal((await req('/api/session')).status,401);
console.log('PASS: health, register, Unit 1 sync, fresh login restoration, revision conflict, logout',base);
