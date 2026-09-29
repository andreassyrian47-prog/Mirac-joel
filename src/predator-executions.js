import * as THREE from 'three';
const V=THREE.Vector3,S=THREE.MathUtils.smoothstep;
export const PREDATOR_IDS=new Set(['grave-driver','hells-guillotine','furnace-heart','gravity-coffin','soul-sever']);
// Whole-body keys, including support leg and off-hand. Grips and releases below
// remain on the director's clock; these are not additive arm flails.
export const PREDATOR_POSES={
 sweepLoad:{hy:-.32,T:[.43,-.48,-.15],A0:[-.55,0,-.55],A1:[.15,0,.75],L0:[-.45,0,-.18],K0:[.85,0,0],L1:[-.65,0,.38],K1:[1.1,0,0]},
 sweepThrough:{hy:-.37,T:[.45,.42,.08],A0:[-.7,0,-.65],A1:[.4,0,.65],L1:[-.55,0,-1.05],K1:[.10,0,0],K0:[.95,0,0]},
 anklePick:{hy:-.46,T:[.66,-.10,-.12],A0:[-.7,0,-.46],E0:[-.12,0,0],A1:[.25,0,.6],L0:[-.72,0,-.25],L1:[-.4,0,.22],K0:[1.12,0,0],K1:[.8,0,0]},
 sideHoist:{hy:-.15,T:[-.14,-.16,-.12],A0:[-1.35,0,-1.10],E0:[-.18,0,0],A1:[-.30,0,.65],K0:[.42,0,0],K1:[.38,0,0]},
 sideCrown:{hy:.005,T:[-.22,-.22,-.08],A0:[-2.45,0,-.82],E0:[-.20,0,0],A1:[-.3,0,.85],K0:[.20,0,0],K1:[.15,0,0]},
 sideCast:{hy:-.27,T:[.65,.35,.12],A0:[-.5,0,-.65],E0:[-.14,0,0],A1:[.4,0,.7],K0:[.72,0,0],K1:[.6,0,0]},
 prone:{B:[-1.48,0,0],T:[.10,0,0],HD:[.12,0,0],A0:[.2,0,-.75],A1:[.1,0,.8],E0:[-.75,0,0],E1:[-.45,0,0],L0:[-.15,0,-.13],L1:[.16,0,.18],K0:[.28,0,0],K1:[.52,0,0]},
 ankleAir:{B:[-.15,0,-1.55],T:[.10,0,0],HD:[.18,0,0],A0:[.2,0,-.4],A1:[.35,0,.55],L0:[-.12,0,-.10],L1:[-.24,0,.24],K0:[.15,0,0],K1:[.55,0,0]},
 ankleInverted:{B:[-.15,0,-2.65],T:[.14,0,.08],A0:[-.3,0,-.7],A1:[.2,0,.6],L0:[-.08,0,-.10],L1:[-.30,0,.20],K0:[.13,0,0],K1:[.48,0,0]},
 kneeDrive:{hy:-.24,T:[-.32,.18,-.12],A0:[-1.2,0,-.35],A1:[-.5,0,.55],L0:[-1.4,0,-.12],K0:[1.6,0,0],K1:[.20,0,0]},
 headControl:{hy:-.24,T:[.28,-.12,0],A0:[-1.3,0,-.25],E0:[-.2,0,0],A1:[-.4,0,.6],K0:[.55,0,0],K1:[.65,0,0]},
 heelCrown:{hy:-.08,T:[-.18,.12,-.10],A0:[-.5,0,-.8],A1:[-.35,0,.95],L1:[-2.45,0,.12],K1:[.16,0,0],L0:[-.10,0,-.10],K0:[.22,0,0]},
 axeDown:{hy:-.16,T:[.26,.2,-.08],A0:[.12,0,-.65],A1:[-.6,0,.70],L1:[-1.48,0,-.05],K1:[.12,0,0],K0:[.36,0,0]},
 kneelHeld:{hy:-.52,T:[.44,0,.06],HD:[.2,0,0],A0:[-.5,0,-.5],A1:[-.4,0,.6],L0:[-.55,0,-.12],L1:[-.48,0,.15],K0:[1.5,0,0],K1:[1.45,0,0]},
 brandHold:{hy:-.08,T:[.18,.22,0],A1:[-1.40,0,.12],E1:[-.15,0,0],A0:[-.40,0,-.5],K0:[.24,0,0],K1:[.32,0,0]},
 kickChamber:{hy:-.06,T:[-.14,-.24,-.10],A0:[-.7,0,-.5],A1:[.16,0,.65],E1:[-1.0,0,0],L1:[-1.30,0,.14],K1:[1.8,0,0],K0:[.24,0,0]},
 brandKick:{hy:-.025,T:[-.18,.25,-.12],A0:[-.4,0,-.75],A1:[.2,0,.7],L1:[-1.72,0,-.06],K1:[.08,0,0],K0:[.20,0,0]},
 burnBrace:{hy:-.12,T:[-.20,.05,.08],HD:[.21,0,.12],A0:[-.95,0,-.25],A1:[-.9,0,.25],E0:[-1.2,0,0],E1:[-1.3,0,0],K0:[.42,0,0],K1:[.32,0,0]},
 cageOpen:{hy:-.08,T:[-.09,-.14,0],HD:[-.12,0,0],A0:[-1.65,0,-.9],A1:[-1.55,0,.95],E0:[-.3,0,0],E1:[-.45,0,0]},
 cageClose:{hy:-.14,T:[.12,.1,0],HD:[-.12,0,0],A0:[-1.45,0,.25],A1:[-1.45,0,-.25],E0:[-.85,0,0],E1:[-.85,0,0],K0:[.45,0,0],K1:[.40,0,0]},
 coffinFold:{hy:-.20,B:[-.7,0,.20],T:[.46,0,0],HD:[.28,0,0],A0:[-1.5,0,.3],A1:[-1.5,0,-.3],E0:[-1.4,0,0],E1:[-1.4,0,0],L0:[-1.35,0,-.15],L1:[-1.25,0,.15],K0:[1.7,0,0],K1:[1.7,0,0]},
 soulDraw:{hy:-.13,T:[-.12,-.4,-.08],A1:[-.55,-.25,.7],E1:[-1.4,0,0],A0:[-1.1,0,-.3],E0:[-.6,0,0],K0:[.3,0,0],K1:[.4,0,0]},
 soulSever:{hy:-.16,T:[.15,.55,.06],A0:[-.75,.35,-1.1],E0:[-.15,0,0],A1:[-.25,-.2,.9],E1:[-.4,0,0],K0:[.38,0,0],K1:[.42,0,0]}
};
const strike=(f,u,t,hand,where,leg=false,width=.045)=>{const weight=Math.max(0,1-Math.abs(u-t)/width);if(weight)f.strikes.push({hand,where,leg,weight});};
export function predatorExecution(f,u,h,body){
 const {player:p,at,contact,event,showRing,emit,beam,pose}=h,e=f.enemy,I=f.def.impact,C=e.boss?1.6:1.34;
 const id=f.def.id;
 if(id==='grave-driver'){
  p.root.position.copy(at(f,.20*S(u,.23,.34),0,C));
  body(p,[[0,'ready'],[.12,'sweepLoad'],[.20,'sweepThrough'],[.29,'anklePick'],[.39,'anklePick'],[.51,'sideHoist'],[.61,'sideCrown'],[.64,'sideCrown'],[.72,'sideCast'],[I+.07,'recover'],[1,'ready']],u);
  body(e,[[0,'ready'],[.20,'fold'],[.29,'prone'],[.40,'prone'],[.52,'ankleAir'],[.64,'ankleInverted'],[1,'ankleInverted']],u);
  e.rig.position.y=.18*S(u,.20,.28);
  const sweepWeight=Math.max(0,1-Math.abs(u-.20)/.04);if(sweepWeight)f.strikes.push({hand:1,leg:true,node:e.shins[0],weight:sweepWeight});
  // Preserve the solved ankle/knee at pickup: switching controllers must not
  // snap the leg back to its pre-IK pose and teleport the entire carried body.
  if(u>=.40&&u<.53&&f.pickupLegPose){[e.legs[0],e.shins[0]].forEach((n,i)=>n.quaternion.slerpQuaternions(f.pickupLegPose[i],n.quaternion.clone(),S(u,.40,.53)));}
  // Grounded pickup -> carried ankle -> release. The controllers never compete.
  if(u>.29&&u<.40)f.drag={hand:0,leg:0,weight:S(u,.29,.34)};
  if(u>=.40&&u<.65)f.carryVictim={hand:0,node:e.feet[0],weight:1};
  event(f,'sweep',u,.20,'hit','floor');event(f,'cast',u,.67,'dash');
 }else if(id==='hells-guillotine'){
  p.root.position.addScaledVector(f.side,.32*S(u,.25,.47)+.30*S(u,.73,.90));
  p.root.position.addScaledVector(f.front,-(e.boss?.50:.40)*S(u,.12,.18)*(1-S(u,.22,.30)));
  body(p,[[0,'ready'],[.13,'load'],[.20,'kneeDrive'],[.29,'headControl'],[.44,'headControl'],[.57,'heelCrown'],[.62,'heelCrown'],[.67,'axeDown'],[.75,'drive'],[.88,'recover'],[1,'ready']],u);
  body(e,[[0,'ready'],[.20,'fold'],[.30,'kneelHeld'],[.65,'kneelHeld'],[.72,'fold'],[1,'turn']],u);
  const kneeWeight=Math.max(0,1-Math.abs(u-.20)/.05);if(kneeWeight)f.strikes.push({hand:0,leg:true,knee:true,node:e.torso,offset:[0,.12,.42],weight:kneeWeight});
  contact(f,0,'head',S(u,.25,.31)*(1-S(u,.43,.49)),0,.30);
  strike(f,u,.67,1,'head',true,.045);
  event(f,'knee',u,.20);event(f,'heel',u,.67,'hit','head');
 }else if(id==='furnace-heart'){
  body(p,[[0,'ready'],[.14,'coil'],[.23,'brandHold'],[.39,'brandHold'],[.48,'coil'],[.59,'kickChamber'],[.69,'kickChamber'],[.75,'brandKick'],[.80,'brandKick'],[.87,'kickChamber'],[1,'ready']],u);
  body(e,[[0,'ready'],[.23,'hit'],[.35,'burnBrace'],[.68,'burnBrace'],[.76,'hit'],[1,'turn']],u);
  contact(f,1,'chest',S(u,.15,.22)*(1-S(u,.39,.45)),0,.42);
  p.rig.position.y=e.boss?.18*S(u,.55,.65)*(1-S(u,.82,.91)):0;
  strike(f,u,.75,1,'chest',true,.042);
  e.root.updateMatrixWorld(true);
  if(u>.23&&u<I){const mark=e.torso.localToWorld(new V(0,.18,.43)),m=f.props[0];m.visible=true;m.position.copy(mark);m.quaternion.copy(e.torso.getWorldQuaternion(new THREE.Quaternion()));m.scale.setScalar(.19+.17*S(u,.25,.69));emit(f,mark,2,.65);}
  event(f,'brand',u,.23);event(f,'ignite',u,.44,'pulse');event(f,'kick',u,.75);
 }else if(id==='gravity-coffin'){
  p.root.position.addScaledVector(f.front,.65*S(u,.26,.44));
  body(p,[[0,'ready'],[.18,'load'],[.30,'cageOpen'],[.40,'cageOpen'],[.46,'cageClose'],[.53,'cageOpen'],[.59,'cageClose'],[.65,'hammer'],[.72,'hammer'],[I,'drive'],[I+.08,'recover'],[1,'ready']],u);
  body(e,[[0,'ready'],[.30,'air'],[.40,'air'],[.46,'coffinFold'],[.53,'air'],[.59,'coffinFold'],[.66,'coffinFold'],[1,'coffinFold']],u);
  e.root.position.y=.06+2.05*S(u,.20,.39);e.root.position.addScaledVector(f.front,-.4*S(u,.23,.39));
  e.root.updateMatrixWorld(true);const center=e.hips.getWorldPosition(new V()).lerp(e.head.getWorldPosition(new V()),.4),box=f.props[0];
  const squeeze=Math.sin(Math.PI*S(u,.40,.51))*.19+S(u,.54,.60)*.25;
  if(u>.24&&u<I){box.visible=true;box.position.copy(center);box.rotation.set(0,Math.atan2(f.front.x,f.front.z),0);box.scale.set(1-squeeze,1-squeeze*.7,1-squeeze);for(let i=1;i<4;i++)showRing(f,i,center,.93-squeeze,i*Math.PI/3);}
  event(f,'rise',u,.30,'pulse');event(f,'compress-one',u,.46);event(f,'compress-two',u,.59);event(f,'command',u,.72,'dash');
 }else if(id==='soul-sever'){
  const draw=S(u,.30,.65),snap=S(u,.76,.84);
  p.root.position.addScaledVector(f.front,.5*draw);p.root.position.addScaledVector(f.side,.25*draw);
  body(p,[[0,'ready'],[.13,'coil'],[.22,'reach'],[.29,'reach'],[.47,'soulDraw'],[.66,'soulDraw'],[.73,'coil'],[.79,'soulSever'],[.87,'soulSever'],[1,'ready']],u);
  body(e,[[0,'ready'],[.22,'hit'],[.43,'fold'],[.65,'kneelHeld'],[1,'kneelHeld']],u);
  contact(f,1,'chest',S(u,.14,.21)*(1-S(u,.28,.33)),0,.42);
  const g=f.ghosts[0];if(g&&u>.28&&u<.85){
   pose(g,f.t,0,{type:'aerial',t:0,duration:1});g.rig.position.set(0,0,0);
   body(g,[[0,'ready'],[.29,'hit'],[.49,'air'],[.75,'air'],[1,'fold']],u);
   g.root.visible=true;g.root.rotation.y=e.root.rotation.y;g.root.position.copy(at(f,-1.8*draw,.06+.4*draw,-.15*draw));g.root.scale.copy(f.victimScale).multiply(new V(1-.84*snap,1+.12*snap,1-.84*snap));g.spectralFade=1-snap;
   g.root.updateMatrixWorld(true);p.root.updateMatrixWorld(true);e.root.updateMatrixWorld(true);
   const soul=g.torso.getWorldPosition(new V());if(f.emit&&u<.79){beam(e.torso.getWorldPosition(new V()),soul,f.color,.022,.085);beam(p.hands[1].getWorldPosition(new V()),soul,f.color,.032,.085);}
  }
  event(f,'hook',u,.22);event(f,'draw',u,.48,'pulse');event(f,'sever',u,.79,'pulse');
 }
}
