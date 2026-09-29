from pathlib import Path
p=Path('src/main.js');s=p.read_text()
def swap(a,b):
 global s
 assert a in s, a[:120]
 s=s.replace(a,b)
def block(start,end,new):
 global s
 a=s.index(start);b=s.index(end,a);s=s[:a]+new+'\n'+s[b:]
swap("let yaw=0,pitch=.21,walkPhase=0,damageAlpha=0,cinemaTime=0;", """let yaw=0,pitch=.21,walkPhase=0,damageAlpha=0,cinemaTime=0;
let heavyHeld=false,dodgeLink=0,weaveTime=0,weaveSchool='fire',lastMeleeHit=-20,lastMove='',styleVariety=new Set(),currentDistrict='';
const attackTypes=new Set(['light','heavy','slam','cleave','stomp','charged','lunge','aerial']);
const combatLog=[];
function recordMove(name){lastMove=name;combatLog.push(name);if(combatLog.length>30)combatLog.shift();styleVariety.add(name);}
""")
# Input charge is canceled cleanly by pauses, death, evades and powers.
swap("if(e.button===2)melee(true)","if(e.button===2)beginHeavy()")
swap("window.addEventListener('pointerup',()=>dragging=false)","window.addEventListener('pointerup',e=>{dragging=false;if(e.button===2)releaseHeavy()})")
swap("paused=true;Object.keys(keys)","paused=true;heavyHeld=false;if(action?.type==='charge')action=null;Object.keys(keys)")
swap("health=100;energy=100;score=0;kills=0;combo=0;wave=0;", "health=100;energy=100;score=0;kills=0;combo=0;wave=0;heavyHeld=false;dodgeLink=weaveTime=0;lastMeleeHit=-20;comboStep=0;lastAttack=-20;combatLog.length=0;styleVariety.clear();currentDistrict='';player.motionCache=null;")
swap("function gameOver(){mode='dead';", "function gameOver(){heavyHeld=false;mode='dead';")
block('function melee(heavy=false)', 'function dodge()', """function beginHeavy(){
 if(finisher||paused||wheelOpen||mode!=='game')return;
 heavyHeld=true;
 if(action){melee(true);return;}
 if(attackCooldown>0)return;
 aim(9);action={type:'charge',t:0,duration:1.5,level:0};
}
function releaseHeavy(){
 heavyHeld=false;
 if(action?.type!=='charge')return;
 const charge=action.t;action=null;attackCooldown=0;
 melee(true,charge>=.65?Math.min(1,(charge-.35)/.85):0);
}
function melee(heavy=false,charge=0){
 if(finisher||wheelOpen||paused||mode!=='game')return;
 if(action&&attackTypes.has(action.type)){if(action.t>.06)actionQueue=heavy?'heavy':'light';return;}
 if(action?.type==='dodge'&&action.t>.13){action=null;dodgeLink=.8;}
 if(action?.type==='cast'&&action.t>.18){action=null;}
 if(action||attackCooldown>0)return;
 const target=aim(dodgeLink>0||keys.ShiftLeft?11:7);
 if(elapsed-lastAttack>1.35)comboStep=0;
 const chain=comboStep;
 let type=heavy?'heavy':'light';
 if(charge>0)type='charged';
 else if(target&&(target.airborne||target.root.position.y>.8))type=heavy||(target.juggles||0)>=3?'slam':'aerial';
 else if(heavy&&chain===2)type='cleave';
 else if(heavy&&chain===3)type='stomp';
 else if(!heavy&&(dodgeLink>0||((keys.ShiftLeft||keys.ShiftRight)&&movementDir().lengthSq()>.1)))type='lunge';
 if(type==='light')comboStep=(comboStep%4)+1;
 else if(type!=='aerial')comboStep=0;
 const durations={light:comboStep===4?.64:.43,heavy:.7,cleave:.78,stomp:.83,slam:.8,charged:.88,lunge:.52,aerial:.48};
 const names={heavy:'HELL RISING',cleave:'REAPING CIRCLE',stomp:'JUDGEMENT HEEL',slam:'FALL FROM GRACE',charged:charge>.8?'WORLD BREAKER':'CRUCIBLE STRIKE',lunge:'RIFT TALON',aerial:'ASCENDANT CLAWS'};
 action={type,t:0,duration:durations[type],step:comboStep,hit:false,target,charge,start:player.root.position.clone()};
 if(type==='aerial'&&target){target.airHold=.55;target.vy=0;target.juggles=(target.juggles||0)+1;invuln=.48;}
 if(type==='lunge'){invuln=Math.max(invuln,.2);dodgeLink=0;}
 lastAttack=elapsed;recordMove(names[type]||`CLAW ${comboStep}`);if(names[type])actionText(names[type]);
 tone(160,.14,'sawtooth',.035,60);
}
""")
swap("actionQueue=null;energy-=10;", "heavyHeld=false;actionQueue=null;energy-=10;dodgeLink=.95;")
swap("actionQueue=null;action={type:'parry'", "heavyHeld=false;actionQueue=null;action={type:'parry'")
block('function meleeImpact(a)', 'function movementDir()', """function meleeImpact(a){
 a.hit=true;
 const specs={light:[3.5,a.step===4?33:18,a.step===4?6:2,0],heavy:[3.9,30,2,9.5],cleave:[5.2,41,8,0],stomp:[5.2,47,5,4],slam:[5.5,65,12,0],charged:[5.5+a.charge*2,48+a.charge*34,11,7],lunge:[4.4,29,2,0],aerial:[4.2,18,0,0]};
 const [range,damage,knock,launch]=specs[a.type];
 const radial=['cleave','stomp','slam','charged'].includes(a.type)||a.step===3;
 const color=weaveTime>0?colors[weaveSchool]:0xffaa6a;
 const pos=player.root.position.clone().add(new THREE.Vector3(0,1.7+(a.type==='aerial'?Math.max(0,(a.target?.root.position.y||0)):0),0));
 slash(pos,player.root.rotation.y,a.type!=='light',color);
 let count=0;
 for(const e of enemies){
  if(e.dead)continue;
  const delta=e.root.position.clone().sub(player.root.position).setY(0),d=delta.length(),dot=delta.normalize().dot(facing());
  if(d>=range||(!radial&&dot<-.12))continue;
  count++;
  const fromBehind=facing().dot(new THREE.Vector3(Math.sin(e.root.rotation.y),0,Math.cos(e.root.rotation.y)))>.65;
  damageEnemy(e,damage*(riposte>0?1.8:1)*(e.broken>0?1.3:1)*(fromBehind?1.12:1),knock,launch);
  e.poise=(e.poise||0)+damage*(a.type==='light'?.6:1.2);
  if(e.poise>=(e.elite?115:65)&&!e.dead){e.poise=0;e.broken=3.2;e.stagger=3.2;ring(e.root.position,0xd9c8a5,2.5,.5);actionText('WILL SHATTERED');recordMove('WILL SHATTERED');}
  if(a.type==='aerial'){e.airHold=.55;e.vy=1.5;e.airborne=true;e.stagger=.8;}
  if(a.type==='slam'){e.airHold=0;e.vy=-19;e.stagger=1.5;}
  if(weaveTime>0){
   burst(e.root.position.clone().add(new THREE.Vector3(0,1.6,0)),color,16,4,.6);
   if(weaveSchool==='fire'){e.burn=4;e.burnTick=.5;}
   if(weaveSchool==='mind'){e.stagger=Math.max(e.stagger,1.2);e.poise+=20;}
   if(weaveSchool==='ghost')health=Math.min(100,health+4);
  }
 }
 if(['slam','stomp','charged','cleave'].includes(a.type)){ring(player.root.position,color,range,.6);burst(player.root.position,color,a.type==='charged'?95:45,9,.8);shake=.35;}
 if(count){lastMeleeHit=elapsed;if(riposte>0){actionText('INFERNAL RIPOSTE');recordMove('INFERNAL RIPOSTE');riposte=0;}shake=Math.max(shake,a.type==='light'?.12:.23);hitstop=a.type==='charged'?.095:.045;tone(a.type==='light'?85:55,.16,'sawtooth',.12,18);if(a.step===4&&a.type==='light')actionText('RUINOUS CHAIN');score+=styleVariety.size*count*2;}else tone(170,.1,'triangle',.025,50);
}
""")
# Hit reactions carry direction and weight into body animation.
swap("e.stagger=Math.max(e.stagger,.35);e.flash=.15;", "e.stagger=Math.max(e.stagger,.35);e.flash=.26;e.recoil=Math.min(.7,amount*.012);e.recoilSide=(Math.random()>.5?1:-1);e.poise=e.poise||0;")
swap("if(launch){e.vy=launch;", "if(launch){e.juggles=0;e.airHold=0;e.vy=launch;")
swap("e.hp<=e.maxHp*.6&&flatDistance", "(e.hp<=e.maxHp*.6||e.broken>0)&&flatDistance")
swap("Weaken an enemy below 60% vitality, then press E nearby", "Weaken an enemy below 60% vitality or break their will, then press E nearby")
swap("action=null;actionQueue=null;finisher=", "heavyHeld=false;action=null;actionQueue=null;finisher=")
# Spell-weaving rewards alternating powers with physical attacks.
swap("energy-=p.cost;cooldowns[selected]=p.cd;", "const weave=elapsed-lastMeleeHit<.8;energy-=p.cost*(weave?.75:1);cooldowns[selected]=p.cd;weaveTime=4;weaveSchool=p.type;heavyHeld=false;")
swap("action={type:'cast',t:0,duration:.55};actionText(p.name.toUpperCase());", "action={type:'cast',t:0,duration:weave?.4:.65,school:p.type,powerIndex:selected};actionText(weave?'SPELLWEAVE · '+p.name.toUpperCase():p.name.toUpperCase());if(weave)recordMove('SPELLWEAVE');")
# Modify casting poses and add distinct strike animation clips.
swap("if(attack.type==='cast'){const f=Math.sin(u*Math.PI);r.arms[0].rotation.set(-1.5*f,0,-.8*f);r.arms[1].rotation.set(-1.5*f,0,.8*f);r.forearms[0].rotation.x=-.5*f;r.forearms[1].rotation.x=-.5*f;r.torso.rotation.x=-.2*f;}}", """if(attack.type==='charge'){const c=Math.min(1,attack.t/1.1);r.hips.position.y-=.22*c;r.torso.rotation.set(.12,-.6*c,0);r.arms[1].rotation.set(.5,-.4*c,.55*c);r.forearms[1].rotation.x=-1.1*c;r.arms[0].rotation.set(-.7,0,-.35);r.legs[0].rotation.x=-.25*c;r.legs[1].rotation.x=.2*c;}
if(attack.type==='cleave'){const spin=THREE.MathUtils.smoothstep(u,.12,.78);r.rig.rotation.y=TAU*spin;r.torso.rotation.x=.1;r.arms[0].rotation.set(-.35,0,-1.2*Math.sin(u*Math.PI));r.arms[1].rotation.set(-.35,0,1.2*Math.sin(u*Math.PI));r.hips.position.y-=Math.sin(u*Math.PI)*.12;r.legs[1].rotation.z=.3*Math.sin(u*Math.PI);}
if(attack.type==='stomp'){const lift=THREE.MathUtils.smoothstep(u,0,.35),down=THREE.MathUtils.smoothstep(u,.39,.62),f=1-recover;r.legs[1].rotation.x=(-2.25*lift+2.6*down)*f;r.shins[1].rotation.x=.8*(1-down);r.torso.rotation.x=(-.35*lift+.95*down)*f;r.arms[0].rotation.z=-.7*f;r.arms[1].rotation.z=.7*f;r.hips.position.y-=.23*down*f;}
if(attack.type==='charged'){const f=Math.sin(u*Math.PI);r.rig.position.y=.35*f;r.torso.rotation.set((-.45*wind+1.35*strike)*power,(-.8*wind+1.6*strike)*power,0);r.arms.forEach((a,i)=>a.rotation.set((-2.65*wind+3.4*strike)*power,0,(i?1:-1)*.3*f));r.hips.position.y-=.3*strike*power;r.legs[0].rotation.x=-.6*f;r.shins[1].rotation.x=.65*f;}
if(attack.type==='lunge'){const f=Math.sin(u*Math.PI);r.torso.rotation.x=.6*f;r.torso.rotation.y=(-.5+strike)*power;r.arms[1].rotation.set(-1.9*strike*power,-.4*power,0);r.forearms[1].rotation.x=-.7*(1-strike);r.arms[0].rotation.x=.7*f;r.legs[0].rotation.x=-.85*f;r.legs[1].rotation.x=.6*f;r.rig.position.y=.2*f;}
if(attack.type==='aerial'){const f=Math.sin(u*Math.PI),h=Math.max(.5,attack.target?.root.position.y||1);r.rig.position.y=h*f;r.rig.rotation.y=Math.PI*1.6*THREE.MathUtils.smoothstep(u,.15,.85);r.torso.rotation.x=-.15;r.arms[0].rotation.set(-1.2*f,0,-.6*f);r.arms[1].rotation.set(-2*strike*power,0,.45*f);r.legs[0].rotation.x=-.9*f;r.legs[1].rotation.x=-.4*f;r.shins.forEach(a=>a.rotation.x=1.2*f);}
if(attack.type==='cast'){const f=Math.sin(u*Math.PI);if(attack.school==='mind'){r.arms[0].rotation.set(-.6*f,0,-1.25*f);r.arms[1].rotation.set(-.6*f,0,1.25*f);r.forearms.forEach(a=>a.rotation.x=-1.8*f);r.head.rotation.x=-.18*f;r.torso.rotation.x=-.1*f;}else if(attack.school==='ghost'){r.arms[0].rotation.set(-1.25*f,0,(.7-1.8*strike)*f);r.arms[1].rotation.set(-1.25*f,0,(-.7+1.8*strike)*f);r.torso.rotation.x=-.2*f;r.hips.position.y+=f*.1;}else{r.arms[1].rotation.set(-1.6*f,0,.2*f);r.forearms[1].rotation.x=-.5*f;r.arms[0].rotation.set(.2*f,0,-.5*f);r.torso.rotation.set(.13*f,-.35*f,0);}}
}
function smoothRig(r,dt){
 const nodes=[r.rig,r.hips,r.torso,r.head,...r.arms,...r.forearms,...r.hands,...r.legs,...r.shins,...r.tail];
 if(!r.motionCache){r.motionCache=nodes.map(n=>({q:n.quaternion.clone(),p:n.position.clone()}));return;}
 const alpha=1-Math.exp(-dt*(finisher?34:26));
 nodes.forEach((n,i)=>{const c=r.motionCache[i];c.q.slerp(n.quaternion,alpha);c.p.lerp(n.position,alpha);n.quaternion.copy(c.q);n.position.copy(c.p);});
}
const handHistory=[null,null];let trailClock=0;
function clawTrails(dt){
 trailClock+=dt;player.root.updateMatrixWorld(true);
 for(let i=0;i<2;i++){
  const p=player.hands[i].getWorldPosition(new THREE.Vector3());
  const active=action&&attackTypes.has(action.type)&&action.t/action.duration>.2&&action.t/action.duration<.7;
  if(active&&handHistory[i]&&trailClock>.025&&p.distanceTo(handHistory[i])<3){const c=weaveTime>0?colors[weaveSchool]:0xffba7c;beam(handHistory[i],p,c,.023,.16);burst(p,c,1,1,.25);}
  if(trailClock>.025)handHistory[i]=p;
 }
 if(trailClock>.025)trailClock=0;
}
""")
# Charge, lunge and air attacks participate in the same buffered state machine.
swap("if(action){action.t+=dt;const a=action,u=a.t/a.duration;if(a.type==='dodge'", """if(action){action.t+=dt;const a=action,u=a.t/a.duration;if(a.type==='charge'){
 speed*=.25;pose(player,walkPhase,moving*.2,a);const level=a.t>.95?2:a.t>.65?1:0;if(level>a.level){a.level=level;ring(pos,level===2?0xffdf9c:0xf48246,1.3+level,.35);tone(160+level*100,.18,'triangle',.06,90);actionText(level===2?'WORLD BREAKER READY':'CRUCIBLE READY');}if(Math.random()<.4)burst(pos.clone().add(new THREE.Vector3(.5,1.6,0)),0xff753c,2,2,.5);if(!heavyHeld||a.t>=1.5)releaseHeavy();
 }else if(a.type==='dodge'""")
