import * as THREE from 'three';
import {prepareLocomotion,groundStride,articulateDetails} from './locomotion.js';

// Motion, not a VFX layer: authored joint curves, finite transition blends, world-space
// stance constraints and damped secondary joints. Simulation remains owned by main.js.
const TAU=Math.PI*2,clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const ramp=(t,a,b)=>ease((t-a)/(b-a));
const hump=(t,a,b)=>t<=a||t>=b?0:Math.sin(Math.PI*(t-a)/(b-a));
const zero=[0,0,0];
const REST={H:zero,S:zero,T:[.035,0,0],N:zero,HD:zero,A0:[-.22,0,-.18],A1:[-.22,0,.18],E0:[-.6,0,0],E1:[-.6,0,0],W0:[.08,0,-.06],W1:[.08,0,.06],L0:[-.08,-.06,-.05],L1:[-.08,.06,.05],K0:[.2,0,0],K1:[.2,0,0],F0:zero,F1:zero,B:zero,hy:0,hx:0,hz:0,bx:0,by:0,bz:0,c0:.22,c1:.22};
function makeClip(frames){const channels=new Set(Object.keys(REST));frames.forEach(f=>Object.keys(f[1]).forEach(k=>channels.add(k)));const tracks={};for(const k of channels){const def=REST[k]??0;tracks[k]=Array.isArray(def)?[0,1,2].map(j=>frames.map(([t,p])=>[t,(p[k]??def)[j]])):frames.map(([t,p])=>[t,p[k]??def]);}return {frames,channels:[...channels],tracks};}
function strike(pre,contact,follow,settle={},hit=.43){return makeClip([[0,REST],[Math.min(.26,hit-.15),pre],[hit,contact],[hit+.105,follow],[Math.max(.8,hit+.22),settle],[1,settle.B?{...REST,B:settle.B}:REST]]);}
// Monotonic cubic Hermite curves preserve planted/contact extrema without linear stops
// or unrestricted spline overshoot. Whole turns are kept unwrapped in authored angles.
export function whipTime(u,impact=.43,anticipation=2.2,snap=3){if(u<=impact){const t=clamp(u/impact,0,1);return impact*Math.pow(t,anticipation);}const t=clamp((u-impact)/(1-impact),0,1);return impact+(1-impact)*(1-Math.pow(1-t,snap));}
export function curve(points,t){
 if(t<=points[0][0])return points[0][1];if(t>=points.at(-1)[0])return points.at(-1)[1];
 let i=0;while(i<points.length-2&&points[i+1][0]<t)i++;
 const [a,x]=points[i],[b,y]=points[i+1],h=b-a,u=(t-a)/h,d=(y-x)/h;
 const prev=i?(x-points[i-1][1])/(a-points[i-1][0]):d,next=i+2<points.length?(points[i+2][1]-y)/(points[i+2][0]-b):d;
 const slope=(l,r)=>l*r<=0?0:2*l*r/(l+r);
 const m0=slope(prev,d),m1=slope(d,next),u2=u*u,u3=u2*u;
 return (2*u3-3*u2+1)*x+(u3-2*u2+u)*h*m0+(-2*u3+3*u2)*y+(u3-u2)*h*m1;
}
function sample(clip,u){const out={};for(const k of clip.channels){const track=clip.tracks[k];out[k]=Array.isArray(REST[k])?track.map(p=>curve(p,u)):curve(track,u);}return out;}
// Right claw: planted rear foot, pelvis initiates, elbow unfolds, wrist follows through.
const clawR=strike(
 {hy:-.12,H:[.05,-.24,.06],S:[-.08,-.12,0],T:[.08,-.5,-.09],A1:[.35,-.6,.72],E1:[-1.5,0,.1],W1:[-.28,.15,.15],A0:[-.8,.2,-.25],K0:[.5,0,0],L1:[.2,0,.12],c1:.55},
 {hy:-.06,hx:-.065,H:[0,.27,-.04],S:[.03,.12,0],T:[.22,.62,.11],A1:[-1.42,.3,-.46],E1:[-.13,0,.08],W1:[.26,-.35,.08],A0:[-.42,0,-.55],L0:[-.24,0,-.08],K1:[.38,0,0],c1:.08},
 {H:[0,.34,-.03],T:[.25,.87,.13],A1:[-1.25,.9,-.55],E1:[-.42,0,0],W1:[.42,-.35,-.12],A0:[.08,0,-.35],hy:-.03},
 {H:[0,-.03,0],T:[.025,-.12,-.035],A1:[-.15,-.12,.35],E1:[-.82,0,0],W1:[-.13,0,0]},.42);
function mirrorClip(c){return makeClip(c.frames.map(([t,p])=>{const o={};for(const [k,v]of Object.entries(p)){const key=/^[AEWLKF][01]$/.test(k)||/^c[01]$/.test(k)?k.slice(0,-1)+(k.endsWith('0')?'1':'0'):k;if(Array.isArray(v))o[key]=[v[0],-v[1],-v[2]];else o[key]=(k==='hx'||k==='bx')?-v:v;}return [t,o];}));}
const kick=strike(
 {hy:-.19,H:[.04,-.4,-.13],T:[.08,-.6,.08],A0:[-.7,0,-.5],A1:[-.35,0,.6],L1:[-1.1,0,.35],K1:[1.7,0,0],K0:[.5,0,0]},
 {B:[0,3.8,0],hy:-.06,T:[-.2,.35,-.25],H:[0,.35,.1],L1:[-1.72,.15,-.95],K1:[.06,0,0],F1:[.35,0,0],A0:[-.55,0,-1.1],A1:[-.2,0,1.05],E0:[-.8,0,0],E1:[-.6,0,0]},
 {B:[0,5.4,0],T:[.15,.45,-.2],L1:[-.65,0,-.65],K1:[1.1,0,0],A0:[.1,0,-.55],A1:[-.5,0,.55]},
 {B:[0,TAU,0],hy:-.15,T:[.23,-.16,.08],K0:[.45,0,0],K1:[.5,0,0]},.52);
const hammer=strike(
 {hy:-.2,H:[-.1,-.18,0],T:[-.42,-.18,0],S:[-.12,0,0],A0:[-2.68,-.15,-.3],A1:[-2.7,.15,.3],E0:[-1.25,0,0],E1:[-1.25,0,0],K0:[.65,0,0],K1:[.45,0,0],c0:.75,c1:.75},
 {hy:-.36,bz:.09,H:[.14,.15,0],T:[.85,.18,0],S:[.16,0,0],HD:[-.2,0,0],A0:[-.45,0,-.16],A1:[-.45,0,.16],E0:[-.08,0,0],E1:[-.08,0,0],K0:[.85,0,0],K1:[.72,0,0]},
 {hy:-.4,T:[1.05,.22,0],HD:[.15,0,0],A0:[.16,0,-.25],A1:[.16,0,.25],E0:[-.25,0,0],E1:[-.25,0,0],K0:[.9,0,0],K1:[.8,0,0]},
 {hy:-.13,T:[.2,-.06,0],A0:[-.32,0,-.3],A1:[-.32,0,.3],K0:[.35,0,0],K1:[.32,0,0]},.59);
const uppercut=strike(
 {hy:-.32,hx:.09,H:[.12,-.3,0],T:[.42,-.55,-.13],A1:[.75,-.2,.33],E1:[-1.32,0,0],A0:[-1,0,-.3],L0:[-.55,0,-.08],K0:[1.05,0,0],K1:[.65,0,0],c1:.85},
 {hy:.025,hx:-.08,H:[-.12,.32,0],S:[-.12,.17,0],T:[-.35,.62,.12],A1:[-2.48,.08,.13],E1:[-.32,0,0],W1:[-.2,0,0],A0:[-.25,0,-.55],L1:[.15,0,0],K1:[.1,0,0],c1:.8},
 {hy:.06,T:[-.52,.74,.15],A1:[-2.9,.18,.27],E1:[-.7,0,0],HD:[.12,-.15,0],L0:[-.32,0,-.08]},
 {hy:-.12,T:[.13,-.16,-.03],A1:[-1.4,-.25,.42],E1:[-1.3,0,0],K0:[.5,0,0]},.5);
const cleave=strike(
 {hy:-.2,H:[0,-.55,0],T:[.12,-.7,-.12],A0:[.5,-.45,-.6],A1:[-.55,-.3,.3],E0:[-.9,0,0],E1:[-1.2,0,0]},
 {B:[0,3.65,0],H:[0,.35,0],T:[.12,.45,.05],hy:-.08,A0:[-.4,.15,-1.35],A1:[-.35,-.15,1.25],E0:[-.16,0,0],E1:[-.22,0,0],L0:[-.25,0,-.2],L1:[.25,0,.25]},
 {B:[0,5.25,0],T:[.2,.25,.1],A0:[-.25,.5,-.85],A1:[-.1,-.5,.85],E0:[-.8,0,0],E1:[-.85,0,0],hy:-.19},
 {B:[0,TAU,0],T:[.08,-.18,-.06],hy:-.09,A0:[-.45,0,-.35],A1:[-.4,0,.35]},.5);
