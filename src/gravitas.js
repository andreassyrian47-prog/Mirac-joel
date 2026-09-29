import * as THREE from 'three';
import {STRIKE_ENDINGS} from './execution-impact.js';
// GRAVITAS · v0.20.0 — weight, hold, settle.
// One authored profile per execution: where its beats fall, how heavy each one is,
// what the victim is doing between them, and what the kill implies for the body.
// Three layers consume it:
//  1. the timing warp (anticipation → snap → hit-stop dwell → recoil, plus a hold
//     and slow settle after the kill) in execution-timing.js;
//  2. the actor weight pass (load, drive-through, overshoot, head lag, breathing);
//  3. the victim performance (struggle between beats, hit reactions, fading tone).
// Beat: [u, kind, mass, dir, hand, leg]. kinds: strike | slam | throw | pulse | grip | lift.
// dir: fwd | down | up | side | crush | pulse. victim: [[u, mode], …] modes:
// stand | kneel | prone | air | carried | bound.
const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const S=(u,a,b)=>THREE.MathUtils.smoothstep(u,a,b);
const bell=(x)=>x<=0||x>=1?0:Math.sin(Math.PI*x);
const V=THREE.Vector3;

export const GRAVITAS={
 // ── Brutal ──────────────────────────────────────────────────────────────
 'soulbreaker':{beats:[[.19,'strike',.9,'fwd',1],[.52,'grip',.5],[.60,'lift',.7]],kill:'slam',victim:[[0,'stand'],[.55,'air']]},
 'grave-driver':{beats:[[.20,'strike',.8,'side',1,true],[.30,'grip',.4],[.51,'lift',.7],[.67,'throw',.9,'down',0]],kill:'slam',victim:[[0,'stand'],[.29,'prone'],[.40,'carried']]},
 'crown-of-ruin':{beats:[[.24,'strike',.9,'up',1],[.40,'lift',.4],[.63,'strike',1,'down',1,true]],kill:'slam',victim:[[0,'stand'],[.25,'air']]},
 'hells-guillotine':{beats:[[.20,'strike',.9,'fwd',0,true],[.29,'grip',.4],[.57,'lift',.5],[.67,'strike',1.15,'down',1,true]],kill:'strike',sever:[.67,'head'],victim:[[0,'stand'],[.30,'kneel']]},
 'tyrants-verdict':{beats:[[.20,'grip',.5],[.44,'throw',.9,'side',0],[.65,'strike',1.1,'down',1,true]],kill:'slam',sever:[.65,'leg'],victim:[[0,'stand'],[.53,'prone']]},
 'ribsunder':{beats:[[.25,'strike',.8,'side',0],[.43,'strike',.8,'side',1],[.72,'strike',1,'down',1]],kill:'strike',victim:[[0,'stand'],[.60,'kneel']]},
 'black-anvil':{beats:[[.18,'strike',.8,'fwd',1,true],[.55,'lift',.6],[.73,'slam',1.2,'down',1]],kill:'slam',victim:[[0,'stand'],[.30,'kneel']]},
 'spinewheel':{beats:[[.20,'grip',.5],[.38,'lift',.5],[.55,'throw',.9,'side',0],[.76,'strike',1.1,'down',1,true]],kill:'strike',victim:[[0,'stand'],[.50,'prone']]},
 'hornfall':{beats:[[.22,'grip',.5],[.42,'strike',.9,'fwd',1,true],[.60,'lift',.5],[.79,'throw',1,'down',1]],kill:'slam',victim:[[0,'stand'],[.20,'kneel'],[.60,'air']]},
 'ruinmaker':{beats:[[.18,'strike',.7,'fwd',0],[.38,'strike',.9,'side',1],[.69,'strike',.8,'down',1,true],[.76,'strike',1.1,'down',1,true]],kill:'strike',sever:[.38,'arm0'],victim:[[0,'stand'],[.50,'prone']]},
 // ── Pyromancy ───────────────────────────────────────────────────────────
 'furnace-heart':{beats:[[.23,'strike',.6,'fwd',1],[.44,'pulse',.7],[.75,'strike',1.2,'fwd',1,true]],kill:'strike',victim:[[0,'stand']]},
 'cinder-spiral':{continuous:true,beats:[[.18,'strike',.8,'side',1,true],[.22,'grip',.4],[.78,'throw',1,'side',0]],kill:'slam',victim:[[0,'stand'],[.20,'prone'],[.30,'carried']]},
 'infernal-pillar':{beats:[[.22,'strike',.7,'fwd',1],[.42,'pulse',.6],[.71,'pulse',.8]],kill:'slam',victim:[[0,'stand'],[.30,'air']]},
 'meteor-burial':{beats:[[.22,'strike',.9,'up',1],[.51,'grip',.5],[.64,'throw',.9,'down',1]],kill:'slam',victim:[[0,'stand'],[.25,'air']]},
 'ashen-cross':{continuous:true,beats:[[.25,'strike',.8,'side',0],[.49,'strike',.8,'side',1]],kill:'pulse',sever:[.755,'arm'],victim:[[0,'stand']]},
 'pyre-king':{continuous:true,beats:[[.22,'strike',.8,'fwd',1,true],[.46,'grip',.5]],kill:'pulse',victim:[[0,'stand'],[.30,'kneel']]},
 'crucible-hook':{beats:[[.20,'strike',.8,'up',0],[.43,'strike',.8,'up',1],[.62,'grip',.5],[.73,'strike',1.1,'down',1]],kill:'slam',victim:[[0,'stand'],[.40,'air'],[.62,'kneel']]},
 'dragons-wake':{beats:[[.38,'pulse',.7],[.59,'strike',1,'side',1]],kill:'strike',victim:[[0,'stand']]},
 'ember-pendulum':{continuous:true,beats:[[.20,'strike',.7,'fwd',0],[.41,'strike',.9,'up',1,true],[.73,'strike',1.1,'down',1,true]],kill:'slam',victim:[[0,'stand'],[.20,'kneel'],[.40,'air'],[.60,'prone']]},
 'searing-brand':{beats:[[.22,'strike',.6,'fwd',1],[.42,'lift',.5],[.63,'pulse',.7]],kill:'pulse',victim:[[0,'stand'],[.60,'kneel']]},
 'ashfall':{beats:[[.20,'strike',.9,'up',1],[.40,'pulse',.6],[.61,'pulse',.6]],kill:'slam',victim:[[0,'stand'],[.30,'air']]},
 'hellmouth':{beats:[[.20,'pulse',.6],[.43,'lift',.6],[.62,'lift',.5],[.74,'slam',1.2,'down',1]],kill:'slam',victim:[[0,'stand'],[.20,'kneel']]},
 // ── Psychic ─────────────────────────────────────────────────────────────
 'mindbreaker':{beats:[[.25,'grip',.5],[.48,'lift',.6],[.65,'pulse',.8,'crush']],kill:'slam',victim:[[0,'stand'],[.40,'air']]},
 'gravity-coffin':{beats:[[.30,'pulse',.6],[.46,'strike',.8,'crush'],[.59,'strike',.9,'crush'],[.72,'pulse',.7]],kill:'slam',victim:[[0,'stand'],[.25,'air']]},
 'orbit-of-ruin':{continuous:true,beats:[[.24,'grip',.5],[.78,'throw',1,'side',1]],kill:'slam',victim:[[0,'stand'],[.30,'air']]},
 'heavens-rejection':{beats:[[.23,'strike',.9,'up',1],[.50,'lift',.5]],kill:'slam',victim:[[0,'stand'],[.26,'air']]},
 'rift-fold':{beats:[[.29,'pulse',.6],[.62,'pulse',.8,'side']],kill:'slam',victim:[[0,'stand']]},
 'vector-break':{beats:[[.20,'pulse',.7,'side'],[.43,'pulse',.7,'side'],[.63,'lift',.6]],kill:'slam',victim:[[0,'stand'],[.60,'air']]},
 'neural-guillotine':{beats:[[.23,'grip',.5],[.44,'pulse',.7,'side'],[.64,'lift',.6]],kill:'strike',victim:[[0,'stand'],[.20,'kneel'],[.60,'air']]},
 'event-horizon':{beats:[[.21,'pulse',.7],[.40,'lift',.6],[.58,'pulse',.8,'side']],kill:'slam',victim:[[0,'stand'],[.20,'air']]},
 'oblivion-press':{beats:[[.18,'strike',.9,'down',1],[.43,'lift',.6],[.63,'lift',.6]],kill:'slam',victim:[[0,'stand'],[.15,'kneel'],[.60,'air']]},
 'thought-spear':{beats:[[.20,'strike',.6,'fwd',1],[.43,'lift',.5],[.62,'pulse',.7]],kill:'strike',victim:[[0,'stand'],[.40,'air'],[.60,'kneel']]},
 // ── Spectral ────────────────────────────────────────────────────────────
 'wraith-procession':{beats:[[.25,'strike',.7,'side',0],[.39,'strike',.7,'side',1],[.53,'strike',.8,'fwd',0]],kill:'strike',victim:[[0,'stand']]},
 'soul-sever':{beats:[[.22,'strike',.7,'fwd',1],[.48,'pulse',.6]],kill:'pulse',victim:[[0,'stand'],[.43,'kneel']]},
 'pale-requiem':{beats:[[.22,'strike',.7,'fwd',1],[.49,'lift',.6]],kill:'slam',victim:[[0,'stand'],[.50,'air']]},
 'tomb-of-echoes':{beats:[[.29,'pulse',.6],[.55,'pulse',.7]],kill:'pulse',victim:[[0,'stand'],[.25,'bound']]},
 'widows-passage':{beats:[[.21,'strike',.8,'side',0],[.62,'strike',.9,'side',1]],kill:'strike',victim:[[0,'stand']]},
 'reapers-toll':{beats:[[.22,'strike',.8,'fwd',0],[.43,'pulse',.6],[.64,'pulse',.7]],kill:'strike',sever:[.815,'head'],victim:[[0,'stand'],[.40,'kneel']]},
 'nightfall-covenant':{beats:[[.20,'pulse',.6],[.43,'lift',.6],[.62,'grip',.5]],kill:'slam',victim:[[0,'stand'],[.40,'air'],[.60,'kneel']]},
 'last-procession':{beats:[[.19,'strike',.8,'side',0],[.40,'pulse',.5],[.60,'strike',.9,'side',1]],kill:'strike',victim:[[0,'stand']]},
 // ── Boss-exclusive ──────────────────────────────────────────────────────
 'kingbreaker':{beats:[[.16,'strike',.9,'side',1,true],[.24,'grip',.5],[.39,'strike',1,'up',0,true],[.56,'strike',1.1,'down',1],[.72,'grip',.5]],kill:'slam',victim:[[0,'stand'],[.10,'kneel'],[.55,'prone']]},
 'throne-of-cinders':{continuous:true,beats:[[.17,'strike',.9,'side',1,true],[.25,'grip',.5],[.65,'slam',1.1,'down',1],[.75,'strike',1.1,'down',1,true],[.86,'strike',1.2,'down',1,true]],kill:'slam',victim:[[0,'stand'],[.20,'carried'],[.62,'prone']]},
 'sovereigns-ruin':{beats:[[.17,'strike',.9,'fwd',1],[.29,'grip',.5],[.45,'lift',.7],[.56,'pulse',.9,'crush'],[.72,'pulse',1,'crush']],kill:'slam',victim:[[0,'stand'],[.10,'kneel'],[.40,'air']]},
 'titans-reckoning':{beats:[[.13,'strike',.8,'side',0],[.28,'strike',.9,'side',0],[.43,'grip',.5],[.57,'strike',1,'fwd',1,true],[.68,'lift',.7],[.76,'slam',1.2,'down',1]],kill:'slam',victim:[[0,'stand'],[.10,'kneel']]},
 'sunless-coronation':{beats:[[.14,'strike',.9,'fwd',1,true],[.29,'strike',.7,'fwd',1],[.43,'lift',.6],[.58,'pulse',.8],[.70,'pulse',.7],[.765,'slam',1.2,'down',1]],kill:'slam',victim:[[0,'stand'],[.10,'kneel'],[.50,'air'],[.70,'kneel']]},
 'worlds-end':{beats:[[.13,'pulse',.8,'fwd'],[.28,'grip',.5],[.49,'lift',.7],[.56,'pulse',.9,'side'],[.69,'lift',.6]],kill:'slam',victim:[[0,'stand'],[.10,'kneel'],[.45,'air']]},
 'ashen-dominion':{beats:[[.13,'strike',.9,'side',1],[.22,'strike',.9,'side',0],[.35,'pulse',.6],[.47,'slam',1,'down',1],[.60,'strike',1.1,'down',1],[.74,'strike',1.1,'down',1]],kill:'slam',victim:[[0,'stand'],[.22,'kneel'],[.47,'prone']]},
 // ── Midget-exclusive ────────────────────────────────────────────────────
 'grave-stamp':{beats:[[.22,'strike',.9,'side',1,true],[.79,'slam',1.2,'down',1,true]],kill:'slam',victim:[[0,'stand'],[.30,'prone']]},
 'rack-and-ruin':{beats:[[.24,'grip',.5],[.47,'lift',.6],[.615,'strike',1,'fwd',1],[.73,'throw',.9,'side',1]],kill:'slam',victim:[[0,'stand'],[.27,'air']]}
};

