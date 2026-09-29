from pathlib import Path
M = Path('src/main.js'); s = M.read_text()
E = Path('src/eclipse-systems.js'); e = E.read_text()
I = Path('index.html'); h = I.read_text()

def rep(blob, old, new, name):
    assert old in blob, 'ANCHOR MISS: '+name
    return blob.replace(old, new, 1)

# ---- eclipse-systems.js: style consequence (multiplier, rank-up ceremony, exalted regen, setStyle) ----
e = rep(e, "export function createEclipseSystems(api){\n const {scene,player,camera}=api;let style=0,best=0,quiet=0,clock=0,audioBeat=0,hudTick=0,hitTimer=0,wavePeak=0,masteryBonus=0;",
          "export function createEclipseSystems(api){\n const {scene,player,camera}=api;let style=0,best=0,quiet=0,clock=0,audioBeat=0,hudTick=0,hitTimer=0,wavePeak=0,masteryBonus=0,lastRank='D',rankUpAt=-1;", 'eclipse lets')
e = rep(e, " function snapshot(){return {masteryBonus,style:Math.round(style*10)/10,bestStyle:Math.round(best),rank:[...ranks].reverse().find(r=>style>=r.at).name,rifts:nodes.map(({id,name,x,z,status,remaining})=>({id,name,x,z,status,remaining}))};}",
          " function multiplier(){return 1+Math.min(2,style/85);}\n function snapshot(){return {masteryBonus,style:Math.round(style*10)/10,bestStyle:Math.round(best),rank:[...ranks].reverse().find(r=>style>=r.at).name,multiplier:Math.round(multiplier()*100)/100,rankUpAt,rifts:nodes.map(({id,name,x,z,status,remaining})=>({id,name,x,z,status,remaining}))};}", 'eclipse snapshot')
e = rep(e, " const rank=[...ranks].reverse().find(r=>style>=r.at),next=ranks[ranks.indexOf(rank)+1];",
          " const rank=[...ranks].reverse().find(r=>style>=r.at),next=ranks[ranks.indexOf(rank)+1];\n  if(rank.name!==lastRank){const rise=ranks.indexOf(rank)>ranks.findIndex(r=>r.name===lastRank);lastRank=rank.name;if(rise&&running){rankUpAt=clock;api.actionText?.(rank.name+' · '+rank.title+' · SOULS ×'+multiplier().toFixed(2));api.tone?.(540+style*1.4,.24,'triangle',.11,320);api.ring?.(player.root.position.clone(),0xf2b06a,4.5,.55);}}", 'eclipse rank ceremony')
e = rep(e, " return {update,reset,tryRift,onKill,onHurt,styleHit,drawMap,snapshot,beginWave(){wavePeak=style;masteryBonus=0;},endWave(){masteryBonus=Math.floor(wavePeak*2);return masteryBonus;}};",
          " return {update,reset,tryRift,onKill,onHurt,styleHit,drawMap,snapshot,multiplier,value(){return style;},setStyle(v){style=Math.max(0,Math.min(200,v));recent.clear();},beginWave(){wavePeak=style;masteryBonus=0;},endWave(){masteryBonus=Math.floor(wavePeak*2);return masteryBonus;}};", 'eclipse return')

# ---- main.js: 1) style consequence hooks ----
s = rep(s, ',spawnGuardian:spawnRiftGuardian,reward:rewardRift,notify,banner,ring,tone});',
          ',spawnGuardian:spawnRiftGuardian,reward:rewardRift,notify,banner,ring,tone,actionText});', 'api actionText')
s = rep(s, "combo++;comboTime=4.5;score+=Math.floor(amount);",
          "combo++;comboTime=4.5;score+=Math.floor(amount*(eclipseSystems?.multiplier?.()||1));", 'damage score mult')
s = rep(s, "if(ascendTime<=0)ascendCharge=Math.min(100,ascendCharge+amount*.075);",
          "if(ascendTime<=0)ascendCharge=Math.min(100,ascendCharge+amount*.075*Math.min(2.5,eclipseSystems?.multiplier?.()||1));", 'ascend charge mult')