const stomp=strike(
 {hy:-.1,hx:-.14,H:[-.08,-.2,-.1],T:[-.3,-.15,-.12],L1:[-1.85,0,.18],K1:[1.75,0,0],A0:[-.65,0,-.85],A1:[-.95,0,.55],E0:[-.7,0,0],E1:[-1,0,0]},
 {hy:-.28,hx:.08,H:[.18,.2,.06],T:[.73,.32,.08],L1:[.25,0,.1],K1:[.45,0,0],K0:[.75,0,0],A0:[.2,0,-.55],A1:[.45,0,.4],HD:[-.1,0,0]},
 {hy:-.35,T:[.9,.37,.1],L1:[.18,0,.1],K1:[.72,0,0],K0:[.82,0,0],A0:[.5,0,-.4],A1:[.6,0,.32]},
 {hy:-.15,T:[.23,-.12,0],K0:[.4,0,0],K1:[.3,0,0]},.58);
const lunge=strike(
 {hy:-.3,H:[.18,-.3,0],T:[.55,-.45,0],L0:[-1.1,0,-.06],K0:[1.5,0,0],L1:[.6,0,.08],K1:[.2,0,0],A1:[.55,-.45,.45],E1:[-1.2,0,0],A0:[-.9,0,-.35]},
 {hy:-.15,T:[.45,.52,.08],H:[.04,.28,0],A1:[-1.6,.1,-.1],E1:[-.05,0,0],W1:[.28,0,0],A0:[.55,0,-.3],L0:[-.55,0,-.06],K0:[.45,0,0],L1:[.55,0,.08],K1:[.1,0,0]},
 {hy:-.29,T:[.67,.67,.12],A1:[-1.4,.25,-.25],E1:[-.25,0,0],L0:[-.7,0,-.06],K0:[1.12,0,0],L1:[.32,0,.08]},
 {hy:-.12,T:[.13,-.15,-.03],A1:[-.65,-.1,.22],E1:[-1.1,0,0]},.4);
const aerial=strike(
 {by:.55,hy:-.2,T:[-.15,-.55,0],H:[0,-.22,0],L0:[-1.1,0,-.15],L1:[-.45,0,.2],K0:[1.7,0,0],K1:[1.3,0,0],A1:[.25,-.4,.65],E1:[-1.3,0,0],A0:[-1.2,0,-.55]},
 {by:1.3,B:[0,2.1,0],T:[.08,.7,-.15],H:[0,.4,0],A1:[-1.65,.1,-.5],E1:[-.1,0,0],A0:[-.5,0,-1],L0:[-.5,0,-.15],L1:[-1.2,0,.15],K0:[1.1,0,0],K1:[1.7,0,0]},
 {by:1.05,B:[0,3.5,0],T:[.25,.4,.08],A1:[-1.2,.8,-.4],E1:[-.65,0,0],L0:[-.65,0,-.1],L1:[-.5,0,.1],K0:[1.3,0,0],K1:[.9,0,0]},
 {B:[0,TAU,0],by:.1,hy:-.28,T:[.38,-.12,0],K0:[.9,0,0],K1:[.85,0,0],A0:[.15,0,-.55],A1:[.25,0,.55]},.43);
