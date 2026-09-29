from pathlib import Path
p=Path('src/main.js');s=p.read_text()
def rep(a,b):
 global s
 assert a in s,a[:130]
 s=s.replace(a,b)
rep("import * as THREE from 'three';", "import * as THREE from 'three';\nimport {MELEE_REACH,strikeWindow,canMeleeHit,steerAttack,rendHit,createEncounterDirector,attackClear} from './ruin-combat.js';\nimport {curvedHorn,addRendVisual,updateRendVisual} from './ruin-models.js';")
rep("const options={", "const encounter=createEncounterDirector();\nconst options={")
a=s.index('function horn(parent,points,r,material)');b=s.index('\n',a);s=s[:a]+"function horn(parent,points,r,material){return mesh(curvedHorn(points,r),material,parent);}"+s[b:]
rep("skin=mat(isPlayer?'#6b302a'", "skin=mat(isPlayer?'#61372f'")
rep("flesh=mat(isPlayer?'#6e3930'", "flesh=mat(isPlayer?'#764d3b'")
rep('1.3,.75,1.12);for(let layer', '1.1,.68,1.04);for(let layer')
rep('e.bar=bar;adornEnemy(e);','e.bar=bar;adornEnemy(e);addRendVisual(e);')
rep("function startGame(nextMode=gameMode){", "function startGame(nextMode=gameMode){encounter.reset();")
# Preserve training immortality, but run defensive mechanics and hit feedback.
rep("function hurt(amount,unblockable=false,source=null){if(gameMode==='training')return;", "function hurt(amount,unblockable=false,source=null){")
rep('health=Math.max(0,health-amount', "health=Math.max(gameMode==='training'?1:0,health-amount")
# Bounded buffering and windup steering; there is no teleport toward a target.
rep("if(action.t>.06){const u=action.t/action.duration,hit=impactAt(action);actionQueue={heavy,precise:u>hit+.025&&u<hit+.22,modifiers:", "if(action.t>.09){const u=action.t/action.duration,hit=impactAt(action);actionQueue={heavy,expires:elapsed+.62,precise:action.hit&&u>hit+.025&&u<hit+.22,modifiers:")
rep('let target=aim(dodgeLink>0||keys.ShiftLeft?11:7);', 'const attackYaw=player.root.rotation.y;let target=aim(dodgeLink>0||keys.ShiftLeft?11:7);player.root.rotation.y=attackYaw;')
rep('target,charge,start:player.root.position.clone()', 'target,charge,targetsHit:new Set(),start:player.root.position.clone()')
rep("function meleeImpact(a){\n a.hit=true;", "function meleeImpact(a){\n a.targetsHit??=new Set();const first=!a.impactFx;a.impactFx=true;")
rep('if(a.convergence){const center', 'if(a.convergence&&first){const center')
rep('const range=baseRange*runMods.reach;', 'const range=(MELEE_REACH[a.type]??baseRange)*runMods.reach;')
rep("slash(pos,player.root.rotation.y,a.type!=='light',color);", "if(first)slash(pos,player.root.rotation.y,a.type!=='light',color);")
rep("if(e.dead){if(e.physicalBody&&flatDistance(e.root.position,player.root.position)<range)", "if(e.dead){if(first&&e.physicalBody&&flatDistance(e.root.position,player.root.position)<range)")
rep("if(d>=range||(!radial&&dot<-.12))continue;\n  count++;", "if(!canMeleeHit(a,e,player,range,(p,q)=>attackClear(p,q,obstacles)))continue;\n  count++;a.targetsHit.add(e);a.hit=true;a.contactTarget=e;a.contactAt=a.t;")
rep('damageEnemy(e,damage*guardFactor*STANCES', "const rend=rendHit(e,a,guardFactor<1);if(rend.rupture){e.poise=(e.poise||0)+32;gainFlow();energy=Math.min(100,energy+8);recordMove('REND RUPTURE');actionText('REND RUPTURE · ARMOR OPEN');ring(chestContact(e),0xef8d56,1.5,.25);}\n  damageEnemy(e,(damage+rend.bonus)*guardFactor*STANCES")
rep("if(['slam','stomp','charged','cleave'].includes(a.type)){impactWorld", "if(first&&['slam','stomp','charged','cleave'].includes(a.type)){impactWorld")
rep("}else tone(170,.1,'triangle',.025,50);", "}else if(first)tone(170,.08,'triangle',.018,50);")
rep("tone(a.type==='light'?85:55,.16,'sawtooth',.12,18)", "tone(a.type==='light'?95:48,a.type==='light'?.085:.16,'sawtooth',a.type==='light'?.085:.13,18)")
rep('if(!a.hit&&u>impactAt(a))meleeImpact(a);', "steerAttack(a,player,dt,impactAt(a));const [begin,end]=strikeWindow(a,impactAt(a));if(u>=begin&&u-dt/a.duration<=end)meleeImpact(a);")
rep("if(u>=1&&a.type!=='charge'&&a.type!=='guard')", "if((u>=1||a.type==='light'&&a.hit&&actionQueue&&u>.76)&&a.type!=='charge'&&a.type!=='guard')")
rep('if(actionQueue){let q=actionQueue;', 'if(actionQueue&&(!actionQueue.expires||actionQueue.expires>=elapsed)){let q=actionQueue;')
# Per-frame hit retarget on a physically reachable hand; no root warping.
rep("finishMotion(r,dt);if(!finisher", "finishMotion(r,dt);if(r===player&&!finisher&&action?.contactTarget&&!action.contactTarget.dead&&action.type==='light'&&action.step<3){const age=action.t-action.contactAt,w=Math.max(0,1-age/.13),hand=action.step===1?1:0,goal=chestContact(action.contactTarget,0,.34);r.root.updateMatrixWorld(true);if(goal.distanceTo(r.arms[hand].getWorldPosition(new THREE.Vector3()))<1.05)aimHand(r,hand,goal,w*.8);}if(!finisher")
# Coordinated slots and commitment. No instant tracking behind the attacker.
rep('function updateEnemies(dt){for(', 'function updateEnemies(dt){encounter.update(enemies,player,dt);for(')
rep("if(dist>(e.caster?13:e.small?1.55:2.15)){", "if(!encounter.mayAttack(e)&&dist<(e.caster?18:8)){const orbit=encounter.orbit(e,player);moving=orbit.length();pos.addScaledVector(orbit,e.speed*ed*.68*(e.snared>0?.05:1));}else if(dist>(e.caster?13:e.small?1.55:2.15)){")
rep("else if(e.timer<=0&&(e.caster||enemies.filter(o=>!o.dead&&!o.caster&&(o.state==='windup'||o.state==='strike')).length<3))", "else if(e.timer<=0&&encounter.mayAttack(e))")
rep('e.timer=e.small?.60:e.elite?.95:.82;e.attackDone=false;', 'e.timer=e.small?.60:e.elite?.95:.82;e.windupDuration=e.timer;e.attackDone=false;')
rep('e.strikeDir=delta.clone();', 'e.strikeDir=new THREE.Vector3(Math.sin(e.root.rotation.y),0,Math.cos(e.root.rotation.y));')
rep('else if(flatDistance(pos,player.root.position)<3)hurt(', 'else if(flatDistance(pos,player.root.position)<(e.small?2.05:2.9)&&e.strikeDir.dot(player.root.position.clone().sub(pos).setY(0).normalize())>.25)hurt(')
rep('e.timer=e.small?.65:e.elite?.85:1.2', 'e.timer=e.small?.65:e.elite?.85:1.2;e.recoverDuration=e.timer')
rep('e.barFill.material.color.set(e.guardActive?', 'updateRendVisual(e);e.barFill.material.color.set(e.rend>=3?0xe59b56:e.guardActive?')
# Boss recovery is a deliberate attack opportunity; a new amber sweep joins the existing moves.
rep('amount*=runMods.damage*(ascendTime>0?1.5:1);', "amount*=runMods.damage*(ascendTime>0?1.5:1)*(e.boss&&e.bossMove?.stage==='recover'?1.18:1);")
rep("const order=e.bossCounter++%3,kind=order===0?(dist>8?'charge':'stomp'):order===1?'hex':'leap';", "const order=e.bossCounter++%4,kind=order===0?(dist>8?'charge':'stomp'):order===1?'hex':order===2?'leap':'reap';")
rep("if(finisher||e.broken>0||gameMode==='training'&&!trainingAI)", "updateRendVisual(e);e.rendTime=Math.max(0,(e.rendTime||0)-dt);if(!e.rendTime)e.rend=0;\n if(finisher||e.broken>0||gameMode==='training'&&!trainingAI)")
rep("m.kind==='hex'?0xc0a1ef:0xff4e39", "m.kind==='hex'?0xc0a1ef:m.kind==='reap'?0xffc06a:0xff4e39")
rep("const u=Math.min(1,m.t/.78);if(m.kind==='stomp'", "const u=Math.min(1,m.t/(m.kind==='reap'?1.15:.78));if(m.kind==='reap'){for(const threshold of (e.enraged?[.42,.83]:[.42])){m.sweepHits??=new Set();if(u>=threshold&&!m.sweepHits.has(threshold)){m.sweepHits.add(threshold);const toward=player.root.position.clone().sub(p).setY(0);if(toward.length()<5.2&&toward.normalize().dot(m.dir)>.15)hurt(e.enraged?22:26,false,p);slash(p.clone().add(new THREE.Vector3(0,1.7,0)),e.root.rotation.y,true,0xe9b47a);tone(55,.16,'sawtooth',.10,22);}}}if(m.kind==='stomp'")
rep("if(m.t>.95){e.bossMove=null", "if(m.t>(m.kind==='reap'?1.2:.95)){e.bossMove=null")
rep("boss.bossMove.kind==='hex'?'REFLECT THE HEXES':'CRIMSON ATTACK · EVADE'", "boss.bossMove.kind==='hex'?'REFLECT THE HEXES':boss.bossMove.kind==='reap'?(boss.enraged?'AMBER DOUBLE SWEEP · PARRY / EVADE':'AMBER SWEEP · PARRY / EVADE'):'CRIMSON ATTACK · EVADE'")
rep("boss.enraged?'PHASE II · UNQUENCHABLE':'KEEPER OF THE ASH'", "boss.bossMove?.stage==='recover'?'PUNISH WINDOW · +18% DAMAGE':boss.enraged?'PHASE II · UNQUENCHABLE':'KEEPER OF THE ASH'")
# Spell wheel conveys whether a choice can actually be cast.
rep("$('wheelCost').textContent=`${p.cost} WRATH  /  ${p.cd}s COOLDOWN`", "$('wheelCost').textContent=cooldowns[i]>0?`RECOVERING · ${cooldowns[i].toFixed(1)}s / ${p.cost} WRATH`:energy<p.cost?`NEED ${Math.ceil(p.cost-energy)} MORE WRATH`:`READY · ${p.cost} WRATH / ${p.cd}s COOLDOWN`;document.querySelectorAll('.wheel-slice').forEach((el,n)=>el.classList.toggle('unavailable',cooldowns[n]>0||energy<powers[n].cost))")
rep("function updateMode(dt){flowGrace", "function updateMode(dt){if(wheelOpen)previewPower(hovered);flowGrace")
# A repeatable group-combat practice setup, not a new mode.
idx=s.index('function updateMode(dt)')
s=s[:idx]+"function trainingDrill(){if(gameMode!=='training'||finisher)return;trainingSpawn(false,true);const base=player.root.position.clone();for(let i=1;i<3;i++){spawnEnemy(i,3,true);const e=enemies.at(-1),a=player.root.rotation.y+(i===1?1.1:-1.1);e.root.position.copy(base).add(new THREE.Vector3(Math.sin(a)*5,0,Math.cos(a)*5));e.hp=e.maxHp=500;e.broken=0;}trainingAI=true;$('trainingAI').textContent='H · AI ON';encounter.reset();notify('COMBAT DRILL · 3 opponents / immortal / parry and rupture practice');}\n"+s[idx:]
rep("$('trainingSmall').onclick=()=>trainingSpawn(false,false,true);", "$('trainingSmall').onclick=()=>trainingSpawn(false,false,true);$('trainingDrill').onclick=trainingDrill;")
rep("if(e.code==='KeyI')trainingSpawn(false,false,true);", "if(e.code==='KeyI')trainingSpawn(false,false,true);if(e.code==='KeyK')trainingDrill();")
# Readable target-state UI; don't add another permanent corner overlay.
rep("const hints=[];", "const focus=lockTarget&&!lockTarget.dead?lockTarget:nearest(6);$('targetReadout').classList.toggle('hidden',!focus||!!finisher);if(focus){$('targetReadout').textContent=focus.kind+'  /  '+(focus.broken>0?'WILL BROKEN':focus.rend>=3?'REND READY · HEAVY TO RUPTURE':'REND '+('◆'.repeat(focus.rend||0)+'◇'.repeat(3-(focus.rend||0))));$('targetReadout').classList.toggle('ready',focus.rend>=3);}\n const hints=[];")
# Accessible user hints remain in the codex; initial banner doesn't mask the actors.
rep("T: revenant · Y: boss · I: midget · H: toggle AI · J: reset resources.", "I: midget · Y: boss · K: group drill · H: AI · J: resources.")
# Observable validation hooks, stripped by the existing DEV gate.
rep("dreadSelection(boss=false", "ruinSnapshot(){return {encounter:encounter.info(),action:action?{type:action.type,t:action.t,duration:action.duration,hit:!!action.hit,targets:action.targetsHit?.size||0}:null,enemies:enemies.map(e=>({kind:e.kind,rend:e.rend||0,rendTime:e.rendTime||0,state:e.state,permit:encounter.mayAttack(e),windup:e.windupDuration,recover:e.recoverDuration,hp:e.hp,bossMove:e.bossMove?{kind:e.bossMove.kind,stage:e.bossMove.stage,t:e.bossMove.t}:null}))};},\n ruinDrill(){trainingDrill();},\n ruinRend(n=3){const e=enemies.find(e=>!e.dead);if(e){e.rend=n;e.rendTime=5;}},\n ruinHit(){invuln=0;hurt(20,false,player.root.position.clone().addScaledVector(facing(),2));},\n ruinBossSweep(enraged=false){const e=enemies.find(e=>e.boss);if(e){trainingAI=true;e.broken=e.stagger=0;e.enraged=enraged;e.bossCounter=3;e.bossWait=0;e.bossMove=null;}},\n dreadSelection(boss=false")
p.write_text(s)
p=Path('src/motion.js');s=p.read_text().replace('r.timer/(r.elite?.95:.82)', 'r.timer/(r.windupDuration||(r.small?.6:r.elite?.95:.82))').replace('r.timer/(r.elite?.85:1.2)', 'r.timer/(r.recoverDuration||(r.small?.65:r.elite?.85:1.2))').replace('r.stalker?library.stalker', '(r.stalker||r.small)?library.stalker')
s=s.replace('if(!m)return;const u=', "if(!m)return;if(m.kind==='reap'){const t=m.stage==='windup'?.28*clamp(m.t/m.duration,0,1):m.stage==='recover'?.80+.20*clamp(m.t/1.2,0,1):curve(r.enraged?[[0,.28],[.42,.42],[.60,.83],[.67,.28],[.83,.42],[1,.83]]:[[0,.28],[.42,.42],[1,.83]],clamp(m.t/1.15,0,1));apply(r,sample(clawR,t));r.hips.position.y-=.12;r.torso.rotation.y*=1.15;state(r).request={kind:'boss-reap-'+m.stage,time:r.phase,moving:0,manual:false};return;}const u=")
p.write_text(s)
p=Path('src/locomotion.js');s=p.read_text().replace('const g=strideParameters(r,m);m.gaitProfile=g;', 'const g=strideParameters(r,m);if(m.gaitProfile&&m.strideActive){g.cycle=damp(m.gaitProfile.cycle,g.cycle,12,dt);g.stance=damp(m.gaitProfile.stance,g.stance,16,dt);}m.gaitProfile=g;');p.write_text(s)
p=Path('src/execution-performance.js');s=p.read_text().replace('sign*(1.30+.25*load+.18*release-.30*recover)', 'sign*(1.78+.16*load+.15*release-.20*recover)');p.write_text(s)
p=Path('index.html');s=p.read_text().replace('</head>','<link rel="stylesheet" href="/ruin.css"></head>').replace('DREAD UPDATE · V0.15.0','RUIN UPDATE · V0.16.0').replace('FOUR WAYS INTO THE ABYSS.','THE COMBAT REFORGED.').replace('One demon. Four paths to damnation.','Read the threat. Break the guard. Own the fight.').replace('<div id="combatContext">','<div id="targetReadout" class="hidden"></div><div id="combatContext">').replace('<button id="trainingAI">','<button id="trainingDrill">K · DRILL</button><button id="trainingAI">')
s=s.replace('<div id="controlsGrid">','<div id="controlsGrid"><div><kbd>K</kbd><span>Training group drill</span></div>')
s=s.replace('<details id="advancedGuide">','<details id="advancedGuide">')
p.write_text(s)
