// REQUIEM systems: run blessings, elemental reactions, Ascension, bosses and cartography.
const boonDefinitions=[
 {id:'fury',name:'The First Sin',school:'fire',tag:'VIOLENCE',desc:'All melee attacks, powers, and revenants deal 15% more base damage.',apply:()=>runMods.damage+=.15},
 {id:'heart',name:'Heart of the Pit',school:'fire',tag:'SURVIVAL',desc:'Gain 25 maximum vitality and immediately recover 35 vitality.',apply:()=>{runMods.maxHealth+=25;health=Math.min(runMods.maxHealth,health+35)}},
 {id:'well',name:'Endless Malice',school:'mind',tag:'SORCERY',desc:'Wrath regenerates 35% faster. Keep the forbidden arsenal flowing.',apply:()=>runMods.regen+=.35},
 {id:'stride',name:'The Unburied',school:'ghost',tag:'MOBILITY',desc:'Movement and sprinting become 12% faster. Outrun the hunt.',apply:()=>runMods.speed+=.12},
 {id:'life',name:'A Thirst Eternal',school:'ghost',tag:'SUSTAIN',desc:'Each soul you claim restores 4 additional vitality.',apply:()=>runMods.life+=4},
 {id:'reach',name:'Hands of Ruin',school:'mind',tag:'CONTROL',desc:'All melee attacks reach 15% farther. Command the space around you.',apply:()=>runMods.reach+=.15},
 {id:'curse',name:'Lasting Damnation',school:'mind',tag:'SPELLWEAVING',desc:'Your elemental claw imbuements last 50% longer after every cast.',apply:()=>runMods.duration+=.5},
 {id:'harvest',name:'The Tithe',school:'ghost',tag:'DOMINION',desc:'Earn 30% more kill score and immediately fill 35% of Ascension.',apply:()=>{runMods.souls+=.3;ascendCharge=Math.min(100,ascendCharge+35)}}
];
let boonChoices=[];
function resetRunSystems(){
 runMods={damage:1,maxHealth:100,regen:1,speed:1,life:0,duration:1,reach:1,souls:1};acquired=[];ascendCharge=ascendTime=0;upgradeOpen=false;intermission=-1;waypoint=null;panelOpen=null;
 ['boonScreen','realmMap','settingsPanel','bossHUD'].forEach(id=>$(id).classList.add('hidden'));
}
function openBoons(){
 if(mode!=='game')return;upgradeOpen=true;paused=true;heavyHeld=false;action=null;Object.keys(keys).forEach(k=>keys[k]=false);document.exitPointerLock?.();$('waveBanner').classList.remove('show');
 boonChoices=[...boonDefinitions].sort(()=>rand()-.5).slice(0,3);$('boonWave').textContent=`WAVE ${String(wave).padStart(2,'0')} CLEARED · ${kills} SOULS CLAIMED`;
 $('boonCards').innerHTML=boonChoices.map((b,i)=>`<button class="boon-card" data-boon="${i}"><small>${b.tag}</small><span class="boon-index">0${i+1}</span><div class="boon-symbol">${icon(b.school,b.school==='fire'?0:b.school==='mind'?7:12)}</div><h3>${b.name}</h3><p>${b.desc}</p><footer><span>CLAIM BLESSING</span><span>↗</span></footer></button>`).join('');
 $('boonCards').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>chooseBoon(i));$('boonScreen').classList.remove('hidden');tone(155,.8,'sine',.12,55);
}
function chooseBoon(index){
 if(!upgradeOpen||!boonChoices[index])return;const b=boonChoices[index];b.apply();acquired.push(b.name);upgradeOpen=false;paused=false;intermission=-1;waveDelay=2.3;$('boonScreen').classList.add('hidden');banner(b.name.toUpperCase(),'The pact is sealed. Your next hunt awaits.');tone(290,.45,'triangle',.08,95);tryLock();
}
function executionReady(e){return e.boss?e.hp<=e.maxHp*.2:(e.hp<=e.maxHp*.6||e.broken>0)}
function ascend(){
 if(mode!=='game'||paused||finisher||wheelOpen)return;if(ascendTime>0)return;if(ascendCharge<100){notify('Fill Ascension through damage, kills, and executions');return;}
 ascendCharge=0;ascendTime=9;invuln=1.2;energy=100;action=null;heavyHeld=false;hitArea(player.root.position,6,35,9,0,'fire');ring(player.root.position,0xffa259,10,1);ring(player.root.position,0xbd9bff,7,.75);burst(player.root.position.clone().add(new THREE.Vector3(0,1.5,0)),0xffad6c,110,9,1);actionText('ASCENSION · LET HEAVEN TREMBLE');recordMove('ASCENSION');tone(38,1.2,'sawtooth',.15,18);
}
function reactElements(e,amount,school){
 if(!school||(e.reactAt||0)>elapsed||e.dead)return amount;
 if(school==='mind'&&e.burn>0){
  e.reactAt=elapsed+1.8;e.burn=0;amount+=18;ring(e.root.position,0xb397ee,3.8,.55);burst(e.root.position.clone().add(new THREE.Vector3(0,1.4,0)),0xf6976c,38,6,.8);
  actionText('CONFLUENCE · PYROKINETIC RUPTURE');recordMove('PYROKINETIC RUPTURE');
  for(const other of enemies)if(other!==e&&!other.dead&&flatDistance(other.root.position,e.root.position)<3.8)damageEnemy(other,12,5,0,e.root.position);
 }else if(school==='ghost'&&e.broken>0){e.reactAt=elapsed+2;health=Math.min(runMods.maxHealth,health+9);energy=Math.min(100,energy+9);amount+=12;beam(e.root.position.clone().add(new THREE.Vector3(0,1.6,0)),player.root.position.clone().add(new THREE.Vector3(0,1.8,0)),0x8be0c2,.045,.45);actionText('CONFLUENCE · SOUL ECHO');recordMove('SOUL ECHO');}
 else if(school==='fire'&&slowTime>0){e.reactAt=elapsed+2;amount*=1.35;burst(e.root.position.clone().add(new THREE.Vector3(0,1.5,0)),0xc6acf9,25,5,.7);actionText('CONFLUENCE · TEMPORAL FRACTURE');recordMove('TEMPORAL FRACTURE');}
 return amount;
}
function adornEnemy(e){
 e.kind=e.boss?'CINDER KING':e.elite?'ASHEN WARDEN':e.caster?'HOLLOW ORACLE':e.stalker?'CINDER STALKER':'REVENANT';
 if(e.boss){e.maxHp=e.hp=550+wave*65;e.root.scale.setScalar(1.65);e.speed=2.45;e.bossCounter=0;e.bossWait=2;e.bar.visible=false;e.bossName='VORATH, THE CINDER KING';e.caster=false;}
 if(e.stalker){e.hp=e.maxHp=Math.round(e.maxHp*.78);e.speed*=1.5;e.root.scale.set(.95,.91,.95);for(const arm of e.forearms){horn(arm,[[0,-.12,.1],[0,-.4,.36],[0,-.8,.55]],.075,hornObsidian);}}
 if(e.caster){const robe=mesh(new THREE.ConeGeometry(.68,1.7,7,1,true),mat('#28252f',.95),e.hips,0,-.4,-.04);robe.rotation.z=.06;const staff=cylinder(e.hands[0],obsidian,0,-.35,0,.035,.04,2.2,6);orb(e.hands[0],purpleGlow,0,.84,0,.11,.11,.11);}
 if(e.elite||e.boss){const hammer=new THREE.Group();e.hands[1].add(hammer);cylinder(hammer,metal,0,-.45,0,.07,.075,1.6,8);box(hammer,obsidian,0,-1.14,0,.85,.5,.48);box(hammer,e.boss?ember:goldGlow,0,-1.15,.25,.53,.035,.025);for(let side of [-1,1])horn(hammer,[[side*.3,-1.12,0],[side*.7,-1.18,0]],.15,hornObsidian);}
}
function bossImpact(e,kind,position){
 const radius=kind==='leap'?5.5:7.3;ring(position,0xff7650,radius,.8);burst(position,0xff713d,90,10,1);if(flatDistance(position,player.root.position)<radius)hurt(kind==='leap'?32:27,true);if(flatDistance(position,player.root.position)<18)shake=.4;tone(43,.45,'sawtooth',.16,17);
}
function updateBoss(e,dt,dir,dist){
 const p=e.root.position;e.phase+=dt;pose(e,e.phase,0);e.bar.visible=false;e.telegraph.position.set(p.x,.1,p.z);e.telegraph.visible=false;
 if(e.hp/e.maxHp<.5&&!e.enraged){e.enraged=true;banner('THE KING REMEMBERS','His wrath quickens. Crimson attacks cannot be parried.');ring(p,0xff582e,10,1.1);e.bossWait=.7;}
 if(finisher||e.broken>0){e.torso.rotation.x=.5;e.hips.position.y-=.2;e.bossMove=null;e.bossWait=.7;return;}
 let m=e.bossMove;
 if(!m){e.bossWait-=dt;const destination=player.root.position.clone().sub(p).setY(0).normalize();if(dist>3){p.addScaledVector(destination,dt*e.speed*(e.enraged?1.2:1));pose(e,e.phase,.8);}if(e.bossWait<=0){const order=e.bossCounter++%3,kind=order===0?(dist>8?'charge':'stomp'):order===1?'hex':'leap';e.bossMove={kind,stage:'windup',t:0,duration:(kind==='hex'?1.25:1.45)*(e.enraged?.8:1),start:p.clone(),target:player.root.position.clone().setY(.06),dir:destination.clone(),hit:false};}return;}
 m.t+=dt;
 if(m.stage==='windup'){
  const u=Math.min(1,m.t/m.duration);e.arms[1].rotation.x=-2.6*u;e.forearms[1].rotation.x=-.4;e.torso.rotation.x=-.15*u;e.hips.position.y-=.15*u;
  e.telegraph.visible=true;e.telegraph.material.color.set(m.kind==='hex'?0xc0a1ef:0xff4e39);e.telegraph.material.opacity=.4+Math.sin(elapsed*18)*.2;e.telegraph.scale.setScalar(m.kind==='leap'?7.8:m.kind==='stomp'?10.2:3.7);if(m.kind==='leap')e.telegraph.position.set(m.target.x,.12,m.target.z);
  if(m.t>=m.duration){m.stage='strike';m.t=0;if(m.kind==='hex'){const origin=p.clone().add(new THREE.Vector3(0,2.6,0)),d=player.root.position.clone().add(new THREE.Vector3(0,1.4,0)).sub(origin).normalize();const count=e.enraged?5:3;for(let i=0;i<count;i++)projectile(origin,d.clone().applyAxisAngle(vup,(i-(count-1)/2)*.13),0xc1a0ed,16,10,'player','hex');}if(m.kind==='stomp'){bossImpact(e,'stomp',p);m.hit=true;}}
 }else if(m.stage==='strike'){
  const u=Math.min(1,m.t/.78);e.arms[1].rotation.x=-2.5+3.2*u;e.torso.rotation.x=.55*Math.sin(u*Math.PI);e.hips.position.y-=.18*Math.sin(u*Math.PI);
  if(m.kind==='charge'){p.addScaledVector(m.dir,dt*15);if(dist<3.2&&!m.hit){m.hit=true;hurt(24);}burst(p,0xea7646,3,2,.5);}
  if(m.kind==='leap'){p.lerpVectors(m.start,m.target,u);p.y=.06+Math.sin(Math.PI*u)*5.5;e.legs[0].rotation.x=-.8;e.shins[1].rotation.x=1.2;e.telegraph.visible=true;e.telegraph.position.set(m.target.x,.12,m.target.z);if(u>=.99&&!m.hit){m.hit=true;p.y=.06;bossImpact(e,'leap',m.target);}}
  if(u>=1){m.stage='recover';m.t=0;p.y=.06;}
 }else{e.torso.rotation.x=.35*(1-Math.min(1,m.t/.9));if(m.t>.95){e.bossMove=null;e.bossWait=e.enraged?.55:1.1;}}
 resolveWorld(p);
}
function saveRecord(){records.wave=Math.max(records.wave,wave);records.score=Math.max(records.score,score);records.runs++;try{localStorage.setItem('hellbound-records',JSON.stringify(records))}catch{}updateRecord();}
function updateRecord(){if(records.wave>0)$('recordSummary').textContent=`BEST WAVE ${String(records.wave).padStart(2,'0')}  /  ${records.score.toLocaleString()} SOUL SCORE`;}
function updateNewHUD(){
 $('ascensionFill').style.width=(ascendTime>0?ascendTime/9*100:ascendCharge)+'%';$('ascensionText').textContent=ascendTime>0?ascendTime.toFixed(1)+'s':ascendCharge>=100?'READY':Math.floor(ascendCharge)+'%';$('ascensionHUD').classList.toggle('ready',ascendCharge>=100||ascendTime>0);$('boonCount').textContent=acquired.length?`${acquired.length} BLESSING${acquired.length===1?'':'S'} CLAIMED`:'NO BLESSINGS CLAIMED';
 const boss=enemies.find(e=>e.boss&&!e.dead);$('bossHUD').classList.toggle('hidden',!boss);if(boss){$('bossName').textContent=boss.bossName;$('bossFill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';$('bossPhase').textContent=boss.bossMove?.stage==='windup'?(boss.bossMove.kind==='hex'?'REFLECT THE HEXES':'CRIMSON ATTACK · EVADE'):boss.enraged?'PHASE II · UNQUENCHABLE':'KEEPER OF THE ASH';}
 if(waypoint){const d=Math.hypot(waypoint.x-player.root.position.x,waypoint.z-player.root.position.z);$('bearing').textContent=`${waypoint.name.toUpperCase()} · ${Math.round(d)}m`;if(d<4){notify('DESTINATION REACHED · '+waypoint.name);waypoint=null;}}
 drawCartography($('radar'),true);
}
function openPanel(name){if(upgradeOpen||finisher||panelOpen)return false;panelResume=!paused;panelOpen=name;paused=true;heavyHeld=false;if(action?.type==='charge')action=null;Object.keys(keys).forEach(k=>keys[k]=false);document.exitPointerLock?.();return true;}
function closePanel(){if(!panelOpen)return;$(panelOpen==='map'?'realmMap':'settingsPanel').classList.add('hidden');panelOpen=null;paused=!panelResume;if(!paused)tryLock();}
function openMap(){if(!openPanel('map'))return;$('realmMap').classList.remove('hidden');updateMapButtons();drawCartography($('mapCanvas'),false);}
function openSettings(){if(!openPanel('settings'))return;$('settingsPanel').classList.remove('hidden');$('qualitySelect').value=options.quality;$('sensitivitySlider').value=options.sensitivity;$('volumeSlider').value=options.volume;$('shakeToggle').checked=options.shake;$('flashToggle').checked=options.flashes;}
function updateMapButtons(){
 $('districtButtons').innerHTML=districts.map((d,i)=>`<button data-district="${i}" class="${waypoint?.name===d.name?'marked':''}">${d.name}<small>${Math.round(Math.hypot(d.x-player.root.position.x,d.z-player.root.position.z))}m AWAY · ${i?'SOUL SHRINE':'CENTRAL COURT'}</small></button>`).join('');
 $('districtButtons').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{waypoint={...districts[i]};updateMapButtons();drawCartography($('mapCanvas'),false);tone(230,.1,'triangle',.035,130)});
}
function drawCartography(canvas,mini){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,scale=mini?3.05:3.55,px=mini?player.root.position.x:0,pz=mini?player.root.position.z:6;
 const point=(x,z)=>[cx+(x-px)*scale,cy+(z-pz)*scale];c.clearRect(0,0,w,h);c.save();if(mini){c.beginPath();c.arc(cx,cy,cx-5,0,TAU);c.clip();}
 c.fillStyle=mini?'#0c1917b8':'#10201b99';c.fillRect(0,0,w,h);c.strokeStyle='#b8c3990d';c.lineWidth=1;
 for(let v=-120;v<140;v+=10){let a=point(v,-130),b=point(v,130);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();a=point(-130,v);b=point(130,v);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
 if(!mini){for(let i=0;i<15;i++){c.beginPath();for(let j=0;j<=110;j++){const a=j/110*TAU,r=(82+i*2.2)+Math.sin(a*7+i*.4)*3+Math.cos(a*11)*2,[x,y]=point(Math.sin(a)*r,Math.cos(a)*r);j?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#9cad7a12';c.stroke();}c.font='10px Inter,Arial';c.fillStyle='#8d9b7870';c.textAlign='center';c.fillText('N',cx,35);c.fillText('S',cx,h-31);c.fillText('W',30,cy);c.fillText('E',w-30,cy);}
 for(let i=1;i<districts.length;i++){const d=districts[i];c.beginPath();c.moveTo(...point(0,-4));c.lineTo(...point(d.x,d.z));c.strokeStyle='#b2a07636';c.setLineDash([3,6]);c.lineWidth=mini?1:2;c.stroke();c.setLineDash([]);}
 let p=point(0,0);c.beginPath();c.arc(...p,25*scale,0,TAU);c.strokeStyle='#8c9c7140';c.lineWidth=1;c.stroke();for(let i=0;i<5;i++){c.beginPath();c.arc(...p,(5+i*4.6)*scale,0,TAU);c.strokeStyle='#8c9c7122';c.stroke();}
 // Etched ruins on the map represent the actual cathedral and outer landmarks.
 c.strokeStyle='#acb38b55';for(let side of [-1,1]){for(let i=0;i<6;i++){let q=point(side*22,-31+i*12);c.strokeRect(q[0]-3,q[1]-3,6,6);}let a=point(side*11,-37);c.strokeRect(a[0]-13*scale/2,a[1]-2*scale,13*scale,4*scale);}
 districts.forEach((d,i)=>{let [x,y]=point(d.x,d.z);c.save();c.translate(x,y);c.rotate(Math.PI/4);c.strokeStyle=waypoint?.name===d.name?'#edbd75':i?'#9bc3a5':'#c8b58e';c.lineWidth=1.5;c.strokeRect(-4,-4,8,8);c.restore();if(!mini){c.textAlign='center';c.font='14px Cinzel,Georgia';c.fillStyle='#c6c8ae';c.fillText(d.name,x,y+(i===0?-26:27));c.font='7px Inter,Arial';c.fillStyle='#718a6d';c.fillText(i?'SOUL SHRINE':'THE FIRST HUNT',x,y+(i===0?-13:41));}});
 enemies.filter(e=>!e.dead).forEach(e=>{let [x,y]=point(e.root.position.x,e.root.position.z);c.beginPath();c.arc(x,y,e.boss?5:2.5,0,TAU);c.fillStyle=e.boss?'#c997dd':'#d48867';c.fill();});
 if(waypoint){let [x,y]=point(waypoint.x,waypoint.z);if(mini){const d=Math.hypot(x-cx,y-cy);if(d>105){x=cx+(x-cx)*105/d;y=cy+(y-cy)*105/d;}}c.beginPath();c.arc(x,y,mini?6:10,0,TAU);c.strokeStyle='#edbe76';c.lineWidth=1.5;c.stroke();c.beginPath();c.moveTo(x-4,y);c.lineTo(x+4,y);c.moveTo(x,y-4);c.lineTo(x,y+4);c.stroke();}
 let [x,y]=point(player.root.position.x,player.root.position.z);c.save();c.translate(x,y);c.rotate(Math.PI-player.root.rotation.y);c.beginPath();c.moveTo(0,-8);c.lineTo(5,6);c.lineTo(0,3);c.lineTo(-5,6);c.closePath();c.fillStyle='#efdbb2';c.shadowColor='#d5b582';c.shadowBlur=9;c.fill();c.restore();c.restore();
}
function applyQuality(){const ratio=options.quality==='low'?1:options.quality==='high'?Math.min(devicePixelRatio,1.65):Math.min(devicePixelRatio,1.2);renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(ratio);composer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=options.quality!=='low';const size=options.quality==='high'?2048:1024;if(sun.shadow.mapSize.x!==size){sun.shadow.mapSize.set(size,size);sun.shadow.map?.dispose();sun.shadow.map=null;}bloom.strength=options.quality==='high'?.55:.38;}
function saveOptions(){try{localStorage.setItem('hellbound-settings',JSON.stringify(options))}catch{}}
let audioMaster=null,windBuffer=null;
function ensureAudio(){
 audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();if(audioMaster)return;
 audioMaster=audio.createGain();audioMaster.gain.value=audioOn?options.volume:0;audioMaster.connect(audio.destination);
 const drone=audio.createGain();drone.gain.value=.036;drone.connect(audioMaster);for(const hz of [41.2,61.75]){const o=audio.createOscillator();o.type='sine';o.frequency.value=hz;o.connect(drone);o.start();}
 windBuffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);const data=windBuffer.getChannelData(0);let prev=0;for(let i=0;i<data.length;i++){prev=(prev+Math.random()*.08-.04)/1.015;data[i]=prev;}
 const noise=audio.createBufferSource();noise.buffer=windBuffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=600;const gain=audio.createGain();gain.gain.value=.15;noise.connect(filter);filter.connect(gain);gain.connect(audioMaster);noise.start();
 const lfo=audio.createOscillator(),lfoGain=audio.createGain();lfo.frequency.value=.065;lfoGain.gain.value=230;lfo.connect(lfoGain);lfoGain.connect(filter.frequency);lfo.start();
}
function impactNoise(duration,volume){if(!audioOn||!audioMaster||!windBuffer)return;const n=audio.createBufferSource(),gain=audio.createGain(),filter=audio.createBiquadFilter();n.buffer=windBuffer;filter.type='highpass';filter.frequency.value=350;gain.gain.setValueAtTime(volume*2,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);n.connect(filter);filter.connect(gain);gain.connect(audioMaster);n.start(0,Math.random(),duration);}
function initOverhaul(){
 applyQuality();updateRecord();
 $('mapButton').onclick=openMap;$('closeMap').onclick=closePanel;$('settingsButton').onclick=openSettings;$('closeSettings').onclick=closePanel;$('settingsDone').onclick=closePanel;
 $('clearWaypoint').onclick=()=>{waypoint=null;updateMapButtons();drawCartography($('mapCanvas'),false)};
 $('mapCanvas').onclick=ev=>{const rect=ev.currentTarget.getBoundingClientRect(),x=(ev.clientX-rect.left)/rect.width*850,z=(ev.clientY-rect.top)/rect.height*690;let wx=(x-425)/3.55,wz=(z-345)/3.55+6;const r=Math.hypot(wx,wz);if(r>84){wx*=84/r;wz*=84/r;}const d=districts.find(d=>Math.hypot(d.x-wx,d.z-wz)<14);waypoint=d?{...d}:{x:wx,z:wz,name:'Marked location'};updateMapButtons();drawCartography($('mapCanvas'),false)};
 $('qualitySelect').onchange=e=>{options.quality=e.target.value;applyQuality();saveOptions()};$('sensitivitySlider').oninput=e=>{options.sensitivity=Number(e.target.value);saveOptions()};$('volumeSlider').oninput=e=>{options.volume=Number(e.target.value);if(audioMaster)audioMaster.gain.setTargetAtTime(audioOn?options.volume:0,audio.currentTime,.1);saveOptions()};$('shakeToggle').onchange=e=>{options.shake=e.target.checked;saveOptions()};$('flashToggle').onchange=e=>{options.flashes=e.target.checked;saveOptions()};
 $('sound').onclick=()=>{audioOn=!audioOn;try{ensureAudio();audioMaster.gain.setTargetAtTime(audioOn?options.volume:0,audio.currentTime,.2)}catch{}$('soundState').textContent=audioOn?'ON':'OFF';if(audioOn)tone(65,.5,'sine',.1,38)};
}
