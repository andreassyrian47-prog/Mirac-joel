from pathlib import Path
p=Path('src/finishers.js');s=p.read_text().replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport {NEW_EXECUTIONS,expandedChoreography} from './revenant-executions.js';")
s=s.replace(',...BOSS_FINISHERS];',",...BOSS_FINISHERS,...NEW_EXECUTIONS];\n// Faster commitments; retain normalized hit/grip landmarks.\nfor(const d of FINISHERS)if(!d.expanded)d.duration=+(d.duration*(d.bossOnly?.84:['cinder-spiral'].includes(d.id)?.86:.82)).toFixed(2);")
s=s.replace("const ghosts=id==='wraith-procession'", "const ghosts=f.def.expanded&&f.def.school==='ghost'?3:id==='wraith-procession'")
s=s.replace("if(f.def.bossOnly)bossChoreography", "if(f.def.expanded)expandedChoreography(f,u,{player,at,pos,arms,fallen,contact,event,showRing,S,pulse,emit});else if(f.def.bossOnly)bossChoreography")
# A spectral path must no longer go straight through the opponent's solid core.
s=s.replace("case 'pale-requiem':{", "case 'pale-requiem':{")
# allow shared body solver to reroute solid cores rather than exempting spectral moves
p.write_text(s)
p=Path('src/execution-performance.js');s=p.read_text().replace('data=tracks(f.def.id);','data=f.def.expanded?{}:tracks(f.def.id);').replace('of REACTION_BEATS[f.def.id])','of (REACTION_BEATS[f.def.id]||f.def.hits.map(h=>h[0])))');p.write_text(s)
p=Path('src/cinematic.js');s=p.read_text().replace('beats[f.def.id],sign',"(beats[f.def.id]||[.22,.58,1,f.def.school==='brutal'?'strike':'ritual']),sign")
s=s.replace('if(u>=I){if(!e.physicalBody)',"if(u>=I-.025){if(!e.physicalBody)").replace('impulse.y=-1.2','impulse.y=-5.5').replace('groundSlams.includes(f.def.id)','(f.def.expanded||groundSlams.includes(f.def.id))')
p.write_text(s)
p=Path('src/contacts.js');s=p.read_text().replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport {separateCores} from './body-spacing.js';")
# Surface rather than anatomical center targets; correct direct bone grabs remain intact.
a=s.index('export function targetOf(');b=s.index('\nexport function aimContact',a)
s=s[:a]+'''export function targetOf(f,c){const e=f.enemy;e.root.updateMatrixWorld(true);let goal=c.node?c.node.localToWorld(new V(...(c.offset||[0,0,0]))):c.where==='head'?e.head.localToWorld(new V(0,.12,.19)):e.torso.localToWorld(new V(c.x||0,.47,Math.max(.33,c.z??.33)));if(c.side)goal.addScaledVector(f.side,c.side);return goal;}
'''+s[b:]
s=s.replace('floorLimbs(p);if(!physical)', 'separateCores(f,p);floorLimbs(p);if(!physical)')
s=s.replace('f.reachAt=f.t;','separateCores(f,p);f.reachAt=f.t;')
# Preserve carry location after moving the player's core (held victim translated by constraints).
s=s.replace('if(finalPass){\n  const current=[];', 'if(finalPass){\n  const current=[];')
p.write_text(s)
p=Path('src/physical.js');s=p.read_text().replace('violent?.38:.6','violent?.72:.7').replace('p.x.y-=23/14400','p.x.y-=36/14400').replace('multiplyScalar(.992)','multiplyScalar(.997)')
# Restitution at first contact, anisotropic ground friction; avoid levitating slow settles.
s=s.replace('p.old.y=p.radius;', 'p.old.y=p.radius-Math.min(.035,Math.max(0,p.old.y-p.x.y)*.12);').replace('vx*.98','vx*.94').replace('vz*.98','vz*.94')
p.write_text(s)
p=Path('src/execution-staging.js');s=p.read_text().replace('||FOOTPRINTS[def.id];',"||FOOTPRINTS[def.id]||[[0,0,5]];");p.write_text(s)
p=Path('src/main.js');s=p.read_text().replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport {bodyOverlap} from './body-spacing.js';")
s=s.replace("return {id:f.def.id,t:f.t,phase:","return {id:f.def.id,coreOverlap:bodyOverlap(player,f.enemy),t:f.t,phase:")
s=s.replace('if(e.deathTime>5)', 'if(e.deathTime>8)')
s=s.replace("player.deathTime=0;mode='dead'", "player.deathTime=0;rememberBody(player,1/60);startBody(player,facing().multiplyScalar(-3).setY(2));mode='dead'")
s=s.replace("poseDeath(player);}","if(!stepBody(player,realdt,obstacles))poseDeath(player);}")
s=s.replace("if(amount>55&&knock>7", "if(amount>55&&knock>7")
p.write_text(s)
