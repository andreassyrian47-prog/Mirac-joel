import * as THREE from 'three';
import FOOTPRINTS from './execution-footprints.json' with {type:'json'};
const V=THREE.Vector3;
function segmentClear(a,b,obstacles,radius){const line=new THREE.Line3(a.clone().setY(0),b.clone().setY(0));return obstacles.every(o=>{const p=new V(o.x,0,o.z),near=a.distanceToSquared(b)<1e-10?a:line.closestPointToPoint(p,true,new V());return near.distanceTo(p)>o.r+radius;});}
export function stageClear(plan,def,boss,obstacles){
 const points=FOOTPRINTS[def.id+(boss?':boss':'')]||FOOTPRINTS[def.id]||[[0,0,5]];
 return points.every(([x,z,r])=>{const p=plan.origin.clone().addScaledVector(plan.side,x).addScaledVector(plan.front,z);if(Math.hypot(p.x,p.z)+r+.35>84)return false;return obstacles.every(o=>Math.hypot(p.x-o.x,p.z-o.z)>o.r+r+.35);});
}
// Rehearsed full-body footprints, not just two root circles. Search rotates the
// whole choreography in one shared frame; any relocation is bounded to 2.4m.
export function planExecution(def,actor,victim,boss,obstacles){
 const natural=actor.clone().sub(victim).setY(0);if(natural.lengthSq()<.001)natural.set(0,0,1);natural.normalize();const initialYaw=Math.atan2(natural.x,natural.z);let best=null;
 for(const radius of [0,.8,1.6,2.4])for(let shift=0;shift<(radius?12:1);shift++){
  const origin=victim.clone().setY(.06);if(radius)origin.add(new V(Math.sin(shift*Math.PI/6)*radius,0,Math.cos(shift*Math.PI/6)*radius));
  if(!segmentClear(victim,origin,obstacles,boss?.85:.5))continue;
  for(const turn of [0,.35,-.35,.7,-.7,1.05,-1.05,1.57,-1.57,2.35,-2.35,Math.PI]){
   const angle=initialYaw+turn,front=new V(Math.sin(angle),0,Math.cos(angle)),side=new V(front.z,0,-front.x),entry=origin.clone().addScaledVector(front,2.4);
   const cost=radius*3+Math.abs(turn)*.7+actor.distanceTo(entry)*.2;if(best&&cost>=best.cost)continue;if(!segmentClear(actor,entry,obstacles,.52))continue;const separation=new THREE.Line3(actor.clone().sub(victim),entry.clone().sub(origin)),closest=separation.start.distanceToSquared(separation.end)<1e-10?separation.start:separation.closestPointToPoint(new V(),true,new V());if(closest.length()+.02<Math.min(separation.start.length(),boss?1.65:1.35))continue;const plan={origin,front,side,entry,turn,relocation:radius};if(!stageClear(plan,def,boss,obstacles))continue;
   best={...plan,cost};
  }
  if(best&&best.cost<.05)return best;
 }
 return best;
}
export function stagingSnapshot(f){return f?.entry?{elapsed:f.entry.t,duration:f.entry.duration,active:!f.entry.done,relocation:f.entry.plan.relocation,rotation:f.entry.plan.turn,origin:f.origin.toArray(),actorEntry:f.entry.plan.entry.toArray()}:null;}
