import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,mkdirSync} from 'node:fs';
import {resolve,extname,relative,isAbsolute} from 'node:path';
import worker from '../server/worker.js';
import {database} from '../server/local-db.mjs';
import {grammarExercises,grammarItemMap,checkGrammarItem} from '../dist/grammar-reader-model.js';

const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const root=resolve('dist'),db=database();
// This test deliberately creates an isolated, in-memory server. Never register
// test users or rewrite progress on the real deployment.
const env={DB:db,AUTH_PEPPER:'isolated-browser-listening-test-pepper-32-characters',ASSETS:{fetch:async request=>{
 const path=resolve(root,'.'+decodeURIComponent(new URL(request.url).pathname)),rel=relative(root,path),file=path===root?resolve(root,'index.html'):path;
 if(rel.startsWith('..')||isAbsolute(rel)||!existsSync(file)||!statSync(file).isFile())return new Response('Not found',{status:404});
 const bytes=readFileSync(file),type={'.pdf':'application/pdf','.wasm':'application/wasm','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg','.txt':'text/plain'}[extname(file)]||'application/octet-stream';
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
const errors=[],credentials={username:'grammar_browser',password:'isolated grammar browser test password'};
async function post(context,path,data){return context.request.post(base+'/api/'+path,{headers:{Origin:base},data});}
async function state(context){return (await (await context.request.get(base+'/api/session')).json()).progress.grammar?.data;}
async function open(context,suffix=''){const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(base+'/'+suffix+'#grammar');await page.locator('#book-canvas[data-page]').waitFor({timeout:45000});return page;}
async function jump(page,n){await page.locator('#book-page').fill(String(n));await page.locator('#book-jump button').click();await page.locator('#book-canvas[data-page="'+n+'"]').waitFor({timeout:45000});}
try{
 const a=await browser.newContext({viewport:{width:1365,height:980},timezoneId:'Asia/Shanghai'});
 await a.addInitScript(()=>{window.__pageSounds=[];const create=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(...args){const source=create.apply(this,args),start=source.start.bind(source),context=this;source.start=function(...args){const samples=source.buffer?.getChannelData(0)||[];let peak=0;for(const value of samples)peak=Math.max(peak,Math.abs(value));window.__pageSounds.push({peak,duration:source.buffer?.duration,state:context.state});return start(...args);};return source;};});
 assert.equal((await post(a,'register',credentials)).status(),201);
 const page=await open(a);assert.equal(await page.locator('#book-page').inputValue(),'2');
 mkdirSync('outputs/grammar-reader',{recursive:true});
 await page.locator('[data-book="next"]').click();await page.locator('.book-turn-layer').waitFor();await page.evaluate(()=>document.querySelectorAll('.book-turn-layer *').forEach(el=>el.getAnimations().forEach(a=>{a.pause();a.currentTime=120;})));await page.locator('.book-paper').screenshot({path:'outputs/grammar-reader/flip-mid.png',animations:'allow'});await page.evaluate(()=>document.querySelectorAll('.book-turn-layer *').forEach(el=>el.getAnimations().forEach(a=>a.play())));await page.locator('#book-canvas[data-page="3"]').waitFor();
 const sound=await page.evaluate(()=>window.__pageSounds);assert.equal(sound.length,1);assert.ok(sound[0].peak>.1&&sound[0].duration>.2&&sound[0].state==='running');
 await page.locator('#book-sound').click();await jump(page,4);await page.locator('#book-viewport').focus();await page.keyboard.press('ArrowLeft');await page.locator('#book-canvas[data-page="3"]').waitFor();assert.equal(await page.evaluate(()=>window.__pageSounds.length),1);await page.locator('#book-sound').click();
 const group=grammarExercises.find(g=>g.id==='1.1'),item=group.items[0],id=group.id+':'+item.id,input=page.locator('[data-book-answer="'+id+'"]');
 await input.fill('wrong answer');await page.locator('[data-book="check"][data-item="'+id+'"]').click();assert.match(await page.locator('[data-book-feedback="'+id+'"]').innerText(),/再检查/);
 const second=group.items[1],secondId=group.id+':'+second.id;await input.fill(item.answer);await page.locator('[data-book-answer="'+secondId+'"]').fill('another wrong answer');await page.locator('[data-book="check-group"][data-group="'+group.id+'"]').click();assert.match(await page.locator('[data-book-feedback="'+id+'"]').innerText(),/正确/);assert.match(await page.locator('[data-book-feedback="'+id+'"]').innerText(),/wrong answer/);
 assert.equal(await page.locator('[data-book-item="'+id+'"].was-incorrect').count(),1);assert.equal(await page.locator('[data-book-item="'+secondId+'"].is-incorrect').count(),1);
 await page.waitForFunction(()=>document.querySelector('#book-save-status').textContent==='已同步到账号');let checked=await state(a);assert.equal(checked.pdfBook.exercises[id].attempts.length,2);assert.equal(checked.pdfBook.exercises[id].attempts[0].answer,'wrong answer');assert.equal(checked.pdfBook.exercises[secondId].attempts[0].answer,'another wrong answer');assert.equal(checked.pdfBook.exercises[id].attempts[1].at,checked.pdfBook.exercises[secondId].attempts[0].at);
 await jump(page,4);await page.locator('[data-book="previous"]').click();await page.locator('#book-canvas[data-page="3"]').waitFor();assert.equal(await input.inputValue(),item.answer);assert.equal(await page.locator('[data-book-answer="'+secondId+'"]').inputValue(),'another wrong answer');await page.locator('[data-book-item="'+id+'"] details').evaluate(el=>el.open=true);await page.locator('[data-book-item="'+id+'"]').screenshot({path:'outputs/grammar-reader/answer-history.png'});
 const selfGroup=grammarExercises.find(g=>g.items.some(q=>(q.mode||g.mode)==='self')),selfItem=selfGroup.items.find(q=>(q.mode||selfGroup.mode)==='self'),selfId=selfGroup.id+':'+selfItem.id;
 await jump(page,selfItem.page||selfGroup.page);await page.locator('[data-book-answer="'+selfId+'"]').fill('My own personal answer.');await page.locator('[data-book="check"][data-item="'+selfId+'"]').click();assert.match(await page.locator('[data-book-feedback="'+selfId+'"]').innerText(),/请对照参考答案/);await page.locator('[data-book-self="'+selfId+'"]').check();
 await jump(page,101);await page.locator('#book-zoom').selectOption('1.5');await page.locator('#book-canvas[data-ready="true"]').waitFor();
 await page.locator('#book-viewport').evaluate(el=>{el.scrollTop=(el.scrollHeight-el.clientHeight)*.6;el.dispatchEvent(new Event('scroll'));});await page.waitForTimeout(250);
 await page.evaluate(async()=>{await(await import('/account-store.js')).syncNow();});
 let saved=await state(a);assert.equal(saved.pdfBook.page,101);assert.equal(saved.pdfBook.zoom,1.5);assert.ok(saved.pdfBook.scroll.y>.5);assert.equal(saved.pdfBook.exercises[id].result,'correct');assert.equal(saved.pdfBook.exercises[selfId].selfChecked,true);
 await page.reload();await page.locator('#book-canvas[data-page="101"]').waitFor({timeout:45000});assert.equal(await page.locator('#book-zoom').inputValue(),'1.5');assert.ok(await page.locator('#book-viewport').evaluate(el=>el.scrollTop>0));
 // Repeated navigation across chunks must end on the requested page, without a stale canvas.
 await jump(page,35);await page.locator('[data-book="next"]').click();await page.locator('[data-book="next"]').click();await page.locator('[data-book="next"]').click();await page.locator('#book-canvas[data-page="38"]').waitFor({timeout:45000});
 await jump(page,294);await page.locator('#book-zoom').selectOption('1');await page.locator('#book-canvas[data-ready="true"]').waitFor();await page.screenshot({path:'outputs/grammar-reader/reader-desktop.png',fullPage:true});
 await page.locator('#book-sound').click();await page.locator('[data-account="open"]').first().click();await page.locator('[data-account="logout"]').click();await page.waitForFunction(()=>!localStorage.getItem('lexiday.account.v1'));await a.close();
 const b=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Asia/Shanghai'});assert.equal((await post(b,'login',credentials)).status(),200);
 const reopened=await open(b,'?updated-reader=1');assert.equal(await reopened.locator('#book-page').inputValue(),'294');assert.equal(await reopened.locator('#book-sound').getAttribute('aria-pressed'),'false');await jump(reopened,3);assert.equal(await reopened.locator('[data-book-answer="'+id+'"]').inputValue(),item.answer);assert.match(await reopened.locator('[data-book-feedback="'+id+'"]').innerText(),/正确/);
 assert.match(await reopened.locator('[data-book-feedback="'+id+'"]').innerText(),/wrong answer/);assert.equal(await reopened.locator('[data-book-item="'+secondId+'"].is-incorrect').count(),1);assert.equal((await state(b)).pdfBook.exercises[id].attempts.length,2);
 assert.ok(await reopened.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile outer page must not overflow');await reopened.screenshot({path:'outputs/grammar-reader/reader-mobile.png',fullPage:true});
 await reopened.locator('#book-viewport').scrollIntoViewIfNeeded();const box=await reopened.locator('#book-viewport').boundingBox(),cdp=await b.newCDPSession(reopened),y=box.y+160,x=box.x+box.width*.8;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-box.width*.6*i/8,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await reopened.locator('#book-canvas[data-page="4"]').waitFor();
 await reopened.locator('[data-book="edge-previous"]').click();await reopened.locator('#book-canvas[data-page="3"]').waitFor();assert.equal(await reopened.locator('[data-book-answer="'+id+'"]').inputValue(),item.answer);await b.close();
 const other=await browser.newContext();assert.equal((await post(other,'register',{username:'other_grammar_user',password:credentials.password})).status(),201);const unrelated=await open(other);assert.equal(await unrelated.locator('#book-page').inputValue(),'2');await jump(unrelated,3);assert.equal(await unrelated.locator('[data-book-answer="'+id+'"]').inputValue(),'');
 await unrelated.emulateMedia({reducedMotion:'reduce'});await unrelated.locator('[data-book="next"]').click();await unrelated.locator('#book-canvas[data-page="4"]').waitFor();assert.equal(await unrelated.locator('.book-turn-layer').count(),0);await other.close();
 assert.deepEqual(errors,[]);console.log('Grammar browser checks passed: real PDF and 3D animation, native page sound/mute, keyboard and rapid navigation, reduced motion, group snapshots, permanent wrong answers/highlights, cloud restoration, account isolation and mobile layout.');
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));db.close();}
