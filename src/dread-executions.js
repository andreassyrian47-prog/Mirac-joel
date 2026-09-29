import * as THREE from 'three';
import {curve} from './motion.js';
const V=THREE.Vector3,S=THREE.MathUtils.smoothstep;
export const DREAD_FINISHERS=[
 {id:'ashen-dominion',name:'Ashen Dominion',school:'brutal',bossOnly:true,bespoke:true,duration:6.8,impact:.91,release:.935,marks:[0,.24,.44,.59,.76,.88],beats:['Two crushing blows','Collar leap','Pin the fallen king','First ground hammer','Second ground hammer','Break the crown'],description:'Strike the king twice, leap onto his collar, force him flat, pin his upper body and deliver two downward hammers before tearing away the crown.',signature:'New boss execution. Six authored beats, a grounded hold and an explicit final release.'},
 {id:'grave-stamp',name:'Grave Stamp',school:'brutal',smallOnly:true,bespoke:true,duration:3.15,impact:.82,release:.80,marks:[0,.24,.48,.70],beats:['Low crushing sweep','Step beside the body','Load the heel','Grave stamp'],description:'Sweep a Midget Fiend down, step clear of its body, lift the heel and drive a brutal grounded stamp through its guard.',signature:'Midget-exclusive. The support foot stays outside the fallen body.'},
 {id:'rack-and-ruin',name:'Rack and Ruin',school:'brutal',smallOnly:true,bespoke:true,duration:3.7,impact:.82,release:.73,marks:[0,.22,.43,.64,.78],beats:['Collar capture','Hoist the fiend','Horn clash','Twisting cast','Ruinous landing'],description:'Clamp the short fiend at the collar, haul it upward, drive in the horned brow and twist it away into a hard physical landing.',signature:'Midget-exclusive. A two-handed collar hold becomes a fast, outward cast.'}
];
const rest={hy:0,B:[0,0,0],T:[.05,0,0],A0:[-.35,0,-.25],A1:[-.35,0,.25],E0:[-.65,0,0],E1:[-.65,0,0],L0:[-.08,0,-.12],L1:[-.08,0,.12],K0:[.25,0,0],K1:[.25,0,0],HD:[0,0,0]};
const poses={
 ready:{},coil:{hy:-.14,T:[.16,-.45,-.07],A1:[.35,0,.5],E1:[-1.45,0,0],A0:[-.85,0,-.35]},
 cross:{hy:-.08,T:[.22,.4,.04],A1:[-1.5,0,-.1],E1:[-.1,0,0]},
 backhand:{hy:-.08,T:[.2,-.48,-.05],A0:[-1.4,0,.12],E0:[-.1,0,0],A1:[-.4,0,.55]},
 crouch:{hy:-.36,T:[.48,0,0],K0:[1.05,0,0],K1:[.95,0,0],A0:[-.9,0,-.4],A1:[-.9,0,.4]},
 seize:{hy:-.24,T:[.32,0,0],A0:[-1.4,0,-.3],A1:[-1.4,0,.3],E0:[-.25,0,0],E1:[-.25,0,0],K0:[.65,0,0],K1:[.65,0,0]},
 leap:{hy:-.10,T:[.28,0,0],A0:[-1.75,0,-.4],A1:[-1.7,0,.4],L0:[-1.1,0,-.2],L1:[-.75,0,.2],K0:[1.6,0,0],K1:[1.2,0,0]},
 pin:{hy:-.59,T:[.94,0,0],A0:[-.4,0,-.25],A1:[-.5,0,.3],E0:[-.12,0,0],E1:[-.2,0,0],L0:[-.8,0,-.25],L1:[-.65,0,.25],K0:[1.5,0,0],K1:[1.2,0,0]},
 groundLoad:{hy:-.51,T:[.48,-.23,0],A0:[-.95,0,-.4],A1:[-2.35,0,.5],E0:[-.15,0,0],E1:[-1.15,0,0],L0:[-.7,0,-.2],K0:[1.45,0,0],K1:[1.2,0,0]},
 groundHit:{hy:-.63,T:[1.05,.25,.08],A0:[-.4,0,-.35],A1:[-.25,0,.1],E0:[-.2,0,0],E1:[-.1,0,0],L0:[-.8,0,-.2],K0:[1.55,0,0],K1:[1.25,0,0]},
 rip:{hy:-.30,T:[-.15,-.5,-.10],A0:[-1.4,0,-.55],A1:[-1.8,0,.9],E0:[-1.1,0,0],E1:[-1.25,0,0],K0:[.8,0,0],K1:[.65,0,0]},
 release:{hy:-.1,T:[.2,.48,.08],A0:[-.4,0,-.65],A1:[-.5,0,1.1],E1:[-.15,0,0]},
 victimHit:{hy:-.10,T:[-.25,0,.13],HD:[.25,0,-.12],A0:[-.4,0,-.6],A1:[-.25,0,.65]},
 victimFold:{hy:-.35,T:[.55,0,0],HD:[.2,0,0],A0:[-.7,0,-.4],A1:[-.7,0,.4],L0:[-.55,0,-.12],L1:[-.45,0,.12],K0:[1.15,0,0],K1:[1.1,0,0]},
 prone:{B:[-1.48,0,.03],T:[.05,0,0],HD:[.08,0,0],A0:[.15,0,-.70],A1:[.3,0,.7],E0:[-.75,0,0],E1:[-.4,0,0],L0:[-.16,0,-.1],L1:[.12,0,.13],K0:[.3,0,0],K1:[.48,0,0]},
 proneHit:{B:[-1.48,0,.03],hy:-.06,T:[.15,0,.05],HD:[.26,0,0],A0:[-.12,0,-.85],A1:[-.15,0,.8],E0:[-.4,0,0],E1:[-.2,0,0],L0:[-.3,0,-.1],K0:[.65,0,0],K1:[.45,0,0]},
 sweep:{hy:-.30,T:[.35,.45,.10],L1:[-.5,0,-1.0],K1:[.15,0,0],K0:[.8,0,0],A0:[-.5,0,-.65],A1:[.4,0,.6]},
 stampLoad:{hy:-.09,T:[-.13,-.20,-.1],L1:[-1.35,0,.16],K1:[1.75,0,0],K0:[.35,0,0],A0:[-.55,0,-.65],A1:[-.7,0,.5]},
 stampHit:{hy:-.3,T:[.65,.25,.06],L1:[.18,0,.10],K1:[.4,0,0],K0:[.7,0,0],A0:[.15,0,-.55],A1:[.35,0,.45]},
 hoist:{hy:-.04,T:[-.14,0,0],A0:[-1.95,0,-.25],A1:[-1.95,0,.25],E0:[-.7,0,0],E1:[-.7,0,0]},
 headbutt:{hy:-.14,T:[.50,0,0],HD:[.26,0,0],A0:[-1.45,0,-.25],A1:[-1.45,0,.25],E0:[-1.0,0,0],E1:[-1.0,0,0]},
 air:{B:[-.18,0,.12],T:[-.15,0,0],A0:[-.6,0,-.8],A1:[-.4,0,.7],L0:[-.6,0,-.1],L1:[-.35,0,.15],K0:[1.1,0,0],K1:[.8,0,0]},
 cast:{hy:-.25,T:[.6,.6,.12],A0:[-.6,0,-.6],A1:[-.5,0,.7],E0:[-.15,0,0],E1:[-.15,0,0],K0:[.7,0,0],K1:[.5,0,0]}
};
function body(r,frames,u){const map={B:r.rig,T:r.torso,A0:r.arms[0],A1:r.arms[1],E0:r.forearms[0],E1:r.forearms[1],L0:r.legs[0],L1:r.legs[1],K0:r.shins[0],K1:r.shins[1],HD:r.head};for(const[k,v]of Object.entries(rest)){const val=n=>poses[n][k]??v;if(k==='hy')r.hips.position.y=r.baseHip+curve(frames.map(([t,n])=>[t,val(n)]),u);else map[k].rotation.set(...[0,1,2].map(i=>curve(frames.map(([t,n])=>[t,val(n)[i]]),u)));}}
const weight=(u,t,w=.035)=>1-S(Math.abs(u-t),w*.25,w);
export function dreadChoreography(f,u,h){
 if(!f.def.bespoke)return false;
 const{player:p,at,contact,event}=h,e=f.enemy,id=f.def.id,facing=Math.atan2(f.front.x,f.front.z);
 f.reworked=true;p.root.position.copy(at(f,0,0,e.boss?1.55:1.3));p.root.rotation.y=facing+Math.PI;e.root.position.copy(f.origin);e.root.rotation.y=facing;
 if(id==='ashen-dominion'){
  body(p,[[0,'ready'],[.08,'coil'],[.13,'cross'],[.18,'coil'],[.22,'backhand'],[.28,'crouch'],[.34,'leap'],[.40,'seize'],[.48,'pin'],[.55,'groundLoad'],[.60,'groundHit'],[.67,'groundLoad'],[.74,'groundHit'],[.82,'pin'],[.88,'rip'],[.93,'release'],[1,'ready']],u);
  body(e,[[0,'ready'],[.13,'victimHit'],[.17,'ready'],[.22,'victimFold'],[.36,'victimFold'],[.47,'prone'],[.58,'prone'],[.60,'proneHit'],[.66,'prone'],[.74,'proneHit'],[.81,'prone'],[1,'prone']],u);
  const down=S(u,.35,.47);e.hips.position.y-=.40*(1-down);e.rig.position.y=.20*down;
  p.root.position.y=.06+.9*S(u,.28,.34)*(1-S(u,.36,.45));
  contact(f,1,'chest',weight(u,.13,.037),.1,.42);contact(f,0,'chest',weight(u,.22,.038),-.1,.42);
  if(u>.31&&u<.41)for(let i=0;i<2;i++)contact(f,i,'head',S(u,.31,.35)*(1-S(u,.38,.41)),0,.3,i?.18:-.18);
  e.root.updateMatrixWorld(true);const torso=e.torso.localToWorld(new V(0,.40,.25));
  const beside=at(f,1.35,0,-2.6);
  const shift=S(u,.36,.51);p.root.position.copy(at(f,curve([[0,0],[.33,0],[.42,1.85],[.51,1.35],[1,1.35]],u),.9*S(u,.28,.34)*(1-S(u,.36,.47)),curve([[0,1.55],[.35,1.55],[.42,.3],[.51,-2.6],[.75,-2.6],[.84,-3.65],[1,-3.65]],u)));p.root.rotation.y=facing+Math.PI+Math.PI*.5*shift;
  if(u>.48&&u<.80){const held=S(u,.48,.53)*(1-S(u,.77,.80));f.contacts.push({hand:0,node:e.torso,offset:[.40,.28,.24],weight:held});}
  for(const t of [.60,.74])f.strikes.push({hand:1,node:e.torso,offset:[.40,.55,.26],weight:weight(u,t,.035)});
  if(u>.83&&u<.885)f.contacts.push({hand:1,node:e.head,offset:[.18,.12,.1],weight:S(u,.83,.847)*(1-S(u,.869,.885))});
  event(f,'left-torso',u,.13);event(f,'right-torso',u,.22);event(f,'collar',u,.35,'pulse');event(f,'knockdown',u,.47,'hit','floor');event(f,'hammer-one',u,.60);event(f,'hammer-two',u,.74);event(f,'crown-break',u,.885,'sever','head');
 }else if(id==='grave-stamp'){
  body(p,[[0,'ready'],[.13,'crouch'],[.22,'sweep'],[.33,'ready'],[.48,'ready'],[.58,'stampLoad'],[.72,'stampLoad'],[.79,'stampHit'],[.88,'stampHit'],[1,'ready']],u);
  body(e,[[0,'ready'],[.22,'victimFold'],[.34,'prone'],[.78,'prone'],[.81,'proneHit'],[1,'proneHit']],u);e.rig.position.y=.12*S(u,.22,.34);
  f.strikes.push({hand:1,leg:true,node:e.shins[0],weight:weight(u,.22,.04)});
  e.root.updateMatrixWorld(true);const goal=e.torso.localToWorld(new V(0,.45,.22)),beside=goal.clone().addScaledVector(f.side,1.03);beside.y=.06;
  const step=S(u,.34,.49);p.root.position.lerp(beside,step);p.root.rotation.y=facing+Math.PI+Math.PI*.5*step;
  f.strikes.push({hand:1,leg:true,node:e.torso,offset:[0,.45,.26],weight:weight(u,.785,.04)});
  event(f,'sweep',u,.22,'hit','floor');event(f,'stamp',u,.79,'hit','floor');
 }else{
  body(p,[[0,'ready'],[.13,'crouch'],[.23,'seize'],[.34,'seize'],[.47,'hoist'],[.56,'hoist'],[.615,'headbutt'],[.66,'hoist'],[.72,'rip'],[.79,'cast'],[.88,'cast'],[1,'ready']],u);
  body(e,[[0,'ready'],[.23,'victimFold'],[.45,'air'],[.57,'air'],[.615,'victimHit'],[.70,'air'],[1,'air']],u);
  e.root.position.y=.06+1.40*S(u,.27,.48);e.root.position.addScaledVector(f.side,-.7*S(u,.65,.73));e.rig.rotation.z=-.6*S(u,.66,.74);
  const grip=S(u,.17,.24)*(1-S(u,.65,.72));for(let i=0;i<2;i++)contact(f,i,'head',grip,0,.25,i?.12:-.12);
  p.root.position.addScaledVector(f.side,.28*S(u,.65,.77));
  event(f,'capture',u,.24,'pulse');event(f,'horns',u,.615,'hit','head');event(f,'cast',u,.73,'dash');
 }
 p.root.position.lerp(f.actorStart,1-S(u,0,.12));
 return true;
}
