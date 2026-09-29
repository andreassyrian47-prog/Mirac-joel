from pathlib import Path
p=Path('src/main.js');s=p.read_text()
s=s.replace('let clinchTarget=null,clinchTime=0;',"const STANCES=[{name:'REAVER',speed:1.18,damage:.88,poise:.9},{name:'BREAKER',speed:.9,damage:1.2,poise:1.45},{name:'WRAITH',speed:1.05,damage:1,poise:1}];let stance=0,flow=0,flowGrace=0;\nlet clinchTarget=null,clinchTime=0;")
s=s.replace("'riposte','guardbreak']);", "'riposte','guardbreak','crusher','riftstrike','flowburst']);")
s=s.replace('resonance.clear();resonanceTime=0;aegis=', 'resonance.clear();resonanceTime=0;stance=flow=flowGrace=0;aegis=')
s=s.replace("if(e.code==='KeyQ')castPower();", "if(e.code==='KeyZ')switchStance();if(e.code==='KeyN')flowBurst();if(e.code==='KeyQ')castPower();")
pos=s.index('function beginHeavy(){')
s=s[:pos]+'''function gainFlow(){flow=Math.min(3,flow+1);flowGrace=7;}
function switchStance(){
 if(finisher||paused||wheelOpen)return;
 if(action&&attackTypes.has(action.type)){const u=action.t/action.duration,h=impactAt(action);if(!action.hit||u<h||u>h+.28||energy<8){notify('Stance cancel: press Z just after contact · 8 wrath');return;}energy-=8;action=null;attackCooldown=0;gainFlow();recordMove('STANCE CANCEL');}
 else if(action)return;stance=(stance+1)%3;actionText(STANCES[stance].name+' STANCE');ring(player.root.position,[0xe8a669,0xd8bc85,0x82dcc7][stance],1.4,.3);
}
function flowBurst(){if(finisher||paused||wheelOpen||flow<3)return;flow=0;flowGrace=0;cancelUnreleasedCast();actionQueue=null;heavyHeld=false;action={type:'flowburst',t:0,duration:.78,step:0,hit:false,charge:0,target:nearest(7)};invuln=.55;recordMove('FLOW REVERSAL');actionText('FLOW REVERSAL');}
'''+s[pos:]
s=s.replace("else if(!heavy&&(dodgeLink>0", "else if(heavy&&stance===1)type='crusher';\n else if(heavy&&stance===2)type='riftstrike';\n else if(!heavy&&(dodgeLink>0")
s=s.replace('const durations={guardbreak:', 'const durations={crusher:.95,riftstrike:.7,flowburst:.78,guardbreak:').replace("const names={guardbreak:","const names={crusher:'MARROW CRUSHER',riftstrike:'VEIL REND',flowburst:'FLOW REVERSAL',guardbreak:")
s=s.replace('duration:durations[type],step:', 'duration:durations[type]/STANCES[stance].speed,stance,step:')
s=s.replace('const specs={guardbreak:', 'const specs={crusher:[4.4,42,8,0],riftstrike:[4.8,27,4,3],flowburst:[6,55,14,4],guardbreak:')
s=s.replace("['cleave','stomp','slam','charged','sweep'].includes", "['cleave','stomp','slam','charged','sweep','flowburst'].includes")
s=s.replace("damageEnemy(e,damage*(a.precise?1.12:1)", "if(e.soulAnchor>0){e.soulAnchor=0;damageEnemy(e,e.anchorPower||52,0,0,null,'ghost');health=Math.min(runMods.maxHealth,health+12);actionText('SOUL ANCHOR RUPTURE');ring(e.root.position,colors.ghost,3,.5);}\n  let guardFactor=1;if(e.guardActive&&facing().dot(new THREE.Vector3(Math.sin(e.root.rotation.y),0,Math.cos(e.root.rotation.y)))<-.3){e.guardMeter-=damage*(a.type==='light'?.65:a.type==='guardbreak'?3:1.8);if(e.guardMeter>0){guardFactor=.3;actionText('GUARDED · FLANK OR BREAK');ring(chestContact(e),0xb9cbe0,1,.2);}else{e.guardActive=false;e.guardMeter=0;e.broken=2.8;e.stagger=2.8;gainFlow();recordMove('ENEMY GUARD BREAK');}}\n  damageEnemy(e,damage*guardFactor*STANCES[a.stance??stance].damage*(a.precise?1.12:1)")
s=s.replace('),knock,launch,null,weaveTime>0?weaveSchool:null);', "),knock*guardFactor,guardFactor<1?0:launch,null,a.type==='riftstrike'?'ghost':weaveTime>0?weaveSchool:null);")
s=s.replace("damage*(a.type==='light'?.6:1.2)*(a.precise?1.4:1)","damage*(a.type==='light'?.6:1.2)*(a.precise?1.4:1)*STANCES[a.stance??stance].poise")
s=s.replace("if(a.precise)energy=Math.min(100,energy+3);", "if(a.precise){energy=Math.min(100,energy+3);if(!a.flowAwarded){gainFlow();a.flowAwarded=true;}}")
s=s.replace("function dodge(){if(action?.type==='dodge'", "function dodge(){if(action?.type==='aerial'&&action.hit&&action.target&&!action.target.dead&&action.t/action.duration<.9&&(action.target.enemySteps||0)<2&&energy>=8){const e=action.target;e.enemySteps=(e.enemySteps||0)+1;e.juggles=0;e.airHold=.9;e.vy=2;energy-=8;action={type:'enemystep',t:0,duration:.25,target:e};attackCooldown=0;dodgeLink=.8;invuln=.25;gainFlow();recordMove('ENEMY STEP');actionText('ENEMY STEP · RE-LAUNCH YOUR COMBO');return;}if(action?.type==='dodge'")
s=s.replace("if(perfect){energy=", "if(perfect){gainFlow();energy=")
s=s.replace("function parry(){if(finisher||parryCooldown>0)return;", "function parry(){if(finisher||parryCooldown>0)return;if(action&&attackTypes.has(action.type)){if(!action.hit||energy<6){notify('Guard cancel opens after contact · 6 wrath');return;}energy-=6;recordMove('GUARD CANCEL');}")
s=s.replace("actionText('PERFECT PARRY · RIPOSTE READY');", "gainFlow();actionText('PERFECT PARRY · RIPOSTE READY');")
s=s.replace("}else if(a.type==='phoenix'){", "}else if(a.type==='enemystep'){speed=0;player.rig.position.y=Math.max(0,(a.target?.root.position.y||0)*.7)+Math.sin(u*Math.PI)*.35;}else if(a.type==='phoenix'){")
s=s.replace("e.juggles=0;e.landTime", "e.juggles=0;e.enemySteps=0;e.landTime")
s=s.replace("Object.assign(e,{hp:elite?", "Object.assign(e,{guardMeter:elite?85:0,guardMax:elite?85:0,guardActive:false,hp:elite?")
s=s.replace("const angle=Math.atan2(delta.x,delta.z);e.root.rotation.y=angleLerp(e.root.rotation.y,angle,Math.min(ed*5,1));", "const angle=Math.atan2(delta.x,delta.z);if(e.state!=='strike'&&(e.state!=='windup'||e.timer>.28))e.root.rotation.y=angleLerp(e.root.rotation.y,angle,Math.min(ed*5,1));e.guardActive=!!(e.elite&&!e.boss&&!e.broken&&e.guardMeter>0&&e.state==='chase'&&dist<6&&e.stagger<=0);if(e.guardMax&&e.state==='recover')e.guardMeter=Math.min(e.guardMax,e.guardMeter+dt*10);")
s=s.replace("poseEnemyAction(e);dynamicPose(e,ed);", "poseEnemyAction(e);if(e.guardActive){e.arms[0].rotation.x=-1.15;e.forearms[0].rotation.x=-1.5;e.arms[1].rotation.x=-.9;e.forearms[1].rotation.x=-1.3;e.torso.rotation.y=-.3;}dynamicPose(e,ed);")
s=s.replace("if(e.stalker)e.torso.rotation.x+=.24;", "if(e.stalker){e.torso.rotation.x+=.24;if(e.state==='windup'&&e.timer>.35){const side=e.phase%2>1?1:-1;pos.addScaledVector(new THREE.Vector3(delta.z,0,-delta.x),side*ed*1.7);e.torso.rotation.z=side*.16;}}")
# Wall smash -> live recoverable ragdoll, not only a number and a stagger.
s=s.replace("actionText('WALL CRUSH');ring(e.root.position", "if(!e.boss&&!e.dead&&!e.physicalBody){startBody(e,e.kb.clone().setY(2));e.downed=.85;e.stagger=1.4;}actionText('WALL CRUSH');ring(e.root.position")
s=s.replace("function updateMode(dt){aegisTime", "function updateMode(dt){flowGrace=Math.max(0,flowGrace-dt);if(!flowGrace)flow=0;$('stanceName').textContent=STANCES[stance].name;$('flowPips').textContent='◆'.repeat(flow)+'◇'.repeat(3-flow);$('flowHint').textContent=flow===3?'N · FLOW REVERSAL':'Z · STANCE / CONTACT CANCEL';aegisTime")
s=s.replace('return{aegis,reaperWard,', 'return{stance:STANCES[stance].name,flow,aegis,reaperWard,')
s=s.replace('hp:e.hp,riftId:', 'hp:e.hp,guard:e.guardActive,guardMeter:e.guardMeter,enemySteps:e.enemySteps||0,soulAnchor:e.soulAnchor||0,snared:e.snared||0,riftId:')
p.write_text(s)
p=Path('src/motion.js');s=p.read_text().replace('const clips={phoenix:slam,','const clips={crusher:hammer,riftstrike:mirrorClip(clawR),flowburst:cleave,enemystep:aerial,phoenix:slam,')
# Direct asymmetric secondary motion: less uniform and less overdamped.
s=s.replace("r.hips.rotation.y+=Math.sin(m.phase)*.13*w", "r.hips.rotation.y+=Math.sin(m.phase)*.19*w").replace("sw*.65*w", "sw*.82*w").replace(".045*w", ".06*w").replace("req.kind==='locomotion'?.16:.085", "req.kind==='locomotion'?.11:.055")
s=s.replace("const shock=Math", "const shock=Math")
s=s.replace("Math.exp(-t*9)*Math.sin(t*23)", "Math.exp(-t*8)*Math.sin(t*27)").replace("shock*h.z*.45", "shock*h.z*.6").replace("shock*h.x*.7", "shock*h.x*.9")
s=s.replace("if(attack?.type==='aerial')", "if(attack?.type==='crusher'){r.torso.rotation.y+=Math.sin(u*Math.PI)*.35;r.arms[0].rotation.z-=.2*Math.sin(u*Math.PI);}if(attack?.type==='riftstrike'){r.torso.rotation.y-=Math.sin(u*Math.PI)*.5;r.hips.rotation.y-=Math.sin(u*Math.PI)*.2;}\n if(attack?.type==='aerial')")
p.write_text(s)
