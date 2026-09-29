from pathlib import Path
p=Path('src/motion.js');s=p.read_text();idx=s.index('export const MOTION_IMPACTS=')
s=s[:idx]+'''// New combat branches have their own loading and contact silhouettes.
const sweep=strike({hy:-.3,T:[.25,-.7,-.15],L1:[-.7,0,.3],K1:[1.1,0,0],A0:[-.6,0,-.6],A1:[.3,0,.7]},{hy:-.45,T:[.4,.6,.18],L1:[-.8,.35,-1.15],K1:[.08,0,0],A0:[.2,0,-.7],A1:[-.7,0,.4]},{hy:-.35,T:[.3,.8,.15],L1:[.2,.2,-.7],K1:[.6,0,0]},{hy:-.15},.5);
const hook=strike({hy:-.15,T:[.15,-.4,0],A1:[-1.5,0,.25],E1:[-.1,0,0],A0:[-.7,0,-.5]},{hy:-.27,T:[-.23,.5,0],A1:[-.45,.35,.5],E1:[-1.65,0,0],A0:[-1.0,0,-.3]},{hy:-.22,T:[-.3,.65,0],A1:[-.3,.4,.6],E1:[-1.75,0,0]},{hy:-.1,A0:[-.9,0,-.3],E0:[-1.1,0,0]},.43);
const knee=strike({hy:-.2,T:[.2,0,0],A0:[-1.3,0,-.3],A1:[-1.3,0,.3],E0:[-.8,0,0],E1:[-.8,0,0],L1:[.3,0,0],K1:[.7,0,0]},{hy:.07,T:[-.25,-.15,0],L1:[-1.9,0,-.1],K1:[1.65,0,0],A0:[-.8,0,-.3],A1:[-.8,0,.3],E0:[-1.5,0,0],E1:[-1.5,0,0]},{hy:-.1,T:[.35,.15,0],L1:[-1.3,0,.1],K1:[1.1,0,0]},{hy:-.15},.46);
const groundstrike=strike({hy:-.15,T:[-.12,0,0],L1:[-1.8,0,.1],K1:[1.3,0,0],A0:[-.5,0,-.6],A1:[-.4,0,.7]},{hy:-.34,T:[.65,-.1,0],L1:[-.7,0,.05],K1:[.08,0,0],A0:[.15,0,-.4],A1:[.2,0,.45]},{hy:-.4,T:[.8,.1,0],L1:[-.25,0,0],K1:[.6,0,0]},{hy:-.1},.52);
const riposte=strike({hy:-.22,T:[.1,-.6,0],A0:[-.95,0,-.7],A1:[.4,0,.4],E0:[-.4,0,0],E1:[-1.4,0,0]},{hy:-.1,T:[.28,.62,0],A1:[-1.65,.3,-.25],E1:[-.06,0,0],A0:[-.4,0,-.5]},{hy:-.22,T:[.42,.82,0],A1:[-1.2,.4,-.4],E1:[-.35,0,0]},{hy:-.12},.42);
const guardPose={hy:-.16,T:[.15,-.13,0],A0:[-1.03,-.2,-.28],A1:[-1.1,.18,.28],E0:[-1.7,0,0],E1:[-1.65,0,0],c0:.8,c1:.8};
const guard=makeClip([[0,guardPose],[1,guardPose]]),getup=makeClip([[0,{hy:-.76,T:[.72,.1,.1],A0:[-.6,0,-.4],E0:[-.1,0,0],L0:[-1.1,0,-.2],L1:[-.8,0,.1],K0:[1.8,0,0],K1:[1.5,0,0]}],[.45,{hy:-.52,T:[.45,0,.08],L0:[-.95,0,-.1],L1:[-.6,0,.1],K0:[1.5,0,0],K1:[1.1,0,0],A0:[-.7,0,-.3],A1:[-.7,0,.3]}],[.8,{hy:-.17,T:[.2,0,0],K0:[.6,0,0],K1:[.5,0,0]}],[1,REST]]);
export function beginRecovery(r){r.rise={t:0,from:Object.entries(joints(r)).map(([k,n])=>({k,node:n,q:n.quaternion.clone(),p:n.position.clone()}))};resetMotion(r);}
export function recoverMotion(r,dt){const rise=r.rise;rise.t+=dt;poseMotion(r,r.phase,0,{type:'getup',t:rise.t,duration:.9});const w=ramp(rise.t,0,.28);for(const f of rise.from){f.node.quaternion.slerpQuaternions(f.q,f.node.quaternion.clone(),w);f.node.position.lerpVectors(f.p,f.node.position.clone(),w);}if(rise.t>=.9)r.rise=null;}
''' +s[idx:]
s=s.replace("MOTION_IMPACTS={heavy:","MOTION_IMPACTS={sweep:.5,hook:.43,knee:.46,groundstrike:.52,riposte:.42,heavy:")
s=s.replace("const clips={light1:","const clips={sweep,hook,knee,groundstrike,riposte,guard,getup,light1:")
p.write_text(s)
p=Path('src/physical.js');s=p.read_text();s+='''
export function kickBody(r,source,strength=6,up=1){const b=bodies.get(r);if(!b)return;const direction=r.root.position.clone().sub(source).setY(0).normalize().multiplyScalar(strength/massOf(r));direction.y=up;for(const p of b.p)p.old.addScaledVector(direction,-1/120);}
'''
# Modest self-separation for hands/head and opposing limbs, fading in after release.
needle='  for(const p of b.p){if(p.x.y<p.radius)'
s=s.replace(needle,"  const sepWeight=Math.min(1,b.age/.2);for(const [i,j]of [[6,0],[7,0],[6,14],[7,14],[10,11],[12,13]]){const a=b.p[i],c=b.p[j],d=c.x.clone().sub(a.x),len=d.length(),min=(a.radius+c.radius)*.82;if(len>1e-5&&len<min){d.multiplyScalar((min-len)/len*.5*sepWeight);a.x.sub(d);c.x.add(d);}}\n"+needle,1);p.write_text(s)
p=Path('src/main.js');s=p.read_text()
def rep(a,b):
 global s
 assert a in s,a[:90]
 s=s.replace(a,b,1)
