import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';import fs from 'node:fs';
const b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']}),p=await b.newPage(),errors=[];
p.on('pageerror',e=>errors.push(e.message));
try{
 await p.addInitScript(()=>localStorage.setItem('hellbound-settings','{"quality":"low"}'));
 await p.goto('http://localhost:5174/?test');await p.waitForFunction(()=>__hellbound?.testing);
 await p.evaluate(()=>{requestAnimationFrame=()=>0;__hellbound.renderer.render=()=>{};});await p.waitForTimeout(100);
 const rhythm=await p.evaluate(async()=>{
  const {FINISHERS}=await import('/src/finishers.js'),{executionTime}=await import('/src/execution-timing.js'),{accentExecution}=await import('/src/execution-rhythm.js'),{impactWall}=await import('/src/gravitas.js');
  return FINISHERS.map(d=>{let prev=0,minRate=Infinity,maxRate=0,changed=false;for(let i=1;i<=2000;i++){const u=i/2000,t=executionTime(u*d.duration,d)/d.duration;minRate=Math.min(minRate,(t-prev)*2000);maxRate=Math.max(maxRate,(t-prev)*2000);changed||=Math.abs(accentExecution(u,d)-u)>1e-8;prev=t;}return{id:d.id,minRate,maxRate,changed,impactError:Math.abs(executionTime(impactWall(d),d)-d.impact*d.duration) /* GRAVITAS: the kill lands exactly on the impact wall */,end:prev};});
 });
 assert.equal(rhythm.length,49);assert.ok(rhythm.every(r=>r.minRate>0&&Number.isFinite(r.maxRate)&&r.impactError<1e-8&&r.end===1));
 const carry=await p.evaluate(()=>{
  const t=__hellbound.testing;t.preview('grave-driver');let prev=null,lastGrip=null,release=null,maxError=0,heldFrames=0;
  for(let i=0;i<360;i++){t.advanceExecution(1/60);const s=t.executionSnapshot();if(!s)continue;const grip=s.grips.find(g=>g.type==='ankle-carry');if(grip){heldFrames++;maxError=Math.max(maxError,grip.error);lastGrip=s.clock;if(grip.weight!==1)throw Error('Fading a held ankle before release');}
   if(s.body&&!release){release={clock:s.clock,gap:s.clock-lastGrip,maxAnatomyStep:Math.max(...s.victimAnatomy.map((pt,k)=>Math.hypot(...pt.map((x,j)=>x-prev.victimAnatomy[k][j]))))};}prev=s;
  }return{heldFrames,maxError,release,ended:!__hellbound.state.finisher};
 });
 assert.ok(carry.heldFrames>15&&carry.maxError<.001&&carry.ended);assert.ok(carry.release.gap<.035&&carry.release.maxAnatomyStep<.85);
 assert.deepEqual(errors,[]);fs.writeFileSync('tests/dread-contracts-results.json',JSON.stringify({rhythm,carry,errors},null,2));
 console.log('49 monotonic timelines / impact wall and end clocks; ankle hold → physics continuity PASS',carry);
}finally{await b.close();}
