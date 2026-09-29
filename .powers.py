from pathlib import Path
p=Path('src/main.js');s=p.read_text();marker="{name:'Revenant Army',family:'SPECTRAL',type:'ghost',cost:45,cd:10,desc:'Summon three vengeful spirits to hunt and strike your enemies.'}"
assert marker in s
s=s.replace(marker,marker+''',
{name:'Cinder Chains',family:'PYROMANCY',type:'fire',cost:26,cd:4,desc:'Chain nearby foes to burning anchors. Root normal enemies and build burn damage.'},
{name:'Scorch Mine',family:'PYROMANCY',type:'fire',cost:24,cd:4,desc:'Plant a proximity rune ahead. It arms, waits for a foe, then launches a fiery blast.'},
{name:'Hellfire Bastion',family:'PYROMANCY',type:'fire',cost:32,cd:8,desc:'Gain a finite damage-absorbing ward. Blocked hits burst fire back toward your attacker.'},
{name:'Phoenix Dive',family:'PYROMANCY',type:'fire',cost:36,cd:6,desc:'A short lunging strike with a delayed ground eruption and knockdown.'},
{name:'Vector Thrust',family:'PSYCHIC',type:'mind',cost:25,cd:3,desc:'Drive a narrow cone of enemies backward. Wall impacts become recoverable ragdolls.'},
{name:'Neural Chain',family:'PSYCHIC',type:'mind',cost:30,cd:5,desc:'Jump a psychic arc between up to four nearby targets, cracking will at every hop.'},
{name:'Gravity Loom',family:'PSYCHIC',type:'mind',cost:38,cd:7,desc:'Suspend a group with staggered heights, then release them into crushing falls.'},
{name:'Soul Anchor',family:'SPECTRAL',type:'ghost',cost:24,cd:4,desc:'Mark a target. Your next melee hit tears the anchor free for bonus damage and healing.'},
{name:'Reaper Guard',family:'SPECTRAL',type:'ghost',cost:30,cd:8,desc:'For five seconds, your next incoming hit becomes a spectral counter, not damage.'}''')
s=s.replace('i*TAU/15-TAU/30,b=a+TAU/15','i*TAU/powers.length-TAU/(powers.length*2),b=a+TAU/powers.length').replace('${glyphs[i]}','${glyphs[i]||iconPaths[p.type]}')
s=s.replace('let clinchTarget=null,clinchTime=0;', 'let clinchTarget=null,clinchTime=0;let aegis=0,aegisTime=0,reaperWard=0;')
s=s.replace('resonance.clear();resonanceTime=0;exploredDistricts.clear();','resonance.clear();resonanceTime=0;aegis=aegisTime=reaperWard=0;exploredDistricts.clear();')
a=s.index('case 14:for(let i=0;i<3;i++)');b=s.index('\n}};',a)
s=s[:b]+'''
case 15:for(const e of enemies)if(!e.dead&&flatDistance(e.root.position,origin)<(overcast?10:8)){e.snared=e.boss?.7:overcast?4.2:3;e.burn=5;e.burnTick=.2;damageEnemy(e,18,0,0,null,'fire');beam(hand,chestContact(e),colors.fire,.04,.45);ring(e.root.position,colors.fire,1.2,3);}break;
case 16:makeZone(origin.clone().addScaledVector(dir,4),'mine',overcast?6:4.5,8,overcast?1.4:1);break;
case 17:aegis=overcast?85:60;aegisTime=overcast?9:7;ring(origin,colors.fire,2,.6);break;
case 18:action={type:'phoenix',t:0,duration:.72,dir:dir.clone(),hit:false,overcast};invuln=.3;break;
case 19:for(const e of enemies){const d=e.root.position.clone().sub(origin).setY(0);if(!e.dead&&d.length()<12&&d.normalize().dot(dir)>.55){damageEnemy(e,overcast?47:32,overcast?24:18,2,origin,'mind');beam(hand,chestContact(e),colors.mind,.09,.3);}}break;
case 20:{let from=hand.clone(),last=target,visited=new Set();for(let hop=0;hop<(overcast?6:4);hop++){const e=last&&!visited.has(last)&&!last.dead?last:enemies.filter(e=>!e.dead&&!visited.has(e)&&flatDistance(e.root.position,from)<9).sort((a,b)=>flatDistance(a.root.position,from)-flatDistance(b.root.position,from))[0];if(!e)break;visited.add(e);beam(from,chestContact(e),colors.mind,.055,.6);e.poise=(e.poise||0)+35;e.stagger=Math.max(e.stagger,e.boss?.3:1.1);damageEnemy(e,(overcast?38:29)*(1-hop*.09),2,0,null,'mind');from.copy(chestContact(e));last=null;}break;}
case 21:{let count=0;for(const e of enemies)if(!e.dead&&flatDistance(e.root.position,point)<(overcast?8:6)){damageEnemy(e,15,0,8,null,'mind');if(!e.boss){e.tk=1.05+count++*.12;e.tkHeight=2.2+(count%3)*.45;e.tkForce=overcast?68:45;}beam(hand,chestContact(e),colors.mind,.025,1);ring(e.root.position,colors.mind,1.5,.6);}break;}
case 22:if(target){target.soulAnchor=overcast?10:7;target.anchorPower=overcast?75:52;beam(hand,chestContact(target),colors.ghost,.06,.6);ring(target.root.position,colors.ghost,1.6,1);}else notify('Soul Anchor needs a target in view');break;
case 23:reaperWard=overcast?7:5;ring(origin,colors.ghost,2.5,.7);break;
'''+s[b:]
s=s.replace("function updateMode(dt){", "function updateMode(dt){aegisTime=Math.max(0,aegisTime-dt);if(!aegisTime)aegis=0;reaperWard=Math.max(0,reaperWard-dt);")
s=s.replace("if(invuln>0||finisher||ghostTime>0||mode!=='game')return;", "if(invuln>0||finisher||ghostTime>0||mode!=='game')return;if(reaperWard>0){reaperWard=0;riposte=2;invuln=.4;hitArea(player.root.position,5,32,5,0,'ghost');actionText('REAPER COUNTER');ring(player.root.position,colors.ghost,5,.5);return;}if(aegis>0){const blocked=Math.min(aegis,amount);aegis-=blocked;amount-=blocked;hitArea(player.root.position,4,blocked*.4,2,0,'fire');actionText('BASTION · '+Math.ceil(aegis));if(amount<=0)return;}")
s=s.replace("e.flash=Math.max(0,e.flash-dt);", "e.snared=Math.max(0,(e.snared||0)-dt);e.soulAnchor=Math.max(0,(e.soulAnchor||0)-dt);e.flash=Math.max(0,e.flash-dt);")
s=s.replace('pos.addScaledVector(step,e.speed*ed)','pos.addScaledVector(step,e.speed*ed*(e.snared>0?.05:1))')
s=s.replace("if(z.type==='meteor'){z.mesh", "if(z.type==='mine'){if(z.t>.45&&enemies.some(e=>!e.dead&&flatDistance(e.root.position,z.mesh.position)<z.radius*.65)){hitArea(z.mesh.position,z.radius,72*z.power,10,7,'fire');ring(z.mesh.position,colors.fire,z.radius,.5);z.t=z.duration;}z.mesh.rotation.y+=dt*2;}else if(z.type==='meteor'){z.mesh")
s=s.replace("type==='vortex'?0xff6b2c", "type==='vortex'||type==='mine'?0xff6b2c")
s=s.replace("}else if(a.type==='guard'){", "}else if(a.type==='phoenix'){speed=0;if(u<.45){pos.addScaledVector(a.dir,dt*13);resolveWorld(pos);}player.rig.position.y=Math.sin(Math.min(1,u)*Math.PI)*1.1;if(u>.52&&!a.hit){a.hit=true;hitArea(pos,a.overcast?7:5,70,10,3,'fire');ring(pos,colors.fire,6,.6);impactWorld.strike(pos,1.5);shake=.3;}}else if(a.type==='guard'){")
s=s.replace('return{gameMode,trainingAI,', 'return{aegis,reaperWard,powerCount:powers.length,gameMode,trainingAI,')
p.write_text(s)
p=Path('src/motion.js');s=p.read_text().replace("export const CAST_RELEASES=[.36,.43,.46,.32,.44,.46,.34,.42,.44,.4,.42,.4,.38,.46,.47];", "export const CAST_RELEASES=[.36,.43,.46,.32,.44,.46,.34,.42,.44,.4,.42,.4,.38,.46,.47,.4,.42,.46,.38,.36,.43,.46,.4,.42];\nfor(const [source,twist]of [[4,.25],[2,-.3],[5,0],[3,.2],[6,-.2],[9,.35],[7,0],[13,-.3],[12,.2]]){const pair=spellPoses[source].map(p=>structuredClone(p));pair[0].T=[.18,-twist,-.08];pair[1].T=[.26,twist,.05];spellPoses.push(pair);}")
s=s.replace('const clips={guardbreak,','const clips={phoenix:slam,guardbreak,')
p.write_text(s)
