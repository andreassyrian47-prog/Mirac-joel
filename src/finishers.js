import * as THREE from 'three';
import {DREAD_FINISHERS,dreadChoreography} from './dread-executions.js';
import {reworkExecution} from './execution-reworks.js';
import {STRIKE_ENDINGS} from './execution-impact.js';
import {executionTime} from './execution-timing.js';
import {NEW_EXECUTIONS,expandedChoreography} from './revenant-executions.js';
import {commitExecutionPose} from './motion.js';
import {rememberBody} from './physical.js';
import {performExecution,rememberExecutionCorrection,framePerformance} from './execution-performance.js';
import {BOSS_FINISHERS,bossChoreography} from './boss-finishers.js';
import {alignInteractions,addStrikeContacts} from './contacts.js';
import {applyGravitas,actorWeight,victimPerformance,gravitasEvents} from './gravitas.js';

// Every execution has its own body choreography, motion path, impact timing and camera arc.
export const FINISHER_SCHOOLS = {
 brutal:{label:'BRUTAL',color:'#d8b58b',hex:0xe0b386},
 fire:{label:'PYROMANCY',color:'#efa272',hex:0xff803d},
 mind:{label:'PSYCHIC',color:'#bca5ee',hex:0xb99aff},
 ghost:{label:'SPECTRAL',color:'#8fd5bf',hex:0x8ddfc3}
};
export const FINISHERS = [
 {id:'soulbreaker',name:'Soulbreaker',school:'brutal',duration:3.6,impact:.80,beats:['Chest strike','Rear dash','Ground slam'],description:'Punch the enemy in the chest, dash behind them, lift them, and slam them into the earth.',signature:'The original execution. Preserved and contact-aligned.'},
 {id:'grave-driver',name:'Grave Driver',school:'brutal',duration:3.55,impact:.77,beats:['Leg sweep','Ankle swing','Overhead burial'],description:'Sweep the legs, seize an ankle, swing the enemy overhead, and hammer them into the ground.',signature:'A low sweep turns into a full-body overhead throw.'},
 {id:'crown-of-ruin',name:'Crown of Ruin',school:'brutal',duration:3.65,impact:.79,beats:['Rising uppercut','Aerial pursuit','Spinning heel'],description:'Launch the enemy with an uppercut, leap after them, and drive a spinning heel through their guard.',signature:'A rising camera follows the launch and rotating kick.'},
 {id:'hells-guillotine',name:"Hell’s Guillotine",school:'brutal',duration:3.35,impact:.76,hits:[[.20,0,true,'chest'],[.67,1,true,'head']],beats:['Knee and head control','Raise the heel','Axe-kick execution'],description:'Fold the enemy with a knee, hold their head down, then plant one foot and drive the opposite heel through their guard.',signature:'A sharply raised leg and downward heel define the finish.'},
 {id:'tyrants-verdict',name:"Tyrant’s Verdict",school:'brutal',duration:3.75,impact:.79,beats:['Wrist capture','Turning takedown','Ruinous heel'],description:'Catch the enemy’s wrist, cast them outward, step beside the fallen body and drive a crushing heel into their leg.',signature:'A wide turning cast keeps the demon outside the victim’s body.'},
 {id:'furnace-heart',name:'Furnace Heart',school:'fire',duration:3.7,impact:.79,beats:['Sternum seal','Ignition','Detonation kick'],description:'Plant a burning palm against the chest, ignite the mark, and kick the enemy away as it detonates.',signature:'A glowing chest seal grows before the final kick.'},
 {id:'cinder-spiral',name:'Cinder Spiral',school:'fire',duration:5.2,impact:.87,marks:[0,.21,.7],beats:['Sweep and seize','Fire-ring drag','Flaming release'],description:'Sweep the enemy down, clamp an ankle, backpedal around a burning ring while their body scrapes the ground, then swing and release them.',signature:'A maintained ankle grip drives the victim’s motion; the body is actually dragged.'},
 {id:'infernal-pillar',name:'Infernal Pillar',school:'fire',duration:4.05,impact:.8,beats:['Chest brand','Pillar of flame','Command the fall'],description:'Brand the chest, raise the victim in a fire column, then command a violent downward burial with both hands.',signature:'A grounded caster directs the ascent and a rapid physical drop.'},
 {id:'meteor-burial',name:'Meteor Burial',school:'fire',duration:4.2,impact:.81,beats:['Skyward launch','Burning ascent','Meteor impact'],description:'Launch the enemy skyward, pursue them, then hurl their burning body diagonally into the earth.',signature:'The longest aerial arc, ending in a slanted meteor trail.'},
 {id:'ashen-cross',name:'Ashen Cross',school:'fire',duration:3.2,impact:.76,beats:['First claw brand','Crossing slash','Crossfire burst'],description:'Carve two blazing claw trails across the enemy, then snap both arms outward to trigger crossfire.',signature:'Two intersecting flame slashes build the final X-shaped blast.'},
 {id:'pyre-king',name:'Pyre King',school:'fire',duration:3.85,impact:.8,beats:['Force to kneel','Forehead brand','Coronation in flame'],description:'Kick the enemy to their knees, brand their forehead, and close three fire rings around them.',signature:'Three rotating coronation rings collapse into a pyre.'},
 {id:'mindbreaker',name:'Mindbreaker',school:'mind',duration:3.65,impact:.79,beats:['Temple grip','Suspension','Psychic collapse'],description:'Grip both temples, suspend the enemy, then release a focused psychic pulse that folds them to the floor.',signature:'Two-handed head contact and a tightening psychic halo.'},
 {id:'gravity-coffin',name:'Gravity Coffin',school:'mind',duration:4,impact:.8,beats:['Gravity lift','Six-sided prison','Coffin collapse'],description:'Suspend the enemy inside a floating psychic cage, compress it from six sides, and drive it into the ground.',signature:'A visible wireframe prison contracts around the victim.'},
 {id:'orbit-of-ruin',name:'Orbit of Ruin',school:'mind',duration:4.1,impact:.8,beats:['Psychic tether','Orbital acceleration','Tangential throw'],description:'Tether the enemy to your hand, swing them around your body, and whip them into a distant ground impact.',signature:'A horizontal orbit accelerates into a sweeping throw.'},
 {id:'heavens-rejection',name:"Heaven’s Rejection",school:'mind',duration:4.15,impact:.81,beats:['Upward flick','Impossible stillness','Gravity reversal'],description:'Flick the enemy straight into the sky, hold them motionless for a beat, and pull them violently back down.',signature:'A deliberate midair hold makes the sudden drop land harder.'},
 {id:'rift-fold',name:'Rift Fold',school:'mind',duration:3.8,impact:.79,beats:['Split space','Fold behind','Lateral crush'],description:'Open opposing psychic planes, fold the enemy through them behind you, and slam them sideways.',signature:'Two luminous rift planes move with a twisting body fold.'},
 {id:'wraith-procession',name:'Wraith Procession',school:'ghost',duration:4.1,impact:.8,beats:['Call the procession','Three phantom strikes','Shadow-palm burial'],description:'Summon three doubles to strike from different angles, then dash through their wake for the final palm slam.',signature:'Three articulated doubles attack in sequence, not simultaneously.'},
 {id:'soul-sever',name:'Soul Sever',school:'ghost',duration:3.8,impact:.8,beats:['Spectral hook','Draw out the soul','Sever the tether'],description:'Hook the enemy with a spectral claw, pull an ethereal double from their body, and snap the connecting tether.',signature:'The soul visibly separates before the body collapses.'},
 {id:'pale-requiem',name:'Pale Requiem',school:'ghost',duration:3.9,impact:.79,beats:['Pass through','Raise the echo','Reunite in ruin'],description:'Pass through the enemy, raise their spectral echo above them, then drag echo and body into the ground together.',signature:'A through-body dash becomes a vertical spectral reunion.'},
 {id:'tomb-of-echoes',name:'Tomb of Echoes',school:'ghost',duration:4.3,impact:.81,beats:['Bind the limbs','Circling apparitions','Seal the tomb'],description:'Bind the enemy’s wrists and ankles with spectral chains, circle them with apparitions, and collapse the bindings.',signature:'Four anchors and circling wraiths close into one spectral shockwave.'}
,...BOSS_FINISHERS,...NEW_EXECUTIONS,...DREAD_FINISHERS];
// Faster commitments; retain normalized hit/grip landmarks.
for(const d of FINISHERS)if(!d.expanded&&!d.bespoke)d.duration=+(d.duration*(d.bossOnly?.84:['cinder-spiral'].includes(d.id)?.86:.82)).toFixed(2);
// GRAVITAS: retime every execution around its beats and give the kill a hold and a settle.
applyGravitas(FINISHERS);

