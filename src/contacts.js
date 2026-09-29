import * as THREE from 'three';
import {separateCores} from './body-spacing.js';
const V=THREE.Vector3,Q=THREE.Quaternion,clamp=THREE.MathUtils.clamp;
const palm=new V(0,-.075,.045),toe=new V(0,0,.17);
export function palmPoint(r,i){r.root.updateMatrixWorld(true);return r.hands[i].localToWorld(palm.clone());}
function orientation(normal){const z=normal.clone().negate().normalize(),up=Math.abs(z.y)>.94?new V(0,0,1):new V(0,1,0),x=up.cross(z).normalize(),y=z.clone().cross(x).normalize();return new Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));}
export function solveChain(r,upper,lower,end,world,weight=1,leg=false,side=0){
 r.root.updateMatrixWorld(true);const a=lower.position.clone(),b=end.position.clone(),l1=a.length(),l2=b.length(),target=upper.parent.worldToLocal(world.clone()).sub(upper.position),distance=clamp(target.length(),.09,l1+l2-.002),dir=target.normalize();
 let pole=leg?new V(0,0,1):new V(side?1:-1,-.16,-.6);pole.addScaledVector(dir,-pole.dot(dir));const alt=leg?new V(side?-1:1,0,0):new V(0,-1,0);alt.addScaledVector(dir,-alt.dot(dir));const sing=1-clamp(pole.length()/.35,0,1);if(sing>0){pole.normalize().multiplyScalar(1-sing).addScaledVector(alt.normalize(),sing);pole.addScaledVector(dir,-pole.dot(dir));}if(pole.lengthSq()<.0004){pole.set(1,0,0).addScaledVector(dir,-dir.x);if(pole.lengthSq()<.0004)pole.set(0,0,1).addScaledVector(dir,-dir.z);}pole.normalize();const along=(l1*l1-l2*l2+distance*distance)/(2*distance),bend=Math.sqrt(Math.max(0,l1*l1-along*along)),elbow=dir.clone().multiplyScalar(along).addScaledVector(pole,bend),qa=new Q().setFromUnitVectors(a.normalize(),elbow.clone().normalize()),endDir=dir.multiplyScalar(distance).sub(elbow).applyQuaternion(qa.clone().invert()),qb=new Q().setFromUnitVectors(b.normalize(),endDir.normalize());upper.quaternion.slerp(qa,weight);lower.quaternion.slerp(qb,weight);r.root.updateMatrixWorld(true);
}
export function targetOf(f,c){const e=f.enemy;e.root.updateMatrixWorld(true);if(c.surface&&c.where==='chest'&&!c.node&&f.actor){const local=e.torso.worldToLocal((c.leg?f.actor.legs[c.hand]:f.actor.arms[c.hand]).getWorldPosition(new V())),d=new V(local.x,0,local.z).normalize(),radius=1/Math.sqrt(d.x*d.x/(.48*.48)+d.z*d.z/(.42*.42));return e.torso.localToWorld(new V(d.x*radius,.47,d.z*radius));}let goal=c.node?c.node.localToWorld(new V(...(c.offset||[0,0,0]))):c.where==='head'?e.head.localToWorld(new V(0,.12,.19)):e.torso.localToWorld(new V(c.x||0,.47,Math.sign(c.z||1)*Math.max(.42,Math.abs(c.z??.42))));if(c.side)goal.addScaledVector(f.side,c.side);return goal;}

