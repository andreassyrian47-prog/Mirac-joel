from pathlib import Path
p=Path('src/main.js');s=p.read_text()
def rep(a,b):
 global s
 assert a in s,a[:80]
 s=s.replace(a,b,1)
rep("import {createImpactWorld} from './impact-world.js';", "import {createImpactWorld} from './impact-world.js';\nimport {createGore} from './gore.js';")
rep("finisher:'auto',quality:","finisher:'auto',bossFinisher:'auto',gore:true,quality:")
rep("const impactWorld=createImpactWorld(scene);", "const impactWorld=createImpactWorld(scene);const gore=createGore(scene,()=>options.gore);")
rep("let executionBag=[]", "let bossExecutionBag=[],executionBag=[]")
rep("executionBag=[];completedExecutions=[];", "executionBag=[];bossExecutionBag=[];completedExecutions=[];")
rep("impactWorld.reset();health=100", "impactWorld.reset();gore.reset();health=100")
rep("if(!r)return;clearBody(r);", "if(!r)return;gore.release(r);clearBody(r);")
rep("function updateEffects(dt){impactWorld.update(dt);", "function updateEffects(dt){impactWorld.update(dt);gore.update(dt);")
# Blood is cosmetic and has a separate owner for preview cleanup.
rep("e.hp-=amount;if(finisher", "if(amount>=16&&finisher?.enemy!==e)gore.emit(chestContact(e),e.root.position.clone().sub(source||player.root.position),Math.min(2.2,amount/32));e.hp-=amount;if(finisher")
rep("if(e.hp<=0)killEnemy(e)}", "if(e.hp<=0){killEnemy(e);if(amount>55&&knock>7&&finisher?.enemy!==e)gore.sever(e,'arm',e.kb.clone().add(new THREE.Vector3(0,5,0)));}}")
rep("if(f.preview){f.enemy.dead=true;return;}", "gore.emit(chestContact(f.enemy),f.front.clone().multiplyScalar(-1).setY(1),f.def.bossOnly?3:2.1,f.preview?f:null);if(f.preview){f.enemy.dead=true;return;}")
rep("if(e.deathTime>3.2)", "if(e.deathTime>5)")
a=s.index('function nextExecution(');b=s.index('function startExecution(',a)
s=s[:a]+'''function nextExecution(consume=false,boss=false){
 const pool=FINISHERS.filter(f=>!!f.bossOnly===boss),choice=boss?options.bossFinisher:options.finisher;
 if(choice!=='auto'){const found=pool.find(f=>f.id===choice);if(found)return found;}
 let bag=boss?bossExecutionBag:executionBag;
 if(!bag.length){bag=pool.map(f=>f.id);for(let i=bag.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}const first=boss?'kingbreaker':'soulbreaker';if(!completedExecutions.some(id=>pool.some(f=>f.id===id))){bag.splice(bag.indexOf(first),1);bag.unshift(first);}else if(bag[0]===completedExecutions.at(-1))[bag[0],bag[1]]=[bag[1],bag[0]];if(boss)bossExecutionBag=bag;else executionBag=bag;}
 const def=pool.find(f=>f.id===bag[0]);if(consume)bag.shift();return def;
}
''' +s[b:]
rep("if(!preview)cancelUnreleasedCast();", "if(def.bossOnly&&!e.boss)return false;clearBody(e);resetMotion(e);e.downed=0;e.rise=null;if(!preview)cancelUnreleasedCast();")
rep("startExecution(e,nextExecution(true));", "startExecution(e,nextExecution(true,!!e.boss));")
rep("const u=Math.min(1,f.t/f.def.duration),beat=u<.31?0:u<.65?1:2;", "const u=Math.min(1,f.t/f.def.duration),marks=f.def.marks||[0,.31,.65],beat=Math.max(0,marks.findLastIndex(x=>u>=x));")
rep("String(beat+1).padStart(2,'0')+' / '+f.def.beats[beat].toUpperCase()", "String(beat+1).padStart(2,'0')+' / '+String(f.def.beats.length).padStart(2,'0')+' · '+f.def.beats[beat].toUpperCase()")
rep("$('finisherName').textContent=nextExecution(false).name;", "const readyTarget=live.filter(e=>executionReady(e)&&flatDistance(e.root.position,player.root.position)<5.5).sort((a,b)=>a.hp-b.hp)[0];$('finisherName').textContent=nextExecution(false,!!readyTarget?.boss).name;")
rep("E · EXECUTE / V · VIEW ALL 20", "E · EXECUTE / V · VIEW ALL 23")
rep("$('cueToggle').checked=options.cues;", "$('cueToggle').checked=options.cues;$('goreToggle').checked=options.gore;")
rep("[['motionToggle','motion'],['cueToggle','cues']]", "[['motionToggle','motion'],['cueToggle','cues'],['goreToggle','gore']]")
rep("options[key]=e.target.checked;saveOptions();", "options[key]=e.target.checked;if(key==='gore'&&!options.gore)gore.reset();saveOptions();")
rep("scene,player,camera,pose,aimHand,chestContact,burst,ring,beam,slash,tone,time:", "scene,player,camera,pose,aimHand,chestContact,burst,ring,beam,slash,tone,wound:(f,pos,strength)=>gore.emit(pos,f.front.clone().setY(.4),strength,f.preview?f:null),sever:(f,part)=>gore.sever(f.enemy,part,f.side.clone().multiplyScalar(3).setY(5),f.preview?f:null),clearWounds:f=>gore.clearOwner(f),time:")
a=s.index('function renderCatalog(){');b=s.index('function previewExecution(',a)
s=s[:a]+'''function renderCatalog(){
 const def=FINISHERS.find(d=>d.id===catalogFocus)||FINISHERS[0],family=FINISHER_SCHOOLS[def.school],matches=d=>catalogFilter==='all'||(catalogFilter==='boss'?d.bossOnly:!d.bossOnly&&d.school===catalogFilter),filtered=FINISHERS.filter(matches),list=$('executionList'),scroll=list.scrollTop;
 list.innerHTML=filtered.map(d=>{const active=d.id===def.id,equipped=(d.bossOnly?options.bossFinisher:options.finisher)===d.id;return `<button class="execution-row ${active?'selected':''}" data-execution="${d.id}" aria-pressed="${active}"><span class="execution-number">${String(FINISHERS.indexOf(d)+1).padStart(2,'0')}</span><span class="execution-mini" style="color:${FINISHER_SCHOOLS[d.school].color}">${finisherGlyph(d.school)}</span><span class="execution-row-name">${d.name}<small>${d.bossOnly?'BOSS EXCLUSIVE':d.id==='soulbreaker'?'YOUR ORIGINAL':FINISHER_SCHOOLS[d.school].label} <i>·</i> ${d.duration.toFixed(1)}s</small></span><span class="execution-mark">${equipped?'◆':'↗'}</span></button>`;}).join('');
 list.querySelectorAll('button').forEach(b=>b.onclick=()=>{catalogFocus=b.dataset.execution;renderCatalog();});list.scrollTop=scroll;
 document.querySelectorAll('[data-finisher-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.finisherFilter===catalogFilter);b.setAttribute('aria-pressed',String(b.dataset.finisherFilter===catalogFilter));});
 $('executionDetail').style.setProperty('--execution-color',family.color);$('catalogSchool').textContent=(def.bossOnly?'BOSS EXCLUSIVE / ':family.label+' / ')+'EXECUTION '+String(FINISHERS.indexOf(def)+1).padStart(2,'0');$('catalogName').textContent=def.name;$('catalogDescription').textContent=def.description;$('catalogSignature').textContent=def.signature;$('catalogDuration').textContent=def.duration.toFixed(1)+' SECONDS';$('catalogGlyph').innerHTML=finisherGlyph(def.school);
 $('catalogBeats').innerHTML=def.beats.map((beat,i)=>`<li><span>0${i+1}</span><strong>${beat}</strong></li>`).join('');
 const option=def.bossOnly?options.bossFinisher:options.finisher,selected=option===def.id;$('equipExecution').firstElementChild.textContent=selected?'EQUIPPED ON E':def.bossOnly?'EQUIP FOR BOSSES':'EQUIP ON E';$('equipExecution').classList.toggle('is-equipped',selected);$('cycleExecutions').classList.toggle('active',option==='auto');$('cycleExecutions').setAttribute('aria-pressed',String(option==='auto'));$('cycleExecutions').textContent=def.bossOnly?'CYCLE 3 BOSS EXECUTIONS':'CYCLE 20 STANDARD EXECUTIONS';
 $('bossPreview').disabled=!!def.bossOnly;$('bossPreview').checked=!!def.bossOnly||catalogBossPreview;
 $('equippedExecutionLabel').textContent=(def.bossOnly?'BOSSES: ':'STANDARD: ')+(option==='auto'?'SHUFFLE · NO REPEATS':FINISHERS.find(d=>d.id===option)?.name.toUpperCase());$('catalogVisibleCount').textContent=`${filtered.length} / 23 EXECUTIONS`;
}
''' +s[b:]
rep("const e=creature(false,catalogBossPreview);e.root.position.set(0,.06,8);e.root.scale.setScalar(catalogBossPreview?1.65:1.05);Object.assign(e,{boss:catalogBossPreview", "const boss=catalogBossPreview||!!def.bossOnly,e=creature(false,boss);e.root.position.set(0,.06,8);e.root.scale.setScalar(boss?1.65:1.05);Object.assign(e,{boss")
rep("$('cycleExecutions').onclick=()=>{options.finisher='auto';", "$('cycleExecutions').onclick=()=>{options[FINISHERS.find(d=>d.id===catalogFocus)?.bossOnly?'bossFinisher':'finisher']='auto';")
rep("$('equipExecution').onclick=()=>{options.finisher=catalogFocus;", "$('equipExecution').onclick=()=>{options[FINISHERS.find(d=>d.id===catalogFocus)?.bossOnly?'bossFinisher':'finisher']=catalogFocus;")
a=s.index(" document.querySelectorAll('[data-finisher-filter]').forEach(b=>b.onclick");b=s.index('\n}',a)
s=s[:a]+''' document.querySelectorAll('[data-finisher-filter]').forEach(b=>b.onclick=()=>{catalogFilter=b.dataset.finisherFilter;$('executionList').scrollTop=0;const match=d=>catalogFilter==='all'||(catalogFilter==='boss'?d.bossOnly:!d.bossOnly&&d.school===catalogFilter);if(!match(FINISHERS.find(d=>d.id===catalogFocus)||FINISHERS[0]))catalogFocus=FINISHERS.find(match).id;renderCatalog();});'''+s[b:]
rep("get state(){return{overcast:", "get state(){return{gore:gore.snapshot(),bossFinisher:options.bossFinisher,overcast:")
rep("executionCatalog(){return FINISHERS.map(d=>({id:d.id,name:d.name,school:d.school,duration:d.duration,description:d.description}));}", "executionCatalog(){return FINISHERS.map(d=>({id:d.id,name:d.name,school:d.school,duration:d.duration,bossOnly:!!d.bossOnly,description:d.description}));}")
# Record actual final solver residuals rather than un-offset wrist centers.
rep("body:bodyInfo(f.enemy),contacts:", "body:bodyInfo(f.enemy),grips:f.contactReport||[],drag:!!f.drag,joints:[...f.enemy.hands,...f.enemy.feet,f.enemy.hips].map(n=>n.getWorldPosition(new THREE.Vector3()).toArray()),contacts:")
rep("...f.ghosts.map(g=>g.root)],parents=", "...f.ghosts.map(g=>g.root),...gore.meshes()],parents=")
rep("if(!e)return false;player.root.position.set", "if(!e||FINISHERS.find(d=>d.id===id)?.bossOnly&&!boss)return false;player.root.position.set")
p.write_text(s)
p=Path('src/gore.js');s=p.read_text().replace('severed.push({node,cap,owner})','severed.push({node,cap,owner,root:r.root})');s=s.replace("reset();return {emit,sever,update,reset,clearOwner,snapshot,", "function release(r){for(let i=severed.length-1;i>=0;i--)if(severed[i].root===r.root)severed.splice(i,1);}\n reset();return {emit,sever,update,reset,clearOwner,release,snapshot,");p.write_text(s)
p=Path('src/contacts.js');s=p.read_text().replace("for(let pass=0;pass<3;pass++){", "if(f.reachAt!==f.t)for(let pass=0;pass<3;pass++){").replace(" for(const c of constraints){if(c.weight<=0)", " f.reachAt=f.t;\n for(const c of constraints){if(c.weight<=0)");p.write_text(s)
p=Path('index.html');s=p.read_text().replace('ALL <b>20</b>','ALL <b>23</b>').replace('SPECTRAL <b>4</b></button></nav>','SPECTRAL <b>4</b></button><button data-finisher-filter="boss">BOSS <b>3</b></button></nav>');s=s.replace('20-finisher grimoire','23-finisher grimoire').replace('20 EXECUTIONS','23 EXECUTIONS');needle='<strong>Full-screen hit flashes</strong>';idx=s.index('<div class="setting-row">',s.index('id="flashToggle"'));s=s[:idx]+'<div class="setting-row"><div><strong>Gore & dismemberment</strong><small>Stylized blood, pools and severed demon parts. Turn off to clear them.</small></div><input id="goreToggle" aria-label="Gore and dismemberment" type="checkbox" checked></div>'+s[idx:];p.write_text(s)
p=Path('finishers.css');s=p.read_text()+'''\n.execution-filters{flex-wrap:wrap}.execution-filters button[data-finisher-filter="boss"]{color:#e6a5a0}#catalogBeats{max-height:220px;overflow:auto}#catalogBeats li{min-height:34px}''';p.write_text(s)