const TAU=Math.PI*2, up=new THREE.Vector3(0,1,0);
const clamp=THREE.MathUtils.clamp;
const S=(u,a,b)=>{const t=clamp((u-a)/(b-a),0,1);return t*t*t*(t*(t*6-15)+10)};
const pulse=(u,a,b)=>u<=a||u>=b?0:Math.sin((u-a)/(b-a)*Math.PI);
const mix=THREE.MathUtils.lerp;
function rot(node,x=0,y=0,z=0){node.rotation.set(x,y,z)}
function arms(r,x,z=.2){r.arms.forEach((a,i)=>rot(a,x,0,(i?1:-1)*z))}
function fallen(r,weight=1,side=0){if(weight<=0)return;const w=clamp(weight,0,1),buckle=Math.sin(Math.PI*w);r.rig.rotation.x=mix(r.rig.rotation.x,-1.52,w);r.rig.rotation.z=mix(r.rig.rotation.z,side,w);r.rig.position.y=Math.max(r.rig.position.y,.15*w);r.hips.position.y=mix(r.hips.position.y,r.baseHip,w)-.34*buckle;r.torso.rotation.x=mix(r.torso.rotation.x,.1,w)+.4*buckle;r.head.rotation.x=mix(r.head.rotation.x,.24,w);const blend=(node,x,y,z)=>{node.rotation.x=mix(node.rotation.x,x,w);node.rotation.y=mix(node.rotation.y,y,w);node.rotation.z=mix(node.rotation.z,z,w);};blend(r.arms[0],.18,0,-.65);blend(r.arms[1],.35,0,.4);blend(r.forearms[0],-.8,0,0);blend(r.forearms[1],-.35,0,0);blend(r.legs[0],-.3,0,0);blend(r.legs[1],.16,0,0);blend(r.shins[0],.35,0,0);blend(r.shins[1],.7,0,0);}


