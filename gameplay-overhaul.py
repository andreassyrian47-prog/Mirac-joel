from pathlib import Path
p=Path('src/main.js');s=p.read_text()
def swap(a,b):
 global s
 assert a in s,a[:120]
 s=s.replace(a,b)
def block(a,b,new):
 global s
 x=s.index(a);y=s.index(b,x);s=s[:x]+new+'\n'+s[y:]
swap("let mode='menu'", """let ascendCharge=0,ascendTime=0,upgradeOpen=false,panelOpen=null,panelResume=false,intermission=-1,waypoint=null;
let runMods={damage:1,maxHealth:100,regen:1,speed:1,life:0,duration:1,reach:1,souls:1};
let acquired=[];
let records={wave:0,score:0,runs:0};try{Object.assign(records,JSON.parse(localStorage.getItem('hellbound-records')||'{}'))}catch{}
let mode='menu'""")
# A wave now ends with a meaningful, persistent-for-the-run choice.
swap("health=100;energy=100;score=0;", "resetRunSystems();health=100;energy=100;score=0;")
swap("function gameOver(){heavyHeld=false;", "function gameOver(){saveRecord();heavyHeld=false;")
swap("health=Math.min(100,health+", "health=Math.min(runMods.maxHealth,health+")
swap("health=Math.max(0,health-amount);", "health=Math.max(0,health-amount*(ascendTime>0?.5:1));")
swap("function hurt(amount){", "function hurt(amount,unblockable=false){")
swap("if(action?.type==='parry'&&action.t<.4){", "if(!unblockable&&action?.type==='parry'&&action.t<.4){")
swap("function damageEnemy(e,amount,knock=0,launch=0,source=null){if(e.dead)return;e.hp-=amount;", "function damageEnemy(e,amount,knock=0,launch=0,source=null,school=null){if(e.dead)return;amount*=runMods.damage*(ascendTime>0?1.5:1);amount=reactElements(e,amount,school);ascendCharge=Math.min(100,ascendCharge+amount*.075);e.hp-=amount;")
swap("e.kb.addScaledVector(d,knock)", "e.kb.addScaledVector(d,knock*(e.boss?.15:1))")
swap("if(launch){e.juggles", "if(launch&&!e.boss){e.juggles")
swap("e.stagger=Math.max(e.stagger,.35);", "e.stagger=Math.max(e.stagger,e.boss?.08:.35);")
swap("score+=100+wave*15;health=Math.min(runMods.maxHealth,health+2);", "score+=Math.floor((100+wave*15+(e.boss?700:0))*runMods.souls);ascendCharge=Math.min(100,ascendCharge+(e.boss?30:6));health=Math.min(runMods.maxHealth,health+2+runMods.life);")
swap("health=Math.min(runMods.maxHealth,health+28);", "ascendCharge=Math.min(100,ascendCharge+18);health=Math.min(runMods.maxHealth,health+28);")
swap("const [range,damage,knock,launch]=specs[a.type];", "const [baseRange,damage,knock,launch]=specs[a.type];const range=baseRange*runMods.reach;")
swap("damageEnemy(e,damage*(riposte>0?1.8:1)*(e.broken>0?1.3:1)*(fromBehind?1.12:1),knock,launch);", "damageEnemy(e,damage*(riposte>0?1.8:1)*(e.broken>0?1.3:1)*(fromBehind?1.12:1),knock,launch,null,weaveTime>0?weaveSchool:null);")
swap("(e.hp<=e.maxHp*.6||e.broken>0)", "executionReady(e)")
swap("(e.elite?115:65)", "(e.boss?220:e.elite?115:65)")
swap("weaveTime=4;", "weaveTime=4*runMods.duration;")
swap("let speed=ghostTime>0?11:sprint?8.8:6;", "let speed=(ghostTime>0?11:sprint?8.8:6)*runMods.speed*(ascendTime>0?1.2:1);")
swap("energy+dt*5.5", "energy+dt*5.5*runMods.regen*(ascendTime>0?2:1)")
swap("function hitArea(pos,radius,damage,knock=3,launch=0){for(const e of enemies)if(!e.dead&&flatDistance(e.root.position,pos)<radius)damageEnemy(e,damage,knock,launch,pos)}", "function hitArea(pos,radius,damage,knock=3,launch=0,school=null){for(const e of enemies)if(!e.dead&&flatDistance(e.root.position,pos)<radius)damageEnemy(e,damage,knock,launch,pos,school)}")
swap("damageEnemy(e,60,5)", "damageEnemy(e,60,5,0,null,'mind')")
swap("damageEnemy(target,22,0,11)", "damageEnemy(target,22,0,11,null,'mind')")
swap("hitArea(origin,9,46,3)", "hitArea(origin,9,46,3,0,'mind')")
swap("damageEnemy(e,42,1)", "damageEnemy(e,42,1,0,null,'ghost')")
swap("damageEnemy(e,p.damage,4)", "damageEnemy(e,p.damage,4,0,null,p.color===colors.fire?'fire':p.color===colors.ghost?'ghost':null)")
swap("damageEnemy(e,z.type==='gravity'?9:13,0)", "damageEnemy(e,z.type==='gravity'?9:13,0,0,null,z.type==='gravity'?'mind':'fire')")
swap("damageEnemy(e,18,2)", "damageEnemy(e,18,2,0,null,'ghost')")
# Enemy roster and first boss at wave three.
swap("const elite=wave%3===0&&i===total-1;const e=creature(false,elite);e.caster=wave>=2&&i%5===2&&!elite;", "const boss=wave%3===0&&i===total-1,elite=wave>=2&&i===total-2;const e=creature(false,elite||boss);e.boss=boss;e.caster=wave>=2&&i%5===2&&!elite&&!boss;e.stalker=wave>=2&&i%4===0&&!elite&&!boss&&!e.caster;")
swap("e.poiseFill=box(bar", "e.poiseFill=box(bar")
swap("e.bar=bar;const marker", "e.bar=bar;adornEnemy(e);const marker")
swap("An Ashen Warden walks among the damned.", "Vorath, the Cinder King, has entered the hunt.")
swap("let moving=0;const attackSpeed", "if(e.boss){updateBoss(e,dt,delta,dist);continue;}let moving=0;const attackSpeed")
swap("const attackSpeed=1+Math.min(wave*.035,.4)", "const attackSpeed=(1+Math.min(wave*.035,.4))*(e.stalker?1.3:1)")
swap("pose(e,e.phase,moving*.9);", "pose(e,e.phase,moving*(e.stalker?1.3:.9));if(e.caster){e.rig.position.y=.12+Math.sin(elapsed*2+e.phase)*.08;e.legs.forEach(l=>l.rotation.x=.12);}if(e.stalker)e.torso.rotation.x+=.24;")
# Inputs and overlays are exclusive; overlays must not accidentally resume a run.
swap("e.preventDefault();if(e.code==='Escape'){", "e.preventDefault();if(upgradeOpen){if(['Digit1','Digit2','Digit3'].includes(e.code))chooseBoon(Number(e.code.slice(-1))-1);return;}if(panelOpen){if(e.code==='Escape'||(e.code==='KeyM'&&panelOpen==='map'))closePanel();return;}if(e.code==='KeyM'&&!e.repeat){openMap();return;}if(e.code==='Escape'){")
swap("if(e.code==='KeyQ')castPower();", "if(e.code==='KeyQ')castPower();if(e.code==='KeyB')ascend();")
swap("if(mode!=='game'||paused||wheelOpen)return;dragging=true", "if(mode!=='game'||paused||wheelOpen||upgradeOpen||panelOpen)return;dragging=true")
swap("function openModal(fromHelp=false){", "function openModal(fromHelp=false){if(upgradeOpen||panelOpen)return;")
swap("function tryLock(){if(mode==='game'&&!paused&&!wheelOpen)", "function tryLock(){if(mode==='game'&&!paused&&!wheelOpen&&!panelOpen&&!upgradeOpen)")
swap("function updateHUD(){updateCombatHUD();", "function updateHUD(){updateCombatHUD();updateNewHUD();")
swap("$('healthFill').style.width=health+'%'", "$('healthFill').style.width=(health/runMods.maxHealth*100)+'%'")
swap("`${Math.ceil(health)} / 100`", "`${Math.ceil(health)} / ${runMods.maxHealth}`")
swap("waveDelay=5.5;banner('THE ASH SETTLES','Your wounds mend. The next hunt approaches.');", "waveDelay=999;intermission=1.7;banner('THE ASH SETTLES','The fallen offer you a forbidden blessing.');")
swap("if(wavePending&&!finisher){waveDelay-=dt;if(waveDelay<=0)nextWave()}", "if(intermission>0){intermission-=dt;if(intermission<=0)openBoons();}if(wavePending&&!finisher&&!upgradeOpen&&intermission<=0){waveDelay-=dt;if(waveDelay<=0)nextWave()}")
swap("cooldowns.forEach((c,i)=>cooldowns[i]=Math.max(0,c-dt));", "ascendTime=Math.max(0,ascendTime-dt);cooldowns.forEach((c,i)=>cooldowns[i]=Math.max(0,c-dt));")
swap("hudAccum+=realdt;", "if(ascendTime>0&&Math.random()<.5)burst(player.root.position.clone().add(new THREE.Vector3(0,1.6,0)),0xff8d55,3,2,.6);hudAccum+=realdt;")
swap("window.__hellbound={get state(){return{mode,wave", "window.__hellbound={get state(){return{mode,upgradeOpen,panelOpen,acquired:[...acquired],ascendCharge,ascendTime,maxHealth:runMods.maxHealth,waypoint,options:{...options},wave")
swap("({hp:e.hp,x:e.root.position.x", "({hp:e.hp,boss:!!e.boss,kind:e.kind,x:e.root.position.x")
# Methods are declared below; initialization executes before the first frame.
s=s.replace("requestAnimationFrame(animate);\n", "initOverhaul();\nrequestAnimationFrame(animate);\n")
p.write_text(s)
