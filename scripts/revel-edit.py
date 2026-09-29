from pathlib import Path
p=Path('src/motion.js');s=p.read_text()
def rep(a,b):
 global s
 assert a in s,a[:120]
 s=s.replace(a,b)
# A punch timing curve: slow anticipation, accelerating snap into contact,
# fast release into a damped settle. Endpoints and the contact clock are
# preserved exactly, so the animation whip never desyncs the hit evaluation.
rep("export function curve(points,t){",
"""export function whipTime(u,impact=.43,anticipation=2.2,snap=3){if(u<=impact){const t=clamp(u/impact,0,1);return impact*Math.pow(t,anticipation);}const t=clamp((u-impact)/(1-impact),0,1);return impact+(1-impact)*(1-Math.pow(1-t,snap));}
export function curve(points,t){""")
# Player attacks ride the whip; dodges/guard/movement keep linear time.
rep(" const c=attack?.type==='cast'?spellClips[attack.powerIndex??0]:clips[key];apply(r,c?sample(c,u):REST);",
""" const c=attack?.type==='cast'?spellClips[attack.powerIndex??0]:clips[key];
 const whip=attack&&!['dodge','fireDash','guard','charge','getup','tether','enemystep','ascend'].includes(attack.type),wi=attack?(attack.type==='cast'?CAST_RELEASES[attack.powerIndex??0]:impactAt(attack)):0;apply(r,c?sample(c,whip?whipTime(u,Math.min(wi,.9)):u):REST);""")
# Deterministic per-step variance so chained swings read individually.
rep(" if(attack?.type==='crusher'){r.torso.rotation.y+=",
""" if(attack&&['light','heavy','cleave','hook','knee','riposte','guardbreak'].includes(attack.type)){const v=m.seed*7.13+(attack.step||1)*1.91,w=hump(u,0,.92);r.torso.rotation.y+=Math.sin(v)*.038*w;r.neck.rotation.y+=Math.cos(v)*.018*w;r.hips.position.x+=Math.sin(v*.7)*.012*w;}
 if(attack?.type==='crusher'){r.torso.rotation.y+=""")
# Enemy strikes whip too (casters keep their release-scaled sampling).
rep(" apply(r,sample(c,r.caster?u*CAST_RELEASES[6]/.525:u));",
""" apply(r,sample(c,whipTime(r.caster?u*CAST_RELEASES[6]/.525/.525:u,.525)));""")
p.write_text(s)

p=Path('src/main.js');s=p.read_text()
def rep2(a,b):
 global s
 assert a in s,a[:120]
 s=s.replace(a,b)
# Lethal-hit context preserved through damageEnemy → killEnemy.
rep2("noteImpact(e,amount,source||player.root.position);", "noteImpact(e,amount,source||player.root.position);e.lastKnock=(e.lastKnock||0)+knock;e.lastLaunch=(e.lastLaunch||0)+launch;")
rep2("ring(chestContact(e),0xef8d56,1.5,.25);}", "ring(chestContact(e),0xef8d56,1.5,.25);e.coupKill=true;}")
rep2("""function killEnemy(e){if(e.dead)return;e.dead=true;e.deathTime=0;if(finisher?.enemy!==e)startBody(e,(e.kb||new THREE.Vector3()).clone().multiplyScalar(.5).add(new THREE.Vector3(0,Math.max(0,e.vy||0)*.3,0)));""",
"""function killEnemy(e){if(e.dead)return;e.dead=true;e.deathTime=0;
 const inpulse=(e.kb||new THREE.Vector3()).clone(),heavy=!!e.coupKill||(e.lastKnock||0)>=6;
 if(finisher?.enemy!==e){let impulse=inpulse.multiplyScalar(heavy?.85:.5);
  if(heavy){const dir=impulse.clone().setY(0);if(dir.lengthSq()<.001)dir.set(Math.sin(e.root.rotation.y+Math.PI),0,Math.cos(e.root.rotation.y+Math.PI));dir.normalize();impulse.addScaledVector(dir,e.boss?1.6:2.6);impulse.y+=e.boss?2.4:Math.min(6.8,2.6+(e.lastKnock||0)*.3+(e.lastLaunch||0)*.5);}
  else impulse.y+=Math.max(0,e.vy||0)*.3;
  startBody(e,impulse,!!e.coupKill);
  if(heavy&&!e.boss){ring(e.root.position.clone().add(new THREE.Vector3(0,.6,0)),0xffb169,1.9,.3);tone(42,.22,'sawtooth',.12,16);}}""")
