import * as THREE from 'three';
import DATA from './revenant-executions.json' with {type:'json'};
import {curve} from './motion.js';
export const NEW_EXECUTIONS=DATA;
const base={hy:-.1,T:[.08,0,0],H:[0,0,0],B:[0,0,0],A0:[-.55,0,-.3],A1:[-.55,0,.3],E0:[-1,0,0],E1:[-1,0,0],L0:[-.1,0,-.06],L1:[-.1,0,.06],K0:[.25,0,0],K1:[.25,0,0],HD:[0,0,0]};
const P={
 ready:base,guard:{T:[.15,0,0],A0:[-1.2,0,-.4],A1:[-1.1,0,.4],E0:[-1.7,0,0],E1:[-1.7,0,0]},
 coilL:{hy:-.25,T:[.23,.6,.1],H:[0,.3,0],A0:[.45,.4,-.65],E0:[-1.65,0,0],A1:[-1,0,.3],K1:[.7,0,0]},
 coilR:{hy:-.25,T:[.23,-.6,-.1],H:[0,-.3,0],A1:[.45,-.4,.65],E1:[-1.65,0,0],A0:[-1,0,-.3],K0:[.7,0,0]},
 crossL:{T:[.28,-.65,-.15],H:[0,-.25,0],A0:[-1.4,-.4,.2],E0:[-.15,0,0],A1:[-.4,0,.6],K0:[.4,0,0]},
 crossR:{T:[.28,.65,.15],H:[0,.25,0],A1:[-1.4,.4,-.2],E1:[-.15,0,0],A0:[-.4,0,-.6],K1:[.4,0,0]},
 elbow:{hy:-.2,T:[.4,.8,.15],A1:[-1.5,.6,.1],E1:[-1.9,0,0],A0:[-.65,0,-.65],H:[0,.3,0]},
 grip:{hy:-.24,T:[.25,0,0],A0:[-1.35,0,-.5],A1:[-1.35,0,.5],E0:[-.85,0,0],E1:[-.85,0,0]},
 overhead:{hy:-.22,T:[-.32,-.12,0],A0:[-2.65,0,-.3],A1:[-2.65,0,.3],E0:[-1.2,0,0],E1:[-1.2,0,0],K0:[.6,0,0],K1:[.6,0,0]},
 hammer:{hy:-.32,T:[.85,.2,0],H:[.12,0,0],A0:[-.8,0,-.22],A1:[-.8,0,.22],E0:[-.12,0,0],E1:[-.12,0,0],K0:[.9,0,0],K1:[.6,0,0],HD:[-.25,0,0]},
 follow:{hy:-.18,T:[.42,.4,.06],A0:[.1,0,-.4],A1:[.2,0,.5],K0:[.6,0,0]},
 knee:{T:[-.15,.25,-.15],L1:[-1.6,0,.15],K1:[1.7,0,0],A0:[-1.25,0,-.4],A1:[-.9,0,.3],E0:[-1.3,0,0]},
 twist:{hy:-.17,T:[.1,.9,.2],H:[0,.4,.1],A0:[-1.4,0,-.7],A1:[-.8,0,.9],L0:[-.3,0,-.2]},
 throw:{hy:-.12,T:[.55,-.7,-.2],H:[0,-.3,0],A0:[-.3,-.5,-1],A1:[-1.3,-.3,.2],E0:[-.2,0,0],E1:[-.2,0,0]},
 kick:{T:[-.35,.3,-.2],L1:[-1.8,0,-.25],K1:[.12,0,0],L0:[.2,0,0],A0:[-.3,0,-1],A1:[-.6,0,.9]},
 stomp:{hy:-.27,T:[.4,0,.1],L1:[-.45,0,.1],K1:[.2,0,0],L0:[-.4,0,-.1],K0:[.8,0,0],A0:[-.8,0,-.6]},
 hook:{hy:-.23,T:[.35,-.65,-.15],A0:[-1.4,.5,-.6],E0:[-.65,0,0],A1:[-.6,0,.5]},
 upper:{T:[-.25,.55,.12],A1:[-2.3,0,.2],E1:[-.35,0,0],A0:[-.4,0,-.5],L0:[-.3,0,-.1]},
 roar:{hy:-.15,T:[.32,0,0],HD:[-.2,0,0],A0:[.1,0,-.85],A1:[.1,0,.85]},
 low:{hy:-.48,T:[.72,-.3,0],A0:[-.6,.2,-.4],E0:[-.2,0,0],L0:[-.7,0,-.1],K0:[1.4,0,0],K1:[1.1,0,0]},
 spin:{B:[0,2.5,0],T:[-.15,.45,-.25],L1:[-1.45,0,-.8],K1:[.12,0,0],A0:[-.5,0,-1],A1:[-.5,0,1]},
 palm:{T:[.2,.28,0],A1:[-1.4,0,.05],E1:[-.12,0,0],A0:[-.5,0,-.6]},
 draw:{hy:-.12,T:[-.2,-.3,0],A0:[-.8,0,-.5],A1:[-.9,0,.6],E0:[-1.7,0,0],E1:[-1.7,0,0]},
 push:{hy:-.24,T:[.28,0,0],A0:[-1.4,0,-.3],A1:[-1.4,0,.3],E0:[-.08,0,0],E1:[-.08,0,0],K0:[.65,0,0]},
 raise:{T:[-.18,0,0],A0:[-2.1,0,-.8],A1:[-2.1,0,.8],E0:[-.3,0,0],E1:[-.3,0,0]},
 crush:{hy:-.35,T:[.52,0,0],A0:[-.65,0,-.8],A1:[-.65,0,.8],E0:[-.08,0,0],E1:[-.08,0,0],K0:[.9,0,0],K1:[.9,0,0]},
 spread:{T:[-.15,0,0],A0:[-.6,0,-1.25],A1:[-.6,0,1.25],E0:[-.2,0,0],E1:[-.2,0,0]},
 pushL:{T:[.1,-.6,0],A0:[-1.45,0,-1],E0:[-.12,0,0],A1:[-.5,0,.7]},pushR:{T:[.1,.6,0],A1:[-1.45,0,1],E1:[-.12,0,0],A0:[-.5,0,-.7]},
 hit:{T:[-.4,0,.15],HD:[.35,0,-.12],A0:[.2,0,-.7],A1:[.1,0,.6]},
 kneel:{hy:-.55,T:[.5,0,0],L0:[-.8,0,-.08],L1:[-.8,0,.08],K0:[1.55,0,0],K1:[1.55,0,0],HD:[.2,0,0]},
 fold:{T:[.75,.25,.1],HD:[.3,0,0],L0:[-.7,0,-.1],L1:[-.4,0,.1],K0:[1.2,0,0],K1:[.7,0,0],A0:[-.5,0,-.8],A1:[-.7,0,.6]},
 air:{T:[-.25,0,.1],A0:[-.5,0,-1.1],A1:[-.3,0,.9],L0:[-.65,0,-.1],L1:[-.3,0,.15],K0:[1.15,0,0],K1:[.65,0,0],HD:[.25,0,0]},
 roll:{B:[-1.2,0,.55],T:[.3,0,.2],L0:[-.5,0,-.1],L1:[.2,0,.1],K0:[.9,0,0],K1:[.35,0,0]},
 collapse:{B:[-.95,0,.12],hy:-.15,T:[.4,0,0],A0:[.3,0,-.8],A1:[.2,0,.6],K0:[.8,0,0],K1:[.4,0,0]},
 fallen:{B:[-1.48,0,.12],hy:0,T:[.1,0,0],A0:[.25,0,-.7],A1:[.3,0,.5],E0:[-.5,0,0],E1:[-.3,0,0],L0:[-.25,0,-.1],L1:[.1,0,.15],K0:[.6,0,0],K1:[.25,0,0]}
};
const cache=new Map();
function track(def){if(cache.has(def.id))return cache.get(def.id);const out={roots:Array.from({length:6},(_,j)=>def.keys.map(k=>[k[0],k[j+1]])),poses:[7,8].map(index=>{const o={};for(const key of Object.keys(base)){const v=base[key];o[key]=Array.isArray(v)?[0,1,2].map(c=>def.keys.map(k=>[k[0],(P[k[index]][key]||v)[c]])):def.keys.map(k=>[k[0],P[k[index]][key]??v]);}return o;})};cache.set(def.id,out);return out;}
function apply(r,channels,u){const nodes={T:r.torso,H:r.hips,B:r.rig,HD:r.head,A0:r.arms[0],A1:r.arms[1],E0:r.forearms[0],E1:r.forearms[1],L0:r.legs[0],L1:r.legs[1],K0:r.shins[0],K1:r.shins[1]};for(const[k,v]of Object.entries(channels))if(k==='hy')r.hips.position.y=r.baseHip+curve(v,u);else nodes[k].rotation.set(...v.map(x=>curve(x,u)));r.spine.rotation.y=-r.torso.rotation.y*.18;r.neck.rotation.y=-r.torso.rotation.y*.22;}
export function expandedChoreography(f,u,h){
 const {player:p,at,event,contact,showRing,S,emit,beam,pose}=h,e=f.enemy,t=track(f.def),v=t.roots.map(c=>curve(c,u));p.root.position.copy(at(f,v[0],v[1],v[2]));e.root.position.copy(at(f,v[3],v[4],v[5]));
 apply(p,t.poses[0],u);apply(e,t.poses[1],u);const d=e.root.position.clone().sub(p.root.position);p.root.rotation.y=Math.atan2(d.x,d.z);e.root.rotation.y=Math.atan2(-d.x,-d.z);if(e.boss&&u<.35)e.hips.position.y-=.22*S(u,.08,.18);
 for(const [time,hand,where,leg=false]of f.def.hits){const w=Math.max(0,1-Math.abs(u-time)/(f.def.id==='sunless-coronation'&&time>.7?.08:.055));if(w>0)f.strikes.push({hand,where,leg,weight:w,surface:true,...(where==='shin'?{node:e.feet[0]}:{})});event(f,'impact'+time,u,time);}
 for(const [hand,where,a,b,c]of f.def.grips)contact(f,hand,where,S(u,a,b)*(1-S(u,c,c+.045)),0,.34,where==='head'?(hand?.2:-.2):0);
 if(f.def.school!=='brutal'){const r=.7+Math.sin(u*Math.PI)*1.2;showRing(f,0,e.root.position.clone().add(new THREE.Vector3(0,.7,0)),r,f.def.school==='mind'?.6:0);showRing(f,1,e.root.position.clone().add(new THREE.Vector3(0,1.9,0)),r*.65,1.2);for(const time of [.25,.48,.7])event(f,'spell'+time,u,time,'pulse');emit(f,e.root.position,1,1.4);}
 if(f.emit&&f.def.id==='dragons-wake'&&u>.27&&u<.55){p.root.updateMatrixWorld(true);e.root.updateMatrixWorld(true);beam(p.head.localToWorld(new THREE.Vector3(0,0,.25)),e.torso.localToWorld(new THREE.Vector3(0,.45,.3)),0xff953e,.12,.09);}
 if(f.emit&&['thought-spear','vector-break','neural-guillotine','worlds-end'].includes(f.def.id)&&u>.25&&u<.76){p.root.updateMatrixWorld(true);e.root.updateMatrixWorld(true);beam(p.hands[1].getWorldPosition(new THREE.Vector3()),e.head.getWorldPosition(new THREE.Vector3()),f.color,f.def.id==='thought-spear'?.06:.025,.09);}
 for(let i=0;i<f.ghosts.length;i++){const g=f.ghosts[i],begin=.24+i*.145,phase=THREE.MathUtils.clamp((u-begin)/.23,0,1),a=i*2.1+.4;g.root.visible=u>begin&&u<begin+.25;pose(g,f.t,0,{type:'light',t:phase*.5,duration:.5,step:i%2+1});g.root.position.copy(at(f,Math.sin(a)*1.8,.08,Math.cos(a)*1.8));g.root.rotation.y=a+Math.PI;}

 if(f.def.bossOnly||f.def.id==='neural-guillotine')event(f,'sever',u,.84,'sever',f.def.school==='fire'?'arm':'head');
 if(u<.12)p.root.position.lerpVectors(f.actorStart,p.root.position.clone(),S(u,0,.12));
}
