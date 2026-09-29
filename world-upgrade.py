from pathlib import Path
p=Path('src/main.js');s=p.read_text()
needle='// Bake architecture by material;'
world='''// Connected districts give the hunt room to move beyond the central court.
const districts=[{name:'Cathedral of Cinders',x:0,z:-4},{name:'The Pale Necropolis',x:-53,z:18},{name:'Cinderwatch Bastion',x:53,z:-18},{name:'The Hollow Grove',x:15,z:62}];
const shrines=[];
for(let i=1;i<districts.length;i++){
 const d=districts[i];
 for(let step=10;step<Math.hypot(d.x,d.z);step+=3){const f=step/Math.hypot(d.x,d.z);for(let side of [-1,0,1]){let b=box(scene,side===0?edgeStone:darkstone,d.x*f+side*1.9,.015,d.z*f,1.75,.08,2.7);b.rotation.y=Math.atan2(d.x,d.z)+rr(-.05,.05);}}
 cylinder(scene,darkstone,d.x,-.035,d.z,11,11,.13,48);
 for(let j=0;j<2;j++){const ring=mesh(new THREE.TorusGeometry(3+j*6,.04,4,60),edgeStone,scene,d.x,.075,d.z);ring.rotation.x=-Math.PI/2;}
 const g=new THREE.Group();g.position.set(d.x,0,d.z);scene.add(g);
 cylinder(g,stone,0,.3,0,1.4,1.7,.6,6);cylinder(g,obsidian,0,.9,0,.65,.9,.8,6);
 const diamond=mesh(new THREE.OctahedronGeometry(.48),i===1?ghostGlow:i===2?ember:purpleGlow,g,0,1.95,0);diamond.userData.dynamic=true;
 for(let k=0;k<3;k++){let a=k*TAU/3;horn(g,[[Math.cos(a),.5,Math.sin(a)],[Math.cos(a)*1.2,1.6,Math.sin(a)*1.2],[Math.cos(a)*.65,2.65,Math.sin(a)*.65]],.11,bone);}
 shrines.push({x:d.x,z:d.z,diamond,usedWave:-1});
 if(i===1){for(let j=0;j<22;j++){const a=j*TAU/22,r=rr(5,12),x=d.x+Math.sin(a)*r,z=d.z+Math.cos(a)*r;let slab=box(scene,stone,x,.18,z,.9,.35,1.8);slab.rotation.y=a;let grave=box(scene,edgeStone,x,.85,z-.65,.65,1.4,.22);grave.rotation.z=rr(-.2,.2);}gothicArch(d.x,d.z-11,7,5);column(d.x-4,d.z-11,5,true);column(d.x+4,d.z-11,5,true);}
 if(i===2){for(let side of [-1,1]){column(d.x+side*9,d.z-8,15);column(d.x+side*9,d.z+8,12,true);box(scene,stone,d.x+side*9,3.2,d.z,1.5,6.4,14);gothicArch(d.x+side*9,d.z,8,6,Math.PI/2);}brazier(d.x-5,d.z-5);brazier(d.x+5,d.z-5);}
 if(i===3){for(let j=0;j<12;j++){let a=j*TAU/12;deadTree(d.x+Math.sin(a)*rr(8,14),d.z+Math.cos(a)*rr(8,14),rr(1.1,1.7));}for(let j=0;j<7;j++){let a=j*TAU/7;const m=mesh(icoG,darkstone,scene,d.x+Math.sin(a)*7,1.6,d.z+Math.cos(a)*7,.65,2.3,.8);m.rotation.z=rr(-.15,.15);}}
}
function commune(){if(mode!=='game'||paused||wheelOpen||finisher)return;const s=shrines.find(s=>Math.hypot(s.x-player.root.position.x,s.z-player.root.position.z)<4);if(!s){notify('Approach a glowing shrine to commune');return;}if(s.usedWave===wave){notify('This shrine will awaken with the next wave');return;}s.usedWave=wave;health=Math.min(100,health+30);energy=Math.min(100,energy+40);ring(new THREE.Vector3(s.x,0,s.z),0xa7dabf,5,.9);burst(new THREE.Vector3(s.x,1.6,s.z),0xa7dabf,70,5,1.1);actionText('SOUL COMMUNION');tone(250,.7,'sine',.09,80);}
'''
assert needle in s;s=s.replace(needle,world+'\n'+needle)
s=s.replace("!fires.includes(o)&&!o.material.transparent", "!fires.includes(o)&&!o.userData.dynamic&&!o.material.transparent")
s=s.replace("r=rr(66,110)","r=rr(108,153)")
s=s.replace("if(r>59){pos.x*=59/r;pos.z*=59/r", "if(r>85){pos.x*=85/r;pos.z*=85/r")
s=s.replace("if(e.root.position.length()>58){e.root.position.x*=.6;e.root.position.z*=.6}", "if(e.root.position.length()>83){const r=Math.hypot(e.root.position.x,e.root.position.z);e.root.position.x*=82/r;e.root.position.z*=82/r}")
s=s.replace("if(e.code==='KeyQ')castPower();", "if(e.code==='KeyQ')castPower();if(e.code==='KeyG')commune();")
s=s.replace("if(energy<p.cost){notify", "if(energy<p.cost*(elapsed-lastMeleeHit<.8?.75:1)){notify")
s=s.replace("health=Math.max(0,health-amount);", "if(action?.type==='charge'){action=null;heavyHeld=false;}health=Math.max(0,health-amount);")
insert='''function updateCombatHUD(){
 const pp=player.root.position;
 const d=districts.reduce((a,b)=>Math.hypot(pp.x-b.x,pp.z-b.z)<Math.hypot(pp.x-a.x,pp.z-a.z)?b:a);
 if(currentDistrict!==d.name){if(currentDistrict)notify('DISCOVERED · '+d.name.toUpperCase());currentDistrict=d.name;}
 $('districtName').textContent=d.name;
 const bearing=((yaw*180/Math.PI)%360+360)%360;
 $('bearing').textContent=['N','NW','W','SW','S','SE','E','NE'][Math.round(bearing/45)%8]+'  /  '+Math.round(Math.abs(pp.x)).toString().padStart(2,'0')+' · '+Math.round(Math.abs(pp.z)).toString().padStart(2,'0');
 const hints=[];
 if(heavyHeld&&action?.type==='charge')hints.push('RELEASE RMB · '+(action.t>.95?'WORLD BREAKER':'CHARGED STRIKE'));
 else if(nearest(7)?.airborne)hints.push('LMB  JUGGLE   /   RMB  DIVING SLAM');
 else if(dodgeLink>0)hints.push('LMB  RIFT TALON');
 else if(comboStep===2&&elapsed-lastAttack<1.35)hints.push('RMB  REAPING CIRCLE');
 else if(comboStep===3&&elapsed-lastAttack<1.35)hints.push('RMB  JUDGEMENT HEEL');
 else if(elapsed-lastMeleeHit<.8)hints.push('Q  SPELLWEAVE · 25% LESS WRATH');
 const shrine=shrines.find(s=>Math.hypot(s.x-pp.x,s.z-pp.z)<4&&s.usedWave!==wave);
 if(shrine)hints.push('G  COMMUNE · RESTORE VITALITY');
 $('combatContext').textContent=hints.join('    /    ');
 $('chargeMeter').classList.toggle('hidden',action?.type!=='charge');
 $('chargeFill').style.width=(action?.type==='charge'?Math.min(100,action.t/1.2*100):0)+'%';
 $('imbuement').textContent=weaveTime>0?`${weaveSchool==='fire'?'CINDER CLAWS':weaveSchool==='mind'?'MINDREND CLAWS':'SOULDRINK CLAWS'}  ·  ${weaveTime.toFixed(1)}s`:riposte>0?'RIPOSTE READY':'';
 $('imbuement').style.color=weaveTime>0?cssColors[weaveSchool]:'#d8c197';
 $('styleCount').textContent=styleVariety.size>1?`${styleVariety.size} UNIQUE TECHNIQUES`:'';
}
'''
s=s.replace('function updateHUD(){',insert+'\nfunction updateHUD(){')
s=s.replace("gateLight.intensity=60+Math.sin(elapsed*1.5)*8;", "gateLight.intensity=60+Math.sin(elapsed*1.5)*8;shrines.forEach((s,i)=>{s.diamond.rotation.y=elapsed*.5;s.diamond.position.y=1.95+Math.sin(elapsed*2+i)*.12;});")
s=s.replace("'Chain light attacks into a heavy launcher, then strike again to slam airborne foes. Parry just before an attack lands to stagger your enemy. Finish weakened enemies to restore vitality.'", "'Mix light and heavy attacks to branch your combo. Hold heavy to charge; dodge then strike to close the gap. Cast immediately after a melee hit for spell-weaving. Expand the Combat Codex below for the full move list.'")
p.write_text(s)
p=Path('index.html');s=p.read_text()
s=s.replace('<section id="hud" class="hidden">','''<section id="hud" class="hidden"><div id="realmHUD"><small id="bearing">N / 00 · 08</small><span id="districtName">Cathedral of Cinders</span></div><div id="imbuement"></div><div id="combatContext"></div><div id="chargeMeter" class="hidden"><small>GATHERING WRATH</small><div><i id="chargeFill"></i></div></div>''')
s=s.replace('<div class="combo-track"><i id="comboFill"></i></div>', '<div class="combo-track"><i id="comboFill"></i></div><small id="styleCount"></small>')
s=s.replace('HEAVY / LAUNCH</span>', 'HEAVY / HOLD TO CHARGE</span>')
s=s.replace('<span>Launch / aerial slam</span>', '<span>Heavy / hold to charge</span>')
s=s.replace('<button id="resume" class="primary">','''<details id="advancedGuide"><summary>COMBAT CODEX <span>+</span></summary><div class="codex-moves"><div><kbd>L · L · R</kbd><span>Reaping Circle<small>Two claws into a 360° cleave.</small></span></div><div><kbd>L · L · L · R</kbd><span>Judgement Heel<small>Three lights into a ground-shattering kick.</small></span></div><div><kbd>HOLD RMB</kbd><span>World Breaker<small>Charge for one second, then release.</small></span></div><div><kbd>R → L → R</kbd><span>Ascendant Chain<small>Launch, juggle up to three times, then slam.</small></span></div><div><kbd>SPACE → L</kbd><span>Rift Talon<small>Dash, then strike to close the distance.</small></span></div><div><kbd>L → Q</kbd><span>Spellweave<small>Cast after a hit for 25% less wrath. Powers imbue your claws.</small></span></div><div><kbd>F</kbd><span>Perfect Parry<small>Counter melee attacks or reflect ranged hexes.</small></span></div><div><kbd>G</kbd><span>Soul Communion<small>Use a district shrine once each wave to restore resources.</small></span></div></div><p>L / R = left / right mouse button. Heavy blows break enemy will, opening an execution even above 60% health.</p></details><button id="resume" class="primary">''')
s=s.replace('VIEW ALL CONTROLS', 'COMBAT CODEX')
p.write_text(s)
p=Path('style.css');s=p.read_text();s+='''
/* Context-sensitive combat information stays quiet until an opportunity opens. */
#realmHUD{position:absolute;left:50%;top:86px;transform:translateX(-50%);text-align:center;min-width:240px;opacity:.86}#realmHUD small{display:block;font-size:7px;letter-spacing:3px;color:#b6a887}#realmHUD span{display:block;font:12px Cinzel,Georgia,serif;letter-spacing:1.5px;margin-top:9px;color:#c4c8b5}#realmHUD:after{content:'';display:block;width:90px;height:1px;background:linear-gradient(90deg,transparent,#b0a47855,transparent);margin:10px auto}#imbuement{position:absolute;top:176px;left:4.2%;font-size:7px;letter-spacing:1.8px}#combatContext{position:absolute;left:50%;bottom:127px;transform:translateX(-50%);font-size:8px;letter-spacing:1.4px;color:#d9c59f;text-shadow:0 2px 6px #000;text-align:center;white-space:nowrap}#chargeMeter{position:absolute;left:50%;top:60%;transform:translateX(-50%);width:166px;text-align:center}#chargeMeter small{font-size:7px;letter-spacing:2px;color:#e5c38c}#chargeMeter>div{height:3px;background:#171b17c0;outline:1px solid #d6bc8930;outline-offset:3px;margin-top:12px}#chargeFill{height:100%;display:block;background:linear-gradient(90deg,#b95432,#ecd3a2);box-shadow:0 0 10px #d7843955}#styleCount{margin-top:8px!important;font-size:6px!important;letter-spacing:1px!important;color:#b3bda8!important}.modal-panel{max-height:90vh;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#786a4e #14201b}#advancedGuide{border-top:1px solid var(--line);margin:0 0 22px;padding-top:15px}#advancedGuide summary{display:flex;justify-content:space-between;cursor:pointer;font-size:8px;letter-spacing:2px;color:#c1ac87;list-style:none}#advancedGuide summary::-webkit-details-marker{display:none}#advancedGuide[open] summary{margin-bottom:22px}.codex-moves{display:grid;grid-template-columns:1fr 1fr;gap:20px 15px}.codex-moves>div{display:flex;flex-direction:column;gap:8px;align-items:flex-start}.codex-moves kbd{font-size:7px}.codex-moves span{font:12px Cinzel,Georgia,serif;color:#d3c8ae}.codex-moves small{display:block;font:9px/1.6 Inter,Arial,sans-serif;color:#8f9d8b;margin-top:5px}#advancedGuide>p{font-size:9px;line-height:1.7;color:#b2a083;margin:20px 0 5px}@media(max-width:700px){#realmHUD{top:165px;min-width:190px}#realmHUD span{font-size:9px}#realmHUD small{font-size:6px}#imbuement{top:157px;font-size:6px;max-width:170px}#combatContext{bottom:120px;font-size:6px;letter-spacing:.8px;white-space:normal;width:90%}.codex-moves{gap:17px}#styleCount{display:none}}
''';p.write_text(s)
