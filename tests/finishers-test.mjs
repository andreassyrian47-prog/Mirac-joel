import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.addInitScript(()=>localStorage.setItem('hellbound-settings',JSON.stringify({quality:'low',finisher:'auto'})));
await page.goto((process.env.GAME_URL||'http://localhost:5174')+'/?test');await page.waitForFunction(()=>window.__hellbound?.testing?.executionCatalog);
await page.evaluate(()=>{window.savedRender=window.__hellbound.renderer.render;window.__hellbound.renderer.render=()=>{}});
const all=await page.evaluate(()=>window.__hellbound.testing.executionCatalog());assert.equal(all.length,23);const defs=all.filter(d=>!d.bossOnly);assert.equal(defs.length,20);
await page.click('#menuFinishers');assert.equal(await page.locator('#finisherGrimoire').isVisible(),true);
await page.screenshot({path:'/home/user/finisher-grimoire.png'});
const hashes=new Set();
for(const boss of [false,true])for(const d of defs){
 const result=await page.evaluate(({id,boss,duration})=>{
  const game=window.__hellbound,old=game.state;game.testing.preview(id,boss);const began=game.state.execution;const trace=game.testing.advanceExecution(duration+.9);const after=game.state;
  let finite=true;game.scene.traverse(o=>{if(![...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()].every(Number.isFinite))finite=false});
  return {began,ended:!after.finisher,unchanged:old.score===after.score&&old.health===after.health&&old.energy===after.energy&&old.wave===after.wave&&old.enemies===after.enemies,positionRestored:JSON.stringify(old.player)===JSON.stringify(after.player),panel:after.panelOpen,finite,trace};
 },{id:d.id,boss,duration:d.duration});
 assert.equal(result.began.id,d.id);assert.equal(result.began.preview,true);assert.ok(result.ended,`${d.id} completion`);assert.ok(result.unchanged,`${d.id} resource safety`);assert.ok(result.positionRestored,`${d.id} restore`);assert.equal(result.panel,'finishers');assert.ok(result.finite,`${d.id} transforms`);
 for(const frame of result.trace)for(const value of Object.values(frame))assert.ok(typeof value==='number'?Number.isFinite(value):value.every(Number.isFinite));
 if(!boss)hashes.add(createHash('sha256').update(JSON.stringify(result.trace)).digest('hex'));
 console.log(`${boss?'BOSS':'NORMAL'} PREVIEW PASS: ${d.name}`);
}
assert.equal(hashes.size,20,'All choreographies have different body motion traces');
await page.locator('[data-finisher-filter="ghost"]').click();assert.equal(await page.locator('.execution-row').count(),4);await page.locator('[data-execution="soul-sever"]').click();await page.click('#equipExecution');assert.equal(await page.evaluate(()=>window.__hellbound.state.equippedFinisher),'soul-sever');await page.click('#previewExecution');await page.keyboard.press('Escape');assert.equal(await page.locator('#finisherGrimoire').isVisible(),true);console.log('Filtering, equipping and preview cancellation PASS');
await page.keyboard.press('v');await page.click('#start');
await page.evaluate(()=>{const t=window.__hellbound.testing;t.setWave(1);t.restore();t.position(0,10.4);t.placeFoe(0,0,8);t.damage(0,45,null);});await page.keyboard.press('e');assert.equal(await page.evaluate(()=>window.__hellbound.state.execution.id),'soul-sever');await page.evaluate(()=>window.__hellbound.testing.advanceExecution(4));console.log('Equipped finisher through actual E binding PASS');
for(const d of defs){
 const result=await page.evaluate(({id,duration})=>{
  const game=window.__hellbound;game.testing.setWave(1);game.testing.restore();const before=game.state;const started=game.testing.executeVariant(id,false);game.testing.advanceExecution(duration+.9);const after=game.state;
  return {started,ended:!after.finisher,killed:before.enemies-after.enemies,reward:after.score-before.score,logged:after.completedExecutions.at(-1)};
 },{id:d.id,duration:d.duration});
 assert.ok(result.started);assert.ok(result.ended);assert.equal(result.killed,1);assert.equal(result.reward,465);assert.equal(result.logged,d.id);console.log('LIVE EXECUTION PASS:',d.name);
}
console.log('ERRORS',errors);await browser.close();assert.equal(errors.length,0);
