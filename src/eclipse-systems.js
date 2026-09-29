import * as THREE from 'three';
const $=id=>document.getElementById(id);
const ranks=[{at:0,name:'D',title:'AWAKENING'},{at:20,name:'C',title:'VICIOUS'},{at:45,name:'B',title:'RELENTLESS'},{at:80,name:'A',title:'DIABOLICAL'},{at:125,name:'S',title:'APOCALYPTIC'},{at:175,name:'SSS',title:'HELL INCARNATE'}];
export const RIFT_DEFINITIONS=[
 {id:'pale',name:'The Unburied Choir',x:-37,z:26,color:0x9abddf,reward:'PALE COVENANT · +10 MAX VITALITY',school:'ghost'},
 {id:'cinder',name:'The Furnace Wound',x:38,z:-31,color:0xeb9460,reward:'CINDER COVENANT · +8% BASE DAMAGE',school:'fire'},
 {id:'hollow',name:'The Hollow Vigil',x:17,z:45,color:0x8dd7b4,reward:'HOLLOW COVENANT · +20% WRATH REGEN',school:'mind'}
];
export function createEclipseSystems(api){
 const {scene,player,camera}=api;let style=0,best=0,quiet=0,clock=0,audioBeat=0,hudTick=0,hitTimer=0,wavePeak=0,masteryBonus=0,lastRank='D',rankUpAt=-1;
 const recent=new Map();
 const nodes=RIFT_DEFINITIONS.map(def=>{
  // Keep rituals out of trunks and column bases; the map uses these same resolved coordinates.
  const candidates=[];for(let x=-12;x<=12;x+=3)for(let z=-12;z<=12;z+=3)candidates.push({x:def.x+x,z:def.z+z,cost:x*x+z*z});
  candidates.sort((a,b)=>a.cost-b.cost);const clear=candidates.find(p=>Math.hypot(p.x,p.z)<78&&api.obstacles.every(o=>Math.hypot(p.x-o.x,p.z-o.z)>o.r+7));
  if(clear){def.x=clear.x;def.z=clear.z;}

  const group=new THREE.Group();group.position.set(def.x,0,def.z);scene.add(group);
  const mat=new THREE.MeshBasicMaterial({color:def.color,transparent:true,opacity:.65,depthWrite:false});
  const base=new THREE.Mesh(new THREE.TorusGeometry(2.8,.028,4,80),mat);base.rotation.x=-Math.PI/2;base.position.y=.12;group.add(base);
  const crown=new THREE.Group();crown.position.y=2.1;group.add(crown);
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(.32),mat);crown.add(core);
  for(let j=0;j<2;j++){const m=new THREE.Mesh(new THREE.TorusGeometry(.9+j*.25,.022,4,48),mat);m.rotation.set(j*.7,.3+j*.8,0);crown.add(m);}
  const pillarMat=new THREE.MeshStandardMaterial({color:'#263a35',roughness:.7,metalness:.4});
  for(let j=0;j<3;j++){const a=j/3*Math.PI*2;const m=new THREE.Mesh(new THREE.ConeGeometry(.24,2,4),pillarMat);m.position.set(Math.sin(a)*2.8,1,Math.cos(a)*2.8);group.add(m);}
  return {...def,status:'dormant',remaining:0,group,crown,mat};
 });
 const warningEls=Array.from({length:4},()=>{const el=document.createElement('div');el.className='threat-cue hidden';el.innerHTML='<i></i><span></span>';$('threatLayer').append(el);return el});
 function styleHit(key,points=8){
  const last=recent.get(key),repeat=last!==undefined&&clock-last<4;
  style=Math.min(200,style+points*(repeat?.32:1));best=Math.max(best,style);wavePeak=Math.max(wavePeak,style);quiet=0;recent.set(key,clock);
 }
 function onHurt(source){style=Math.max(0,style-24);quiet=0;hitTimer=.65;const from=source||api.getState().enemies.find(e=>!e.dead)?.root.position;if(from){const v=from.clone().sub(player.root.position);const forward=new THREE.Vector3();camera.getWorldDirection(forward);const angle=Math.atan2(v.x,v.z)-Math.atan2(forward.x,forward.z);$('hitDirection').style.transform=`translate(-50%,-50%) rotate(${-angle}rad)`;}}
 function tryRift(){
  const state=api.getState();const n=nodes.find(n=>Math.hypot(player.root.position.x-n.x,player.root.position.z-n.z)<5);
  if(!n)return false;
  if(n.status==='sealed'){api.notify('This rift is sealed. Its covenant lasts until this run ends.');return true;}
  if(n.status==='hunting'){api.notify(`${n.remaining} rift guardian${n.remaining===1?'':'s'} remain. Defeat them to seal the wound.`);return true;}
  if(nodes.some(n=>n.status==='hunting')){api.notify('Finish the active Rift Hunt before awakening another.');return true;}
  if(state.wave<1||state.wavePending){api.notify('Awaken a rift while a wave is active.');return true;}
  n.status='hunting';n.remaining=3;
  for(let i=0;i<3;i++)api.spawnGuardian(n,i);
  api.banner('RIFT HUNT · '+n.name.toUpperCase(),'Three marked guardians. One forbidden covenant.');
  api.ring(n.group.position,n.color,7,1);api.tone(90,.65,'triangle',.09,30);
  return true;
 }
 function onKill(enemy){
  if(!enemy.riftId)return;
  const n=nodes.find(n=>n.id===enemy.riftId);if(!n||n.status!=='hunting')return;
  n.remaining=Math.max(0,n.remaining-1);
  if(n.remaining===0){n.status='sealed';styleHit('rift',30);api.reward(n);api.banner('RIFT SEALED',n.reward);api.ring(n.group.position,n.color,12,1.2);api.tone(320,.8,'triangle',.09,95);}
 }
 function reset(){style=best=quiet=clock=hitTimer=wavePeak=masteryBonus=0;recent.clear();nodes.forEach(n=>{n.status='dormant';n.remaining=0;});warningEls.forEach(el=>el.classList.add('hidden'));}
 function update(dt,time){
  const s=api.getState(),running=s.mode==='game'&&!s.paused&&!s.finisher;
  nodes.forEach((n,i)=>{n.crown.rotation.y=time*.35*(i%2?-1:1);n.crown.position.y=2.1+Math.sin(time*1.3+i)*.15;n.mat.opacity=n.status==='sealed'?.17:n.status==='hunting'?.65+Math.sin(time*4)*.18:.55;n.crown.scale.setScalar(n.status==='hunting'?1.3:1);});
  if(running){clock+=dt;quiet+=dt;hitTimer=Math.max(0,hitTimer-dt);if(quiet>3)style=Math.max(0,style-dt*(quiet>7?11:4));audioBeat-=dt;if(audioBeat<=0){const danger=s.health/s.maxHealth<.3;audioBeat=danger?.58:s.enemies.some(e=>!e.dead&&e.boss)?.62:style>80?.72:1.1;if(danger||style>20||s.enemies.some(e=>!e.dead&&e.boss))api.tone(danger?48:62,.16,'sine',danger?.07:.026,28);}}
  $('hitDirection').style.opacity=running?hitTimer:0;
  hudTick+=dt;if(hudTick<.08&&running)return;hudTick=0;
  const rank=[...ranks].reverse().find(r=>style>=r.at),next=ranks[ranks.indexOf(rank)+1];
  if(rank.name!==lastRank){const rise=ranks.indexOf(rank)>ranks.findIndex(r=>r.name===lastRank);lastRank=rank.name;if(rise&&running){rankUpAt=clock;api.actionText?.(rank.name+' · '+rank.title+' · SOULS ×'+multiplier().toFixed(2));api.tone?.(540+style*1.4,.24,'triangle',.11,320);api.ring?.(player.root.position.clone(),0xf2b06a,4.5,.55);}}
  $('styleGrade').textContent=rank.name;$('styleTitle').textContent=rank.title;$('styleProgress').style.width=(next?(style-rank.at)/(next.at-rank.at)*100:100)+'%';$('stylePanel').classList.toggle('exalted',style>=125);
  $('tetherStatus').textContent=s.tetherCooldown>0?s.tetherCooldown.toFixed(1)+'s':'READY';$('swapName').textContent=s.previousPower;
  const active=nodes.find(n=>n.status==='hunting'),near=nodes.find(n=>Math.hypot(n.x-player.root.position.x,n.z-player.root.position.z)<5),sealed=nodes.filter(n=>n.status==='sealed').length;
  $('riftTitle').textContent=active?active.name:near?near.name:'THE THREE WOUNDS';$('riftObjective').textContent=active?`${active.remaining} MARKED GUARDIANS REMAIN`:near?(near.status==='sealed'?'COVENANT CLAIMED':'G · AWAKEN RIFT HUNT'):`${sealed} / 3 RIFTS SEALED · EXPLORE WITH M`;
  $('riftTracker').classList.toggle('active',!!active);$('riftContext').textContent=running&&near&&!s.wheelOpen?(near.status==='dormant'?'G · AWAKEN RIFT HUNT':near.status==='hunting'?'DEFEAT THE MARKED GUARDIANS':'RIFT SEALED'):'';
  const threats=running&&!s.wheelOpen?s.enemies.filter(e=>!e.dead&&(e.state==='windup'||e.bossMove?.stage==='windup')&&e.root.position.distanceTo(player.root.position)<28).sort((a,b)=>a.root.position.distanceToSquared(player.root.position)-b.root.position.distanceToSquared(player.root.position)).slice(0,4):[];
  const forward=new THREE.Vector3();camera.getWorldDirection(forward);
  warningEls.forEach((el,i)=>{const e=threats[i];el.classList.toggle('hidden',!e);if(!e)return;const world=e.root.position.clone().add(new THREE.Vector3(0,e.boss?5:3.7,0)),delta=world.clone().sub(camera.position),p=world.project(camera);const behind=delta.dot(forward)<0;let x=p.x,y=-p.y;if(behind){x=-x;y=-y;}const off=behind||Math.abs(x)>.82||Math.abs(y)>.68;if(off){if(Math.abs(x)+Math.abs(y)<.02)y=.7;const d=Math.max(Math.abs(x)/.86,Math.abs(y)/.7,.01);x/=d;y/=d;}el.style.left=(50+x*50)+'%';el.style.top=(50+y*50)+'%';const crimson=e.boss&&e.bossMove?.kind!=='hex';el.classList.toggle('crimson',crimson);el.classList.toggle('edge',off);el.querySelector('span').textContent=crimson?'EVADE':e.caster||e.bossMove?.kind==='hex'?'REFLECT':'PARRY';});
 }
 function drawMap(c,point,mini){nodes.forEach(n=>{const [x,y]=point(n.x,n.z);c.save();c.translate(x,y);c.rotate(Math.PI/4);c.strokeStyle=n.status==='sealed'?'#718579':n.status==='hunting'?'#f5a375':'#90d9c0';c.lineWidth=mini?1:2;c.strokeRect(-5,-5,10,10);if(n.status==='hunting'){c.fillStyle='#ef9c7177';c.fillRect(-3,-3,6,6);}c.restore();if(!mini){c.font='9px Arial';c.textAlign='center';c.fillStyle='#9ebdb1';const labelY=y+(n.id==='cinder'?-18:22),width=c.measureText(n.name).width+10;c.fillStyle='#0e1b18e8';c.fillRect(x-width/2,labelY-9,width,13);c.fillStyle='#aac7b9';c.fillText(n.name,x,labelY);}});}
 function multiplier(){return 1+Math.min(2,style/85);}
 function snapshot(){return {masteryBonus,style:Math.round(style*10)/10,bestStyle:Math.round(best),rank:[...ranks].reverse().find(r=>style>=r.at).name,multiplier:Math.round(multiplier()*100)/100,rankUpAt,rifts:nodes.map(({id,name,x,z,status,remaining})=>({id,name,x,z,status,remaining}))};}
 return {update,reset,tryRift,onKill,onHurt,styleHit,drawMap,snapshot,multiplier,value(){return style;},setStyle(v){style=Math.max(0,Math.min(200,v));recent.clear();},beginWave(){wavePeak=style;masteryBonus=0;},endWave(){masteryBonus=Math.floor(wavePeak*2);return masteryBonus;}};
}