const DEFAULT_DIR={strike:'fwd',slam:'down',throw:'side',pulse:'pulse',grip:null,lift:null};
const DWELL={strike:.07,slam:.09,throw:.05,pulse:.05,grip:.025,lift:0};
export function gravitasOf(def){return def.gravitas||null;}
export function impactWall(def){return def.gravitas?def.gravitas.pre:def.impact*def.duration;}

// Retime every finisher: the choreography keeps its authored u-space, the wall
// clock gets a heavier pre-impact budget, per-beat dwell and a hold + settle tail.
export function applyGravitas(defs){
 if(globalThis.__GRAVITAS_OFF)return; // harness A/B switch only
 for(const def of defs){
  const src=GRAVITAS[def.id];if(!src||def.gravitas)continue;
  const beats=src.beats.map(([u,kind,mass=.8,dir=DEFAULT_DIR[kind],hand=1,leg=false])=>({u,kind,mass,dir,hand,leg}));
  const killMass=def.bossOnly?1.4:1.25;
  beats.push({u:def.impact,kind:src.kill||'slam',mass:killMass,dir:src.kill==='strike'?'fwd':src.kill==='pulse'?'pulse':'down',hand:1,leg:false,kill:true});
  const dwell=beats.reduce((s,b)=>s+(b.kill?0:DWELL[b.kind]*b.mass),0);
  const weightScale=src.continuous?1.04:1.10;
  const pre=+(def.duration*def.impact*weightScale+dwell).toFixed(3);
  const hold=def.bossOnly?.55:def.smallOnly?.35:.42,rise=def.bossOnly?1.0:def.smallOnly?.7:.85;
  def.gravitas={pre,hold,rise,tail:hold+rise,beats,continuous:!!src.continuous,sever:src.sever||null,victim:src.victim||[[0,'stand']],legacyDuration:def.duration,kill:src.kill||'slam'};
  def.duration=+(pre+hold+rise).toFixed(2);
 }
}

