import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {FINISHERS} from '../src/finishers.js';
// Exercise the exact production shuffle selector over repeated full cycles.
const source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const selector=source.slice(source.indexOf('function nextExecution('),source.indexOf('function startExecution('));
const context=vm.createContext({FINISHERS,options:{finisher:'auto'},executionBag:[],completedExecutions:[],rand:Math.random});
vm.runInContext(selector,context);
let previous;
for(let cycle=0;cycle<5;cycle++){
 const picked=[];
 for(let i=0;i<20;i++){
  const peek=vm.runInContext('nextExecution(false).id',context);
  assert.equal(vm.runInContext('nextExecution(false).id',context),peek);
  const id=vm.runInContext('nextExecution(true).id',context);assert.equal(peek,id);
  if(i===0){assert.notEqual(id,previous);if(cycle===0)assert.equal(id,'soulbreaker');}
  context.completedExecutions.push(id);picked.push(id);previous=id;
 }
 assert.equal(new Set(picked).size,20);
}
console.log('100 selections: complete no-repeat cycles and stable HUD peeks PASS');
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1100,height:760}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{if(!localStorage.getItem('hellbound-settings'))localStorage.setItem('hellbound-settings',JSON.stringify({quality:'low'}));});
await p.goto('file:///home/user/hellbound/HELLBOUND.html');
await p.waitForFunction(()=>window.__hellbound);
await p.evaluate(()=>window.__hellbound.renderer.render=()=>{});
await p.click('#menuFinishers');assert.equal(await p.locator('.execution-row').count(),23);
await p.locator('[data-execution="meteor-burial"]').click();await p.click('#equipExecution');
await p.click('#bossPreview');await p.click('#previewExecution');
await p.waitForFunction(()=>!window.__hellbound.state.execution&&window.__hellbound.state.panelOpen==='finishers',{},{timeout:25000});
console.log('Production boss-size preview real-time completion PASS');
await p.reload();await p.waitForFunction(()=>window.__hellbound);
assert.equal(await p.evaluate(()=>window.__hellbound.state.equippedFinisher),'meteor-burial');
await p.evaluate(()=>window.__hellbound.renderer.render=()=>{});
await p.click('#menuFinishers');await p.click('#cycleExecutions');
assert.equal(await p.evaluate(()=>window.__hellbound.state.equippedFinisher),'auto');
await p.setViewportSize({width:900,height:650});
assert.equal(await p.locator('#previewExecution').isVisible(),true);
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
console.log('Saved selection, cycle toggle and compact catalog PASS');
console.log('ERRORS',errors);assert.equal(errors.length,0);await b.close();
