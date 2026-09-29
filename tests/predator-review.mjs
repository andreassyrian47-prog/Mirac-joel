import {chromium} from '@playwright/test';import fs from 'node:fs';
const dir='.cache/predator-film';fs.mkdirSync(dir,{recursive:true});
const b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']}),p=await b.newPage({viewport:{width:640,height:420}}),errors=[],manifest=[];let frame=0;
p.on('pageerror',e=>errors.push(e.message));
const save=(images,title)=>{const start=frame/30;for(const image of images)fs.writeFileSync(`${dir}/${String(frame++).padStart(5,'0')}.png`,Buffer.from(image.split(',')[1],'base64'));manifest.push({title,start,end:frame/30});fs.writeFileSync(`${dir}/manifest.json`,JSON.stringify(manifest));};
try{
 await p.addInitScript(()=>localStorage.setItem('hellbound-settings','{"quality":"low"}'));await p.goto('http://localhost:5174/?test');await p.waitForFunction(()=>__hellbound?.testing);
 await p.evaluate(()=>{savedRender=__hellbound.renderer.render;__hellbound.renderer.render=()=>{};requestAnimationFrame=()=>0;});await p.waitForTimeout(100);
 for(const camera of [[7.2,2.6,3.2],[.9,3.2,-7.5]]){
  const images=await p.evaluate(camera=>{const t=__hellbound.testing;t.studioBegin();const frames=[];for(let i=0;i<30;i++)t.studioSample({kind:'idle'},i/60,1/60);for(let i=0;i<150;i++){t.studioSample({kind:'walk',speed:2.2,camera},i/60,1/60);if(i%2===0){__hellbound.renderer.render=savedRender;frames.push(t.studioFrame());__hellbound.renderer.render=()=>{};}}t.studioEnd();return frames;},camera);save(images,manifest.length?'PROWL / REAR':'PROWL / SIDE');
 }
 const defs=await p.evaluate(()=>__hellbound.testing.executionCatalog());
 for(const id of ['grave-driver','hells-guillotine','furnace-heart','gravity-coffin','soul-sever']){
  const d=defs.find(d=>d.id===id),images=await p.evaluate(d=>{const t=__hellbound.testing;t.preview(d.id);const images=[];for(let i=0;i<Math.floor(d.duration*60)-1;i++){t.advanceExecution(1/60);if(i%2===0){__hellbound.renderer.render=savedRender;const image=t.executionStudyFrame();if(image)images.push(image);__hellbound.renderer.render=()=>{};}}return images;},d);save(images,d.name.toUpperCase());console.log(d.name,'captured');
 }
 fs.writeFileSync(`${dir}/manifest.json`,JSON.stringify(manifest));fs.writeFileSync('tests/predator-review-results.json',JSON.stringify({manifest,frames:frame,fps:30,errors},null,2));if(errors.length)throw Error(errors.join(';'));
}finally{await b.close();}