rep('poseDeath,noteImpact,polishExecution,','poseDeath,noteImpact,beginRecovery,recoverMotion,polishExecution,')
rep('stepMomentum,dynamicPose}', 'stepMomentum,dynamicPose,kickBody}')
rep("let bossExecutionBag=[],", "let clinchTarget=null,clinchTime=0;\nlet bossExecutionBag=[],")
rep("new Set(['light','heavy','slam','cleave','stomp','charged','lunge','aerial'])", "new Set(['light','heavy','slam','cleave','stomp','charged','lunge','aerial','sweep','hook','knee','groundstrike','riposte'])")
rep('comboStep=0;lastAttack=-20;', 'comboStep=0;lastAttack=-20;clinchTarget=null;clinchTime=0;')
rep('dodgeCooldown=0;invuln=2;', 'dodgeCooldown=0;parryCooldown=0;invuln=2;')
rep('function melee(heavy=false,charge=0){','function melee(heavy=false,charge=0,modifiers=null){')
rep("if(action&&attackTypes.has(action.type)){if(action.t>.06)actionQueue=heavy?'heavy':'light';return;}", "if(action&&attackTypes.has(action.type)){if(action.t>.06){const u=action.t/action.duration,hit=impactAt(action);actionQueue={heavy,precise:u>hit+.025&&u<hit+.22,modifiers:{side:!!(keys.KeyA||keys.KeyD||keys.ArrowLeft||keys.ArrowRight),back:!!(keys.KeyS||keys.ArrowDown)}};}return;}")
rep("if(action||attackCooldown>0)return;", "if(action?.type==='guard')action=null;if(action||attackCooldown>0)return;")
rep("let type=heavy?'heavy':'light';", "const branch=modifiers||{side:keys.KeyA||keys.KeyD||keys.ArrowLeft||keys.ArrowRight,back:keys.KeyS||keys.ArrowDown};let type=heavy?'heavy':'light';")
rep("if(charge>0)type='charged';", "if(charge>0)type='charged';\n else if(heavy&&target?.downed>0)type='groundstrike';\n else if(riposte>0)type='riposte';\n else if(heavy&&clinchTime>0&&target===clinchTarget)type='knee';\n else if(heavy&&branch.back)type='hook';\n else if(heavy&&branch.side)type='sweep';")
rep("const durations={light:","const durations={sweep:.88,hook:.8,knee:.76,groundstrike:.82,riposte:.7,light:")
rep("const names={heavy:","const names={sweep:'REAVER SWEEP',hook:'HOOK AND HAUL',knee:'CRUSHING KNEE',groundstrike:'RUIN STOMP',riposte:'RUIN COUNTER',heavy:")
rep("const specs={light:","const specs={sweep:[4,22,3,0],hook:[3.8,20,0,0],knee:[3.6,34,4,6],groundstrike:[4.2,44,3,0],riposte:[4.1,32,6,4],light:")
rep("['cleave','stomp','slam','charged'].includes(a.type)","['cleave','stomp','slam','charged','sweep'].includes(a.type)")
rep("  if(e.dead)continue;\n  const delta=e.root.position.clone().sub(player.root.position)", "  if(e.dead){if(e.physicalBody&&flatDistance(e.root.position,player.root.position)<range)kickBody(e,player.root.position,Math.max(3,knock),a.type==='groundstrike'?3:1);continue;}\n  const delta=e.root.position.clone().sub(player.root.position)")
rep("damage*(riposte>0?1.8:1)*(e.broken", "damage*(a.precise?1.12:1)*(riposte>0?1.8:1)*(e.broken")
rep("damage*(a.type==='light'?.6:1.2);", "damage*(a.type==='light'?.6:1.2)*(a.precise?1.4:1);if(a.precise)energy=Math.min(100,energy+3);\n  if(a.type==='hook'&&!e.dead){e.kb.addScaledVector(player.root.position.clone().sub(e.root.position).setY(0).normalize(),11/massOf(e));e.stagger=Math.max(e.stagger,1.2);clinchTarget=e;clinchTime=1.5;actionText('CLINCH · HEAVY FOR KNEE');}\n  if(a.type==='sweep'&&!e.dead&&!e.boss){startBody(e,e.kb.clone().add(new THREE.Vector3(0,1.5,0)));e.downed=e.elite?.7:1.2;e.stagger=2.2;}\n  if(a.type==='groundstrike'&&e.physicalBody){kickBody(e,player.root.position,4,3);e.downed=Math.max(e.downed||0,.5);}\n  if(a.type==='knee')clinchTime=0;")
rep("if(launch&&!e.boss){", "if(e.physicalBody&&(knock||launch))kickBody(e,source||player.root.position,knock,launch*.45);if(launch&&!e.boss&&!e.physicalBody){")
# Held guard is directional and costs wrath; crimson/unblockable attacks ignore it.
needle="if(action?.type==='charge'){action=null;heavyHeld=false;}eclipseSystems?.onHurt(source);"
rep(needle,"if(!unblockable&&(action?.type==='guard'||action?.type==='parry'&&keys.KeyF)){const toward=(source||nearest(6)?.root.position||player.root.position.clone().add(facing())).clone().sub(player.root.position).setY(0).normalize();if(toward.dot(facing())>.1){const cost=6+amount*.25;if(energy>=cost){energy-=cost;health=Math.max(0,health-amount*.15);invuln=.14;noteImpact(player,amount*.6,source);actionText('GUARDED');tone(180,.09,'triangle',.08,55);if(health<=0)gameOver();return;}energy=0;action=null;parryCooldown=1.5;actionText('GUARD BROKEN');}}"+needle)
rep("function updatePlayer(dt){const pos=", "function updatePlayer(dt){clinchTime=Math.max(0,clinchTime-dt);const pos=")
rep("}else if(a.type==='tether'){", "}else if(a.type==='guard'){speed*=.35;if(!keys.KeyF)action=null;}else if(a.type==='tether'){")
rep("if(u>=1&&a.type!=='charge'){action=null;attackCooldown=.05;if(actionQueue){let q=actionQueue;actionQueue=null;attackCooldown=0;melee(q==='heavy')}}", "if(u>=1&&a.type!=='charge'&&a.type!=='guard'){if(a.type==='parry'&&keys.KeyF){action={type:'guard',t:0,duration:1};}else{action=null;attackCooldown=.05;if(actionQueue){let q=actionQueue;actionQueue=null;attackCooldown=0;melee(!!q.heavy,0,q.modifiers);if(action){action.precise=!!q.precise;if(q.precise){recordMove('PERFECT LINK');actionText('PERFECT LINK');}}}}}")
# Alive knockdowns share the ragdoll solver and then blend into an authored get-up.
needle="continue}if(e.burn>0)"
rep(needle,"continue}if(e.downed>0){e.downed=Math.max(0,e.downed-dt);stepBody(e,dt,obstacles);e.bar.visible=false;if(e.downed<=0){beginRecovery(e);clearBody(e);}continue;}if(e.rise){recoverMotion(e,dt);e.stagger=Math.max(e.stagger,.2);continue;}if(e.burn>0)")
rep("function updateEffects(dt){impactWorld", "function updateEffects(dt){const corpses=enemies.filter(e=>e.dead&&e!==finisher?.enemy);while(corpses.length>12){const e=corpses.shift();removeTransientRig(e);enemies.splice(enemies.indexOf(e),1);}impactWorld")
rep("$('lockLabel').textContent=lockTarget.kind+' · '+Math.ceil(lockTarget.hp)+' VITALITY';", "$('lockLabel').textContent=lockTarget.kind+' · '+(lockTarget.downed>0?'DOWNED · HEAVY TO STOMP':Math.ceil(lockTarget.hp)+' VITALITY');")
rep("function updateNewHUD(){", "function updateNewHUD(){\n const striking=action&&attackTypes.has(action.type);$('meleeTiming').classList.toggle('hidden',!striking&&!clinchTime&&action?.type!=='guard');if(striking){const u=action.t/action.duration,hit=impactAt(action),open=u>hit+.025&&u<hit+.22;$('meleeTiming').textContent=open?'LINK NOW · LIGHT / HEAVY':'COMMIT → CONTACT → LINK';$('meleeTiming').classList.toggle('link-open',open);}else $('meleeTiming').textContent=action?.type==='guard'?'GUARD · WRATH ABSORBS IMPACTS':'CLINCH · HEAVY FOR KNEE';\n")
rep("get state(){return{gore:", "get state(){return{precise:!!action?.precise,clinchTime,gore:")
rep("broken:e.broken||0,juggles", "downed:e.downed||0,recovering:!!e.rise,broken:e.broken||0,juggles")
rep(" toughFoe(i=0)", " combatReady(){attackCooldown=parryCooldown=dodgeCooldown=0;invuln=0;energy=100;health=100;action=null;},\n hitGuard(amount=20){invuln=0;hurt(amount,false,player.root.position.clone().addScaledVector(facing(),2));},\n toughFoe(i=0)")
p.write_text(s)
p=Path('index.html');s=p.read_text().replace('<div id="castReadout"','<div id="meleeTiming" class="hidden" aria-live="polite"></div><div id="castReadout"',1)
s=s.replace('<div class="codex-moves">','<div class="codex-moves"><div><kbd>A/D + RMB</kbd><span>Reaver Sweep<small>Directional heavy trips non-bosses into a live ragdoll. Heavy again for a ground stomp.</small></span></div><div><kbd>S + RMB → RMB</kbd><span>Hook and Haul<small>Pull into a clinch, then drive a crushing knee.</small></span></div><div><kbd>HOLD F</kbd><span>Held Guard<small>After the parry window, absorb frontal hits using wrath. Crimson attacks and rear attacks bypass guard.</small></span></div><div><kbd>CONTACT → L/R</kbd><span>Perfect Link<small>Queue your next strike during the amber link window for extra damage, poise damage and wrath.</small></span></div>',1);p.write_text(s)
p=Path('overhaul.css');s=p.read_text()+'''\n#meleeTiming{position:fixed;left:50%;bottom:151px;transform:translateX(-50%);font:10px/1.8 system-ui,sans-serif;letter-spacing:.13em;padding:8px 16px;background:#10181ee8;color:#9caea9;border:1px solid #41514e;pointer-events:none;min-width:220px;text-align:center}#meleeTiming.link-open{color:#ffe0a5;border-color:#bc8f53;background:#2f2116e8}.cinematic #meleeTiming{display:none}\n''';p.write_text(s)
