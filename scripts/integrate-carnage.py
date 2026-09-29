from pathlib import Path
p=Path('src/finishers.js');s=p.read_text();s=s.replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport {BOSS_FINISHERS,bossChoreography} from './boss-finishers.js';\nimport {alignInteractions,addStrikeContacts} from './contacts.js';",1)
s=s.replace("duration:3.8,impact:.8,beats:['Burning hook','Fire-spin drag','Spiral throw'],description:'Hook the enemy with a flaming arm, drag them through a spinning fire trail, and throw them down.',signature:'Both bodies travel a widening spiral before the release.'", "duration:5.2,impact:.87,marks:[0,.21,.7],beats:['Sweep and seize','Fire-ring drag','Flaming release'],description:'Sweep the enemy down, clamp an ankle, backpedal around a burning ring while their body scrapes the ground, then swing and release them.',signature:'A maintained ankle grip drives the victim’s motion; the body is actually dragged.'",1)
s=s.replace("\n];\n\nconst TAU", "\n,...BOSS_FINISHERS];\n\nconst TAU",1)
s=s.replace("function contact(f,hand,where,weight,x=0,z=.22){if(weight>0)f.contacts.push({hand,where,weight,x,z});}", "function contact(f,hand,where,weight,x=0,z=.22,side=0){if(weight>0)f.contacts.push({hand,where,weight,x,z,side});}")
a=s.index(' function align(f){');b=s.index(' function showRing(',a);s=s[:a]+" function align(f){alignInteractions(f,player);}\n"+s[b:]
s=s.replace("if(kind==='hit'){api.burst", "if(kind==='hit'){api.wound?.(f,p,1);api.burst",1)
s=s.replace("  if(kind==='dash'){", "  if(kind==='sever'){api.sever?.(f,location);api.kick(.3,.05);api.tone(64,.25,'sawtooth',.13,21);}\n  if(kind==='dash'){",1)
s=s.replace('  switch(id){', "  if(f.def.bossOnly)bossChoreography(f,u,{player,at,pos,arms,fallen,contact,event,showRing,S,pulse,emit});else switch(id){",1)
a=s.index("   case 'cinder-spiral':{");b=s.index("   case 'infernal-pillar':{",a)
s=s[:a]+'''   case 'cinder-spiral':{
    const sweep=S(u,.12,.25),travel=S(u,.29,.72),a=travel*Math.PI*1.6,radius=mix(C,2.5,S(u,.23,.34)),release=S(u,.72,I),tangent=f.side.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.front,-Math.sin(a));
    const path=at(f,Math.sin(a)*radius,0,Math.cos(a)*radius);p.root.position.lerpVectors(f.actorStart,path,S(u,0,.17));p.root.rotation.y=Math.atan2(-f.front.x,-f.front.z)+Math.atan2(Math.sin(Math.atan2(-tangent.x,-tangent.z)-Math.atan2(-f.front.x,-f.front.z)),Math.cos(Math.atan2(-tangent.x,-tangent.z)-Math.atan2(-f.front.x,-f.front.z)))*S(u,.2,.32);
    p.hips.position.y-=.56*sweep*(1-release);p.torso.rotation.x=-.22*sweep*(1-release);p.torso.rotation.y=.12*Math.sin(travel*30)*(1-release);p.arms[1].rotation.set(-.28,0,.19);p.forearms[1].rotation.x=-.08;p.arms[0].rotation.set(-.8,0,-.5);p.forearms[0].rotation.x=-1.2;
    p.legs[0].rotation.z-=.95*pulse(u,.1,.24);fallen(e,sweep,.08);e.rig.position.y=.17*sweep;e.root.rotation.y=Math.atan2(tangent.x,tangent.z);e.root.position.copy(f.origin).lerp(path.clone().addScaledVector(tangent,-1.4),S(u,.2,.31));e.root.position.y=.06;
    e.shins[1].rotation.x+=.25+Math.sin(travel*28)*.13*sweep;e.arms[0].rotation.x=-.9*sweep;e.forearms[0].rotation.x=-.25;e.head.rotation.z=.14*Math.sin(travel*22)*sweep;
    f.drag={hand:1,leg:0,weight:S(u,.2,.28)*(1-S(u,.72,.77))};
    if(u>.72){const endA=Math.PI*1.6,endT=f.side.clone().multiplyScalar(Math.cos(endA)).addScaledVector(f.front,-Math.sin(endA)),end=at(f,Math.sin(endA)*2.5,0,Math.cos(endA)*2.5);p.root.position.copy(end);p.root.rotation.y=Math.atan2(endT.x,endT.z);p.torso.rotation.x=.6*release;p.arms[1].rotation.x=-2.2*pulse(u,.72,.89);e.root.position.copy(end).addScaledVector(endT,mix(-1.0,3.0,release));e.root.position.y=.06+Math.sin(release*Math.PI)*1.3;e.rig.rotation.x=-1.48;}
    showRing(f,0,f.origin.clone().setY(.14),2.6);showRing(f,1,f.origin.clone().setY(.17),2.9);if(u>.27&&u<.78)emit(f,e.root.position.clone().setY(.2),5,1.1);
    event(f,'sweep',u,.18);event(f,'seize',u,.27,'pulse');event(f,'drag-start',u,.34,'dash');event(f,'drag-scrape',u,.57);event(f,'release',u,.78,'dash');break;
   }
''' +s[b:]
s=s.replace("f.contacts=[];choreograph(f,u);", "f.contacts=[];f.strikes=[];f.drag=null;choreograph(f,u);addStrikeContacts(f,u);",1)
s=s.replace(" function cleanup(f){", " function cleanup(f){\n  if(f.preview)api.clearWounds?.(f);",1)
# More acting during the long ritual phases rather than holding one pose.
s=s.replace("event(f,'cage',u,.33,'pulse');event(f,'compress',u,.6,'pulse');", "const pressure=pulse(u,.42,.53)+pulse(u,.55,.65)+pulse(u,.68,.77);p.forearms.forEach(a=>a.rotation.x-=.8*pressure);p.torso.rotation.x+=.25*pressure;e.spine.rotation.x-=.22*pressure;e.shins.forEach(a=>a.rotation.x+=.45*pressure);event(f,'cage',u,.33,'pulse');event(f,'compress-one',u,.47,'pulse');event(f,'compress-two',u,.6,'pulse');event(f,'compress-three',u,.73,'pulse');")
s=s.replace("const hook=pulse(u,.1,.32),pull=S(u,.32,.68),snap=S(u,I-.035,I+.015);", "const hook=pulse(u,.1,.32),pull=S(u,.32,.68),snap=S(u,I-.035,I+.015);contact(f,1,'chest',S(u,.11,.21)*(1-S(u,.25,.32)));p.arms[0].rotation.x=-.9*pull;p.forearms[0].rotation.x=-1.1*pull;")
p.write_text(s)
p=Path('src/boss-finishers.js');s=p.read_text().replace("p.root.rotation.y=Math.atan2(f.side.x*Math.cos(a)-f.front.x*Math.sin(a),f.side.z*Math.cos(a)-f.front.z*Math.sin(a));", "p.root.rotation.y=Math.atan2(-f.side.x*Math.cos(a)+f.front.x*Math.sin(a),-f.side.z*Math.cos(a)+f.front.z*Math.sin(a));").replace("p.torso.rotation.x=.4*take*(1-release)","p.torso.rotation.x=-.2*take*(1-release)").replace("p.arms[1].rotation.set(.18*take,0,.25)","p.arms[1].rotation.set(-.28*take,0,.25)").replace("e.root.rotation.y=p.root.rotation.y;", "e.root.rotation.y=p.root.rotation.y+Math.PI;")
a=s.index('  if(u>.6){');b=s.index('\n  showRing',a)
s=s[:a]+'''  if(u>.57){const r=S(u,.57,.68);p.root.position.lerp(at(f,-2.3,0,.9),r);e.root.position.lerp(at(f,-1.2,.06,-.3),r);e.root.position.y=.06+Math.sin(r*Math.PI)*.9;p.root.rotation.y=Math.atan2(e.root.position.x-p.root.position.x,e.root.position.z-p.root.position.z);p.legs[1].rotation.x=-1.6*(stomp1+stomp2);p.shins[1].rotation.x=.9*(stomp1+stomp2);p.torso.rotation.x=.55*(stomp1+stomp2);p.hips.position.y-=.2*(stomp1+stomp2);}
  for(const t of [.75,.86])f.strikes.push({hand:1,leg:true,where:'chest',weight:Math.max(0,1-Math.abs(u-t)/.035)});
''' +s[b:];p.write_text(s)
p=Path('src/cinematic.js');s=p.read_text().replace("const beats={", "const beats={\n 'kingbreaker':[.16,.56,0,'grapple'],'throne-of-cinders':[.17,.65,1,'turn'],'sovereigns-ruin':[.17,.56,0,'ritual'],")
s=s.replace("'cinder-spiral':[.22,.55,1,'turn']", "'cinder-spiral':[.18,.78,1,'turn']")
s=s.replace("if(!f.contacts?.length||", "if(f.drag?.weight>.2||!f.contacts?.length||",1)
p.write_text(s)
p=Path('src/motion.js');s=p.read_text().replace("const executionProfiles={", "const executionProfiles={\n 'kingbreaker':[-.25,.3,.28,0],'throne-of-cinders':[.24,-.3,.3,1],'sovereigns-ruin':[-.18,.26,.22,0],")
s=s.replace("gait:u<.15||(f.def.id==='soulbreaker'&&u>.3&&u<.44)","gait:u<.15||(f.def.id==='soulbreaker'&&u>.3&&u<.44)||(['cinder-spiral','throne-of-cinders'].includes(f.def.id)&&u>.25&&u<.73)")
p.write_text(s)