// ── Timing warp ───────────────────────────────────────────────────────────
const N=2400,warps=new WeakMap();
function buildWarp(def){
 const g=def.gravitas,I=def.impact,du=1/N;
 // Unnormalised pre-impact density: 1 everywhere, boosted through anticipation,
 // compressed through the snap, mildly held in the recoil.
 const pre=new Float64Array(N),tail=new Float64Array(N);
 const ant=g.continuous?.35:1.1,snap=g.continuous?.85:.5;
 // The victim is handed to physics at u = I-.14 (releasePhase); that drop must stay
 // a short, fixed wall interval or the body drifts before the blow lands.
 const dropU=I-.14,dropSeconds=def.bossOnly?.26:def.smallOnly?.17:.20;
 for(let i=0;i<N;i++){
  const u=(i+.5)*du;
  if(u<dropU){let d=1;for(const b of g.beats){
    const m=b.mass;
    if(b.kill){d+=ant*m*1.15*bell((u-(dropU-.21))/.21);continue;} // raise the hammer slowly, before the drop
    if(b.kind==='lift'){d+=.9*m*bell((u-(b.u-.12))/.20);continue;}
    const a=b.kind==='grip'?.5:ant,s=b.kind==='grip'?.75:snap;
    d+=a*m*bell((u-(b.u-.15))/.105);
    if(u>=b.u-.045&&u<b.u)d*=s;
    else if(u>=b.u&&u<b.u+.06)d*=.85;
   }pre[i]=d;}
  else if(u<I)pre[i]=-1; // marker: fixed drop segment
  else tail[i]=S(u,I+.03,I+.09); // 0 = hold zone, 1 = rise zone
 }
 const dropD=dropSeconds/.14;for(let i=0;i<N;i++)if(pre[i]<0)pre[i]=dropD;
 // Hold and rise each receive their authored seconds; the blend between them is smooth.
 let holdArea=0,riseArea=0;for(let i=0;i<N;i++){if((i+.5)*du>=I){holdArea+=(1-tail[i])*du;riseArea+=tail[i]*du;}}
 const holdD=g.hold/Math.max(1e-6,holdArea),riseD=g.rise/Math.max(1e-6,riseArea);
 for(let i=0;i<N;i++)if((i+.5)*du>=I)tail[i]=(1-tail[i])*holdD+tail[i]*riseD;
 // Dwell spikes (hit-stop inside the clock) as fixed wall seconds per beat.
 const dwellAt=new Float64Array(N);let dwellTotal=0;
 for(const b of g.beats){if(b.kill)continue;const secs=DWELL[b.kind]*b.mass;if(secs<=0)continue;const i0=Math.floor((b.u+.005)*N),i1=Math.min(N-1,i0+Math.max(1,Math.round(.008*N)));/* the freeze sits just past contact */const per=secs/(i1-i0+1);for(let i=i0;i<=i1;i++)dwellAt[i]+=per;dwellTotal+=secs;}
 let preArea=0;for(let i=0;i<N;i++)if((i+.5)*du<dropU)preArea+=pre[i]*du;
 const preScale=Math.max(.05,(g.pre-dwellTotal-dropSeconds))/preArea;
 const wall=new Float64Array(N+1);wall[0]=0;
 for(let i=0;i<N;i++){const u=(i+.5)*du;wall[i+1]=wall[i]+(u<dropU?pre[i]*preScale:u<I?pre[i]:tail[i])*du+dwellAt[i];}
 // Pin the two anchors exactly: impact at g.pre, end at the catalogue duration.
 const iI=Math.round(I*N);const preErr=g.pre/wall[iI];for(let i=1;i<=iI;i++)wall[i]*=preErr;
 const tailErr=(def.duration-g.pre)/(wall[N]-wall[iI]);for(let i=iI+1;i<=N;i++)wall[i]=g.pre+(wall[i]-wall[iI])*tailErr;
 const total=wall[N];
 const warp={wall,total,u(seconds){if(seconds>=total)return 1;const w=Math.max(0,seconds);let lo=0,hi=N;while(hi-lo>1){const mid=(lo+hi)>>1;if(wall[mid]<=w)lo=mid;else hi=mid;}const span=wall[hi]-wall[lo];return Math.min(1,(lo+(span>0?(w-wall[lo])/span:0))*du);},at(u){const x=clamp(u,0,1)*N,i=Math.min(N-1,Math.floor(x));return wall[i]+(wall[i+1]-wall[i])*(x-i);}};
 warps.set(def,warp);return warp;
}
export function warpOf(def){return warps.get(def)||buildWarp(def);}
export function gravitasTime(seconds,def){const w=warpOf(def);return w.u(seconds)*def.duration;}
export function beatWall(def,u){return warpOf(def).at(u);}

