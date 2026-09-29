import * as THREE from 'three';
import {safeCamera} from './eclipse-world.js';
import {curve} from './motion.js';
const V=THREE.Vector3,clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const smooth=(u,a,b)=>THREE.MathUtils.smoothstep(u,a,b);
const bell=(u,a,b)=>u<=a||u>=b?0:Math.sin(Math.PI*(u-a)/(b-a));
// Authored full upper-body performances. Roots, air arcs and interactions belong to
// the director; these tracks replace its static holds, rather than adding idle noise.
const ready={hy:-.10,H:[0,0,0],S:[0,0,0],T:[.08,0,0],HD:[0,0,0],A0:[-.65,0,-.32],A1:[-.55,0,.32],E0:[-1.1,0,0],E1:[-.95,0,0],W0:[.05,0,0],W1:[.05,0,0],c0:.5,c1:.5};
const pose=(hy,T,A0,A1,E0=-.9,E1=-.9,extra={})=>({hy,T,A0,A1,E0:[E0,0,0],E1:[E1,0,0],...extra});
const K=(u,p)=>[u,p];
const grip=pose(-.25,[.3,0,0],[-1.35,0,-.4],[-1.35,0,.4],-1.2,-1.2,{c0:1,c1:1});
const overhead=pose(-.2,[-.32,0,0],[-2.6,0,-.3],[-2.6,0,.3],-1,-1);
const bury=pose(-.38,[.85,.12,0],[-.1,0,-.25],[-.1,0,.25],-.12,-.12);
const spread=pose(-.12,[-.1,0,0],[-1.1,0,-1.1],[-1.1,0,1.1],-.25,-.25,{c0:.1,c1:.1});
const drag=pose(-.55,[-.22,.18,0],[-.85,0,-.5],[-.28,0,.19],-1.2,-.1,{c1:1});
// Frame times are local to each existing execution. Sparse extra channels preserve
// its authored kicks/spins, while every upper-body channel has an explicit curve.
export const PERFORMANCES={
 'soulbreaker':[K(0,ready),K(.10,pose(-.24,[.12,-.62,-.08],[-.8,0,-.4],[.6,-.2,.45],-1.2,-1.4)),K(.19,pose(-.08,[.26,.5,.07],[-.4,0,-.5],[-1.5,.12,-.15],-1.1,-.1)),K(.27,ready),K(.35,pose(-.28,[.52,-.3,-.18],[.7,0,-.35],[-1,0,.3],-.7,-1.3)),K(.46,grip),K(.54,{...grip,hy:-.38}),K(.67,overhead),K(.72,{...overhead,T:[-.4,.1,0]}),K(.8,bury),K(.87,{...bury,hy:-.44}),K(1,ready)],
 'grave-driver':[K(0,ready),K(.12,pose(-.44,[.38,-.85,.1],[-.7,0,-.7],[.2,0,.5])),K(.24,pose(-.52,[.56,.72,-.14],[-.5,0,-.85],[-.6,0,.45],-.5,-.1)),K(.35,pose(-.55,[.85,0,0],[-.4,0,-.55],[-.5,0,.25],-.75,-.08,{c1:1})),K(.43,overhead),K(.61,overhead),K(.7,pose(-.18,[-.42,.3,-.1],[-2.5,0,-.5],[-2.65,0,.32],-.6,-.2)),K(.77,bury),K(.86,{...bury,hy:-.46}),K(1,ready)],
 'crown-of-ruin':[K(0,ready),K(.15,pose(-.38,[.42,-.55,.08],[-.9,0,-.5],[.68,0,.32],-1,-1.4)),K(.24,pose(.03,[-.35,.7,-.07],[-.4,0,-.55],[-2.5,0,.13],-.7,-.25)),K(.35,pose(-.3,[.4,.25,0],[-.7,0,-.4],[-.8,0,.4])),K(.47,pose(-.1,[.12,-.7,-.1],[-.5,0,-.85],[-1.1,0,.8])),K(.60,pose(.02,[-.2,.65,-.28],[-.55,0,-1.2],[-.25,0,1],-.4,-.65)),K(.67,pose(-.13,[.25,.85,-.18],[.1,0,-.6],[-1,0,.7])),K(.8,pose(-.4,[.6,.1,0],[-.2,0,-.5],[-.3,0,.5])),K(.9,{...ready,hy:-.28}),K(1,ready)],
 'hells-guillotine':[K(0,ready),K(.14,grip),K(.23,pose(-.1,[.25,0,0],[-1.2,0,-.35],[-1.2,0,.35],-1.5,-1.5)),K(.33,pose(-.4,[.5,0,0],[.3,0,-.4],[.3,0,.4])),K(.48,pose(-.05,[-.22,0,0],[-2.2,0,-.65],[-2.2,0,.65],-.7,-.7)),K(.60,pose(.05,[-.3,-.22,-.12],[-.7,0,-1],[-.8,0,.9])),K(.655,pose(-.13,[.55,.16,.08],[.15,0,-.8],[-.6,0,.65])),K(.79,bury),K(.86,{...bury,hy:-.44}),K(1,ready)],
 'tyrants-verdict':[K(0,ready),K(.2,pose(-.2,[.25,-.3,-.1],[-1.2,0,-.15],[-.6,0,.6],-.25,-1.1,{c0:1})),K(.34,pose(-.36,[.4,-.9,-.17],[-1.3,.2,-.2],[-.8,0,.8],-1.3,-.65)),K(.48,pose(-.44,[.55,.8,.12],[-.7,.2,-.5],[.2,0,.5],-.3,-.7)),K(.58,pose(-.2,[-.15,-.2,0],[-1.7,0,-.5],[-1.4,0,.5])),K(.69,pose(-.06,[-.2,.2,0],[-1.4,0,-.5],[-1,0,.7])),K(.79,bury),K(.87,{...bury,hy:-.48}),K(1,ready)],
 'furnace-heart':[K(0,ready),K(.16,pose(-.22,[.2,-.4,0],[-.9,0,-.6],[-.4,0,.3],-1.1,-1.3)),K(.25,pose(-.12,[.27,.25,0],[-.7,0,-.4],[-1.5,0,.1],-1.2,-.08,{c1:.1})),K(.43,pose(-.25,[.4,.1,.05],[-.95,0,-.5],[-1.5,0,.1],-1.25,-.1,{c1:1})),K(.55,pose(-.3,[.2,-.65,-.1],[-.8,0,-.4],[-.2,0,.8],-1.3,-1.4)),K(.66,pose(-.17,[-.26,-.28,-.1],[-.6,0,-.8],[-.65,0,.9])),K(.73,pose(-.04,[-.36,.46,-.13],[.15,0,-.65],[-.8,0,.75])),K(.83,pose(-.24,[.28,.3,.05],[-.55,0,-.6],[-.6,0,.4])),K(1,ready)],
 'cinder-spiral':[K(0,ready),K(.12,pose(-.4,[.4,-.6,0],[-.8,0,-.5],[.2,0,.5])),K(.22,pose(-.56,[.65,.3,-.12],[-.5,0,-.8],[-.4,0,.3],-.5,-.1)),K(.29,drag),K(.48,{...drag,T:[-.3,-.12,.07]}),K(.66,{...drag,T:[-.2,.25,-.06]}),K(.72,drag),K(.78,pose(-.27,[.35,-.7,-.1],[-.7,0,-.8],[-1.8,0,.3],-1.1,-.25)),K(.84,pose(-.19,[.58,.8,.1],[.1,0,-.6],[-.5,0,.75],-.6,-.1)),K(.91,{...ready,hy:-.27}),K(1,ready)],
 'infernal-pillar':[K(0,ready),K(.13,pose(-.28,[.3,-.3,0],[-.9,0,-.5],[-.8,0,.35])),K(.22,grip),K(.37,pose(-.07,[-.27,.1,0],[-.75,0,-.8],[-2.15,0,.2],-1.15,-.3)),K(.48,{...overhead,hy:-.06}),K(.61,overhead),K(.68,pose(-.12,[-.42,-.1,0],[-2.8,0,-.22],[-2.8,0,.22],-1.25,-1.25)),K(.72,bury),K(.81,{...bury,hy:-.46}),K(.9,{...bury,T:[.52,0,0]}),K(1,ready)],
 'meteor-burial':[K(0,ready),K(.15,pose(-.4,[.48,-.35,0],[.4,0,-.5],[.5,0,.5])),K(.23,overhead),K(.36,pose(-.3,[.45,0,0],[.5,0,-.4],[.5,0,.4])),K(.49,grip),K(.57,overhead),K(.66,pose(-.15,[-.45,-.55,-.18],[-2.55,0,-.45],[-2.7,0,.3])),K(.74,pose(-.24,[.76,.65,.15],[-.15,0,-.4],[-.4,0,.4],-.1,-.1)),K(.83,{...bury,hy:-.42}),K(.92,{...ready,hy:-.3}),K(1,ready)],
 'ashen-cross':[K(0,ready),K(.16,pose(-.22,[.12,.75,-.08],[.25,-.2,-.8],[-1,0,.3],-1.35,-1)),K(.25,pose(-.1,[.3,-.72,.1],[-1.45,0,.75],[-.4,0,.4],-.12,-.8,{c0:.05})),K(.38,pose(-.28,[.22,-.85,.08],[-.7,0,-.4],[.4,.2,.85],-1,-1.3)),K(.49,pose(-.09,[.32,.8,-.1],[-.4,0,-.4],[-1.5,0,-.75],-.85,-.1,{c1:.05})),K(.61,grip),K(.69,{...grip,hy:-.36,T:[.5,0,0]}),K(.76,{...spread,T:[-.3,0,0]}),K(.85,spread),K(1,ready)],
 'pyre-king':[K(0,ready),K(.17,pose(-.15,[-.15,-.18,0],[-.7,0,-.7],[-.8,0,.6])),K(.27,pose(-.3,[.42,.24,0],[-.9,0,-.4],[-.7,0,.4])),K(.4,grip),K(.51,pose(-.33,[.48,.12,0],[-.6,0,-.85],[-1.3,0,.15],-1.2,-.2,{c1:1})),K(.63,pose(-.2,[.24,-.25,0],[-1.5,0,-.65],[-1.45,0,.5],-.9,-1.4)),K(.73,pose(-.3,[.45,0,0],[-1.4,0,-.2],[-1.4,0,.2],-1.4,-1.4,{c0:1,c1:1})),K(.8,bury),K(.89,{...bury,hy:-.28}),K(1,ready)],
 'mindbreaker':[K(0,ready),K(.18,spread),K(.29,grip),K(.42,{...grip,hy:-.36,T:[.42,0,0]}),K(.55,pose(-.16,[-.2,0,0],[-1.6,0,-.4],[-1.6,0,.4],-1.3,-1.3,{c0:1,c1:1})),K(.66,{...grip,T:[.22,-.15,-.06]}),K(.72,overhead),K(.79,bury),K(.87,{...bury,hy:-.44}),K(1,ready)],
 'gravity-coffin':[K(0,ready),K(.17,pose(-.38,[.42,0,0],[-.5,0,-.9],[-.5,0,.9],-.2,-.2)),K(.33,spread),K(.44,{...spread,T:[-.2,-.3,-.1]}),K(.49,grip),K(.55,{...spread,T:[-.13,.3,.1]}),K(.62,{...grip,hy:-.35}),K(.68,overhead),K(.75,{...grip,hy:-.42,T:[.56,0,0]}),K(.8,bury),K(.9,{...bury,hy:-.3}),K(1,ready)],
 'orbit-of-ruin':[K(0,ready),K(.18,pose(-.27,[.3,-.65,0],[-.9,0,-.35],[-1.1,0,.65])),K(.29,pose(-.24,[-.2,.4,-.17],[-.5,0,-.9],[-1.1,0,.6],-1.2,-.22)),K(.44,pose(-.33,[-.28,-.45,-.25],[-.45,0,-1.05],[-1.2,0,.6],-.6,-.1)),K(.59,pose(-.2,[-.35,.3,-.24],[-.3,0,-1],[-1.15,0,.7],-.7,-.08)),K(.68,pose(-.4,[.25,-.6,0],[-.85,0,-.5],[-1.1,0,.85],-1.1,-.7)),K(.78,pose(-.18,[.48,.95,.13],[.25,0,-.65],[-1.65,.25,-.1],-.5,-.08)),K(.87,pose(-.3,[.5,.6,0],[-.25,0,-.5],[-.9,0,.25])),K(1,ready)],
 'heavens-rejection':[K(0,ready),K(.15,pose(-.4,[.5,-.2,0],[-.85,0,-.5],[-.15,0,.3])),K(.23,pose(-.08,[-.22,.25,0],[-.5,0,-.7],[-2.55,0,.2],-1.1,-.18)),K(.42,pose(-.15,[-.22,0,0],[-.8,0,-.7],[-2.7,0,.18],-1,-.2,{HD:[-.35,0,0]})),K(.58,pose(-.22,[-.16,-.15,0],[-1.5,0,-.45],[-2.65,0,.15],-1.4,-.6,{HD:[-.4,0,0],c1:1})),K(.69,{...overhead,hy:-.33}),K(.79,bury),K(.87,{...bury,hy:-.45}),K(1,ready)],
 'rift-fold':[K(0,ready),K(.21,grip),K(.33,spread),K(.43,pose(-.3,[.3,-.75,-.1],[-1.1,0,-1.1],[-.8,0,.6],-.3,-1.4)),K(.56,pose(-.24,[.25,.72,.1],[-.9,0,-.3],[-1.4,0,-.2],-1.45,-.1)),K(.65,pose(-.3,[.4,.1,0],[-1.5,0,.55],[-1.5,0,-.55],-.8,-.8)),K(.74,{...grip,hy:-.42,T:[.6,-.3,0]}),K(.8,pose(-.15,[-.24,.65,.08],[-.5,0,-1.1],[-.4,0,1.2],-.1,-.1)),K(.89,{...ready,hy:-.3}),K(1,ready)],
 'wraith-procession':[K(0,ready),K(.15,spread),K(.27,pose(-.25,[.2,-.6,-.1],[-1.2,0,-.7],[-.5,0,.6])),K(.4,pose(-.25,[.2,.65,.1],[-.5,0,-.6],[-1.2,0,.7])),K(.55,grip),K(.64,pose(-.35,[.55,-.65,-.1],[.65,0,-.4],[.55,0,.45])),K(.73,pose(-.26,[.3,-.75,-.1],[-.8,0,-.65],[.45,0,.6],-1.1,-1.4)),K(.78,pose(-.33,[.75,.65,.13],[.15,0,-.55],[-1.55,0,-.1],-.7,-.08,{c1:.05})),K(.86,{...bury,hy:-.4}),K(1,ready)],
 'soul-sever':[K(0,ready),K(.13,pose(-.26,[.25,-.6,0],[-.8,0,-.4],[.4,0,.6])),K(.22,pose(-.15,[.4,.45,0],[-.55,0,-.65],[-1.4,0,.2],-1.2,-.1,{c1:.1})),K(.34,grip),K(.48,pose(-.32,[-.26,-.55,-.1],[-1.2,0,-.4],[-.8,0,.55],-1.5,-1.65,{c0:1,c1:1})),K(.64,pose(-.25,[-.4,-.72,-.12],[-.7,0,-.9],[-.5,0,.75],-1.2,-1.7)),K(.73,pose(-.4,[.25,-.65,0],[-1.2,0,-.3],[-1.4,0,.3],-1.45,-1.45)),K(.8,{...spread,T:[-.25,.6,.1]}),K(.88,spread),K(1,ready)],
 'pale-requiem':[K(0,ready),K(.15,pose(-.3,[.5,0,-.13],[.7,0,-.4],[.8,0,.4])),K(.31,pose(-.22,[.4,0,.12],[.3,0,-.7],[.3,0,.7])),K(.43,pose(-.4,[.5,0,0],[-.65,0,-.5],[-.65,0,.5],-.15,-.15)),K(.58,overhead),K(.67,{...overhead,hy:-.27}),K(.74,{...overhead,T:[-.5,0,0]}),K(.79,bury),K(.86,{...bury,hy:-.5}),K(1,ready)],
 'tomb-of-echoes':[K(0,ready),K(.19,grip),K(.31,spread),K(.42,pose(-.24,[.15,-.5,-.08],[-1.3,0,-1.1],[-.9,0,.7],-.3,-1.2)),K(.55,pose(-.24,[.15,.5,.08],[-.9,0,-.7],[-1.3,0,1.1],-1.2,-.3)),K(.67,{...spread,hy:-.35,T:[.4,0,0]}),K(.75,{...grip,hy:-.4,T:[.5,0,0]}),K(.81,bury),K(.9,{...bury,hy:-.3}),K(1,ready)],
 'kingbreaker':[K(0,ready),K(.11,pose(-.2,[-.15,-.2,0],[-.8,0,-.7],[-.8,0,.7])),K(.18,grip),K(.28,{...grip,T:[.42,0,0]}),K(.34,{...grip,hy:-.34,T:[.56,0,0]}),K(.39,pose(-.04,[-.25,.1,0],[-1.35,0,-.35],[-1.35,0,.35],-1.5,-1.5)),K(.46,pose(-.25,[.25,-.4,0],[-1.15,0,-.35],[-1.9,0,.55],-1.4,-1.5)),K(.52,pose(-.2,[-.38,-.45,-.1],[-.9,0,-.5],[-2.85,0,.25],-1.2,-1.1)),K(.56,pose(-.37,[.8,.5,.1],[-.5,0,-.65],[-.6,0,.1],-1.2,-.08)),K(.62,grip),K(.71,{...grip,hy:-.44}),K(.8,pose(-.22,[-.35,0,0],[-1.6,0,-.3],[-1.6,0,.3],-1.4,-1.4,{c0:1,c1:1})),K(.85,overhead),K(.9,bury),K(1,ready)],
 'throne-of-cinders':[K(0,ready),K(.15,pose(-.5,[.5,-.65,0],[-.8,0,-.7],[.15,0,.55])),K(.24,drag),K(.38,{...drag,T:[-.28,-.18,.06]}),K(.53,{...drag,T:[-.22,.25,-.07]}),K(.6,pose(-.37,[.4,-.55,0],[-.8,0,-.6],[-1.7,0,.25],-1.1,-.1)),K(.67,pose(-.2,[.45,.65,.1],[-.6,0,-.6],[-.6,0,.6])),K(.71,pose(-.1,[-.3,-.2,0],[-1.6,0,-.7],[-1.2,0,.75])),K(.75,bury),K(.81,pose(-.1,[-.38,.15,0],[-1.5,0,-.7],[-1.5,0,.7])),K(.86,{...bury,hy:-.45}),K(.92,{...bury,T:[.6,0,0]}),K(1,ready)],
 'sovereigns-ruin':[K(0,ready),K(.12,pose(-.3,[.4,-.5,0],[-.8,0,-.6],[.4,0,.55])),K(.17,pose(-.18,[.35,.55,.07],[-.6,0,-.5],[-1.4,0,.15],-1.1,-.1)),K(.29,grip),K(.38,{...grip,hy:-.4,T:[.5,0,0]}),K(.49,spread),K(.56,{...grip,hy:-.38,T:[.55,-.2,0]}),K(.64,{...spread,T:[-.3,.25,0]}),K(.72,{...grip,hy:-.42,T:[.6,.2,0]}),K(.79,overhead),K(.86,{...spread,T:[-.35,0,0]}),K(.9,bury),K(1,ready)]
};
const compiled=new Map();
function tracks(id){if(compiled.has(id))return compiled.get(id);const frames=PERFORMANCES[id],out={};for(const key of Object.keys(ready)){const value=ready[key];out[key]=Array.isArray(value)?value.map((_,i)=>frames.map(([u,p])=>[u,(p[key]??value)[i]])):frames.map(([u,p])=>[u,p[key]??value]);}compiled.set(id,out);return out;}
const nodes=r=>({H:r.hips,S:r.spine,T:r.torso,HD:r.head,A0:r.arms[0],A1:r.arms[1],E0:r.forearms[0],E1:r.forearms[1],W0:r.hands[0],W1:r.hands[1]});
// Each reaction pulse is separately timed to the action that actually causes it.
export const REACTION_BEATS={
 'soulbreaker':[.19,.53,.8],'grave-driver':[.24,.77],'crown-of-ruin':[.24,.64],'hells-guillotine':[.23,.655],'tyrants-verdict':[.22,.46,.79],
 'furnace-heart':[.25,.43,.73],'cinder-spiral':[.18,.57,.78],'infernal-pillar':[.21,.70],'meteor-burial':[.22,.54,.74],'ashen-cross':[.25,.49,.76],
 'pyre-king':[.22,.46,.8],'mindbreaker':[.29,.56,.79],'gravity-coffin':[.33,.49,.62,.75],'orbit-of-ruin':[.24,.78],'heavens-rejection':[.23,.79],
 'rift-fold':[.29,.62,.79],'wraith-procession':[.25,.39,.53,.78],'soul-sever':[.24,.48,.8],'pale-requiem':[.22,.49,.79],'tomb-of-echoes':[.29,.55,.81],
 'kingbreaker':[.16,.39,.56,.85],'throne-of-cinders':[.17,.65,.75,.86],'sovereigns-ruin':[.17,.29,.56,.72,.87]
};
export function performExecution(f,p,dt){
 const u=clamp(f.t/f.def.duration,0,1),e=f.enemy,map=nodes(p),data=f.reworked||f.def.expanded?{}:tracks(f.def.id);
 for(const [key,track]of Object.entries(data)){const value=Array.isArray(ready[key])?track.map(t=>curve(t,u)):curve(track,u);if(map[key])map[key].rotation.set(...value);else if(key==='hy')p.hips.position.y=p.baseHip+value;else if(key[0]==='c')p.fingers[Number(key[1])].forEach((n,j)=>n.rotation.x=-value*(j===4?.65:1));}
 // Pelvis leads the torso; counter-rotation stops the chest and skull moving as one block.
 p.hips.rotation.y=p.torso.rotation.y*.28;p.spine.rotation.y=p.torso.rotation.y*-.12;p.spine.rotation.x=p.torso.rotation.x*.12;p.neck.rotation.y=-p.torso.rotation.y*.26;p.head.rotation.x-=p.torso.rotation.x*.24;
 // GRAVITAS owns victim reactions (gravitas.js); this legacy pulse layer only runs without a profile.
 if(!e.physicalBody&&!f.reworked&&u<f.def.impact&&!f.def.gravitas){
  let body=0,neck=0,arms=0;for(const t of (REACTION_BEATS[f.def.id]||f.def.hits.map(h=>h[0]))){const age=(u-t)*f.def.duration;const wave=(delay)=>age<delay?0:Math.sin(Math.min(Math.PI,(age-delay)*13))*Math.exp(-(age-delay)*5);body+=wave(0);neck+=wave(.035);arms+=wave(.075);}
  const sign=['ashen-cross','rift-fold','crown-of-ruin'].includes(f.def.id)?Math.cos(u*15):1;
  e.spine.rotation.x-=body*.28;e.torso.rotation.z+=body*.13*sign;e.neck.rotation.x+=neck*.3;e.head.rotation.z-=neck*.16*sign;
  for(let i=0;i<2;i++){e.forearms[i].rotation.x-=arms*(i?.6:.85);e.hands[i].rotation.x+=arms*.22;e.fingers?.[i]?.forEach((n,j)=>n.rotation.x=-clamp(.2+arms*.65,0,1)*(1-j*.04));}
  // Deliberate resistance during holds: guarding the wound, bracing, then losing tone.
  const hold=smooth(u,.26,.36)*(1-smooth(u,.64,f.def.impact));
  if(['mindbreaker','pyre-king','soul-sever','kingbreaker','sovereigns-ruin'].includes(f.def.id)){e.arms[0].rotation.x-=hold*.75;e.arms[1].rotation.x-=hold*.48;e.forearms[0].rotation.x-=hold*.7;e.forearms[1].rotation.x-=hold*.8;}
  if(['gravity-coffin','heavens-rejection','meteor-burial','sovereigns-ruin'].includes(f.def.id)){const air=clamp((e.root.position.y-.1)/1.5,0,1);e.legs[0].rotation.x-=air*.45;e.legs[1].rotation.x+=air*.22;e.shins[0].rotation.x+=air*.6;e.shins[1].rotation.x+=air*.28;}
 }
 // Carry contact-induced root offsets out of the grip instead of deleting them in one frame.
 f.rawActor=p.root.position.clone();f.rawHeight=p.rig.position.y;
 if(f.rootCarry){const holding=[...f.contacts,...f.strikes].some(c=>c.weight>.15);if(e.physicalBody){/* Keep the safe recovery stance, not a spring back into the corpse. */}else if(!holding){const length=f.rootCarry.length();f.rootCarry.multiplyScalar(Math.max(0,length-dt*7)/Math.max(.001,length));}else f.rootCarry.multiplyScalar(Math.exp(-dt*.6));p.root.position.x+=f.rootCarry.x;p.root.position.z+=f.rootCarry.z;p.rig.position.y+=f.rootCarry.y/p.root.scale.y;}
}
export function rememberExecutionCorrection(f,p){f.rootCarry=new V(p.root.position.x-f.rawActor.x,(p.rig.position.y-f.rawHeight)*p.root.scale.y,p.root.position.z-f.rawActor.z);}
// Use actual animated anatomy, not standing-height constants, to frame aerial poses.
export function framePerformance(f,p,camera,dt){
 const e=f.enemy,V=THREE.Vector3,clock=f.clock??f.t,u=clock/f.def.duration,I=f.def.impact,dynamic=f.actionCamera!==false;
 [p,e].forEach(r=>r.root.updateMatrixWorld(true));const points=[];
 for(const r of [p,e]){for(const n of [r.hips,r.head,...r.hands,...r.feet])points.push(n.getWorldPosition(new V()));points.push(r.head.getWorldPosition(new V()).add(new V(0,r.root.scale.y*1.18,0)));}
 const bounds=new THREE.Box3().setFromPoints(points),center=bounds.getCenter(new V()),size=bounds.getSize(new V());center.y=Math.max(1.25,center.y);
 const impactAt=f.def.gravitas?f.def.gravitas.pre:I*f.def.duration;
 const load=smooth(u,.27,I-.14),release=smooth(clock,impactAt-.20,impactAt),recover=smooth(u,I+.03,1);
 const recoil=clock<impactAt?0:Math.exp(-(clock-impactAt)*15)*Math.sin((clock-impactAt)*28);
 const sign=f.def.school==='ghost'||['hells-guillotine','furnace-heart'].includes(f.def.id)?-1:1,arc=f.def.bespoke?-1.5-.25*load:dynamic?sign*(1.78+.16*load+.15*release-.20*recover):1.13;
 // GRAVITAS settle: after the kill the camera sinks, creeps in and lingers on the body.
 const settle=f.def.gravitas?smooth(u,I,I+.02)*(1-smooth(u,I+.08,1)*.7):0,slowmo=f.slow>0?Math.min(1,f.slow/.12):0;
 const elevation=(f.def.bespoke?(f.def.smallOnly?.43:.27+.58*smooth(u,.36,.50)):dynamic?lerp(.13,.31,release)*(1-recover)+.20*recover:.22)-.07*settle;
 const impactClock=f.def.gravitas?f.def.gravitas.pre:I*f.def.duration;
 const punch=Math.exp(-Math.abs(clock-impactClock)*10);
 const fov=(dynamic?lerp(lerp(49,43,load),60,release)*(1-recover)+49*recover:51)-2.5*slowmo-3*settle;
 const aim=center.clone();aim.y+=dynamic?.10*(1-release)-.12*release:0;
 f.look.lerp(aim,1-Math.exp(-dt*(release>.5?18:10)));
 const dir=f.front.clone().multiplyScalar(Math.cos(arc)).addScaledVector(f.side,Math.sin(arc)).setY(elevation).normalize(),halfFov=Math.tan(fov*Math.PI/360);
 const distance=Math.max(5.2,(size.y+.62)/(halfFov*2*.84),(Math.hypot(size.x,size.z)+.5)/(halfFov*2*camera.aspect*.86));
 let want=f.look.clone().addScaledVector(dir,distance*(dynamic?1-.035*Math.max(0,recoil)-.05*punch-.06*settle:1));
 if(f.cameraObstacles){
  const subjects=[f.look,p.head.getWorldPosition(new V()),e.head.getWorldPosition(new V())];
  const blocked=at=>subjects.some(look=>safeCamera(look,at.clone(),f.cameraObstacles).distanceTo(at)>.15);
  let solved=false;
  for(const elevation of [dir.y,.5,.85]){for(const turn of [f.cameraTurn||0,0,.4,-.4,.8,-.8,1.5,-1.5,Math.PI]){const candidate=dir.clone().applyAxisAngle(new V(0,1,0),turn).setY(elevation).normalize(),at=f.look.clone().addScaledVector(candidate,distance);if(!blocked(at)){want=at;f.cameraTurn=turn;solved=true;break;}}if(solved)break;}
  if(solved&&blocked(camera.position))camera.position.copy(want);
 }
 camera.position.lerp(want,1-Math.exp(-dt*(dynamic?11:8)));camera.fov=Math.max(30,THREE.MathUtils.damp(camera.fov,fov,14,dt)-(dynamic?3.2*punch:0));camera.updateProjectionMatrix();camera.lookAt(f.look);
 camera.updateMatrixWorld(true);let scale=1;for(const pt of points){const n=pt.clone().project(camera);scale=Math.max(scale,Math.abs(n.y)/.80,Math.abs(n.x)/.91);}
 if(scale>1){camera.position.sub(f.look).multiplyScalar(Math.min(1.7,scale)).add(f.look);camera.lookAt(f.look);}
 if(dynamic&&f.cameraShake){camera.rotateZ(sign*(.022*Math.sin(load*Math.PI)-.016*recoil));}
 camera.updateMatrixWorld(true);for(const g of f.ghosts){if(g.echoMaterial)g.echoMaterial.opacity=.13*(g.spectralFade??1)*THREE.MathUtils.smoothstep(camera.position.distanceTo(g.head.getWorldPosition(new V())),1.7,4.2);}
 f.cameraShot=u<.25?'CONTACT':u<I-.12?'CONTROL':u<I?'RELEASE':'AFTERMATH';
 f.framing={count:points.length,maxNdc:Math.max(...points.map(pt=>{const n=pt.clone().project(camera);return Math.max(Math.abs(n.x),Math.abs(n.y));}))};
}
