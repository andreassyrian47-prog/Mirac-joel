import { chromium } from 'playwright';
const b=await chromium.launch();const p=await b.newPage();const req=[];
p.on('request',r=>{if(!r.url().startsWith('file://'))req.push(r.url())});
await p.goto('file:///home/user/hellbound/HELLBOUND.html');
await p.waitForTimeout(2500);
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
const boot=await p.evaluate(()=>document.querySelector('#tag')?.textContent||document.title);
console.log('BOOT:',boot.trim(),'OUTBOUND:',req.length,req.slice(0,3),'ERRORS:',errs.length,errs.slice(0,2));
await b.close();