// ── Shared motion helpers ───────────────────────────────────────────────
const damped=(age,k,w)=>age<0?0:Math.exp(-age*k)*Math.sin(age*w);       // 0 → overshoot → settle
const hit=(age,k,w)=>age<0?0:Math.exp(-age*k)*Math.cos(age*w);          // 1 at contact → rings down
const surge=(age,k,rise=45)=>age<0?0:(1-Math.exp(-age*rise))*Math.exp(-age*k); // delayed limbs
const side=(dir,hand)=>dir==='side'?(hand?1:-1):0;

function beatsInSeconds(f){
 const g=f.def.gravitas;if(f.gvBeats)return f.gvBeats;
 f.gvBeats=g.beats.map(b=>({...b,wall:beatWall(f.def,b.u)}));return f.gvBeats;
}
function victimMode(f,u){
 const e=f.enemy,seg=f.def.gravitas.victim;let mode=seg[0][1];for(const [t,m] of seg)if(u>=t)mode=m;
 if(f.carryVictim?.weight>.2||f.drag?.weight>.2)return 'carried';
 const held=[...(f.contacts||[])].filter(c=>c.weight>.3&&!c.leg);
 if(held.some(c=>c.where==='head'||c.node===e.head))return 'held-head';
 if(held.length&&mode!=='air'&&mode!=='prone')return 'held-chest';
 if(mode!=='carried'&&mode!=='prone'&&e.root.position.y>.5)return 'air';
 return mode;
}