const slam=makeClip([[0,REST],[.22,{by:.8,hy:-.2,T:[-.38,-.12,0],A0:[-2.5,0,-.4],A1:[-2.6,0,.4],E0:[-1.2,0,0],E1:[-1.2,0,0],L0:[-1.1,0,-.1],L1:[-.7,0,.1],K0:[1.5,0,0],K1:[1.4,0,0]}],[.43,{by:1.55,T:[-.22,.1,0],A0:[-2.9,0,-.25],A1:[-2.9,0,.25],E0:[-.7,0,0],E1:[-.7,0,0],L0:[-.8,0,0],K0:[1.3,0,0],K1:[1.2,0,0]}],[.6,{by:0,hy:-.42,T:[.92,.18,0],A0:[-.3,0,-.2],A1:[-.3,0,.2],E0:[-.15,0,0],E1:[-.15,0,0],K0:[1.05,0,0],K1:[1,0,0],L0:[-.45,0,-.1],L1:[-.4,0,.1]}],[.7,{hy:-.45,T:[1.05,.2,0],HD:[.15,0,0],A0:[.12,0,-.35],A1:[.12,0,.35],K0:[1.1,0,0],K1:[1.05,0,0]}],[.89,{hy:-.17,T:[.25,-.05,0],A0:[-.3,0,-.45],A1:[-.3,0,.45]}],[1,REST]]);
const charge=makeClip([[0,REST],[.35,{hy:-.19,H:[.1,-.25,0],T:[.2,-.5,-.08],A1:[.3,-.35,.55],E1:[-1.2,0,0],A0:[-.7,0,-.4],c1:.8}],[.8,{hy:-.32,H:[.12,-.42,-.05],T:[.37,-.65,-.1],A1:[.65,-.45,.65],E1:[-1.55,0,0],A0:[-.95,0,-.4],K0:[.9,0,0],K1:[.7,0,0],c0:.65,c1:.95}],[1,{hy:-.34,H:[.12,-.44,-.05],T:[.4,-.67,-.1],A1:[.68,-.45,.67],E1:[-1.58,0,0],A0:[-.98,0,-.4],K0:[.92,0,0],K1:[.72,0,0],c0:.65,c1:.95}]]);
const parry=makeClip([[0,REST],[.14,{hy:-.16,H:[.05,-.08,0],T:[.12,-.17,0],A0:[-1.16,.25,.65],A1:[-1.1,-.25,-.6],E0:[-1.7,0,0],E1:[-1.62,0,0],W0:[-.22,0,.25],W1:[-.22,0,-.25],c0:.6,c1:.6,K0:[.6,0,0],K1:[.4,0,0]}],[.58,{hy:-.18,T:[.18,-.1,0],A0:[-1.2,.25,.68],A1:[-1.15,-.25,-.62],E0:[-1.75,0,0],E1:[-1.7,0,0],c0:.6,c1:.6,K0:[.65,0,0],K1:[.42,0,0]}],[.82,{hy:-.08,T:[-.035,.08,0],A0:[-.65,.08,-.14],A1:[-.6,-.08,.14],E0:[-1.1,0,0],E1:[-1.05,0,0]}],[1,REST]]);
const dodge=makeClip([[0,REST],[.13,{hy:-.31,T:[.4,0,0],A0:[-.55,0,-.38],A1:[-.5,0,.38],L0:[-.9,0,0],K0:[1.1,0,0],L1:[.15,0,.1],K1:[.65,0,0]}],[.37,{hy:-.19,T:[.65,-.12,0],A0:[.65,0,-.18],A1:[.8,0,.18],E0:[-.95,0,0],E1:[-.8,0,0],L0:[-.55,0,0],K0:[1.4,0,0],L1:[.65,0,0],K1:[.16,0,0]}],[.67,{hy:-.31,T:[.32,.15,0],A0:[-.7,0,-.4],A1:[-.45,0,.4],L0:[-.75,0,0],K0:[.9,0,0],L1:[.4,0,0],K1:[.3,0,0]}],[.82,{hy:-.28,T:[.48,.1,0],A0:[-.3,0,-.55],A1:[-.15,0,.55],L0:[-.35,0,-.05],K0:[.9,0,0],K1:[.6,0,0]}],[1,REST]]);
const tether=strike({hy:-.17,H:[0,-.24,0],T:[.1,-.35,0],A0:[.1,.35,-.5],E0:[-1.1,0,0],A1:[-.65,0,.25],c0:.55},{hy:-.1,H:[0,.22,0],T:[.18,.35,0],A0:[-1.5,-.15,-.16],E0:[-.05,0,0],W0:[.26,0,.1],A1:[.35,0,.45],c0:.08},{hy:-.25,H:[0,-.26,0],T:[-.28,-.4,-.1],A0:[-.6,.3,-.65],E0:[-1.6,0,0],A1:[-.75,0,.35],c0:.9},{hy:-.13,T:[-.05,-.14,0],A0:[-.6,.2,-.35],E0:[-1.05,0,0]},.3);
const ascend=makeClip([[0,REST],[.18,{hy:-.4,T:[.45,0,0],A0:[-.8,0,.7],A1:[-.8,0,-.7],E0:[-1.8,0,0],E1:[-1.8,0,0],HD:[.25,0,0],K0:[1,0,0],K1:[1,0,0]}],[.42,{by:.25,hy:.05,T:[-.36,0,0],A0:[-1.2,0,-1.35],A1:[-1.2,0,1.35],E0:[-.1,0,0],E1:[-.1,0,0],HD:[-.32,0,0],c0:0,c1:0,L0:[.14,0,-.2],L1:[.14,0,.2]}],[.67,{by:.18,T:[-.17,0,0],A0:[-.8,0,-1],A1:[-.8,0,1],E0:[-.5,0,0],E1:[-.5,0,0]}],[.85,{hy:-.23,T:[.22,0,0],K0:[.8,0,0],K1:[.8,0,0],A0:[-.4,0,-.5],A1:[-.4,0,.5]}],[1,REST]]);
// New combat branches have their own loading and contact silhouettes.
const sweep=strike({hy:-.3,T:[.25,-.7,-.15],L1:[-.7,0,.3],K1:[1.1,0,0],A0:[-.6,0,-.6],A1:[.3,0,.7]},{hy:-.45,T:[.4,.6,.18],L1:[-.8,.35,-1.15],K1:[.08,0,0],A0:[.2,0,-.7],A1:[-.7,0,.4]},{hy:-.35,T:[.3,.8,.15],L1:[.2,.2,-.7],K1:[.6,0,0]},{hy:-.15},.5);
const hook=strike({hy:-.15,T:[.15,-.4,0],A1:[-1.5,0,.25],E1:[-.1,0,0],A0:[-.7,0,-.5]},{hy:-.27,T:[-.23,.5,0],A1:[-.45,.35,.5],E1:[-1.65,0,0],A0:[-1.0,0,-.3]},{hy:-.22,T:[-.3,.65,0],A1:[-.3,.4,.6],E1:[-1.75,0,0]},{hy:-.1,A0:[-.9,0,-.3],E0:[-1.1,0,0]},.43);
const knee=strike({hy:-.2,T:[.2,0,0],A0:[-1.3,0,-.3],A1:[-1.3,0,.3],E0:[-.8,0,0],E1:[-.8,0,0],L1:[.3,0,0],K1:[.7,0,0]},{hy:.07,T:[-.25,-.15,0],L1:[-1.9,0,-.1],K1:[1.65,0,0],A0:[-.8,0,-.3],A1:[-.8,0,.3],E0:[-1.5,0,0],E1:[-1.5,0,0]},{hy:-.1,T:[.35,.15,0],L1:[-1.3,0,.1],K1:[1.1,0,0]},{hy:-.15},.46);
const groundstrike=strike({hy:-.15,T:[-.12,0,0],L1:[-1.8,0,.1],K1:[1.3,0,0],A0:[-.5,0,-.6],A1:[-.4,0,.7]},{hy:-.34,T:[.65,-.1,0],L1:[-.7,0,.05],K1:[.08,0,0],A0:[.15,0,-.4],A1:[.2,0,.45]},{hy:-.4,T:[.8,.1,0],L1:[-.25,0,0],K1:[.6,0,0]},{hy:-.1},.52);
const riposte=strike({hy:-.22,T:[.1,-.6,0],A0:[-.95,0,-.7],A1:[.4,0,.4],E0:[-.4,0,0],E1:[-1.4,0,0]},{hy:-.1,T:[.28,.62,0],A1:[-1.65,.3,-.25],E1:[-.06,0,0],A0:[-.4,0,-.5]},{hy:-.22,T:[.42,.82,0],A1:[-1.2,.4,-.4],E1:[-.35,0,0]},{hy:-.12},.42);
const guardPose={hy:-.16,T:[.15,-.13,0],A0:[-1.03,-.2,-.28],A1:[-1.1,.18,.28],E0:[-1.7,0,0],E1:[-1.65,0,0],c0:.8,c1:.8};
const guard=makeClip([[0,guardPose],[1,guardPose]]),getup=makeClip([[0,{hy:-.76,T:[.72,.1,.1],A0:[-.6,0,-.4],E0:[-.1,0,0],L0:[-1.1,0,-.2],L1:[-.8,0,.1],K0:[1.8,0,0],K1:[1.5,0,0]}],[.45,{hy:-.52,T:[.45,0,.08],L0:[-.95,0,-.1],L1:[-.6,0,.1],K0:[1.5,0,0],K1:[1.1,0,0],A0:[-.7,0,-.3],A1:[-.7,0,.3]}],[.8,{hy:-.17,T:[.2,0,0],K0:[.6,0,0],K1:[.5,0,0]}],[1,REST]]);
export function beginRecovery(r){r.rise={t:0,from:Object.entries(joints(r)).map(([k,n])=>({k,node:n,q:n.quaternion.clone(),p:n.position.clone()}))};resetMotion(r);}
export function recoverMotion(r,dt){const rise=r.rise;rise.t+=dt;poseMotion(r,r.phase,0,{type:'getup',t:rise.t,duration:.9});const w=ramp(rise.t,0,.28);for(const f of rise.from){f.node.quaternion.slerpQuaternions(f.q,f.node.quaternion.clone(),w);f.node.position.lerpVectors(f.p,f.node.position.clone(),w);}if(rise.t>=.9)r.rise=null;}
export const MOTION_IMPACTS={crusher:.59,riftstrike:.42,flowburst:.5,guardbreak:.4,sweep:.5,hook:.43,knee:.46,groundstrike:.52,riposte:.42,heavy:.5,cleave:.5,stomp:.58,slam:.6,charged:.59,lunge:.4,aerial:.43};
export function impactAt(a){return a.type==='light'?[0,.42,.42,.52,.59][a.step]||.42:MOTION_IMPACTS[a.type]||.4;}
const guardbreak=strike(
 {hy:-.24,hx:.08,H:[.08,-.3,.08],T:[.24,-.55,-.16],A0:[-1.3,.15,-.3],A1:[-.4,-.4,.75],E0:[-1.5,0,0],E1:[-1.7,0,0],L0:[-.42,0,-.12],K0:[.72,0,0],K1:[.55,0,0]},
 {hy:-.08,hz:.17,H:[.1,.32,-.08],T:[.42,.65,.16],A0:[-.85,.15,-.8],A1:[-1.4,.35,.2],E0:[-1.1,0,0],E1:[-1.15,0,0],L1:[.22,0,.1],K0:[.45,0,0],c1:.9},
 {hy:-.17,T:[.48,.77,.12],A1:[-1.3,.45,.3],E1:[-.9,0,0],K0:[.58,0,0]},
 {hy:-.09,T:[.12,.08,0],A0:[-1,0,-.3],A1:[-.8,0,.3],E0:[-1.4,0,0],E1:[-1.4,0,0]},.4);
// Enemy Step is a directional rebound, not a second full spinning aerial attack.
const enemyStep=makeClip([[0,{hy:-.12,T:[.22,0,0],A0:[-.6,0,-.55],A1:[-.7,0,.45]}],[.18,{hy:-.22,T:[.35,-.12,0],L0:[-1.3,0,-.1],K0:[1.7,0,0],L1:[-.25,0,.08],K1:[.45,0,0],A0:[-.9,0,-.7],A1:[-.5,0,.7]}],[.4,{by:.65,T:[-.18,.14,0],L0:[-.35,0,-.08],K0:[.18,0,0],L1:[-1.05,0,.13],K1:[1.5,0,0],A0:[-.3,0,-.9],A1:[-.5,0,.85]}],[.65,{by:.9,T:[.05,.08,0],L0:[-.65,0,0],L1:[-.45,0,.1],K0:[1.2,0,0],K1:[.9,0,0],A0:[.1,0,-.6],A1:[.2,0,.6]}],[.87,{by:.1,hy:-.25,T:[.3,0,0],K0:[.85,0,0],K1:[.7,0,0]}],[1,REST]]);
const phoenix=makeClip([[0,{hy:-.22,T:[.5,0,0],A0:[.55,0,-.4],A1:[.55,0,.4],K0:[.7,0,0],K1:[.65,0,0]}],[.25,{by:1.05,T:[.2,0,0],A0:[-2.3,0,-.45],A1:[-2.3,0,.45],E0:[-.7,0,0],E1:[-.7,0,0],L0:[-1.1,0,-.1],L1:[-.9,0,.1],K0:[1.6,0,0],K1:[1.4,0,0]}],[.39,{by:1.2,T:[-.1,0,0],A0:[-2.7,0,-.3],A1:[-2.7,0,.3],K0:[1.25,0,0],K1:[1.15,0,0]}],[.52,{hy:-.38,T:[.8,0,0],A0:[-.4,0,-.3],A1:[-.4,0,.3],E0:[-.1,0,0],E1:[-.1,0,0],K0:[.9,0,0],K1:[.85,0,0]}],[.62,{hy:-.42,T:[.9,0,0],A0:[.1,0,-.5],A1:[.1,0,.5],K0:[1,0,0],K1:[.95,0,0]}],[.85,{hy:-.15,T:[.25,0,0]}],[1,REST]]);
const clips={crusher:hammer,riftstrike:mirrorClip(clawR),flowburst:cleave,enemystep:enemyStep,phoenix,guardbreak,sweep,hook,knee,groundstrike,riposte,guard,getup,light1:clawR,light2:mirrorClip(clawR),light3:kick,light4:hammer,heavy:uppercut,cleave,stomp,slam,charged:hammer,lunge,aerial,parry,charge,dodge,fireDash:dodge,tether,ascend};

