import * as THREE from 'three';
const {clamp,lerp,damp,smoothstep}=THREE.MathUtils,TAU=Math.PI*2;
const V=THREE.Vector3;
const ease=u=>{u=clamp(u,0,1);return u*u*(3-2*u)};
const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

// Distance-driven, two-support locomotion. Authored attacks/executions retain their
// own controller. This module never changes the gameplay root or strike clock.
export function locomotionEligible(r,m){return m.request.kind==='locomotion'&&!r.dead&&!r.physicalBody&&!r.rise&&!r.airborne&&!r.tk&&!r.airHold&&!r.broken&&!r.guardActive&&!(r.landTime>0)&&!(r.stagger>0&&!r.motionPassive);}
export function strideParameters(r,m){
 const scale=r.root.scale.y,local=m.localVelocity,speed=Math.hypot(local.x,local.z);
 const run=smoothstep(speed/scale,2.65,6.5),move=smoothstep(speed,.08,1.1);
 const lateral=clamp(Math.abs(local.x)/Math.max(.2,Math.hypot(local.x,local.z)),0,1),back=clamp(-local.z/Math.max(.2,speed),0,1);
 let cycle=(lerp(1.18,1.78,clamp(speed/3,0,1))+run*2.12)*scale*(1-lateral*.22-back*.12);
 let stance=lerp(.62,.30,run)*(1-lateral*.12);
 const sidestep=smoothstep(speed/scale,1,4);cycle=lerp(cycle,lerp(1.55,2.60,sidestep)*scale,lateral);stance=lerp(stance,lerp(.62,.34,sidestep),lateral);
 stance=Math.min(stance,(1.20+.14*run)*(scale/1.2)/cycle);
 return {scale,speed,run,move,lateral,back,cycle,stance};
}
export function prepareLocomotion(r,m,dt,travel){
 if(!locomotionEligible(r,m)){
  if(m.strideActive&&!m.request.manual)for(const f of m.feet)if(f.lastActual){if(f.planted){f.mode='stance';f.anchor=f.lastActual.clone();f.anchor.y=.13*r.root.scale.y;}else{f.mode='settle';f.start=f.lastActual.clone();f.end=f.lastActual.clone();f.catchTime=0;f.catchDuration=.13;}}
  m.strideActive=false;return false;
 }
 const g=strideParameters(r,m);if(m.gaitProfile&&m.strideActive){g.cycle=damp(m.gaitProfile.cycle,g.cycle,12,dt);g.stance=damp(m.gaitProfile.stance,g.stance,16,dt);}m.gaitProfile=g;
 if(!m.strideActive){m.supportPelvis=m.previous?.H?.p.y??r.hips.position.y;m.feet=m.feet.map(f=>({lastActual:f.lastActual?.clone()}));m.strideActive=true;}
 const moving=travel>.0005;
 if(moving&&!m.strideMoving)m.phase=.25*TAU;
 m.strideMoving=moving;
 if(moving)m.phase+=travel/g.cycle*TAU;
 m.bodyMove=damp(m.bodyMove||0,g.move,14,dt);m.bodyRun=damp(m.bodyRun||0,g.run,10,dt);
 const forwardDrive=clamp(m.localVelocity.z/Math.max(.2,g.speed),-1,1);
 const p=m.phase,run=m.bodyRun,w=m.bodyMove,breath=Math.sin(m.age*1.6+m.seed),combat=r.motionCombat?1:0;
 const ready=damp(m.ready||0,combat,5,dt);m.ready=ready;
 const feral=r.small?1.3:r.stalker?.8:0,prowl=(1-run)*w,load=Math.sin(p-.35);
 const support=(m.feet[1]?.planted?1:0)-(m.feet[0]?.planted?1:0);
 m.weightTransfer=damp(m.weightTransfer||0,support*(.038*(1-run)+.015*run),12,dt);
 const headQuiet=1-smoothstep(Math.abs(m.turn),.1,1.5);
 // The support leg carries a tall pelvis. Do not subtract a permanent crouch
 // and then subtract a second IK correction; that kept both knees flexed all cycle.
 r.hips.position.set(Math.sin(m.age*.48+m.seed)*.009*(1-w)+m.weightTransfer*w,
  m.supportPelvis??(r.baseHip+.004-ready*.02),-.012*(1-w));
 r.hips.rotation.set(.008,Math.cos(p)*.075*w*forwardDrive,load*.040*w+.008*breath*(1-w));
 r.spine.rotation.set(.007*breath,-Math.cos(p-.12)*.052*w*forwardDrive,-load*.014*w);
 r.torso.rotation.set(.018+ready*.045+w*(.080+run*.045)*forwardDrive+feral*.11,-.035*(1-w)-Math.cos(p-.18)*.115*w*forwardDrive,-load*.012*w);
 r.neck.rotation.set(-.015-w*run*.06*forwardDrive,Math.sin(m.age*.37+m.seed)*.028*(1-w)-r.torso.rotation.y*.45,0);
 r.head.rotation.set(.008*breath+.028*prowl,-r.hips.rotation.y*.24+headQuiet*(1-w)*(Math.sin(m.age*.57+m.seed)*.024+Math.sin(m.age*1.07)*.012),load*.009*w);
 r.torso.scale.set(1+breath*.003*(1-w),1+breath*.005,1+breath*.007);
 for(let i=0;i<2;i++){
  const side=i?1:-1,ph=p+i*Math.PI,drive=Math.cos(ph+.08)*w*forwardDrive;
  r.arms[i].rotation.set(lerp(.015-ready*(i?.28:.40),-.04-(i?.015:.11)*(1-run)+drive*lerp(.34,.78,run),w),-side*.10,side*(.11+ready*.08+run*.025+prowl*.045));
  r.forearms[i].rotation.set(-.16-ready*.55-w*(.10+run*1.20)+prowl*(i?.04:.10)-Math.max(0,-drive)*.12,-side*.35,side*.018);
  r.hands[i].rotation.set(.035-run*.10+prowl*.055,-side*(.38+prowl*.14),side*.02);
  r.fingers?.[i]?.forEach((f,j)=>{f.rotation.x=-.16-j*.02-ready*.2-run*.55-prowl*(.15+j*.018);f.rotation.z=(j-1.5)*.03;});
 }
 if(r.caster||r.spectral){
  r.hips.position.y=r.baseHip-.025;r.torso.rotation.x=.12;
  r.legs.forEach((n,i)=>n.rotation.set(-.12-(i?.06:.14)-Math.sin(m.age*1.5+i)*.04,0,(i?1:-1)*.05));
  r.shins.forEach((n,i)=>n.rotation.set(i?.32:.52,0,0));r.feet.forEach(n=>n.rotation.set(.22,0,0));
  r.arms.forEach((n,i)=>n.rotation.z=(i?1:-1)*(.24+Math.sin(m.age*1.4+i)*.035));
 }
 return true;
}

