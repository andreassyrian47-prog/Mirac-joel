import {chromium} from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='.cache/world-motion';fs.mkdirSync(dir,{recursive:true});
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:960,height:640}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>localStorage.setItem('hellbound-settings',JSON.stringify({quality:'low'})));
await p.goto((process.env.GAME_URL||'http://localhost:5174')+'/?test');await p.waitForFunction(()=>window.__hellbound?.testing?.actorFrame);
await p.evaluate(()=>{window.savedRender=window.__hellbound.renderer.render;window.__hellbound.renderer.render=()=>{};window.requestAnimationFrame=()=>0});await p.waitForTimeout(100);
let n=0;const manifest=[];
for(const [id,title,length] of [['soulbreaker','Soulbreaker',3.1],['furnace-heart','Furnace Heart',3.0],['gravity-coffin','Gravity Coffin',3.1],['wraith-procession','Wraith Procession',3.2]]){
 await p.evaluate(id=>window.__hellbound.testing.preview(id,false),id);
 for(let j=0;j<Math.floor(length*12);j++){
  const data=await p.evaluate(()=>{const g=window.__hellbound;g.testing.advanceExecution(1/12);g.renderer.render=window.savedRender;const data=g.testing.canvasFrame();g.renderer.render=()=>{};return data;});
  fs.writeFileSync(`${dir}/${String(n).padStart(5,'0')}.png`,Buffer.from(data.split(',')[1],'base64'));manifest.push({n,title,time:j/12,caption:id==='soulbreaker'?'Chest punch → dash behind → lift and ground slam':'In-world execution · actual cinematic camera'});n++;
 }
 console.log('CAPTURED',title);
}
for(const name of ['REVENANT','ASHEN WARDEN','CINDER STALKER','HOLLOW ORACLE','CINDER KING']){
 const index=await p.evaluate(name=>{const g=window.__hellbound;document.getElementById('start').click();g.testing.setWave(3);g.testing.restore();g.testing.position(0,10.4);const i=g.state.foes.findIndex(e=>e.kind===name);g.testing.placeFoe(i,0,name==='HOLLOW ORACLE'?0:8.4);g.testing.viewOnly(i);return i;},name);assert.ok(index>=0);
 const poses=[],states=new Set();const length=name==='REVENANT'?4.3:3.7;
 for(let j=0;j<Math.round(length*12);j++){
  const result=await p.evaluate(({index,j,name})=>{const g=window.__hellbound;if(name==='REVENANT'&&j===30)g.testing.damage(index,99999,null);g.testing.advanceCombat(1/12);g.renderer.render=window.savedRender;const data=g.testing.actorFrame(index);g.renderer.render=()=>{};return data;},{index,j,name});
  assert.ok(result.pose.every(Number.isFinite));poses.push(result.pose);states.add(result.dead?'death':result.stage||result.state);
  fs.writeFileSync(`${dir}/${String(n).padStart(5,'0')}.png`,Buffer.from(result.image.split(',')[1],'base64'));manifest.push({n,title:name,time:j/12,caption:result.dead?'Impact · collapse · loose-limb settling':'Enemy motion · '+(result.bossMove||'')+' '+(result.stage||result.state)});n++;
 }
 assert.ok(poses.some((pose,i)=>i&&pose.some((v,j)=>Math.abs(v-poses[i-1][j])>.001)));
 console.log('CAPTURED',name,[...states]);
}
fs.writeFileSync(`${dir}/manifest.json`,JSON.stringify(manifest));console.log('ERRORS',errors);await b.close();assert.equal(errors.length,0);
