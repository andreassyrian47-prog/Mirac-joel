import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import fs from 'node:fs';
const b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']}),p=await b.newPage({viewport:{width:800,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.addInitScript(()=>localStorage.setItem('hellbound-settings','{"quality":"low"}'));await p.goto('http://localhost:5174/?test');await p.waitForFunction(()=>__hellbound?.testing);await p.evaluate(()=>{__hellbound.renderer.render=()=>{};requestAnimationFrame=()=>0;});await p.waitForTimeout(120);
 const step=async n=>p.evaluate(n=>__hellbound.testing.advanceCombat(n),n),state=()=>p.evaluate(()=>__hellbound.state);
 // 1) Whip timing preserves cadence: three actual-contact stance cancels still chain.
 await p.evaluate(()=>__hellbound.testing.startMode('training'));await p.keyboard.press('u');await p.keyboard.press('Tab');
 for(let i=0;i<3;i++){await p.mouse.down();await p.mouse.up();await step((await state()).actionDuration*.62);await p.keyboard.press('z');assert.equal((await state()).flow,i+1);}
 // 2) Coup de grâce: rupture-kill corpse travels measurably further than a light tap.
 const killTravel=async kind=>{await p.evaluate(()=>{__hellbound.testing.startMode('training');__hellbound.testing.combatReady();});await p.keyboard.press('u');await p.evaluate(()=>__hellbound.testing.revelSlay());await p.keyboard.press('Tab');
  if(kind==='coup')await p.mouse.click(400,350,{button:'right'});else await p.mouse.click(400,350);
  await step(.45);const s0=await p.evaluate(()=>__hellbound.testing.physicsSnapshot());await step(.4);const s1=await p.evaluate(()=>__hellbound.testing.physicsSnapshot());
  const killed=await p.evaluate(()=>__hellbound.state.foes.length===0&&__hellbound.state.physics.bodies>0);
  const hip0=s0[0]?.body?.particles?.[0]||[0,0,0],hip1=s1[0]?.body?.particles?.[0]||[0,0,0];
  return {kind,killed,dist:Math.hypot(hip1[0]-hip0[0],hip1[1]-hip0[1],hip1[2]-hip0[2])};};
 const coup=await killTravel('coup'),tap=await killTravel('tap');
 assert.ok(coup.killed,'coup died with a physical body');assert.ok(tap.killed,'tap died with a physical body');
 assert.ok(coup.dist>.35,'coup corpse travels: '+coup.dist.toFixed(3));assert.ok(coup.dist>tap.dist*1.25,`coup ${coup.dist.toFixed(3)} vs tap ${tap.dist.toFixed(3)}`);
 // 3) Dressing pass is live: candle fire count and added collision from wayfires/trees.
 const dress=await p.evaluate(()=>({...__hellbound.testing.revelStats(),obstacles:__hellbound.testing.obstacles().length}));
 assert.ok(dress.fires>=16,'candle flames registered: '+dress.fires);assert.ok(dress.obstacles>40,'dressing adds physicality: '+dress.obstacles);
 // 4) Preservation gates: full catalog and wheel still intact.
 await p.keyboard.press('h');await p.keyboard.press('v');assert.equal(await p.locator('.execution-row').count(),49);await p.keyboard.press('Escape');await p.keyboard.down('r');assert.equal(await p.locator('.wheel-slice').count(),24);await p.keyboard.up('r');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('tests/revel-runtime-results.json',JSON.stringify({whipCadence:'3 actual-contact stance cancels preserved',coup,tap,dressing:dress,preserved:{executions:49,powers:24},errors},null,2));
 console.log(JSON.stringify({coup,tap,dressing:dress,errors}));
}finally{await b.close();}
