import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.LEXIDAY_PLAYWRIGHT_MODULE||'playwright');
const oldWorker=execFileSync('git',['show','bf0ea61:dist/sw.js'],{encoding:'utf8'}),newWorker=fs.readFileSync('dist/sw.js','utf8'),recovery=fs.readFileSync('dist/recover.html');let fixed=false;
const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;res.setHeader('Cache-Control','no-store');
 if(path==='/index.html'||path==='/recover.html'){res.writeHead(308,{Location:path==='/index.html'?'/':'/recover'});res.end();return;}
 if(path==='/sw.js'){res.setHeader('Content-Type','text/javascript');res.end(fixed?newWorker:oldWorker);return;}
 if(path==='/recover'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(recovery);return;}
 if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body><h1>Learning page</h1><script>navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"})</script></body></html>');return;}
 res.setHeader('Content-Type',path.endsWith('.css')?'text/css':'text/javascript');res.end('');
});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{const context=await browser.newContext();let page=await context.newPage();await page.goto(base+'/#learn');await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await page.evaluate(async()=>{localStorage.setItem('lexiday.v1','private progress and notes');localStorage.setItem('lexiday.account.v1','account selection');await (await caches.open('lexiday-speech-v2')).put('/test-audio',new Response('saved audio'));});
 const prior=await page.evaluate(async()=>{const name=(await caches.keys()).find(k=>k.startsWith('lexiday-shell-'));return (await (await caches.open(name)).match('/index.html')).redirected;});assert.equal(prior,true);
 await assert.rejects(()=>page.reload(),/ERR_FAILED/);
 fixed=true;await page.close();page=await context.newPage();await page.goto(base+'/recover.html');await page.waitForFunction(()=>document.getElementById('status').textContent.includes('恢复已完成'));await page.locator('#return').click();await page.locator('h1').waitFor();await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 for(let i=0;i<3;i++)assert.equal((await page.reload()).status(),200);
 await context.setOffline(true);assert.equal((await page.reload()).status(),200);
 const restored=await page.evaluate(async()=>({progress:localStorage.getItem('lexiday.v1'),account:localStorage.getItem('lexiday.account.v1'),audio:await (await (await caches.open('lexiday-speech-v2')).match('/test-audio')).text(),keys:await caches.keys()}));assert.equal(restored.progress,'private progress and notes');assert.equal(restored.account,'account selection');assert.equal(restored.audio,'saved audio');assert.equal(restored.keys.filter(k=>k.startsWith('lexiday-shell-')).length,1);
 fs.mkdirSync('outputs/offline-recovery',{recursive:true});await page.screenshot({path:'outputs/offline-recovery/recovered.png'});console.log(JSON.stringify({oldVersionReproduced:'net::ERR_FAILED',recoveryPreservesProgress:true,recoveryPreservesAudio:true,reloads:3,offlineReload:true,canonicalRedirectEmulated:true}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}

