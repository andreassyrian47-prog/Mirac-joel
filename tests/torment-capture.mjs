import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>localStorage.setItem('hellbound-settings',JSON.stringify({quality:'low'})));
await p.goto('http://localhost:5174/?test');await p.waitForFunction(()=>__hellbound?.testing);await p.waitForTimeout(1500);
await p.screenshot({path:'progress/evidence/torment-menu.png'});
await p.evaluate(()=>{window.savedRender=__hellbound.renderer.render.bind(__hellbound.renderer);__hellbound.renderer.render=()=>{};requestAnimationFrame=()=>0;});
// adorned king
await p.evaluate(()=>{__hellbound.testing.startMode('training');__hellbound.testing.combatReady();});await p.keyboard.press('y');
await p.evaluate(()=>{__hellbound.testing.advanceCombat(.4);const s=__hellbound.state;const f=s.foes[0];const c=__hellbound.state.cameraPosition;__hellbound.renderer.render=savedRender;__hellbound.testing.drawFrame();__hellbound.renderer.render=()=>{};});
await p.screenshot({path:'progress/evidence/torment-bestiary.png',timeout:60000});
// chain execution
await p.evaluate(()=>{__hellbound.testing.startMode('explore');__hellbound.testing.combatReady();});await p.evaluate(()=>__hellbound.testing.advanceCombat(1.4));
await p.evaluate(()=>{__hellbound.testing.weakenFoes();__hellbound.testing.placeFoe(0,1.5,7);__hellbound.testing.placeFoe(1,-1.5,7);__hellbound.testing.combatReady();});await p.evaluate(()=>__hellbound.testing.advanceCombat(.15));
await p.keyboard.press('e');for(let i=0;i<420;i++){const s=await p.evaluate(()=>{__hellbound.testing.advanceExecution(1/60);return __hellbound.state.finisher;});if(!s)break;}
await p.keyboard.press('e');await p.evaluate(()=>{for(let i=0;i<70;i++)__hellbound.testing.advanceExecution(1/60);});
await p.evaluate(()=>{__hellbound.renderer.render=savedRender;__hellbound.testing.drawFrame();__hellbound.renderer.render=()=>{};});
await p.screenshot({path:'progress/evidence/torment-chain.png',timeout:60000});
console.log('captures done',errors);await b.close();
