from pathlib import Path
p=Path('src/main.js');s=p.read_text()
def rep(a,b):
 global s
 assert a in s,a[:100]
 s=s.replace(a,b,1)
rep("import * as THREE from 'three';", "import * as THREE from 'three';\nimport {massOf,rememberBody,clearBody,startBody,stepBody,bodyInfo,stepMomentum,dynamicPose} from './physical.js';\nimport {cinematicBody,correctReach} from './cinematic.js';")
rep("function smoothRig(r,dt){finishMotion(r,dt)}", "function smoothRig(r,dt){if(r.physicalBody)return;finishMotion(r,dt);rememberBody(r,dt);}")
rep("knock*(e.boss?.15:1)", "knock/massOf(e)")
rep("e.airHold=0;e.vy=launch;", "e.airHold=0;e.tk=0;e.vy=launch;")
rep("e.dead=true;e.deathTime=0;kills++;", "e.dead=true;e.deathTime=0;if(finisher?.enemy!==e)startBody(e,(e.kb||new THREE.Vector3()).clone().multiplyScalar(.5).add(new THREE.Vector3(0,Math.max(0,e.vy||0)*.3,0)));kills++;")
rep("resetMotion(player);waveDelay=1.6;", "resetMotion(player);clearBody(player);player.lastFootContacts=null;waveDelay=1.6;")
rep("if(!r)return;scene.remove(r.root);", "if(!r)return;clearBody(r);scene.remove(r.root);")
rep("if(f.def.id==='soulbreaker')updateSoulbreaker(dt);else executionDirector.update(f,dt);", "executionDirector.update(f,dt);")
a=s.index('function alignExecutionHands()');b=s.index('function hitArea(',a)
s=s[:a]+"function alignExecutionHands(){if(finisher)executionDirector.align(finisher);}\n"+s[b:]
a=s.index('function updateSoulbreaker(');b=s.index('function updatePlayer(',a);s=s[:a]+s[b:]
rep("polish:(f)=>polishExecution(f,player)", "polish:(f,dt)=>{polishExecution(f,player);cinematicBody(f,player,dt,obstacles);correctReach(f,player,dt)}")
rep("if(!e.executed)poseDeath(e);e.root.position.y=Math.max(-1.4,(e.executed?e.corpseY:.06)-Math.max(0,e.deathTime-1.05)*.55);", "if(!stepBody(e,dt,obstacles)){poseDeath(e);e.root.position.y=Math.max(-1.4,.06-Math.max(0,e.deathTime-1.05)*.55);}")
rep("function updateEnemies(dt){const slow=slowTime>0?.2:1;", "function timeScaleAt(pos){return zones.some(z=>z.type==='rift'&&flatDistance(z.mesh.position,pos)<z.radius)?.28:1;}\nfunction updateEnemies(dt){")
rep("let ed=dt*slow;", "let ed=dt*timeScaleAt(e.root.position);")
rep("pos.addScaledVector(e.kb,ed);e.kb.multiplyScalar(Math.exp(-ed*6));", "stepMomentum(e,ed,obstacles,speed=>{e.stagger=Math.max(e.stagger,.7);damageEnemy(e,Math.min(24,speed*1.6),0);actionText('WALL CRUSH');ring(e.root.position,0xc7ac88,1.5,.3);});if(e.dead)continue;")
a=s.index('if(e.tk>0){e.tk-=dt;');b=s.index("if(e.boss){updateBoss",a)
s=s[:a]+'''if(e.tk>0){e.tk-=dt;const target=2.7;e.vy+=((target-pos.y)*52-e.vy*12)*dt;pos.y=Math.max(.06,pos.y+e.vy*dt);e.airborne=true;e.stagger=Math.max(e.stagger,.5);if(e.tk<=0){e.vy=-17;e.slamPower=48;}}else if(e.airHold>0){e.airHold-=dt;e.airHoldY=e.airHoldY||Math.max(1.2,pos.y);e.vy+=((e.airHoldY-pos.y)*30-e.vy*10)*dt;pos.y=Math.max(.06,pos.y+e.vy*dt);e.stagger=Math.max(e.stagger,.5);}else if(e.airborne||pos.y>.08){e.airHoldY=0;e.vy-=ed*23;pos.y+=ed*e.vy;if(pos.y<=.06){const speed=Math.abs(e.vy);pos.y=.06;e.airborne=false;e.vy=0;e.juggles=0;e.landTime=.38;e.landStrength=THREE.MathUtils.clamp(speed/16,.35,1);e.stagger=Math.max(e.stagger,.3);ring(pos,0xac9278,1.4+speed*.06,.35);if(e.slamPower){const force=e.slamPower;e.slamPower=0;damageEnemy(e,force,0);for(const o of enemies)if(o!==e&&!o.dead&&flatDistance(pos,o.root.position)<2.8)damageEnemy(o,Math.min(24,force*.35),6,2,pos);shake=Math.max(shake,.25);tone(52,.22,'sawtooth',.1,20);actionText('GROUND CRUSH');}}}if(e.dead)continue;
''' + s[b:]
rep("updateBoss(e,dt,delta,dist)", "updateBoss(e,ed,delta,dist)")
rep("poseEnemyAction(e);if(pos.y>1){e.legs[0].rotation.x=-.5;e.arms[0].rotation.z=-.8;e.arms[1].rotation.z=.8}", "poseEnemyAction(e);dynamicPose(e,ed);")
rep("if(a.type==='slam'){e.airHold=0;e.vy=-19;e.stagger=1.5;}", "if(a.type==='slam'){e.airHold=0;e.tk=0;e.vy=-19;e.stagger=1.5;if(e.root.position.y>.4)e.slamPower=24;}")
rep("target.stagger=2;target.tk=1.15;", "target.stagger=target.boss?.4:2;target.tk=target.boss?0:1.15;")
rep("const p=projectiles[i];p.life-=dt;", "const p=projectiles[i],step=dt*(p.hostile?timeScaleAt(p.mesh.position):1);p.life-=step;")
rep("p.mesh.position.addScaledVector(p.dir,p.speed*dt);", "p.mesh.position.addScaledVector(p.dir,p.speed*step);")
rep("damageEnemy(e,p.damage,4,0,null,p.color", "damageEnemy(e,p.damage,p.kind==='wave'?9:6,p.kind==='wave'&&!e.boss?2:0,null,p.color")
rep("e.root.position.addScaledVector(d.normalize(),dt*(z.type==='gravity'?4:2.8));", "d.normalize();const pull=(z.type==='gravity'?17:11)/massOf(e);e.kb.addScaledVector(d,dt*pull);if(z.type==='vortex')e.kb.addScaledVector(new THREE.Vector3(d.z,0,-d.x),dt*8/massOf(e));e.kb.clampLength(0,9);")
rep("damageEnemy(e,42,1,0,null,'ghost');n++;", "damageEnemy(e,42,0,0,null,'ghost');e.kb.addScaledVector(origin.clone().sub(e.root.position).setY(0).normalize(),3/massOf(e));n++;")
rep("s.root.position.y=.2+Math.sin(s.phase*3)*.12;", "s.root.position.y=.2+Math.sin(s.phase*3)*.12;s.root.traverse(o=>{if(o.isMesh&&o.material.transparent)o.material.opacity=.27*Math.min(1,s.life/1.1);});")
# Replace frame-random camera shake with a decaying, coherent recoil curve.
rep("camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;", "camera.position.x+=Math.sin(elapsed*47)*shake*.28;camera.position.y+=Math.cos(elapsed*39)*shake*.22;")
# Remove unsynchronized walk-phase audio; emit on actual stance entry instead.
a=s.index('const footPhase=Math.floor(walkPhase*9/Math.PI);');b=s.index("\nif(moving&&action",a)
old=s[a:b];assert old.endswith('}}')
s=s[:a]+'}\n'+s[b:]
rep("alignExecutionHands();clawTrails(dt);", "alignExecutionHands();clawTrails(dt);contactFootsteps();")
needle='function movementDir()'
pos=s.index(needle)
s=s[:pos]+'''function contactFootsteps(){const m=motionInfo(player),now=m.feet.map(f=>f.planted);if(player.lastFootContacts&&!action&&!finisher&&m.speed>.8)now.forEach((down,i)=>{if(down&&!player.lastFootContacts[i]){const at=new THREE.Vector3(...m.feet[i].actual);at.y=.08;burst(at,0x8b8170,3,1,.26);tone(m.speed>7?78:58,.045,'triangle',.024,26);}});player.lastFootContacts=now;}
'''+s[pos:]
# Read-only physics diagnostics plus deterministic test setup.
rep("get state(){return{motion:", "get state(){return{physics:{bodies:enemies.filter(e=>e.physicalBody).length},motion:")
rep(" readyTether(){", " physicsSnapshot(){return enemies.map(e=>({dead:e.dead,mass:massOf(e),body:bodyInfo(e),y:e.root.position.y,vy:e.vy,tk:e.tk||0,airborne:e.airborne,slamPower:e.slamPower||0}));},\n launchFoe(i){const e=enemies[i];if(e){e.hp=e.maxHp=500;damageEnemy(e,1,8,11);}},\n readyTether(){")
p.write_text(s)
# The original sequence now uses the same continuous director and contact pipeline as all variants.
p=Path('src/finishers.js');s=p.read_text()
s=s.replace("duration:3.12,impact:.755", "duration:3.6,impact:.80",1)
needle="   case 'grave-driver':{"
new='''   case 'soulbreaker':{
    const punch=S(u,.09,.19),withdraw=S(u,.23,.3),dash=S(u,.30,.43),load=pulse(u,.44,.61),lift=S(u,.51,.69),slam=S(u,.72,I),recover=S(u,I+.025,1);
    const front=at(f,0,0,C),back=at(f,0,0,-1.0);p.root.position.lerpVectors(front,back,dash);p.root.position.addScaledVector(f.side,Math.sin(Math.PI*dash)*1.65);p.root.rotation.y=Math.atan2(-f.front.x,-f.front.z)+Math.PI*S(u,.34,.43);
    p.hips.position.y-=.3*load+.3*slam*(1-recover);p.torso.rotation.y=-.55*(1-punch)+.48*punch*(1-withdraw);p.torso.rotation.x=.22*punch*(1-withdraw)+.48*pulse(u,.29,.45)-.3*lift+.98*slam*(1-recover);
    p.arms[1].rotation.set(-1.5*punch*(1-withdraw),0,-.14*punch);p.forearms[1].rotation.x=-1.1*(1-punch)-.15*punch;p.arms[0].rotation.x=-.8*punch;p.forearms[0].rotation.x=-1.25;
    if(u>.11&&u<.27)contact(f,1,'chest',punch*(1-withdraw),.03,.28);
    e.torso.rotation.x=-.28*punch*(1-S(u,.38,.5));e.root.position.y=.06+1.65*lift*(1-slam);e.rig.rotation.x=-.65*lift-.87*slam;e.root.position.addScaledVector(f.front,.6*slam);e.arms.forEach((a,i)=>a.rotation.z=(i?1:-1)*.7*lift);
    if(u>.43){arms(p,-.5-2.05*lift+3.15*slam,.27);p.forearms.forEach(a=>a.rotation.x=-.85+.55*slam);p.rig.position.y=(boss+.15)*lift*(1-slam);p.shins[0].rotation.x=.5*load+.7*slam*(1-recover);p.shins[1].rotation.x=.75*load+.5*slam*(1-recover);}
    if(u>.45&&u<.75)for(let i=0;i<2;i++)contact(f,i,'chest',S(u,.45,.5)*(1-S(u,.70,.75)),i?-.2:.2,-.25);
    if(u>I-.03)fallen(e,S(u,I-.03,I+.025),.12);event(f,'chest',u,.19);event(f,'dash',u,.33,'dash');event(f,'grip',u,.51,'pulse');break;
   }
'''+needle
assert needle in s;s=s.replace(needle,new,1)
s=s.replace('api.polish?.(f);','api.polish?.(f,dt);',1)
s=s.replace("arc=1.02+u*.4+(f.def.school==='ghost'?.3:0)","arc=1.40+Math.sin(u*Math.PI)*.13")
s=s.replace("f.def.school==='brutal'?70:110","f.def.school==='brutal'?42:65")
# Stable hand orientation and a victim bracing against the grasp, after final actor blending.
old="api.aimHand(player,c.hand,goal,clamp(c.weight,0,1));}}"
new="api.aimHand(player,c.hand,goal,clamp(c.weight,0,1));player.hands[c.hand].rotation.x=THREE.MathUtils.lerp(player.hands[c.hand].rotation.x,.05,c.weight);player.fingers?.[c.hand]?.forEach(n=>n.rotation.x=-.65*c.weight);}\n const u=f.t/f.def.duration;if(!f.enemy.physicalBody&&['soulbreaker','furnace-heart','mindbreaker'].includes(f.def.id)&&u>.27&&u<.68){const w=pulse(u,.27,.68)*.8;player.root.updateMatrixWorld(true);for(let i=0;i<2;i++)api.aimHand(f.enemy,i,player.forearms[1-i].localToWorld(new THREE.Vector3(0,-.15,0)),w);}}"
assert old in s;s=s.replace(old,new)
p.write_text(s)
# Physical ghosts and cinematic travel retain their authored arms while feet step.
p=Path('src/motion.js');s=p.read_text();s=s.replace("for(let i=0;i<2;i++){const phase=m.phase+i*Math.PI,sw=", "if(!req.manual)for(let i=0;i<2;i++){const phase=m.phase+i*Math.PI,sw=",1)
s=s.replace("state(player).request={kind:'execution',id:f.def.id,manual:true,moving:0,time:f.t}","state(player).request={kind:'execution',id:f.def.id,manual:true,gait:u<.15||(f.def.id==='soulbreaker'&&u>.3&&u<.44),moving:0,time:f.t}")
p.write_text(s)
# Avoid capturing the same victim twice each frame.
p=Path('src/cinematic.js');s=p.read_text().replace('}else rememberBody(e,dt);','}');p.write_text(s)
