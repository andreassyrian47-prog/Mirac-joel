import {chromium} from '@playwright/test';
import fs from 'node:fs';
const path='.cache/brutality';fs.mkdirSync(path,{recursive:true});
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:960,height:640}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>localStorage.setItem('hellbound-settings',JSON.stringify({quality:'low'})));await p.goto('http://localhost:5174/?test');await p.waitForFunction(()=>window.__hellbound?.testing?.executionStudyFrame);await p.evaluate(()=>{window.savedRender=window.__hellbound.renderer.render;window.__hellbound.renderer.render=()=>{};window.requestAnimationFrame=()=>0});await p.waitForTimeout(100);
let n=0;const manifest=[];
for(const id of ['soulbreaker','grave-driver','gravity-coffin']){
 const def=await p.evaluate(id=>{const t=window.__hellbound.testing;t.preview(id);return t.executionCatalog().find(d=>d.id===id);},id);
 for(let i=0;i<Math.floor((def.duration-.07)*30);i++){
  const frame=await p.evaluate(()=>{const g=window.__hellbound;g.testing.advanceExecution(1/30);const state=g.testing.executionSnapshot();g.renderer.render=window.savedRender;const image=g.testing.executionStudyFrame();g.renderer.render=()=>{};return {state,image};});
  fs.writeFileSync(`${path}/${String(n).padStart(5,'0')}.png`,Buffer.from(frame.image.split(',')[1],'base64'));manifest.push({n,title:def.name,time:frame.state.t,state:frame.state});n++;
 }
 console.log('CAPTURED',id);
}
fs.writeFileSync(`${path}/manifest.json`,JSON.stringify(manifest));console.log('ERRORS',errors);await b.close();if(errors.length)process.exit(1);
