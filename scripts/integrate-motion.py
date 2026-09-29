from pathlib import Path
p=Path('src/main.js');s=p.read_text()
def rep(a,b):
 global s
 assert a in s,a[:100]
 s=s.replace(a,b,1)
rep("import * as THREE from 'three';", "import * as THREE from 'three';\nimport {poseMotion,finishMotion,resetMotion,poseEnemyAction,poseBossMotion,poseDeath,noteImpact,polishExecution,motionInfo,impactAt,CAST_RELEASES,MOTION_CATALOG} from './motion.js';")
rep('const torso=new THREE.Group();torso.position.y=.19;hips.add(torso);', 'const spine=new THREE.Group();spine.position.y=.19;hips.add(spine);const torso=new THREE.Group();spine.add(torso);')
rep('const head=new THREE.Group();head.position.set(0,.94,.015);torso.add(head);', 'const neck=new THREE.Group();neck.position.set(0,.94,.015);torso.add(neck);const head=new THREE.Group();neck.add(head);')
rep('const arms=[],forearms=[],hands=[],legs=[],shins=[];', 'const arms=[],forearms=[],hands=[],legs=[],shins=[],feet=[],toes=[],fingers=[[],[]];')
old="for(let j=0;j<4;j++){const xx=(j-1.5)*.074;horn(hand,[[xx,-.1,.015],[xx*1.2,-.25,.04],[xx*1.25,-.31,.16]],.038,isPlayer?bone:armor)}horn(hand,[[s*.12,-.01,.03],[s*.23,-.12,.07],[s*.2,-.2,.15]],.045,bone);"
new="for(let j=0;j<4;j++){const xx=(j-1.5)*.074,finger=new THREE.Group();finger.position.set(xx,-.1,.015);hand.add(finger);fingers[s<0?0:1].push(finger);horn(finger,[[0,0,0],[xx*.2,-.15,.025],[xx*.25,-.21,.145]],.038,isPlayer?bone:armor);}const thumb=new THREE.Group();thumb.position.set(s*.12,-.01,.03);hand.add(thumb);fingers[s<0?0:1].push(thumb);horn(thumb,[[0,0,0],[s*.11,-.11,.04],[s*.08,-.19,.12]],.045,bone);"
rep(old,new)
old="const foot=orb(shin,armor,0,-.56,.115,.18,.13,.28);for(let j=0;j<3;j++)horn(shin,[[(j-1)*.09,-.54,.26],[(j-1)*.1,-.57,.4]],.04,bone);"
new="const foot=new THREE.Group();foot.position.set(0,-.56,.115);shin.add(foot);feet.push(foot);orb(foot,armor,0,0,0,.18,.13,.28);const toe=new THREE.Group();toe.position.set(0,0,.18);foot.add(toe);toes.push(toe);for(let j=0;j<3;j++)horn(toe,[[(j-1)*.09,.02,-.035],[(j-1)*.1,-.01,.105]],.04,bone);"
rep(old,new)
rep('return{root,rig,hips,torso,head,arms,forearms,hands,legs,shins,tail,wings,ownedMaterials,baseHip:1.22,isPlayer};', 'return{root,rig,hips,spine,torso,neck,head,arms,forearms,hands,legs,shins,feet,toes,fingers,tail,wings,ownedMaterials,baseHip:1.22,isPlayer};')
rep('  wings.push(root);', "  const fan=new THREE.Group(),pivot=new THREE.Vector3(side*.56,.71,-.08);fan.position.copy(pivot);const parts=[...root.children];parts.forEach((child,i)=>{if(i===1)return;child.position.sub(pivot);fan.add(child);});root.add(fan);root.userData.fan=fan;root.userData.flex=0;root.userData.flexV=0;wings.push(root);")
# Add skin movement on the wing's membrane, without moving the bony spars.
rep("wingMembrane.emissiveIntensity=.12;", "wingMembrane.emissiveIntensity=.12;const membraneTime={value:0};wingMembrane.onBeforeCompile=shader=>{shader.uniforms.membraneTime=membraneTime;shader.vertexShader='uniform float membraneTime;\\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\\n transformed.z += sin(position.x*4.1-membraneTime*3.0+position.y*2.2)*.035*smoothstep(.1,1.7,abs(position.x));');};")
rep('function updateWings(dt){', 'function updateWings(dt){\n membraneTime.value+=dt;const motion=motionInfo(player);')
old="w.rotation.z=side*(.05+Math.sin(elapsed*1.5)*.035);"
new="w.rotation.z=side*(.05+Math.sin(elapsed*1.5)*.025)+THREE.MathUtils.clamp(motion.turn*.016,-.12,.12);const target=side*(.1+Math.sin(elapsed*2.1-i*.6)*.035+Math.min(.15,motion.speed*.018));const data=w.userData;if(data.fan){const n=Math.max(1,Math.ceil(dt*120)),h=dt/n;for(let j=0;j<n;j++){data.flexV+=(65*(target-data.flex)-12*data.flexV)*h;data.flex+=data.flexV*h;}data.fan.rotation.y=data.flex;data.fan.rotation.z=-data.flex*.4;}"
rep(old,new)
# Replace the old sinusoidal and per-frame-slerp pose implementation entirely.
a=s.index('function pose(r,t,');b=s.index('const handHistory=',a)
s=s[:a]+"function pose(r,t,moving=0,attack=null){poseMotion(r,t,moving,attack)}\nfunction smoothRig(r,dt){finishMotion(r,dt)}\n"+s[b:]
s=s.replace('player.motionCache=null','resetMotion(player)')
rep("const durations={light:comboStep===4?.64:.43,heavy:.7,cleave:.78,stomp:.83,slam:.8,charged:.88,lunge:.52,aerial:.48};", "const durations={light:[0,.49,.52,.68,.82][comboStep],heavy:.82,cleave:.86,stomp:.92,slam:.96,charged:1.04,lunge:.58,aerial:.62};")
rep("duration:.39,dir:d", "duration:.46,dir:d,facing:player.root.rotation.y,localDir:d.clone().applyQuaternion(player.root.quaternion.clone().invert())")
rep("player.root.rotation.y=Math.atan2(a.dir.x,a.dir.z);burst(pos", "player.root.rotation.y=a.type==='dodge'?a.facing:Math.atan2(a.dir.x,a.dir.z);burst(pos")
rep("if(!a.hit&&u>(['slam','stomp','charged'].includes(a.type)?.56:.38))meleeImpact(a);", "if(!a.hit&&u>impactAt(a))meleeImpact(a);")
rep("e.recoilSide=(Math.random()>.5?1:-1);", "e.recoilSide=(Math.random()>.5?1:-1);noteImpact(e,amount,source||player.root.position);")
rep("eclipseSystems?.onHurt(source);player.recoil", "eclipseSystems?.onHurt(source);noteImpact(player,amount,source);player.recoil")
rep("if(player.recoil){player.torso.rotation.x-=player.recoil;player.head.rotation.x-=player.recoil*.4;}", "")
rep("if(e.recoil>0){e.torso.rotation.x-=e.recoil;e.torso.rotation.z+=e.recoil*e.recoilSide*.6;e.head.rotation.x-=e.recoil*.4;}", "")
# Collapse joints, rather than rotate a standing statue directly into the floor.
rep("if(!e.executed)e.rig.rotation.x=THREE.MathUtils.lerp(e.rig.rotation.x,-1.5,Math.min(dt*5,1));e.root.position.y=Math.max(-1.4,(e.executed?e.corpseY:.06)-e.deathTime*.36);", "if(!e.executed)poseDeath(e);e.root.position.y=Math.max(-1.4,(e.executed?e.corpseY:.06)-Math.max(0,e.deathTime-1.05)*.55);")
a=s.index("if(e.state==='windup'){const u=1-e.timer/");b=s.index('if(pos.y>1)',a);s=s[:a]+"poseEnemyAction(e);"+s[b:]
# Boss contacts: the stomp lands with the downswing, not at the first windup frame.
rep("if(m.kind==='stomp'){bossImpact(e,'stomp',p);m.hit=true;}", "")
rep("const u=Math.min(1,m.t/.78);e.arms", "const u=Math.min(1,m.t/.78);if(m.kind==='stomp'&&u>=.37&&!m.hit){bossImpact(e,'stomp',p);m.hit=true;}e.arms")
# The last resolveWorld in updateBoss, not the other movement calls.
a=s.index('function updateBoss(');b=s.index('function ',a+15)
section=s[a:b].replace(' resolveWorld(p);',' poseBossMotion(e,m);resolveWorld(p);');s=s[:a]+section+s[b:]
# All execution actors receive per-move follow-through; arm contact is reapplied after body work.
rep("if(t>.2&&t<.83)aimHand", "polishExecution(f,player);if(t>.2&&t<.83)aimHand")
rep("createExecutionDirector({", "createExecutionDirector({polish:(f)=>polishExecution(f,player),smoothGhost:(g,dt)=>finishMotion(g,dt),")
# Menus previously skipped all pose finalization.
rep("pose(player,elapsed);player.root.rotation.y=.6", "pose(player,elapsed);smoothRig(player,dt);player.root.rotation.y=.6")
# Summoned spirits need an actual attack timeline rather than one frame of arm rotation.
a=s.index('function updateSummons(dt)');b=s.index('function updateEffects(dt)',a)
s=s[:a]+'''function updateSummons(dt){for(let i=summons.length-1;i>=0;i--){const s=summons[i];s.life-=dt;s.timer-=dt;s.phase+=dt;s.spectral=true;const e=enemies.filter(e=>!e.dead&&finisher?.enemy!==e).sort((a,b)=>flatDistance(a.root.position,s.root.position)-flatDistance(b.root.position,s.root.position))[0];let moving=0;
if(e){const dir=e.root.position.clone().sub(s.root.position).setY(0),d=dir.length();dir.normalize();s.root.rotation.y=angleLerp(s.root.rotation.y,Math.atan2(dir.x,dir.z),Math.min(1,dt*12));if(d>2.2&&!s.attackMotion){s.root.position.addScaledVector(dir,dt*8);moving=1;}else if(s.timer<=0&&!s.attackMotion){s.timer=.85;s.attackMotion={type:'light',t:0,duration:.56,step:(s.attackStep||0)%2+1,target:e,hit:false};s.attackStep=(s.attackStep||0)+1;}}
if(s.attackMotion){const a=s.attackMotion;a.t+=dt;if(!a.hit&&a.t/a.duration>=impactAt(a)){a.hit=true;if(!a.target.dead&&flatDistance(a.target.root.position,s.root.position)<3.5){damageEnemy(a.target,18,2,0,null,'ghost');slash(s.root.position.clone().add(new THREE.Vector3(0,1.4,0)),s.root.rotation.y,false,0x8ad3bd);}}if(a.t>=a.duration)s.attackMotion=null;}
pose(s,s.phase,moving,s.attackMotion);s.root.position.y=.2+Math.sin(s.phase*3)*.12;if(Math.random()<.3)burst(s.root.position,0x86c5b1,2,1,.6);if(s.life<=0){burst(s.root.position,0x86c5b1,30,4,.8);removeTransientRig(s);summons.splice(i,1)}}}
''' +s[b:]
p.write_text(s)
