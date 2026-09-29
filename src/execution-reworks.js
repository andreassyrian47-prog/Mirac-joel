import * as THREE from 'three';
import {curve} from './motion.js';
import {PREDATOR_IDS,PREDATOR_POSES,predatorExecution} from './predator-executions.js';
const V=THREE.Vector3,S=THREE.MathUtils.smoothstep;
const rest={hy:0,B:[0,0,0],T:[.04,0,0],HD:[0,0,0],A0:[-.35,0,-.22],A1:[-.35,0,.22],E0:[-.75,0,0],E1:[-.75,0,0],L0:[-.06,0,-.08],L1:[-.06,0,.08],K0:[.18,0,0],K1:[.18,0,0]};
const P={...PREDATOR_POSES,
 ready:{},coil:{hy:-.16,T:[.14,-.5,-.07],A1:[.3,0,.5],E1:[-1.5,0,0],A0:[-.85,0,-.3],K0:[.45,0,0]},
 punch:{hy:-.06,T:[.22,.4,.05],A1:[-1.5,0,-.1],E1:[-.12,0,0],A0:[-.65,0,-.4]},
 run:{hy:-.15,T:[.3,0,-.14],A0:[.45,0,-.3],A1:[-.8,0,.3],L0:[-.6,0,-.1],L1:[.4,0,.1],K1:[.9,0,0]},
 seize:{hy:-.18,T:[.18,0,0],A0:[-1.3,0,-.35],A1:[-1.3,0,.35],E0:[-.45,0,0],E1:[-.45,0,0],K0:[.45,0,0],K1:[.55,0,0]},
 load:{hy:-.30,T:[.35,0,0],A0:[-1.1,0,-.35],A1:[-1.1,0,.35],E0:[-.6,0,0],E1:[-.6,0,0],K0:[.85,0,0],K1:[.7,0,0]},
 lift:{hy:-.04,T:[-.16,0,0],A0:[-2.5,0,-.32],A1:[-2.5,0,.32],E0:[-.18,0,0],E1:[-.18,0,0]},
 hammer:{hy:-.12,T:[-.2,-.12,0],A0:[-2.65,0,-.4],A1:[-2.65,0,.4],E0:[-.7,0,0],E1:[-.7,0,0],K0:[.4,0,0]},
 drive:{hy:-.32,T:[.65,.13,0],A0:[-.45,0,-.4],A1:[-.5,0,.4],E0:[-.16,0,0],E1:[-.16,0,0],K0:[.7,0,0],K1:[.85,0,0]},
 recover:{hy:-.16,T:[.26,.08,0],A0:[-.35,0,-.45],A1:[-.45,0,.45],E0:[-.65,0,0],E1:[-.6,0,0],K0:[.4,0,0],K1:[.45,0,0]},
 reach:{hy:-.10,T:[.14,0,0],A1:[-1.45,0,.2],E1:[-.08,0,0],A0:[-.8,0,-.5]},
 upper:{hy:-.04,T:[-.15,.35,0],A1:[-2.2,0,.12],E1:[-.35,0,0],A0:[-.55,0,-.55]},
 caster:{hy:-.17,T:[-.12,0,0],A0:[-1.75,0,-.65],A1:[-1.85,0,.65],E0:[-.4,0,0],E1:[-.4,0,0],K0:[.4,0,0],K1:[.4,0,0]},
 kick:{hy:-.05,T:[-.14,.25,-.2],A0:[-.5,0,-.8],A1:[-.6,0,.8],L1:[-1.8,0,-.1],K1:[.16,0,0],L0:[-.4,0,-.1],K0:[1.0,0,0]},
 hit:{hy:-.07,T:[-.23,0,.10],HD:[.18,0,-.12],A0:[.1,0,-.5],A1:[.05,0,.6],E0:[-.6,0,0]},
 air:{B:[-.16,0,.07],T:[-.12,0,0],A0:[-.2,0,-.9],A1:[-.3,0,.7],E0:[-.45,0,0],E1:[-.6,0,0],L0:[-.42,0,-.1],L1:[.12,0,.1],K0:[.8,0,0],K1:[.4,0,0]},
 fold:{hy:-.35,T:[.55,0,0],HD:[.24,0,0],A0:[-.55,0,-.6],A1:[-.6,0,.6],L0:[-.6,0,-.1],L1:[-.5,0,.1],K0:[1.15,0,0],K1:[1,0,0]},
 turn:{B:[-.48,0,.1],T:[.14,0,0],A0:[.2,0,-.8],A1:[.3,0,.5],L0:[-.3,0,-.1],L1:[.15,0,.1],K0:[.5,0,0],K1:[.3,0,0]}
};
function body(r,frames,u){const map={B:r.rig,T:r.torso,HD:r.head,A0:r.arms[0],A1:r.arms[1],E0:r.forearms[0],E1:r.forearms[1],L0:r.legs[0],L1:r.legs[1],K0:r.shins[0],K1:r.shins[1]};
 for(const [key,defaultValue]of Object.entries(rest)){const value=(name)=>P[name][key]??defaultValue;if(key==='hy')r.hips.position.y=r.baseHip+curve(frames.map(([t,n])=>[t,value(n)]),u);else map[key].rotation.set(...[0,1,2].map(i=>curve(frames.map(([t,n])=>[t,value(n)[i]]),u)));}
}
const redesigned=new Set(['soulbreaker','infernal-pillar','meteor-burial','crown-of-ruin','mindbreaker','tyrants-verdict',...PREDATOR_IDS]);
export function reworkExecution(f,u,h){
 const id=f.def.id;if(!redesigned.has(id))return false;f.reworked=true;
 const {player:p,at,contact,event,showRing,emit,beam}=h,e=f.enemy,I=f.def.impact,C=e.boss?1.60:1.34;
 const facing=Math.atan2(f.front.x,f.front.z),rise=S(u,.38,.62),release=S(u,I-.13,I),recover=S(u,I+.035,1);
 p.root.position.copy(at(f,0,0,C));e.root.position.copy(f.origin);p.root.rotation.y=facing+Math.PI;e.root.rotation.y=facing;
 if(PREDATOR_IDS.has(id)){predatorExecution(f,u,h,body);}else if(id==='soulbreaker'){
  const dash=S(u,.30,.46),lift=S(u,.51,.67);p.root.position.copy(at(f,Math.sin(dash*Math.PI)*1.9,0,THREE.MathUtils.lerp(C,-1.12,dash)));p.root.rotation.y=facing+Math.PI*(1-dash);
  body(p,[[0,'ready'],[.11,'coil'],[.19,'punch'],[.27,'ready'],[.36,'run'],[.48,'seize'],[.54,'load'],[.67,'lift'],[I-.04,'drive'],[I+.055,'recover'],[1,'ready']],u);
  body(e,[[0,'ready'],[.19,'hit'],[.38,'ready'],[.53,'fold'],[.64,'air'],[1,'turn']],u);
  e.root.position.y=.06+1.25*lift;e.root.position.addScaledVector(f.front,.85*S(u,.63,I));e.rig.rotation.x=.30*lift;
  if(u>.12&&u<.27)contact(f,1,'chest',S(u,.12,.18)*(1-S(u,.22,.27)),0,.42);
  if(u>.45&&u<.66)for(let i=0;i<2;i++)contact(f,i,'chest',S(u,.45,.50)*(1-S(u,.61,.66)),i?.18:-.18,-.42);
  event(f,'chest',u,.19);event(f,'dash',u,.34,'dash');event(f,'grip',u,.52,'pulse');
 }else if(id==='infernal-pillar'){
  body(p,[[0,'ready'],[.12,'coil'],[.22,'reach'],[.34,'upper'],[.48,'caster'],[.64,'hammer'],[I,'drive'],[I+.06,'recover'],[1,'ready']],u);
  body(e,[[0,'ready'],[.22,'hit'],[.40,'air'],[.66,'air'],[1,'turn']],u);
  e.root.position.y=.06+2.3*S(u,.25,.52);e.root.position.addScaledVector(f.front,-.65*S(u,.34,.65));p.root.position.addScaledVector(f.front,.7*S(u,.34,.52));
  contact(f,1,'chest',S(u,.13,.20)*(1-S(u,.23,.28)),.08,.42);
  for(let i=0;i<3;i++){const m=f.props[i];m.visible=u>.24&&u<I;m.position.copy(f.origin).add(new V(0,1.8,0));m.scale.set(1.1-i*.22,4*S(u,.24,.5),1.1-i*.22);m.rotation.y=f.t*(i+1);}
  if(f.emit&&u>.28&&u<I){p.root.updateMatrixWorld(true);e.root.updateMatrixWorld(true);beam(p.hands[1].getWorldPosition(new V()),e.torso.getWorldPosition(new V()),f.color,.065,.08);}
  event(f,'ignite',u,.22);event(f,'column',u,.42,'pulse');event(f,'command',u,I-.09,'pulse');
 }else if(id==='meteor-burial'){
  const jump=S(u,.34,.52)*(1-S(u,.64,I)),travel=S(u,.34,.64),launch=S(u,.21,.46);
  p.root.position.copy(at(f,.8*travel,2.15*jump,C-.9*travel));e.root.position.copy(at(f,.7*travel,.06+2.5*launch,-.6*travel));
  body(p,[[0,'ready'],[.13,'coil'],[.22,'upper'],[.35,'load'],[.51,'seize'],[.61,'hammer'],[I,'drive'],[I+.06,'recover'],[1,'ready']],u);
  body(e,[[0,'ready'],[.22,'hit'],[.40,'air'],[.51,'ready'],[.61,'air'],[1,'turn']],u);
  contact(f,1,'chest',S(u,.14,.2)*(1-S(u,.23,.28)),0,.42);
  if(u>.45&&u<.62)for(let i=0;i<2;i++)contact(f,i,'chest',S(u,.45,.5)*(1-S(u,.57,.62)),i?-.18:.18,.42);
  for(let i=0;i<3;i++){const m=f.props[i];m.visible=u>.35&&u<I;m.position.copy(e.root.position).add(new V(0,1.3,0));m.scale.set(.75-i*.17,2.2+i*.3,.75-i*.17);m.rotation.set(-.7,0,.4);}
  event(f,'launch',u,.22);event(f,'catch',u,.51,'pulse');event(f,'throw',u,.64,'dash');
 }else if(id==='crown-of-ruin'){
  const jump=S(u,.35,.54)*(1-S(u,.65,I));
  body(p,[[0,'ready'],[.14,'coil'],[.24,'upper'],[.36,'load'],[.52,'caster'],[.63,'kick'],[I,'drive'],[I+.06,'recover'],[1,'ready']],u);
  body(e,[[0,'ready'],[.24,'hit'],[.43,'air'],[.63,'air'],[1,'turn']],u);
  e.root.position.y=.06+1.9*S(u,.25,.46);e.root.position.addScaledVector(f.front,-.25*S(u,.40,.66));p.root.position.y=.06+2.15*jump;p.root.position.x+=f.side.x*.35*S(u,.4,.6);p.root.position.z+=f.side.z*.35*S(u,.4,.6);
  contact(f,1,'chest',S(u,.16,.23)*(1-S(u,.25,.29)),0,.42);
  f.strikes.push({hand:1,leg:true,where:'chest',weight:Math.max(0,1-Math.abs(u-.63)/.04)});
  event(f,'uppercut',u,.24);event(f,'heel',u,.63);
 }else if(id==='tyrants-verdict'){
  const turn=S(u,.27,.53),a=turn*Math.PI*.48;p.root.position.copy(at(f,Math.sin(a)*1.8,0,Math.cos(a)*C));p.root.rotation.y=facing+Math.PI+a*.6;
  body(p,[[0,'ready'],[.18,'seize'],[.29,'load'],[.44,'punch'],[.55,'ready'],[.60,'kick'],[.66,'drive'],[I+.04,'recover'],[1,'ready']],u);
  body(e,[[0,'ready'],[.20,'hit'],[.34,'fold'],[.53,'turn'],[1,'turn']],u);e.root.position.addScaledVector(f.side,-.35*turn);e.rig.rotation.x=-1.48*S(u,.36,.54);e.rig.rotation.z=-.18*turn;e.rig.position.y=.12*turn;
  if(u<.35)f.contacts.push({hand:0,node:e.hands[1],weight:S(u,.1,.18)*(1-S(u,.27,.35))});
  if(u>.54){e.root.updateMatrixWorld(true);const goal=e.shins[1].getWorldPosition(new V()),beside=goal.clone().addScaledVector(f.side,1.02);beside.y=.06;p.root.position.lerp(beside,S(u,.54,.60));p.root.rotation.y=Math.atan2(goal.x-p.root.position.x,goal.z-p.root.position.z);}
  f.strikes.push({hand:1,leg:true,node:e.shins[1],weight:Math.max(0,1-Math.abs(u-.65)/.04)});
  event(f,'wrist',u,.20);event(f,'cast',u,.44);event(f,'heel',u,.65);
 }else{
  body(p,[[0,'ready'],[.15,'seize'],[.29,'seize'],[.42,'load'],[.56,'caster'],[.66,'hammer'],[I,'drive'],[I+.06,'recover'],[1,'ready']],u);
  body(e,[[0,'ready'],[.18,'fold'],[.32,'fold'],[.53,'air'],[.65,'air'],[1,'turn']],u);
  e.root.position.y=.06+1.5*S(u,.37,.58);p.root.position.addScaledVector(f.front,.6*S(u,.35,.55));e.root.position.addScaledVector(f.front,-.3*S(u,.4,.6));
  for(let i=0;i<2;i++)contact(f,i,'head',S(u,.15,.23)*(1-S(u,.30,.37)),0,.42,i?.2:-.2);
  if(u>.37&&u<I){showRing(f,0,e.root.position.clone().add(new V(0,2,0)),.9,.4);if(f.emit)for(let i=0;i<2;i++)beam(p.hands[i].getWorldPosition(new V()),e.head.getWorldPosition(new V()),f.color,.028,.08);}
  event(f,'clamp',u,.25);event(f,'lift',u,.48,'pulse');event(f,'crush',u,.65,'pulse');
 }
 if(e.boss){const down=.50*S(u,.06,.16);e.hips.position.y-=down;e.shins.forEach(n=>n.rotation.x+=down*1.5);e.legs.forEach(n=>n.rotation.x-=down*.8);}
 p.root.position.lerp(f.actorStart,1-S(u,0,.12));if(u>I){p.root.position.y=THREE.MathUtils.lerp(p.root.position.y,.06,recover);}
 return true;
}