// Fifteen individual silhouettes, not one clip per school. Contact/release frames are
// shared with gameplay dispatch, so the projectile/pulse doesn't precede the gesture.
const spellPoses=[
 [{T:[.12,-.5,0],A1:[.3,-.45,.45],E1:[-1.6,0,0],A0:[-.6,0,-.3],c1:.8},{T:[.25,.48,.08],A1:[-1.6,0,-.12],E1:[-.04,0,0],W1:[.35,0,0],A0:[.35,0,-.4],c1:0}],
 [{hy:-.22,T:[.2,-.5,0],A0:[-.8,-.4,-.5],A1:[-.8,-.4,.5],E0:[-1.6,0,0],E1:[-1.6,0,0]},{T:[.2,.4,0],A0:[-1.35,.35,-.95],A1:[-1.35,-.35,.95],E0:[-.12,0,0],E1:[-.12,0,0],c0:0,c1:0}],
 [{hy:-.1,T:[-.2,-.25,0],A1:[-2.75,0,.35],E1:[-.35,0,0],A0:[-.8,0,-.6],HD:[-.3,0,0]},{hy:-.25,T:[.55,.35,0],A1:[-.35,0,.15],E1:[-.3,0,0],A0:[.25,0,-.7],HD:[.13,0,0],c1:.85}],
 [{hy:-.3,T:[.6,-.22,0],A0:[.3,0,-.3],A1:[.6,0,.3],L0:[-.85,0,0],K0:[1.3,0,0]},{hy:-.16,T:[.65,.12,0],A0:[.75,0,-.2],A1:[.9,0,.2],L0:[-.45,0,0],L1:[.55,0,0]}],
 [{hy:-.17,T:[.12,-.4,0],A0:[-.8,-.4,-.9],A1:[-1.7,.4,.5],E0:[-1.4,0,0],E1:[-.4,0,0]},{T:[.22,.65,0],A0:[-1.7,.5,-.2],A1:[-.5,-.7,1],E0:[-.3,0,0],E1:[-.65,0,0],H:[0,.25,0]}],
 [{hy:-.38,T:[.6,0,0],A0:[-.7,0,.65],A1:[-.7,0,-.65],E0:[-1.75,0,0],E1:[-1.75,0,0],HD:[.35,0,0],c0:.9,c1:.9},{hy:.035,T:[-.3,0,0],A0:[-.5,0,-1.3],A1:[-.5,0,1.3],E0:[-.1,0,0],E1:[-.1,0,0],HD:[-.15,0,0],c0:0,c1:0}],
 [{T:[-.12,-.25,0],A1:[-1.2,.3,.5],E1:[-2,0,0],W1:[-.3,0,.15],A0:[-.3,0,-.3],HD:[-.08,-.1,0]},{T:[.13,.3,0],A1:[-1.5,-.15,.04],E1:[-.04,0,0],W1:[.3,0,0],A0:[.2,0,-.45],c1:.05}],
 [{hy:-.2,T:[.26,-.25,0],A1:[-.75,0,.3],E1:[-.4,0,0],A0:[-.9,0,-.65],c1:0},{hy:.04,T:[-.24,.18,0],A1:[-2.1,.1,.2],E1:[-.7,0,0],W1:[-.4,0,0],A0:[-1.2,0,-.7],E0:[-1.2,0,0],c1:.9}],
 [{T:[-.2,0,0],A0:[-.9,0,-1.1],A1:[-.9,0,1.1],E0:[-1.4,0,0],E1:[-1.4,0,0],c0:0,c1:0},{hy:-.26,T:[.35,0,0],A0:[-1.1,.2,.6],A1:[-1.1,-.2,-.6],E0:[-.3,0,0],E1:[-.3,0,0],c0:.9,c1:.9}],
 [{hy:-.16,T:[.3,0,0],A0:[-1.2,0,-.9],A1:[-1.2,0,.9],E0:[-2.2,0,0],E1:[-2.2,0,0],W0:[-.3,0,0],W1:[-.3,0,0],HD:[.2,0,0]},{T:[-.3,0,0],A0:[-.65,0,-1.45],A1:[-.65,0,1.45],E0:[-.15,0,0],E1:[-.15,0,0],HD:[-.2,0,0],c0:0,c1:0}],
 [{T:[.15,-.4,0],A0:[-1.4,.3,-.5],A1:[-.6,0,.9],E0:[-.6,0,0],E1:[-1.5,0,0],W0:[.5,0,0],c0:0},{T:[-.14,.35,0],A0:[-1.6,0,-.8],A1:[-1.15,0,1.1],E0:[-.1,0,0],E1:[-.6,0,0],W0:[.45,0,-.2],W1:[.2,0,.2],c0:0,c1:0}],
 [{T:[.2,-.25,0],A0:[-.9,0,.7],A1:[-1.05,0,-.65],E0:[-1.2,0,0],E1:[-1.15,0,0],c0:.65,c1:.65},{T:[.1,.3,0],A0:[-1.25,.2,-1],A1:[-1.4,-.2,1],E0:[-.12,0,0],E1:[-.15,0,0],c0:0,c1:0}],
 [{hy:-.22,T:[.3,0,0],A0:[-.8,0,.8],A1:[-.8,0,-.8],E0:[-1.8,0,0],E1:[-1.8,0,0],HD:[.25,0,0]},{hy:.045,T:[-.28,0,0],A0:[.2,0,-.75],A1:[.2,0,.75],E0:[-.3,0,0],E1:[-.3,0,0],HD:[-.22,0,0],c0:0,c1:0}],
 [{hy:-.14,T:[.1,0,0],A0:[-1.3,0,-1.1],A1:[-1.3,0,1.1],E0:[-.35,0,0],E1:[-.35,0,0],c0:0,c1:0},{hy:-.1,T:[-.18,0,0],A0:[-.8,0,.6],A1:[-.8,0,-.6],E0:[-1.85,0,0],E1:[-1.85,0,0],c0:.85,c1:.85}],
 [{hy:-.35,T:[.65,0,0],A0:[-.15,0,-.5],A1:[-.15,0,.5],E0:[-.35,0,0],E1:[-.35,0,0],HD:[.3,0,0]},{hy:.04,T:[-.28,0,0],A0:[-2.15,0,-.95],A1:[-2.15,0,.95],E0:[-.55,0,0],E1:[-.55,0,0],HD:[-.25,0,0],c0:0,c1:0}]
];
export const CAST_RELEASES=[.36,.43,.46,.32,.44,.46,.34,.42,.44,.4,.42,.4,.38,.46,.47,.4,.42,.46,.38,.36,.43,.46,.4,.42];
// Nine added powers now have their own windup/contact silhouettes, not copies
// of the original fifteen with only a torso twist. Release clocks are unchanged.
spellPoses.push(
 [{hy:-.13,H:[0,-.28,0],T:[.15,-.55,0],A1:[.4,-.4,.35],E1:[-1.5,0,0],A0:[-1.05,.2,-.4],c1:.8},{hy:-.09,H:[0,.25,0],T:[.28,.5,.06],A1:[-1.62,.05,-.06],E1:[-.04,0,0],A0:[.35,0,-.4],c1:.15}],
 [{hy:-.3,T:[.32,-.15,0],A0:[-1.2,0,-.3],E0:[-1.5,0,0],A1:[-.35,0,.4],K0:[.9,0,0],c0:.8},{hy:-.38,T:[.68,.12,0],A0:[-.32,0,-.16],E0:[-.08,0,0],W0:[-.35,0,0],A1:[.5,0,.5],K0:[1.1,0,0],c0:0}],
 [{hy:-.15,T:[.1,0,0],A0:[-1.05,.15,.5],A1:[-1.05,-.15,-.5],E0:[-1.75,0,0],E1:[-1.75,0,0],c0:.8,c1:.8},{hy:-.22,T:[.18,0,0],A0:[-1.35,.15,-.4],A1:[-1.35,-.15,.4],E0:[-.85,0,0],E1:[-.85,0,0],W0:[.25,0,0],W1:[.25,0,0],c0:.1,c1:.1}],
 [{hy:-.28,T:[.42,0,0],A0:[.5,0,-.35],A1:[.5,0,.35],L0:[-.4,0,-.1],K0:[.9,0,0],K1:[.8,0,0]},{hy:.025,T:[-.22,0,0],A0:[-2.0,0,-.6],A1:[-2.0,0,.6],E0:[-.3,0,0],E1:[-.3,0,0],c0:.1,c1:.1}],
 [{hy:-.12,T:[-.08,-.16,0],A0:[-.85,0,-.4],A1:[-.85,0,.4],E0:[-1.85,0,0],E1:[-1.85,0,0],W0:[.4,0,0],W1:[.4,0,0]},{hy:-.22,T:[.28,.1,0],A0:[-1.52,0,-.18],A1:[-1.52,0,.18],E0:[-.06,0,0],E1:[-.06,0,0],W0:[.45,0,0],W1:[.45,0,0],c0:0,c1:0}],
 [{T:[.05,-.25,0],A0:[-1.3,.2,-.3],E0:[-1.25,0,0],A1:[-.6,-.2,.55],E1:[-1.5,0,0],c0:.15,c1:.8},{T:[.12,.35,0],A0:[-1.8,.45,-.45],E0:[-.2,0,0],A1:[-1.1,-.2,.85],E1:[-.5,0,0],W0:[.3,0,-.25],c0:0,c1:.15}],
 [{hy:-.08,T:[.1,0,0],A0:[-1.0,.3,.25],A1:[-1.0,-.3,-.25],E0:[-1.5,0,0],E1:[-1.5,0,0],W0:[-.2,.35,0],W1:[-.2,-.35,0],c0:.3,c1:.3},{hy:-.1,T:[-.1,0,0],A0:[-1.3,.2,-.9],A1:[-1.3,-.2,.9],E0:[-.4,0,0],E1:[-.4,0,0],W0:[.4,.5,0],W1:[.4,-.5,0],c0:0,c1:0}],
 [{hy:-.09,T:[.1,.3,0],A0:[-1.45,-.15,-.2],E0:[-.3,0,0],A1:[-.4,0,.4],E1:[-1,0,0],c0:0},{hy:-.14,T:[-.15,-.4,-.04],A0:[-.65,.4,-.45],E0:[-1.6,0,0],W0:[-.15,.25,0],A1:[-1.05,-.2,.4],E1:[-.9,0,0],c0:1,c1:.3}],
 [{hy:-.12,T:[.12,-.18,0],A0:[-1.1,.2,.55],A1:[-1.1,-.2,-.55],E0:[-1.65,0,0],E1:[-1.65,0,0],c0:.75,c1:.75},{hy:-.13,T:[.08,.15,0],A0:[-1.15,.2,-.7],A1:[-1.35,-.2,.7],E0:[-1.15,0,0],E1:[-.85,0,0],W0:[.25,0,0],W1:[.25,0,0],c0:.05,c1:.05}]
);
const spellClips=spellPoses.map(([pre,hit],i)=>{const follow=structuredClone(hit);follow.T=[(hit.T?.[0]||0)-.09,(hit.T?.[1]||0)*1.12,hit.T?.[2]||0];for(const k of ['E0','E1'])if(hit[k])follow[k]=[hit[k][0]-.16,hit[k][1],hit[k][2]];return strike(pre,hit,follow,{hy:-.09,T:[.1,0,0]},CAST_RELEASES[i]);});
const enemyClips={revenant:strike({hy:-.17,T:[-.2,-.45,-.1],A1:[-2.35,-.3,.6],E1:[-1.05,0,0],A0:[-.8,0,-.35]},{hy:-.25,T:[.65,.5,.13],A1:[-.6,.25,-.25],E1:[-.1,0,0],A0:[.2,0,-.7]},{hy:-.32,T:[.8,.67,.18],A1:[.3,.5,-.45],E1:[-.4,0,0]},{hy:-.16,T:[.23,-.16,-.06],E1:[-1.3,0,0]},.525),warden:strike({hy:-.3,T:[-.28,-.2,0],A1:[-2.75,0,.18],E1:[-.9,0,0],A0:[-1.2,0,-.3],K0:[.8,0,0],K1:[.65,0,0]},{hy:-.4,T:[.8,.3,0],A1:[.2,.1,.25],E1:[-.15,0,0],A0:[.25,0,-.7],K0:[.9,0,0],K1:[1.05,0,0]},{hy:-.45,T:[1,.35,0],A1:[.45,.2,.4],K0:[1,0,0],K1:[1.15,0,0]},{hy:-.2,T:[.35,-.1,0],A1:[-.25,0,.3],E1:[-1,0,0]},.525),stalker:strike({hy:-.36,T:[.55,-.6,0],A0:[.5,-.3,-.7],A1:[.65,-.35,.75],E0:[-1.1,0,0],E1:[-1.2,0,0],L0:[-.6,0,0],K0:[1,0,0]},{hy:-.17,T:[.58,.45,0],A0:[-1.65,.25,-.15],A1:[-1.45,.3,.15],E0:[-.1,0,0],E1:[-.12,0,0],L1:[.6,0,0],K1:[.2,0,0]},{hy:-.35,T:[.8,.65,0],A0:[-.6,.65,.4],A1:[-1,.65,-.4],E0:[-.7,0,0],E1:[-.45,0,0]},{hy:-.2,T:[.3,-.25,0],A0:[-.5,0,-.55],A1:[-.5,0,.55]},.525)};