// ── Actor weight pass ───────────────────────────────────────────────────
export function actorWeight(f,p,u,dt){if(globalThis.__GV_NO_ACTOR)return; // harness bisect switch
 const g=f.def.gravitas;if(!g)return;const I=f.def.impact,clock=f.clock??f.t,gv=f.gv||(f.gv={lag:0,prevT:p.torso.rotation.x,prevY:p.torso.rotation.y,lagY:0});
 const scale=f.def.bossOnly?1.1:f.def.smallOnly?.85:1;
 for(const b of beatsInSeconds(f)){
  const age=clock-b.wall,m=b.mass*scale;
  if(b.kind==='grip')continue;
  // Anticipation: sink into the legs, open the chest against the blow, chin down on the target.
  const a=bell((age+.30)/.26);
  if(a>0){const load=b.kind==='lift'?1.3:1;
   p.hips.position.y-=.07*m*a*load;p.head.rotation.x+=.10*m*a;
   if(b.kind==='lift'){p.torso.rotation.x+=.12*m*a;}else if(b.dir==='up'){p.torso.rotation.x+=.09*m*a;}else{p.torso.rotation.x-=.085*m*a;}
   p.torso.rotation.y-=.10*m*a*side(b.dir,b.hand);
   p.shins[0].rotation.x+=.12*m*a;p.shins[1].rotation.x+=.12*m*a;}
  if(age<0||age>.9)continue;
  // Drive-through and overshoot after contact, weight dropping through the knees.
  const s=damped(age,6.5,21),q=surge(age,5.5);
  const sign=b.dir==='up'?-1:1;
  p.torso.rotation.x+=.14*m*s*sign;p.spine.rotation.x+=.05*m*s*sign;p.hips.position.y-=.09*m*q;
  p.torso.rotation.y+=.12*m*s*side(b.dir,b.hand);
  p.shins[0].rotation.x+=.18*m*q;p.shins[1].rotation.x+=.18*m*q;p.head.rotation.x+=.12*m*s*sign;
  if(b.kind==='lift'){p.torso.rotation.x-=.20*m*s;}
  else if(b.leg){const L=b.hand;p.legs[L].rotation.x+=.16*m*s*sign;p.shins[L].rotation.x+=.14*m*q;}
  else if(b.kind!=='pulse'){const A=b.hand;p.arms[A].rotation.x+=.22*m*s*sign;p.forearms[A].rotation.x-=.10*m*s;}
 }
 // Head lag: the skull trails the chest's angular velocity, then springs back.
 if(dt>0){const v=(p.torso.rotation.x-gv.prevT)/dt,vy=(p.torso.rotation.y-gv.prevY)/dt;gv.lag+=(clamp(-v*.032,-.28,.28)-gv.lag)*Math.min(1,dt*16);gv.lagY+=(clamp(-vy*.03,-.25,.25)-gv.lagY)*Math.min(1,dt*16);}
 gv.prevT=p.torso.rotation.x;gv.prevY=p.torso.rotation.y;p.head.rotation.x+=gv.lag;p.head.rotation.y+=gv.lagY;
 // Settle: hold the pose, breathe hard, look down at the body, then rise.
 if(u>I){
  const w=S(u,I,I+.02),rise=S(u,I+.06,1),since=clock-g.pre;
  const breath=Math.sin(since*Math.PI*2/1.55-Math.PI/2),heavy=(1-rise*.65)*w;
  p.torso.rotation.x+=.05*breath*heavy;p.hips.position.y-=.03*(1+breath)*heavy;
  p.arms[0].rotation.z-=.05*(1+breath)*heavy;p.arms[1].rotation.z+=.05*(1+breath)*heavy;
  p.arms[0].rotation.x-=.05*breath*heavy;p.arms[1].rotation.x-=.05*breath*heavy;
  // Eyes on the kill.
  p.root.updateMatrixWorld(true);const target=f.enemy.hips.getWorldPosition(new V()),head=p.head.getWorldPosition(new V()),d=target.sub(head);
  const yaw=p.root.rotation.y,lx=d.x*Math.cos(yaw)-d.z*Math.sin(yaw),lz=d.x*Math.sin(yaw)+d.z*Math.cos(yaw);
  const ly=Math.atan2(lx,lz),lp=Math.atan2(-d.y,Math.hypot(lx,lz)),look=w*(1-rise*.55);
  p.head.rotation.y+=clamp(ly,-.9,.9)*look*.75;p.head.rotation.x+=clamp(lp,-.2,.85)*look*.8;p.torso.rotation.y+=clamp(ly,-.6,.6)*look*.22;
 }
}

