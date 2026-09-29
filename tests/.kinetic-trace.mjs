import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:960,height:640}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await p.addInitScript(()=>localStorage.setItem('hellbound-settings',JSON.stringify({quality:'low',finisher:'auto'})));
await p.goto((process.env.GAME_URL||'http://localhost:5174')+'/?test');await p.waitForFunction(()=>window.__hellbound?.testing?.studioBegin);
await p.evaluate(()=>{window.savedRender=window.__hellbound.renderer.render;window.__hellbound.renderer.render=()=>{};window.requestAnimationFrame=()=>0;});await p.waitForTimeout(100);
const specs=[{kind:'idle',duration:3},{kind:'walk',duration:3,speed:6},{kind:'sprint',duration:3,speed:8.8},{kind:'strafe',duration:3,speed:4.2},...[1,2,3,4].map(step=>({kind:'light',step,duration:[0,.49,.52,.68,.82][step]})),...['heavy','cleave','stomp','slam','charged','lunge','aerial','parry','charge','tether','ascend','fireDash'].map(kind=>({kind,duration:1})),...[ [0,0,1],[0,0,-1],[-1,0,0],[1,0,0] ].map(direction=>({kind:'dodge',direction,duration:.46})),...Array.from({length:24},(_,powerIndex)=>({kind:'cast',powerIndex,duration:.85}))];
const results=[];const hashes=new Set();
for(const spec of specs){const frames=await p.evaluate(spec=>{const t=window.__hellbound.testing;t.studioBegin();const frames=[];for(let time=0;time<=spec.duration;time+=1/60)frames.push(t.studioSample(spec,time,1/60));t.studioEnd();return frames;},spec);
 for(const frame of frames)assert.ok(frame.pose.every(Number.isFinite),`${spec.kind}: finite transforms`);
 const changed=frames.some((f,i)=>i&&f.pose.some((n,j)=>Math.abs(n-frames[i-1].pose[j])>.0001));assert.ok(changed,`${spec.kind} not frozen`);
 if(spec.kind==='cast')hashes.add(createHash('sha256').update(JSON.stringify(frames.map(f=>f.pose))).digest('hex'));
 let maxPlantError=0,contacts=0,stationaryPairs=0,maxSlide=0;
 if(['walk','sprint','strafe'].includes(spec.kind))for(let i=30;i<frames.length;i++)for(let j=0;j<2;j++){const f=frames[i].motion.feet[j],old=frames[i-1].motion.feet[j];if(f.planted&&f.goal&&f.actual){contacts++;maxPlantError=Math.max(maxPlantError,Math.hypot(f.actual[0]-f.goal[0],f.actual[2]-f.goal[2]));if(old.planted&&old.goal&&Math.hypot(old.goal[0]-f.goal[0],old.goal[2]-f.goal[2])<.001){stationaryPairs++;maxSlide=Math.max(maxSlide,Math.hypot(old.actual[0]-f.actual[0],old.actual[2]-f.actual[2]));}}}
 if(contacts){assert.ok(stationaryPairs>20);assert.ok(maxPlantError<.065,`${spec.kind} plant error ${maxPlantError}`);assert.ok(maxSlide<.04,`${spec.kind} foot slide ${maxSlide}`);}
 results.push({spec,frames:frames.length,contacts,stationaryPairs,maxPlantError,maxSlide});console.log('MOTION PASS',spec.kind,spec.step??spec.powerIndex??spec.direction??'',contacts?{maxPlantError,maxSlide}:{});
}
assert.equal(hashes.size,24,'24 individual casting motion traces');
// Initial push-off, a swing-phase stop, then a half turn. No frame may teleport a foot.
const transitions=await p.evaluate(()=>{const t=window.__hellbound.testing,frames=[];t.studioBegin();
 for(let i=0;i<24;i++)frames.push(t.studioSample({kind:'idle'},i/60,1/60));
 for(let i=0;i<67;i++)frames.push(t.studioSample({kind:'walk',speed:6},i/60,1/60));
 for(let i=0;i<36;i++)frames.push(t.studioSample({kind:'idle',position:[0,.06,6.6]},i/60,1/60));
 for(let i=0;i<96;i++)frames.push(t.studioSample({kind:'idle',position:[0,.06,6.6],yaw:Math.PI*Math.min(1,i/42)},i/60,1/60));
 t.studioEnd();return frames;
});
let maxTransitionStep=0;for(let i=1;i<transitions.length;i++)for(let j=0;j<2;j++){const a=transitions[i].motion.feet[j].actual,b=transitions[i-1].motion.feet[j].actual;const jump=Math.hypot(...a.map((v,k)=>v-b[k]));if(jump>maxTransitionStep){maxTransitionStep=jump;if(jump>.3)console.log('JUMP',i,j,a,b,transitions[i].motion,transitions[i-1].motion);}}
assert.ok(maxTransitionStep<.3,`Foot transition discontinuity ${maxTransitionStep}`);
const settled=transitions[24+67+35];assert.ok(settled.motion.feet.every(f=>f.planted&&Math.abs(f.actual[1]-.156)<.05),'Both feet settle after stop');
const turned=transitions.at(-1);assert.ok(turned.motion.feet[0].actual[0]>.15&&turned.motion.feet[1].actual[0]<-.15,'Half-turn repositions feet rather than crossing legs');
console.log('Push-off, braking catch and half-turn continuity PASS',{maxTransitionStep});

// Native gameplay release event must not fire at input or fire again during recovery.
await p.evaluate(()=>{document.getElementById('start').click();const t=window.__hellbound.testing;t.setWave(1);t.restore();t.position(0,10.4);t.placeFoe(0,0,5);t.prepareCast(0);});await p.keyboard.press('q');
let s=await p.evaluate(()=>window.__hellbound.state);assert.equal(s.action,'cast');assert.equal(s.castReleased,false);assert.equal(s.projectileCount,0);
await p.evaluate(()=>window.__hellbound.testing.advanceCombat(.16));assert.equal(await p.evaluate(()=>window.__hellbound.state.castReleased),false);
await p.evaluate(()=>window.__hellbound.testing.advanceCombat(.2));assert.equal(await p.evaluate(()=>window.__hellbound.state.castReleased),true);console.log('Spell animation release synchronization PASS');
await p.evaluate(()=>{const t=window.__hellbound.testing;t.prepareCast(6);});await p.keyboard.press('q');s=await p.evaluate(()=>window.__hellbound.state);assert.equal(s.energy,82);await p.keyboard.press('f');assert.equal(await p.evaluate(()=>window.__hellbound.state.energy),100);assert.equal(await p.evaluate(()=>window.__hellbound.state.action),'parry');console.log('Pre-release cancellation refund PASS');
fs.writeFileSync('tests/kinetic-actions-results.json',JSON.stringify({results,maxTransitionStep,errors},null,2));console.log('ERRORS',errors);await b.close();assert.equal(errors.length,0);
