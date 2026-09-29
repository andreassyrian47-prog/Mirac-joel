import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import fs from 'node:fs';
const b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']}),p=await b.newPage({viewport:{width:800,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.addInitScript(()=>localStorage.setItem('hellbound-settings','{"quality":"low","executionCamera":true}'));await p.goto('http://localhost:5174/?test');await p.waitForFunction(()=>__hellbound?.testing);await p.evaluate(()=>{__hellbound.renderer.render=()=>{};requestAnimationFrame=()=>0;});await p.waitForTimeout(120);
 const step=async n=>p.evaluate(n=>__hellbound.testing.advanceCombat(n),n),state=()=>p.evaluate(()=>__hellbound.state);
 // 1) Style consequence: the same opening hit yields more souls at high style; rank ceremony fires; conduit refunds wrath.
 const strike=async()=>{await p.evaluate(()=>{__hellbound.testing.startMode('training');__hellbound.testing.combatReady();});await p.keyboard.press('u');await step(.4);await p.mouse.click(400,350);await step(.5);return(await state()).score;};
 const base=await strike();
 await p.evaluate(()=>__hellbound.testing.setStyle(150));await p.evaluate(()=>{__hellbound.testing.startMode('training');__hellbound.testing.combatReady();});await p.evaluate(()=>__hellbound.testing.setStyle(150));await p.keyboard.press('u');await step(.4);await p.mouse.click(400,350);await step(.5);
 const s1=await state();assert.ok(s1.eclipse.multiplier>=2.7,`multiplier ${s1.eclipse.multiplier}`);assert.equal(s1.eclipse.rank,'S');assert.ok(s1.eclipse.rankUpAt>=0,'rank-up ceremony flagged');
 const styled=s1.score;assert.ok(styled>base*1.6,`styled ${styled} vs base ${base}`);
 // Style conduit: cast at style ≥ 80 refunds wrath.
 await p.evaluate(()=>{__hellbound.testing.combatReady();__hellbound.testing.setStyle(100);});const e0=(await state()).energy;await p.keyboard.press('q');await p.waitForTimeout(80);
 const castSnap=await p.evaluate(()=>({energy:__hellbound.state.energy,action:__hellbound.state.action,toast:document.querySelector('#toast').textContent}));await step(.2);
 assert.equal(castSnap.action,'cast',`cast must start (got ${castSnap.action})`);const spent=e0-castSnap.energy;assert.ok(spent>0&&spent<=26*.75,`conduit net spend ${spent}`);assert.match(castSnap.toast,/STYLE CONDUIT/,`conduit toast "${castSnap.toast}"`);
 // 2) Chain executions: execute one of two weakened foes, then chain into the second at 1.7× pace.
 await p.evaluate(()=>{__hellbound.testing.startMode('explore');__hellbound.testing.combatReady();});await step(1.4);
 let foeN=(await state()).foes.length;assert.ok(foeN>=2,`patrol foes ${foeN}`);
 await p.evaluate(()=>{__hellbound.testing.weakenFoes();__hellbound.testing.placeFoe(0,1.5,7);__hellbound.testing.placeFoe(1,-1.5,7);__hellbound.testing.combatReady();});await step(.15);
 const untilImpact=async()=>{let n=0;for(let i=0;i<600;i++){n++;const s=await p.evaluate(()=>{__hellbound.testing.advanceExecution(1/60);const f=__hellbound.state.execution;return f?{impact:f.impactDone,chain:f.chain}:null;});if(!s)break;if(s.impact)break;}return n;};
 await p.keyboard.press('e');await step(.1);const t1=await untilImpact();await p.evaluate(()=>__hellbound.testing.advanceExecution(6));
 const chainReady=(await state()).chainReady;assert.ok(chainReady,'chain window should open after the first execution');
 await p.keyboard.press('e');await step(.05);const chainFlag=(await state()).execution?.chain;assert.equal(chainFlag,true,'second execution must be flagged chain');
 const t2=await untilImpact();await p.evaluate(()=>__hellbound.testing.advanceExecution(6));
 assert.ok(t2<t1*.8,`chain pace ${t2} vs first ${t1} frames`);
 const foesAfter=(await state()).foes.filter(f=>f.boss||!f.small);
 // 3) Bestiary fidelity: each kind wears a distinct silhouette kit, boss the grandest.
 const kits=await p.evaluate(()=>['revenant','stalker','oracle','warden','king'].map(k=>__hellbound.testing.kindKit(k)));
 const details=Object.fromEntries(kits.map(k=>[k.kind,k.detail]));
 assert.ok(details.revenant>=7,`revenant ${details.revenant}`);assert.ok(details.king>=details.revenant+8,`king ${details.king} vs revenant ${details.revenant}`);
 assert.equal(new Set(Object.values(details)).size,5,`kits must be distinct ${JSON.stringify(details)}`);
 // 4) Menu ascension: version tag + living orbital backdrop.
 await p.goto('http://localhost:5174/?test');await p.waitForFunction(()=>__hellbound?.testing);
 const tag=await p.locator('#versionTag').innerText();assert.match(tag,/GRAVITAS V0\.20\.0/);
 const cam0=await p.evaluate(()=>__hellbound.state.cameraPosition);await p.waitForTimeout(1400);const cam1=await p.evaluate(()=>__hellbound.state.cameraPosition);
 const az=p_c=>Math.atan2(p_c[0],p_c[2]);assert.ok(Math.abs(az(cam1)-az(cam0))>.0008,`menu camera orbits ${JSON.stringify(cam0)} → ${JSON.stringify(cam1)}`);
 // Preservation gates.
 await p.evaluate(()=>{__hellbound.renderer.render=()=>{};requestAnimationFrame=()=>0;__hellbound.testing.startMode('training');});await p.keyboard.press('h');await p.keyboard.press('v');assert.equal(await p.locator('.execution-row').count(),49);await p.keyboard.press('Escape');await p.keyboard.down('r');assert.equal(await p.locator('.wheel-slice').count(),24);await p.keyboard.up('r');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('tests/torment-runtime-results.json',JSON.stringify({style:{base,styled,multiplier:s1.eclipse.multiplier,rankUp:s1.eclipse.rankUpAt,conduitSpent:spent},chain:{window:chainReady,firstFrames:t1,chainFrames:t2},kits:details,menuOrbit:{cam0,cam1,tag},preserved:{executions:49,powers:24},errors},null,2));
 console.log(JSON.stringify({style:{base,styled,mult:s1.eclipse.multiplier,conduitSpent:spent},chain:{t1,t2},kits:details,menu:{cam0,cam1},errors}));
}finally{await b.close();}