const mirroredEnemies=Object.fromEntries(Object.entries(enemyClips).map(([k,c])=>[k,mirrorClip(c)]));
const states=new WeakMap();let serial=0;
function joints(r){return {H:r.hips,S:r.spine,T:r.torso,N:r.neck,HD:r.head,A0:r.arms[0],A1:r.arms[1],E0:r.forearms[0],E1:r.forearms[1],W0:r.hands[0],W1:r.hands[1],L0:r.legs[0],L1:r.legs[1],K0:r.shins[0],K1:r.shins[1],F0:r.feet?.[0],F1:r.feet?.[1],B:r.rig};}
function state(r){let m=states.get(r);if(!m){const nodes=joints(r);m={seed:(serial++*.731)%TAU,nodes,phase:0,speed:0,turn:0,lastYaw:r.root.rotation.y,position:r.root.position.clone(),velocity:new THREE.Vector3(),oldVelocity:new THREE.Vector3(),localVelocity:new THREE.Vector3(),springs:{},key:null,transition:0,previous:null,blendFrom:null,feet:[{},{}],hit:null,request:{kind:'idle'},age:0};states.set(r,m);}return m;}
export function resetMotion(r){states.delete(r);r.motionCache=null;}
function apply(r,p){const m=state(r);r.toes?.forEach(n=>n.rotation.set(0,0,0));r.arms.forEach(a=>{if(a.userData.bindPosition)a.position.copy(a.userData.bindPosition)});for(const [k,n]of Object.entries(m.nodes)){if(n){const v=p[k]??REST[k];n.rotation.set(...v);}}r.hips.position.set(p.hx||0,r.baseHip+(p.hy||0),p.hz||0);r.rig.position.set(p.bx||0,p.by||0,p.bz||0);r.torso.scale.set(1,1,1);for(let i=0;i<2;i++)r.fingers?.[i]?.forEach((f,j)=>{f.rotation.x=-(p['c'+i]??.22)*(j===4?.75:1);f.rotation.z=(j-1.5)*.025;});}
export function poseMotion(r,time,moving=0,attack=null){
 if(r.jaw)r.jaw.rotation.x=.04+Math.sin(time*2.1)*.025+(attack?.type==='cast'?.22:attack?.type==='guardbreak'?.14:0);
 const m=state(r);m.request={kind:attack?attack.type:'locomotion',attack,moving,time,manual:false};
 let key=attack?.type;if(key==='light')key+=''+attack.step;
 const u=attack?clamp(attack.t/(attack.type==='charge'?1.2:attack.duration),0,1):0;
 const c=attack?.type==='cast'?spellClips[attack.powerIndex??0]:clips[key];
 const whip=attack&&!['dodge','fireDash','guard','charge','getup','tether','enemystep','ascend'].includes(attack.type),wi=attack?(attack.type==='cast'?CAST_RELEASES[attack.powerIndex??0]:impactAt(attack)):0;apply(r,c?sample(c,whip?whipTime(u,Math.min(wi,.9)):u):REST);
 const breath=Math.sin(time*1.75+m.seed),sway=Math.sin(time*.63+m.seed);
 if(!attack){r.hips.position.y-=.035;r.hips.position.x=.015*sway;r.hips.rotation.z=.016*sway;r.spine.rotation.x=.018*breath;r.torso.rotation.y=.025*Math.sin(time*.8+m.seed);r.torso.scale.y=1+breath*.008;r.neck.rotation.y=.07*Math.sin(time*.47+m.seed);r.head.rotation.x=.02*breath;r.arms.forEach((a,i)=>{a.rotation.z+=(i?1:-1)*.015*breath;});}
 // Drive the torso turn through the pelvis/spine and keep the gaze on the
 // opponent. This is player-action posing only, never an overlay on executions.
 if(attack&&attack.type!=='getup'){
  r.hips.rotation.y+=r.torso.rotation.y*.10;r.spine.rotation.y+=r.torso.rotation.y*.10;
  r.neck.rotation.y-=r.torso.rotation.y*.23;r.neck.rotation.x-=r.torso.rotation.x*.12;
  const load=Math.sin(Math.PI*u);
  if(attack.stance===1){r.hips.position.y-=.045*load;r.torso.rotation.x+=.04*load;}
  if(attack.stance===2){r.hips.rotation.y-=.065*load;r.neck.rotation.y+=.04*load;}
 }
 if(attack&&['light','heavy','cleave','hook','knee','riposte','guardbreak'].includes(attack.type)){const v=m.seed*7.13+(attack.step||1)*1.91,w=hump(u,0,.92);r.torso.rotation.y+=Math.sin(v)*.038*w;r.neck.rotation.y+=Math.cos(v)*.018*w;r.hips.position.x+=Math.sin(v*.7)*.012*w;}
 if(attack&&whip){const rush=clamp(((attack.entrySpeed??m.speed)-3.4)/4,0,1)*clamp(1-u/(Math.min(wi,.9)*.9),0,1);if(rush>0){r.hips.position.y-=.105*rush;r.hips.position.z+=.028*rush;r.torso.rotation.x+=.12*rush;r.spine.rotation.x+=.05*rush;}}
 if(attack?.type==='crusher'){r.torso.rotation.y+=Math.sin(u*Math.PI)*.35;r.arms[0].rotation.z-=.2*Math.sin(u*Math.PI);}if(attack?.type==='riftstrike'){r.torso.rotation.y-=Math.sin(u*Math.PI)*.5;r.hips.rotation.y-=Math.sin(u*Math.PI)*.2;}
 if(attack?.type==='enemystep'&&attack.entryHeight!==undefined)r.rig.position.y=attack.entryHeight*(1-ramp(u,.55,1))+.45*Math.sin(u*Math.PI);
 if(attack?.type==='aerial')r.rig.position.y*=clamp((attack.target?.root.position.y||1.5)/1.8,.65,2.5);
 if(attack?.type==='dodge'&&attack.localDir){const d=attack.localDir;r.rig.rotation.z-=d.x*.3*hump(u,.05,.95);r.torso.rotation.z-=d.x*.18*hump(u,0,1);if(d.z<-.4){r.torso.rotation.x*=-.38;r.legs.forEach(l=>l.rotation.x*=-.65);}if(Math.abs(d.x)>.5){r.legs[0].rotation.z-=d.x*.35*hump(u,.1,.8);r.legs[1].rotation.z-=d.x*.35*hump(u,.15,.85);}}
 if(attack?.type==='cast'){const release=CAST_RELEASES[attack.powerIndex??0],recoil=u>release?Math.sin(Math.min(1,(u-release)/.24)*Math.PI)*Math.exp(-(u-release)*3):0;r.spine.rotation.x-=recoil*.055;r.neck.rotation.x+=recoil*.065;r.hips.position.y-=recoil*.018;r.hands[1].rotation.z+=recoil*(attack.school==='mind'?.14:.08);}
 if(attack?.overcast){const load=hump(u,0,CAST_RELEASES[attack.powerIndex??0]);r.hips.position.y-=.17*load;r.spine.rotation.x-=.12*load;r.forearms.forEach(a=>a.rotation.x-=.25*load);}
 if(attack?.type==='fireDash'){r.rig.position.y+=.12*hump(u,.1,.85);r.torso.rotation.x+=.16;}
 if(attack?.type==='tether'&&u>.35){const pull=ramp(u,.35,.73)*(1-ramp(u,.8,1));r.torso.rotation.x-=.3*pull;r.arms[0].rotation.x+=.65*pull;r.forearms[0].rotation.x-=1.05*pull;}
}
export function poseEnemyAction(r){
 if(!['windup','strike','recover'].includes(r.state))return;
 let u=r.state==='windup'?.42*(1-r.timer/(r.windupDuration||(r.small?.6:r.elite?.95:.82))):r.state==='strike'?.42+.24*(1-r.timer/.32):.66+.34*(1-r.timer/(r.recoverDuration||(r.small?.65:r.elite?.85:1.2)));u=clamp(u,0,1);
 const library=r.attackVariant%2?mirroredEnemies:enemyClips;let c=r.caster?spellClips[6]:r.elite?library.warden:(r.stalker||r.small)?library.stalker:library.revenant;
 apply(r,sample(c,whipTime(r.caster?u*CAST_RELEASES[6]/.525/.525:u,.525)));state(r).request={kind:'enemy-'+r.state,time:r.phase,moving:0,manual:false};
 if(!r.caster){const coil=Math.sin(Math.min(1,u/.525)*Math.PI);r.hips.rotation.y-=r.torso.rotation.y*.22;r.spine.rotation.y+=r.torso.rotation.y*.15;r.neck.rotation.y-=r.torso.rotation.y*.25;r.hips.position.y-=coil*.045;}
 if(r.caster){r.rig.position.y=.18+Math.sin(r.phase*2)*.06;r.legs.forEach(l=>l.rotation.x=.2);r.arms[0].rotation.x-=.35;}
}
export function poseBossMotion(r,m){
 if(!m)return;if(m.kind==='reap'){const t=m.stage==='windup'?.28*clamp(m.t/m.duration,0,1):m.stage==='recover'?.80+.20*clamp(m.t/1.2,0,1):curve(r.enraged?[[0,.28],[.42,.42],[.60,.83],[.67,.28],[.83,.42],[1,.83]]:[[0,.28],[.42,.42],[1,.83]],clamp(m.t/1.15,0,1));apply(r,sample(clawR,t));r.hips.position.y-=.12;r.torso.rotation.y*=1.15;state(r).request={kind:'boss-reap-'+m.stage,time:r.phase,moving:0,manual:false};return;}const u=m.stage==='windup'?.4*clamp(m.t/m.duration,0,1):m.stage==='strike'?.4+.35*clamp(m.t/.78,0,1):.75+.25*clamp(m.t/.95,0,1);
 let c=m.kind==='stomp'?enemyClips.warden:m.kind==='hex'?spellClips[9]:m.kind==='leap'?slam:lunge;
 const mapped=m.kind==='stomp'?u*.525/.53:m.kind==='hex'?u*CAST_RELEASES[9]/.4:u;
 apply(r,sample(c,clamp(mapped,0,1)));state(r).request={kind:'boss-'+m.kind+'-'+m.stage,time:r.phase,moving:m.kind==='charge'&&m.stage==='strike'?1:0,manual:false,gait:m.kind==='charge'&&m.stage==='strike'};
 // Leap trajectory belongs to physics; the pose only tucks or catches the landing.
 if(m.kind==='leap'){r.rig.position.y=0;if(m.stage==='strike'){const f=Math.sin(clamp(m.t/.78,0,1)*Math.PI);r.legs.forEach(l=>l.rotation.x=-.85*f);r.shins.forEach(l=>l.rotation.x=1.6*f);}if(m.stage==='recover'){const w=1-ramp(m.t,0,.72);r.hips.position.y-=.32*w;r.shins.forEach(l=>l.rotation.x+=.6*w);}}
}
export function noteImpact(r,amount=25,source=null){const m=state(r),dir=source?r.root.position.clone().sub(source).setY(0).normalize():new THREE.Vector3(0,0,-1).applyQuaternion(r.root.quaternion);dir.applyQuaternion(r.root.quaternion.clone().invert());m.hit={t:0,strength:clamp(amount*.013,.13,.62),x:dir.x,z:dir.z};}
function spring(m,key,target,dt,freq=9,damping=.8){let s=m.springs[key];if(!s)s=m.springs[key]={x:target,v:0};const n=Math.max(1,Math.ceil(dt*120)),h=dt/n;for(let i=0;i<n;i++){s.v+=(freq*freq*(target-s.x)-2*damping*freq*s.v)*h;s.x+=s.v*h;}return s.x;}
function capture(m){return Object.fromEntries(Object.entries(m.nodes).filter(([,n])=>n).map(([k,n])=>[k,{q:n.quaternion.clone(),p:n.position.clone()}]));}
function solveFoot(r,i,world,roll=0,yaw=r.root.rotation.y,weight=1){
 const upper=r.legs[i],lower=r.shins[i],foot=r.feet[i];r.root.updateMatrixWorld(true);
 const bu=lower.position.clone(),bl=foot.position.clone(),l1=bu.length(),l2=bl.length();
 const goal=upper.parent.worldToLocal(world.clone()).sub(upper.position),d=clamp(goal.length(),.12,l1+l2-.003),direction=goal.normalize();
 let pole=new THREE.Vector3(0,0,1);pole.addScaledVector(direction,-pole.dot(direction));if(pole.lengthSq()<.01)pole.set(1,0,0);pole.normalize();
 const x=(l1*l1-l2*l2+d*d)/(2*d),y=Math.sqrt(Math.max(0,l1*l1-x*x)),elbow=direction.clone().multiplyScalar(x).addScaledVector(pole,y);
 const qa=new THREE.Quaternion().setFromUnitVectors(bu.normalize(),elbow.clone().normalize()),end=direction.multiplyScalar(d).sub(elbow).applyQuaternion(qa.clone().invert()),qb=new THREE.Quaternion().setFromUnitVectors(bl.normalize(),end.normalize());
 upper.quaternion.slerp(qa,weight);lower.quaternion.slerp(qb,weight);r.root.updateMatrixWorld(true);
 const q=lower.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(roll,yaw,0,'YXZ')));foot.quaternion.slerp(q,weight);
}
function gait(r,m,dt){
 const req=m.request,walking=(req.kind==='locomotion'&&!r.airborne&&!r.tk&&!r.airHold&&!r.broken&&!r.guardActive&&!(r.stagger>0&&!r.motionPassive))||req.gait,scale=r.root.scale.y,speed=m.speed;
 const amount=clamp(speed/3,0,1),cycle=3.6*scale/1.2,stance=.38;
 const walkActive=walking&&m.velocity.clone().setY(0).length()>.15;if(walkActive&&!m.wasWalking)m.phase=TAU*stance*.55;m.wasWalking=walkActive;
 if(walking){const w=amount;r.hips.position.y-=.16*w;r.hips.position.y+=Math.sin(m.phase*2-1)*.06*w;r.hips.rotation.y+=Math.sin(m.phase)*.19*w;r.hips.rotation.z+=Math.cos(m.phase)*.075*w;r.hips.position.x+=Math.cos(m.phase)*.028*w;r.spine.rotation.y-=Math.sin(m.phase+.16)*.075*w;r.torso.rotation.y-=Math.sin(m.phase+.26)*.09*w;r.torso.rotation.x+=clamp(speed/10,0,1)*.17;
  if(!req.manual)for(let i=0;i<2;i++){const phase=m.phase+i*Math.PI,sw=Math.sin(phase+.22);r.arms[i].rotation.x=-.2+sw*.82*w;r.arms[i].rotation.z+=(i?1:-1)*Math.cos(phase)*.06*w;r.forearms[i].rotation.x=-.65-Math.max(0,-sw)*.55*w;r.hands[i].rotation.x+=Math.sin(phase-.4)*.14*w;}
 }
 if(!r.feet||r.caster||r.spectral||r.dead||r.root.position.y>.3||Math.abs(r.rig.rotation.x)>.45||Math.abs(r.rig.rotation.z)>.5||r.rig.position.y>.22)return;
 const grounded=!['aerial','slam','dodge','fireDash','ascend','enemystep','phoenix'].includes(req.kind);
 if(!grounded)return;
 r.root.updateMatrixWorld(true);const dir=m.velocity.clone().setY(0);if(dir.lengthSq()<.01)dir.set(Math.sin(r.root.rotation.y),0,Math.cos(r.root.rotation.y));dir.normalize();const right=new THREE.Vector3(Math.cos(r.root.rotation.y),0,-Math.sin(r.root.rotation.y));
 for(let i=0;i<2;i++){
  if(!walking&&(Math.abs(r.legs[i].rotation.x)>1.3||Math.abs(r.legs[i].rotation.z)>.85))continue;
  const f=m.feet[i],phase=((m.phase/TAU+i*.5)%1+1)%1,lead=cycle*stance*.46;
  const home=r.root.position.clone().addScaledVector(right,(i?1:-1)*.225*scale);home.y=.13*scale;
  let goal,roll=0,yaw=r.root.rotation.y;
  if(walkActive){
   if(!f.anchor||f.mode!=='walk'){f.anchor=(f.lastActual||home).clone();f.anchor.y=.13*scale;f.phase=phase;f.start=f.anchor.clone();f.swingBegin=Math.max(stance,phase);f.yaw=yaw;f.mode='walk';}
   if(phase<f.phase){f.anchor=f.end?.clone()||home.clone().addScaledVector(dir,lead);f.anchor.y=.13*scale;f.yaw=yaw;f.swingBegin=stance;}
   if(phase<stance){goal=f.anchor.clone();f.planted=true;roll=-.14*(1-ramp(phase,0,.065));if(r.toes)r.toes[i].rotation.x=.42*ramp(phase,.24,stance);}
   else{if(f.phase<stance||!f.start){f.start=f.anchor.clone();f.swingBegin=stance;}const begin=f.swingBegin??stance,u=clamp((phase-begin)/(1-begin),0,1),remaining=(1-phase)*cycle/Math.max(.4,speed);f.end=home.clone().addScaledVector(dir,lead+speed*remaining);goal=f.start.clone().lerp(f.end,ease(u));goal.y+=Math.sin(Math.PI*u)*(.25+clamp(speed/9,0,1)*.14)*scale;roll=.32*Math.cos(u*Math.PI)-.22*Math.sin(u*Math.PI);f.planted=false;}
   f.phase=phase;
  }else{
   if(!f.anchor){f.anchor=home.clone();f.mode='stance';f.yaw=yaw;}
   if(f.mode==='walk'){if(f.planted&&f.anchor.distanceTo(home)<.25*scale){f.mode='stance';}else{f.mode='settle';f.start=(f.lastActual||f.goal||home).clone();f.end=home.clone();f.catchTime=0;}}
   if(f.mode==='stance'&&(f.anchor.distanceTo(home)>.25*scale||(Math.abs(Math.atan2(Math.sin(yaw-f.yaw),Math.cos(yaw-f.yaw)))>.5&&m.feet[1-i].mode!=='settle'))){f.mode='settle';f.start=(f.lastActual||f.anchor).clone();f.end=home.clone();f.catchTime=0;}
   if(f.mode==='settle'){f.end.copy(home);f.catchTime+=dt;const u=clamp(f.catchTime/(f.catchDuration||.18),0,1);goal=f.start.clone().lerp(f.end,ease(u));goal.y+=Math.sin(u*Math.PI)*.075*scale;f.planted=false;if(u>=1){f.anchor=f.end.clone();f.mode='stance';f.yaw=yaw;f.planted=true;}}
   else{goal=f.anchor.clone();f.planted=true;}
  }
  if(!walking&&Math.abs(r.rig.rotation.y)>.3){const weight=Math.max(0,Math.sin(Math.min(TAU,Math.abs(r.rig.rotation.y))*.5));goal.x=lerp(goal.x,r.root.position.x,weight);goal.z=lerp(goal.z,r.root.position.z,weight);goal.y=.13*scale;yaw+=r.rig.rotation.y;f.yaw=yaw;}goal.y+=Math.abs(Math.sin(roll))*.24*scale;solveFoot(r,i,goal,roll,f.planted?f.yaw:yaw,walking?1:.86*(1-THREE.MathUtils.smoothstep(Math.abs(r.legs[i].rotation.x),.55,1.3))*(1-THREE.MathUtils.smoothstep(Math.abs(r.legs[i].rotation.z),.4,.85)));f.goal=goal;
 }
}
export function finishMotion(r,dt){
 const m=state(r);if(dt<=0)return;dt=Math.min(dt,.05);m.age+=dt;
 const delta=r.root.position.clone().sub(m.position),teleport=delta.length()>2.5;m.position.copy(r.root.position);m.oldVelocity.copy(m.velocity);
 if(teleport){m.velocity.set(0,0,0);m.feet=[{},{}];}else m.velocity.copy(delta).multiplyScalar(1/dt);
 m.speed=THREE.MathUtils.damp(m.speed,m.velocity.clone().setY(0).length(),12,dt);m.localVelocity.copy(m.velocity).applyQuaternion(r.root.quaternion.clone().invert());
 const dyaw=Math.atan2(Math.sin(r.root.rotation.y-m.lastYaw),Math.cos(r.root.rotation.y-m.lastYaw));m.lastYaw=r.root.rotation.y;m.turn=THREE.MathUtils.damp(m.turn,clamp(dyaw/dt,-10,10),10,dt);
 const stride=prepareLocomotion(r,m,dt,teleport?0:Math.hypot(delta.x,delta.z));
 if(!stride&&!teleport)m.phase+=Math.hypot(delta.x,delta.z)/(3.6*r.root.scale.y/1.2)*TAU;
 const req=m.request,key=req.manual?'execution-'+req.id:req.kind+(req.attack?.step||'')+(req.attack?.powerIndex??'');
 if(key!==m.key){m.blendFrom=m.previous;m.transition=0;m.key=key;}
 m.transition+=dt;const blend=ramp(m.transition,0,req.manual?.055:req.kind==='locomotion'?.16:['dodge','fireDash'].includes(req.kind)?.065:.105);
 if(m.blendFrom&&blend<1){for(const [k,n]of Object.entries(m.nodes)){const from=m.blendFrom[k];if(!n||!from)continue;n.quaternion.slerpQuaternions(from.q,n.quaternion.clone(),blend);n.position.lerpVectors(from.p,n.position.clone(),blend);}}
 // Torso/neck continuity is independent from strike speed. Hands still land
 // exactly through IK; the chest no longer folds 40 degrees in one display frame.
 if(req.manual){
  if(req.kind==='execution'&&m.previous)for(const k of ['H','S','T','HD']){const n=m.nodes[k],old=m.previous[k];if(!n||!old)continue;const angle=old.q.angleTo(n.quaternion);if(angle>dt*10)n.quaternion.slerpQuaternions(old.q,n.quaternion.clone(),dt*10/angle);}
  for(let i=0;i<r.tail.length;i++){r.tail[i].rotation.y=spring(m,'tailY'+i,Math.sin(m.age*2-i*.5)*.045-m.turn*.035/(1+i*.12),dt,9-i*.5,.75);r.tail[i].rotation.x=-.06;}
  if(r.jaw)r.jaw.rotation.x=.06+(req.kind==='victim'?.16:.11)*Math.max(0,Math.sin(req.time*5));
  articulateDetails(r,m,dt,true);gait(r,m,dt);r.root.updateMatrixWorld(true);m.previous=capture(m);return;
 }
 if(req.kind==='guard'){const breath=Math.sin(m.age*1.7+m.seed);r.neck.rotation.x+=breath*.008;r.hips.position.y+=breath*.007;}
 const accel=m.velocity.clone().sub(m.oldVelocity).multiplyScalar(1/dt).applyQuaternion(r.root.quaternion.clone().invert());
 const lean=spring(m,'inertiaX',clamp(accel.z*.0018,-.07,.07),dt,12,.9),bank=spring(m,'inertiaZ',clamp(-accel.x*.0018-m.turn*.011,-.1,.1),dt,10,.8);
 r.spine.rotation.x+=lean;r.spine.rotation.z+=bank;r.neck.rotation.y+=spring(m,'headTurn',clamp(-m.turn*.027,-.22,.22),dt,9,.78);r.head.rotation.z-=bank*.6;
 for(let i=0;i<2;i++){const target=clamp((r.forearms[i].rotation.x+.6)*-.14,-.24,.22);r.hands[i].rotation.x+=spring(m,'wrist'+i,target,dt,16,.62);r.fingers?.[i]?.forEach((f,j)=>{f.rotation.x+=.035*Math.sin(m.age*1.7+m.seed+j*.4);});}
 if(m.hit&&!req.manual){m.hit.t+=dt;const h=m.hit,t=h.t,shock=(1-Math.exp(-t*70))*Math.exp(-t*11)*h.strength,lag=t>.035?(1-Math.exp(-(t-.035)*55))*Math.exp(-(t-.035)*12)*h.strength:0;r.spine.rotation.x+=shock*h.z*.45;r.torso.rotation.x+=shock*h.z;r.torso.rotation.z-=shock*h.x*.9;r.neck.rotation.x+=lag*h.z*.3;r.head.rotation.x+=lag*h.z*.35;r.hips.position.y-=Math.abs(shock)*.08;if(t>.7)m.hit=null;}
 for(let i=0;i<r.tail.length;i++){const n=r.tail[i],drag=-m.turn*.03/(1+i*.08);n.rotation.y=spring(m,'tailY'+i,Math.sin(m.age*2-i*.48)*.07+drag,dt,8-i*.55,.67);n.rotation.x=spring(m,'tailX'+i,-.085+Math.sin(m.age*1.4-i*.4)*.035+clamp(accel.z*.001,-.06,.06),dt,7-i*.4,.72);}
 if(r.spectral)r.wings?.forEach((w,i)=>{const side=i?1:-1;w.rotation.y=side*(.94+Math.sin(m.age*2+i)*.07);if(w.userData.fan)w.userData.fan.rotation.y=side*Math.sin(m.age*2.4+i)*.1;});articulateDetails(r,m,dt);if(!groundStride(r,m,dt,solveFoot))gait(r,m,dt);r.root.updateMatrixWorld(true);m.feet.forEach((f,i)=>{if(r.feet?.[i])f.lastActual=r.feet[i].getWorldPosition(new THREE.Vector3());});m.previous=capture(m);r.motionCache=true;
}
export function motionInfo(r){const m=state(r);return {kind:m.request.kind,speed:m.speed,phase:m.phase,turn:m.turn,gait:m.gaitProfile?{run:m.gaitProfile.run,stance:m.gaitProfile.stance,cycle:m.gaitProfile.cycle}:null,feet:m.feet.map((f,i)=>({planted:!!f.planted,goal:f.goal?.toArray(),actual:r.feet?.[i]?.getWorldPosition(new THREE.Vector3()).toArray()}))};}
export function poseDeath(r){
 const m=state(r),t=r.deathTime||0;if(!m.deathFrom)m.deathFrom=capture(m);
 const drop=ramp(t,.12,.86),kneel=hump(t,0,.7),settle=ramp(t,.8,1.2);apply(r,{...REST,by:.15*drop,hy:-.3*kneel,B:[-1.5*drop,0,(r.recoilSide||1)*.13*drop],T:[.35*kneel+.1*drop,.12*drop,0],HD:[.28*drop,0,.16*drop],A0:[-.65*kneel+.24*drop,0,-.55*drop],A1:[.32*drop,0,.25*drop],E0:[-.8*drop,0,0],E1:[-.35*drop,0,0],L0:[-.25*drop,0,-.08],L1:[.2*drop,0,.17],K0:[.7*drop,0,0],K1:[.24*drop,0,0],c0:.05,c1:.15});
 const w=ramp(t,0,.18);for(const [k,n]of Object.entries(m.nodes)){const from=m.deathFrom[k];if(n&&from)n.quaternion.slerpQuaternions(from.q,n.quaternion.clone(),w);}
 if(t>.75&&t<1.3){const bounce=Math.sin((t-.75)*18)*Math.exp(-(t-.75)*8)*.1*(1-settle);r.forearms[0].rotation.x+=bounce;r.head.rotation.x-=bounce*.8;}
}

