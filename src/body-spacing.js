import * as THREE from 'three';
const V=THREE.Vector3,Q=THREE.Quaternion;
// Oriented solid-core proxies, excluding hands and feet that are allowed to touch.
// Ellipsoids fit the chest depth rather than treating broad shoulders as a sphere.
export function coreVolumes(r){r.root.updateMatrixWorld(true);const s=r.root.scale.y;return [[r.hips,[0,.02,0],[.36,.29,.29]],[r.torso,[0,.15,0],[.30,.29,.30]],[r.torso,[0,.5,.03],[.48,.35,.36]],[r.head,[0,.12,.01],[.25,.31,.26]]].map(([n,p,axes])=>({p:n.localToWorld(new V(...p)),axes:axes.map(v=>v*s),q:n.getWorldQuaternion(new Q()).invert()}));}
function legs(r){const s=r.root.scale.y;r.root.updateMatrixWorld(true);return [...r.legs.map(n=>({n,y:-.22,axes:[.17,.25,.17]})),...r.shins.map(n=>({n,y:-.25,axes:[.135,.25,.14]}))].map(({n,y,axes})=>({p:n.localToWorld(new V(0,y,0)),axes:axes.map(v=>v*s),q:n.getWorldQuaternion(new Q()).invert(),lower:true}));}
function collisionVolumes(r,lower){return lower?[...coreVolumes(r),...legs(r)]:coreVolumes(r);}
function support(a,d){const n=d.clone().applyQuaternion(a.q);return Math.hypot(n.x*a.axes[0],n.y*a.axes[1],n.z*a.axes[2]);}
export function bodyOverlap(a,b){let max=0;const lower=!!b.physicalBody,aa=collisionVolumes(a,lower),bb=collisionVolumes(b,lower);for(const x of aa)for(const y of bb){const d=x.p.clone().sub(y.p),length=d.length();if(length<.001){max=Math.max(max,.5);continue;}d.divideScalar(length);max=Math.max(max,support(x,d)+support(y,d)-length);}return max;}
export function separateCores(f,p){const e=f.enemy;
 if(!e.physicalBody&&f.carryVictim?.weight>.05){const node=f.carryVictim.node,anchor=node.getWorldPosition(new V()),q=e.rig.quaternion.clone(),position=e.root.position.clone(),axis=f.side.clone().applyQuaternion(e.root.getWorldQuaternion(new Q()).invert());let best=null;
 for(const tilt of [f.carryTilt||0,0,.3,-.3,.6,-.6,.9,-.9,1.2,-1.2,1.5,-1.5]){e.rig.quaternion.copy(q).premultiply(new Q().setFromAxisAngle(axis,tilt));e.root.position.copy(position);e.root.updateMatrixWorld(true);e.root.position.add(anchor.clone().sub(node.getWorldPosition(new V())));e.root.updateMatrixWorld(true);const overlap=bodyOverlap(p,e),cost=overlap*100+Math.abs(tilt)*.025+Math.abs(tilt-(f.carryTilt||0))*.02;if(!best||cost<best.cost)best={tilt,cost,position:e.root.position.clone(),q:e.rig.quaternion.clone()};}
 e.root.position.copy(best.position);e.rig.quaternion.copy(best.q);e.root.updateMatrixWorld(true);f.carryTilt=best.tilt;f.corePenetration=bodyOverlap(p,e);return;
 }let moved=0;for(let pass=0;pass<9;pass++){
 let strongest=null;const lower=e.physicalBody?1:(!(f.drag?.weight>.05)&&!(f.carryVictim?.weight>.05)?THREE.MathUtils.smoothstep(Math.abs(e.rig.rotation.x),.7,1.3):0),aa=collisionVolumes(p,lower),bb=collisionVolumes(e,lower);for(const a of aa)for(const b of bb){const d=a.p.clone().sub(b.p),length=d.length(),n=length>.001?d.clone().divideScalar(length):f.front.clone(),r=support(a,n)+support(b,n)+.01;if(Math.abs(d.y)>=r)continue;const h=Math.hypot(d.x,d.z),needed=Math.sqrt(r*r-d.y*d.y)-h;if(needed>.003&&(!strongest||needed>strongest.needed)){d.y=0;if(h<.001)d.copy(f.front);else d.divideScalar(h);strongest={d,needed,weight:a.lower||b.lower?lower:1};}}
 if(!strongest)break;const amount=Math.min(strongest.needed*strongest.weight,.28);p.root.position.addScaledVector(strongest.d,amount);moved+=amount;p.root.updateMatrixWorld(true);
 }f.corePenetration=bodyOverlap(p,e);f.coreCorrection=(f.coreCorrection||0)+moved;
}