// ── Victim performance ──────────────────────────────────────────────────
export function victimPerformance(f,u,dt){if(globalThis.__GV_NO_VICTIM)return; // harness bisect switch
 const g=f.def.gravitas,e=f.enemy;if(!g||e.physicalBody)return;
 const I=f.def.impact,clock=f.clock??f.t,w=clock,scale=e.boss?.7:e.small?1.1:1;
 const beats=beatsInSeconds(f);
 // Fading tone: a struggle that is lost — every beat drains it, the end approaches.
 let energy=1;for(const b of beats)if(!b.kill&&clock>b.wall)energy-=.13*b.mass;energy=clamp(energy,.3,1);
 const tone=energy*S(u,.04,.14)*(1-S(u,I-.36,I-.15))*scale;
 const mode=victimMode(f,u);f.victimMode=mode;
 const s1=Math.sin(w*7.3),s2=Math.sin(w*11.1+1.7),s3=Math.sin(w*4.2+.6);
 const arms=e.arms,fore=e.forearms,legs=e.legs,shins=e.shins;
 if(mode==='held-head'){
  for(let i=0;i<2;i++){arms[i].rotation.x-=(.85+.15*s1)*tone;arms[i].rotation.z+=(i?-.28:.28)*tone;fore[i].rotation.x-=(1.25+.2*s2)*tone;}
  e.head.rotation.y+=.18*s1*tone;e.head.rotation.z+=.12*s2*tone;e.torso.rotation.y+=.08*s3*tone;
  const buckle=(1+s3)*.5;for(let i=0;i<2;i++){legs[i].rotation.x-=.12*buckle*tone;shins[i].rotation.x+=.25*buckle*tone;}e.hips.position.y-=.06*buckle*tone;
 }else if(mode==='held-chest'){
  for(let i=0;i<2;i++){arms[i].rotation.x-=.55*tone;arms[i].rotation.z+=(i?-.35:.35)*tone;fore[i].rotation.x-=(.9+.15*s2)*tone;}
  e.torso.rotation.x-=.08*s1*tone;e.head.rotation.x-=.15*tone;e.head.rotation.y+=.10*s2*tone;
  const stagger=Math.max(0,s3);legs[1].rotation.x-=.25*stagger*tone;shins[1].rotation.x+=.5*stagger*tone;
 }else if(mode==='air'){
  for(let i=0;i<2;i++){const d=i?1:-1;legs[i].rotation.x+=(d*.35*s2-.2)*tone;shins[i].rotation.x+=.35*(1+d*s1)*tone;arms[i].rotation.x-=.4*(1+s1*d)*tone;arms[i].rotation.z+=d*.45*(1+s3)*tone;fore[i].rotation.x-=.4*tone;}
  e.torso.rotation.x-=.12*tone;e.head.rotation.x-=.2*tone;e.head.rotation.y+=.15*s2*tone;
 }else if(mode==='carried'){
  for(let i=0;i<2;i++){arms[i].rotation.x+=.3*s1*(i?-1:1)*tone-.3*tone;arms[i].rotation.z+=(i?1:-1)*.3*(1+s2)*tone;fore[i].rotation.x-=.5*(1+s3)*tone;}
  e.head.rotation.x+=.2*s2*tone;e.head.rotation.y+=.2*s1*tone;e.torso.rotation.z+=.06*s3*tone;
 }else if(mode==='kneel'||mode==='prone'){
  const heave=(1+s3)*.5;e.torso.rotation.x+=.05*heave*tone;e.head.rotation.x+=.08*s1*tone;e.head.rotation.y+=.10*s2*tone;
  for(let i=0;i<2;i++){arms[i].rotation.x-=.18*heave*tone;fore[i].rotation.x-=.25*heave*tone;}
  if(mode==='kneel')e.hips.position.y-=.03*heave*tone;
 }else if(mode==='bound'){
  e.torso.rotation.y+=.07*s1*tone;e.head.rotation.y+=.2*s2*tone;e.head.rotation.x-=.15*tone;for(let i=0;i<2;i++)e.hands[i].rotation.x-=.4*(1+s3)*tone;
 }else{ // stand: guard rising, feet unsteady
  for(let i=0;i<2;i++){arms[i].rotation.x-=.3*tone;fore[i].rotation.x-=.45*tone;}
  e.torso.rotation.x+=.05*s3*tone;e.head.rotation.y+=.08*s2*tone;shins[0].rotation.x+=.12*Math.max(0,s1)*tone;
 }
 // Tremor under strain.
 e.head.rotation.x+=.015*Math.sin(w*38)*tone;for(let i=0;i<2;i++)e.hands[i].rotation.x+=.05*Math.sin(w*33+i)*tone;
 for(let i=0;i<2;i++)e.fingers?.[i]?.forEach((n,j)=>{n.rotation.x-=clamp(.45*tone,0,1)*(1-j*.05);});
 // Hit reactions: every beat lands on the body in the direction it was struck.
 for(const b of beats){
  const age=clock-b.wall;if(age<0||age>.7)continue;const m=b.mass*scale;
  const r=hit(age,7,17),q=surge(age,6);
  switch(b.dir){
   case 'down':e.head.rotation.x+=.5*m*r;e.torso.rotation.x+=.3*m*q;e.hips.position.y-=.12*m*q;shins[0].rotation.x+=.3*m*q;shins[1].rotation.x+=.3*m*q;break;
   case 'up':e.head.rotation.x-=.55*m*r;e.torso.rotation.x-=.3*m*r;break;
   case 'side':{const d=b.hand?1:-1;e.torso.rotation.z+=.25*m*r*d;e.head.rotation.y+=.5*m*r*d;e.head.rotation.z+=.2*m*r*d;break;}
   case 'crush':e.torso.rotation.x+=.35*m*r;e.head.rotation.x+=.35*m*r;for(let i=0;i<2;i++){arms[i].rotation.z+=(i?-1:1)*.3*m*q;legs[i].rotation.x-=.4*m*q;shins[i].rotation.x+=.5*m*q;}break;
   case 'pulse':e.torso.rotation.x-=.2*m*r;e.head.rotation.x-=.3*m*r;for(let i=0;i<2;i++){arms[i].rotation.z+=(i?1:-1)*.5*m*q;e.fingers?.[i]?.forEach(n=>n.rotation.x+=.3*m*q);}break;
   default:e.torso.rotation.x-=.35*m*r;e.head.rotation.x+=.4*m*r;
  }
  if(b.dir!=='crush'){for(let i=0;i<2;i++){arms[i].rotation.z+=(i?1:-1)*.45*m*q;fore[i].rotation.x-=.5*m*q;legs[i].rotation.x-=.12*m*q;shins[i].rotation.x+=.35*m*q;}e.hips.position.y-=.08*m*q;}
 }
}

// ── Kill consequences ───────────────────────────────────────────────────
export function gravitasEvents(f,u,event){
 const g=f.def.gravitas;if(!g||!g.sever)return;
 const [at,part]=g.sever;event(f,'gravitas-sever',u,at,'sever',part);
}
export const GRAVITAS_VERSION='0.20.0';