swap("else if(['light','heavy','slam'].includes(a.type)){if(u<.42)pos.addScaledVector(facing(),dt*3.4);if(!a.hit&&u>(a.type==='slam'?.57:.38))meleeImpact(a);speed*=.25}else speed*=.25;pose(player,walkPhase,moving*.3,a);if(u>=1)", """else if(attackTypes.has(a.type)){
 if(u<.4){const d=a.target&&!a.target.dead?flatDistance(pos,a.target.root.position):10;const advance=a.type==='lunge'?20:a.type==='aerial'?6:3.4;if(d>1.8)pos.addScaledVector(facing(),Math.min(dt*advance,d-1.8));}
 if(!a.hit&&u>(['slam','stomp','charged'].includes(a.type)?.56:.38))meleeImpact(a);
 speed*=.2;
 }else speed*=.25;if(a.type!=='charge')pose(player,walkPhase,moving*.3,a);if(u>=1&&a.type!=='charge')""")
swap("const offset=new THREE.Vector3(Math.sin(yaw)*7.4,3.4+pitch*5.5,Math.cos(yaw)*7.4);", "const distance=action?.type==='aerial'?8.5:7.8;camera.fov=THREE.MathUtils.lerp(camera.fov,sprint&&moving?62:action?.type==='charge'?52:57,1-Math.exp(-dt*4));camera.updateProjectionMatrix();const offset=new THREE.Vector3(Math.sin(yaw)*distance,3.7+pitch*5.5,Math.cos(yaw)*distance);")
# Posture and enemy recoil.
swap("e.flash=Math.max(0,e.flash-dt);", "e.flash=Math.max(0,e.flash-dt);e.broken=Math.max(0,(e.broken||0)-dt);e.poise=Math.max(0,(e.poise||0)-dt*4);e.recoil=Math.max(0,(e.recoil||0)-dt*1.7);")
swap("}else if(e.airborne||pos.y>.08){e.vy-=ed*19;", "}else if(e.airHold>0){e.airHold-=dt;pos.y=Math.max(pos.y,1.2);e.stagger=Math.max(e.stagger,.5);}else if(e.airborne||pos.y>.08){e.vy-=ed*19;")
swap("e.airborne=false;e.vy=0;ring", "e.airborne=false;e.vy=0;e.juggles=0;ring")
swap("e.bar.visible=e.hp<e.maxHp||e===lockTarget;", "if(e.recoil>0){e.torso.rotation.x-=e.recoil;e.torso.rotation.z+=e.recoil*e.recoilSide*.6;e.head.rotation.x-=e.recoil*.4;}if(e.broken>0){e.hips.position.y-=.23;e.torso.rotation.x=.48;e.head.rotation.x=.3;}e.bar.visible=e.hp<e.maxHp||e===lockTarget;")
swap("e.bar=bar;const marker", "e.poiseFill=box(bar,new THREE.MeshBasicMaterial({color:0xb9a0d0}),-.425,-.085,0,.001,.018,.018);e.bar=bar;const marker")
swap("e.telegraph.position.set(pos.x,.09,pos.z);", "e.poiseFill.scale.x=.85*Math.min(1,(e.poise||0)/(e.elite?115:65));e.poiseFill.position.x=-.425+e.poiseFill.scale.x/2;e.telegraph.position.set(pos.x,.09,pos.z);")
# Context readout and HUD additions.
swap("if(comboTime<=0)combo=0;", "dodgeLink=Math.max(0,dodgeLink-dt);weaveTime=Math.max(0,weaveTime-dt);if(comboTime<=0){combo=0;styleVariety.clear();}")
swap("updateZones(dt);updateSummons(dt);if(!finisher", "updateZones(dt);updateSummons(dt);smoothRig(player,dt);enemies.forEach(e=>{if(!e.dead)smoothRig(e,dt)});summons.forEach(e=>smoothRig(e,dt));clawTrails(dt);if(!finisher")
swap("function updateHUD(){const live=", "function updateHUD(){updateCombatHUD();const live=")
swap("drawCalls:renderer.info.render.calls,player:", "drawCalls:renderer.info.render.calls,action:action?.type||null,charge:action?.type==='charge'?action.t:0,combatLog:[...combatLog],weave:weaveTime>0?weaveSchool:null,player:")
swap("({hp:e.hp,x:e.root.position.x,z:e.root.position.z})", "({hp:e.hp,x:e.root.position.x,z:e.root.position.z,y:e.root.position.y,broken:e.broken||0,juggles:e.juggles||0})")
# Fix camera hiding execution contact and preserve corpse pose after the impact.
swap("else{player.hips.position.y-=.3*(1-THREE.MathUtils.smoothstep(t,2.6,3.1));", "else{e.root.position.copy(origin).addScaledVector(front,.6);e.root.position.y=.12;e.rig.rotation.x=-1.55;e.legs.forEach(a=>a.rotation.x=-.3);player.hips.position.y-=.3*(1-THREE.MathUtils.smoothstep(t,2.6,3.1));")
swap("cameraGoal.sub(origin).multiplyScalar(1.5).add(origin);", "camera.fov=THREE.MathUtils.lerp(camera.fov,t<.8?52:58,Math.min(dt*5,1));camera.updateProjectionMatrix();cameraGoal.sub(origin).multiplyScalar(1.55).add(origin);")
# Clear input and overlay edge cases.
swap("function openWheel(){if(mode!=='game'||paused||finisher)return;wheelOpen=true;", "function openWheel(){if(mode!=='game'||paused||finisher)return;heavyHeld=false;if(action?.type==='charge')action=null;wheelOpen=true;")
p.write_text(s)