s = rep(s, "score+=Math.floor((100+wave*15+(e.boss?700:0))*runMods.souls);",
          "score+=Math.floor((100+wave*15+(e.boss?700:0))*runMods.souls*(eclipseSystems?.multiplier?.()||1));", 'kill souls mult')
s = rep(s, "const weave=elapsed-lastMeleeHit<.8;energy-=cost;",
          "const weave=elapsed-lastMeleeHit<.8;energy-=cost;const conduitStyle=eclipseSystems?.value?.()||0;if(conduitStyle>=80){const refund=cost*(conduitStyle>=160?.4:.25);energy=Math.min(100,energy+refund);notify('STYLE CONDUIT · '+Math.round(refund)+' WRATH RETURNED');}", 'cast conduit')

# ---- main.js: 2) chain executions ----
s = rep(s, "let action=null,actionQueue=null,comboStep=0,lastAttack=-20,attackCooldown=0,dodgeCooldown=0,parryCooldown=0,executeCooldown=0,invuln=0,ghostTime=0,slowTime=0,riposte=0,finisher=null,shake=0,hitstop=0,lockTarget=null;",
          "let action=null,actionQueue=null,comboStep=0,lastAttack=-20,attackCooldown=0,dodgeCooldown=0,parryCooldown=0,executeCooldown=0,invuln=0,ghostTime=0,slowTime=0,riposte=0,finisher=null,shake=0,hitstop=0,lockTarget=null;\nlet chainWindow=0,chainTarget=null;", 'chain globals')
s = rep(s, "executeCooldown=Math.max(0,executeCooldown-dt);invuln=Math.max(0,invuln-dt);",
          "executeCooldown=Math.max(0,executeCooldown-dt);chainWindow=Math.max(0,chainWindow-dt);if(chainWindow<=0)chainTarget=null;invuln=Math.max(0,invuln-dt);", 'chain decay')
s = rep(s, "eclipseSystems?.onHurt(source);noteImpact(player,amount,source);",
          "chainWindow=0;chainTarget=null;eclipseSystems?.onHurt(source);noteImpact(player,amount,source);", 'chain breaks on hurt')
s = rep(s, "function execute(){\n if(finisher)return;",
          "function execute(){\n if(finisher)return;\n if(chainWindow>0&&chainTarget&&!chainTarget.dead&&executionReady(chainTarget)&&flatDistance(chainTarget.root.position,player.root.position)<7){const e=chainTarget;chainWindow=0;chainTarget=null;const bag=[...executionBag],bossBag=[...bossExecutionBag],smallBag=[...smallExecutionBag];if(startExecution(e,nextExecution(true,!!e.boss,!!e.small))){finisher.chain=true;executeCooldown=Math.min(executeCooldown,2.6);if(finisher.entry)finisher.entry.duration=Math.min(finisher.entry.duration,.14);eclipseSystems?.styleHit('chain-execution',24);actionText('CHAIN EXECUTION');}else{executionBag=bag;bossExecutionBag=bossBag;smallExecutionBag=smallBag;}return;}", 'chain execute')
s = rep(s, "if(!cancelled)actionText('SOUL CLAIMED  +350');}",
          "if(!cancelled)actionText('SOUL CLAIMED  +350');const chainOpts=enemies.filter(e=>!e.dead&&executionReady(e)&&flatDistance(e.root.position,player.root.position)<6).sort((a,b)=>a.hp-b.hp);if(chainOpts.length){chainWindow=1.75;chainTarget=chainOpts[0];notify('CHAIN EXECUTION READY · E · '+chainOpts[0].kind);}}", 'chain window open')
s = rep(s, "function updateFinisher(dt){\n if(!finisher)return;const f=finisher;",
          "function updateFinisher(dt){\n if(!finisher)return;const f=finisher;if(f.chain)dt*=1.7;", 'chain timescale')
