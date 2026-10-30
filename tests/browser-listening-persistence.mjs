import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,mkdirSync} from 'node:fs';
import {resolve,extname,relative,isAbsolute} from 'node:path';
import worker from '../server/worker.js';
import {database} from '../server/local-db.mjs';
import {initialIelts} from '../dist/ielts-model.js';
import {FIRST_LISTENING_ID,listeningKey} from '../dist/listening-model.js';
const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const root=resolve('dist'),db=database();
// This test deliberately creates an isolated, in-memory server. Never register
// test users or rewrite progress on the real deployment.
const env={DB:db,AUTH_PEPPER:'isolated-browser-listening-test-pepper-32-characters',ASSETS:{fetch:async request=>{
 const path=resolve(root,'.'+decodeURIComponent(new URL(request.url).pathname)),rel=relative(root,path),file=path===root?resolve(root,'index.html'):path;
 if(rel.startsWith('..')||isAbsolute(rel)||!existsSync(file)||!statSync(file).isFile())return new Response('Not found',{status:404});
 const bytes=readFileSync(file),type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg','.txt':'text/plain'}[extname(file)]||'application/octet-stream';
 const headers={'Content-Type':type,'Cache-Control':'no-store','Accept-Ranges':'bytes'},match=request.headers.get('Range')?.match(/^bytes=(\d+)-(\d*)$/);
 if(match){const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1;if(start>=bytes.length||start>end)return new Response(null,{status:416});return new Response(bytes.subarray(start,end+1),{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':String(end-start+1)}});}
 return new Response(bytes,{headers});
}}};
const server=createServer(async(req,res)=>{try{
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 const request=new Request('http://127.0.0.1:'+server.address().port+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
 const result=await worker.fetch(request,env,{waitUntil:promise=>promise.catch(()=>{})});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
}catch(error){res.writeHead(500);res.end(error.message);}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.LEXIDAY_CHROME_PATH?{executablePath:process.env.LEXIDAY_CHROME_PATH}:{})});
const errors=[],credentials={username:'listening_browser',password:'isolated listening browser test password'},firstNote='首次没有听清 guided tours；这里需要注意连读。',latestNote='第二次补充：notice board。';
const tracks=JSON.parse(readFileSync('dist/listening/cambridge-04/catalog.json','utf8'));
async function post(context,path,data){return context.request.post(base+'/api/'+path,{headers:{Origin:base},data});}
async function state(context){return (await (await context.request.get(base+'/api/session')).json()).progress.ielts.data;}
async function open(context,suffix=''){
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(base+'/'+suffix+'#ielts-listening');await page.locator('#listening-answer-1').waitFor();return page;
}
try{
 const a=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai'});
 assert.equal((await post(a,'register',credentials)).status(),201);
 const old=initialIelts('2026-10-30');old.notes[listeningKey(FIRST_LISTENING_ID,'answer-1')]='legacy saved answer';old.notes[listeningKey(FIRST_LISTENING_ID,'dictation')]='旧版本保留的听写内容';
 assert.equal((await a.request.put(base+'/api/progress/ielts',{headers:{Origin:base},data:{revision:0,data:old}})).status(),200);
 const page=await open(a);assert.equal(await page.locator('#listening-answer-1').inputValue(),'');
 assert.match(await page.locator('#listening-note-workspace').innerText(),/旧版本保留的听写内容/);
 await page.locator('#listening-answer-1').fill('shopping');await page.locator('#listening-note').fill(firstNote);await page.locator('#listening-save-note').click();
 await page.waitForFunction(()=>document.querySelector('#listening-note-status')?.textContent.includes('已保存到服务器'));
 assert.equal(await page.locator('#listening-first-note-content').innerText(),firstNote);assert.ok(await page.locator('#listening-first-note-content').isVisible());
 let saved=await state(a);assert.equal(saved.notes[listeningKey(FIRST_LISTENING_ID,'first-note')],firstNote);assert.equal(saved.notes[listeningKey(FIRST_LISTENING_ID,'answer-1')],'legacy saved answer');
 await page.locator('#listening-track').selectOption(tracks[1].id);await page.locator('#listening-answer-11').fill('coal');await page.locator('#listening-answer-11-1').fill('firewood');await page.locator('#listening-check').click();assert.match(await page.locator('#listening-feedback-11').innerText(),/✓ 正确/);
 await page.locator('#listening-track').selectOption(FIRST_LISTENING_ID);assert.equal(await page.locator('#listening-answer-1').inputValue(),'shopping');
 await page.reload();await page.locator('#listening-answer-1').waitFor();assert.equal(await page.locator('#listening-answer-1').inputValue(),'');assert.equal(await page.locator('#listening-first-note-content').innerText(),firstNote);
 await page.locator('#listening-answer-1').fill('another attempt');await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.waitForFunction(()=>document.querySelector('#listening-answer-1')?.value==='');
 assert.equal(await page.locator('#listening-first-note-content').innerText(),firstNote);
 await page.locator('#listening-note').fill(latestNote);await page.locator('#listening-save-note').click();await page.waitForFunction(()=>document.querySelector('#listening-note-status')?.textContent.includes('已保存到服务器'));
 saved=await state(a);assert.equal(saved.notes[listeningKey(FIRST_LISTENING_ID,'first-note')],firstNote);assert.equal(saved.notes[listeningKey(FIRST_LISTENING_ID,'latest-note')],latestNote);
 await page.locator('[data-account="open"]').first().click();await page.locator('[data-account="logout"]').click();await page.waitForFunction(()=>!localStorage.getItem('lexiday.account.v1'));
 assert.equal((await a.request.get(base+'/api/session')).status(),401);await a.close();
 const b=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai'});assert.equal((await post(b,'login',credentials)).status(),200);
 const reopened=await open(b,'?version=after-site-update');assert.equal(await reopened.locator('#listening-answer-1').inputValue(),'');assert.equal(await reopened.locator('#listening-first-note-content').innerText(),firstNote);assert.match(await reopened.locator('#listening-note-status').innerText(),/已保存到服务器/);await reopened.locator('#listening-latest-note summary').click();assert.equal(await reopened.locator('#listening-latest-note div').innerText(),latestNote);
 mkdirSync('outputs/listening-persistence',{recursive:true});await reopened.screenshot({path:'outputs/listening-persistence/notes-after-login.png',fullPage:true});
 await b.close();
 const other=await browser.newContext();assert.equal((await post(other,'register',{username:'other_listening_user',password:credentials.password})).status(),201);const unrelated=await open(other);assert.equal(await unrelated.locator('#listening-first-note-content').innerText(),'');assert.equal(await unrelated.locator('#listening-answer-1').inputValue(),'');await other.close();
 assert.deepEqual(errors,[]);
 console.log('Listening browser checks passed: blank answers after refresh/reopen/bfcache, in-page section drafts, two-part grading, first note immediately in server DB, visible notes after logout/login and fresh browser storage, legacy note preservation and account isolation.');
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));db.close();}
