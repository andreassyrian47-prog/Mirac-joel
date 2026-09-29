import {chromium} from '@playwright/test';
import fs from 'node:fs';
const path='/home/user/hellbound/.cache/motion-frames';fs.mkdirSync(path,{recursive:true});
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:960,height:640}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await p.addInitScript(()=>localStorage.setItem('hellbound-settings',JSON.stringify({quality:'low'})));await p.goto((process.env.GAME_URL||'http://localhost:5174')+'/?test');await p.waitForFunction(()=>window.__hellbound?.testing?.studioBegin);await p.evaluate(()=>{window.savedRender=window.__hellbound.renderer.render;window.__hellbound.renderer.render=()=>{};window.requestAnimationFrame=()=>0});await p.waitForTimeout(100);
const clips=[
 {title:'Locomotion',caption:'World-space stance feet · toe-off · counter-rotating hips',spec:{kind:'walk',speed:6},length:2.5},
 {title:'Stop and turn',caption:'Swing-foot catch · staggered turning steps · head lag',spec:{kind:'transition'},length:3.2},
 {title:'Sprint',caption:'Longer flight phase · bent elbows · trailing wings',spec:{kind:'sprint',speed:8.8},length:2.5},
 {title:'Claw strike',caption:'Coil · hip-led contact · wrist follow-through',spec:{kind:'light',step:1,duration:.49},length:1.8},
 {title:'Rising uppercut',caption:'Rear-leg load · extension · overshoot · recoil',spec:{kind:'heavy',duration:.82},length:1.8},
 {title:'Spinning heel',caption:'Chambered knee · extension · pivot · catch',spec:{kind:'light',step:3,duration:.68},length:1.8},
 {title:'Ground slam',caption:'Tuck · suspension · impact compression · recovery',spec:{kind:'slam',duration:.96},length:1.8},
 {title:'Directional evade',caption:'Push-off · low travel · leading-foot catch',spec:{kind:'dodge',duration:.46,direction:[1,0,0]},length:1.8},
 {title:'Hellnova',caption:'Gather inward · expand · settle',spec:{kind:'cast',powerIndex:5,duration:.85},length:1.8},
 {title:'Telekinesis',caption:'Reach · close the grip · lift · release',spec:{kind:'cast',powerIndex:7,duration:.85},length:1.8},
 {title:'Revenant Army',caption:'Grounded invocation · rising summons gesture',spec:{kind:'cast',powerIndex:14,duration:.85},length:1.8},
 {title:'Ascension',caption:'Compression · unfurling · suspension · landing',spec:{kind:'ascend',duration:1.1},length:2}
];
let n=0;const manifest=[];
for(const clip of clips){await p.evaluate(()=>window.__hellbound.testing.studioBegin());const count=Math.round(clip.length*24);for(let j=0;j<count;j++){const time=clip.spec.duration?Math.max(0,j/24-.2):j/24;const data=await p.evaluate(({spec,time})=>{if(spec.kind==='transition'){const u=Math.max(0,Math.min(1,(time-1.6)/.8));spec={kind:time<1?'walk':'idle',speed:6,position:[0,.06,Math.min(time,1)*6],yaw:Math.PI*u*u*(3-2*u)};}window.__hellbound.testing.studioSample(spec,time,1/24);window.__hellbound.renderer.render=window.savedRender;const url=window.__hellbound.testing.studioFrame();window.__hellbound.renderer.render=()=>{};return url;},{spec:clip.spec,time});fs.writeFileSync(`${path}/${String(n).padStart(5,'0')}.png`,Buffer.from(data.split(',')[1],'base64'));manifest.push({n,title:clip.title,caption:clip.caption,time});n++;}await p.evaluate(()=>window.__hellbound.testing.studioEnd());console.log('Rendered',clip.title,count,'frames');}
fs.writeFileSync(`${path}/manifest.json`,JSON.stringify(manifest));console.log('ERRORS',errors);await b.close();if(errors.length)process.exit(1);