export function aimContact(r,i,goal,normal,weight=1,leg=false){
 const end=leg?r.feet[i]:r.hands[i],lower=leg?r.shins[i]:r.forearms[i],upper=leg?r.legs[i]:r.arms[i],q=orientation(normal),tip=leg?toe:palm;
 const wrist=goal.clone().sub(tip.clone().multiplyScalar(r.root.scale.y).applyQuaternion(q));const approach=end.getWorldPosition(new V()).lerp(wrist,weight);solveChain(r,upper,lower,end,approach,1,leg,i);
 const local=lower.getWorldQuaternion(new Q()).invert().multiply(q);end.quaternion.slerp(local,weight);if(!leg)r.fingers[i]?.forEach((n,j)=>n.rotation.x=-.8*weight*(j===4?.65:1));r.root.updateMatrixWorld(true);
}
function drag(f,p){
 const d=f.drag,e=f.enemy,w=clamp(d.weight,0,1);if(w<=0||e.physicalBody)return;
 p.hands[d.hand].rotation.x=.12;p.hands[d.hand].rotation.z=(d.hand?1:-1)*.3;const goal=palmPoint(p,d.hand);e.root.updateMatrixWorld(true);const foot=e.feet[d.leg].getWorldPosition(new V()),delta=goal.clone().sub(foot);delta.y=0;e.root.position.addScaledVector(delta,w);e.root.updateMatrixWorld(true);
 // Keep the pelvis on the floor; the held leg bends up to the grip instead of lifting the whole body.
 const hip=e.legs[d.leg].getWorldPosition(new V()),reach=(e.shins[d.leg].position.length()+e.feet[d.leg].position.length())*e.root.scale.y*.97,vertical=goal.y-hip.y,horizontal=goal.clone().sub(hip).setY(0),maxHorizontal=Math.sqrt(Math.max(.04,reach*reach-vertical*vertical));
 if(horizontal.length()>maxHorizontal)e.root.position.addScaledVector(horizontal.normalize(),(goal.clone().sub(hip).setY(0).length()-maxHorizontal)*w);e.root.updateMatrixWorld(true);
 solveChain(e,e.legs[d.leg],e.shins[d.leg],e.feet[d.leg],goal,w,true,d.leg);e.feet[d.leg].rotation.z+=(d.leg?1:-1)*.22*w;p.fingers[d.hand].forEach(n=>n.rotation.x=-1.05*w);
 f.contactReport.push({type:'ankle-grip',weight:w,error:goal.distanceTo(e.feet[d.leg].getWorldPosition(new V()))});
}
function floorLimbs(r,held=-1){
 r.root.updateMatrixWorld(true);for(let i=0;i<2;i++)for(const leg of [false,true]){if(leg&&i===held)continue;const end=leg?r.feet[i]:r.hands[i],goal=end.getWorldPosition(new V()),floor=(leg?.13:.10)*r.root.scale.y;if(goal.y<floor){goal.y=floor;const q=end.getWorldQuaternion(new Q()),lower=leg?r.shins[i]:r.forearms[i];solveChain(r,leg?r.legs[i]:r.arms[i],lower,end,goal,1,leg,i);end.quaternion.copy(lower.getWorldQuaternion(new Q()).invert().multiply(q));}}
}
export function alignInteractions(f,p){
 f.contactReport=[];const physical=!!f.enemy.physicalBody;
 separateCores(f,p);floorLimbs(p);if(!physical)floorLimbs(f.enemy,f.drag?.weight>.1?f.drag.leg:f.carryVictim?0:-1);
 if(f.drag){drag(f,p);if(f.drag.weight>.995)f.dragExit=f.enemy.root.position.clone();}
 if(f.carryVictim&&!physical){const c=f.carryVictim,w=c.weight,goal=palmPoint(p,c.hand);f.enemy.root.updateMatrixWorld(true);f.enemy.root.position.addScaledVector(goal.clone().sub(c.node.getWorldPosition(new V())),w);f.enemy.root.updateMatrixWorld(true);f.contactReport.push({type:'ankle-carry',weight:w,error:goal.distanceTo(c.node.getWorldPosition(new V()))});p.fingers[c.hand].forEach(n=>n.rotation.x=-1.05*w);}
 const constraints=physical?[]:[...(f.contacts||[]),...(f.strikes||[])];
 // Paired grips must not cross left/right hands through the victim's chest.
 for(const c of constraints){if(c.leg||c.node||!constraints.some(d=>d!==c&&!d.leg&&d.where===c.where&&d.hand!==c.hand))continue;
  const node=c.where==='head'?f.enemy.head:f.enemy.torso,local=node.worldToLocal(p.arms[c.hand].getWorldPosition(new V()));
  if(c.where==='head'){c.node=node;c.offset=[Math.sign(local.x)*.20,.12,.22];c.side=0;}
  else{c.x=Math.sign(local.x)*Math.max(.15,Math.abs(c.x||.15));}
 }
 // Solve reach on the final blended pose, not only on the pre-blend authored pose.
 const finalPass=f.reachAt===f.t,previousFeet=p.feet.map(n=>n.getWorldPosition(new V())),previousRoot=p.root.position.clone();
 const rate=(f.frameDt||1/60)*60;let budget=(f.enemy.boss?(finalPass?.16:.24):(finalPass?.12:.18))*rate;
 for(let pass=0;pass<(finalPass?3:5);pass++){
  const offset=new V();let count=0;p.root.updateMatrixWorld(true);
  for(const c of constraints){if(c.weight<.15)continue;const goal=targetOf(f,c),upper=c.leg?p.legs[c.hand]:p.arms[c.hand],lower=c.leg?p.shins[c.hand]:p.forearms[c.hand],end=c.leg?p.feet[c.hand]:p.hands[c.hand],d=goal.sub(upper.getWorldPosition(new V())),reach=(lower.position.length()+(c.knee?0:end.position.length()))*p.root.scale.y*(c.knee?1:.94);
   if(d.length()>reach||c.knee){offset.addScaledVector(d,(d.length()-reach)/d.length()*THREE.MathUtils.smoothstep(c.weight,.15,.85));count++;}}
  if(count){offset.divideScalar(count);offset.clampLength(0,Math.min(budget,(finalPass?.08:.18)*rate));budget=Math.max(0,budget-offset.length());p.root.position.x+=offset.x;p.root.position.z+=offset.z;p.rig.position.y+=clamp(offset.y,-.12,.24)/p.root.scale.y;p.root.updateMatrixWorld(true);}
 }
 if(finalPass&&p.rig.position.y<.2&&p.root.position.y<.2&&previousRoot.distanceTo(p.root.position)<.25){for(let i=0;i<2;i++)if(!constraints.some(c=>c.leg&&c.hand===i&&c.weight>.2))solveChain(p,p.legs[i],p.shins[i],p.feet[i],previousFeet[i],1,true,i);}
 separateCores(f,p);f.reachAt=f.t;
 for(const c of constraints){if(c.weight<=0)continue;const goal=targetOf(f,c),normal=c.side?f.side.clone().multiplyScalar(Math.sign(c.side)):c.node? p.root.position.clone().add(new V(0,1.5,0)).sub(goal).normalize():new V(0,0,Math.sign(c.z||1)).applyQuaternion(f.enemy.torso.getWorldQuaternion(new Q()));if(c.knee){const upper=p.legs[c.hand],v=upper.parent.worldToLocal(goal.clone()).sub(upper.position).normalize(),q=new Q().setFromUnitVectors(p.shins[c.hand].position.clone().normalize(),v);upper.quaternion.slerp(q,c.weight);p.root.updateMatrixWorld(true);}else aimContact(p,c.hand,goal,normal,clamp(c.weight,0,1),!!c.leg);const actual=c.knee?p.shins[c.hand].getWorldPosition(new V()):c.leg?p.feet[c.hand].localToWorld(toe.clone()):palmPoint(p,c.hand);f.contactReport.push({type:c.knee?'knee-contact':c.leg?'foot-contact':'palm-contact',weight:c.weight,error:actual.distanceTo(goal),goal:goal.toArray(),actual:actual.toArray(),hand:c.hand});}
 if(finalPass){
  const current=[];for(let k=0;k<4;k++){const leg=k>1,i=k%2,end=leg?p.feet[i]:p.hands[i],lower=leg?p.shins[i]:p.forearms[i],goal=end.getWorldPosition(new V()),old=f.finalEndpoints?.[k];
   const locked=constraints.some(c=>!!c.leg===leg&&c.hand===i&&c.weight>.9)||(!leg&&((f.drag?.hand===i&&f.drag.weight>.1)||(f.carryVictim?.hand===i&&f.carryVictim.weight>.1)));
   if(old&&!locked&&old.distanceTo(goal)>.3*rate){const limited=old.clone().add(goal.clone().sub(old).clampLength(0,.3*rate)),q=end.getWorldQuaternion(new Q());solveChain(p,leg?p.legs[i]:p.arms[i],lower,end,limited,1,leg,i);end.quaternion.copy(lower.getWorldQuaternion(new Q()).invert().multiply(q));p.root.updateMatrixWorld(true);}current.push(end.getWorldPosition(new V()));
  }f.finalEndpoints=current;
 }
 if(physical)separateCores(f,p);
}
// Short strike windows coincide with the execution's authored hit beats.
export function addStrikeContacts(f,u){const pulse=(t,w=.07)=>1-THREE.MathUtils.smoothstep(Math.abs(u-t)/w,.25,1),map={
 'crown-of-ruin':[[.24,1,false,'chest',.04],[.64,1,true,'head',.09]],
 'hells-guillotine':[[.23,0,true,'chest'],[.655,1,true,'head',.04]],
 'tyrants-verdict':[[.77,1,true,'chest',.035]],
 'furnace-heart':[[.73,1,true,'chest',.03]],
 'ashen-cross':[[.25,0,false,'chest'],[.49,1,false,'chest']],
 'pyre-king':[[.22,1,true,'chest']],
 'infernal-pillar':[[.70,0,false,'head',.065],[.70,1,false,'head',.065]],
 'wraith-procession':[[.78,1,false,'chest',.13]]
 };for(const [t,hand,leg,where,width]of map[f.def.id]||[]){const weight=pulse(t,width);if(weight>0)f.strikes.push({hand,leg,where,weight,surface:true,knee:(f.def.id==='hells-guillotine'&&t===.23)||f.def.id==='tyrants-verdict'});}}