s = rep(s, "const canFinish=executeCooldown<=0&&live.some(e=>executionReady(e)&&flatDistance(e.root.position,player.root.position)<5.5);$('finisherPrompt').classList.toggle('hidden',!canFinish||!!finisher);",
          "const canFinish=executeCooldown<=0&&live.some(e=>executionReady(e)&&flatDistance(e.root.position,player.root.position)<5.5);const chainUp=chainWindow>0&&chainTarget&&!chainTarget.dead&&!finisher;if(chainUp)$('finisherName').textContent='CHAIN · '+chainTarget.kind;$('finisherPrompt').classList.toggle('hidden',!(canFinish||chainUp)||!!finisher);", 'chain hud')
s = rep(s, "execution:finisher?{id:finisher.def.id,time:finisher.t,duration:finisher.def.duration,preview:finisher.preview,impactDone:finisher.impactDone}:null,",
          "execution:finisher?{id:finisher.def.id,time:finisher.t,duration:finisher.def.duration,preview:finisher.preview,impactDone:finisher.impactDone,chain:!!finisher.chain}:null,chainReady:chainWindow>0,",
          'chain state')

# ---- main.js: 3) bestiary fidelity kits ----
kit = '''function buildKindKit(e){
 if(e.spectral)return;let n=0;
 const eye=new THREE.MeshBasicMaterial({color:0xff5a26}),scar=new THREE.MeshBasicMaterial({color:0xd9481f}),glowDot=new THREE.MeshBasicMaterial({color:0xffb066});
 for(const side of [-1,1]){orb(e.head,eye,side*.12,.16,.1,.05,.05,.05);n++;}
 box(e.torso,scar,.11,.1,.30,.02,.5,.02);box(e.torso,scar,-.09,.05,.30,.02,.34,.02);n+=2;
 if(e.elite||e.boss){for(const side of [-1,1]){box(e.arms[side>0?1:0],metal,0,.12,0,.34,.2,.34);horn(e.head,[[side*.14,.1,0],[side*.42,.44,.06]],.09,hornObsidian);n+=2;}box(e.hips,metal,0,-.5,.3,.5,.7,.05);n++;}
 else if(e.caster){const halo=mesh(new THREE.TorusGeometry(.42,.02,4,36),new THREE.MeshBasicMaterial({color:0xb08cf2}),e.head,0,.34,-.22);n++;for(const side of [-1,1]){orb(e.torso,glowDot,side*.5,.2,.05,.07,.07,.07);n++;}halo.rotation.x=.12;}
 else if(e.stalker){mesh(new THREE.ConeGeometry(.6,.9,18,4,true),mat('#33262b',.95),e.head,0,.28,.05);n++;for(const side of [-1,1]){box(e.hips,mat('#2a2226',.95),side*.16,-1.0,.16,.16,.8,.04);n++;}}
 else{horn(e.spine,[[0,.2,-.22],[0,.45,-.5]],.09,hornObsidian);n++;for(const side of [-1,1]){horn(e.arms[side>0?1:0],[[0,.18,-.05],[0,.5,-.25]],.08,hornObsidian);n++;}}
 if(e.boss){const crown=mesh(new THREE.TorusGeometry(.3,.045,4,24),goldGlow,e.head,0,.42,0);crown.rotation.x=.5;n++;for(let i=0;i<5;i++){const a=(i-2)*.4;horn(e.head,[[Math.sin(a)*.26,.36,Math.cos(a)*.22],[Math.sin(a)*.34,.85,Math.cos(a)*.3]],.07,goldGlow);n++;}for(const side of [-1,1]){horn(e.torso,[[side*.2,.3,-.28],[side*1.5,1.15,-.75]],.16,hornObsidian);n++;}const cape=mesh(new THREE.ConeGeometry(1.05,2.4,20,5,true),mat('#3a1f22',.95),e.hips,0,.1,-.35);cape.rotation.x=.32;n++;e.moltenCore=orb(e.torso,glowDot,0,.18,.34,.12,.12,.12);n++;}
 e.adornDetail=n;
}
function adornEnemy(e){'''
s = rep(s, 'function adornEnemy(e){', kit, 'kind kit builder ref')
s = rep(s, "if(e.elite||e.boss){const hammer=new THREE.Group();e.hands[1].add(hammer);cylinder(hammer,metal,0,-.45,0,.07,.075,1.6,8);box(hammer,obsidian,0,-1.14,0,.85,.5,.48);box(hammer,e.boss?ember:goldGlow,0,-1.15,.25,.53,.035,.025);for(let side of [-1,1])horn(hammer,[[side*.3,-1.12,0],[side*.7,-1.18,0]],.15,hornObsidian);}\n}",
          "if(e.elite||e.boss){const hammer=new THREE.Group();e.hands[1].add(hammer);cylinder(hammer,metal,0,-.45,0,.07,.075,1.6,8);box(hammer,obsidian,0,-1.14,0,.85,.5,.48);box(hammer,e.boss?ember:goldGlow,0,-1.15,.25,.53,.035,.025);for(let side of [-1,1])horn(hammer,[[side*.3,-1.12,0],[side*.7,-1.18,0]],.15,hornObsidian);}\n buildKindKit(e);\n}", 'kind kit hook')