// Per-execution weight shifts and delayed reactions. These enrich all twenty branches
// while leaving their identities, gameplay impact moments and root trajectories intact.
const executionProfiles={
 'kingbreaker':[-.25,.3,.28,0],'throne-of-cinders':[.24,-.3,.3,1],'sovereigns-ruin':[-.18,.26,.22,0],
 'soulbreaker':[-.25,.18,.25,0], 'grave-driver':[.3,-.28,.3,1], 'crown-of-ruin':[-.32,.34,.2,1], 'hells-guillotine':[.25,-.15,.25,0], 'tyrants-verdict':[-.3,-.26,.32,0],
 'furnace-heart':[.28,.17,.19,0], 'cinder-spiral':[-.3,.38,.22,1], 'infernal-pillar':[.18,-.2,.27,0], 'meteor-burial':[-.2,.3,.2,1], 'ashen-cross':[-.35,.35,.22,1], 'pyre-king':[.22,-.23,.25,0],
 'mindbreaker':[.17,-.18,.18,0], 'gravity-coffin':[-.2,.16,.24,0], 'orbit-of-ruin':[-.26,.34,.2,1], 'heavens-rejection':[.25,-.22,.26,0], 'rift-fold':[-.3,.3,.2,1],
 'wraith-procession':[-.25,.24,.19,1], 'soul-sever':[.28,-.3,.22,0], 'pale-requiem':[-.24,.22,.23,1], 'tomb-of-echoes':[.15,-.22,.3,0]
};
export function polishExecution(f,player){
 const u=f.t/f.def.duration,e=f.enemy;
 // One owner for the pose. No second anticipation/reaction layer on top of the
 // authored paired animation; that used to bend both actors back into each other.
 state(player).request={kind:'execution',id:f.def.id,manual:true,gait:u<.12||(['cinder-spiral','throne-of-cinders'].includes(f.def.id)&&u>.25&&u<.57),moving:0,time:f.t};
 state(e).request={kind:'victim',id:f.def.id,manual:true,moving:0,time:f.t};
}
export function finishGhostMotion(r,dt){finishMotion(r,dt);}
export const MOTION_CATALOG={melee:Object.keys(clips),casts:spellClips.length,executions:Object.keys(executionProfiles)};

export function commitExecutionPose(r){const m=state(r);m.previous=capture(m);r.root.updateMatrixWorld(true);m.feet.forEach((f,i)=>{f.lastActual=r.feet[i].getWorldPosition(new THREE.Vector3());});}
