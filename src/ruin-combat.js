import * as THREE from 'three';
const V=THREE.Vector3,clamp=THREE.MathUtils.clamp;
export const MELEE_REACH={light:2.65,heavy:2.85,lunge:3.05,aerial:3.15,hook:2.85,knee:2.65,riposte:3.05,guardbreak:2.8,crusher:3.15,riftstrike:3.35};
export const isRadial=a=>['cleave','stomp','slam','charged','sweep','flowburst'].includes(a.type)||(a.type==='light'&&a.step===3);
export function strikeWindow(a,impact){return [impact,Math.min(.86,impact+(a.type==='light'?.15:.12))];}
// A bounded active attack sector, not an instantaneous range check. Each action
// owns a target set. This is gameplay collision, not a claim of mesh-exact hits.
export function canMeleeHit(a,enemy,player,range,clear){
 if(a.targetsHit?.has(enemy)||enemy.dead)return false;
 const delta=enemy.root.position.clone().sub(player.root.position),vertical=Math.abs(delta.y-(a.type==='aerial'?player.rig.position.y:0));delta.y=0;
 const reach=range+(enemy.boss?.5:enemy.small?-.15:0);if(delta.length()>reach||vertical>(a.type==='slam'?10:3.2))return false;
 if(!isRadial(a)&&delta.normalize().dot(new V(Math.sin(player.root.rotation.y),0,Math.cos(player.root.rotation.y)))<.28)return false;
 return clear(player.root.position,enemy.root.position);
}
export function steerAttack(a,player,dt,impact){
 if(!a.target||a.target.dead||a.t/a.duration>impact-.055)return;
 const d=a.target.root.position.clone().sub(player.root.position).setY(0);if(d.length()>9)return;
 const yaw=Math.atan2(d.x,d.z),turn=Math.atan2(Math.sin(yaw-player.root.rotation.y),Math.cos(yaw-player.root.rotation.y));
 player.root.rotation.y+=clamp(turn,-dt*11,dt*11);
}
export function rendHit(e,a,blocked=false){
 if(blocked)return {bonus:0,rupture:false};
 if(a.type==='light'||a.type==='aerial'){e.rend=Math.min(3,(e.rend||0)+1);e.rendTime=5;return {bonus:0,rupture:false};}
 if((e.rend||0)>=3){e.rend=0;e.rendTime=0;return {bonus:22,rupture:true};}
 return {bonus:0,rupture:false};
}
export function createEncounterDirector(){
 let time=0,nextGrant=0,serial=0;const ids=new WeakMap();let active=0;
 function reset(){time=nextGrant=active=0;serial=0;}
 function id(e){if(!ids.has(e))ids.set(e,serial++);return ids.get(e);}
 function update(enemies,player,dt){
  time+=dt;const live=enemies.filter(e=>!e.dead&&!e.boss);
  for(const e of live){id(e);e.rendTime=Math.max(0,(e.rendTime||0)-dt);if(!e.rendTime)e.rend=0;const busy=['windup','strike'].includes(e.state);if(busy)e.attackTicket=time+.25;if(e.stagger>0||e.broken>0||e.physicalBody){e.attackTicket=0;}e.engagementWait=(e.engagementWait||0)+(busy?0:dt);}
  active=live.filter(e=>(e.attackTicket||0)>time).length;
  const budget=enemies.some(e=>e.boss&&!e.dead)?1:2;
  if(time>=nextGrant&&active<budget){
   const choices=live.filter(e=>(e.attackTicket||0)<=time&&e.stagger<=0&&!e.broken&&!e.physicalBody&&!e.rise&&e.state==='chase'&&e.root.position.distanceTo(player.root.position)<(e.caster?18:9));
   choices.sort((a,b)=>((b.engagementWait||0)-(a.engagementWait||0))*.6+a.root.position.distanceTo(player.root.position)-b.root.position.distanceTo(player.root.position));
   if(choices[0]){choices[0].attackTicket=time+2.2;choices[0].engagementWait=0;nextGrant=time+.38;active++;}
  }
 }
 function mayAttack(e){return(e.attackTicket||0)>time;}
 function orbit(e,player){const angle=id(e)*2.399963+time*(e.small?.17:.08),radius=e.caster?10.5:e.small?3.4:e.elite?4.8:4.1,goal=player.root.position.clone().add(new V(Math.sin(angle)*radius,0,Math.cos(angle)*radius));return goal.sub(e.root.position).setY(0).clampLength(0,1);}
 return{reset,update,mayAttack,orbit,info:()=>({activeReservations:active,time})};
}
export function attackClear(a,b,obstacles){const line=new THREE.Line3(a.clone().setY(0),b.clone().setY(0));return obstacles.every(o=>line.closestPointToPoint(new V(o.x,0,o.z),true,new V()).distanceTo(new V(o.x,0,o.z))>o.r+.12);}