s = rep(s, "ring(p,0xff582e,10,1.1);e.bossWait=.7;}",
          "ring(p,0xff582e,10,1.1);e.bossWait=.7;if(e.moltenCore){e.moltenCore.material=new THREE.MeshBasicMaterial({color:0xff2f15});e.moltenCore.scale.setScalar(1.7);}}", 'enrage core')

# ---- main.js: 4) menu ascension (orbital backdrop) + state + testing hooks ----
s = rep(s, "updateEffects(dt||mode==='menu'?dt:0);",
          "if(mode==='menu'&&!dragging){const ma=elapsed*.05;camera.position.set(Math.sin(ma)*16,5.8+Math.sin(elapsed*.13)*1.2,Math.cos(ma)*16);camera.lookAt(3.4,2.0,4.2);}\nupdateEffects(dt||mode==='menu'?dt:0);", 'menu orbit')
s = rep(s, "mode,paused,executeCooldown,audioOn,",
          "mode,paused,executeCooldown,audioOn,cameraPosition:camera.position.toArray().map(v=>Math.round(v*1000)/1000),", 'state camera')
s = rep(s, " maliceAmbush(){realmHuntPack();},",
          """ maliceAmbush(){realmHuntPack();},
 setStyle(v){eclipseSystems?.setStyle?.(v);},
 weakenFoes(){for(const e of enemies){if(e.dead)continue;e.broken=Math.max(e.broken||0,2.5);e.hp=Math.min(e.hp,e.maxHp*.3);}},
 kindKit(kind){const spec={revenant:{},stalker:{stalker:true},oracle:{caster:true},warden:{elite:true},king:{boss:true,elite:true}}[kind];const e=creature(false,!!spec.elite);e.boss=!!spec.boss;e.elite=!!spec.elite;e.caster=!!spec.caster;e.stalker=!!spec.stalker;buildKindKit(e);const out={kind,detail:e.adornDetail};removeTransientRig(e);return out;},""", 'testing hooks')

# ---- index.html: version tags ----
h = rep(h, 'MALICE UPDATE · V0.18.0', 'TORMENT UPDATE · V0.19.0', 'build tag')
h = rep(h, '<span></span> MALICE HAS PERFECTED THE ART.</div>', '<span></span> TORMENT · STYLE MADE FLESH</div>', 'menu eyebrow')
h = rep(h, '<div class="start-note"><span class="status-dot"></span> 24 POWERS <b>·</b> 49 EXECUTIONS <b>·</b> 3 RIFT HUNTS</div>',
          '<div class="start-note" id="versionTag"><span class="status-dot"></span> TORMENT V0.19.0 <b>·</b> 24 POWERS <b>·</b> 49 EXECUTIONS <b>·</b> CHAIN KILLS</div>', 'start note')

M.write_text(s); E.write_text(e); I.write_text(h)
print('TORMENT edits applied: style consequence, chain executions, bestiary kits, menu orbit')