export function groundStride(r,m,dt,solveFoot){
 if(!m.strideActive||!locomotionEligible(r,m))return false;
 if(r.caster||r.spectral||r.root.position.y>.3||r.rig.position.y>.22||Math.abs(r.rig.rotation.x)>.45)return true;
 const g=m.gaitProfile,{scale,stance,run,move}=g,velocity=m.velocity.clone().setY(0),speed=velocity.length();
 const dir=velocity.clone();if(speed>.08)dir.divideScalar(speed);else dir.set(Math.sin(r.root.rotation.y),0,Math.cos(r.root.rotation.y));
 const right=new V(Math.cos(r.root.rotation.y),0,-Math.sin(r.root.rotation.y));
 const forward=new V(Math.sin(r.root.rotation.y),0,Math.cos(r.root.rotation.y));
 const active=speed>.12,goals=[];
 r.root.updateMatrixWorld(true);
 for(let i=0;i<2;i++){
  const side=i?1:-1,f=m.feet[i],ph=((m.phase/TAU+i*.5)%1+1)%1;
  const yaw=r.root.rotation.y+side*(.075+.045*(1-run))*(1-run*.8);
  const home=r.root.position.clone().addScaledVector(right,side*(.225+g.lateral*.035+(1-run)*.035*move)*scale).addScaledVector(forward,((i?-.075:.075)*(1-move)+side*g.lateral*.15)*scale);home.y=.13*scale;
  let goal,roll=0;
  if(!f.anchor){f.anchor=(f.lastActual||home).clone();f.anchor.y=.13*scale;f.yaw=yaw;f.mode='stance';f.planted=true;
   if(f.lastActual&&(f.lastActual.y>home.y+.06||f.lastActual.distanceTo(home)>.12*scale)){f.mode='settle';f.start=f.lastActual.clone();f.end=home.clone();f.catchTime=0;}
  }
  if(active&&f.mode!=='settle'){
   if(f.mode!=='stride'){f.mode='stride';f.phase=ph;f.swingBegin=ph>=stance?ph:stance;f.start=(f.lastActual||f.anchor).clone();f.end=home.clone();f.inSwing=ph>=stance;}
   if(ph<f.phase){f.anchor=(f.end||home).clone();f.anchor.y=.13*scale;f.yaw=yaw;f.inSwing=false;f.swingBegin=stance;}
   // Release an overextended support foot early rather than dragging its IK
   // target under the pelvis during a sharp direction change.
   const behind=f.anchor.clone().sub(home),crossing=behind.dot(right)*side<-.50*scale;
   if(!f.inSwing&&(ph>=stance||behind.length()>.78*scale||crossing)){
    f.inSwing=true;f.start=(f.lastActual||f.anchor).clone();f.swingBegin=ph;
   }
   if(!f.inSwing){
    goal=f.anchor.clone();f.planted=true;
    const q=ph/stance;roll=lerp(-.025,-.12,run)*(1-ease(q/.18))+lerp(.26,.48,run)*ease((q-.55)/.45);
    r.toes[i].rotation.x=-.3*ease((q-.6)/.4);
   }else{
    const u=clamp((ph-f.swingBegin)/Math.max(.08,1-f.swingBegin),0,1),remaining=(1-ph)*g.cycle/Math.max(.3,speed);
    const lead=Math.min(g.cycle*stance*lerp(.47,.40,run),lerp(.51,.46,run)*scale);
    const landing=home.clone().addScaledVector(velocity,remaining).addScaledVector(dir,lead);
    // Freeze the final approach; continually chasing a changing future endpoint
    // in the last frames used to make the ankle vibrate at touchdown.
    if(u<.82||!f.end)f.end=landing;
    const swing=ease(u);
    goal=f.start.clone().lerp(f.end,swing);
    // In a run the heel recovers BEHIND the body, before the leg passes
    // underneath. A symmetric high arc produced a marching knee lift instead.
    const heel=u<.30?Math.sin(u/.30*Math.PI/2):Math.cos((u-.30)/.70*Math.PI/2);
    const clearance=lerp(Math.pow(Math.sin(Math.PI*u),1.5)*.068,Math.pow(Math.max(0,heel),2.2)*.48,run)+g.lateral*.08*Math.sin(Math.PI*u);
    goal.y=lerp(f.start.y,.13*scale,ease(u))+clearance*scale;
    roll=lerp(.20,-.08,ease(u))-Math.sin(Math.PI*u)*.13;f.planted=false;
   }
   f.phase=ph;
  }else{
   if(f.mode==='stride'){f.mode='settle';f.start=(f.lastActual||f.anchor).clone();f.end=home.clone();f.catchTime=0;}
   const needsStep=f.anchor.distanceTo(home)>.19*scale||Math.abs(angle(yaw,f.yaw))>.38;
   if(f.mode==='stance'&&needsStep&&m.feet[1-i].mode!=='settle'){f.mode='settle';f.start=(f.lastActual||f.anchor).clone();f.end=home.clone();f.catchTime=0;}
   if(f.mode==='settle'){
    f.end.copy(home);f.catchTime+=dt;const u=clamp(f.catchTime/.20,0,1);
    goal=f.start.clone().lerp(f.end,ease(u));goal.y=lerp(f.start.y,home.y,ease(u))+Math.sin(Math.PI*u)*.075*scale;
    f.planted=false;if(u>=1){f.anchor=f.end.clone();f.mode='stance';f.yaw=yaw;f.planted=true;}
   }else{goal=f.anchor.clone();f.planted=true;}
  }
  goal.y+=Math.abs(Math.sin(roll))*.28*scale;
  f.goal=goal;goals.push({goal,roll,yaw:f.planted?f.yaw:yaw});
 }
 // Couple pelvis height to stance geometry. The support knee loads and
 // extends; it no longer remains in a crouch beneath an independent body bob.
 r.root.updateMatrixWorld(true);
 const pelvis=r.hips.getWorldPosition(new V());let supportTarget=Infinity,supportLimit=Infinity,supports=0;
 for(let i=0;i<2;i++){
  if(!m.feet[i].planted)continue;
  const hip=r.legs[i].getWorldPosition(new V()),goal=goals[i].goal;
  const length=(r.shins[i].position.length()+r.feet[i].position.length())*scale;
  const horizontal=Math.hypot(hip.x-goal.x,hip.z-goal.z);
  const ph=((m.phase/TAU+i*.5)%1+1)%1,q=clamp(ph/stance,0,1);
  const load=Math.sin(Math.PI*clamp(q/.72,0,1));
  const extension=active?lerp(.990-.009*load,.991-.052*load,run):.993;
  const heightFor=extension=>{
   const vertical=Math.sqrt(Math.max(.01,(length*extension)**2-horizontal**2));
   const world=pelvis.clone();world.y=goal.y+vertical-(hip.y-pelvis.y);
   return r.hips.parent.worldToLocal(world).y;
  };
  supportTarget=Math.min(supportTarget,heightFor(extension));supportLimit=Math.min(supportLimit,heightFor(.997));supports++;
 }
 let target;
 if(!active){target=Math.min(r.baseHip+.004-(m.ready||0)*.02,supportLimit);}
 else if(supports){target=supportTarget;m.lastSupportHeight=target;}
 else{
  const half=((m.phase/TAU)% .5+.5)%.5,u=clamp((half-stance)/Math.max(.05,.5-stance),0,1);
  target=lerp(m.lastSupportHeight??(r.baseHip-.09),r.baseHip-.10,ease(u))+Math.sin(Math.PI*u)*.036;
 }
 target=clamp(target,r.baseHip-.22,r.baseHip+.10);
 m.supportPelvis=damp(m.supportPelvis??target,target,28,dt);
 // A contact may limit upward travel, but never lowers the hips a second time.
 m.supportPelvis=Math.min(m.supportPelvis,supportLimit);
 r.hips.position.y=m.supportPelvis;
 for(let i=0;i<2;i++)solveFoot(r,i,goals[i].goal,goals[i].roll,goals[i].yaw,1);
 return true;
}

// Bone-local clavicle motion and distal claw articulation work for locomotion,
// attacks, casts and enemies. Strong paired-execution contacts keep their origins.
export function articulateDetails(r,m,dt,manual=false){
 for(let i=0;i<2;i++){
  const a=r.arms[i],side=i?1:-1;
  if(!a.userData.bindPosition)a.userData.bindPosition=a.position.clone();
  if(!manual){const raise=clamp(-a.rotation.x/2.6,0,1),reach=clamp(-r.forearms[i].rotation.x/2,0,1);
   a.position.copy(a.userData.bindPosition);a.position.y+=raise*.025;a.position.z+=raise*.022-reach*.012;
  }else a.position.copy(a.userData.bindPosition);
  r.fingers?.[i]?.forEach((f,j)=>{const bone=f.userData.distal;if(bone)bone.rotation.x=f.rotation.x*.6-.04;});
 }
 if(r.hips.userData.clothDrive)r.hips.userData.clothDrive.value.set(clamp(m.localVelocity.z*.025,-.18,.22),clamp(m.localVelocity.x*.025,-.16,.16));
}
