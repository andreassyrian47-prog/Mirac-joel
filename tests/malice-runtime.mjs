import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import fs from 'node:fs';
const b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']}),p=await b.newPage({viewport:{width:800,height:600}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const wrap=x=>Math.abs(Math.atan2(Math.sin(x),Math.cos(x)));
try{
 await p.addInitScript(()=>localStorage.setItem('hellbound-settings','{"quality":"low","executionCamera":true}'));await p.goto('http://localhost:5174/?test');await p.waitForFunction(()=>__hellbound?.testing);await p.evaluate(()=>{__hellbound.renderer.render=()=>{};requestAnimationFrame=()=>0;});await p.waitForTimeout(120);
 const step=async n=>p.evaluate(n=>__hellbound.testing.advanceCombat(n),n),state=()=>p.evaluate(()=>__hellbound.state);
 // 1) Run-in blend: the same attack started while sprinting dips deeper.
 const dip=async moving=>{await p.evaluate(()=>{__hellbound.testing.startMode('training');__hellbound.testing.combatReady();});await p.keyboard.press('u');if(moving){await p.keyboard.down('w');await step(.5);}await p.mouse.click(400,350);await step(.09);const y=await p.evaluate(()=>__hellbound.testing.hipsY());if(moving)await p.keyboard.up('w');await step(.5);return y;};
 const idle=await dip(false),rushed=await dip(true);assert.ok(rushed<idle-.012,`rushed ${rushed.toFixed(4)} should dip below idle ${idle.toFixed(4)}`);
 // 2) Spellweave steering: a cast begun facing away turns toward the threat during windup.
 await p.evaluate(()=>__hellbound.testing.startMode('training'));await p.keyboard.press('u');await p.evaluate(()=>{__hellbound.testing.position(0,18);__hellbound.testing.placeFoe(0,-8,14);});
 await step(.2);const yaw0=(await state()).playerYaw;const bearing=await p.evaluate(()=>{const s=__hellbound.state,f=s.foes[0];return Math.atan2(f.x-s.player.x,f.z-s.player.z);});
 const gap0=wrap(yaw0-bearing);await p.keyboard.press('q');await step(.25);const gap1=wrap((await state()).playerYaw-bearing);await step(.6);
 assert.ok(gap1<gap0-.18,`steer ${gap0.toFixed(2)}→${gap1.toFixed(2)}`);
 // 3) Impact dolly: fov pinches precisely at the execution impact and recovers.
 await p.evaluate(()=>__hellbound.testing.preview('soulbreaker'));const series=[];let impactT=0;for(let i=0;i<200;i++){await p.evaluate(()=>__hellbound.testing.advanceExecution(1/60));const s=await p.evaluate(()=>{const e=__hellbound.state.execution;return e?{t:e.time,fov:__hellbound.testing.executionSnapshot?.()?.cameraFov??null,impact:e.impactDone}:null;});if(!s)break;if(s.fov)series.push(s);if(s.impact&&!impactT)impactT=s.t;}
 assert.ok(impactT>0,'impact recorded');const lo=series.filter(x=>x.t<=impactT-.3).at(-1),hi=series.find(x=>x.t>=impactT+.3),at=series.filter(x=>Math.abs(x.t-impactT)<=.12).reduce((m,x)=>x.fov<m.fov?x:m,{fov:1e9});
 const interp=(lo.fov+hi.fov)/2;assert.ok(at.fov<interp-.35,`pulse digs below trajectory: ${at.fov.toFixed(2)} vs interp ${interp.toFixed(2)}`);
 // 4) The realm hunts back: Free Roam ambushes arrive and read as a pack.
 await p.evaluate(()=>__hellbound.testing.startMode('explore'));await step(.2);const before=(await state()).foes.length;await p.evaluate(()=>__hellbound.testing.maliceAmbush());await step(.3);const after=(await state()).foes.length;assert.ok(after>=before+3,`ambush ${before}→${after}`);assert.match(await p.locator('#waveBanner small, #waveBanner').first().innerText(),/REALM|HUNT/i);
 // Preservation gates.
 await p.evaluate(()=>__hellbound.testing.startMode('training'));await p.keyboard.press('h');await p.keyboard.press('v');assert.equal(await p.locator('.execution-row').count(),49);await p.keyboard.press('Escape');await p.keyboard.down('r');assert.equal(await p.locator('.wheel-slice').count(),24);await p.keyboard.up('r');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('tests/malice-runtime-results.json',JSON.stringify({runBlend:{idle,rushed},castSteer:{gap0,gap1},impactDolly:{impactT,lo:lo?.fov,hi:hi?.fov,interp,min:at?.fov},ambush:{before,after},preserved:{executions:49,powers:24},errors},null,2));
 console.log(JSON.stringify({runBlend:{idle,rushed},castSteer:{gap0,gap1},impactDolly:{atImpact:impactT,lo:lo?.fov,hi:hi?.fov,min:at?.fov},ambush:{before,after},errors}));
}finally{await b.close();}