# Reset the lethal context on spawn so old debt can't flare on respawned rigs.
rep2("if(e.hp<=0){killEnemy(e);", "e.lastKnock=0;e.lastLaunch=0;if(e.hp<=0){killEnemy(e);")
# REVEL environment dressing: candles, cages, ossuary, seams and wayfaring braziers.
rep2("// Bake architecture by material;",
"""// REVEL dressing pass: candles, hanging cages, ossuary spill, glow seams and wayfires.
{const wax=mat('#c9b89a',.9,0),cage=metal;
 function candle(x,z,h=.42){mesh(new THREE.CylinderGeometry(.085,.1,h,7),wax,scene,x,h/2+.02,z);const flame=mesh(new THREE.SphereGeometry(.07,7,5),ember,scene,x,h+.09,z);flame.scale.set(.55,.8,.55);fires.push(flame);}
 for(let i=0;i<10;i++){const side=i%2?1:-1;candle(side*rr(11.5,15.5),-24+i*5.2,rr(.35,.62));}
 for(let i=0;i<8;i++){const a=i*TAU/8;candle(-58+Math.sin(a)*9,Math.cos(a)*9);candle(58+Math.sin(a)*9,Math.cos(a)*9);}
 for(let i=0;i<4;i++){const z=-14+i*9;brazier(-19,z);brazier(19,z);}
 function cageHang(x,y,z){for(let k=0;k<7;k++){const link=mesh(new THREE.TorusGeometry(.12,.026,4,10),cage,scene,x,y+k*.22,z);link.rotation.y=k%2?Math.PI/2:0;}mesh(new THREE.BoxGeometry(.78,1.05,.78),cage,scene,x,y-.75,z);mesh(new THREE.IcosahedronGeometry(.13,0),purpleGlow,scene,x,y-.72,z);}
 cageHang(-7.5,7.6,-6);cageHang(8,8.4,3.5);cageHang(.5,9.2,-19);cageHang(-52,6.2,-8);cageHang(47,6.8,10);
 function bones(x,z,n=4){for(let i=0;i<n;i++){const m=mesh(new THREE.IcosahedronGeometry(.16,0),bone,scene,x+rr(-.5,.5),.12,z+rr(-.5,.5));m.scale.setScalar(rr(.6,1.2));m.rotation.set(rr(0,TAU),rr(0,TAU),rr(0,TAU));}}
 for(let i=0;i<14;i++)bones(rr(-16,16),rr(-26,26),Math.ceil(rr(2,5)));
 for(let i=0;i<7;i++){const m=mesh(new THREE.BoxGeometry(rr(1.6,3.2),.05,.07),goldGlow,scene,rr(-14,14),.09,rr(-24,24));m.rotation.y=rr(0,TAU);}
 for(let i=0;i<3;i++){const a=rr(0,TAU),r=rr(20,26),x=Math.sin(a)*r,z=Math.cos(a)*r;deadTree(x,z,1.3);deadTree(x+3,z-2,1.7);}
}

// Bake architecture by material;""")
# REVEL testing hooks: wound a foe so a single heavy demonstrates the coup.
rep2("ruinRend(n=3){", """revelSlay(){const e=enemies.find(e=>!e.dead);if(e){e.hp=9;e.rend=3;e.rendTime=5;}},
 revelStats(){const out={fog:!!scene.fog,fires:fires.length,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};return out;},
 ruinRend(n=3){""")
p.write_text(s)
