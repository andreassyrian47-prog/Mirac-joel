import * as THREE from 'three';
const clamp=THREE.MathUtils.clamp,V=THREE.Vector3,Q=THREE.Quaternion;
const remembered=new WeakMap(),bodies=new WeakMap();
const limbNodes=r=>[r.hips,r.neck,...r.arms,...r.forearms,...r.hands,...r.legs,...r.shins,...r.feet];
export function massOf(r){return r.boss?6:r.elite?1.85:1;}
export function rememberBody(r,dt){if(dt<=0||bodies.has(r))return;r.root.updateMatrixWorld(true);const points=limbNodes(r).map(n=>n.getWorldPosition(new V()));points.push(r.head.localToWorld(new V(0,.28,0)));const old=remembered.get(r);remembered.set(r,{points,hipWorld:r.hips.getWorldQuaternion(new Q()),spine:r.spine.quaternion.clone(),torso:r.torso.quaternion.clone(),torsoScale:r.torso.scale.clone(),neck:r.neck.quaternion.clone(),head:r.head.quaternion.clone(),velocity:points.map((p,i)=>old?p.clone().sub(old.points[i]).divideScalar(dt).clampLength(0,22):new V())});}
// The last final/contact-solved pose is also the source of release impulses.
// Choreography may have reset its root before the physics handoff.
export function releaseAnatomy(r){const h=remembered.get(r);if(!h)return null;return {height:Math.max(.4,Math.min(h.points[0].y,h.points[1].y)),center:h.points[0].clone().lerp(h.points[1],.5)};}
export function clearBody(r){bodies.delete(r);remembered.delete(r);r.physicalBody=false;}
export function bodyInfo(r){const b=bodies.get(r);return b?{age:b.age,particles:b.p.map(p=>p.x.toArray()),maxError:Math.max(...b.links.filter(c=>!c.range).map(c=>Math.abs(b.p[c.a].x.distanceTo(b.p[c.b].x)-c.length))),energy:b.p.reduce((s,p)=>s+p.x.distanceToSquared(p.old),0)}:null;}
function basis(points){const right=points[3].x.clone().sub(points[2].x).normalize(),up=points[1].x.clone().sub(points[0].x).normalize(),forward=new V().crossVectors(right,up).normalize();up.crossVectors(forward,right).normalize();return new Q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,forward));}
export function startBody(r,impulse=new V(),violent=false,inherit=null,spin=null){
 if(bodies.has(r))return;r.root.updateMatrixWorld(true);const history=remembered.get(r),nodes=limbNodes(r),useHistory=violent&&history,points=useHistory?history.points.map(p=>p.clone()):nodes.map(n=>n.getWorldPosition(new V()));if(!useHistory)points.push(r.head.localToWorld(new V(0,.28,0)));
 const radii=[.25,.21,.19,.19,.14,.14,.12,.12,.19,.19,.16,.16,.14,.14,.25],weights=[.42,.6,.65,.65,1,1,1.4,1.4,.6,.6,1,1,1.2,1.2,.85];
 const center=points[0].clone().lerp(points[1],.5);
 const p=points.map((x,i)=>{const velocity=(history?.velocity[i]||new V()).clone().multiplyScalar(inherit??(violent?.72:.7)).add(impulse);if(spin)velocity.add(new V().crossVectors(spin,x.clone().sub(center)));if(i===1||i===14)velocity.add(new V(0,0,-.65).applyQuaternion(r.root.quaternion));return {x:x.clone(),old:x.clone().addScaledVector(velocity,-1/120),radius:radii[i]*r.root.scale.y,w:weights[i]};});
 const links=[],add=(a,b,range=null)=>links.push({a,b,length:p[a].x.distanceTo(p[b].x),range});
 const torso=[0,1,2,3,8,9];for(let i=0;i<torso.length;i++)for(let j=i+1;j<torso.length;j++)add(torso[i],torso[j]);
 for(const [a,b]of [[2,4],[4,6],[3,5],[5,7],[8,10],[10,12],[9,11],[11,13],[1,14]])add(a,b);
 for(const [a,b,c]of [[2,4,6],[3,5,7],[8,10,12],[9,11,13]]){const sum=p[a].x.distanceTo(p[b].x)+p[b].x.distanceTo(p[c].x);add(a,c,[sum*.28,sum*.97]);}
 add(2,14,[.2*r.root.scale.y,.9*r.root.scale.y]);add(3,14,[.2*r.root.scale.y,.9*r.root.scale.y]);
 const b={p,links,age:0,accumulator:0,initialBasis:basis(p).invert(),hipWorld:useHistory?history.hipWorld:r.hips.getWorldQuaternion(new Q()),spine:useHistory?history.spine:r.spine.quaternion.clone(),torso:useHistory?history.torso:r.torso.quaternion.clone(),torsoScale:useHistory?history.torsoScale:r.torso.scale.clone(),neck:useHistory?history.neck:r.neck.quaternion.clone(),head:useHistory?history.head:r.head.quaternion.clone()};bodies.set(r,b);r.physicalBody=true;
}
function project(b,obstacles){
 for(let iter=0;iter<9;iter++){
  for(const c of b.links){const a=b.p[c.a],d=b.p[c.b],v=d.x.clone().sub(a.x),length=v.length();if(length<1e-7)continue;const rest=c.range?clamp(length,...c.range):c.length,error=(length-rest)/length;if(!error)continue;v.multiplyScalar(error/(a.w+d.w));a.x.addScaledVector(v,a.w);d.x.addScaledVector(v,-d.w);}
  const sepWeight=Math.min(1,b.age/.2);for(const [i,j]of [[6,0],[7,0],[6,14],[7,14],[10,11],[12,13]]){const a=b.p[i],c=b.p[j],d=c.x.clone().sub(a.x),len=d.length(),min=(a.radius+c.radius)*.82;if(len>1e-5&&len<min){d.multiplyScalar((min-len)/len*.5*sepWeight);a.x.sub(d);c.x.add(d);}}
  for(const p of b.p){if(p.x.y<p.radius){const vx=p.x.x-p.old.x,vz=p.x.z-p.old.z;p.x.y=p.radius;p.old.y=p.radius-Math.min(.035,Math.max(0,p.old.y-p.x.y)*.12);p.old.x=p.x.x-vx*.94;p.old.z=p.x.z-vz*.94;}
   for(const o of obstacles){if(p.x.y>(o.h||18))continue;const dx=p.x.x-o.x,dz=p.x.z-o.z,dist=Math.hypot(dx,dz),radius=o.r+p.radius;if(dist<radius&&dist>.0001){p.x.x=o.x+dx/dist*radius;p.x.z=o.z+dz/dist*radius;}}
   const rr=Math.hypot(p.x.x,p.x.z);if(rr>84)p.x.multiply(new V(84/rr,1,84/rr));
  }
 }
}
function pointBone(node,child,target){node.updateWorldMatrix(true,false);const local=node.parent.worldToLocal(target.clone()).sub(node.position);if(local.lengthSq()<1e-8)return;node.quaternion.setFromUnitVectors(child.position.clone().normalize(),local.normalize());node.updateWorldMatrix(false,true);}
function applyBody(r,b){
 const p=b.p;r.root.position.set(p[0].x.x,.06,p[0].x.z);r.rig.position.set(0,0,0);r.rig.rotation.set(0,0,0);r.root.updateMatrixWorld(true);
 r.hips.position.copy(r.rig.worldToLocal(p[0].x.clone()));const world=basis(p).multiply(b.initialBasis).multiply(b.hipWorld);r.hips.quaternion.copy(r.rig.getWorldQuaternion(new Q()).invert().multiply(world));r.spine.quaternion.copy(b.spine);r.torso.quaternion.copy(b.torso);r.torso.scale.copy(b.torsoScale);r.neck.quaternion.copy(b.neck);r.head.quaternion.copy(b.head);r.root.updateMatrixWorld(true);
 for(let i=0;i<2;i++){pointBone(r.arms[i],r.forearms[i],p[4+i].x);pointBone(r.forearms[i],r.hands[i],p[6+i].x);pointBone(r.legs[i],r.shins[i],p[10+i].x);pointBone(r.shins[i],r.feet[i],p[12+i].x);r.hands[i].rotation.x=.12*Math.exp(-b.age*3)*Math.sin(b.age*13+i);r.fingers?.[i]?.forEach((f,j)=>{f.rotation.x=-.12-j*.025;if(f.userData.distal)f.userData.distal.rotation.x=f.rotation.x*.6-.04;});}
 const neckTarget=r.head.parent.worldToLocal(p[14].x.clone()).sub(r.head.position);if(neckTarget.lengthSq()>.001)r.head.quaternion.setFromUnitVectors(new V(0,1,0),neckTarget.normalize());r.root.updateMatrixWorld(true);
}
export function stepBody(r,dt,obstacles=[]){const b=bodies.get(r);if(!b)return false;b.accumulator+=Math.min(.05,Math.max(0,dt));while(b.accumulator>=1/120){b.accumulator-=1/120;b.age+=1/120;for(const p of b.p){const previous=p.x.clone(),v=p.x.clone().sub(p.old).multiplyScalar(.997);p.x.add(v);p.x.y-=36/14400;p.old.copy(previous);}project(b,obstacles);}applyBody(r,b);return true;}
// Momentum is integrated in small steps, projected against the same cylinder set as the world.
export function stepMomentum(r,dt,obstacles,onWall){const v=r.kb;if(!v)return;r.wallGrace=Math.max(0,(r.wallGrace||0)-dt);const n=Math.max(1,Math.ceil(v.length()*dt/.22)),h=dt/n,radius=r.boss?.82:r.elite?.61:.48;let impact=0;
 for(let i=0;i<n;i++){r.root.position.addScaledVector(v,h);for(const o of obstacles){if(r.root.position.y>(o.h||18))continue;const dx=r.root.position.x-o.x,dz=r.root.position.z-o.z,d=Math.hypot(dx,dz),rr=o.r+radius;if(d<rr&&d>.001){const normal=new V(dx/d,0,dz/d),speed=-v.dot(normal);r.root.position.x=o.x+normal.x*rr;r.root.position.z=o.z+normal.z*rr;if(speed>0){v.addScaledVector(normal,speed*1.18);impact=Math.max(impact,speed);}}}}
 v.multiplyScalar(Math.exp(-dt*(r.airborne?1.65:5.2)));if(impact>5.5&&r.wallGrace<=0){r.wallGrace=.55;onWall?.(impact);}
}
export function dynamicPose(r,dt){
 if(r.airborne||r.tk>0||r.airHold>0){const rising=clamp((r.vy||0)/10,-1,1),fall=Math.max(0,-rising),side=(r.kb?.x||0)*Math.cos(r.root.rotation.y)-(r.kb?.z||0)*Math.sin(r.root.rotation.y);r.rig.rotation.x+=.2*rising-.24*fall;r.rig.rotation.z+=clamp(side*.035,-.3,.3);r.spine.rotation.x-=.12*rising;r.head.rotation.x+=.2*fall;
  for(let i=0;i<2;i++){r.legs[i].rotation.x=-.65+(i?.22:0)+fall*.32;r.shins[i].rotation.x=1.05+(i?-.3:0)-fall*.32;r.arms[i].rotation.x=-.35-fall*.5;r.arms[i].rotation.z=(i?1:-1)*(.6+fall*.28);r.forearms[i].rotation.x=-.75+fall*.3;}}
 if(r.landTime>0){r.landTime=Math.max(0,r.landTime-dt);const u=r.landTime/.38,w=Math.sin(Math.PI*Math.sqrt(u))*(r.landStrength||1);r.hips.position.y-=w*.33;r.torso.rotation.x+=w*.42;r.neck.rotation.x-=w*.2;r.arms.forEach(a=>a.rotation.x-=w*.3);}
}

export function kickBody(r,source,strength=6,up=1){const b=bodies.get(r);if(!b)return;const direction=r.root.position.clone().sub(source).setY(0).normalize().multiplyScalar(strength/massOf(r));direction.y=up;for(const p of b.p)p.old.addScaledVector(direction,-1/120);}
