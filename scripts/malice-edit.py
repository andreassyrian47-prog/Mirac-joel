from pathlib import Path
p=Path('src/motion.js');s=p.read_text()
def rep(a,b):
 global s
 assert a in s,a[:120]
 s=s.replace(a,b)
# MALICE: strikes begun at speed inherit momentum — the body keeps leaning into
# the swing instead of teleporting to a neutral stance. Deterministic, bounded.
rep(" if(attack?.type==='crusher'){r.torso.rotation.y+=",
""" if(attack&&whip){const rush=clamp((m.speed-3.4)/4,0,1)*clamp(1-u/(Math.min(wi,.9)*.9),0,1);if(rush>0){r.hips.position.y-=.105*rush;r.hips.position.z+=.028*rush;r.torso.rotation.x+=.12*rush;r.spine.rotation.x+=.05*rush;}}
 if(attack?.type==='crusher'){r.torso.rotation.y+=""")
p.write_text(s)

p=Path('src/main.js');s=p.read_text()
def rep2(a,b):
 global s
 assert a in s,a[:120]
 s=s.replace(a,b)
# Spellweave steering: casts keep a live target and turn during windup; release
# already snapshots facing at emit time, so windup tracking is functional.
rep2("paid:cost};", "paid:cost,target};")
rep2(" else speed*=.25;if(a.type!=='charge')pose(player,walkPhase,moving*.3,a);",
""" else if(a.type==='cast'&&a.target&&!a.target.dead&&!a.released)steerAttack(a,player,dt,a.releaseAt);speed*=.25;if(!attackTypes.has(a.type)&&a.type!=='cast'&&a.type!=='charge')speed*=.25;if(a.type!=='charge')pose(player,walkPhase,moving*.3,a);""")
# MALICE ambushes in Free Roam: after patrols thin out, the realm answers.
rep2("function trainingDrill(){",
"""let realmHuntTimer=45;
function realmHuntPack(){if(mode!=='game'||finisher)return;const a=Math.random()*TAU;const n=3+Math.floor(Math.random()*3);
 for(let i=0;i<n;i++){spawnEnemy(i,n,i===1);const e=enemies.at(-1);const wa=a+(i-n/2)*.6;e.root.position.copy(player.root.position).addScaledVector(new THREE.Vector3(Math.sin(wa),0,Math.cos(wa)),8+i*1.5);resolveWorld(e.root.position);e.hp=e.maxHp=.72*e.maxHp*(1+wave*.06);e.engagementWait=3;}
 banner('THE REALM HUNTS BACK','Your presence has been heard. Survive the pack.');tone(72,.5,'sawtooth',.1,26);}

""")
rep2("if(!flowGrace)flow=0;", "if(realmHuntTimer>0&&mode==='game'&&gameMode==='explore'&&!finisher){realmHuntTimer-=dt;if(realmHuntTimer<=0){if(enemies.filter(e=>!e.dead).length<=1)realmHuntPack();realmHuntTimer=50+Math.random()*35;}}\n if(!flowGrace)flow=0;")
# Testing probes for the wave-3 systems.
rep2("ruinRend(n=3){", """maliceAmbush(){realmHuntPack();},
 hipsY(){player.root.updateMatrixWorld(true);return player.hips.getWorldPosition(new THREE.Vector3()).y;},
 ruinRend(n=3){""")
p.write_text(s)

p=Path('src/execution-performance.js');s=p.read_text()
def rep3(a,b):
 global s
 assert a in s,a[:120]
 s=s.replace(a,b)
# Impact dolly: a bounded focal tighten+push exactly on the impact clock.
rep3("const fov=dynamic?lerp(lerp(49,43,load),60,release)*(1-recover)+49*recover:51;",
"""const punch=Math.exp(-Math.abs(clock-I*f.def.duration)*11);
 const fov=(dynamic?lerp(lerp(49,43,load),60,release)*(1-recover)+49*recover:51)-(dynamic?3.4*punch:0);""")
rep3("distance*(dynamic?1-.035*Math.max(0,recoil):1));", "distance*(dynamic?1-.035*Math.max(0,recoil)-.05*punch:1));")
p.write_text(s)
