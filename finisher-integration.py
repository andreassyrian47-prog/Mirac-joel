from pathlib import Path
p=Path('src/main.js');s=p.read_text()
def swap(a,b):
 global s
 assert a in s,a[:100]
 s=s.replace(a,b)
def block(a,b,new):
 global s
 start=s.index(a);end=s.index(b,start);s=s[:start]+new+'\n'+s[end:]
swap("import * as THREE from 'three';", "import * as THREE from 'three';\nimport { FINISHERS, FINISHER_SCHOOLS, createExecutionDirector } from './finishers.js';")
swap("const options={quality:'balanced'", "const options={finisher:'auto',quality:'balanced'")
swap("let airTarget=null;", "let executionBag=[],catalogFocus='soulbreaker',catalogFilter='all',previewSnapshot=null,executionDirector=null,completedExecutions=[];\nlet airTarget=null;")
block('function execute(){','function hitArea(', '''function nextExecution(consume=false){
 if(options.finisher!=='auto'){const found=FINISHERS.find(f=>f.id===options.finisher);if(found)return found;options.finisher='auto';}
 if(!executionBag.length){executionBag=FINISHERS.map(f=>f.id);for(let i=executionBag.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[executionBag[i],executionBag[j]]=[executionBag[j],executionBag[i]];}if(!completedExecutions.length){executionBag.splice(executionBag.indexOf('soulbreaker'),1);executionBag.unshift('soulbreaker');}else if(executionBag[0]===completedExecutions.at(-1)){[executionBag[0],executionBag[1]]=[executionBag[1],executionBag[0]];}}
 const def=FINISHERS.find(f=>f.id===executionBag[0]);if(consume)executionBag.shift();return def;
}
function startExecution(e,def,preview=false){
 heavyHeld=false;action=null;actionQueue=null;airTarget=null;
 finisher={def,enemy:e,t:0,stage:0,preview,impactDone:false,origin:e.root.position.clone().setY(.06),front:player.root.position.clone().sub(e.root.position).setY(0).normalize()};
 if(finisher.front.length()<.1)finisher.front.set(0,0,1);
 if(!preview){for(const other of enemies)if(other!==e&&!other.dead&&flatDistance(other.root.position,e.root.position)<7){other.kb.copy(other.root.position).sub(e.root.position).setY(0).normalize().multiplyScalar(16);other.stagger=def.duration+.3;}invuln=def.duration+1;executeCooldown=def.duration+1.8;}
 e.stagger=def.duration+1;e.state='chase';e.root.position.y=.06;e.airHold=0;e.vy=0;
 document.body.classList.add('cinematic');$('cinema').classList.add('active');$('executionTitle').textContent=def.name.toUpperCase();$('executionSchool').textContent=FINISHER_SCHOOLS[def.school].label+' / '+String(FINISHERS.indexOf(def)+1).padStart(2,'0');$('previewNotice').textContent=preview?'GRIMOIRE PREVIEW · ESC TO RETURN':'';tone(55,.5,'sine',.2,20);
}
function execute(){
 if(finisher)return;if(executeCooldown>0){notify(`Execution recovering · ${Math.ceil(executeCooldown)}s`);return;}
 const e=enemies.filter(e=>!e.dead&&executionReady(e)&&flatDistance(e.root.position,player.root.position)<5.5).sort((a,b)=>a.hp-b.hp)[0];
 if(!e){notify('Weaken an enemy below 60% vitality or break their will. Bosses require 20%.');return;}
 startExecution(e,nextExecution(true));
}
function executionImpact(f,landing){
 if(f.preview){f.enemy.dead=true;return;}
 killEnemy(f.enemy);hitArea(landing,5,40,10);if(ascendTime<=0)ascendCharge=Math.min(100,ascendCharge+18);health=Math.min(runMods.maxHealth,health+28);energy=Math.min(100,energy+28);score+=350;recordMove(f.def.name.toUpperCase());
}
function finishExecution(f,cancelled=false){
 executionDirector?.cleanup(f);
 if(f.enemy){f.enemy.torso.scale.set(1,1,1);if(f.enemy.dead){f.enemy.executed=true;f.enemy.corpseY=f.enemy.root.position.y;}}
 finisher=null;document.body.classList.remove('cinematic');$('cinema').classList.remove('active');$('previewNotice').textContent='';
 if(f.preview){
  removeTransientRig(f.enemy);const old=previewSnapshot;previewSnapshot=null;
  if(old){player.root.position.copy(old.position);player.root.rotation.copy(old.rotation);player.root.scale.copy(old.scale);camera.position.copy(old.cameraPosition);camera.quaternion.copy(old.cameraQuaternion);camera.fov=old.fov;camera.updateProjectionMatrix();action=old.action;actionQueue=old.actionQueue;airTarget=old.airTarget;}
  pose(player,elapsed);player.motionCache=null;paused=true;panelOpen='finishers';$('finisherGrimoire').classList.remove('hidden');renderCatalog();shake=0;hitstop=0;
 }else{completedExecutions.push(f.def.id);if(completedExecutions.length>50)completedExecutions.shift();invuln=1;player.rig.rotation.set(0,0,0);player.rig.position.set(0,0,0);if(!cancelled)actionText('SOUL CLAIMED  +350');}
}
function removeTransientRig(r){
 if(!r)return;scene.remove(r.root);const geometries=new Set(),materials=new Set();r.root.traverse(o=>{if(o.isMesh){if(![boxG,sphereG,icoG].includes(o.geometry))geometries.add(o.geometry);if(o.material?.userData?.executionOnly)materials.add(o.material);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
function makeExecutionGhost(source){
 const g=creature(source.isPlayer);g.root.scale.copy(source.root.scale);const m=new THREE.MeshBasicMaterial({color:0x8cdfc8,transparent:true,opacity:.22,depthWrite:false,blending:THREE.AdditiveBlending});m.userData.executionOnly=true;g.root.traverse(o=>{if(o.isMesh){o.material=m;o.castShadow=false;o.receiveShadow=false;}});return g;
}
function updateFinisher(dt){
 if(!finisher)return;const f=finisher;
 if(f.def.id==='soulbreaker')updateSoulbreaker(dt);else executionDirector.update(f,dt);
 const u=Math.min(1,f.t/f.def.duration),beat=u<.31?0:u<.65?1:2;
 $('executionBeat').textContent=String(beat+1).padStart(2,'0')+' / '+f.def.beats[beat].toUpperCase();$('executionProgress').style.width=(u*100)+'%';
}
''')
# Preserve the original sequence, routing rewards and completion through the common director.
swap('function updateFinisher(dt){const f=finisher,e=f.enemy;', 'function updateSoulbreaker(dt){const f=finisher,e=f.enemy;')
swap("killEnemy(e);hitArea(origin,5,40,10);if(ascendTime<=0)ascendCharge=Math.min(100,ascendCharge+18);health=Math.min(runMods.maxHealth,health+28);energy=Math.min(100,energy+28);score+=350;", "f.impactDone=true;executionImpact(f,origin);")
swap("if(t>3.12){finisher=null;invuln=1;document.body.classList.remove('cinematic');$('cinema').classList.remove('active');player.rig.rotation.set(0,0,0);actionText('SOUL CLAIMED  +350');}", "if(t>3.12)finishExecution(f);")
swap("if(finisher?.enemy===e&&finisher.t<2.35)", "if(finisher?.enemy===e&&!finisher.impactDone)")
# Keep executed corpses in the last authored pose while they fade.
swap("e.rig.rotation.x=THREE.MathUtils.lerp(e.rig.rotation.x,-1.5,Math.min(dt*5,1));e.root.position.y=Math.max(-1.4,.06-e.deathTime*.36);", "if(!e.executed)e.rig.rotation.x=THREE.MathUtils.lerp(e.rig.rotation.x,-1.5,Math.min(dt*5,1));e.root.position.y=Math.max(-1.4,(e.executed?e.corpseY:.06)-e.deathTime*.36);")
swap("currentDistrict='';shrines.forEach", "currentDistrict='';executionBag=[];completedExecutions=[];shrines.forEach")
swap("if(upgradeOpen){if(['Digit1'", "if(finisher?.preview){if(e.code==='Escape')finishExecution(finisher,true);return;}if(upgradeOpen){if(['Digit1'")
swap("(e.code==='KeyM'&&panelOpen==='map')", "(e.code==='KeyM'&&panelOpen==='map')||(e.code==='KeyV'&&panelOpen==='finishers')")
swap("if(e.code==='KeyM'&&!e.repeat){openMap();return;}", "if(e.code==='KeyV'&&!e.repeat){openFinisherCatalog();return;}if(e.code==='KeyM'&&!e.repeat){openMap();return;}")
swap("function closePanel(){if(!panelOpen)return;$(panelOpen==='map'?'realmMap':'settingsPanel')", "function closePanel(){if(!panelOpen)return;$(panelOpen==='map'?'realmMap':panelOpen==='finishers'?'finisherGrimoire':'settingsPanel')")
swap("['boonScreen','realmMap','settingsPanel','bossHUD']", "['boonScreen','realmMap','settingsPanel','finisherGrimoire','bossHUD']")
swap("const canFinish=executeCooldown<=0&&live.some", "$('finisherName').textContent=nextExecution(false).name;$('finisherHint').textContent=options.finisher==='auto'?'E · EXECUTE / V · VIEW ALL 20':'E · EXECUTE / V · CHANGE FINISHER';const canFinish=executeCooldown<=0&&live.some")
# Preview playback advances only the cinematic. The real game stays paused and unrewarded.
swap("let dt=paused?0:realdt*(wheelOpen?.065:1);", "let dt=paused&&!finisher?.preview?0:realdt*(wheelOpen?.065:1);")
swap("if(mode==='menu'){pose(player", "if(mode==='menu'&&!finisher?.preview){pose(player")
swap("if(mode==='game'&&!paused){ascendTime", "if(finisher?.preview){const e=finisher.enemy;updateFinisher(dt);smoothRig(player,dt);if(finisher)smoothRig(e,dt);}\nif(mode==='game'&&!paused){ascendTime")
swap("if(shake>0&&!paused&&options.shake)", "if(shake>0&&(!paused||finisher?.preview)&&options.shake)")
swap("finisher:!!finisher,drawCalls:", "finisher:!!finisher,execution:finisher?{id:finisher.def.id,time:finisher.t,duration:finisher.def.duration,preview:finisher.preview,impactDone:finisher.impactDone}:null,equippedFinisher:options.finisher,completedExecutions:[...completedExecutions],drawCalls:")
# Set up module only after all world and gameplay objects have been initialized.
swap("initOverhaul();\nif(import.meta.env.DEV", "initOverhaul();initFinisherCatalog();\nif(import.meta.env.DEV")
p.write_text(s)
