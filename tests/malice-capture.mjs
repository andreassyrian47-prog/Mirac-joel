import {chromium} from '@playwright/test';import fs from 'node:fs';
const b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>localStorage.setItem('hellbound-settings',JSON.stringify({quality:'low'})));
await p.goto('http://localhost:5174/?test');await p.waitForFunction(()=>__hellbound?.testing);
await p.screenshot({path:'progress/evidence/malice-menu.png'});
await p.evaluate(()=>{window.savedRender=__hellbound.renderer.render.bind(__hellbound.renderer);__hellbound.renderer.render=()=>{};requestAnimationFrame=()=>0;});
// run-in attack blend
await p.evaluate(()=>{__hellbound.testing.startMode('explore');__hellbound.testing.combatReady();});await p.keyboard.press('u');
await p.keyboard.down('w');await p.evaluate(()=>__hellbound.testing.advanceCombat(.6));await p.mouse.click(640,380);await p.evaluate(()=>__hellbound.testing.advanceCombat(.12));
await p.evaluate(()=>{__hellbound.renderer.render=savedRender;__hellbound.testing.drawFrame();__hellbound.renderer.render=()=>{};});
await p.screenshot({path:'progress/evidence/malice-runin.png'});await p.keyboard.up('w');
// realm-hunts ambush
await p.evaluate(()=>{__hellbound.testing.maliceAmbush();__hellbound.testing.advanceCombat(.55);});
await p.evaluate(()=>{__hellbound.renderer.render=savedRender;__hellbound.testing.drawFrame();__hellbound.renderer.render=()=>{};});
await p.screenshot({path:'progress/evidence/malice-ambush.png'});
console.log('captures done',errors);await b.close();
