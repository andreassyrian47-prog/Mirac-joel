// Headless Node harness: drives the execution director for every finisher with
// stub rigs (same skeleton hierarchy as main.js `creature`). No browser needed.
// Run: node tests/gravitas-run.mjs   (bundles this file with esbuild first)
import * as THREE from 'three';
import {FINISHERS,createExecutionDirector} from '../src/finishers.js';
import {executionTime} from '../src/execution-timing.js';
import {gravitasOf,impactWall} from '../src/gravitas.js';
import {poseMotion,resetMotion,finishMotion,polishExecution} from '../src/motion.js';
import {cinematicBody} from '../src/cinematic.js';
import {bodyOverlap} from '../src/body-spacing.js';

const V=THREE.Vector3;
function rig(isPlayer=false,scale=1.2){
 const root=new THREE.Group(),rigG=new THREE.Group();root.add(rigG);
 const hips=new THREE.Group();hips.position.y=1.22;rigG.add(hips);
 const spine=new THREE.Group();spine.position.y=.19;hips.add(spine);const torso=new THREE.Group();spine.add(torso);
 const neck=new THREE.Group();neck.position.set(0,.94,.015);torso.add(neck);const head=new THREE.Group();neck.add(head);
 const arms=[],forearms=[],hands=[],legs=[],shins=[],feet=[],toes=[],fingers=[[],[]];
 for(const s of [-1,1]){const arm=new THREE.Group();arm.position.set(s*.49,.61,0);torso.add(arm);arms.push(arm);const fore=new THREE.Group();fore.position.set(s*.065,-.47,0);arm.add(fore);forearms.push(fore);const hand=new THREE.Group();hand.position.set(0,-.4,.02);fore.add(hand);hands.push(hand);
  for(let j=0;j<4;j++){const xx=(j-1.5)*.074,finger=new THREE.Group();finger.position.set(xx,-.1,.015);hand.add(finger);fingers[s<0?0:1].push(finger);const distal=new THREE.Group();distal.position.set(xx*.12,-.09,.022);finger.add(distal);finger.userData.distal=distal;}
  const thumb=new THREE.Group();thumb.position.set(s*.12,-.01,.03);hand.add(thumb);fingers[s<0?0:1].push(thumb);
  const leg=new THREE.Group();leg.position.set(s*.225,-.1,0);hips.add(leg);legs.push(leg);const shin=new THREE.Group();shin.position.set(0,-.48,.02);leg.add(shin);shins.push(shin);const foot=new THREE.Group();foot.position.set(0,-.56,.115);shin.add(foot);feet.push(foot);const toe=new THREE.Group();toe.position.set(0,0,.18);foot.add(toe);toes.push(toe);}
 root.scale.setScalar(scale);
 return {root,rig:rigG,hips,spine,torso,neck,head,jaw:null,arms,forearms,hands,legs,shins,feet,toes,fingers,tail:[],wings:[],ownedMaterials:new Set(),baseHip:1.22,isPlayer};
}
export function makeWorld(){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(57,16/9,.1,200);camera.position.set(0,3,8);
 const player=rig(true);scene.add(player.root);
 const log={bursts:0,rings:0,beams:0,wounds:[],severs:[],kicks:[],tones:0,impacts:0,finished:0};
 let elapsed=0;
 const api={
  polish:(f,dt)=>{polishExecution(f,player);cinematicBody(f,player,dt,[]);},smoothGhost:(g,dt)=>finishMotion(g,dt),scene,player,camera,
  pose:(r,t,moving=0,attack=null)=>poseMotion(r,t,moving,attack),aimHand(){},
  chestContact:(e,x=0,z=.24)=>{e.root.updateMatrixWorld(true);return e.torso.localToWorld(new V(x,.47,z));},
  burst:()=>log.bursts++,ring:()=>log.rings++,beam:()=>log.beams++,slash(){},tone:()=>log.tones++,
  wound:(f,pos,strength)=>log.wounds.push(strength),sever:(f,part)=>log.severs.push(part),clearWounds(){},
  time:()=>elapsed,makeGhost:(source)=>{const g=rig(source.isPlayer,source.root.scale.x);g.spectral=true;scene.add(g.root);return g;},removeGhost:(g)=>scene.remove(g.root),
  onImpact:()=>log.impacts++,onFinish:()=>log.finished++,kick:(a,s)=>log.kicks.push([a,s])
 };
 const director=createExecutionDirector(api);
 return {scene,camera,player,director,log,api,tick:dt=>{elapsed+=dt;}};
}
export function runExecution(id,{boss=false,small=false,fps=60,record=null}={}){
 const world=makeWorld(),{player,director,log}=world;
 const def=FINISHERS.find(d=>d.id===id);if(!def)throw new Error('unknown '+id);
 const enemy=rig(false,boss?1.65:small?.78:1.05);enemy.boss=boss;enemy.small=small;world.scene.add(enemy.root);
 enemy.root.position.set(0,.06,0);player.root.position.set(0,.06,3.2);player.root.rotation.y=Math.PI;
 resetMotion(player);resetMotion(enemy);
 const f={actionCamera:true,cameraShake:true,cameraObstacles:null,def,entryPose:null,enemy,t:0,stage:0,preview:true,impactDone:false,origin:enemy.root.position.clone().setY(.06),front:new V(0,0,1)};
 const dt=1/fps;let frames=0,maxRootStep=0,prevRoot=null,nonFinite=null,impactFrame=-1,slowFrames=0,maxCore=0,maxContact=0,maxFraming=0,coreAt=null;
 const samples=[];
 while(frames<fps*40){
  let step=dt;if(f.slow>0){f.slow=0;slowFrames++;} // test hooks run undilated, like __hellbound.testing.advanceExecution
  world.tick(step);director.update(f,step);frames++;
  // Mirror __hellbound.testing.advanceExecution: smooth both rigs, then the director's final contact pass.
  if(!log.finished){if(!player.physicalBody)finishMotion(player,step);if(!enemy.physicalBody)finishMotion(enemy,step);if(f.props)director.align(f);}
  if(log.impacts&&impactFrame<0)impactFrame=frames;
  if(!log.finished){
   const core=bodyOverlap(player,enemy);if(core>maxCore){maxCore=core;coreAt={frame:frames,u:+(f.t/def.duration).toFixed(3)};}for(const g of f.contactReport||[])if(g.weight>.99&&g.error>maxContact){maxContact=g.error;f.gvContactAt={frame:frames,u:+(f.t/def.duration).toFixed(4),type:g.type,hand:g.hand,goal:g.goal?.map(x=>+x.toFixed(2)),actual:g.actual?.map(x=>+x.toFixed(2)),strikes:(f.strikes||[]).map(c=>[c.hand,c.where,c.leg?'leg':'',+c.weight.toFixed(2)]),contacts:(f.contacts||[]).map(c=>[c.hand,c.where,+c.weight.toFixed(2)])};}maxFraming=Math.max(maxFraming,f.framing?.maxNdc||0);
   const rp=player.root.position.clone();if(prevRoot){const st=rp.distanceTo(prevRoot);if(st>maxRootStep){maxRootStep=st;f.gvStepAt={frame:frames,u:+(f.t/def.duration).toFixed(3),clock:+f.clock.toFixed(3),phys:!!enemy.physicalBody,from:prevRoot.toArray().map(x=>+x.toFixed(2)),to:rp.toArray().map(x=>+x.toFixed(2))};}}f.gvPrev=prevRoot;prevRoot=rp;
   for(const r of [player,enemy])for(const n of [r.root,r.rig,r.hips,r.torso,r.head,...r.arms,...r.forearms,...r.legs,...r.shins]){if(![...n.position.toArray(),...n.rotation.toArray().slice(0,3)].every(Number.isFinite)){nonFinite=nonFinite||{frame:frames,node:n.uuid};}}
   if(record&&frames%record===0)samples.push({frame:frames,pin:(f.contactReport||[]).filter(g=>g.weight>.99).map(g=>+g.error.toFixed(3)),rootStep:+(prevRoot&&f.gvPrev?rp.distanceTo(f.gvPrev):0).toFixed(3),core:+(f.coreCorrection||0).toFixed(2),pen:+(f.corePenetration||0).toFixed(3),ex:+enemy.root.position.x.toFixed(2),ez:+enemy.root.position.z.toFixed(2),px:+rp.x.toFixed(2),pz:+rp.z.toFixed(2),t:+f.clock.toFixed(3),u:+(f.t/def.duration).toFixed(3),pT:player.torso.rotation.x,pH:player.hips.position.y,pHead:player.head.rotation.x,eT:enemy.torso.rotation.x,eHead:enemy.head.rotation.x,eA0:enemy.arms[0].rotation.x,ey:enemy.root.position.y,phys:!!enemy.physicalBody});
  }
  if(log.finished)break;
 }
 return {id,duration:def.duration,impact:def.impact,impactWall:impactWall(def),frames,seconds:frames/fps,impactFrame,impactSeconds:impactFrame/fps,slowFrames,finished:log.finished===1,impacts:log.impacts,maxRootStep,stepAt:f.gvStepAt,maxCore,coreAt,maxContact,contactAt:f.gvContactAt,maxFraming,nonFinite,wounds:log.wounds,severs:log.severs,kicks:log.kicks.length,samples,gravitas:gravitasOf(def)};
}
export {FINISHERS,executionTime,impactWall};
