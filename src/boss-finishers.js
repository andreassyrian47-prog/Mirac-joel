import * as THREE from 'three';
export const BOSS_FINISHERS=[
 {id:'kingbreaker',name:'Kingbreaker',school:'brutal',bossOnly:true,duration:6.8,impact:.88,marks:[0,.16,.31,.48,.66,.85],beats:['Break the knee','Seize the crown','Drive the knee','Hammer the king','Tear the crown','Cast down'],description:'Break the king’s stance, seize his lowered head, drive in a knee, hammer him to the floor, and wrench the crown free before the final throw.',signature:'Boss-exclusive. A six-beat, contact-driven takedown.'},
 {id:'throne-of-cinders',name:'Throne of Cinders',school:'fire',bossOnly:true,duration:7.6,impact:.89,marks:[0,.16,.29,.52,.7,.86],beats:['Collapse the stance','Seize the ankle','Drag through fire','Swing and bury','Trample the throne','Cinder rupture'],description:'Sweep the giant down, seize an ankle, drag its body around a burning ring, swing it down, then crush it with successive stamping blows.',signature:'Boss-exclusive. A sustained ankle grip and visible ground drag.'},
 {id:'sovereigns-ruin',name:'Sovereign’s Ruin',school:'mind',bossOnly:true,duration:7.2,impact:.9,marks:[0,.17,.34,.51,.69,.87],beats:['Shatter the guard','Temple lock','Raise the sovereign','First compression','Gravity reversal','Sever the crown'],description:'Force the sovereign to kneel, lock both temples, release it into psychic suspension, compress its body in successive pulses, and rip the crown away as gravity returns.',signature:'Boss-exclusive. Close contact becomes a multi-stage psychic execution.'}
];
export function bossChoreography(f,u,h){
 const {player:p,at,pos,arms,fallen,contact,event,showRing,S,pulse}=h,e=f.enemy,I=f.def.impact,settle=1-S(u,I+.02,1),kneel=S(u,.09,.22),rise=S(u,.35,.5);
 // Giant opponents lower their torso into reachable contact space instead of requiring stretched arms.
 if(f.def.id==='kingbreaker'){
  const approach=S(u,0,.13),grip=S(u,.2,.28)*(1-S(u,.69,.76)),knee=pulse(u,.33,.44),hammer=pulse(u,.48,.6),tear=S(u,.69,.83),throwIt=S(u,.83,I);
  p.root.position.lerpVectors(f.actorStart,at(f,0,0,1.35),approach);e.hips.position.y-=.72*kneel;e.legs.forEach(l=>l.rotation.x=-.76*kneel);e.shins.forEach(l=>l.rotation.x=1.5*kneel);e.torso.rotation.x=.58*kneel;e.head.rotation.x=.3*kneel;
  p.legs[1].rotation.x=-1.45*pulse(u,.09,.19);p.torso.rotation.x=.24*grip;p.hips.position.y-=.2*grip;arms(p,-1.2*grip,.42);p.forearms.forEach(a=>a.rotation.x=-.95*grip);
  if(u>.2&&u<.34)for(let i=0;i<2;i++)contact(f,i,'head',grip,0,.2,i?.22:-.22);
  p.rig.position.y=.76*knee;p.legs[0].rotation.x=-1.65*knee;p.shins[0].rotation.x=1.6*knee;p.arms[1].rotation.x-=2.1*hammer;p.torso.rotation.x+=.55*hammer;
  e.rig.rotation.x=-.55*S(u,.52,.65);e.hips.position.y-=.2*S(u,.52,.65);e.torso.rotation.x+=.26*pulse(u,.37,.46);
  if(u>.62&&u<.83)for(let i=0;i<2;i++)contact(f,i,'head',S(u,.62,.68)*(1-S(u,.8,.84)),0,.2,i?.18:-.18);
  p.root.position.addScaledVector(f.front,.8*tear);p.torso.rotation.x-=.34*tear;arms(p,-1.1-1.3*tear+2.2*throwIt,.28);p.hips.position.y-=.22*pulse(u,.79,.94);fallen(e,S(u,.82,I+.03),.22);
  f.strikes.push({hand:0,leg:true,knee:true,where:'head',weight:Math.max(0,1-Math.abs(u-.39)/.05)});
  f.strikes.push({hand:1,leg:true,node:e.shins[1],weight:Math.max(0,1-Math.abs(u-.16)/.04)},{hand:1,where:'head',weight:Math.max(0,1-Math.abs(u-.56)/.05)});
  event(f,'knee-break',u,.16);event(f,'knee-drive',u,.39);event(f,'hammer',u,.56);event(f,'crown',u,.85,'sever','head');
 }else if(f.def.id==='throne-of-cinders'){
  const take=S(u,.14,.25),drag=S(u,.28,.57),release=S(u,.58,.68),a=drag*Math.PI*1.45,stomp1=pulse(u,.68,.79),stomp2=pulse(u,.8,.92);
  const path=at(f,Math.sin(a)*2.65,0,Math.cos(a)*2.65);p.root.position.lerpVectors(f.actorStart,path,S(u,.13,.29));p.root.rotation.y=Math.atan2(-f.side.x*Math.cos(a)+f.front.x*Math.sin(a),-f.side.z*Math.cos(a)+f.front.z*Math.sin(a));
  p.hips.position.y-=.58*take*(1-release);p.torso.rotation.x=-.2*take*(1-release);p.torso.rotation.y=-.22*take;p.arms[1].rotation.set(-.28*take,0,.25);p.forearms[1].rotation.x=-.18;p.arms[0].rotation.set(-.85,0,-.45);p.forearms[0].rotation.x=-1.15;
  fallen(e,take,.06);e.rig.position.y=.17*take;e.root.rotation.y=p.root.rotation.y+Math.PI;e.root.position.copy(path).addScaledVector(new THREE.Vector3(Math.sin(p.root.rotation.y),0,Math.cos(p.root.rotation.y)),-1.6);e.root.position.y=.06;
  f.drag={hand:1,leg:0,weight:S(u,.21,.29)*(1-S(u,.57,.62))};
  const tug=Math.sin(drag*Math.PI*12)*.04*take*(1-release);p.hips.position.y+=tug;e.shins[1].rotation.x+=.35+Math.sin(drag*25)*.13;
  if(u>.57){const r=S(u,.57,.68);p.root.position.lerp(at(f,-2.3,0,.9),r);e.root.position.lerp(at(f,-1.2,.06,-.3),r);e.root.position.y=.06+Math.sin(r*Math.PI)*.9;const want=Math.atan2(e.root.position.x-p.root.position.x,e.root.position.z-p.root.position.z);p.root.rotation.y+=Math.atan2(Math.sin(want-p.root.rotation.y),Math.cos(want-p.root.rotation.y))*S(u,.57,.67);p.legs[1].rotation.x=-1.6*(stomp1+stomp2);p.shins[1].rotation.x=.9*(stomp1+stomp2);p.torso.rotation.x=.55*(stomp1+stomp2);p.hips.position.y-=.2*(stomp1+stomp2);}
  if(u>.57&&f.dragExit)e.root.position.lerpVectors(f.dragExit,e.root.position.clone(),S(u,.57,.67));
  if(u>.64){e.root.updateMatrixWorld(true);const chest=e.torso.localToWorld(new THREE.Vector3(0,.47,.25)),beside=chest.clone().addScaledVector(f.side,-.85).addScaledVector(f.front,.3);beside.y=.06;p.root.position.lerp(beside,S(u,.64,.715));p.root.rotation.y=Math.atan2(chest.x-p.root.position.x,chest.z-p.root.position.z);}
  for(const t of [.75,.86])f.strikes.push({hand:1,leg:true,where:'chest',weight:Math.max(0,1-Math.abs(u-t)/.035)});

  showRing(f,0,f.origin.clone().setY(.12),2.8);showRing(f,1,f.origin.clone().setY(.17),3.1);h.emit(f,e.root.position,4,1.5);
  event(f,'sweep',u,.17);event(f,'drag',u,.3,'dash');event(f,'burial',u,.65);event(f,'stamp1',u,.75);event(f,'stamp2',u,.86,'sever','arm');
 }else{
  const grip=S(u,.19,.27)*(1-S(u,.33,.39)),lift=S(u,.36,.51),compression=pulse(u,.5,.6)+pulse(u,.65,.77),drop=S(u,.79,I);
  p.root.position.lerpVectors(f.actorStart,at(f,0,0,1.45),S(u,0,.15));e.hips.position.y-=.68*kneel*(1-lift);e.legs.forEach(l=>l.rotation.x=-.8*kneel);e.shins.forEach(l=>l.rotation.x=1.5*kneel);e.torso.rotation.x=.48*kneel;
  arms(p,-1.15*grip-1.5*lift+1.1*drop,.45+lift*.35-compression*.5);p.forearms.forEach(a=>a.rotation.x=-.85);p.torso.rotation.x=.32*grip+.45*drop;p.hips.position.y-=.19*(grip+compression);
  if(u>.2&&u<.37)for(let i=0;i<2;i++)contact(f,i,'head',grip,0,.2,i?.25:-.25);
  e.root.position.y=.06+2.8*lift*(1-drop);e.torso.rotation.x-=.38*lift+compression*.4;e.hips.rotation.z=.16*Math.sin(f.t*3)*lift*(1-drop);e.arms.forEach((arm,i)=>{arm.rotation.z=(i?1:-1)*(.8*lift-.3*compression);e.forearms[i].rotation.x=-.8*lift;});e.head.rotation.x=.35*compression;
  showRing(f,0,e.root.position.clone().add(new THREE.Vector3(0,2.4,0)),1.6-compression*.55,.5);showRing(f,1,e.root.position.clone().add(new THREE.Vector3(0,2.4,0)),1.8-compression*.55,-.5);
  fallen(e,drop,.08);event(f,'break',u,.17);event(f,'lock',u,.29,'pulse','head');event(f,'compress1',u,.56);event(f,'compress2',u,.72);event(f,'sever',u,.87,'sever','head');
 }
 if(u>I+.03){p.torso.rotation.x*=settle;p.rig.position.y*=settle;p.hips.position.y=THREE.MathUtils.lerp(p.baseHip,p.hips.position.y,settle);}
}
