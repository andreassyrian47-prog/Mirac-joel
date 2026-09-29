import * as THREE from 'three';
import {releasePhase,STRIKE_ENDINGS} from './execution-impact.js';
import {rememberBody,startBody,stepBody,releaseAnatomy} from './physical.js';
import {impactWall} from './gravitas.js';
const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const smooth=(t,a,b)=>{const x=clamp((t-a)/(b-a),0,1);return x*x*x*(x*(x*6-15)+10);};
const envelope=(t,a,b)=>t<=a||t>=b?0:Math.sin(Math.PI*(t-a)/(b-a));
// Hand-tuned beat locations; no random phase changes or universal idle poses during holds.
const beats={
 'kingbreaker':[.16,.56,0,'grapple'],'throne-of-cinders':[.17,.65,1,'turn'],'sovereigns-ruin':[.17,.56,0,'ritual'],
 'soulbreaker':[.19,.64,0,'grapple'],'grave-driver':[.24,.54,1,'grapple'],'crown-of-ruin':[.24,.62,1,'aerial'],
 'hells-guillotine':[.23,.64,0,'aerial'],'tyrants-verdict':[.22,.46,0,'grapple'],'furnace-heart':[.25,.69,1,'strike'],
 'cinder-spiral':[.18,.78,1,'turn'],'infernal-pillar':[.21,.64,1,'aerial'],'meteor-burial':[.22,.54,0,'aerial'],
 'ashen-cross':[.25,.49,0,'strike'],'pyre-king':[.22,.46,1,'ritual'],'mindbreaker':[.29,.56,0,'grapple'],
 'gravity-coffin':[.33,.6,0,'ritual'],'orbit-of-ruin':[.24,.58,1,'turn'],'heavens-rejection':[.23,.52,1,'ritual'],
 'rift-fold':[.29,.62,0,'ritual'],'wraith-procession':[.25,.53,1,'strike'],'soul-sever':[.24,.4,1,'grapple'],
 'pale-requiem':[.22,.49,0,'ritual'],'tomb-of-echoes':[.29,.58,0,'ritual']
};
export function cinematicBody(f,p,dt,obstacles=[]){
 const e=f.enemy,u=clamp(f.t/f.def.duration,0,1),I=f.def.impact;
 const releaseU=releasePhase(f.def),strike=STRIKE_ENDINGS.has(f.def.id),holding=(f.drag?.weight||0)>.12||(f.carryVictim?.weight||0)>.12;
 // Capture a real articulated pose and release once. Do not rotate or ease a
 // physics body back onto an animation track on subsequent frames.
 if(e.physicalBody||(u>=releaseU&&!holding)){
  if(!e.physicalBody){
   e.root.updateMatrixWorld(true);const held=releaseAnatomy(e),h=held?.height??Math.max(.4,Math.min(e.hips.getWorldPosition(new THREE.Vector3()).y,e.neck.getWorldPosition(new THREE.Vector3()).y)),releaseCenter=held?.center??e.root.position;
   const remaining=Math.max(.06,impactWall(f.def)-(f.clock??f.t));const impulse=releaseCenter.clone().sub(p.root.position).setY(0).normalize().multiplyScalar(strike?6:f.def.id==='rack-and-ruin'?4:.6);impulse.y=strike?-2:-Math.min(38,Math.max(7,(h-.25)/remaining+3.2));
   const away=p.root.position.clone().sub(releaseCenter).setY(0).normalize();const spin=new THREE.Vector3(-away.z,0,away.x).multiplyScalar(h>1?6.5:.35);startBody(e,impulse,true,.18,spin);f.releaseClock=f.clock??f.t;
  }
  stepBody(e,dt,obstacles);
 }
 f.physicalPhase=e.physicalBody?'physical release':u<.23?'anticipation':u<I-.15?'control':'commit';
}

export function correctReach(f,p,dt){
 if(f.drag?.weight>.2||!f.contacts?.length||f.t/f.def.duration>=f.def.impact)return;
 p.root.updateMatrixWorld(true);f.enemy.root.updateMatrixWorld(true);const offset=new THREE.Vector3();let count=0;
 for(const c of f.contacts){if(c.weight<.8)continue;const e=f.enemy,goal=c.node?c.node.getWorldPosition(new THREE.Vector3()):c.where==='head'?e.head.getWorldPosition(new THREE.Vector3()):e.torso.localToWorld(new THREE.Vector3(c.x||0,.47,c.z??.22));if(c.side)goal.addScaledVector(f.side,c.side);
  const shoulder=p.arms[c.hand].getWorldPosition(new THREE.Vector3()),d=goal.sub(shoulder),length=d.length(),reach=(p.forearms[c.hand].position.length()+p.hands[c.hand].position.length())*p.root.scale.y*.96;
  if(length>reach){offset.addScaledVector(d,(length-reach)/length);count++;}
 }
 if(count){offset.divideScalar(count);offset.x=clamp(offset.x,-.42,.42);offset.z=clamp(offset.z,-.42,.42);offset.y=clamp(offset.y,-.08,f.enemy.boss?.7:.32);p.root.position.x+=offset.x;p.root.position.z+=offset.z;p.rig.position.y+=offset.y/p.root.scale.y;p.root.updateMatrixWorld(true);}
}
export const CINEMATIC_BEATS=beats;