export function createExecutionDirector(api){
 const {scene,player,camera}=api;
 function addProp(f,geometry,color,opacity=.65){
  const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const mesh=new THREE.Mesh(geometry,material);mesh.visible=false;scene.add(mesh);f.props.push(mesh);return mesh;
 }
 function setup(f){
  f.actor=player;f.props=[];f.ghosts=[];f.events=new Set();f.fxClock=0;f.color=FINISHER_SCHOOLS[f.def.school].hex;f.look=f.origin.clone().add(new THREE.Vector3(0,1.8,0));
  f.playerYaw=player.root.rotation.y;f.victimYaw=f.enemy.root.rotation.y;f.victimScale=f.enemy.root.scale.clone();f.actorStart=player.root.position.clone();f.side=new THREE.Vector3(f.front.z,0,-f.front.x);f.impactDone=false;
  const id=f.def.id;
  if(['infernal-pillar','meteor-burial'].includes(id)){
   for(let i=0;i<3;i++)addProp(f,new THREE.ConeGeometry(1,1,14,1,true),f.color,.1+i*.045);
  }else if(id==='gravity-coffin'){
   const m=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.6,3,1.5)),new THREE.LineBasicMaterial({color:f.color,transparent:true,opacity:.9}));scene.add(m);m.visible=false;f.props.push(m);
   for(let i=0;i<3;i++)addProp(f,new THREE.TorusGeometry(1.2,.018,4,64),f.color,.6);
  }else if(id==='rift-fold'){
   for(let i=0;i<2;i++)addProp(f,new THREE.PlaneGeometry(2.3,3.5),f.color,.1);
   for(let i=0;i<2;i++)addProp(f,new THREE.TorusGeometry(1,.026,4,64),f.color,.75);
  }else if(id==='ashen-cross'){
   for(let i=0;i<2;i++)addProp(f,new THREE.BoxGeometry(.07,3.4,.045),0xffc079,.9);
  }else{
   const count=id==='pyre-king'?3:2;
   for(let i=0;i<count;i++)addProp(f,new THREE.TorusGeometry(1,.018,4,64),f.color,.7-i*.15);
  }
  if(['cinder-spiral','throne-of-cinders'].includes(id)){f.fireArc=[];for(let i=0;i<24;i++)f.fireArc.push(addProp(f,new THREE.ConeGeometry(.19,.9,5,1,true),i%2?0xff5b16:0xffb347,.52));}
  const ghosts=f.def.expanded&&f.def.school==='ghost'?3:id==='wraith-procession'||id==='tomb-of-echoes'?3:id==='soul-sever'||id==='pale-requiem'?1:0;
  for(let i=0;i<ghosts;i++){const g=api.makeGhost(ghosts===1?f.enemy:player);g.root.visible=false;f.ghosts.push(g);}
 }
 function at(f,x=0,y=0,z=0){return f.origin.clone().addScaledVector(f.side,x).addScaledVector(f.front,z).add(new THREE.Vector3(0,y,0))}
 function pos(r,f,x,y,z){r.root.position.copy(at(f,x,y,z));}
 function face(r,target){const d=target.clone().sub(r.root.position);r.root.rotation.y=Math.atan2(d.x,d.z)}
 function point(f,where='chest'){
  if(where==='floor')return f.enemy.root.position.clone().setY(.08);
  f.enemy.root.updateMatrixWorld(true);
  return where==='head'?f.enemy.head.getWorldPosition(new THREE.Vector3()):api.chestContact(f.enemy);
 }
 function event(f,key,u,threshold,kind='hit',location='chest'){
  if(u<threshold||f.events.has(key))return;f.events.add(key);
  const p=point(f,location);
  if(kind==='hit'){api.wound?.(f,p,1.6);api.burst(p,f.color,30,5.5,.5);api.slash(p,player.root.rotation.y,false,f.color);api.kick(.2,.055);api.tone(90,.14,'sawtooth',.07,27);api.tone(42,.2,'sine',.09,18);}
  if(kind==='pulse'){api.ring(p,f.color,2.4,.5);api.burst(p,f.color,30,4,.65);api.tone(290,.2,'triangle',.06,90);}
  if(kind==='sever'){api.sever?.(f,location);api.wound?.(f,p,2.4);api.kick(.4,.08);api.tone(64,.25,'sawtooth',.13,21);}
  if(kind==='dash'){api.ring(player.root.position,f.color,1.5,.3);api.tone(260,.18,'triangle',.06,40);}
 }
 function contact(f,hand,where,weight,x=0,z=.22,side=0){if(weight>0)f.contacts.push({hand,where,weight,x,z,side});}
 function align(f){const final=f.reachAt===f.t;alignInteractions(f,player);if(final&&f.rawActor){if(f.def.id==='grave-driver'&&f.drag?.weight>.9)f.pickupLegPose=[f.enemy.legs[0].quaternion.clone(),f.enemy.shins[0].quaternion.clone()];const tips=player.hands.map(h=>h.getWorldPosition(new THREE.Vector3()));if(f.emit&&f.handTrail)tips.forEach((tip,i)=>{const length=tip.distanceTo(f.handTrail[i]);if(length>.14&&length<.8)api.beam(f.handTrail[i],tip,f.color,.016,.065);});f.handTrail=tips;rememberExecutionCorrection(f,player);commitExecutionPose(player);rememberBody(player,f.frameDt);if(!f.enemy.physicalBody){commitExecutionPose(f.enemy);rememberBody(f.enemy,f.frameDt);}framePerformance(f,player,camera,f.frameDt);}}
 function showRing(f,index,p,r,axis=0){const m=f.props[index];if(!m)return;m.visible=true;m.position.copy(p);m.scale.setScalar(Math.max(.015,r));m.rotation.set(Math.PI/2+axis,0,f.t*.8);}
 function emit(f,p,n=3,speed=2){if(f.emit)api.burst(p,f.color,n,speed,.55);}
 function tether(f,a,b,width=.025){if(f.emit)api.beam(a,b,f.color,width,.095);}

 function choreograph(f,u){
  const e=f.enemy,p=player,id=f.def.id,I=f.def.impact,C=e.boss?1.65:1.2,boss=e.boss?.55:0;
  const arrive=S(u,0,.13),release=S(u,I+.025,.99);
  p.root.position.lerpVectors(f.actorStart,at(f,0,0,C),arrive);e.root.position.copy(f.origin);
  face(p,e.root.position);face(e,p.root.position);
  const down=S(u,I-.07,I+.035);
  if(dreadChoreography(f,u,{player,at,contact,event}))return;
  if(reworkExecution(f,u,{player,at,contact,event,showRing,emit,beam:api.beam,pose:api.pose}))return;
  if(f.def.expanded)expandedChoreography(f,u,{player,at,pos,arms,fallen,contact,event,showRing,S,pulse,emit,beam:api.beam,pose:api.pose});else if(f.def.bossOnly)bossChoreography(f,u,{player,at,pos,arms,fallen,contact,event,showRing,S,pulse,emit});else switch(id){
   case 'soulbreaker':{
    const punch=S(u,.09,.19),withdraw=S(u,.23,.3),dash=S(u,.30,.43),load=pulse(u,.44,.61),lift=S(u,.51,.69),slam=S(u,.72,I),recover=S(u,I+.025,1);
    const front=at(f,0,0,C),back=at(f,0,0,-1.0);if(u<.14)p.root.position.lerpVectors(f.actorStart,front,S(u,0,.14));else p.root.position.lerpVectors(front,back,dash);p.root.position.addScaledVector(f.side,Math.sin(Math.PI*dash)*1.65);p.root.rotation.y=Math.atan2(-f.front.x,-f.front.z)+Math.PI*S(u,.34,.43);
    p.hips.position.y-=.3*load+.3*slam*(1-recover);p.torso.rotation.y=-.55*(1-punch)+.48*punch*(1-withdraw);p.torso.rotation.x=.22*punch*(1-withdraw)+.48*pulse(u,.29,.45)-.3*lift+.98*slam*(1-recover);
    p.arms[1].rotation.set(-1.5*punch*(1-withdraw),0,-.14*punch);p.forearms[1].rotation.x=-1.1*(1-punch)-.15*punch;p.arms[0].rotation.x=-.8*punch;p.forearms[0].rotation.x=-1.25;p.arms[0].rotation.x+=.9*pulse(u,.29,.45);p.arms[1].rotation.x+=.8*pulse(u,.29,.45);
    if(u>.11&&u<.27)contact(f,1,'chest',punch*(1-withdraw),.03,.28);
    e.torso.rotation.x=-.28*punch*(1-S(u,.38,.5));e.root.position.y=.06+1.65*lift*(1-slam);e.rig.rotation.x=-.65*lift-.87*slam;e.root.position.addScaledVector(f.front,.6*slam);e.arms.forEach((a,i)=>a.rotation.z=(i?1:-1)*.7*lift);
    if(u>.43){arms(p,-.5-2.05*lift+3.15*slam,.27);p.forearms.forEach(a=>a.rotation.x=-.85+.55*slam);p.rig.position.y=(boss+.15)*lift*(1-slam);p.shins[0].rotation.x=.5*load+.7*slam*(1-recover);p.shins[1].rotation.x=.75*load+.5*slam*(1-recover);}
    if(u>.45&&u<.75)for(let i=0;i<2;i++)contact(f,i,'chest',S(u,.45,.5)*(1-S(u,.70,.75)),i?-.2:.2,-.25);
    if(u>I-.03)fallen(e,S(u,I-.03,I+.025),.12);event(f,'chest',u,.19);event(f,'dash',u,.33,'dash');event(f,'grip',u,.51,'pulse');break;
   }
   case 'grave-driver':{
    const sweep=pulse(u,.1,.35),lift=S(u,.34,.55),swing=S(u,.51,I),a=swing*Math.PI;
    p.hips.position.y-=.45*sweep;p.legs[1].rotation.set(-.5*sweep,0,-1.35*sweep);p.torso.rotation.y=-1.2*sweep;
    e.rig.rotation.z=-1.05*S(u,.22,.35)*(1-S(u,.36,.52));e.root.position.y=.06+2.9*lift*Math.sin(Math.PI*(.17+swing*.83));
    e.root.position.addScaledVector(f.front,mix(0,-1.5,swing));e.rig.rotation.x=-1.52*S(u,.2,.34)-1.62*S(u,.35,.53)+1.62*S(u,.61,I);e.arms.forEach((a,i)=>a.rotation.z=(i?1:-1)*.6);
    arms(p,(-.4-2.2*lift+3.2*down)*(1-release),.25);p.torso.rotation.x=(.45*lift+.5*down)*(1-release);p.hips.position.y-=.25*down*(1-release);
    if(u>.31&&u<.74)f.carryVictim={hand:1,node:e.feet[0],weight:S(u,.31,.4)*(1-S(u,.65,.74))};
    if(u>I-.1){const settle=S(u,I-.1,I+.03);e.root.position.y=mix(e.root.position.y,.06,settle);fallen(e,settle,.35);}
    event(f,'sweep',u,.24);break;
   }
   case 'crown-of-ruin':{
    const upper=S(u,.15,.27),launch=S(u,.25,.45),kick=S(u,.53,I),jump=pulse(u,.35,I+.08);
    p.arms[1].rotation.x=(.5-3*upper)*(1-S(u,.3,.42));p.torso.rotation.y=.6*pulse(u,.1,.35);
    if(e.boss)e.hips.position.y-=.42*pulse(u,.08,.36);e.root.position.y=.06+3*launch*(1-down);e.rig.rotation.x=-.35*launch-1.1*down;e.arms[0].rotation.z=-.9*launch;e.arms[1].rotation.z=.9*launch;
    p.rig.position.y=(3.2+(e.boss?1.3:0))*jump;p.rig.rotation.y=TAU*S(u,.45,I);p.legs[1].rotation.set(-1.9*pulse(u,.51,I+.05),0,-.35*pulse(u,.51,I+.05));p.shins[0].rotation.x=1.2*jump;p.arms[0].rotation.z=-.6*jump;p.arms[1].rotation.z=.8*jump;
    e.root.position.addScaledVector(f.side,1.2*kick);if(u>I)fallen(e);
    event(f,'uppercut',u,.24);event(f,'air',u,.49,'pulse');event(f,'heel',u,.64,'hit','head');break;
   }
   case 'hells-guillotine':{
    const knee=pulse(u,.1,.32),vault=pulse(u,.36,I+.06),axe=S(u,.51,I);
    p.legs[0].rotation.x=-1.7*knee;p.shins[0].rotation.x=1.45*knee;p.torso.rotation.x=.25*knee;e.torso.rotation.x=.65*S(u,.21,.31)*(1-down);
    p.rig.position.y=(2.7+boss)*vault+boss*1.2*knee;p.legs[1].rotation.x=(-2.9+3.25*axe)*pulse(u,.39,I+.06);p.shins[1].rotation.x=.04;p.legs[0].rotation.x-=.65*vault;
    arms(p,-.5*vault,.6*vault);p.torso.rotation.x+=.45*axe*(1-release);e.rig.rotation.x=-1.52*down;e.hips.position.y-=.25*down;
    event(f,'knee',u,.23);event(f,'axe',u,.655,'hit','head');break;
   }
   case 'tyrants-verdict':{
    const grab=S(u,.08,.2),turn=S(u,.25,.5),drop=S(u,.55,.64)*(1-S(u,.68,.77));
    pos(p,f,.85*Math.sin(turn*Math.PI),1.35*drop,mix(C,-.7,turn));p.root.rotation.y+=Math.PI*turn;
    e.root.position.addScaledVector(f.side,turn*.7);e.rig.rotation.z=turn*1.1;e.rig.rotation.x=-.4*turn;
    p.arms[0].rotation.x=-1.1*grab;p.torso.rotation.y=-.65*turn;p.legs[1].rotation.x=-1.4*drop;p.shins[1].rotation.x=1.5*drop;p.legs[0].rotation.x=-.6*drop;
    if(u<.5){e.root.updateMatrixWorld(true);f.contacts.push({hand:0,node:e.hands[1],weight:grab*(1-S(u,.42,.52))});}
    if(u>.42){e.root.position.y=.06;fallen(e,S(u,.42,.55),1.0);}
    if(u>.54){e.root.updateMatrixWorld(true);const c=point(f);const w=S(u,.54,.66);p.root.position.x=mix(p.root.position.x,c.x-f.side.x*.45+f.front.x*.3,w);p.root.position.z=mix(p.root.position.z,c.z-f.side.z*.45+f.front.z*.3,w);}
    p.hips.position.y-=.32*down*(1-release);event(f,'wrist',u,.22);event(f,'take',u,.46);break;
   }
   case 'furnace-heart':{
    const seal=S(u,.11,.25),kick=pulse(u,.58,I+.03),blast=S(u,I-.05,I+.03);
    p.arms[1].rotation.x=-1.4*seal*(1-S(u,.49,.57));p.rig.position.y=boss*seal*(1-S(u,.5,.58))+boss*.95*kick;
    contact(f,1,'chest',seal*(1-S(u,.49,.57)));e.torso.rotation.x=-.2*seal*(1-blast);
    const chest=point(f);showRing(f,0,chest,.15+.5*S(u,.25,.57),Math.PI/2);f.props[0].lookAt(p.root.position.clone().add(new THREE.Vector3(0,2,0)));emit(f,chest,4,1.4);
    p.legs[1].rotation.x=-1.65*kick;p.shins[1].rotation.x=.12*kick;p.torso.rotation.x=-.25*kick;
    e.root.position.addScaledVector(f.front,-3.2*blast);e.root.position.y=.06+Math.sin(blast*Math.PI)*.8;fallen(e,blast);
    event(f,'brand',u,.25,'pulse');event(f,'detonation-kick',u,.73);break;
   }
   case 'cinder-spiral':{
    const sweep=S(u,.12,.25),travel=S(u,.29,.72),a=travel*Math.PI*1.6,radius=mix(C,2.5,S(u,.23,.34)),release=S(u,.72,I),tangent=f.side.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.front,-Math.sin(a));
    const path=at(f,Math.sin(a)*radius,0,Math.cos(a)*radius);p.root.position.lerpVectors(f.actorStart,path,S(u,0,.17));p.root.rotation.y=Math.atan2(-f.front.x,-f.front.z)+Math.atan2(Math.sin(Math.atan2(-tangent.x,-tangent.z)-Math.atan2(-f.front.x,-f.front.z)),Math.cos(Math.atan2(-tangent.x,-tangent.z)-Math.atan2(-f.front.x,-f.front.z)))*S(u,.2,.32);
    p.hips.position.y-=.56*sweep*(1-release);p.torso.rotation.x=-.22*sweep*(1-release);p.torso.rotation.y=.12*Math.sin(travel*30)*(1-release);p.arms[1].rotation.set(-.28,0,.19);p.forearms[1].rotation.x=-.08;p.arms[0].rotation.set(-.8,0,-.5);p.forearms[0].rotation.x=-1.2;
    p.legs[0].rotation.z-=.95*pulse(u,.1,.24);fallen(e,sweep,.08);e.rig.position.y=.17*sweep;e.root.rotation.y=Math.atan2(tangent.x,tangent.z);e.root.position.copy(f.origin).lerp(path.clone().addScaledVector(tangent,-1.4),S(u,.2,.31));e.root.position.y=.06;
    e.shins[1].rotation.x+=.25+Math.sin(travel*28)*.13*sweep;e.arms[0].rotation.x=.12*sweep;e.forearms[0].rotation.x=.07;e.head.rotation.z=.14*Math.sin(travel*22)*sweep;
    f.drag={hand:1,leg:0,weight:S(u,.2,.28)*(1-S(u,.72,.77))};
    if(u>.72){const endA=Math.PI*1.6,endT=f.side.clone().multiplyScalar(Math.cos(endA)).addScaledVector(f.front,-Math.sin(endA)),end=at(f,Math.sin(endA)*2.5,0,Math.cos(endA)*2.5);p.root.position.copy(end);p.root.rotation.y=Math.atan2(endT.x,endT.z)+Math.PI*(1-S(u,.72,.84));p.torso.rotation.x=.6*release;p.arms[1].rotation.x=-2.2*pulse(u,.72,.89);e.root.position.copy(end).addScaledVector(endT,mix(-1.0,3.0,release));e.root.position.y=.06+Math.sin(release*Math.PI)*1.3;e.rig.rotation.x=-1.48;if(f.dragExit)e.root.position.lerpVectors(f.dragExit,e.root.position.clone(),S(u,.72,.81));}
    showRing(f,0,f.origin.clone().setY(.14),2.6);showRing(f,1,f.origin.clone().setY(.17),2.9);if(u>.27&&u<.78)emit(f,e.root.position.clone().setY(.2),5,1.1);
    event(f,'sweep',u,.18);event(f,'seize',u,.27,'pulse');event(f,'drag-start',u,.34,'dash');event(f,'drag-scrape',u,.57);event(f,'release',u,.78,'dash');break;
   }
   case 'infernal-pillar':{
    const lift=S(u,.2,.49),fall=S(u,I-.09,I+.02),pursuit=pulse(u,.42,I+.035);
    e.root.position.y=.06+3.7*lift*(1-fall);e.torso.rotation.x=-.2*lift;e.arms.forEach((a,i)=>a.rotation.z=(i?1:-1)*lift*.8);
    p.arms[1].rotation.x=-1.5*S(u,.08,.21)-.8*lift;p.rig.position.y=(3.1+boss)*pursuit;
    if(u<.34)contact(f,1,'head',pulse(u,.1,.34));
    if(u>.43)arms(p,(-2.65+3.55*fall)*(1-release),.28);p.torso.rotation.x=.8*fall*(1-release);p.legs[0].rotation.x=-.75*pursuit;p.legs[1].rotation.x=-.5*pursuit;p.shins[0].rotation.x=.85*pursuit;p.shins[1].rotation.x=1.3*pursuit;
    if(u>.61){e.root.updateMatrixWorld(true);const head=e.head.getWorldPosition(new THREE.Vector3()),w=S(u,.61,.75);p.root.position.x=mix(p.root.position.x,head.x+f.front.x*.8,w);p.root.position.z=mix(p.root.position.z,head.z+f.front.z*.8,w);p.rig.position.y=mix(p.rig.position.y,Math.max(0,(head.y+.45-.06)/p.root.scale.y-p.hips.position.y-.8),w);}
    for(let i=0;i<3;i++){const m=f.props[i];m.visible=u>.2&&u<I+.07;m.position.copy(f.origin).add(new THREE.Vector3(0,1.9,0));m.scale.set(1.2-i*.25,4.5*lift,1.2-i*.25);m.rotation.y=f.t*(i+1);}
    emit(f,e.root.position,5,3);if(u>I-.03)fallen(e,fall);event(f,'grip',u,.21);event(f,'descent-fists',u,.70,'hit','head');break;
   }
   case 'meteor-burial':{
    const launch=S(u,.18,.43),arc=S(u,.47,I),jump=pulse(u,.35,I+.07),angle=arc*Math.PI*.72;
    e.root.position.copy(at(f,-3*arc,.06+4.6*launch*(1-S(u,.66,I+.015)), -3.2*arc));e.rig.rotation.x=-.4*launch-1.1*arc;e.rig.rotation.z=-.8*arc;const catchHold=S(u,.41,.5)*(1-S(u,.62,.69));e.rig.rotation.x*=1-catchHold;e.rig.rotation.z*=1-catchHold;
    pos(p,f,1.2*Math.sin(angle),4*jump,C-2*arc);arms(p,(-2.7*S(u,.4,.56)+3.5*S(u,.68,I))*(1-release),.35);p.torso.rotation.x=.65*arc*(1-release);p.legs[0].rotation.x=-.8*jump;p.shins[1].rotation.x=1.3*jump;
    if(u>.43){const w=S(u,.43,.54);p.root.position.x=mix(p.root.position.x,e.root.position.x+f.front.x*1.1,w);p.root.position.z=mix(p.root.position.z,e.root.position.z+f.front.z*1.1,w);}if(u>.49&&u<.65)for(let i=0;i<2;i++)contact(f,i,'chest',S(u,.49,.54)*(1-S(u,.59,.65)),i?.2:-.2,.25);
    for(let i=0;i<3;i++){const m=f.props[i];m.visible=u>.38&&u<I+.04;m.position.copy(e.root.position).add(new THREE.Vector3(0,1.2,0));m.scale.set(.8-i*.2,2.1+i*.4,.8-i*.2);m.rotation.set(-.7,0,.5);}
    emit(f,e.root.position.clone().add(new THREE.Vector3(0,1,0)),6,3.4);event(f,'launch',u,.22);event(f,'catch',u,.54,'pulse');if(u>I)fallen(e,1,-.4);break;
   }
   case 'ashen-cross':{
    const first=pulse(u,.1,.37),second=pulse(u,.34,.61),spread=S(u,.66,I)*(1-release);
    p.arms[0].rotation.set(-1.5*first,0,.95*first-1.5*spread);p.arms[1].rotation.set(-1.6*second,0,-1.05*second+1.5*spread);p.torso.rotation.y=.6*first-.7*second;p.forearms.forEach(a=>a.rotation.x=-.25);
    e.torso.rotation.z=-.35*first+.35*second;e.rig.rotation.x=-1.5*down;
    const chest=point(f);f.props.forEach((m,i)=>{m.visible=u>(i?.47:.24)&&u<I+.07;m.position.copy(chest);m.rotation.set(0,p.root.rotation.y,(i?1:-1)*.72);m.scale.set(1+spread,1,1);});
    event(f,'cut-one',u,.25);event(f,'cut-two',u,.49);break;
   }
   case 'pyre-king':{
    const kick=pulse(u,.07,.28),kneel=S(u,.21,.35),brand=pulse(u,.32,.64),collapse=S(u,I-.045,I+.04);
    p.legs[1].rotation.x=-1.45*kick;p.torso.rotation.x=.15*kick;e.hips.position.y-=.62*kneel;e.legs.forEach(a=>a.rotation.x=-.65*kneel);e.shins.forEach(a=>a.rotation.x=1.3*kneel);e.head.rotation.x=.3*kneel;
    p.arms[1].rotation.x=-1.25*brand;contact(f,1,'head',brand);p.arms[0].rotation.z=-.8*S(u,.59,I)*(1-release);
    for(let i=0;i<3;i++){const m=f.props[i];m.visible=u>.39&&u<I+.07;m.position.copy(f.origin).add(new THREE.Vector3(0,.6+i*.65,0));m.scale.setScalar(1.3*(1-collapse)+.1);m.rotation.set(Math.PI/2,0,f.t*(i%2?2:-2));}
    if(u>I-.03)fallen(e,collapse);event(f,'kneel',u,.22);event(f,'seal',u,.46,'pulse','head');break;
   }
   case 'mindbreaker':{
    const grip=S(u,.12,.29),lift=S(u,.34,.56),collapse=S(u,I-.06,I+.035);
    e.root.position.y=.06+1.6*lift*(1-collapse);e.head.rotation.z=.16*Math.sin(f.t*9)*lift;e.arms[0].rotation.z=-.6*lift;e.arms[1].rotation.z=.6*lift;
    p.rig.position.y=((boss+.25)*grip+1.6*lift/player.root.scale.y)*(1-collapse);arms(p,-1.2*grip,.55*grip);p.forearms.forEach(a=>a.rotation.x=-1.4*grip);
    if(u<.69){for(let i=0;i<2;i++)f.contacts.push({hand:i,where:'head',side:i?.22:-.22,weight:grip});}
    p.head.rotation.x=.15*lift;p.torso.rotation.x=.6*collapse*(1-release);e.rig.rotation.x=-1.5*collapse;
    showRing(f,0,point(f,'head'),.7*(1-.75*collapse),.4);showRing(f,1,point(f,'head'),.9*(1-.75*collapse),-.4);emit(f,point(f,'head'),3,1.4);event(f,'grip',u,.29,'pulse','head');break;
   }
   case 'gravity-coffin':{
    const lift=S(u,.14,.38),squeeze=S(u,.47,I-.03),slam=S(u,I-.045,I+.025);
    e.root.position.y=.06+2.2*lift*(1-slam);e.arms[0].rotation.z=-1.1*lift*(1-.8*squeeze);e.arms[1].rotation.z=1.1*lift*(1-.8*squeeze);e.legs[0].rotation.z=-.25*lift;e.legs[1].rotation.z=.25*lift;
    arms(p,-1.1*lift,(1.05-.95*squeeze)*lift);p.forearms.forEach(a=>a.rotation.x=-.4);p.hips.position.y-=.18*slam*(1-release);
    const m=f.props[0];m.visible=u>.18&&u<I+.08;m.position.copy(e.root.position).add(new THREE.Vector3(0,1.6,0));m.rotation.y=f.t*.23;m.scale.set((1-.67*squeeze)*(e.boss?1.4:1),1-.13*squeeze,1-.67*squeeze);
    for(let i=1;i<4;i++)showRing(f,i,m.position,.7+(1-squeeze)*.85,i*.7);e.torso.scale.x=1-.2*squeeze;e.torso.scale.z=1-.2*squeeze;fallen(e,slam);
    const pressure=pulse(u,.42,.53)+pulse(u,.55,.65)+pulse(u,.68,.77);p.forearms.forEach(a=>a.rotation.x-=.8*pressure);p.torso.rotation.x+=.25*pressure;e.spine.rotation.x-=.22*pressure;e.shins.forEach(a=>a.rotation.x+=.45*pressure);event(f,'cage',u,.33,'pulse');event(f,'compress-one',u,.47,'pulse');event(f,'compress-two',u,.6,'pulse');event(f,'compress-three',u,.73,'pulse');break;
   }
   case 'orbit-of-ruin':{
    const catchIt=S(u,.12,.28),orbit=S(u,.3,I-.11),throwIt=S(u,I-.13,I+.025),a=orbit*TAU*1.35;
    pos(p,f,0,0,C);p.root.rotation.y+=a;p.arms[1].rotation.set(-1.0*catchIt,0,.6*catchIt);p.arms[0].rotation.z=-.55*catchIt;p.torso.rotation.z=-.18*orbit;
    const orbital=p.root.position.clone().addScaledVector(f.side,Math.sin(a)*2.6).addScaledVector(f.front,-Math.cos(a)*2.6);e.root.position.lerpVectors(f.origin,orbital,catchIt);e.root.position.y=.06+1.5*catchIt*(1-throwIt);e.rig.rotation.z=Math.sin(a)*.8;e.rig.rotation.x=Math.cos(a)*.5;
    if(throwIt>0)e.root.position.addScaledVector(f.side,throwIt*3.5);p.root.updateMatrixWorld(true);tether(f,p.hands[1].getWorldPosition(new THREE.Vector3()),point(f),.04);showRing(f,0,p.root.position.clone().setY(.16),2.8);
    if(u>I-.08)fallen(e,S(u,I-.08,I+.01),.5);event(f,'tether',u,.24,'pulse');break;
   }
   case 'heavens-rejection':{
    const flick=S(u,.09,.23),rise=S(u,.23,.47),drop=S(u,.7,I+.015);
    p.arms[1].rotation.x=(-1.2*flick-1.6*rise+3.25*drop)*(1-release);p.forearms[1].rotation.x=-.5*(1-drop);p.head.rotation.x=-.45*rise*(1-drop);p.torso.rotation.x=.65*drop*(1-release);
    e.root.position.y=.06+5.2*rise*(1-drop);e.rig.rotation.x=-.22*rise-1.3*drop;e.arms[0].rotation.z=-.8*rise;e.arms[1].rotation.z=.8*rise;
    showRing(f,0,e.root.position.clone().add(new THREE.Vector3(0,1.5,0)),.9,.4);showRing(f,1,f.origin.clone().setY(.12),1+2*rise);
    if(u>.3&&u<.72)tether(f,at(f,0,.15,0),e.root.position.clone().add(new THREE.Vector3(0,2,0)),.02);
    event(f,'flick',u,.23,'pulse');event(f,'hold',u,.52,'pulse');break;
   }
   case 'rift-fold':{
    const divide=S(u,.12,.33),fold=S(u,.39,.66),crush=S(u,I-.09,I+.025);
    arms(p,-.8*divide,(1.25-1.5*fold)*divide);p.torso.rotation.y=-.55*fold;p.root.rotation.y+=Math.PI*.5*crush;
    e.root.position.copy(at(f,Math.sin(fold*Math.PI)*1.5,Math.sin(fold*Math.PI)*.9,mix(0,C+1,fold)));e.rig.rotation.y=Math.PI*fold;e.rig.rotation.z=-1.4*crush;e.root.position.addScaledVector(f.side,-crush*2.3);
    for(let i=0;i<2;i++){const m=f.props[i];m.visible=u>.18&&u<I+.09;m.position.copy(at(f,(i?1:-1)*mix(1.6,.3,fold),1.6,i?C+1:0));m.rotation.y=p.root.rotation.y+Math.PI/2;const r=f.props[i+2];r.visible=m.visible;r.position.copy(m.position);r.rotation.copy(m.rotation);r.scale.set(1,1.7,1);}
    event(f,'split',u,.29,'pulse');event(f,'fold',u,.62,'dash');if(u>I)fallen(e,1,-1.3);break;
   }
   case 'wraith-procession':{
    const dash=S(u,.49,.74),reach=pulse(u,.68,I+.055);
    pos(p,f,-2+.6*dash,0,mix(C+1,-.3,dash));face(p,e.root.position);p.arms[1].rotation.x=-1.6*reach;p.torso.rotation.x=.35*reach;e.rig.rotation.x=-.25*pulse(u,.72,I+.06);
    for(let i=0;i<3;i++){const g=f.ghosts[i],a=(i/3+.12)*TAU,start=.14+i*.14,attack=pulse(u,start,start+.24);g.root.visible=u>start-.025&&u<start+.27;api.pose(g,f.t+i,0,{type:'light',t:clamp((u-start)/.24,0,1)*.42,duration:.42,step:i%2+1});const radius=3-1.75*attack;g.root.position.copy(at(f,Math.sin(a)*radius,0,Math.cos(a)*radius));face(g,e.root.position);emit(f,g.root.position.clone().add(new THREE.Vector3(0,1,0)),2,1);event(f,'shade'+i,u,start+.11);}
    e.torso.rotation.z=.18*(pulse(u,.22,.33)-pulse(u,.36,.47)+pulse(u,.5,.61));emit(f,p.root.position.clone().add(new THREE.Vector3(0,1,0)),4,2);if(u>.69&&u<I)contact(f,1,'chest',reach);event(f,'dash',u,.67,'dash');break;
   }
   case 'soul-sever':{
    const hook=pulse(u,.1,.32),pull=S(u,.32,.68),snap=S(u,I-.035,I+.015);contact(f,1,'chest',S(u,.11,.21)*(1-S(u,.25,.32)));p.arms[0].rotation.x=-.9*pull;p.forearms[0].rotation.x=-1.1*pull;
    p.arms[1].rotation.set(-1.4*hook-.9*pull,0,.6*pull);p.forearms[1].rotation.x=-1.35*pull;p.root.position.addScaledVector(f.front,pull*1.8);p.torso.rotation.y=.65*pull*(1-release);
    const g=f.ghosts[0];g.root.visible=u>.29&&u<I+.045;g.root.position.copy(e.root.position).addScaledVector(f.front,pull*2);g.root.position.y=.06+pull*.7;g.root.rotation.copy(e.root.rotation);api.pose(g,f.t);g.torso.rotation.x=-.45*pull;g.arms.forEach((a,i)=>a.rotation.z=(i?1:-1)*.8*pull);
    g.root.updateMatrixWorld(true);tether(f,point(f),g.torso.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.5,0)),.045*(1-snap));emit(f,g.root.position.clone().add(new THREE.Vector3(0,1.5,0)),4,1.5);
    e.head.rotation.x=.35*pull;e.arms.forEach(a=>a.rotation.x=.2*pull);fallen(e,snap);event(f,'hook',u,.24);event(f,'extract',u,.4,'pulse');break;
   }
   case 'pale-requiem':{
    const pass=S(u,.13,.33),raise=S(u,.39,.62),drag=S(u,I-.1,I+.025);
    pos(p,f,Math.sin(pass*Math.PI)*1.65+1.5*S(u,.5,.69),0,mix(C+1,-C,pass));p.root.rotation.y=Math.atan2(-f.front.x,-f.front.z)+Math.PI*S(u,.32,.45);p.arms.forEach(a=>a.rotation.x=.5*pulse(u,.12,.36));if(u>.37)arms(p,(-1.2-1.2*raise+3.2*drag)*(1-release),.5);
    const g=f.ghosts[0];g.root.visible=u>.28&&u<I+.04;api.pose(g,f.t);g.root.position.copy(e.root.position);g.root.position.y=.06+3*raise*(1-drag);g.root.rotation.copy(e.root.rotation);g.arms.forEach((a,i)=>a.rotation.z=(i?1:-1)*.85*raise);g.rig.rotation.x=-1.5*drag;
    e.root.position.y=.06+.55*raise*(1-drag);e.rig.rotation.x=-1.5*drag;showRing(f,0,f.origin.clone().setY(.13),2.2);tether(f,point(f),g.root.position.clone().add(new THREE.Vector3(0,1.8,0)),.025);emit(f,p.root.position.clone().add(new THREE.Vector3(0,1.2,0)),4,2);
    event(f,'phase',u,.22,'dash');event(f,'echo',u,.49,'pulse');break;
   }
   case 'tomb-of-echoes':{
    const bind=S(u,.12,.31),circle=S(u,.32,I),seal=S(u,I-.07,I+.03);
    arms(p,-.95*bind,(1.15-1.45*seal)*bind);p.forearms.forEach(a=>a.rotation.x=-.5*bind);p.hips.position.y-=.2*seal*(1-release);
    e.hips.position.y-=.5*bind;e.legs.forEach(a=>a.rotation.x=-.65*bind);e.shins.forEach(a=>a.rotation.x=1.3*bind);e.arms[0].rotation.z=-1.05*bind;e.arms[1].rotation.z=1.05*bind;e.head.rotation.x=.2*bind;
    e.root.updateMatrixWorld(true);
    for(let i=0;i<4;i++){const limb=(i<2?e.hands[i]:e.shins[i-2]).getWorldPosition(new THREE.Vector3()),a=i*TAU/4+Math.PI/4,anchor=at(f,Math.cos(a)*3*(1-seal),.12,Math.sin(a)*3*(1-seal));tether(f,anchor,limb,.032);emit(f,anchor,1,1);}
    for(let i=0;i<3;i++){const g=f.ghosts[i],a=circle*TAU*1.15+i*TAU/3,r=2.8*(1-.8*seal);g.root.visible=u>.28&&u<I+.03;api.pose(g,f.t+i,.5);g.root.position.copy(at(f,Math.sin(a)*r,.25,Math.cos(a)*r));face(g,e.root.position);g.arms.forEach(a=>a.rotation.x=-1.1);}
    showRing(f,0,f.origin.clone().setY(.12),3*(1-.8*seal));showRing(f,1,f.origin.clone().setY(.2),2.55*(1-.8*seal));if(u>I-.03)fallen(e,seal);event(f,'bind',u,.28,'pulse');break;
   }
  }
  if(u<.13)p.root.position.lerpVectors(f.actorStart,p.root.position.clone(),arrive);
  // Keep every execution grounded and hold its final pose instead of standing the victim back up.
  if(u>I+.055){e.root.position.y=.06;e.rig.position.y=0;fallen(e,1,['tyrants-verdict','rift-fold'].includes(id)?-.65:0);}
  if(u>I+.06){p.root.position.y=Math.max(.06,p.root.position.y*(1-release));p.rig.position.y*=1-release;p.torso.rotation.x*=1-release;p.torso.rotation.y*=1-release;}
 }
 function frameCamera(f,dt,u){framePerformance(f,player,camera,dt*.5);}
 function update(f,dt){
  if(!f.props)setup(f);f.frameDt=dt;f.clock=(f.clock||0)+dt;f.t=executionTime(f.clock,f.def);const u=clamp(f.t/f.def.duration,0,1);f.fxClock+=dt;f.emit=f.fxClock>=1/24;if(f.emit)f.fxClock=0;
  api.pose(player,api.time());api.pose(f.enemy,api.time());f.enemy.torso.scale.set(1,1,1);f.props.forEach(p=>p.visible=false);f.ghosts.forEach(g=>g.root.visible=false);
  f.contacts=[];f.strikes=[];f.drag=null;f.carryVictim=null;choreograph(f,u);if(import.meta.env.DEV){f.authoredLegAngles=player.legs.map(n=>n.rotation.toArray().slice(0,3));player.root.updateMatrixWorld(true);f.authoredFeet=player.feet.map(n=>n.getWorldPosition(new THREE.Vector3()).toArray());}performExecution(f,player,dt);if(f.entryPose){const w=S(f.t,0,.38);for(const old of f.entryPose){old.node.quaternion.slerpQuaternions(old.q,old.node.quaternion.clone(),w);old.node.position.lerpVectors(old.p,old.node.position.clone(),w);}if(w>=1)f.entryPose=null;}if(!f.reworked)addStrikeContacts(f,u);actorWeight(f,player,u,dt);victimPerformance(f,u,dt);gravitasEvents(f,u,event);const turn=(a,b)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*(1-Math.exp(-dt*24));player.root.rotation.y=f.playerYaw=turn(f.playerYaw,player.root.rotation.y);f.enemy.root.rotation.y=f.victimYaw=turn(f.victimYaw,f.enemy.root.rotation.y);api.polish?.(f,dt);if(u>f.def.impact+.06)f.props.forEach(m=>m.visible=false);align(f);for(const g of f.ghosts)if(g.root.visible)api.smoothGhost?.(g,dt);
  if(u>=f.def.impact&&!f.impactDone){
   f.impactDone=true;const landing=f.enemy.root.position.clone().setY(.06),impactPoint=STRIKE_ENDINGS.has(f.def.id)?point(f):landing;
   api.burst(impactPoint.clone().add(new THREE.Vector3(0,.2,0)),f.color,f.def.school==='brutal'?42:65,10,1);
   api.ring(impactPoint,f.color,STRIKE_ENDINGS.has(f.def.id)?2:4.4,.35);if(!STRIKE_ENDINGS.has(f.def.id))api.ring(landing,0xe9d1a5,2.8,.22);api.kick(.6,.09);api.tone(f.def.school==='mind'?125:48,.45,'sawtooth',.15,17);api.tone(30,.6,'sine',.16,12);
   // GRAVITAS: the kill bleeds onto the ground and the world dilates for a beat.
   api.wound?.(f,impactPoint.clone().add(new THREE.Vector3(0,.35,0)),f.def.bossOnly?3.2:2.2);f.slow=f.chain?.18:f.def.bossOnly?.42:.32;
   api.onImpact(f,landing);
  }
  if(f.fireArc)f.fireArc.forEach((m,i)=>{const a=i/24*TAU,r=i%2?3.1:2.6;m.visible=u>.23&&u<f.def.impact+.05;m.position.copy(at(f,Math.sin(a)*r,.35,Math.cos(a)*r));m.scale.set(1,.6+.4*Math.sin(f.t*8+i)+.35,1);m.rotation.y=a+f.t;});
  // Camera is solved once, after the final contact pass.
  if(u>=1){cleanup(f);api.onFinish(f);}
 }
 function cleanup(f){
  if(f.preview)api.clearWounds?.(f);
  if(f.study){f.study.floor.geometry.dispose();f.study.floor.material.dispose();f.study.grid.geometry.dispose();f.study.grid.material.dispose();f.study.sun.shadow.map?.dispose();f.study=null;}
  for(const m of f.props||[]){scene.remove(m);m.geometry.dispose();m.material.dispose();}
  for(const g of f.ghosts||[]){api.removeGhost(g);}
  f.props=[];f.ghosts=[];f.enemy.torso.scale.set(1,1,1);
 }
 return {update,cleanup,align};
}
