// The Execution Grimoire equips a favorite or cycles the complete roster without repeats.
let catalogBossPreview=false;
function openFinisherCatalog(){
 if(wheelOpen)closeWheel();if(!openPanel('finishers'))return;
 if(options.finisher!=='auto')catalogFocus=options.finisher;
 $('finisherGrimoire').classList.remove('hidden');renderCatalog();
}
function finisherGlyph(school){
 const path=school==='brutal'?'M4 22 8 8 6 2 11 6 12 16M12 22l4-14-1-6 5 5-2 15M2 18l20 0':iconPaths[school];
 return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
}
function renderCatalog(){
 const def=FINISHERS.find(d=>d.id===catalogFocus)||FINISHERS[0],family=FINISHER_SCHOOLS[def.school];
 const filtered=FINISHERS.filter(d=>catalogFilter==='all'||d.school===catalogFilter),list=$('executionList'),scroll=list.scrollTop;
 list.innerHTML=filtered.map(d=>{const i=FINISHERS.indexOf(d),active=d.id===def.id,equipped=options.finisher===d.id;return `<button class="execution-row ${active?'selected':''}" data-execution="${d.id}" aria-pressed="${active}"><span class="execution-number">${String(i+1).padStart(2,'0')}</span><span class="execution-mini" style="color:${FINISHER_SCHOOLS[d.school].color}">${finisherGlyph(d.school)}</span><span class="execution-row-name">${d.name}<small>${d.id==='soulbreaker'?'YOUR ORIGINAL':FINISHER_SCHOOLS[d.school].label} <i>·</i> ${d.duration.toFixed(1)}s</small></span><span class="execution-mark">${equipped?'◆':'↗'}</span></button>`}).join('');
 list.querySelectorAll('button').forEach(b=>b.onclick=()=>{catalogFocus=b.dataset.execution;renderCatalog()});list.scrollTop=scroll;
 document.querySelectorAll('[data-finisher-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.finisherFilter===catalogFilter);b.setAttribute('aria-pressed',String(b.dataset.finisherFilter===catalogFilter))});
 $('executionDetail').style.setProperty('--execution-color',family.color);$('catalogSchool').textContent=family.label+' / EXECUTION '+String(FINISHERS.indexOf(def)+1).padStart(2,'0');$('catalogName').textContent=def.name;$('catalogDescription').textContent=def.description;$('catalogSignature').textContent=def.signature;$('catalogDuration').textContent=def.duration.toFixed(1)+' SECONDS';$('catalogGlyph').innerHTML=finisherGlyph(def.school);
 $('catalogBeats').innerHTML=def.beats.map((beat,i)=>`<li><span>0${i+1}</span><strong>${beat}</strong></li>`).join('');
 const selected=options.finisher===def.id;$('equipExecution').firstElementChild.textContent=selected?'EQUIPPED ON E':'EQUIP ON E';$('equipExecution').classList.toggle('is-equipped',selected);$('cycleExecutions').classList.toggle('active',options.finisher==='auto');$('cycleExecutions').setAttribute('aria-pressed',String(options.finisher==='auto'));
 $('equippedExecutionLabel').textContent=options.finisher==='auto'?'EQUIPPED: CYCLE ALL 20 · NO REPEATS':'EQUIPPED: '+(FINISHERS.find(d=>d.id===options.finisher)?.name||'Soulbreaker').toUpperCase();$('catalogVisibleCount').textContent=`${filtered.length} / 20 EXECUTIONS`;
}
function previewExecution(id=catalogFocus){
 if(finisher||panelOpen!=='finishers')return;const def=FINISHERS.find(d=>d.id===id);if(!def)return;catalogFocus=id;
 previewSnapshot={position:player.root.position.clone(),rotation:player.root.rotation.clone(),scale:player.root.scale.clone(),cameraPosition:camera.position.clone(),cameraQuaternion:camera.quaternion.clone(),fov:camera.fov,action,actionQueue,airTarget};
 player.root.scale.setScalar(1.2);player.root.position.set(0,.06,10.4);player.root.rotation.set(0,Math.PI,0);player.motionCache=null;pose(player,elapsed);
 const e=creature(false,catalogBossPreview);e.root.position.set(0,.06,8);e.root.scale.setScalar(catalogBossPreview?1.65:1.05);Object.assign(e,{boss:catalogBossPreview,hp:1,maxHp:1,dead:false,kb:new THREE.Vector3(),vy:0,airborne:false,stagger:0});
 panelOpen=null;paused=true;$('finisherGrimoire').classList.add('hidden');startExecution(e,def,true);
}
function initFinisherCatalog(){
 executionDirector=createExecutionDirector({scene,player,camera,pose,aimHand,chestContact,burst,ring,beam,slash,tone,time:()=>elapsed,makeGhost:makeExecutionGhost,removeGhost:removeTransientRig,onImpact:executionImpact,onFinish:finishExecution,kick:(amount,stop)=>{shake=Math.max(shake,amount);hitstop=Math.max(hitstop,stop);}});
 if(options.finisher!=='auto'&&!FINISHERS.some(d=>d.id===options.finisher))options.finisher='auto';
 $('menuFinishers').onclick=openFinisherCatalog;$('pauseFinishers').onclick=openFinisherCatalog;$('closeGrimoire').onclick=closePanel;
 $('cycleExecutions').onclick=()=>{options.finisher='auto';saveOptions();renderCatalog();tone(250,.12,'triangle',.04,110)};
 $('equipExecution').onclick=()=>{options.finisher=catalogFocus;saveOptions();renderCatalog();tone(280,.18,'triangle',.06,80)};
 $('previewExecution').onclick=()=>previewExecution();$('bossPreview').onchange=e=>catalogBossPreview=e.target.checked;
 document.querySelectorAll('[data-finisher-filter]').forEach(b=>b.onclick=()=>{catalogFilter=b.dataset.finisherFilter;$('executionList').scrollTop=0;const first=FINISHERS.find(d=>catalogFilter==='all'||d.school===catalogFilter);if(catalogFilter!=='all'&&FINISHERS.find(d=>d.id===catalogFocus)?.school!==catalogFilter)catalogFocus=first.id;renderCatalog()});
}
