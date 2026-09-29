import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:800,height:600}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>localStorage.setItem('hellbound-settings',JSON.stringify({quality:'low'})));await p.goto((process.env.GAME_URL||'http://localhost:5174')+'/?test');await p.waitForFunction(()=>window.__hellbound?.testing);await p.evaluate(()=>{window.__hellbound.renderer.render=()=>{};window.requestAnimationFrame=()=>0});await p.waitForTimeout(100);
for(let i=0;i<15;i++){
 await p.evaluate(()=>{document.getElementById('start').click();const g=window.__hellbound;g.testing.setWave(1);g.testing.restore();g.testing.position(0,10.4);g.state.foes.forEach((_,i)=>g.testing.placeFoe(i,30+i,30));g.testing.prepareCast(0);});
 await p.keyboard.down('r');await p.evaluate(i=>document.querySelectorAll('#wheelSvg>g')[i].dispatchEvent(new MouseEvent('mouseenter')),i);await p.keyboard.up('r');await p.keyboard.press('q');
 let s=await p.evaluate(()=>window.__hellbound.state);assert.equal(s.action,'cast');assert.equal(s.castReleased,false);assert.ok(s.energy<100);assert.equal(s.weave,null);
 await p.evaluate(()=>window.__hellbound.testing.advanceCombat(.2));s=await p.evaluate(()=>window.__hellbound.state);assert.equal(s.castReleased,false);assert.equal(s.projectileCount,0);assert.equal(s.summonCount,0);
 await p.evaluate(()=>window.__hellbound.testing.advanceCombat(.25));s=await p.evaluate(()=>window.__hellbound.state);assert.ok(i===3?s.action==='fireDash':s.castReleased===true);assert.ok(s.weave);
 if(i===0)assert.equal(s.projectileCount,1);if(i===1)assert.equal(s.projectileCount,7);if(i===14)assert.equal(s.summonCount,3);
 await p.evaluate(()=>window.__hellbound.testing.advanceCombat(.7));s=await p.evaluate(()=>window.__hellbound.state);assert.equal(s.action,null);if(i===14)assert.equal(s.summonCount,3);
 console.log('NATIVE R / Q TIMED RELEASE PASS',i,s.selectedPower);
}
console.log('ERRORS',errors);await b.close();assert.equal(errors.length,0);
