if(process.env.GRAVITAS_OFF)globalThis.__GRAVITAS_OFF=true;if(process.env.GV_NO_EVENTS)globalThis.__GV_NO_EVENTS=true;if(process.env.GV_NO_ACTOR)globalThis.__GV_NO_ACTOR=true;if(process.env.GV_NO_VICTIM)globalThis.__GV_NO_VICTIM=true;
const {runExecution,FINISHERS,executionTime,impactWall}=await import('./gravitas-harness.mjs');
import fs from 'node:fs';
const only=process.argv[2];const results=[];let failures=0;
for(const d of FINISHERS){if(only&&d.id!==only)continue;
 for(const boss of d.bossOnly?[true]:d.smallOnly?[false]:[false,true]){
  const small=!!d.smallOnly;let r;
  try{r=runExecution(d.id,{boss,small,record:only?3:0});}catch(e){console.log('CRASH',d.id,boss,e.stack.split('\n').slice(0,4).join(' | '));failures++;continue;}
  let prev=0,mono=true,end=0;for(let i=1;i<=2000;i++){const t=executionTime(i/2000*d.duration,d)/d.duration;if(t<prev-1e-12)mono=false;prev=t;end=t;}
  const impactErr=Math.abs(executionTime(impactWall(d),d)/d.duration-d.impact);
  const audit=r.maxCore<=.04&&r.maxContact<=.2&&r.maxFraming<=.94;
  const ok=r.finished&&r.impacts===1&&!r.nonFinite&&mono&&end===1&&impactErr<1e-6&&Math.abs(r.impactSeconds-r.impactWall)<.05&&audit;
  if(!ok)failures++;
  results.push({...r,samples:undefined,mono,end,impactErr,boss,ok});
  console.log((ok?'ok  ':'FAIL'),d.id.padEnd(20),boss?'boss ':'     ','dur',d.duration.toFixed(2),'impact@',r.impactWall.toFixed(2),'measured',r.impactSeconds.toFixed(2),'total',r.seconds.toFixed(2),'rootStep',r.maxRootStep.toFixed(3),'core',r.maxCore.toFixed(3),'contact',r.maxContact.toFixed(3),(r.maxContact>.2?JSON.stringify(r.contactAt):''),'framing',r.maxFraming.toFixed(2),'wounds',r.wounds.length,'severs',r.severs.join(','),r.nonFinite?'NONFINITE':'',mono?'':'NONMONO',end===1?'':'END'+end,impactErr<1e-6?'':'IMPACTERR'+impactErr);
  if(only)fs.writeFileSync('.cache/gravitas-samples.json',JSON.stringify(r.samples,null,0));
 }
}
fs.writeFileSync(process.env.GRAVITAS_OFF?'.cache/gravitas-baseline.json':'tests/gravitas-harness-results.json',JSON.stringify({results,failures},null,1));
console.log(failures?`FAILURES ${failures}`:'ALL PASS',results.length,'runs');
process.exit(failures?1:0);
