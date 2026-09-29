import * as THREE from 'three';
import basaltSource from './assets/ashen-basalt.jpg?inline';
import {MELEE_REACH,strikeWindow,canMeleeHit,steerAttack,rendHit,createEncounterDirector,attackClear} from './ruin-combat.js';
import {curvedHorn,addRendVisual,updateRendVisual} from './ruin-models.js';
import {dreadSurface,makeSmallFiend} from './dread-models.js';
import {detailRig,wingSurface} from './onslaught-models.js';
import {bodyOverlap} from './body-spacing.js';
import {planExecution,stageClear,stagingSnapshot} from './execution-staging.js';
import {massOf,rememberBody,clearBody,startBody,stepBody,bodyInfo,stepMomentum,dynamicPose,kickBody} from './physical.js';
import {cinematicBody,correctReach} from './cinematic.js';
import {createImpactWorld} from './impact-world.js';
import {createGore} from './gore.js';
import {poseMotion,finishMotion,resetMotion,poseEnemyAction,poseBossMotion,poseDeath,noteImpact,beginRecovery,recoverMotion,polishExecution,motionInfo,impactAt,CAST_RELEASES,MOTION_CATALOG} from './motion.js';
import {createEclipseWorld,safeCamera} from './eclipse-world.js';
import {createEclipseSystems,RIFT_DEFINITIONS} from './eclipse-systems.js';
import { FINISHERS, FINISHER_SCHOOLS, createExecutionDirector } from './finishers.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
const $=s=>document.getElementById(s), TAU=Math.PI*2;
const scene=new THREE.Scene();scene.background=new THREE.Color('#101e22');scene.fog=new THREE.FogExp2('#233735',.0125);
const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,260);
const msTarget=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType});msTarget.samples=4;const composer=new EffectComposer(renderer,msTarget);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.45,.55,1.35);composer.addPass(bloom);composer.addPass(new OutputPass());
let eclipseSystems=null,eclipseWorld=null;
const encounter=createEncounterDirector();
const options={executionCamera:true,cameraDistance:8.6,fov:57,motion:true,cues:true,finisher:'auto',bossFinisher:'auto',smallFinisher:'auto',gore:true,quality:'balanced',sensitivity:1,volume:.6,shake:true,flashes:true};
try{Object.assign(options,JSON.parse(localStorage.getItem('hellbound-settings')||'{}'))}catch{}

scene.add(new THREE.HemisphereLight('#91b5be','#211b1b',1.12));
const sun=new THREE.DirectionalLight('#b5c7ce',1.8);sun.position.set(-20,36,12);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:110});sun.shadow.bias=-.0007;sun.shadow.normalBias=.05;scene.add(sun);
const clarityFill=new THREE.DirectionalLight('#adc0c5',1.2);scene.add(clarityFill,clarityFill.target);
const rim=new THREE.DirectionalLight('#bc593c',1.9);rim.position.set(15,13,-25);scene.add(rim);
const mat=(color,roughness=.8,metalness=.1)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const stone=mat('#343b35'), darkstone=mat('#232c27'), edgeStone=mat('#51564b'), metal=mat('#262d2a',.48,.72), bone=mat('#a59778',.7), obsidian=mat('#252725',.75,.35);
const glowMat=(color,intensity=2)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.5});
const ember=glowMat('#f86224',3), goldGlow=glowMat('#ffb15a',3), purpleGlow=glowMat('#ac8df4',3), ghostGlow=glowMat('#82e2c5',2);
const hornObsidian=mat('#3d332b',.72,.22),wingMembrane=mat('#351c21',.94,.05);wingMembrane.side=THREE.DoubleSide;wingMembrane.emissive.set('#45160e');wingMembrane.emissiveIntensity=.12;const membraneTime={value:0};wingMembrane.onBeforeCompile=shader=>{shader.uniforms.membraneTime=membraneTime;shader.vertexShader='uniform float membraneTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.z += sin(position.x*4.1-membraneTime*3.0+position.y*2.2)*.06*smoothstep(.1,1.7,abs(position.x));');};
const sharedRigMaterials=new Set([stone,darkstone,edgeStone,metal,bone,obsidian,ember,goldGlow,purpleGlow,ghostGlow,hornObsidian,wingMembrane]);
const boxG=new THREE.BoxGeometry(1,1,1), sphereG=new THREE.SphereGeometry(1,20,16), icoG=new THREE.IcosahedronGeometry(1,1);
function mesh(geo,material,parent=scene,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function box(parent,material,x,y,z,sx,sy,sz){return mesh(boxG,material,parent,x,y,z,sx,sy,sz)}
function orb(parent,material,x,y,z,sx,sy,sz){return mesh(sphereG,material,parent,x,y,z,sx,sy,sz)}
function cylinder(parent,material,x,y,z,rt,rb,h,n=10){return mesh(new THREE.CylinderGeometry(rt,rb,h,n),material,parent,x,y,z)}
function coneBetween(parent,a,b,r1,r2,material,n=10){const d=new THREE.Vector3().subVectors(b,a);const m=mesh(new THREE.CylinderGeometry(r2,r1,d.length(),n),material,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m}
function horn(parent,points,r,material){return mesh(curvedHorn(points,r),material,parent);}
const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=256;const tx=textureCanvas.getContext('2d');tx.fillStyle='#96978c';tx.fillRect(0,0,256,256);let texSeed=3827;const tr=()=>{texSeed=(texSeed*16807)%2147483647;return texSeed/2147483647};for(let i=0;i<23000;i++){const v=Math.floor(75+tr()*90);tx.fillStyle=`rgba(${v},${v},${v},${.08+tr()*.23})`;const sz=tr()*2.5;tx.fillRect(tr()*256,tr()*256,sz,sz)}for(let i=0;i<16;i++){tx.strokeStyle='rgba(40,46,40,.16)';tx.lineWidth=tr()*1.2;tx.beginPath();let x=tr()*256,y=tr()*256;tx.moveTo(x,y);for(let j=0;j<5;j++){x+=tr()*35-17;y+=tr()*35;tx.lineTo(x,y)}tx.stroke()}const stoneTexture=new THREE.CanvasTexture(textureCanvas);stoneTexture.wrapS=stoneTexture.wrapT=THREE.RepeatWrapping;stoneTexture.colorSpace=THREE.SRGBColorSpace;stoneTexture.repeat.set(2,2);stoneTexture.anisotropy=4;[stone,darkstone,edgeStone].forEach(m=>{m.map=stoneTexture;m.bumpMap=stoneTexture;m.bumpScale=.095;});
const basaltTexture=new THREE.TextureLoader().load(basaltSource);basaltTexture.colorSpace=THREE.SRGBColorSpace;basaltTexture.wrapS=basaltTexture.wrapT=THREE.RepeatWrapping;basaltTexture.anisotropy=4;for(const m of [stone,darkstone,edgeStone]){m.map=basaltTexture;m.bumpMap=basaltTexture;m.bumpScale=.065;}
let seed=7291;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const rr=(a,b)=>a+rand()*(b-a);
// A traversable wasteland, not a backdrop: layered paths, ritual courts, ruined halls.
const ground=mesh(new THREE.CircleGeometry(170,100),mat('#29342e'),scene,0,-.12,0);const earthTexture=stoneTexture.clone();earthTexture.repeat.set(65,65);earthTexture.needsUpdate=true;ground.material.map=earthTexture;ground.material.bumpMap=earthTexture;ground.material.bumpScale=.14;ground.rotation.x=-Math.PI/2;
const courtyard=cylinder(scene,stone,0,-.24,0,25,25,.35,80);
for(let i=0;i<5;i++){const ring=mesh(new THREE.TorusGeometry(5+i*4.6,.025,4,130),i===4?edgeStone:darkstone,scene,0,.075,0);ring.rotation.x=Math.PI/2}
const tileGeo=new THREE.BoxGeometry(1,.1,1);const tileInst=new THREE.InstancedMesh(tileGeo,stone,1000);tileInst.receiveShadow=true;let idx=0;const dummy=new THREE.Object3D();
for(let x=-15;x<=15;x++)for(let z=-15;z<=15;z++){const px=x*2.7,pz=z*2.7;if(Math.hypot(px,pz)>39||rand()<.13)continue;dummy.position.set(px+rr(-.12,.12),rr(-.035,.01),pz+rr(-.12,.12));dummy.rotation.set(0,rr(-.035,.035),0);dummy.scale.set(rr(2.42,2.58),1,rr(2.42,2.58));dummy.updateMatrix();tileInst.setMatrixAt(idx++,dummy.matrix)}tileInst.count=idx;scene.add(tileInst);
// Fractures glowing between the paving stones.
for(let i=0;i<47;i++){const a=rr(0,TAU),r=rr(9,45),g=new THREE.Group();g.position.set(Math.sin(a)*r,.061,Math.cos(a)*r);g.rotation.y=a;scene.add(g);let x=0,z=0;for(let j=0;j<4;j++){let nx=x+rr(-.7,.7),nz=z+rr(.3,1.25);coneBetween(g,new THREE.Vector3(x,0,z),new THREE.Vector3(nx,0,nz),.015,.025,ember,4);x=nx;z=nz}}
const obstacles=[];function resolveWorld(pos){for(const o of obstacles){let dx=pos.x-o.x,dz=pos.z-o.z,d=Math.hypot(dx,dz),r=o.r+.42;if(d<r&&d>.001){pos.x=o.x+dx/d*r;pos.z=o.z+dz/d*r}}}
function column(x,z,h=11,ruined=false){obstacles.push({x,z,r:1.25});let g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(g,darkstone,0,.35,0,2.9,.7,2.9);box(g,edgeStone,0,.76,0,2.5,.16,2.5);box(g,stone,0,1.15,0,2.1,.6,2.1);const hh=ruined?h*.48:h;cylinder(g,stone,0,hh/2+1.35,0,.72,.89,hh,8);for(let j=0;j<4;j++){const a=j*TAU/4+Math.PI/4;cylinder(g,edgeStone,Math.sin(a)*.7,hh/2+1.4,Math.cos(a)*.7,.15,.2,hh,6)}box(g,edgeStone,0,hh+1.35,0,2.1,.35,2.1);if(!ruined){box(g,stone,0,hh+1.9,0,2.5,.6,2.5);mesh(new THREE.ConeGeometry(.6,3,5),darkstone,g,0,hh+3.7,0)}else{const rock=mesh(icoG,stone,g,.1,hh+1.7,0,1,.65,.8);rock.rotation.z=.4}return g}
function gothicArch(x,z,width,height,rot=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);const outer=[];for(let i=0;i<=16;i++){const t=i/16;const xx=(t-.5)*width;const yy=height+Math.sqrt(Math.max(0,1-Math.pow(Math.abs(t-.5)*2,1.5)))*width*.66;outer.push(new THREE.Vector3(xx,yy,0))}for(let i=0;i<outer.length-1;i++)coneBetween(g,outer[i],outer[i+1],.42,.42,edgeStone,5);for(let side of [-1,1]){box(g,stone,side*width/2,height/2,0,.75,height,1);box(g,darkstone,side*(width/2+.6),height/2,0,.45,height+2,1.5)}return g}
for(let s of [-1,1])for(let i=0;i<6;i++){let x=s*(22+Math.sin(i*.8)*2),z=-31+i*12;column(x,z,rr(10,16),i===3||i===5);if(i<5&&i!==2)gothicArch(x,-25+i*12,12,11,Math.PI/2)}
// A shattered cathedral and its central gate.
for(let s of [-1,1]){box(scene,stone,s*11,9,-37,9,18,4);box(scene,darkstone,s*17,13,-38,3,26,6);column(s*17,-34,24);for(let j=0;j<3;j++){let wx=s*(7+j*3);gothicArch(wx,-34.8,1.4,10);box(scene,obsidian,wx,8,-34.85,1.2,6,.1)}box(scene,edgeStone,s*11,17.5,-34.8,10,.3,1);for(let j=0;j<4;j++)mesh(new THREE.ConeGeometry(.45,4,4),darkstone,scene,s*(7+j*2.8),21,-36)}
gothicArch(0,-34.5,10,11);gothicArch(0,-35,12,11.3);
const portal=new THREE.Group();portal.position.set(0,5,-35);scene.add(portal);const portalInner=mesh(new THREE.CircleGeometry(4.5,64),new THREE.MeshBasicMaterial({color:'#241d13',transparent:true,opacity:.8,side:THREE.DoubleSide}),portal);portalInner.scale.y=1.35;
for(let i=0;i<3;i++){const t=mesh(new THREE.TorusGeometry(4.2+i*.19,.028+i*.006,6,100),i===1?goldGlow:ember,portal,0,0,i*.03);t.scale.y=1.35;}
const gateLight=new THREE.PointLight('#fa6326',65,35,2);gateLight.position.set(0,5,-31);scene.add(gateLight);
for(let i=0;i<20;i++){const a=i*TAU/20;const r=mesh(boxG,goldGlow,portal,Math.cos(a)*4.58,Math.sin(a)*6.1,.05,.04,.24,.045);r.rotation.z=a;}
// The eclipse and sky now use the atmospheric shader in eclipse-world.js.
for(let i=0;i<70;i++){const a=rr(0,TAU),r=rr(108,153),h=rr(12,35);const m=mesh(new THREE.ConeGeometry(rr(9,17),h,rr(4,8)|0),darkstone,scene,Math.cos(a)*r,h/2-3,Math.sin(a)*r);m.rotation.set(rr(-.15,.15),rand()*TAU,rr(-.2,.2))}
for(let i=0;i<180;i++){const a=rr(0,TAU),r=rr(17,61);let m=mesh(icoG,i%4===0?edgeStone:darkstone,scene,Math.sin(a)*r,rr(.05,.3),Math.cos(a)*r,rr(.2,1.3),rr(.18,.9),rr(.3,1.4));m.rotation.set(rand()*3,rand()*3,rand()*3)}
const barkMaterial=mat('#202822');
function deadTree(x,z,size){obstacles.push({x,z,r:.4*size,h:8*size});const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(size);scene.add(g);const bark=barkMaterial;horn(g,[[0,0,0],[.15,2,0],[-.2,4,0],[.3,6,-.3],[.1,8,-.5]],.4,bark);for(let s of [-1,1]){horn(g,[[0,3,0],[s*1.3,4,.2],[s*2.2,5,.3],[s*2.5,6.5,.5]],.2,bark);horn(g,[[s*.1,5,-.2],[s*1.2,6,-.7],[s*1.5,7,-.9]],.12,bark)}}for(let i=0;i<16;i++){const a=rand()*TAU;deadTree(Math.sin(a)*rr(35,58),Math.cos(a)*rr(35,58),rr(.7,1.6))}
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,198,91,.8)');gradient.addColorStop(.16,'rgba(255,105,33,.42)');gradient.addColorStop(.48,'rgba(241,76,20,.13)');gradient.addColorStop(1,'rgba(220,55,9,0)');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);const glowTexture=new THREE.CanvasTexture(glowCanvas);function glowSprite(parent,x,y,z,size,opacity=.6){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0xff9a65,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));s.position.set(x,y,z);s.scale.setScalar(size);parent.add(s);return s}
glowSprite(portal,0,0,.2,16,.48);
const fires=[];function brazier(x,z){obstacles.push({x,z,r:.85,h:2.9});const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);cylinder(g,darkstone,0,.18,0,.7,.9,.36);cylinder(g,metal,0,1,0,.22,.35,1.6);cylinder(g,metal,0,1.8,0,.8,.35,.6,8);const f=orb(g,ember,0,2.35,0,.28,.6,.28);fires.push(f);glowSprite(g,0,2.35,0,3.8,.7);const l=new THREE.PointLight('#ff782d',12,12,2);l.position.set(x,2.7,z);scene.add(l);for(let j=0;j<5;j++){const a=j*TAU/5;coneBetween(g,new THREE.Vector3(Math.cos(a)*.7,1.8,Math.sin(a)*.7),new THREE.Vector3(Math.cos(a)*.85,2.6,Math.sin(a)*.85),.045,0,metal)}}for(let x of [-13,13])for(let z of [-23,0,22])brazier(x,z);
const ashN=700,ashPos=new Float32Array(ashN*3);for(let i=0;i<ashN;i++){ashPos[i*3]=rr(-65,65);ashPos[i*3+1]=rr(.1,40);ashPos[i*3+2]=rr(-65,65)}const ashGeo=new THREE.BufferGeometry();ashGeo.setAttribute('position',new THREE.BufferAttribute(ashPos,3));const ash=new THREE.Points(ashGeo,new THREE.PointsMaterial({color:'#b7b49d',size:.055,transparent:true,opacity:.6,depthWrite:false}));scene.add(ash);
// Connected districts give the hunt room to move beyond the central court.
const districts=[{name:'Cathedral of Cinders',x:0,z:-4},{name:'The Pale Necropolis',x:-53,z:18},{name:'Cinderwatch Bastion',x:53,z:-18},{name:'The Hollow Grove',x:15,z:62}];
const shrines=[];
for(let i=1;i<districts.length;i++){
 const d=districts[i];
 for(let step=10;step<Math.hypot(d.x,d.z);step+=3){const f=step/Math.hypot(d.x,d.z);for(let side of [-1,0,1]){let b=box(scene,side===0?edgeStone:darkstone,d.x*f+side*1.9,.015,d.z*f,1.75,.08,2.7);b.rotation.y=Math.atan2(d.x,d.z)+rr(-.05,.05);}}
 cylinder(scene,darkstone,d.x,-.035,d.z,11,11,.13,48);
 for(let j=0;j<2;j++){const ring=mesh(new THREE.TorusGeometry(3+j*6,.04,4,60),edgeStone,scene,d.x,.075,d.z);ring.rotation.x=-Math.PI/2;}
 const g=new THREE.Group();g.position.set(d.x,0,d.z);scene.add(g);
 cylinder(g,stone,0,.3,0,1.4,1.7,.6,6);cylinder(g,obsidian,0,.9,0,.65,.9,.8,6);
 const diamond=mesh(new THREE.OctahedronGeometry(.48),i===1?ghostGlow:i===2?ember:purpleGlow,g,0,1.95,0);diamond.userData.dynamic=true;
 for(let k=0;k<3;k++){let a=k*TAU/3;horn(g,[[Math.cos(a),.5,Math.sin(a)],[Math.cos(a)*1.2,1.6,Math.sin(a)*1.2],[Math.cos(a)*.65,2.65,Math.sin(a)*.65]],.11,bone);}
 shrines.push({x:d.x,z:d.z,diamond,usedWave:-1});
 if(i===1){for(let j=0;j<22;j++){const a=j*TAU/22,r=rr(5,12),x=d.x+Math.sin(a)*r,z=d.z+Math.cos(a)*r;let slab=box(scene,stone,x,.18,z,.9,.35,1.8);slab.rotation.y=a;let grave=box(scene,edgeStone,x,.85,z-.65,.65,1.4,.22);grave.rotation.z=rr(-.2,.2);}gothicArch(d.x,d.z-11,7,5);column(d.x-4,d.z-11,5,true);column(d.x+4,d.z-11,5,true);}
 if(i===2){for(let side of [-1,1]){column(d.x+side*9,d.z-8,15);column(d.x+side*9,d.z+8,12,true);box(scene,stone,d.x+side*9,3.2,d.z,1.5,6.4,14);gothicArch(d.x+side*9,d.z,8,6,Math.PI/2);}brazier(d.x-5,d.z-5);brazier(d.x+5,d.z-5);}
 if(i===3){for(let j=0;j<12;j++){let a=j*TAU/12;deadTree(d.x+Math.sin(a)*rr(8,14),d.z+Math.cos(a)*rr(8,14),rr(1.1,1.7));}for(let j=0;j<7;j++){let a=j*TAU/7;const m=mesh(icoG,darkstone,scene,d.x+Math.sin(a)*7,1.6,d.z+Math.cos(a)*7,.65,2.3,.8);m.rotation.z=rr(-.15,.15);}}
}
function commune(){if(mode!=='game'||paused||wheelOpen||finisher)return;const s=shrines.find(s=>Math.hypot(s.x-player.root.position.x,s.z-player.root.position.z)<4);if(!s){notify('Approach a glowing shrine to commune');return;}if(s.usedWave===wave){notify('This shrine will awaken with the next wave');return;}s.usedWave=wave;health=Math.min(runMods.maxHealth,health+30);energy=Math.min(100,energy+40);ring(new THREE.Vector3(s.x,0,s.z),0xa7dabf,5,.9);burst(new THREE.Vector3(s.x,1.6,s.z),0xa7dabf,70,5,1.1);actionText('SOUL COMMUNION');tone(250,.7,'sine',.09,80);}

// Wind-torn standards and ritual statuary bring scale to the ruins.
const windUniform={value:0};
const cloth=mat('#481f23',.96,0);cloth.side=THREE.DoubleSide;
cloth.onBeforeCompile=shader=>{shader.uniforms.windTime=windUniform;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.z += sin(position.y * 1.4 + windTime * 1.6 + position.x)*.24*(1.0-uv.y); transformed.x += cos(position.y * 2.0 + windTime)*.08*(1.0-uv.y);');};
for(let side of [-1,1])for(let i=0;i<4;i++){
 const x=side*21,z=-29+i*14;const flag=mesh(new THREE.PlaneGeometry(1.55,4.7,4,14),cloth,scene,x,8.4,z);flag.rotation.y=side*.35;
 const positions=flag.geometry.attributes.position;for(let j=0;j<positions.count;j++){if(positions.getY(j)<-2)positions.setY(j,positions.getY(j)-Math.sin(positions.getX(j)*11)*.23);}
 coneBetween(scene,new THREE.Vector3(x-1,10.9,z),new THREE.Vector3(x+1,10.9,z),.055,.055,metal);
 for(let k=0;k<9;k++){const chain=mesh(new THREE.TorusGeometry(.11,.025,4,10),metal,scene,x,10.9+k*.2,z);chain.rotation.y=k%2?Math.PI/2:0;}
}
for(let side of [-1,1]){
 const g=new THREE.Group();g.position.set(side*9,0,-25);scene.add(g);cylinder(g,darkstone,0,.4,0,1.6,2,.8,8);box(g,stone,0,1.1,0,2.1,.6,2.1);
 const statue=mat('#474c42',.97,.06);mesh(new THREE.ConeGeometry(1.05,4,6),statue,g,0,3.3,0);orb(g,statue,0,5.35,0,.42,.56,.38);horn(g,[[0,5.8,0],[.2,6.2,-.1],[0,6.65,-.2]],.24,statue);coneBetween(g,new THREE.Vector3(-.55,4.6,0),new THREE.Vector3(-1.4,4.1,.3),.26,.18,statue);coneBetween(g,new THREE.Vector3(1.4,4.1,.3),new THREE.Vector3(.55,4.6,0),.18,.26,statue);box(g,obsidian,-1.4,3,.4,.13,3.3,.16);
}
const grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.12,.7,3),mat('#343c2e',1),950);let gi=0;for(let i=0;i<950;i++){const a=rr(0,TAU),r=rr(29,96);dummy.position.set(Math.sin(a)*r,.1,Math.cos(a)*r);dummy.rotation.set(rr(-.25,.25),rr(0,TAU),rr(-.4,.4));dummy.scale.set(rr(.6,1.2),rr(.4,1.8),.18);dummy.updateMatrix();grass.setMatrixAt(gi++,dummy.matrix);}grass.receiveShadow=true;scene.add(grass);

// REVEL dressing pass: candles, hanging cages, ossuary spill, glow seams and wayfires.
{// Private PRNG: dressing never shifts the gameplay rr() stream.
{let ds=9021;const dr=()=>(ds=ds*16807%2147483647)/2147483647,drr=(a,b)=>a+(b-a)*dr();
 const wax=mat('#c9b89a',.9,0),cage=metal;
 function candle(x,z,h=.42){mesh(new THREE.CylinderGeometry(.085,.1,h,7),wax,scene,x,h/2+.02,z);const flame=mesh(new THREE.SphereGeometry(.07,7,5),ember,scene,x,h+.09,z);flame.scale.set(.55,.8,.55);fires.push(flame);}
 for(let i=0;i<10;i++){const side=i%2?1:-1;candle(side*drr(11.5,15.5),-24+i*5.2,drr(.35,.62));}
 for(let i=0;i<8;i++){const a=i*TAU/8;candle(-58+Math.sin(a)*9,Math.cos(a)*9);candle(58+Math.sin(a)*9,Math.cos(a)*9);}
 for(let i=0;i<4;i++){const z=-14+i*9;brazier(-26,z);brazier(26,z);}
 function cageHang(x,y,z){for(let k=0;k<7;k++){const link=mesh(new THREE.TorusGeometry(.12,.026,4,10),cage,scene,x,y+k*.22,z);link.rotation.y=k%2?Math.PI/2:0;}mesh(new THREE.BoxGeometry(.78,1.05,.78),cage,scene,x,y-.75,z);mesh(new THREE.IcosahedronGeometry(.13,0),purpleGlow,scene,x,y-.72,z);}
 cageHang(-7.5,7.6,-6);cageHang(8,8.4,3.5);cageHang(.5,9.2,-19);cageHang(-52,6.2,-8);cageHang(47,6.8,10);
 function bones(x,z,n=4){for(let i=0;i<n;i++){const m=mesh(new THREE.IcosahedronGeometry(.16,0),bone,scene,x+drr(-.5,.5),.12,z+drr(-.5,.5));m.scale.setScalar(drr(.6,1.2));m.rotation.set(drr(0,TAU),drr(0,TAU),drr(0,TAU));}}
 for(let i=0;i<14;i++)bones(drr(-16,16),drr(-26,26),Math.ceil(drr(2,5)));
 for(let i=0;i<7;i++){const m=mesh(new THREE.BoxGeometry(drr(1.6,3.2),.05,.07),goldGlow,scene,drr(-14,14),.09,drr(-24,24));m.rotation.y=drr(0,TAU);}
 for(let i=0;i<3;i++){const a=drr(0,TAU),r=drr(28,33),x=Math.sin(a)*r,z=Math.cos(a)*r;deadTree(x,z,1.3);deadTree(x+3,z-2,1.7);}
}}

// Bake architecture by material; the world stays rich without thousands of draw calls.
scene.updateMatrixWorld(true);
const worldBatches=new Map(),worldParts=[];
scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!fires.includes(o)&&!o.userData.dynamic&&!o.material.transparent){let list=worldBatches.get(o.material)||[];let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(o.matrixWorld);list.push(g);worldBatches.set(o.material,list);worldParts.push(o)}});
worldParts.forEach(o=>o.removeFromParent());worldBatches.forEach((geos,material)=>{const g=mergeGeometries(geos);if(g){const m=new THREE.Mesh(g,material);m.receiveShadow=true;m.castShadow=true;scene.add(m)}geos.forEach(g=>g.dispose())});
function batchRig(root){const parents=[];root.traverse(o=>{if(o.isGroup)parents.push(o)});for(let parent of parents){const groups=new Map();for(let o of [...parent.children]){if(!o.isMesh)continue;let arr=groups.get(o.material)||[];arr.push(o);groups.set(o.material,arr)}groups.forEach((parts,material)=>{if(parts.length<2)return;const geos=parts.map(o=>{o.updateMatrix();let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();return g.applyMatrix4(o.matrix)});const g=mergeGeometries(geos);if(g){parts.forEach(o=>parent.remove(o));const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;parent.add(m)}geos.forEach(g=>g.dispose())})}}
// Articulated creatures: horns, articulated claws, layered armor and a living tail.
function muscle(parent,material,x,y,z,r,h,depth=1){
 const points=[[0,-h*.5],[r*.62,-h*.45],[r*.9,-h*.25],[r,h*.08],[r*.79,h*.34],[r*.45,h*.49],[0,h*.5]].map(p=>new THREE.Vector2(...p));
 const m=mesh(new THREE.LatheGeometry(points,18),material,parent,x,y,z);m.scale.z=depth;return m;
}
function forgeAnatomy({torso,head,hips,arms,forearms,shins,isPlayer,elite,armor,skin,glow}){
 const alloy=mat(isPlayer?'#59625a':elite?'#534d66':'#374746',.45,.68),trim=mat(isPlayer?'#b89a6b':elite?'#9182a3':'#82927e',.6,.35);
 const shape=new THREE.Shape();shape.moveTo(-.5,.25);shape.lineTo(-.3,.56);shape.lineTo(.22,.48);shape.lineTo(.48,-.06);shape.lineTo(.12,-.52);shape.lineTo(-.36,-.28);shape.closePath();
 const plateG=new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,steps:1,bevelSegments:2,bevelSize:.035,bevelThickness:.03});
 for(let i=0;i<2;i++){const sign=i?1:-1;
  for(let j=0;j<3;j++){const p=mesh(plateG,alloy,torso,sign*(.33-j*.045),.3-j*.145,.2,.32,.18,.8);p.rotation.z=sign*(.4-j*.07);}
  const hip=mesh(plateG,alloy,hips,sign*.31,-.16,.21,.38,.4,.8);hip.rotation.z=-sign*.2;
  const knee=mesh(plateG,alloy,shins[i],0,-.07,.19,.28,.32,1);knee.rotation.z=sign*.12;
  for(let j=0;j<3;j++){const band=mesh(new THREE.TorusGeometry(.135,.016,4,12,Math.PI*1.4),trim,forearms[i],0,-.09-j*.09,.015);band.rotation.x=Math.PI/2;band.rotation.z=-Math.PI*.2;}
  const cheek=mesh(plateG,alloy,head,sign*.17,.015,.16,.14,.22,.6);cheek.rotation.z=sign*.45;
  horn(arms[i],[[sign*.06,.13,-.07],[sign*.21,.27,-.18],[sign*.29,.3,-.42]],elite?.12:.075,armor);
 }
 const jaw=new THREE.Group();jaw.position.set(0,-.03,.12);head.add(jaw);muscle(jaw,skin,0,-.075,.015,.125,.2,1.05);box(jaw,armor,0,-.018,.09,.23,.035,.025);
 for(let i=0;i<6;i++){const tooth=mesh(new THREE.ConeGeometry(i%5===0?.024:.016,i%5===0?.1:.055,5),bone,jaw,(i-2.5)*.035,.022,.12);tooth.rotation.z=(i-2.5)*-.04;}
 for(let j=0;j<4;j++){const vertebra=mesh(new THREE.OctahedronGeometry(.105),alloy,torso,0,.65-j*.17,-.24,.8,1.25,1);}
 if(elite)for(let i=0;i<3;i++)horn(head,[[(i-1)*.13,.31,-.14],[(i-1)*.2,.61,-.31],[(i-1)*.23,.85,-.5]],.07,trim);
 for(let side of [-1,1]){const ridge=mesh(new THREE.TorusGeometry(.175,.018,5,18,Math.PI*.8),trim,head,side*.08,.22,.16);ridge.rotation.z=side*.3;for(let j=0;j<3;j++){const scar=box(torso,glow,side*(.28+j*.027),.46-j*.022,.285,.014,.1,.009);scar.rotation.z=side*.5;}}
 return jaw;
}

const skinCanvas=document.createElement('canvas');skinCanvas.width=skinCanvas.height=128;const sk=skinCanvas.getContext('2d');sk.fillStyle='#b5afa7';sk.fillRect(0,0,128,128);for(let y=0;y<128;y+=4)for(let x=0;x<128;x+=4){const v=120+Math.floor((Math.sin(x*17+y*29)*.5+.5)*85);sk.fillStyle=`rgb(${v},${v},${v})`;sk.beginPath();sk.ellipse(x+(y%8?2:0),y,2,1.5,.2,0,TAU);sk.fill();}const skinTexture=new THREE.CanvasTexture(skinCanvas);skinTexture.wrapS=skinTexture.wrapT=THREE.RepeatWrapping;skinTexture.repeat.set(3,3);
function creature(isPlayer=false,elite=false){const root=new THREE.Group();scene.add(root);const rig=new THREE.Group();root.add(rig);const skin=mat(isPlayer?'#61372f':elite?'#514650':'#4a5650',.66,.06), flesh=mat(isPlayer?'#764d3b':'#596057',.8), armor=isPlayer?obsidian:metal, glow=isPlayer?ember:elite?purpleGlow:goldGlow;
skin.bumpMap=skinTexture;skin.bumpScale=.032;skin.roughnessMap=skinTexture;flesh.bumpMap=skinTexture;flesh.bumpScale=.02;const hips=new THREE.Group();hips.position.y=1.22;rig.add(hips);orb(hips,skin,0,0,0,.36,.3,.25);const spine=new THREE.Group();spine.position.y=.19;hips.add(spine);const torso=new THREE.Group();spine.add(torso);orb(torso,skin,0,.35,0,.48,.57,.25);orb(torso,skin,0,.04,.025,.28,.3,.24);for(let s of [-1,1]){orb(torso,flesh,s*.24,.52,.12,.26,.22,.19);for(let j=0;j<3;j++)orb(torso,flesh,s*.12,.28-j*.13,.21,.11,.085,.08);orb(torso,armor,s*.48,.62,-.045,.21,.12,.24);for(let j=0;j<3;j++)horn(torso,[[s*(.38+j*.11),.65,-.1],[s*(.5+j*.13),.89,-.14],[s*(.58+j*.16),1.04,-.18]],.065,isPlayer?hornObsidian:bone)}
for(let i=0;i<5;i++){const shard=box(torso,glow,Math.sin(i*1.8)*.075,.65-i*.12,.278,.025,.095,.019);shard.rotation.z=i%2?.5:-.6}
const neck=new THREE.Group();neck.position.set(0,.94,.015);torso.add(neck);const head=new THREE.Group();neck.add(head);orb(head,skin,0,.12,0,.23,.3,.22);orb(head,armor,0,.22,-.08,.245,.23,.18);orb(head,skin,0,-.025,.035,.16,.12,.15);for(let s of [-1,1]){const brow=box(head,armor,s*.105,.19,.2,.21,.085,.07);brow.rotation.z=s*.3;const eye=box(head,glow,s*.105,.135,.217,.12,.033,.025);eye.rotation.z=-s*.18;if(isPlayer||elite)horn(head,[[s*.17,.29,-.03],[s*.3,.53,-.11],[s*.37,.8,-.2],[s*.32,1.01,-.12],[s*.23,1.14,.02]],.1,isPlayer?hornObsidian:bone);else horn(head,[[s*.16,.27,-.03],[s*.26,.45,-.14],[s*.34,.6,-.29]],.1,armor);horn(head,[[s*.19,.15,-.12],[s*.34,.27,-.27],[s*.36,.48,-.35]],.07,armor);horn(head,[[s*.13,-.02,.17],[s*.07,-.22,.18]],.055,bone)}const nose=mesh(new THREE.ConeGeometry(.065,.23,3),armor,head,0,.05,.237);nose.rotation.x=.3;
const arms=[],forearms=[],hands=[],legs=[],shins=[],feet=[],toes=[],fingers=[[],[]];
for(let s of [-1,1]){const arm=new THREE.Group();arm.position.set(s*.49,.61,0);torso.add(arm);arms.push(arm);muscle(arm,skin,s*.04,-.21,0,.19,.59,.95);const fore=new THREE.Group();fore.position.set(s*.065,-.47,0);arm.add(fore);forearms.push(fore);muscle(fore,skin,0,-.2,.02,.145,.51,.96);orb(fore,armor,0,-.17,-.08,.16,.27,.09);for(let j=0;j<2;j++)horn(fore,[[s*.1,-j*.2,-.09],[s*.24,-j*.2+.07,-.25]],.065,bone);const hand=new THREE.Group();hand.position.set(0,-.4,.02);fore.add(hand);hands.push(hand);orb(hand,skin,0,-.05,0,.15,.13,.09);for(let j=0;j<4;j++){const xx=(j-1.5)*.074,finger=new THREE.Group();finger.position.set(xx,-.1,.015);hand.add(finger);fingers[s<0?0:1].push(finger);horn(finger,[[0,0,0],[xx*.12,-.09,.022]],.035,skin);const distal=new THREE.Group();distal.position.set(xx*.12,-.09,.022);finger.add(distal);finger.userData.distal=distal;horn(distal,[[0,0,0],[xx*.1,-.055,.027],[xx*.13,-.12,.123]],.033,isPlayer?bone:armor);}const thumb=new THREE.Group();thumb.position.set(s*.12,-.01,.03);hand.add(thumb);fingers[s<0?0:1].push(thumb);horn(thumb,[[0,0,0],[s*.11,-.11,.04],[s*.08,-.19,.12]],.045,bone);
const leg=new THREE.Group();leg.position.set(s*.225,-.1,0);hips.add(leg);legs.push(leg);muscle(leg,skin,0,-.24,.01,.22,.64,.96);const shin=new THREE.Group();shin.position.set(0,-.48,.02);leg.add(shin);shins.push(shin);orb(shin,armor,0,-.03,.095,.16,.17,.13);muscle(shin,skin,0,-.23,-.04,.135,.5,1.03);orb(shin,armor,0,-.38,-.025,.14,.2,.14);const foot=new THREE.Group();foot.position.set(0,-.56,.115);shin.add(foot);feet.push(foot);orb(foot,armor,0,0,0,.18,.13,.28);const toe=new THREE.Group();toe.position.set(0,0,.18);foot.add(toe);toes.push(toe);for(let j=0;j<3;j++)horn(toe,[[(j-1)*.09,.02,-.035],[(j-1)*.1,-.01,.105]],.04,bone);const flap=mesh(new THREE.ConeGeometry(.22,.78,3,1,true),armor,hips,s*.31,-.4,-.02);flap.rotation.z=s*.18;}
const belt=cylinder(hips,armor,0,.05,0,.38,.4,.16,10);belt.scale.z=.75;const buckle=mesh(new THREE.OctahedronGeometry(.105),glow,hips,0,.05,.31);let tail=[];if(isPlayer){let parent=hips;for(let i=0;i<8;i++){let g=new THREE.Group();g.position.set(0,i===0?-.03:-.05,i===0?-.2:-.26);parent.add(g);coneBetween(g,new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.05,-.26),.085*(1-i/9),.07*(1-i/9),skin);parent=g;tail.push(g)}mesh(new THREE.ConeGeometry(.12,.3,3),bone,parent,0,-.05,-.35).rotation.x=-Math.PI/2;for(let i=0;i<5;i++)horn(torso,[[0,.68-i*.13,-.22],[0,.83-i*.13,-.48]],.065,bone)}
const jaw=forgeAnatomy({torso,head,hips,arms,forearms,shins,isPlayer,elite,armor,skin,glow});const wings=isPlayer?makeWings(torso):[];enhanceArmor({torso,arms,forearms,shins,head,isPlayer,armor,glow});detailRig({torso,head,hips,arms,forearms,hands,shins,isPlayer,elite},membraneTime);batchRig(root);root.scale.setScalar(isPlayer?1.2:elite?1.2:1.05);const ownedMaterials=new Set();root.traverse(o=>{if(o.isMesh&&!sharedRigMaterials.has(o.material))ownedMaterials.add(o.material);});const result={root,rig,hips,spine,torso,neck,head,jaw,arms,forearms,hands,legs,shins,feet,toes,fingers,tail,wings,ownedMaterials,baseHip:1.22,isPlayer};dreadSurface(result);return result;}
function makeWings(parent){
 const wings=[];
 for(const side of [-1,1]){
  const root=new THREE.Group();root.position.set(side*.3,.66,-.2);root.rotation.y=side*1.02;root.scale.set(.87,.94,.87);parent.add(root);
  const coords=[[0,0],[.56,.71],[1.1,.87],[2.35,.36],[1.69,-.08],[1.6,-.67],[1.01,-.33],[.82,-1.05],[.36,-.52],[.06,-.83]];
  const shape=new THREE.Shape();coords.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const membrane=mesh(wingSurface(shape),wingMembrane,root,0,0,-.12);membrane.scale.x=side;
  horn(root,[[0,0,0],[side*.56,.71,-.08],[side*1.1,.87,-.12],[side*2.35,.36,-.16]],.09,hornObsidian);
  for(const [x,y] of [[2.35,.36],[1.6,-.67],[.82,-1.05],[.06,-.83]])horn(root,[[side*.56,.71,-.1],[side*(x*.72),y*.62,-.13],[side*x,y,-.16]],.039,hornObsidian);
  horn(root,[[side*.56,.71,-.08],[side*.58,1.11,-.1],[side*.43,1.25,-.03]],.08,hornObsidian);
  const fan=new THREE.Group(),pivot=new THREE.Vector3(side*.56,.71,-.08);fan.position.copy(pivot);const parts=[...root.children];parts.forEach((child,i)=>{if(i===1)return;child.position.sub(pivot);fan.add(child);});root.add(fan);root.userData.fan=fan;root.userData.flex=0;root.userData.flexV=0;wings.push(root);
 }
 return wings;
}
function updateWings(dt){
 membraneTime.value+=dt;
 const school=finisher?.def.school||action?.school;playerLight.color.set(school==='mind'?0xaa80ff:school==='ghost'?0x91dfc6:0xff7845);
 const strike=action&&attackTypes.has(action.type)?Math.exp(-Math.pow((action.t/action.duration-impactAt(action))*18,2)):0;
 playerLight.intensity=THREE.MathUtils.damp(playerLight.intensity,4+(options.flashes?strike*9+(finisher?2:0):0),24,dt);
 const motion=motionInfo(player);
 const closeContact=finisher&&(finisher.def.school==='brutal'||['furnace-heart','mindbreaker','pyre-king'].includes(finisher.def.id));const strideFold=THREE.MathUtils.smoothstep(motion.speed,2,9);const spread=mode==='dead'?1.5:finisher?(closeContact?1.42:1.08):ascendTime>0?.06:action?.type==='charged'?.3:action?.type==='dodge'?1.35:mode==='menu'?1.1:1.22+strideFold*.08;
 player.wings.forEach((w,i)=>{const side=i?1:-1;w.rotation.y=THREE.MathUtils.damp(w.rotation.y,side*(spread+Math.sin(elapsed*2+i)*.055),8,dt);w.rotation.x=finisher?0:-strideFold*.08;w.rotation.z=side*(.05+Math.sin(elapsed*1.5)*.025)+THREE.MathUtils.clamp(motion.turn*.016,-.12,.12);const cinematicFold=finisher?(finisher.def.school==='brutal'?.95:.8):0;const target=side*(.1+cinematicFold+(finisher?0:strideFold*.13)+Math.sin(elapsed*2.1-i*.6)*.035+Math.min(finisher ? .15 : .04,motion.speed*(finisher ? .018 : .006)));const data=w.userData;if(data.fan){const n=Math.max(1,Math.ceil(dt*120)),h=dt/n;for(let j=0;j<n;j++){data.flexV+=(65*(target-data.flex)-12*data.flexV)*h;data.flex+=data.flexV*h;}data.fan.rotation.y=data.flex;data.fan.rotation.z=-data.flex*.16;}});
}
const impactWorld=createImpactWorld(scene);const gore=createGore(scene,()=>options.gore);
const player=creature(true);player.root.position.set(6,.06,7);player.root.scale.setScalar(1.75);player.root.rotation.y=.6;
const playerLight=new THREE.PointLight('#ff5020',4,5,2);playerLight.position.set(0,1.8,0);player.root.add(playerLight);
// Power identities drive both the selection wheel and the actual combat effects.
const powers=[
{name:'Hellfire Bolt',family:'PYROMANCY',type:'fire',cost:16,cd:.7,desc:'A searing projectile. Explodes on impact and ignites nearby souls.'},
{name:'Inferno Wave',family:'PYROMANCY',type:'fire',cost:27,cd:3,desc:'A sweeping wall of flame that tears through enemies in front of you.'},
{name:'Meteor Fall',family:'PYROMANCY',type:'fire',cost:40,cd:6,desc:'Call a falling star onto your target. Cataclysmic area damage.'},
{name:'Cinder Step',family:'PYROMANCY',type:'fire',cost:22,cd:3,desc:'Become a streak of fire. Dash forward and burn everything in your path.'},
{name:'Flame Vortex',family:'PYROMANCY',type:'fire',cost:35,cd:6,desc:'A hungry spiral of fire pulls enemies in and burns them alive.'},
{name:'Hellnova',family:'PYROMANCY',type:'fire',cost:48,cd:8,desc:'Release an expanding inferno. Everything around you turns to ash.'},
{name:'Mind Lance',family:'PSYCHIC',type:'mind',cost:18,cd:1.2,desc:'A piercing thought made lethal. Strikes every soul along its path.'},
{name:'Telekinesis',family:'PSYCHIC',type:'mind',cost:24,cd:3,desc:'Rip your target into the air, then crush them against the earth.'},
{name:'Gravity Well',family:'PSYCHIC',type:'mind',cost:34,cd:6,desc:'Collapse space itself. Draw enemies into a crushing singularity.'},
{name:'Mind Rupture',family:'PSYCHIC',type:'mind',cost:30,cd:4,desc:'Shatter nearby minds. A psychic burst damages and staggers all around.'},
{name:'Temporal Rift',family:'PSYCHIC',type:'mind',cost:38,cd:9,desc:'Freeze the hunt. Enemies move at a fraction of their speed for six seconds.'},
{name:'Phantom Blades',family:'SPECTRAL',type:'ghost',cost:25,cd:3,desc:'Conjure three spectral blades that seek and pierce your enemies.'},
{name:'Wraith Walk',family:'SPECTRAL',type:'ghost',cost:28,cd:7,desc:'Become untouchable for four seconds. Move faster through the living.'},
{name:'Soul Reap',family:'SPECTRAL',type:'ghost',cost:32,cd:5,desc:'Steal the essence of nearby foes. Their suffering restores your vitality.'},
{name:'Revenant Army',family:'SPECTRAL',type:'ghost',cost:45,cd:10,desc:'Summon three vengeful spirits to hunt and strike your enemies.'},
{name:'Cinder Chains',family:'PYROMANCY',type:'fire',cost:26,cd:4,desc:'Chain nearby foes to burning anchors. Root normal enemies and build burn damage.'},
{name:'Scorch Mine',family:'PYROMANCY',type:'fire',cost:24,cd:4,desc:'Plant a proximity rune ahead. It arms, waits for a foe, then launches a fiery blast.'},
{name:'Hellfire Bastion',family:'PYROMANCY',type:'fire',cost:32,cd:8,desc:'Gain a finite damage-absorbing ward. Blocked hits burst fire back toward your attacker.'},
{name:'Phoenix Dive',family:'PYROMANCY',type:'fire',cost:36,cd:6,desc:'A short lunging strike with a delayed ground eruption and knockdown.'},
{name:'Vector Thrust',family:'PSYCHIC',type:'mind',cost:25,cd:3,desc:'Drive a narrow cone of enemies backward. Wall impacts become recoverable ragdolls.'},
{name:'Neural Chain',family:'PSYCHIC',type:'mind',cost:30,cd:5,desc:'Jump a psychic arc between up to four nearby targets, cracking will at every hop.'},
{name:'Gravity Loom',family:'PSYCHIC',type:'mind',cost:38,cd:7,desc:'Suspend a group with staggered heights, then release them into crushing falls.'},
{name:'Soul Anchor',family:'SPECTRAL',type:'ghost',cost:24,cd:4,desc:'Mark a target. Your next melee hit tears the anchor free for bonus damage and healing.'},
{name:'Reaper Guard',family:'SPECTRAL',type:'ghost',cost:30,cd:8,desc:'For five seconds, your next incoming hit becomes a spectral counter, not damage.'}
];
const colors={fire:0xff702e,mind:0xae8aff,ghost:0x80e0c3};const cssColors={fire:'#e99c65',mind:'#b7a0e0',ghost:'#89cbbb'};
const iconPaths={fire:'M12 2C13 8 6 8 7 13c-3-1-2-4-2-4C-2 19 8 25 14 21c5-3 7-7 2-12 0 4-3 5-3 5 2-6-1-12-1-12Z',mind:'M1 12Q12 0 23 12Q12 24 1 12ZM12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10ZM12 10v4M10 12h4',ghost:'M5 21V9a7 7 0 0 1 14 0v12l-4-3-3 3-3-3-4 3ZM9 9v3M15 9v3'};
const glyphs=[iconPaths.fire,'M2 16q4-8 7-3t6-2 7-3M2 21q4-8 7-3t6-2 7-3M6 3l3 5m5-7 1 5m6-3-3 6','M4 14a5 5 0 1 0 7 7a5 5 0 1 0-7-7ZM8 11 18 1M13 13 23 3M15 17l7-7','M3 4l8 5-8 5m8-10 8 5-8 5M2 21h16M7 18h15','M12 2c-10 0-12 15 0 18s12-13 4-14-11 7-4 8M10 22l3-3-3-3','M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10ZM12 1v4m0 14v4M1 12h4m14 0h4M4 4l3 3m10 10 3 3M20 4l-3 3M7 17l-3 3','M2 22 20 4l-5 1 4-4 4 0 0 4-4 4 1-5M4 14l6 6',iconPaths.mind,'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20ZM12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10ZM12 10v4M10 12h4','M2 12l5-4 3 5 3-10 3 17 3-8h3','M7 2h10M7 22h10M7 3c0 6 10 12 10 18M17 3C17 9 7 15 7 21M8 6h8M8 18h8','M4 22 9 7 9 1 5 5 1 20ZM12 22 17 7 17 1 13 5 9 20ZM20 22l3-15-4 4-3 11',iconPaths.ghost,'M5 21V9a7 7 0 0 1 14 0M9 9v3M15 9v3M12 15v8m-4-4 4 4 4-4','M8 21V10a4 4 0 0 1 8 0v11l-4-3-4 3ZM2 18V6a4 4 0 0 1 6-3M22 18V6a4 4 0 0 0-6-3'];
glyphs.push('M3 8a4 4 0 0 1 7-3l3 3M14 16l3 3a4 4 0 0 0 5-6l-3-3M8 8l8 8M3 20l4-4M17 7l4-4','M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3ZM8 12h8M12 8v8','M3 3l9-2 9 2v8c0 7-9 12-9 12S3 18 3 11ZM12 6l-3 7 3 4 3-4Z','M12 21V9M12 14 2 4l2 10 8 7 8-7 2-10ZM8 7l4-5 4 5','M2 4l8 8-8 8M10 4l8 8-8 8M3 12h20M20 9l3 3-3 3','M7 5a3 3 0 1 0-6 0a3 3 0 1 0 6 0ZM15 18a3 3 0 1 0-6 0a3 3 0 1 0 6 0ZM23 5a3 3 0 1 0-6 0a3 3 0 1 0 6 0ZM5 8l5 7M14 15l5-7M7 5h10','M2 12q10-12 20 0-10 12-20 0ZM12 2q-8 10 0 20 8-10 0-20ZM4 4l16 16M4 20 20 4','M12 8a3 3 0 1 0 0-6a3 3 0 1 0 0 6ZM12 8v14M7 11h10M2 15q1 7 10 7t10-7M2 15v5M22 15v5','M3 4l9-3 9 3v8c0 5-9 11-9 11S3 17 3 12ZM12 20V6M8 6q10-4 10 5l-6-2');
function icon(type,index=selected){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"><path d="${glyphs[index]||iconPaths[type]}"/></svg>`}
let selected=0,hovered=0,wheelOpen=false;
function polar(r,a){return[300+Math.cos(a)*r,300+Math.sin(a)*r]}
function wheelPath(a,b){let p=polar(284,a),q=polar(284,b),r=polar(151,b),s=polar(151,a);return`M${p} A284 284 0 0 1 ${q} L${r} A151 151 0 0 0 ${s}Z`}
const svg=$('wheelSvg');powers.forEach((p,i)=>{let a=-Math.PI/2+i*TAU/powers.length-TAU/(powers.length*2),b=a+TAU/powers.length,mid=(a+b)/2,[x,y]=polar(221,mid);let g=document.createElementNS('http://www.w3.org/2000/svg','g');g.innerHTML=`<path class="wheel-slice" data-index="${i}" d="${wheelPath(a+.009,b-.009)}"/><g class="wheel-node" style="color:${cssColors[p.type]}"><g transform="translate(${x-12} ${y-19})"><path d="${glyphs[i]||iconPaths[p.type]}" fill="none" stroke="currentColor" stroke-width="1.3"/></g><text x="${x}" y="${y+24}" text-anchor="middle" fill="currentColor" font-family="Inter,Arial" font-size="8" letter-spacing=".7">${String(i+1).padStart(2,'0')}</text></g>`;g.addEventListener('mouseenter',()=>previewPower(i));g.addEventListener('pointerdown',e=>{e.stopPropagation();previewPower(i);closeWheel()});svg.append(g)});
function previewPower(i){hovered=i;let p=powers[i];document.querySelectorAll('.wheel-slice').forEach((el,n)=>el.classList.toggle('active',n===i));$('wheelFamily').textContent=p.family;$('wheelFamily').style.color=cssColors[p.type];$('wheelName').textContent=p.name;$('wheelDesc').textContent=p.desc;$('wheelCost').textContent=cooldowns[i]>0?`RECOVERING · ${cooldowns[i].toFixed(1)}s / ${p.cost} WRATH`:energy<p.cost?`NEED ${Math.ceil(p.cost-energy)} MORE WRATH`:`READY · ${p.cost} WRATH / ${p.cd}s COOLDOWN`;document.querySelectorAll('.wheel-slice').forEach((el,n)=>el.classList.toggle('unavailable',cooldowns[n]>0||energy<powers[n].cost))}
function equip(){const p=powers[selected];$('powerName').textContent=p.name;$('powerFamily').textContent=p.family;$('powerFamily').style.color=cssColors[p.type];$('powerIcon').innerHTML=icon(p.type);$('powerIcon').style.borderColor=cssColors[p.type];$('powerIcon').firstChild.style.color=cssColors[p.type]}equip();
let ascendCharge=0,ascendTime=0,upgradeOpen=false,panelOpen=null,panelResume=false,intermission=-1,waypoint=null;
let runMods={damage:1,maxHealth:100,regen:1,speed:1,life:0,duration:1,reach:1,souls:1};
let acquired=[];
let records={wave:0,score:0,runs:0};try{Object.assign(records,JSON.parse(localStorage.getItem('hellbound-records')||'{}'))}catch{}
let gameMode='survival',trainingAI=false,bossRound=0;const exploredDistricts=new Set(),resonance=new Set();let resonanceTime=0;
let mode='menu',paused=false,health=100,energy=100,score=0,wave=0,kills=0,combo=0,comboTime=0,waveDelay=2,wavePending=true,elapsed=0;
let action=null,actionQueue=null,comboStep=0,lastAttack=-20,attackCooldown=0,dodgeCooldown=0,parryCooldown=0,executeCooldown=0,invuln=0,ghostTime=0,slowTime=0,riposte=0,finisher=null,shake=0,hitstop=0,lockTarget=null;
let chainWindow=0,chainTarget=null;
let yaw=0,pitch=.21,walkPhase=0,damageAlpha=0,cinemaTime=0;
const STANCES=[{name:'REAVER',speed:1.18,damage:.88,poise:.9},{name:'BREAKER',speed:.9,damage:1.2,poise:1.45},{name:'WRAITH',speed:1.05,damage:1,poise:1}];let stance=0,flow=0,flowGrace=0;
let clinchTarget=null,clinchTime=0;let aegis=0,aegisTime=0,reaperWard=0;
let smallExecutionBag=[],bossExecutionBag=[],executionBag=[],catalogFocus='soulbreaker',catalogFilter='all',previewSnapshot=null,executionDirector=null,completedExecutions=[];
let airTarget=null;
let heavyHeld=false,dodgeLink=0,weaveTime=0,weaveSchool='fire',lastMeleeHit=-20,lastMove='',styleVariety=new Set(),currentDistrict='';
const attackTypes=new Set(['light','heavy','slam','cleave','stomp','charged','lunge','aerial','sweep','hook','knee','groundstrike','riposte','guardbreak','crusher','riftstrike','flowburst']);
const combatLog=[];
function recordMove(name){lastMove=name;combatLog.push(name);if(combatLog.length>30)combatLog.shift();styleVariety.add(name);}

const keys={},cooldowns=powers.map(()=>0),enemies=[],effects=[],projectiles=[],zones=[],summons=[];
const tmp=new THREE.Vector3(),vup=new THREE.Vector3(0,1,0);let audio=null,audioOn=false;
function tone(freq=90,duration=.1,type='sawtooth',vol=.1,end=20){if(!audioOn)return;try{ensureAudio();const o=audio.createOscillator(),gain=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(end,1),audio.currentTime+duration);gain.gain.setValueAtTime(vol,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(gain);gain.connect(audioMaster);o.start();o.stop(audio.currentTime+duration);if(type==='sawtooth'&&freq<200)impactNoise(duration,vol)}catch{}}
$('sound').onclick=()=>{audioOn=!audioOn;$('soundState').textContent=audioOn?'ON':'OFF';if(audioOn)tone(65,.5,'sine',.15,38)};
function flatDistance(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
function facing(){return new THREE.Vector3(Math.sin(player.root.rotation.y),0,Math.cos(player.root.rotation.y))}
function nearest(range=100){let best=null,dist=range;for(const e of enemies)if(!e.dead){const d=flatDistance(e.root.position,player.root.position);if(d<dist){dist=d;best=e}}return best}
function aim(range=14){const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));let t=lockTarget&&!lockTarget.dead&&flatDistance(lockTarget.root.position,player.root.position)<range?lockTarget:enemies.filter(e=>!e.dead&&flatDistance(e.root.position,player.root.position)<range&&e.root.position.clone().sub(player.root.position).setY(0).normalize().dot(forward)>.05).sort((a,b)=>{const rank=e=>flatDistance(e.root.position,player.root.position)*.16+(1-e.root.position.clone().sub(player.root.position).setY(0).normalize().dot(forward))*4;return rank(a)-rank(b);})[0];if(t){const d=tmp.subVectors(t.root.position,player.root.position);player.root.rotation.y=Math.atan2(d.x,d.z);}else player.root.rotation.y=yaw+Math.PI;return t;}
function notify(text){$('toast').textContent=text;$('toast').style.opacity=1;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('toast').style.opacity=0,2200)}
function actionText(text){$('actionName').textContent=text;$('actionName').style.opacity=1;clearTimeout(actionText.timer);actionText.timer=setTimeout(()=>$('actionName').style.opacity=0,1000)}
function banner(title,sub){$('waveBanner').querySelector('h2').textContent=title;$('waveBanner').querySelector('p').textContent=sub;$('waveBanner').classList.add('show');clearTimeout(banner.timer);banner.timer=setTimeout(()=>$('waveBanner').classList.remove('show'),3400)}
// Small instanced particles keep every impact responsive even at higher waves.
const maxParticles=1600,particleMesh=new THREE.InstancedMesh(icoG,new THREE.MeshBasicMaterial({vertexColors:false,transparent:true,opacity:.95}),maxParticles);particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);particleMesh.frustumCulled=false;scene.add(particleMesh);const particles=Array.from({length:maxParticles},()=>({life:0,p:new THREE.Vector3(),v:new THREE.Vector3(),size:.05,max:1,gravity:4,color:new THREE.Color()}));let pCursor=0;for(let i=0;i<maxParticles;i++){dummy.scale.setScalar(0);dummy.updateMatrix();particleMesh.setMatrixAt(i,dummy.matrix)}
function burst(pos,color=0xff772f,count=20,speed=5,life=.55){for(let i=0;i<count;i++){const p=particles[pCursor];pCursor=(pCursor+1)%maxParticles;p.life=life*(.5+Math.random()*.8);p.max=p.life;p.p.copy(pos);p.v.set((Math.random()-.5)*speed,Math.random()*speed*.8,(Math.random()-.5)*speed);p.size=.018+Math.random()*.065;p.gravity=5;p.color.set(color)}}
function ring(pos,color=0xff742e,radius=4,duration=.6){const m=mesh(new THREE.TorusGeometry(1,.027,5,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false}),scene,pos.x,.12+pos.y*.1,pos.z);m.rotation.x=-Math.PI/2;effects.push({mesh:m,t:0,duration,radius,kind:'ring'});return m}
function beam(a,b,color=0xff772f,width=.08,duration=.22){const d=new THREE.Vector3().subVectors(b,a),m=mesh(new THREE.CylinderGeometry(width,width,d.length(),7),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false}),scene);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(vup,d.normalize());effects.push({mesh:m,t:0,duration,kind:'beam'});return m}
function slash(pos,angle,heavy=false,color=0xffaa6a){const g=new THREE.Group();g.position.copy(pos);g.rotation.set(heavy?.7:rr(-.5,.5),angle,heavy?1.4:rr(-.4,.4));scene.add(g);for(let j=0;j<3;j++){const m=mesh(new THREE.TorusGeometry(heavy?2.1:1.6,.015+j*.008,4,35,Math.PI*1.1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9-j*.2,side:THREE.DoubleSide,depthWrite:false}),g,0,j*.1,0);m.rotation.x=Math.PI/2;m.rotation.z=-Math.PI*.55}effects.push({mesh:g,t:0,duration:.28,kind:'slash'})}
function disposeEffect(m){scene.remove(m);m.traverse(o=>{if(o.isMesh){if(![boxG,sphereG,icoG].includes(o.geometry))o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else if(!sharedRigMaterials.has(o.material))o.material.dispose()}})}
function damageEnemy(e,amount,knock=0,launch=0,source=null,school=null){if(e.dead)return;amount*=runMods.damage*(ascendTime>0?1.5:1)*(e.boss&&e.bossMove?.stage==='recover'?1.18:1);amount=reactElements(e,amount,school);if(ascendTime<=0)ascendCharge=Math.min(100,ascendCharge+amount*.075*Math.min(2.5,eclipseSystems?.multiplier?.()||1));showDamage(e,amount,school);if(school)eclipseSystems?.styleHit('school-'+school,Math.min(5,amount*.065));if(amount>=16&&finisher?.enemy!==e)gore.emit(chestContact(e),e.root.position.clone().sub(source||player.root.position),Math.min(2.2,amount/32));e.hp-=amount;if(finisher?.enemy===e&&!finisher.impactDone)e.hp=Math.max(1,e.hp);e.stagger=Math.max(e.stagger,e.boss?.08:.35);e.flash=.26;e.recoil=Math.min(.7,amount*.012);e.recoilSide=(Math.random()>.5?1:-1);noteImpact(e,amount,source||player.root.position);e.lastKnock=(e.lastKnock||0)+knock;e.lastLaunch=(e.lastLaunch||0)+launch;e.poise=e.poise||0;if(knock){const d=new THREE.Vector3().subVectors(e.root.position,source||player.root.position);d.y=0;d.normalize();e.kb.addScaledVector(d,knock/massOf(e))}if(e.physicalBody&&(knock||launch))kickBody(e,source||player.root.position,knock,launch*.45);if(launch&&!e.boss&&!e.physicalBody){e.juggles=0;e.airHold=0;e.tk=0;e.vy=launch;e.stagger=1.1;e.airborne=true}burst(e.root.position.clone().add(new THREE.Vector3(0,1.5,0)),0xff9b61,11,4,.4);combo++;comboTime=4.5;score+=Math.floor(amount*(eclipseSystems?.multiplier?.()||1));energy=Math.min(100,energy+2);if(e.hp<=0){killEnemy(e);if(amount>55&&knock>7&&finisher?.enemy!==e)gore.sever(e,'arm',e.kb.clone().add(new THREE.Vector3(0,5,0)));}}
function killEnemy(e){if(e.dead)return;e.dead=true;e.deathTime=0;
 const inpulse=(e.kb||new THREE.Vector3()).clone(),heavy=!!e.coupKill||(e.lastKnock||0)>=6;
 if(finisher?.enemy!==e){let impulse=inpulse.multiplyScalar(heavy?.85:.5);
  if(heavy){const dir=impulse.clone().setY(0);if(dir.lengthSq()<.001)dir.set(Math.sin(e.root.rotation.y+Math.PI),0,Math.cos(e.root.rotation.y+Math.PI));dir.normalize();impulse.addScaledVector(dir,e.boss?1.6:2.6);impulse.y+=e.boss?2.4:Math.min(6.8,2.6+(e.lastKnock||0)*.3+(e.lastLaunch||0)*.5);}
  else impulse.y+=Math.max(0,e.vy||0)*.3;
  startBody(e,impulse,!!e.coupKill);
  if(heavy&&!e.boss){ring(e.root.position.clone().add(new THREE.Vector3(0,.6,0)),0xffb169,1.9,.3);tone(42,.22,'sawtooth',.12,16);}}kills++;eclipseSystems?.onKill(e);score+=Math.floor((100+wave*15+(e.boss?700:0))*runMods.souls*(eclipseSystems?.multiplier?.()||1));if(ascendTime<=0)ascendCharge=Math.min(100,ascendCharge+(e.boss?30:6));health=Math.min(runMods.maxHealth,health+2+runMods.life);energy=Math.min(100,energy+7);e.bar.visible=false;e.telegraph.visible=false;burst(e.root.position.clone().add(new THREE.Vector3(0,1.4,0)),0xe8a05d,40,5,.9);if(lockTarget===e)lockTarget=null;tone(65,.16,'triangle',.09,22)}
function hurt(amount,unblockable=false,source=null){if(invuln>0||finisher||ghostTime>0||mode!=='game')return;if(reaperWard>0){reaperWard=0;riposte=2;invuln=.4;hitArea(player.root.position,5,32,5,0,'ghost');actionText('REAPER COUNTER');ring(player.root.position,colors.ghost,5,.5);return;}if(aegis>0){const blocked=Math.min(aegis,amount);aegis-=blocked;amount-=blocked;hitArea(player.root.position,4,blocked*.4,2,0,'fire');actionText('BASTION · '+Math.ceil(aegis));if(amount<=0)return;}if(!unblockable&&action?.type==='parry'&&action.t<.4){shake=.2;riposte=3;gainFlow();actionText('PERFECT PARRY · RIPOSTE READY');eclipseSystems?.styleHit('parry',18);tone(760,.18,'triangle',.17,190);ring(player.root.position,0xe0d7a2,4,.4);enemies.forEach(e=>{if(!e.dead&&flatDistance(e.root.position,player.root.position)<4.5){e.stagger=2.6;damageEnemy(e,12,5)}});energy=Math.min(100,energy+17);invuln=.5;return}if(!unblockable&&(action?.type==='guard'||action?.type==='parry'&&keys.KeyF)){const toward=(source||nearest(6)?.root.position||player.root.position.clone().add(facing())).clone().sub(player.root.position).setY(0).normalize();if(toward.dot(facing())>.1){const cost=6+amount*.25;if(energy>=cost){energy-=cost;health=Math.max(gameMode==='training'?1:0,health-amount*.15);invuln=.14;noteImpact(player,amount*.6,source);actionText('GUARDED');tone(180,.09,'triangle',.08,55);if(health<=0)gameOver();return;}energy=0;action=null;parryCooldown=1.5;actionText('GUARD BROKEN');}}if(action?.type==='charge'){action=null;heavyHeld=false;}chainWindow=0;chainTarget=null;eclipseSystems?.onHurt(source);noteImpact(player,amount,source);player.recoil=.45;health=Math.max(gameMode==='training'?1:0,health-amount*(ascendTime>0?.5:1));invuln=.6;shake=.23;damageAlpha=.55;comboTime=Math.max(0,comboTime-1.5);burst(player.root.position.clone().add(new THREE.Vector3(0,1.5,0)),0xb53923,20,3);tone(48,.2,'sawtooth',.15,17);if(health<=0)gameOver()}
function spawnEnemy(i,total,rift=false){const boss=!rift&&(gameMode==='boss'||wave%3===0)&&i===total-1,elite=wave>=2&&i===total-2;const e=creature(false,elite||boss);e.boss=boss;e.caster=wave>=2&&i%5===2&&!elite&&!boss;e.stalker=wave>=2&&i%4===0&&!elite&&!boss&&!e.caster;if(e.caster){e.root.scale.setScalar(.98);const crown=mesh(new THREE.TorusGeometry(.36,.016,4,30),purpleGlow,e.head,0,.55,0);crown.rotation.x=Math.PI/2;}const a=i/total*TAU+rand()*1.1,r=16+rand()*12;e.root.position.set(player.root.position.x+Math.sin(a)*r,.06,player.root.position.z+Math.cos(a)*r);if(e.root.position.length()>83){const r=Math.hypot(e.root.position.x,e.root.position.z);e.root.position.x*=82/r;e.root.position.z*=82/r}Object.assign(e,{guardMeter:elite?85:0,guardMax:elite?85:0,guardActive:false,hp:elite?210+wave*12:75+wave*9,maxHp:elite?210+wave*12:75+wave*9,speed:elite?2.6:2.15+Math.min(wave*.12,1.5),elite,state:'chase',timer:rr(.2,1.2),stagger:0,kb:new THREE.Vector3(),vy:0,airborne:false,flash:0,phase:rand()*TAU,dead:false});const bar=new THREE.Group();e.root.add(bar);bar.position.y=3.65;const bg=box(bar,new THREE.MeshBasicMaterial({color:0x1a1d19}),0,0,0,.85,.045,.018);e.barFill=box(bar,new THREE.MeshBasicMaterial({color:elite?0xb293ce:0xc28a5f}),0,0,.012,.85,.045,.02);e.poiseFill=box(bar,new THREE.MeshBasicMaterial({color:0xb9a0d0}),-.425,-.085,0,.001,.018,.018);e.bar=bar;adornEnemy(e);addRendVisual(e);if(total>1&&!boss&&!elite&&i%4===1)makeSmallFiend(e);const marker=mesh(new THREE.RingGeometry(.7,.73,32),new THREE.MeshBasicMaterial({color:0xffa64d,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}),scene);marker.rotation.x=-Math.PI/2;e.telegraph=marker;enemies.push(e);ring(e.root.position,0xb28155,1.4,.7);burst(e.root.position,0x967b54,20,3,.7)}
function nextWave(){if(gameMode==='explore'||gameMode==='training')return;wave++;bossRound=wave;eclipseSystems?.beginWave();wavePending=false;const total=gameMode==='boss'?1:Math.min(5+wave*2,23);for(let i=0;i<total;i++)spawnEnemy(i,total);$('waveNum').textContent=String(wave).padStart(2,'0');health=Math.min(runMods.maxHealth,health+17);energy=100;banner(gameMode==='boss'?`BOSS RUSH · ${wave}`:wave===1?'THE HUNT BEGINS':`WAVE ${String(wave).padStart(2,'0')}`,wave%3===0?'Vorath, the Cinder King, has entered the hunt.':'They have come for your soul. Take theirs.');tone(50,.7,'sine',.14,30)}
function openWheel(){if(mode!=='game'||paused||finisher)return;heavyHeld=false;if(action?.type==='charge')action=null;wheelOpen=true;keys.KeyR=true;previewPower(selected);$('powerWheel').classList.remove('hidden');document.exitPointerLock?.()}
function closeWheel(){if(!wheelOpen)return;wheelOpen=false;if(selected!==hovered)previousPower=selected;selected=hovered;equip();$('powerWheel').classList.add('hidden');keys.KeyR=false;tryLock()}
function tryLock(){if(mode==='game'&&!paused&&!wheelOpen&&!panelOpen&&!upgradeOpen){try{const p=$('world').requestPointerLock?.();p?.catch?.(()=>{})}catch{}}}
function openModal(fromHelp=false){if(upgradeOpen||panelOpen)return;if(wheelOpen)closeWheel();paused=true;heavyHeld=false;if(action?.type==='charge')action=null;Object.keys(keys).forEach(k=>keys[k]=false);document.exitPointerLock?.();$('modal').classList.remove('hidden');$('controlsGrid').classList.remove('hidden');$('modalTitle').textContent=mode==='menu'?'Know your darkness.':'The abyss can wait.';$('modalEyebrow').textContent='SURVIVAL IS AN ART';$('modalTip').textContent='Mix light and heavy attacks to branch your combo. Hold heavy to charge; dodge then strike to close the gap. Cast immediately after a melee hit for spell-weaving. Expand the Combat Codex below for the full move list.';$('resume').firstChild.textContent=mode==='menu'?'RETURN':'RESUME THE HUNT';$('restart').classList.toggle('hidden',mode==='menu')}
$('help').onclick=()=>openModal(true);$('menuControls').onclick=()=>openModal(true);$('home').onclick=e=>{e.preventDefault();openModal()};$('resume').onclick=()=>{if(mode==='dead'){startGame();return}paused=false;$('modal').classList.add('hidden');tryLock()};$('restart').onclick=()=>startGame();$('start').onclick=()=>startGame(selectedMode);
function startGame(nextMode=gameMode){encounter.reset();gameMode=['survival','explore','boss','training'].includes(nextMode)?nextMode:'survival';resonance.clear();resonanceTime=0;stance=flow=flowGrace=0;aegis=aegisTime=reaperWard=0;exploredDistricts.clear();bossRound=0;trainingAI=false;if(finisher){executionDirector?.cleanup(finisher);if(finisher.preview)removeTransientRig(finisher.enemy);finisher=null;previewSnapshot=null;}for(let e of enemies)removeTransientRig(e);enemies.length=0;projectiles.forEach(p=>disposeEffect(p.mesh));projectiles.length=0;zones.forEach(z=>disposeEffect(z.mesh));zones.length=0;summons.forEach(s=>removeTransientRig(s));summons.length=0;resetRunSystems();impactWorld.reset();gore.reset();health=100;energy=100;score=0;kills=0;combo=0;wave=0;airTarget=null;heavyHeld=false;dodgeLink=weaveTime=0;lastMeleeHit=-20;comboStep=0;lastAttack=-20;clinchTarget=null;clinchTime=0;combatLog.length=0;styleVariety.clear();currentDistrict='';executionBag=[];bossExecutionBag=[];smallExecutionBag=[];completedExecutions=[];shrines.forEach(s=>s.usedWave=-1);resetMotion(player);clearBody(player);player.lastFootContacts=null;waveDelay=1.6;wavePending=true;action=null;finisher=null;lockTarget=null;ghostTime=slowTime=riposte=0;executeCooldown=0;attackCooldown=0;dodgeCooldown=0;parryCooldown=0;invuln=2;actionQueue=null;cooldowns.fill(0);player.root.visible=true;player.root.scale.setScalar(1.2);player.root.position.set(0,.06,8);player.root.rotation.y=Math.PI;player.rig.rotation.set(0,0,0);player.rig.position.set(0,0,0);yaw=0;pitch=.18;mode='game';paused=false;wheelOpen=false;document.body.classList.add('playing');document.body.classList.remove('cinematic');$('cinema').classList.remove('active');$('menu').classList.add('hidden');$('modal').classList.add('hidden');$('powerWheel').classList.add('hidden');$('hud').classList.remove('hidden');$('healthFill').style.width='100%';camera.position.set(0,4.6,16);Object.keys(keys).forEach(k=>keys[k]=false);configureMode();tryLock();notify('Move the mouse to orbit · WASD to move · Hold R for powers')}
function gameOver(){saveRecord();heavyHeld=false;action=null;player.deathTime=0;rememberBody(player,1/60);startBody(player,facing().multiplyScalar(-3).setY(2));mode='dead';paused=true;document.exitPointerLock?.();$('modal').classList.remove('hidden');$('controlsGrid').classList.add('hidden');$('modalEyebrow').textContent='EVEN DEMONS CAN FALL';$('modalTitle').textContent='Ashes to ashes.';$('modalTip').textContent=`${gameMode==='explore'?'Your journey ended':gameMode==='boss'?`You reached boss round ${wave}`:`You survived to wave ${wave}`}, claimed ${kills} souls, and earned ${score.toLocaleString()} points. The abyss remembers. Peak style: ${eclipseSystems?.snapshot().bestStyle||0}. Rise and make it fear you.`;$('resume').firstChild.textContent='RISE AGAIN';$('restart').classList.add('hidden')}
// Pointer lock is optional. Hover look does not require an attack or drag.
let lookResumeAt=0,hoverLookReady=false,lookEdge=0;document.addEventListener('pointerlockchange',()=>{lookResumeAt=performance.now()+80;hoverLookReady=false;});$('world').addEventListener('pointerleave',()=>{hoverLookReady=false;lookEdge=0;});
let dragging=false;window.addEventListener('keydown',e=>{if(mode==='game'&&!paused&&!panelOpen&&!upgradeOpen&&['Space','Tab','KeyR','KeyF','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(finisher?.preview){if(e.code==='Escape')finishExecution(finisher,true);return;}if(upgradeOpen){if(['Digit1','Digit2','Digit3'].includes(e.code))chooseBoon(Number(e.code.slice(-1))-1);return;}if(panelOpen){if(e.code==='Escape'||(e.code==='KeyM'&&panelOpen==='map')||(e.code==='KeyV'&&panelOpen==='finishers'))closePanel();return;}if(e.code==='KeyV'&&!e.repeat){openFinisherCatalog();return;}if(e.code==='KeyM'&&!e.repeat){openMap();return;}if(e.code==='KeyO'&&!e.repeat){openSettings();return;}if(e.code==='Escape'){if(wheelOpen){closeWheel();return}if(mode==='game'){if(paused){paused=false;$('modal').classList.add('hidden');tryLock()}else openModal()}return}if(mode!=='game'||paused)return;keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyR')openWheel();if(wheelOpen)return;if(e.code==='KeyL'){walkToggle=!walkToggle;notify(walkToggle?'PROWL · walk enabled / SHIFT to sprint':'RUN · normal movement');}if(e.code==='KeyZ')switchStance();if(e.code==='KeyN')flowBurst();if(e.code==='KeyQ')castPower();if(e.code==='KeyB')ascend();if(e.code==='KeyG'){if(!finisher&&!wheelOpen&&!(['survival','explore'].includes(gameMode)&&eclipseSystems?.tryRift()))commune();}if(e.code==='KeyC')dreadTether();if(e.code==='KeyX')quickSwap();if(e.code==='Space')dodge();if(e.code==='KeyF')parry();if(e.code==='KeyE')execute();if(e.code==='Tab'){if(lockTarget)lockTarget=null;else lockTarget=nearest(24);notify(lockTarget?'Target locked · TAB to release':'Target released')}});
window.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyR')closeWheel()});window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);if(wheelOpen)closeWheel();if(mode==='game'&&!paused)openModal()});
$('world').addEventListener('pointerdown',e=>{if(mode!=='game'||paused||wheelOpen||upgradeOpen||panelOpen)return;dragging=true;tryLock();if(e.button===0)melee(false);if(e.button===2)beginHeavy()});window.addEventListener('pointerup',e=>{dragging=false;if(e.button===2)releaseHeavy()});window.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('mousemove',e=>{if(mode==='game'&&!paused&&!wheelOpen&&!finisher&&!panelOpen&&!upgradeOpen&&(document.pointerLockElement=== $('world')||e.target===$('world'))){if(!document.pointerLockElement){const r=$('world').getBoundingClientRect();lookEdge=e.clientX<r.left+22?1:e.clientX>r.right-22?-1:0;}if(performance.now()<lookResumeAt)return;if(!document.pointerLockElement&&!hoverLookReady){hoverLookReady=true;return;}yaw-=e.movementX*.0025*options.sensitivity;pitch=THREE.MathUtils.clamp(pitch+e.movementY*.0018*options.sensitivity*(options.invertY?-1:1),-.12,1.05)}});
// ECLIPSE: a spectral gap-control move. Boss mass reverses the tether onto the player.
let tetherCooldown=0,previousPower=6,locomotion=0,turnLean=0,lastFootPhase=0,walkToggle=false;
const moveVelocity=new THREE.Vector3();
const tetherPoints=new Float32Array(33*3),tetherGeometry=new THREE.BufferGeometry();
tetherGeometry.setAttribute('position',new THREE.BufferAttribute(tetherPoints,3));
const tetherLine=new THREE.Line(tetherGeometry,new THREE.LineBasicMaterial({color:0xb4e7d7,transparent:true,opacity:.9,depthWrite:false}));tetherLine.frustumCulled=false;tetherLine.visible=false;scene.add(tetherLine);
function quickSwap(){if(finisher||paused||wheelOpen)return;[selected,previousPower]=[previousPower,selected];equip();actionText('QUICK SWAP · '+powers[selected].name.toUpperCase());tone(220,.12,'triangle',.04,120);}
function dreadTether(){
 if(mode!=='game'||paused||wheelOpen||finisher)return;
 if(tetherCooldown>0){notify(`Dread Tether recovering · ${tetherCooldown.toFixed(1)}s`);return;}
 if(energy+(action?.type==='cast'&&!action.released?action.paid:0)<16){notify('Dread Tether requires 16 wrath');return;}
 const e=aim(18);if(!e||flatDistance(e.root.position,player.root.position)>18){notify('Dread Tether needs a target within 18 metres');return;}
 const from=player.root.position.clone().add(new THREE.Vector3(0,1.8,0)),to=e.root.position.clone().add(new THREE.Vector3(0,1.8,0));
 if(safeCamera(from,to.clone(),obstacles).distanceTo(from)<to.distanceTo(from)-.7){notify('Clear the obstacle between you and your target.');return;}
 cancelUnreleasedCast();energy-=16;tetherCooldown=4.5;heavyHeld=false;actionQueue=null;action={type:'tether',t:0,duration:.92,target:e,hit:false};if(!e.boss){e.stagger=1.05;e.kb.set(0,0,0);}invuln=Math.max(invuln,.2);ring(e.root.position,0x99dece,1.8,.45);actionText(e.boss?'DREAD TETHER · GRAPPLE':'DREAD TETHER · REEL IN');recordMove('DREAD TETHER');tone(210,.35,'triangle',.065,70);
}
function updateTether(a,dt){
 const e=a.target;if(!e||e.dead){a.t=a.duration;return;}
 const u=a.t/a.duration,delta=e.root.position.clone().sub(player.root.position).setY(0),distance=delta.length();delta.normalize();player.root.rotation.y=Math.atan2(delta.x,delta.z);
 if(u>.25&&u<.83){const speed=dt*24*Math.sin((u-.25)/.58*Math.PI);if(e.boss){player.root.position.addScaledVector(delta,Math.min(speed,Math.max(0,distance-2.6)));resolveWorld(player.root.position);}else{e.root.position.addScaledVector(delta,-Math.min(speed,Math.max(0,distance-2.3)));resolveWorld(e.root.position);e.stagger=Math.max(e.stagger,.3);e.kb.set(0,0,0);}}
 if(u>.72&&!a.hit){a.hit=true;damageEnemy(e,18,0,0,null,'ghost');if(!e.boss){e.broken=Math.max(e.broken||0,.8);e.stagger=.8;}dodgeLink=.85;eclipseSystems?.styleHit('tether',12);burst(chestContact(e),0xa8e2cf,28,4,.45);tone(100,.17,'triangle',.06,40);}
}
function drawTether(){
 const a=action;tetherLine.visible=a?.type==='tether'&&!finisher&&!!a.target&&!a.target.dead;
 if(!tetherLine.visible)return;
 player.root.updateMatrixWorld(true);const from=player.hands[0].getWorldPosition(new THREE.Vector3()),to=chestContact(a.target),delta=to.clone().sub(from),side=new THREE.Vector3(-delta.z,0,delta.x).normalize();
 for(let i=0;i<=32;i++){const u=i/32,p=from.clone().addScaledVector(delta,u).addScaledVector(side,Math.sin(u*65-elapsed*22)*.065*Math.sin(u*Math.PI));p.y+=Math.cos(u*65-elapsed*22)*.06*Math.sin(u*Math.PI);tetherPoints[i*3]=p.x;tetherPoints[i*3+1]=p.y;tetherPoints[i*3+2]=p.z;}
 tetherGeometry.attributes.position.needsUpdate=true;
}
function spawnRiftGuardian(n,i){
 spawnEnemy(i,3,true);const e=enemies.at(-1),a=i/3*TAU;e.riftId=n.id;e.root.position.set(n.x+Math.sin(a)*6,.06,n.z+Math.cos(a)*6);resolveWorld(e.root.position);e.hp=e.maxHp=Math.round(e.maxHp*1.15);e.kind='RIFT GUARDIAN';
 const sigil=mesh(new THREE.TorusGeometry(.52,.03,4,36),new THREE.MeshBasicMaterial({color:n.color}),e.head,0,.65,0);sigil.rotation.x=Math.PI/2;
 burst(e.root.position,n.color,35,4,1);
}
function rewardRift(n){
 if(n.id==='pale')runMods.maxHealth+=10;if(n.id==='cinder')runMods.damage+=.08;if(n.id==='hollow')runMods.regen+=.2;
 health=Math.min(runMods.maxHealth,health+30);energy=Math.min(100,energy+30);score+=500;acquired.push(n.reward.split(' · ')[0]);
}
function enhanceArmor({torso,arms,forearms,shins,head,isPlayer,armor,glow}){
 if(!isPlayer)return;
 const plated=mat('#3b4140',.52,.65),trim=mat('#aa8560',.49,.7);
 const shape=new THREE.Shape();shape.moveTo(-.55,.48);shape.lineTo(.38,.61);shape.lineTo(.58,.1);shape.lineTo(.13,-.62);shape.lineTo(-.48,-.2);shape.closePath();
 function plate(parent,x,y,z,sx,sy,side=1){const g=new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.035,bevelThickness:.018});const p=mesh(g,plated,parent,x,y,z,sx,sy,1);p.scale.x*=side;return p;}
 for(let i=0;i<2;i++){const side=i?1:-1;plate(torso,side*.24,.5,.31,.41,.3,side);const pauldron=mesh(new THREE.SphereGeometry(.27,16,10,0,TAU,0,Math.PI*.65),plated,arms[i],side*.07,.015,-.005,1.1,.68,1.04);for(let layer=0;layer<2;layer++){const shell=mesh(new THREE.SphereGeometry(.25-layer*.025,14,8,0,TAU,0,Math.PI*.48),plated,arms[i],side*(.08+layer*.035),-.1-layer*.09,-.015,1.2,.5,1.08);shell.rotation.z=side*.25;}pauldron.rotation.z=-side*.18;
 plate(forearms[i],0,-.17,.15,.22,.42,side);plate(shins[i],0,-.29,.1,.25,.45,side);
 for(let j=0;j<3;j++){const rune=box(forearms[i],glow,(j-1)*.045,-.15,.235,.014,.1,.015);rune.rotation.z=side*.32;}
 const seam=box(torso,trim,side*.27,.52,.405,.23,.015,.014);seam.rotation.z=side*.12;
 horn(arms[i],[[side*.08,.14,-.13],[side*.3,.4,-.19],[side*.47,.5,-.28]],.1,armor);
 }
 const crest=mesh(new THREE.OctahedronGeometry(.095),glow,torso,0,.6,.34,.55,1.6,.55);crest.rotation.z=Math.PI/4;
 plate(head,0,.23,.11,.22,.24,1);
}

function cancelUnreleasedCast(){if(action?.type==='cast'&&!action.released){energy=Math.min(100,energy+action.paid);cooldowns[action.powerIndex]=0;action=null;}}
function gainFlow(){flow=Math.min(3,flow+1);flowGrace=7;}
function switchStance(){
 if(finisher||paused||wheelOpen)return;
 if(action&&attackTypes.has(action.type)){const u=action.t/action.duration,h=impactAt(action);if(!action.hit||u<h||u>h+.28||energy<8){notify('Stance cancel: press Z just after contact · 8 wrath');return;}energy-=8;action=null;attackCooldown=0;gainFlow();recordMove('STANCE CANCEL');}
 else if(action)return;stance=(stance+1)%3;actionText(STANCES[stance].name+' STANCE');ring(player.root.position,[0xe8a669,0xd8bc85,0x82dcc7][stance],1.4,.3);
}
function flowBurst(){if(finisher||paused||wheelOpen||flow<3)return;flow=0;flowGrace=0;cancelUnreleasedCast();actionQueue=null;heavyHeld=false;action={type:'flowburst',t:0,duration:.78,step:0,hit:false,charge:0,target:nearest(7)};invuln=.55;recordMove('FLOW REVERSAL');actionText('FLOW REVERSAL');}
function beginHeavy(){
 if(finisher||paused||wheelOpen||mode!=='game')return;
 heavyHeld=true;
 if(action){melee(true);return;}
 if(attackCooldown>0)return;
 aim(9);action={type:'charge',t:0,duration:1.5,level:0};
}
function releaseHeavy(){
 heavyHeld=false;
 if(action?.type!=='charge')return;
 const charge=action.t;action=null;attackCooldown=0;
 melee(true,charge>=.65?Math.min(1,(charge-.35)/.85):0);
}
function melee(heavy=false,charge=0,modifiers=null){
 if(finisher||wheelOpen||paused||mode!=='game')return;
 if(action&&attackTypes.has(action.type)){if(action.t>.09){const u=action.t/action.duration,hit=impactAt(action);actionQueue={heavy,expires:elapsed+.62,precise:action.hit&&u>hit+.025&&u<hit+.22,modifiers:{side:!!(keys.KeyA||keys.KeyD||keys.ArrowLeft||keys.ArrowRight),back:!!(keys.KeyS||keys.ArrowDown)}};}return;}
 if(action?.type==='dodge'&&action.t>.13){action=null;dodgeLink=.8;}
 if(action?.type==='cast'&&action.t>.18){cancelUnreleasedCast();action=null;}
 const guardStrike=heavy&&(action?.type==='guard'||action?.type==='parry'&&keys.KeyF);if(guardStrike)action=null;if(action?.type==='guard')action=null;if(action||attackCooldown>0)return;
 const attackYaw=player.root.rotation.y;let target=aim(dodgeLink>0||keys.ShiftLeft?11:7);player.root.rotation.y=attackYaw;if(airTarget&&!airTarget.dead&&(airTarget.airborne||airTarget.root.position.y>.7)&&flatDistance(airTarget.root.position,player.root.position)<8){target=airTarget;const dir=target.root.position.clone().sub(player.root.position);player.root.rotation.y=Math.atan2(dir.x,dir.z);}
 if(elapsed-lastAttack>1.35)comboStep=0;
 const chain=comboStep;
 const branch=modifiers||{side:keys.KeyA||keys.KeyD||keys.ArrowLeft||keys.ArrowRight,back:keys.KeyS||keys.ArrowDown};let type=heavy?'heavy':'light';
 if(guardStrike)type='guardbreak';
 else if(charge>0)type='charged';
 else if(heavy&&target?.downed>0)type='groundstrike';
 else if(riposte>0)type='riposte';
 else if(heavy&&clinchTime>0&&target===clinchTarget)type='knee';
 else if(heavy&&branch.back)type='hook';
 else if(heavy&&branch.side)type='sweep';
 else if(target&&(target.airborne||target.root.position.y>.8))type=heavy||(target.juggles||0)>=3?'slam':'aerial';
 else if(heavy&&chain===2)type='cleave';
 else if(heavy&&chain===3)type='stomp';
 else if(heavy&&stance===1)type='crusher';
 else if(heavy&&stance===2)type='riftstrike';
 else if(!heavy&&(dodgeLink>0||((keys.ShiftLeft||keys.ShiftRight)&&movementDir().lengthSq()>.1)))type='lunge';
 if(type==='light')comboStep=(comboStep%4)+1;
 else if(type!=='aerial')comboStep=0;
 const durations={crusher:.95,riftstrike:.7,flowburst:.78,guardbreak:.78,sweep:.88,hook:.8,knee:.76,groundstrike:.82,riposte:.7,light:[0,.49,.52,.68,.82][comboStep],heavy:.82,cleave:.86,stomp:.92,slam:.96,charged:1.04,lunge:.58,aerial:.62};
 const names={crusher:'MARROW CRUSHER',riftstrike:'VEIL REND',flowburst:'FLOW REVERSAL',guardbreak:'RAMPART BREAKER',sweep:'REAVER SWEEP',hook:'HOOK AND HAUL',knee:'CRUSHING KNEE',groundstrike:'RUIN STOMP',riposte:'RUIN COUNTER',heavy:'HELL RISING',cleave:'REAPING CIRCLE',stomp:'JUDGEMENT HEEL',slam:'FALL FROM GRACE',charged:charge>.8?'WORLD BREAKER':'CRUCIBLE STRIKE',lunge:'RIFT TALON',aerial:'ASCENDANT CLAWS'};
 action={type,t:0,duration:durations[type]/STANCES[stance].speed,stance,step:comboStep,hit:false,target,charge,targetsHit:new Set(),entrySpeed:moveVelocity.length(),start:player.root.position.clone()};
 if(type==='aerial'&&target){target.airHold=.55;target.vy=0;target.juggles=(target.juggles||0)+1;invuln=.48;}
 if(type==='lunge'){invuln=Math.max(invuln,.2);dodgeLink=0;}
 if(heavy&&resonance.size===3){action.convergence=true;resonance.clear();resonanceTime=0;actionText('CONVERGENCE · COMMITTED');}
 lastAttack=elapsed;recordMove(names[type]||`CLAW ${comboStep}`);if(names[type])actionText(names[type]);
 tone(160,.14,'sawtooth',.035,60);
}

function dodge(){if(action?.type==='aerial'&&action.hit&&action.target&&!action.target.dead&&action.t/action.duration<.9&&(action.target.enemySteps||0)<2&&energy>=8){const e=action.target;e.enemySteps=(e.enemySteps||0)+1;e.juggles=0;e.airHold=.9;e.vy=2;energy-=8;action={type:'enemystep',t:0,duration:.25,target:e,entryHeight:player.rig.position.y};attackCooldown=0;dodgeLink=.8;invuln=.25;gainFlow();recordMove('ENEMY STEP');actionText('ENEMY STEP · RE-LAUNCH YOUR COMBO');return;}if(action?.type==='dodge'||finisher||dodgeCooldown>0)return;cancelUnreleasedCast();if(energy<10){notify('Not enough wrath');return}heavyHeld=false;actionQueue=null;energy-=10;dodgeLink=.95;dodgeCooldown=.72;invuln=.5;const perfect=enemies.some(e=>!e.dead&&e.state==='windup'&&e.timer<.28&&flatDistance(e.root.position,player.root.position)<4);if(perfect){gainFlow();energy=Math.min(100,energy+15);riposte=2;actionText('PERFECT EVADE');eclipseSystems?.styleHit('evade',16);ring(player.root.position,0x8dd2c2,3,.5)}const d=movementDir();if(d.lengthSq()<.1)d.copy(facing());action={type:'dodge',t:0,duration:.46,dir:d,facing:player.root.rotation.y,localDir:d.clone().applyQuaternion(player.root.quaternion.clone().invert())};tone(170,.25,'triangle',.07,40);if(!perfect)actionText('SHADOWSTEP')}
function parry(){if(finisher||parryCooldown>0)return;if(action&&attackTypes.has(action.type)){if(!action.hit||energy<6){notify('Guard cancel opens after contact · 6 wrath');return;}energy-=6;recordMove('GUARD CANCEL');}cancelUnreleasedCast();heavyHeld=false;actionQueue=null;action={type:'parry',t:0,duration:.68};parryCooldown=1.05;ring(player.root.position,0xc6cfb5,1.7,.35);tone(360,.2,'triangle',.04,200)}
function meleeImpact(a){
 a.targetsHit??=new Set();const first=!a.impactFx;a.impactFx=true;
 if(a.convergence&&first){const center=player.root.position.clone().addScaledVector(facing(),2);for(const school of ['fire','mind','ghost'])ring(center,colors[school],6,.65);hitArea(center,6,48,8,3,'mind');health=Math.min(runMods.maxHealth,health+8);recordMove('TRIUNE CONVERGENCE');actionText('TRIUNE CONVERGENCE');eclipseSystems?.styleHit('convergence',28);shake=.3;}
 const specs={crusher:[4.4,42,8,0],riftstrike:[4.8,27,4,3],flowburst:[6,55,14,4],guardbreak:[3.7,24,5,0],sweep:[4,22,3,0],hook:[3.8,20,0,0],knee:[3.6,34,4,6],groundstrike:[4.2,44,3,0],riposte:[4.1,32,6,4],light:[3.5,a.step===4?33:18,a.step===4?6:2,0],heavy:[3.9,30,2,9.5],cleave:[5.2,41,8,0],stomp:[5.2,47,5,4],slam:[5.5,65,12,0],charged:[5.5+a.charge*2,48+a.charge*34,11,7],lunge:[4.4,29,2,0],aerial:[4.2,18,0,0]};
 const [baseRange,damage,knock,launch]=specs[a.type];const range=(MELEE_REACH[a.type]??baseRange)*runMods.reach;
 const radial=['cleave','stomp','slam','charged','sweep','flowburst'].includes(a.type)||a.step===3;
 const color=weaveTime>0?colors[weaveSchool]:0xffaa6a;
 const pos=player.root.position.clone().add(new THREE.Vector3(0,1.7+(a.type==='aerial'?Math.max(0,(a.target?.root.position.y||0)):0),0));
 if(first)slash(pos,player.root.rotation.y,a.type!=='light',color);
 let count=0;
 for(const e of enemies){
  if(e.dead){if(first&&e.physicalBody&&flatDistance(e.root.position,player.root.position)<range)kickBody(e,player.root.position,Math.max(3,knock),a.type==='groundstrike'?3:1);continue;}
  const delta=e.root.position.clone().sub(player.root.position).setY(0),d=delta.length(),dot=delta.normalize().dot(facing());
  if(!canMeleeHit(a,e,player,range,(p,q)=>attackClear(p,q,obstacles)))continue;
  count++;a.targetsHit.add(e);a.hit=true;a.contactTarget=e;a.contactAt=a.t;
  const fromBehind=facing().dot(new THREE.Vector3(Math.sin(e.root.rotation.y),0,Math.cos(e.root.rotation.y)))>.65;
  if(e.soulAnchor>0){e.soulAnchor=0;damageEnemy(e,e.anchorPower||52,0,0,null,'ghost');health=Math.min(runMods.maxHealth,health+12);actionText('SOUL ANCHOR RUPTURE');ring(e.root.position,colors.ghost,3,.5);}
  let guardFactor=1;if((e.guardActive||a.type==='guardbreak'&&e.guardMeter>0)&&facing().dot(new THREE.Vector3(Math.sin(e.root.rotation.y),0,Math.cos(e.root.rotation.y)))<-.3){e.guardMeter-=damage*(a.type==='light'?.65:a.type==='guardbreak'?3.6:1.8);if(e.guardMeter>0){guardFactor=.3;actionText('GUARDED · FLANK OR BREAK');ring(chestContact(e),0xb9cbe0,1,.2);}else{e.guardActive=false;e.guardMeter=0;e.broken=2.8;e.stagger=2.8;gainFlow();recordMove('ENEMY GUARD BREAK');}}
  const rend=rendHit(e,a,guardFactor<1);if(rend.rupture){e.poise=(e.poise||0)+32;gainFlow();energy=Math.min(100,energy+8);recordMove('REND RUPTURE');actionText('REND RUPTURE · ARMOR OPEN');ring(chestContact(e),0xef8d56,1.5,.25);e.coupKill=true;}
  damageEnemy(e,(damage+rend.bonus)*guardFactor*STANCES[a.stance??stance].damage*(a.precise?1.12:1)*(riposte>0?1.8:1)*(e.broken>0?1.3:1)*(fromBehind?1.12:1),knock*guardFactor,guardFactor<1?0:launch,null,a.type==='riftstrike'?'ghost':weaveTime>0?weaveSchool:null);
  if(launch&&!e.dead&&(!airTarget||airTarget.dead||e===a.target))airTarget=e;
  if(a.type==='guardbreak'){e.poise=(e.poise||0)+(e.boss?75:70);e.stagger=Math.max(e.stagger,e.boss?.35:1.6);ring(e.root.position,0xf3d6a0,1.8,.35);}
  e.poise=(e.poise||0)+damage*(a.type==='light'?.6:1.2)*(a.precise?1.4:1)*STANCES[a.stance??stance].poise;if(a.precise){energy=Math.min(100,energy+3);if(!a.flowAwarded){gainFlow();a.flowAwarded=true;}}
  if(a.type==='hook'&&!e.dead){e.kb.addScaledVector(player.root.position.clone().sub(e.root.position).setY(0).normalize(),11/massOf(e));e.stagger=Math.max(e.stagger,1.2);clinchTarget=e;clinchTime=1.5;actionText('CLINCH · HEAVY FOR KNEE');}
  if(a.type==='sweep'&&!e.dead&&!e.boss){startBody(e,e.kb.clone().add(new THREE.Vector3(0,1.5,0)));e.downed=e.elite?.7:1.2;e.stagger=2.2;}
  if(a.type==='groundstrike'&&e.physicalBody){kickBody(e,player.root.position,4,3);e.downed=Math.max(e.downed||0,.5);}
  if(a.type==='knee')clinchTime=0;
  if(e.poise>=(e.boss?220:e.elite?115:65)&&!e.dead){e.poise=0;e.broken=3.2;e.stagger=3.2;ring(e.root.position,0xd9c8a5,2.5,.5);actionText('WILL SHATTERED');recordMove('WILL SHATTERED');}
  if(a.type==='aerial'){e.airHold=.55;e.vy=1.5;e.airborne=true;e.stagger=.8;}
  if(a.type==='slam'){e.airHold=0;e.tk=0;e.vy=-19;e.stagger=1.5;if(e.root.position.y>.4)e.slamPower=24;}
  if(weaveTime>0){
   burst(e.root.position.clone().add(new THREE.Vector3(0,1.6,0)),color,16,4,.6);
   if(weaveSchool==='fire'){e.burn=4;e.burnTick=.5;}
   if(weaveSchool==='mind'){e.stagger=Math.max(e.stagger,1.2);e.poise+=20;}
   if(weaveSchool==='ghost')health=Math.min(runMods.maxHealth,health+4);
  }
 }
 if(first&&['slam','stomp','charged','cleave'].includes(a.type)){impactWorld.strike(player.root.position,a.type==='charged'?1.6:1);ring(player.root.position,color,range,.6);burst(player.root.position,color,a.type==='charged'?95:45,9,.8);shake=.35;}
 if(count){eclipseSystems?.styleHit(a.type,9+Math.min(4,count));lastMeleeHit=elapsed;if(riposte>0){const label=a.type==='riposte'?'RUIN COUNTER':'INFERNAL RIPOSTE';actionText(label);recordMove(label);riposte=0;}shake=Math.max(shake,a.type==='light'?.12:.23);hitstop=a.type==='charged'?.095:.045;tone(a.type==='light'?95:48,a.type==='light'?.085:.16,'sawtooth',a.type==='light'?.085:.13,18);if(a.step===4&&a.type==='light')actionText('RUINOUS CHAIN');score+=styleVariety.size*count*2;}else if(first)tone(170,.08,'triangle',.018,50);
}

function contactFootsteps(){const m=motionInfo(player),now=m.feet.map(f=>f.planted);if(player.lastFootContacts&&!action&&!finisher&&m.speed>.8)now.forEach((down,i)=>{if(down&&!player.lastFootContacts[i]){const at=new THREE.Vector3(...m.feet[i].actual);at.y=.08;burst(at,0x8b8170,3,1,.26);tone(m.speed>7?78:58,.045,'triangle',.024,26);}});player.lastFootContacts=now;}
function movementDir(){const d=new THREE.Vector3();if(keys.KeyW||keys.ArrowUp)d.z-=1;if(keys.KeyS||keys.ArrowDown)d.z+=1;if(keys.KeyA||keys.ArrowLeft)d.x-=1;if(keys.KeyD||keys.ArrowRight)d.x+=1;return d.normalize().applyAxisAngle(vup,yaw)}
const executionKey=d=>d?.bossOnly?'bossFinisher':d?.smallOnly?'smallFinisher':'finisher';
const matchesExecution=(d,filter)=>filter==='all'||(filter==='boss'?!!d.bossOnly:filter==='small'?!!d.smallOnly:!d.bossOnly&&!d.smallOnly&&d.school===filter);
function nextExecution(consume=false,boss=false,small=false){
 const pool=FINISHERS.filter(f=>boss?f.bossOnly:small?f.smallOnly:!f.bossOnly&&!f.smallOnly),choice=boss?options.bossFinisher:small?options.smallFinisher:options.finisher;
 if(choice!=='auto'){const found=pool.find(f=>f.id===choice);if(found)return found;}
 let bag=boss?bossExecutionBag:small?smallExecutionBag:executionBag;
 if(!bag.length){bag=pool.map(f=>f.id);for(let i=bag.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}const first=boss?'kingbreaker':small?'grave-stamp':'soulbreaker';if(!completedExecutions.some(id=>pool.some(f=>f.id===id))){bag.splice(bag.indexOf(first),1);bag.unshift(first);}else if(bag[0]===completedExecutions.findLast(id=>pool.some(f=>f.id===id)))[bag[0],bag[1]]=[bag[1],bag[0]];if(boss)bossExecutionBag=bag;else if(small)smallExecutionBag=bag;else executionBag=bag;}
 const def=pool.find(f=>f.id===bag[0]);if(consume)bag.shift();return def;
}
function startExecution(e,def,preview=false){
 if(!def||def.bossOnly&&!e.boss||!!def.smallOnly!==!!e.small)return false;const plan=preview?null:planExecution(def,player.root.position,e.root.position,!!e.boss,obstacles);if(!preview&&!plan){notify('No safe execution space. Draw this enemy away from the obstacle.');return false;}const capture=r=>[r.rig,r.hips,r.spine,r.torso,r.neck,r.head,...r.arms,...r.forearms,...r.hands,...r.legs,...r.shins,...r.feet].map(node=>({node,p:node.position.clone(),q:node.quaternion.clone()})),actorPose=capture(player),victimPose=capture(e);const actorFrom=player.root.position.clone(),victimFrom=e.root.position.clone(),actorYaw=player.root.rotation.y,victimYaw=e.root.rotation.y;let entryPose=null;if(e.physicalBody||e.rise){beginRecovery(e);entryPose=e.rise.from;}clearBody(e);resetMotion(e);e.downed=0;e.rise=null;if(!preview)cancelUnreleasedCast();
 heavyHeld=false;action=null;actionQueue=null;airTarget=null;
 finisher={actionCamera:options.executionCamera,cameraShake:options.shake,cameraObstacles:preview?null:obstacles,def,entryPose,enemy:e,t:0,stage:0,preview,impactDone:false,origin:e.root.position.clone().setY(.06),front:player.root.position.clone().sub(e.root.position).setY(0).normalize()};
 if(finisher.front.length()<.1)finisher.front.set(0,0,1);
 if(plan){finisher.origin.copy(plan.origin);finisher.front.copy(plan.front);const angle=Math.atan2(plan.front.x,plan.front.z);finisher.entry={plan,t:0,duration:THREE.MathUtils.clamp(Math.max(actorFrom.distanceTo(plan.entry)/7,victimFrom.distanceTo(plan.origin)/5,Math.abs(Math.atan2(Math.sin(actorYaw-angle-Math.PI),Math.cos(actorYaw-angle-Math.PI)))*.15),.12,.75),actorFrom,victimFrom,actorYaw,victimYaw,actorPose};finisher.entryPose=entryPose||victimPose;}
 if(!preview){for(const other of enemies)if(other!==e&&!other.dead&&flatDistance(other.root.position,e.root.position)<7){other.kb.copy(other.root.position).sub(e.root.position).setY(0).normalize().multiplyScalar(16);other.stagger=def.duration+.3;}invuln=def.duration+1+(finisher.entry?.duration||0);executeCooldown=def.duration+1.8+(finisher.entry?.duration||0);}
 e.stagger=def.duration+1;e.state='chase';e.root.position.y=.06;e.airHold=0;e.vy=0;
 document.body.classList.add('cinematic');$('cinema').classList.add('active');$('executionTitle').textContent=def.name.toUpperCase();$('executionSchool').textContent=FINISHER_SCHOOLS[def.school].label+' / '+String(FINISHERS.indexOf(def)+1).padStart(2,'0');$('previewNotice').textContent=preview?'GRIMOIRE PREVIEW · ESC TO RETURN':'';tone(55,.5,'sine',.2,20);return true;
}
function execute(){
 if(finisher)return;
 if(chainWindow>0&&chainTarget&&!chainTarget.dead&&executionReady(chainTarget)&&flatDistance(chainTarget.root.position,player.root.position)<7){const e=chainTarget;chainWindow=0;chainTarget=null;const bag=[...executionBag],bossBag=[...bossExecutionBag],smallBag=[...smallExecutionBag];if(startExecution(e,nextExecution(true,!!e.boss,!!e.small))){finisher.chain=true;executeCooldown=Math.min(executeCooldown,2.6);if(finisher.entry)finisher.entry.duration=Math.min(finisher.entry.duration,.14);eclipseSystems?.styleHit('chain-execution',24);actionText('CHAIN EXECUTION');}else{executionBag=bag;bossExecutionBag=bossBag;smallExecutionBag=smallBag;}return;}if(executeCooldown>0){notify(`Execution recovering · ${Math.ceil(executeCooldown)}s`);return;}
 const e=enemies.filter(e=>!e.dead&&executionReady(e)&&flatDistance(e.root.position,player.root.position)<5.5).sort((a,b)=>a.hp-b.hp)[0];
 if(!e){notify('Weaken an enemy below 60% vitality or break their will. Bosses require 20%.');return;}
 const bag=[...executionBag],bossBag=[...bossExecutionBag],smallBag=[...smallExecutionBag];if(!startExecution(e,nextExecution(true,!!e.boss,!!e.small))){executionBag=bag;bossExecutionBag=bossBag;smallExecutionBag=smallBag;}
}
function executionImpact(f,landing){
 impactNoise(.16,.075);tone(38,.18,'sine',.15,20);gore.emit(chestContact(f.enemy),f.front.clone().multiplyScalar(-1).setY(1),f.def.bossOnly?3:2.1,f.preview?f:null);if(f.preview){f.enemy.dead=true;return;}
 impactWorld.strike(landing,1.7);eclipseSystems?.styleHit(f.def.id,28);killEnemy(f.enemy);hitArea(landing,5,40,10);if(ascendTime<=0)ascendCharge=Math.min(100,ascendCharge+18);health=Math.min(runMods.maxHealth,health+28);energy=Math.min(100,energy+28);score+=350;recordMove(f.def.name.toUpperCase());
}
function finishExecution(f,cancelled=false){
 executionDirector?.cleanup(f);
 if(f.enemy){f.enemy.torso.scale.set(1,1,1);if(f.enemy.dead){f.enemy.executed=true;f.enemy.corpseY=f.enemy.root.position.y;}}
 finisher=null;document.body.classList.remove('cinematic');$('cinema').classList.remove('active');$('previewNotice').textContent='';
 if(f.preview){
  removeTransientRig(f.enemy);const old=previewSnapshot;previewSnapshot=null;
  if(old){player.root.position.copy(old.position);player.root.rotation.copy(old.rotation);player.root.scale.copy(old.scale);camera.position.copy(old.cameraPosition);camera.quaternion.copy(old.cameraQuaternion);camera.fov=old.fov;camera.updateProjectionMatrix();action=old.action;actionQueue=old.actionQueue;airTarget=old.airTarget;}
  pose(player,elapsed);resetMotion(player);paused=true;panelOpen='finishers';$('finisherGrimoire').classList.remove('hidden');renderCatalog();shake=0;hitstop=0;
 }else{const offset=camera.position.clone().sub(player.root.position);yaw=Math.atan2(offset.x,offset.z);pitch=THREE.MathUtils.clamp(Math.atan2(offset.y-1.75,Math.hypot(offset.x,offset.z))-.17,-.12,1.05);completedExecutions.push(f.def.id);if(completedExecutions.length>50)completedExecutions.shift();invuln=1;player.rig.rotation.set(0,0,0);player.rig.position.set(0,0,0);if(!cancelled)actionText('SOUL CLAIMED  +350');const chainOpts=enemies.filter(e=>!e.dead&&executionReady(e)&&flatDistance(e.root.position,player.root.position)<6).sort((a,b)=>a.hp-b.hp);if(chainOpts.length){chainWindow=1.75;chainTarget=chainOpts[0];notify('CHAIN EXECUTION READY · E · '+chainOpts[0].kind);}}
}
function removeTransientRig(r){
 if(!r)return;gore.release(r);clearBody(r);scene.remove(r.root);const geometries=new Set(),materials=new Set();r.root.traverse(o=>{if(o.isMesh){if(![boxG,sphereG,icoG].includes(o.geometry))geometries.add(o.geometry);if(o.material&&!sharedRigMaterials.has(o.material))materials.add(o.material);}});geometries.forEach(g=>g.dispose());r.ownedMaterials?.forEach(m=>materials.add(m));materials.forEach(m=>m.dispose());if(r.telegraph){scene.remove(r.telegraph);r.telegraph.geometry.dispose();r.telegraph.material.dispose();}
}
function makeExecutionGhost(source){
 const g=creature(source.isPlayer);g.spectral=true;g.root.scale.copy(source.root.scale);const m=new THREE.MeshBasicMaterial({color:0x82cbb7,transparent:true,opacity:.13,depthWrite:false,blending:THREE.NormalBlending});m.userData.executionOnly=true;g.echoMaterial=m;g.wings.forEach(w=>w.visible=false);g.root.traverse(o=>{if(o.isMesh){o.material=m;o.castShadow=false;o.receiveShadow=false;}});return g;
}
function updateFinisher(dt){
 if(!finisher)return;const f=finisher;if(f.chain)dt*=1.7;
 if(f.entry&&!f.entry.done){const a=f.entry;a.t+=dt;const u=Math.min(1,a.t/a.duration),w=u*u*(3-2*u),angle=Math.atan2(f.front.x,f.front.z);player.root.position.lerpVectors(a.actorFrom,a.plan.entry,w);f.enemy.root.position.lerpVectors(a.victimFrom,a.plan.origin,w);player.root.rotation.y=angleLerp(a.actorYaw,angle+Math.PI,w);f.enemy.root.rotation.y=angleLerp(a.victimYaw,angle,w);pose(player,elapsed,Math.sin(Math.PI*u)*.6);pose(f.enemy,elapsed,.1);for(const old of a.actorPose){old.node.quaternion.slerpQuaternions(old.q,old.node.quaternion.clone(),w);old.node.position.lerpVectors(old.p,old.node.position.clone(),w);}if(f.entryPose){for(const old of f.entryPose){old.node.quaternion.slerpQuaternions(old.q,old.node.quaternion.clone(),w);old.node.position.lerpVectors(old.p,old.node.position.clone(),w);}}const look=player.root.position.clone().lerp(f.enemy.root.position,.5).add(new THREE.Vector3(0,1.8,0));camera.lookAt(look);$('executionBeat').textContent='ALIGNING · CLAIMING EXECUTION SPACE';$('executionProgress').style.width='0%';if(u>=1){a.done=true;f.entryPose=null;resetMotion(player);resetMotion(f.enemy);}return;}
 executionDirector.update(f,dt);
 const u=Math.min(1,(f.clock??f.t)/f.def.duration),marks=f.def.marks||[0,.31,.65],beat=Math.max(0,marks.findLastIndex(x=>f.t/f.def.duration>=x));
 $('executionBeat').textContent=String(beat+1).padStart(2,'0')+' / '+String(f.def.beats.length).padStart(2,'0')+' · '+f.def.beats[beat].toUpperCase();$('executionProgress').style.width=(u*100)+'%';
}

function alignExecutionHands(){if(finisher&&(!finisher.entry||finisher.entry.done)&&finisher.props)executionDirector.align(finisher);}
function hitArea(pos,radius,damage,knock=3,launch=0,school=null){for(const e of enemies)if(!e.dead&&flatDistance(e.root.position,pos)<radius)damageEnemy(e,damage,knock,launch,pos,school)}
function projectile(pos,dir,color,damage=35,speed=23,target=null,kind='bolt'){const m=new THREE.Group();m.position.copy(pos);scene.add(m);orb(m,new THREE.MeshBasicMaterial({color}),0,0,0,.14,.14,.35);const shell=orb(m,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.18,depthWrite:false}),0,0,0,.32,.32,.5);m.lookAt(pos.clone().add(dir));projectiles.push({mesh:m,dir:dir.clone(),color,damage,speed,target:target==='player'?null:target,hostile:target==='player',life:3,kind,trail:0});}
function makeZone(pos,type,radius,duration,power=1){const color=type==='vortex'||type==='mine'?0xff6b2c:type==='rift'||type==='gravity'?0xb38cff:0x8adcc0;const g=new THREE.Group();g.position.copy(pos);scene.add(g);for(let i=0;i<3;i++){const m=mesh(new THREE.TorusGeometry(radius*(1-i*.2),.022,5,70),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65,depthWrite:false}),g,0,.12+i*.5,0);m.rotation.x=Math.PI/2+i*.25}if(type==='gravity')orb(g,new THREE.MeshBasicMaterial({color:0x20172f}),0,1.2,0,.6,.6,.6);zones.push({mesh:g,type,radius,duration,power,t:0,tick:0,color});}
function castPower(){if(mode!=='game'||paused||wheelOpen||finisher||action?.type==='dodge')return;if(action?.type==='cast'&&!action.released)return;const powerIndex=selected,p=powers[powerIndex],overcast=!!(keys.ShiftLeft||keys.ShiftRight),cost=p.cost*(elapsed-lastMeleeHit<.8?.75:1)*(overcast?1.35:1);if(cooldowns[selected]>0){notify(`${p.name} is recovering`);return}if(energy<cost){notify('Your wrath is depleted. Strike enemies to replenish it.');tone(35,.15,'triangle',.08,25);return}const weave=elapsed-lastMeleeHit<.8;energy-=cost;const conduitStyle=eclipseSystems?.value?.()||0;if(conduitStyle>=80){const refund=cost*(conduitStyle>=160?.4:.25);energy=Math.min(100,energy+refund);notify('STYLE CONDUIT · '+Math.round(refund)+' WRATH RETURNED');}cooldowns[selected]=p.cd*(overcast?1.15:1);heavyHeld=false;const target=aim(34),dir=facing(),origin=player.root.position.clone(),hand=origin.clone().add(new THREE.Vector3(0,1.85,0)).addScaledVector(dir,.8),point=target?target.root.position.clone():origin.clone().addScaledVector(dir,10);actionQueue=null;action={type:'cast',t:0,duration:overcast?(weave?.78:1.08):(weave?.56:.85),overcast,school:p.type,powerIndex,releaseAt:CAST_RELEASES[powerIndex],released:false,paid:cost,target};actionText((overcast?'OVERCAST · ':weave?'SPELLWEAVE · ':'')+p.name.toUpperCase());tone(p.type==='fire'?110:p.type==='mind'?330:200,.4,'sawtooth',.07,40);burst(hand,colors[p.type],25,4,.5);
const castAction=action;castAction.emit=()=>{resonance.add(p.type);resonanceTime=18;if(resonance.size===3){actionText('TRIUNE RESONANCE · HEAVY TO UNLEASH');tone(480,.4,'triangle',.08,240);}weaveTime=4*runMods.duration;weaveSchool=p.type;if(weave)recordMove('SPELLWEAVE');if(overcast){recordMove('OVERCAST');eclipseSystems?.styleHit('overcast-'+powerIndex,8);}origin.copy(player.root.position);dir.copy(facing());player.root.updateMatrixWorld(true);hand.copy(player.hands[[16,20,22].includes(powerIndex)?0:1].getWorldPosition(new THREE.Vector3()));if([17,18,19,21,23].includes(powerIndex))hand.lerp(player.hands[0].getWorldPosition(new THREE.Vector3()),.5);if(target&&!target.dead)point.copy(target.root.position);else point.copy(origin).addScaledVector(dir,10);burst(hand,colors[p.type],28,4,.45);switch(powerIndex){case 0:projectile(hand,dir,colors.fire,overcast?64:43,overcast?32:26,null);break;
case 1:for(let j=-3;j<=3;j++){let d=dir.clone().applyAxisAngle(vup,j*(overcast?.18:.14));projectile(hand,d,colors.fire,overcast?45:33,18,null,'wave')}slash(hand,player.root.rotation.y,false,0xff6023);break;
case 2:{const m=mesh(new THREE.IcosahedronGeometry(.8,1),ember,scene,point.x+5,19,point.z-2);zones.push({mesh:m,type:'meteor',radius:overcast?8:6,power:overcast?1.4:1,duration:1.25,t:0,tick:0,color:colors.fire,target:point.clone()});ring(point,0xff702a,6,1.3);break}
case 3:action={type:'fireDash',overcast,t:0,duration:overcast?.7:.5,dir,hitEnemies:new Set()};invuln=.7;break;
case 4:makeZone(point,'vortex',overcast?6.5:5.5,overcast?7:5.5,overcast?1.4:1);break;
case 5:ring(origin,0xff7028,12,1);ring(origin,0xffcf7a,9,.8);burst(origin.clone().add(new THREE.Vector3(0,1,0)),0xff6c29,160,15,1.1);hitArea(origin,overcast?13:11,overcast?115:85,overcast?19:15,overcast?7:5);shake=.55;break;
case 6:{const end=hand.clone().addScaledVector(dir,32);beam(hand,end,colors.mind,.07,.4);beam(hand,end,0xe8dbff,.022,.25);for(const e of enemies){if(e.dead)continue;let delta=new THREE.Vector3().subVectors(e.root.position,origin),dot=delta.dot(dir),side=delta.clone().addScaledVector(dir,-dot).length();if(dot>0&&dot<32&&side<2)damageEnemy(e,overcast?82:60,overcast?9:5,overcast&&e.broken>0?4:0,null,'mind')}shake=.12;break}
case 7:if(target){damageEnemy(target,22,0,11,null,'mind');target.stagger=target.boss?.4:2;target.tk=target.boss?0:1.15;target.tkHeight=overcast?4.2:2.7;target.tkForce=overcast?72:48;beam(hand,target.root.position.clone().add(new THREE.Vector3(0,1,0)),colors.mind,.025,.8);ring(target.root.position,colors.mind,2,.7)}else{ring(point,colors.mind,3,.5);notify('Telekinesis needs a nearby target')}break;
case 8:makeZone(point,'gravity',overcast?8.5:7,overcast?6.5:5,overcast?1.5:1);break;
case 9:hitArea(origin,overcast?11:9,overcast?64:46,overcast?7:3,0,'mind');for(let e of enemies)if(!e.dead&&flatDistance(e.root.position,origin)<(overcast?11:9)){e.stagger=overcast?4.5:3.5;if(overcast)e.broken=Math.max(e.broken||0,2.2);};ring(origin,colors.mind,9,.75);burst(hand,colors.mind,70,10);shake=.25;break;
case 10:slowTime=overcast?8:6;makeZone(origin,'rift',overcast?14:11,overcast?8:6);ring(origin,colors.mind,15,1.3);break;
case 11:for(let j=0;j<(overcast?5:3);j++){let t=enemies.filter(e=>!e.dead).sort((a,b)=>flatDistance(a.root.position,origin)-flatDistance(b.root.position,origin))[j]||target;projectile(hand.clone().add(new THREE.Vector3((j-(overcast?2:1))*.6,.3,0)),dir.clone().applyAxisAngle(vup,(j-(overcast?2:1))*.35),colors.ghost,36,19,t,'blade')}break;
case 12:ghostTime=overcast?6:4;invuln=ghostTime;ring(origin,colors.ghost,3,.6);break;
case 13:{let n=0;for(let e of enemies)if(!e.dead&&flatDistance(e.root.position,origin)<9){beam(e.root.position.clone().add(new THREE.Vector3(0,1.5,0)),hand,colors.ghost,.035,.6);damageEnemy(e,overcast?58:42,0,0,null,'ghost');e.kb.addScaledVector(origin.clone().sub(e.root.position).setY(0).normalize(),3/massOf(e));n++;}health=Math.min(runMods.maxHealth,health+n*(overcast?18:13));ring(origin,colors.ghost,9,.9);break}
case 14:for(let i=0;i<3;i++){const s=creature(false);const m=new THREE.MeshBasicMaterial({color:0x74c9b2,transparent:true,opacity:.27,depthWrite:false});s.root.traverse(o=>{if(o.isMesh){o.material=m;o.castShadow=false}});s.root.scale.setScalar(.95);s.root.position.copy(origin).add(new THREE.Vector3(Math.cos(i*TAU/3)*2,0,Math.sin(i*TAU/3)*2));Object.assign(s,{life:overcast?12:9,power:overcast?1.4:1,timer:.4,phase:i});summons.push(s);burst(s.root.position,colors.ghost,20,4)}break;
case 15:for(const e of enemies)if(!e.dead&&flatDistance(e.root.position,origin)<(overcast?10:8)){e.snared=e.boss?.7:overcast?4.2:3;e.burn=5;e.burnTick=.2;damageEnemy(e,18,0,0,null,'fire');beam(hand,chestContact(e),colors.fire,.04,.45);ring(e.root.position,colors.fire,1.2,3);}break;
case 16:makeZone(origin.clone().addScaledVector(dir,4),'mine',overcast?6:4.5,8,overcast?1.4:1);break;
case 17:aegis=overcast?85:60;aegisTime=overcast?9:7;ring(origin,colors.fire,2,.6);break;
case 18:action={type:'phoenix',t:0,duration:.72,dir:dir.clone(),hit:false,overcast};invuln=.3;break;
case 19:for(const e of enemies){const d=e.root.position.clone().sub(origin).setY(0);if(!e.dead&&d.length()<12&&d.normalize().dot(dir)>.55){damageEnemy(e,overcast?47:32,overcast?24:18,2,origin,'mind');beam(hand,chestContact(e),colors.mind,.09,.3);}}break;
case 20:{let from=hand.clone(),last=target,visited=new Set();for(let hop=0;hop<(overcast?6:4);hop++){const e=last&&!visited.has(last)&&!last.dead?last:enemies.filter(e=>!e.dead&&!visited.has(e)&&flatDistance(e.root.position,from)<9).sort((a,b)=>flatDistance(a.root.position,from)-flatDistance(b.root.position,from))[0];if(!e)break;visited.add(e);beam(from,chestContact(e),colors.mind,.055,.6);e.poise=(e.poise||0)+35;e.stagger=Math.max(e.stagger,e.boss?.3:1.1);damageEnemy(e,(overcast?38:29)*(1-hop*.09),2,0,null,'mind');from.copy(chestContact(e));last=null;}break;}
case 21:{let count=0;for(const e of enemies)if(!e.dead&&flatDistance(e.root.position,point)<(overcast?8:6)){damageEnemy(e,15,0,8,null,'mind');if(!e.boss){e.tk=1.05+count++*.12;e.tkHeight=2.2+(count%3)*.45;e.tkForce=overcast?68:45;}beam(hand,chestContact(e),colors.mind,.025,1);ring(e.root.position,colors.mind,1.5,.6);}break;}
case 22:if(target){target.soulAnchor=overcast?10:7;target.anchorPower=overcast?75:52;beam(hand,chestContact(target),colors.ghost,.06,.6);ring(target.root.position,colors.ghost,1.6,1);}else notify('Soul Anchor needs a target in view');break;
case 23:reaperWard=overcast?7:5;ring(origin,colors.ghost,2.5,.7);break;

}};
}
function angleLerp(a,b,t){return a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t}
function pose(r,t,moving=0,attack=null){poseMotion(r,t,moving,attack)}
function smoothRig(r,dt){if(r.physicalBody)return;finishMotion(r,dt);if(r===player&&!finisher&&action?.contactTarget&&!action.contactTarget.dead&&action.type==='light'&&action.step<3){const age=action.t-action.contactAt,w=Math.max(0,1-age/.13),hand=action.step===1?1:0,goal=chestContact(action.contactTarget,0,.34);r.root.updateMatrixWorld(true);if(goal.distanceTo(r.arms[hand].getWorldPosition(new THREE.Vector3()))<1.05)aimHand(r,hand,goal,w*.8);}if(!finisher||(r!==player&&r!==finisher.enemy))rememberBody(r,dt);}
const handHistory=[null,null];let trailClock=0;
function clawTrails(dt){
 trailClock+=dt;player.root.updateMatrixWorld(true);
 for(let i=0;i<2;i++){
  const p=player.hands[i].getWorldPosition(new THREE.Vector3());
  const active=action&&attackTypes.has(action.type)&&action.t/action.duration>.2&&action.t/action.duration<.7;
  if(active&&handHistory[i]&&trailClock>.025&&p.distanceTo(handHistory[i])<3){const c=weaveTime>0?colors[weaveSchool]:0xffba7c;beam(handHistory[i],p,c,.023,.16);burst(p,c,1,1,.25);}
  if(trailClock>.025)handHistory[i]=p;
 }
 if(trailClock>.025)trailClock=0;
}

function aimHand(r,side,worldGoal,weight=1){
 r.root.updateMatrixWorld(true);const arm=r.arms[side],fore=r.forearms[side],hand=r.hands[side],bindUpper=fore.position.clone(),bindLower=hand.position.clone();
 const target=arm.parent.worldToLocal(worldGoal.clone()).sub(arm.position),l1=bindUpper.length(),l2=bindLower.length(),len=THREE.MathUtils.clamp(target.length(),.05,l1+l2-.005),dir=target.normalize();
 let pole=new THREE.Vector3(side?1:-1,-.1,-.7);pole.addScaledVector(dir,-pole.dot(dir)).normalize();
 const x=(l1*l1-l2*l2+len*len)/(2*len),y=Math.sqrt(Math.max(0,l1*l1-x*x)),elbow=dir.clone().multiplyScalar(x).addScaledVector(pole,y);
 const qa=new THREE.Quaternion().setFromUnitVectors(bindUpper.normalize(),elbow.clone().normalize());const lower=dir.multiplyScalar(len).sub(elbow).applyQuaternion(qa.clone().invert());const qf=new THREE.Quaternion().setFromUnitVectors(bindLower.normalize(),lower.normalize());
 arm.quaternion.slerp(qa,weight);fore.quaternion.slerp(qf,weight);
}
function chestContact(e,x=0,z=.24){e.root.updateMatrixWorld(true);return e.torso.localToWorld(new THREE.Vector3(x,.47,z));}

function updatePlayer(dt){if(actionQueue?.expires<elapsed)actionQueue=null;clinchTime=Math.max(0,clinchTime-dt);const pos=player.root.position;if(finisher){moveVelocity.set(0,0,0);updateFinisher(dt);return}player.motionCombat=!!nearest(8);let dir=movementDir(),moving=dir.length(),sprint=keys.ShiftLeft||keys.ShiftRight;let speed=(ghostTime>0?11:sprint?8.8:walkToggle?2.2:6)*runMods.speed*(ascendTime>0?1.2:1);
if(action){action.t+=dt;const a=action,u=a.t/a.duration;if(a.type==='charge'){
 speed*=.25;pose(player,walkPhase,moving*.2,a);const level=a.t>.95?2:a.t>.65?1:0;if(level>a.level){a.level=level;ring(pos,level===2?0xffdf9c:0xf48246,1.3+level,.35);tone(160+level*100,.18,'triangle',.06,90);actionText(level===2?'WORLD BREAKER READY':'CRUCIBLE READY');}if(Math.random()<.4)burst(pos.clone().add(new THREE.Vector3(.5,1.6,0)),0xff753c,2,2,.5);if(!heavyHeld||a.t>=1.5)releaseHeavy();
 }else if(a.type==='enemystep'){speed=0;}else if(a.type==='phoenix'){speed=0;if(u<.45){pos.addScaledVector(a.dir,dt*13);resolveWorld(pos);}player.rig.position.y=Math.sin(Math.min(1,u)*Math.PI)*1.1;if(u>.52&&!a.hit){a.hit=true;hitArea(pos,a.overcast?7:5,70,10,3,'fire');ring(pos,colors.fire,6,.6);impactWorld.strike(pos,1.5);shake=.3;}}else if(a.type==='guard'){speed*=.35;if(!keys.KeyF)action=null;}else if(a.type==='tether'){speed=0;updateTether(a,dt);}else if(a.type==='dodge'||a.type==='fireDash'){pos.addScaledVector(a.dir,dt*(a.type==='fireDash'?27:22)*(1-u*.45));player.root.rotation.y=a.type==='dodge'?a.facing:Math.atan2(a.dir.x,a.dir.z);burst(pos.clone().add(new THREE.Vector3(0,.6,0)),a.type==='fireDash'?0xff702c:0x929f91,a.type==='fireDash'?7:2,1,.5);if(a.type==='fireDash'){for(let e of enemies)if(!e.dead&&!a.hitEnemies.has(e)&&flatDistance(e.root.position,pos)<3){a.hitEnemies.add(e);damageEnemy(e,a.overcast?78:58,a.overcast?12:8);ring(e.root.position,0xff752e,2,.3)}}}else if(attackTypes.has(a.type)){
 if(u<.4){const d=a.target&&!a.target.dead?flatDistance(pos,a.target.root.position):10;const advance=a.type==='lunge'?20:a.type==='aerial'?6:3.4;if(d>1.8)pos.addScaledVector(facing(),Math.min(dt*advance,d-1.8));}
 steerAttack(a,player,dt,impactAt(a));const [begin,end]=strikeWindow(a,impactAt(a));if(u>=begin&&u-dt/a.duration<=end)meleeImpact(a);
 speed*=.2;
 }else speed*=.25;if(a.type==='cast'&&a.target&&!a.target.dead&&!a.released)steerAttack(a,player,dt,a.releaseAt);if(a.type!=='charge')pose(player,walkPhase,moving*.3,a);if(a.emit&&!a.released&&u>=a.releaseAt){a.released=true;a.emit();}if((u>=1||a.type==='light'&&a.hit&&actionQueue&&u>.76)&&a.type!=='charge'&&a.type!=='guard'){if(a.type==='parry'&&keys.KeyF){action={type:'guard',t:0,duration:1};}else{action=null;attackCooldown=.05;if(actionQueue&&(!actionQueue.expires||actionQueue.expires>=elapsed)){let q=actionQueue;actionQueue=null;attackCooldown=0;melee(!!q.heavy,0,q.modifiers);if(action){action.precise=!!q.precise;if(q.precise){recordMove('PERFECT LINK');actionText('PERFECT LINK');}}}}}}
else{locomotion=THREE.MathUtils.damp(locomotion,moving*(sprint?1.2:1),12,dt);if(moving){const angle=Math.atan2(dir.x,dir.z);turnLean=THREE.MathUtils.damp(turnLean,THREE.MathUtils.clamp(Math.sin(angle-player.root.rotation.y)*-.23,-.23,.23),10,dt);const turn=Math.atan2(Math.sin(angle-player.root.rotation.y),Math.cos(angle-player.root.rotation.y));player.root.rotation.y+=THREE.MathUtils.clamp(turn,-dt*9.5,dt*9.5);walkPhase+=dt*(sprint?1.35:1)}else walkPhase+=dt*.7;pose(player,walkPhase,locomotion);}

if(action){moveVelocity.set(0,0,0);if(moving&&action.type!=='dodge'&&action.type!=='fireDash')pos.addScaledVector(dir,speed*dt);}else{const desired=dir.clone().multiplyScalar(speed),change=desired.sub(moveVelocity),acceleration=!moving?65:moveVelocity.dot(dir)<0?60:42;change.clampLength(0,acceleration*dt);moveVelocity.add(change);pos.addScaledVector(moveVelocity,dt);}resolveWorld(pos);const r=Math.hypot(pos.x,pos.z);if(r>85){pos.x*=85/r;pos.z*=85/r;if(Math.random()<.01)notify('The ash beyond this realm is impassable.')}pos.y=.06;
if(ghostTime>0&&Math.random()<.5)burst(pos.clone().add(new THREE.Vector3(0,1.2,0)),0x7bdac1,3,2,.7);
if(lockTarget&&!lockTarget.dead&&!action){let d=tmp.subVectors(lockTarget.root.position,pos);player.root.rotation.y=angleLerp(player.root.rotation.y,Math.atan2(d.x,d.z),Math.min(dt*8,1));}
player.recoil=Math.max(0,(player.recoil||0)-dt*1.8);const distance=options.cameraDistance+(action?.type==='aerial'?.7:0);const targetFov=options.fov+(options.motion?(sprint&&moving?5:action?.type==='charge'?-5:0):0);camera.fov=THREE.MathUtils.damp(camera.fov,targetFov,4,dt);camera.updateProjectionMatrix();const shoulder=new THREE.Vector3(Math.cos(yaw)*.95,0,-Math.sin(yaw)*.95),look=pos.clone().add(new THREE.Vector3(0,1.75+pitch*.2,0)).add(shoulder);const elevation=pitch+.17,offset=new THREE.Vector3(Math.sin(yaw)*distance*Math.cos(elevation),Math.sin(elevation)*distance,Math.cos(yaw)*distance*Math.cos(elevation));const target=safeCamera(look,look.clone().add(offset),obstacles);camera.position.lerp(target,1-Math.exp(-dt*9));safeCamera(look,camera.position,obstacles);camera.lookAt(look);}
function timeScaleAt(pos){return zones.some(z=>z.type==='rift'&&flatDistance(z.mesh.position,pos)<z.radius)?.28:1;}
function updateEnemies(dt){encounter.update(enemies,player,dt);for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.motionPassive=gameMode==='training'&&!trainingAI;if(finisher?.enemy===e)continue;if(gameMode==='training'&&!trainingAI&&!e.dead&&!e.physicalBody&&!e.rise){e.stagger=Math.max(e.stagger,.2);}if(e.dead){e.deathTime+=dt;if(!stepBody(e,dt,obstacles)){poseDeath(e);e.root.position.y=Math.max(-1.4,.06-Math.max(0,e.deathTime-1.05)*.55);}if(e.deathTime>8){removeTransientRig(e);enemies.splice(i,1)}continue}if(e.burn>0){e.burn-=dt;e.burnTick-=dt;if(e.burnTick<=0){e.burnTick=.6;e.hp-=3;burst(e.root.position.clone().add(new THREE.Vector3(0,1.2,0)),0xff6e2a,8,2,.5);if(e.hp<=0){killEnemy(e);continue}}}if(e.downed>0){e.downed=Math.max(0,e.downed-dt);stepBody(e,dt,obstacles);e.bar.visible=false;if(e.downed<=0){beginRecovery(e);clearBody(e);}continue;}if(e.rise){recoverMotion(e,dt);e.stagger=Math.max(e.stagger,.2);continue;}let ed=dt*timeScaleAt(e.root.position);e.snared=Math.max(0,(e.snared||0)-dt);e.soulAnchor=Math.max(0,(e.soulAnchor||0)-dt);e.flash=Math.max(0,e.flash-dt);e.broken=Math.max(0,(e.broken||0)-dt);e.poise=Math.max(0,(e.poise||0)-dt*4);e.lastKnock=Math.max(0,(e.lastKnock||0)-dt*9);e.lastLaunch=Math.max(0,(e.lastLaunch||0)-dt*9);e.recoil=Math.max(0,(e.recoil||0)-dt*1.7);e.stagger=Math.max(0,e.stagger-ed);e.phase+=ed;const pos=e.root.position,delta=new THREE.Vector3().subVectors(player.root.position,pos);delta.y=0;let dist=delta.length();delta.normalize();const angle=Math.atan2(delta.x,delta.z);if((!e.boss||!e.bossMove||e.bossMove.stage==='windup'&&e.bossMove.t<e.bossMove.duration*.72)&&e.state!=='strike'&&(e.state!=='windup'||e.timer>.28))e.root.rotation.y=angleLerp(e.root.rotation.y,angle,Math.min(ed*5,1));e.guardActive=!!(e.elite&&!e.boss&&!e.broken&&e.guardMeter>0&&e.state==='chase'&&dist<6&&e.stagger<=0);if(e.guardMax&&e.state==='recover')e.guardMeter=Math.min(e.guardMax,e.guardMeter+dt*10);stepMomentum(e,ed,obstacles,speed=>{e.stagger=Math.max(e.stagger,.7);damageEnemy(e,Math.min(24,speed*1.6),0);if(!e.boss&&!e.dead&&!e.physicalBody){startBody(e,e.kb.clone().setY(2));e.downed=.85;e.stagger=1.4;}actionText('WALL CRUSH');ring(e.root.position,0xc7ac88,1.5,.3);});if(e.dead)continue;
if(e.tk>0){e.tk-=dt;const target=e.tkHeight||2.7;e.vy+=((target-pos.y)*52-e.vy*12)*dt;pos.y=Math.max(.06,pos.y+e.vy*dt);e.airborne=true;e.stagger=Math.max(e.stagger,.5);if(e.tk<=0){e.vy=-17;e.slamPower=e.tkForce||48;}}else if(e.airHold>0){e.airHold-=dt;e.airHoldY=e.airHoldY||Math.max(1.2,pos.y);e.vy+=((e.airHoldY-pos.y)*30-e.vy*10)*dt;pos.y=Math.max(.06,pos.y+e.vy*dt);e.stagger=Math.max(e.stagger,.5);}else if(e.airborne||pos.y>.08){e.airHoldY=0;e.vy-=ed*23;pos.y+=ed*e.vy;if(pos.y<=.06){const speed=Math.abs(e.vy);pos.y=.06;e.airborne=false;e.vy=0;e.juggles=0;e.enemySteps=0;e.landTime=.38;e.landStrength=THREE.MathUtils.clamp(speed/16,.35,1);e.stagger=Math.max(e.stagger,.3);ring(pos,0xac9278,1.4+speed*.06,.35);if(e.slamPower){impactWorld.strike(pos,1.3);const force=e.slamPower;e.slamPower=0;damageEnemy(e,force,0);for(const o of enemies)if(o!==e&&!o.dead&&flatDistance(pos,o.root.position)<2.8)damageEnemy(o,Math.min(24,force*.35),6,2,pos);shake=Math.max(shake,.25);tone(52,.22,'sawtooth',.1,20);actionText('GROUND CRUSH');}}}if(e.dead)continue;
if(e.boss){updateBoss(e,ed,delta,dist);continue;}let moving=0;const attackSpeed=(1+Math.min(wave*.035,.4))*(e.small?1.45:e.stalker?1.3:1);if(e.stagger<=0&&!finisher){if(e.state==='chase'){e.timer-=ed;if(!encounter.mayAttack(e)&&dist<(e.caster?18:8)){const orbit=encounter.orbit(e,player);moving=orbit.length();pos.addScaledVector(orbit,e.speed*ed*.68*(e.snared>0?.05:1));}else if(dist>(e.caster?13:e.small?1.55:2.15)){moving=1;const step=delta.clone();if((e.stalker||e.small)&&dist>3&&dist<12){const flank=new THREE.Vector3(delta.z,0,-delta.x).multiplyScalar(Math.sin(e.phase*.7)>0?.5:-.5);step.add(flank).normalize();}pos.addScaledVector(step,e.speed*ed*(e.snared>0?.05:1))}else if(e.caster&&dist<6){moving=1;pos.addScaledVector(delta,-e.speed*ed)}else if(e.timer<=0&&encounter.mayAttack(e)){e.state='windup';e.attackVariant=(e.attackVariant||0)+1;e.timer=e.small?.60:e.elite?.95:.82;e.windupDuration=e.timer;e.attackDone=false;if(e.small)tone(390,.27,'sawtooth',.035,65);else tone(100,.14,'triangle',.015,120)}}else if(e.state==='windup'){e.timer-=ed*attackSpeed;if(e.timer<0){e.state='strike';e.timer=.32;e.strikeDir=new THREE.Vector3(Math.sin(e.root.rotation.y),0,Math.cos(e.root.rotation.y));}}else if(e.state==='strike'){e.timer-=ed;if(!e.caster)pos.addScaledVector(e.strikeDir,ed*5.5);if(e.timer<.18&&!e.attackDone){e.attackDone=true;if(e.caster){const from=pos.clone().add(new THREE.Vector3(0,1.6,0)),toward=player.root.position.clone().add(new THREE.Vector3(0,1.6,0)).sub(from).normalize();projectile(from,toward,0xb1a0da,15,10,'player','hex');}else if(flatDistance(pos,player.root.position)<(e.small?2.05:2.9)&&e.strikeDir.dot(player.root.position.clone().sub(pos).setY(0).normalize())>.25)hurt(e.small?9:e.elite?22:12,false,pos);slash(pos.clone().add(new THREE.Vector3(0,e.small?.8:1.5,0)),e.root.rotation.y,false,0x988d77)}if(e.timer<=0){e.state='recover';e.timer=e.small?.65:e.elite?.85:1.2;e.recoverDuration=e.timer}}else{e.timer-=ed;if(e.timer<=0){e.state='chase';e.timer=.2}}}else if(e.stagger>0){e.state='chase';e.timer=.6}
for(let j=0;j<i;j++){let o=enemies[j];if(o.dead)continue;let sep=tmp.subVectors(pos,o.root.position);sep.y=0;let dd=sep.length();if(dd<1.15&&dd>.01)pos.addScaledVector(sep.normalize(),ed*(1.15-dd)*3)}
resolveWorld(pos);const separation=tmp.subVectors(pos,player.root.position).setY(0);const sepLen=separation.length();const bodySpace=e.small?1.15:1.65;if(sepLen<bodySpace&&sepLen>.001&&pos.y<1&&!finisher){pos.addScaledVector(separation.normalize(),bodySpace-sepLen);}pose(e,e.phase,moving*(e.stalker?1.3:.9));if(e.caster){e.rig.position.y=.12+Math.sin(elapsed*2+e.phase)*.08;e.legs.forEach(l=>l.rotation.x=.12);}if(e.stalker){e.torso.rotation.x+=.24;if(e.state==='windup'&&e.timer>.35){const side=e.phase%2>1?1:-1;pos.addScaledVector(new THREE.Vector3(delta.z,0,-delta.x),side*ed*1.7);e.torso.rotation.z=side*.16;}}if(e.stagger>0){e.torso.rotation.x=.18;e.torso.rotation.z=.035;e.arms[0].rotation.z=-.4;e.arms[1].rotation.z=.4}poseEnemyAction(e);if(e.guardActive){e.arms[0].rotation.x=-1.15;e.forearms[0].rotation.x=-1.5;e.arms[1].rotation.x=-.9;e.forearms[1].rotation.x=-1.3;e.torso.rotation.y=-.3;}dynamicPose(e,ed);
if(e.broken>0){e.hips.position.y-=.23;e.torso.rotation.x=.48;e.head.rotation.x=.3;}e.bar.visible=e.hp<e.maxHp||e===lockTarget;e.bar.quaternion.copy(camera.quaternion).premultiply(e.root.quaternion.clone().invert());e.barFill.scale.x=.85*Math.max(0,e.hp/e.maxHp);e.barFill.position.x=-.425*(1-e.hp/e.maxHp);updateRendVisual(e);e.barFill.material.color.set(e.rend>=3?0xe59b56:e.guardActive?0xaac5df:e.soulAnchor>0?0x8fe2c5:e.hp/e.maxHp<=.6?0xefba72:0x986b4a);e.poiseFill.scale.x=.85*Math.min(1,(e.poise||0)/(e.boss?220:e.elite?115:65));e.poiseFill.position.x=-.425+e.poiseFill.scale.x/2;e.telegraph.position.set(pos.x,.09,pos.z);e.telegraph.visible=e.state==='windup'||e===lockTarget;e.telegraph.material.opacity=e===lockTarget?.85:.35+Math.sin(elapsed*20)*.25;e.telegraph.scale.setScalar(e.state==='windup'?1+(1-e.timer)*1.5:1.1);e.telegraph.material.color.set(e===lockTarget?0xd4c398:0xff6c31);
}}
function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i],step=dt*(p.hostile?timeScaleAt(p.mesh.position):1);p.life-=step;if(p.target&&!p.target.dead){let d=p.target.root.position.clone().add(new THREE.Vector3(0,1.3,0)).sub(p.mesh.position).normalize();p.dir.lerp(d,Math.min(dt*6,1)).normalize()}const oldPos=p.mesh.position.clone();p.mesh.position.addScaledVector(p.dir,p.speed*step);p.mesh.lookAt(p.mesh.position.clone().add(p.dir));burst(p.mesh.position,p.color,p.kind==='wave'?4:2,1,.3);let hit=false;if(p.hostile){const center=player.root.position.clone().add(new THREE.Vector3(0,1.5,0));if(new THREE.Line3(oldPos,p.mesh.position).closestPointToPoint(center,true,new THREE.Vector3()).distanceTo(center)<.8){if(action?.type==='parry'&&action.t<.4){p.hostile=false;p.dir.copy(facing());p.damage=65;p.speed=25;p.life=2;const e=nearest(35);if(e)p.target=e;actionText('HEX REFLECTED');eclipseSystems?.styleHit('reflect',20);ring(player.root.position,0xb5c9d8,3,.4);tone(640,.18,'triangle',.12,160);}else{hurt(p.damage,false,oldPos);hit=true;burst(p.mesh.position,p.color,18,4)}}}else for(const e of enemies)if(!e.dead&&new THREE.Line3(oldPos,p.mesh.position).closestPointToPoint(e.root.position.clone().add(new THREE.Vector3(0,1.3,0)),true,new THREE.Vector3()).distanceTo(e.root.position.clone().add(new THREE.Vector3(0,1.3,0)))<(p.kind==='wave'?1.8:1.25)){damageEnemy(e,p.damage,p.kind==='wave'?9:6,p.kind==='wave'&&!e.boss?2:0,null,p.color===colors.fire?'fire':p.color===colors.ghost?'ghost':null);if(p.color===colors.fire){e.burn=3;e.burnTick=.6;}burst(p.mesh.position,p.color,30,6,.6);ring(e.root.position,p.color,2.5,.3);shake=.12;hit=true;tone(80,.16,'sawtooth',.07,20);if(p.kind==='bolt')enemies.forEach(o=>{if(o!==e&&!o.dead&&flatDistance(o.root.position,e.root.position)<3)damageEnemy(o,15,3)});break}if(p.life<=0||hit){p.mesh.traverse(o=>{if(o.isMesh)o.material.dispose()});scene.remove(p.mesh);projectiles.splice(i,1)}}}
function updateZones(dt){for(let i=zones.length-1;i>=0;i--){let z=zones[i];z.t+=dt;z.tick-=dt;if(z.type==='mine'){if(z.t>.45&&enemies.some(e=>!e.dead&&flatDistance(e.root.position,z.mesh.position)<z.radius*.65)){hitArea(z.mesh.position,z.radius,72*z.power,10,7,'fire');ring(z.mesh.position,colors.fire,z.radius,.5);z.t=z.duration;}z.mesh.rotation.y+=dt*2;}else if(z.type==='meteor'){z.mesh.position.lerpVectors(z.target.clone().add(new THREE.Vector3(5,19,-2)),z.target.clone().add(new THREE.Vector3(0,.5,0)),Math.pow(Math.min(1,z.t/z.duration),1.5));z.mesh.rotation.x+=dt*3;z.mesh.rotation.z+=dt*2;burst(z.mesh.position,0xff6d22,7,3,.7);if(z.t>=z.duration){hitArea(z.target,z.radius,105*(z.power||1),14*(z.power||1),7);burst(z.target,0xff7b2e,150,14,1.2);ring(z.target,0xff954b,8,.8);shake=.7;tone(40,.6,'sawtooth',.18,12)}}else{z.mesh.rotation.y+=dt*(z.type==='vortex'?3.5:1.4);z.mesh.children.forEach((c,j)=>{c.rotation.z+=dt*(j%2?1:-1);if(c.material.transparent)c.material.opacity=.4+Math.sin(z.t*4+j)*.15});if(z.type==='vortex'||z.type==='gravity'){for(let e of enemies){if(e.dead||finisher?.enemy===e)continue;let d=new THREE.Vector3().subVectors(z.mesh.position,e.root.position);d.y=0;const l=d.length();if(l<z.radius+2){d.normalize();const pull=(z.type==='gravity'?17:11)*(z.power||1)/massOf(e);e.kb.addScaledVector(d,dt*pull);if(z.type==='vortex')e.kb.addScaledVector(new THREE.Vector3(d.z,0,-d.x),dt*8/massOf(e));e.kb.clampLength(0,9);if(z.tick<=0){damageEnemy(e,(z.type==='gravity'?9:13)*(z.power||1),0,0,null,z.type==='gravity'?'mind':'fire');if(z.type==='gravity')e.stagger=.6}}}const a=z.t*9;burst(z.mesh.position.clone().add(new THREE.Vector3(Math.sin(a)*z.radius*.7,1+Math.sin(z.t*6),Math.cos(a)*z.radius*.7)),z.color,4,3,.8)}if(z.tick<=0)z.tick=.6;}
if(z.t>=z.duration){scene.remove(z.mesh);if(z.type!=='meteor')z.mesh.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});else z.mesh.geometry.dispose();zones.splice(i,1)}}}
function updateSummons(dt){for(let i=summons.length-1;i>=0;i--){const s=summons[i];s.life-=dt;s.timer-=dt;s.phase+=dt;s.spectral=true;const e=enemies.filter(e=>!e.dead&&finisher?.enemy!==e).sort((a,b)=>flatDistance(a.root.position,s.root.position)-flatDistance(b.root.position,s.root.position))[0];let moving=0;
if(e){const dir=e.root.position.clone().sub(s.root.position).setY(0),d=dir.length();dir.normalize();s.root.rotation.y=angleLerp(s.root.rotation.y,Math.atan2(dir.x,dir.z),Math.min(1,dt*12));if(d>2.2&&!s.attackMotion){s.root.position.addScaledVector(dir,dt*8);moving=1;}else if(s.timer<=0&&!s.attackMotion){s.timer=.85;s.attackMotion={type:'light',t:0,duration:.56,step:(s.attackStep||0)%2+1,target:e,hit:false};s.attackStep=(s.attackStep||0)+1;}}
if(s.attackMotion){const a=s.attackMotion;a.t+=dt;if(!a.hit&&a.t/a.duration>=impactAt(a)){a.hit=true;if(!a.target.dead&&flatDistance(a.target.root.position,s.root.position)<3.5){damageEnemy(a.target,18*(s.power||1),2,0,null,'ghost');slash(s.root.position.clone().add(new THREE.Vector3(0,1.4,0)),s.root.rotation.y,false,0x8ad3bd);}}if(a.t>=a.duration)s.attackMotion=null;}
pose(s,s.phase,moving,s.attackMotion);s.root.position.y=.2+Math.sin(s.phase*3)*.12;s.root.traverse(o=>{if(o.isMesh&&o.material.transparent)o.material.opacity=.27*Math.min(1,s.life/1.1);});if(Math.random()<.3)burst(s.root.position,0x86c5b1,2,1,.6);if(s.life<=0){burst(s.root.position,0x86c5b1,30,4,.8);removeTransientRig(s);summons.splice(i,1)}}}
function updateEffects(dt){const corpses=enemies.filter(e=>e.dead&&e!==finisher?.enemy);while(corpses.length>12){const e=corpses.shift();removeTransientRig(e);enemies.splice(enemies.indexOf(e),1);}impactWorld.update(dt);gore.update(dt);for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.t+=dt;const u=e.t/e.duration;if(e.kind==='ring')e.mesh.scale.setScalar(.2+e.radius*Math.pow(Math.min(u,1),.6));if(e.kind==='slash')e.mesh.rotation.y+=dt*2;e.mesh.traverse(o=>{if(o.material)o.material.opacity=Math.max(0,1-u)*(e.kind==='beam'?.7:1)});if(u>=1){disposeEffect(e.mesh);effects.splice(i,1)}}for(let i=0;i<maxParticles;i++){const p=particles[i];if(p.life>0){p.life-=dt;p.v.y-=dt*p.gravity;p.p.addScaledVector(p.v,dt);dummy.position.copy(p.p);dummy.rotation.set(p.life*2,p.life*3,0);dummy.scale.setScalar(p.size*Math.max(0,p.life/p.max));particleMesh.setColorAt(i,p.color)}else dummy.scale.setScalar(0);dummy.updateMatrix();particleMesh.setMatrixAt(i,dummy.matrix)}particleMesh.instanceMatrix.needsUpdate=true;if(particleMesh.instanceColor)particleMesh.instanceColor.needsUpdate=true;}
function updateCombatHUD(){
 const pp=player.root.position;
 const d=districts.reduce((a,b)=>Math.hypot(pp.x-b.x,pp.z-b.z)<Math.hypot(pp.x-a.x,pp.z-a.z)?b:a);
 if(currentDistrict!==d.name){if(currentDistrict)notify('DISCOVERED · '+d.name.toUpperCase());currentDistrict=d.name;}
 $('districtName').textContent=d.name;
 const bearing=((yaw*180/Math.PI)%360+360)%360;
 $('bearing').textContent=['N','NW','W','SW','S','SE','E','NE'][Math.round(bearing/45)%8]+'  /  '+Math.round(Math.abs(pp.x)).toString().padStart(2,'0')+' · '+Math.round(Math.abs(pp.z)).toString().padStart(2,'0');
 const focus=lockTarget&&!lockTarget.dead?lockTarget:nearest(6);$('targetReadout').classList.toggle('hidden',!focus||!!finisher);if(focus){$('targetReadout').textContent=focus.kind+'  /  '+(focus.broken>0?'WILL BROKEN':focus.rend>=3?'REND READY · HEAVY TO RUPTURE':'REND '+('◆'.repeat(focus.rend||0)+'◇'.repeat(3-(focus.rend||0))));$('targetReadout').classList.toggle('ready',focus.rend>=3);}
 const hints=[];
 if(heavyHeld&&action?.type==='charge')hints.push('RELEASE RMB · '+(action.t>.95?'WORLD BREAKER':'CHARGED STRIKE'));
 else if(nearest(7)?.airborne)hints.push('LMB  JUGGLE   /   RMB  DIVING SLAM');
 else if(dodgeLink>0)hints.push('LMB  RIFT TALON');
 else if(comboStep===2&&elapsed-lastAttack<1.35)hints.push('RMB  REAPING CIRCLE');
 else if(comboStep===3&&elapsed-lastAttack<1.35)hints.push('RMB  JUDGEMENT HEEL');
 else if(elapsed-lastMeleeHit<.8)hints.push('Q  SPELLWEAVE · 25% LESS WRATH');
 const shrine=shrines.find(s=>Math.hypot(s.x-pp.x,s.z-pp.z)<4&&s.usedWave!==wave);
 if(shrine)hints.push('G  COMMUNE · RESTORE VITALITY');
 $('combatContext').textContent=hints.join('    /    ');
 $('chargeMeter').classList.toggle('hidden',action?.type!=='charge');
 $('chargeFill').style.width=(action?.type==='charge'?Math.min(100,action.t/1.2*100):0)+'%';
 $('imbuement').textContent=weaveTime>0?`${weaveSchool==='fire'?'CINDER CLAWS':weaveSchool==='mind'?'MINDREND CLAWS':'SOULDRINK CLAWS'}  ·  ${weaveTime.toFixed(1)}s`:riposte>0?'RIPOSTE READY':'';
 $('imbuement').style.color=weaveTime>0?cssColors[weaveSchool]:'#d8c197';
 $('styleCount').textContent=styleVariety.size>1?`${styleVariety.size} UNIQUE TECHNIQUES`:'';
}

function updateHUD(){$('gaitReadout').textContent=(walkToggle?'PROWL':'RUN')+' · L TO SWITCH / SHIFT TO SPRINT';updateCombatHUD();updateNewHUD();const live=enemies.filter(e=>!e.dead);$('healthFill').style.width=(health/runMods.maxHealth*100)+'%';$('healthText').textContent=`${Math.ceil(health)} / ${runMods.maxHealth}`;$('energyFill').style.width=energy+'%';$('energyText').textContent=`${Math.floor(energy)} WRATH`;$('score').textContent=String(score).padStart(4,'0');$('enemiesLeft').textContent=live.length;$('combo').style.opacity=comboTime>0&&combo>1?'1':'0';$('comboNum').textContent=combo;$('comboStyle').textContent=combo>30?'APOCALYPTIC':combo>20?'DIABOLICAL':combo>10?'RELENTLESS':'SAVAGE';$('comboFill').style.width=(comboTime/4.5*100)+'%';$('powerCooldown').textContent=cooldowns[selected]>0?Math.ceil(cooldowns[selected]):'';$('powerIcon').style.opacity=cooldowns[selected]>0?.35:1;const readyTarget=live.filter(e=>executionReady(e)&&flatDistance(e.root.position,player.root.position)<5.5).sort((a,b)=>a.hp-b.hp)[0];$('finisherName').textContent=nextExecution(false,!!readyTarget?.boss,!!readyTarget?.small).name;$('finisherHint').textContent=options.finisher==='auto'?'E · EXECUTE / V · VIEW ALL 49':'E · EXECUTE / V · CHANGE FINISHER';const canFinish=executeCooldown<=0&&live.some(e=>executionReady(e)&&flatDistance(e.root.position,player.root.position)<5.5);const chainUp=chainWindow>0&&chainTarget&&!chainTarget.dead&&!finisher;if(chainUp)$('finisherName').textContent='CHAIN · '+chainTarget.kind;$('finisherPrompt').classList.toggle('hidden',!(canFinish||chainUp)||!!finisher);$('lockLabel').classList.toggle('hidden',!lockTarget||lockTarget.dead);if(lockTarget&&!lockTarget.dead)$('lockLabel').textContent=lockTarget.kind+' · '+(lockTarget.downed>0?'DOWNED · HEAVY TO STOMP':Math.ceil(lockTarget.hp)+' VITALITY');}
// REQUIEM systems: run blessings, elemental reactions, Ascension, bosses and cartography.
const floatingHits=[];
function showDamage(e,amount,school){
 if(finisher||amount<5)return;
 if(floatingHits.length>=22){floatingHits.shift().el.remove();}
 const el=document.createElement('span');el.className='damage-number';el.textContent=Math.round(amount);el.style.color=school?cssColors[school]:'#e0c8a3';$('hud').append(el);
 floatingHits.push({el,p:e.root.position.clone().add(new THREE.Vector3((Math.random()-.5)*.55,2.5,0)),t:0,large:amount>=60});
}
function updateDamageNumbers(dt){
 for(let i=floatingHits.length-1;i>=0;i--){const f=floatingHits[i];f.t+=dt;const p=f.p.clone();p.y+=f.t*.65;p.project(camera);f.el.style.display=p.z>1||finisher?'none':'';f.el.style.transform=`translate(${(p.x*.5+.5)*innerWidth}px,${(-p.y*.5+.5)*innerHeight}px) translate(-50%,-50%) scale(${(f.large?1.3:1)*(1+Math.max(0,.12-f.t)*2)})`;f.el.style.opacity=Math.max(0,1-f.t/.78);if(f.t>.78){f.el.remove();floatingHits.splice(i,1);}}
}

const boonDefinitions=[
 {id:'fury',name:'The First Sin',school:'fire',tag:'VIOLENCE',desc:'All melee attacks, powers, and revenants deal 15% more base damage.',apply:()=>runMods.damage+=.15},
 {id:'heart',name:'Heart of the Pit',school:'fire',tag:'SURVIVAL',desc:'Gain 25 maximum vitality and immediately recover 35 vitality.',apply:()=>{runMods.maxHealth+=25;health=Math.min(runMods.maxHealth,health+35)}},
 {id:'well',name:'Endless Malice',school:'mind',tag:'SORCERY',desc:'Wrath regenerates 35% faster. Keep the forbidden arsenal flowing.',apply:()=>runMods.regen+=.35},
 {id:'stride',name:'The Unburied',school:'ghost',tag:'MOBILITY',desc:'Movement and sprinting become 12% faster. Outrun the hunt.',apply:()=>runMods.speed+=.12},
 {id:'life',name:'A Thirst Eternal',school:'ghost',tag:'SUSTAIN',desc:'Each soul you claim restores 4 additional vitality.',apply:()=>runMods.life+=4},
 {id:'reach',name:'Hands of Ruin',school:'mind',tag:'CONTROL',desc:'All melee attacks reach 15% farther. Command the space around you.',apply:()=>runMods.reach+=.15},
 {id:'curse',name:'Lasting Damnation',school:'mind',tag:'SPELLWEAVING',desc:'Your elemental claw imbuements last 50% longer after every cast.',apply:()=>runMods.duration+=.5},
 {id:'harvest',name:'The Tithe',school:'ghost',tag:'DOMINION',desc:'Earn 30% more kill score and immediately fill 35% of Ascension.',apply:()=>{runMods.souls+=.3;ascendCharge=Math.min(100,ascendCharge+35)}}
];
let boonChoices=[];
function resetRunSystems(){
 eclipseSystems?.reset();tetherCooldown=0;tetherLine.visible=false;locomotion=turnLean=0;moveVelocity.set(0,0,0);walkToggle=false;effects.forEach(e=>disposeEffect(e.mesh));effects.length=0;particles.forEach(p=>p.life=0);handHistory.fill(null);
 floatingHits.forEach(f=>f.el.remove());floatingHits.length=0;runMods={damage:1,maxHealth:100,regen:1,speed:1,life:0,duration:1,reach:1,souls:1};acquired=[];ascendCharge=ascendTime=0;upgradeOpen=false;intermission=-1;waypoint=null;panelOpen=null;
 ['boonScreen','realmMap','settingsPanel','finisherGrimoire','bossHUD'].forEach(id=>$(id).classList.add('hidden'));
}
function openBoons(){
 if(mode!=='game')return;upgradeOpen=true;paused=true;heavyHeld=false;action=null;Object.keys(keys).forEach(k=>keys[k]=false);document.exitPointerLock?.();$('waveBanner').classList.remove('show');
 boonChoices=[...boonDefinitions].sort(()=>rand()-.5).slice(0,3);$('boonWave').textContent=`WAVE ${String(wave).padStart(2,'0')} CLEARED · ${kills} SOULS CLAIMED · +${eclipseSystems?.snapshot().masteryBonus||0} STYLE BONUS`;
 $('boonCards').innerHTML=boonChoices.map((b,i)=>`<button class="boon-card" data-boon="${i}"><small>${b.tag}</small><span class="boon-index">0${i+1}</span><div class="boon-symbol">${icon(b.school,b.school==='fire'?0:b.school==='mind'?7:12)}</div><h3>${b.name}</h3><p>${b.desc}</p><footer><span>CLAIM BLESSING</span><span>↗</span></footer></button>`).join('');
 $('boonCards').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>chooseBoon(i));$('boonScreen').classList.remove('hidden');tone(155,.8,'sine',.12,55);
}
function chooseBoon(index){
 if(!upgradeOpen||!boonChoices[index])return;const b=boonChoices[index];b.apply();acquired.push(b.name);upgradeOpen=false;paused=false;intermission=-1;waveDelay=2.3;$('boonScreen').classList.add('hidden');banner(b.name.toUpperCase(),'The pact is sealed. Your next hunt awaits.');tone(290,.45,'triangle',.08,95);tryLock();
}
function executionReady(e){return e.boss?e.hp<=e.maxHp*.2:(e.hp<=e.maxHp*.6||e.broken>0)}
function ascend(){
 if(mode!=='game'||paused||finisher||wheelOpen)return;if(ascendTime>0)return;if(ascendCharge<100){notify('Fill Ascension through damage, kills, and executions');return;}
 cancelUnreleasedCast();ascendCharge=0;ascendTime=9;invuln=1.2;energy=100;action={type:'ascend',t:0,duration:1.1,releaseAt:.42,released:false};heavyHeld=false;action.emit=()=>{hitArea(player.root.position,6,35,9,0,'fire');ring(player.root.position,0xffa259,10,1);ring(player.root.position,0xbd9bff,7,.75);burst(player.root.position.clone().add(new THREE.Vector3(0,1.5,0)),0xffad6c,110,9,1);};actionText('ASCENSION · LET HEAVEN TREMBLE');recordMove('ASCENSION');tone(38,1.2,'sawtooth',.15,18);
}
function reactElements(e,amount,school){
 if(!school||(e.reactAt||0)>elapsed||e.dead)return amount;
 if(school==='mind'&&e.burn>0){
  e.reactAt=elapsed+1.8;e.burn=0;amount+=18;ring(e.root.position,0xb397ee,3.8,.55);burst(e.root.position.clone().add(new THREE.Vector3(0,1.4,0)),0xf6976c,38,6,.8);
  actionText('CONFLUENCE · PYROKINETIC RUPTURE');recordMove('PYROKINETIC RUPTURE');
  for(const other of enemies)if(other!==e&&!other.dead&&flatDistance(other.root.position,e.root.position)<3.8)damageEnemy(other,12,5,0,e.root.position);
 }else if(school==='ghost'&&e.broken>0){e.reactAt=elapsed+2;health=Math.min(runMods.maxHealth,health+9);energy=Math.min(100,energy+9);amount+=12;beam(e.root.position.clone().add(new THREE.Vector3(0,1.6,0)),player.root.position.clone().add(new THREE.Vector3(0,1.8,0)),0x8be0c2,.045,.45);actionText('CONFLUENCE · SOUL ECHO');recordMove('SOUL ECHO');}
 else if(school==='fire'&&slowTime>0){e.reactAt=elapsed+2;amount*=1.35;burst(e.root.position.clone().add(new THREE.Vector3(0,1.5,0)),0xc6acf9,25,5,.7);actionText('CONFLUENCE · TEMPORAL FRACTURE');recordMove('TEMPORAL FRACTURE');}
 return amount;
}
function buildKindKit(e){
 if(e.spectral)return;let n=0;
 const eye=new THREE.MeshBasicMaterial({color:0xff5a26}),scar=new THREE.MeshBasicMaterial({color:0xd9481f}),glowDot=new THREE.MeshBasicMaterial({color:0xffb066});
 for(const side of [-1,1]){orb(e.head,eye,side*.12,.16,.1,.05,.05,.05);n++;}
 box(e.torso,scar,.11,.1,.30,.02,.5,.02);box(e.torso,scar,-.09,.05,.30,.02,.34,.02);n+=2;
 if(e.elite||e.boss){for(const side of [-1,1]){box(e.arms[side>0?1:0],metal,0,.12,0,.34,.2,.34);horn(e.head,[[side*.14,.1,0],[side*.42,.44,.06]],.09,hornObsidian);n+=2;}box(e.hips,metal,0,-.5,.3,.5,.7,.05);n++;horn(e.spine,[[.1,.2,-.25],[.28,1.15,-.4]],.06,metal);n++;}
 else if(e.caster){const halo=mesh(new THREE.TorusGeometry(.42,.02,4,36),new THREE.MeshBasicMaterial({color:0xb08cf2}),e.head,0,.34,-.22);n++;for(const side of [-1,1]){orb(e.torso,glowDot,side*.5,.2,.05,.07,.07,.07);n++;box(e.hips,mat('#28252f',.95),side*.22,-.85,.14,.1,.9,.05);n++;}halo.rotation.x=.12;}
 else if(e.stalker){mesh(new THREE.ConeGeometry(.6,.9,18,4,true),mat('#33262b',.95),e.head,0,.28,.05);n++;horn(e.head,[[0,.3,.1],[0,.75,.35]],.08,hornObsidian);n++;for(const side of [-1,1]){box(e.hips,mat('#2a2226',.95),side*.16,-1.0,.16,.16,.8,.04);n++;}}
 else{horn(e.spine,[[0,.2,-.22],[0,.45,-.5]],.09,hornObsidian);n++;for(const side of [-1,1]){horn(e.arms[side>0?1:0],[[0,.18,-.05],[0,.5,-.25]],.08,hornObsidian);n++;}}
 if(e.boss){const crown=mesh(new THREE.TorusGeometry(.3,.045,4,24),goldGlow,e.head,0,.42,0);crown.rotation.x=.5;n++;for(let i=0;i<5;i++){const a=(i-2)*.4;horn(e.head,[[Math.sin(a)*.26,.36,Math.cos(a)*.22],[Math.sin(a)*.34,.85,Math.cos(a)*.3]],.07,goldGlow);n++;}for(const side of [-1,1]){horn(e.torso,[[side*.2,.3,-.28],[side*1.5,1.15,-.75]],.16,hornObsidian);n++;}const cape=mesh(new THREE.ConeGeometry(1.05,2.4,20,5,true),mat('#3a1f22',.95),e.hips,0,.1,-.35);cape.rotation.x=.32;n++;e.moltenCore=orb(e.torso,glowDot,0,.18,.34,.12,.12,.12);n++;}
 e.adornDetail=n;
}
function adornEnemy(e){
 e.kind=e.boss?'CINDER KING':e.elite?'ASHEN WARDEN':e.caster?'HOLLOW ORACLE':e.stalker?'CINDER STALKER':'REVENANT';
 if(e.boss){e.maxHp=e.hp=550+wave*65;e.root.scale.setScalar(1.65);e.speed=2.45;e.bossCounter=0;e.bossWait=2;e.bar.visible=false;e.bossName='VORATH, THE CINDER KING';e.caster=false;}
 if(e.stalker){e.hp=e.maxHp=Math.round(e.maxHp*.78);e.speed*=1.5;e.root.scale.set(.95,.91,.95);for(const arm of e.forearms){horn(arm,[[0,-.12,.1],[0,-.4,.36],[0,-.8,.55]],.075,hornObsidian);}}
 if(e.caster){const robe=mesh(new THREE.ConeGeometry(.68,1.7,24,6,true),mat('#28252f',.95),e.hips,0,-.4,-.04);robe.rotation.z=.06;const staff=cylinder(e.hands[0],obsidian,0,-.35,0,.035,.04,2.2,6);orb(e.hands[0],purpleGlow,0,.84,0,.11,.11,.11);}
 if(e.elite||e.boss){const hammer=new THREE.Group();e.hands[1].add(hammer);cylinder(hammer,metal,0,-.45,0,.07,.075,1.6,8);box(hammer,obsidian,0,-1.14,0,.85,.5,.48);box(hammer,e.boss?ember:goldGlow,0,-1.15,.25,.53,.035,.025);for(let side of [-1,1])horn(hammer,[[side*.3,-1.12,0],[side*.7,-1.18,0]],.15,hornObsidian);}
 buildKindKit(e);
}
function bossImpact(e,kind,position){
 const radius=kind==='leap'?5.5:7.3;ring(position,0xff7650,radius,.8);burst(position,0xff713d,90,10,1);if(flatDistance(position,player.root.position)<radius)hurt(kind==='leap'?32:27,true,position);if(flatDistance(position,player.root.position)<18)shake=.4;tone(43,.45,'sawtooth',.16,17);
}
function updateBoss(e,dt,dir,dist){
 const p=e.root.position;e.phase+=dt;pose(e,e.phase,0);e.bar.visible=false;e.telegraph.position.set(p.x,.1,p.z);e.telegraph.visible=false;
 if(e.hp/e.maxHp<.5&&!e.enraged){e.enraged=true;banner('THE KING REMEMBERS','His wrath quickens. Crimson attacks cannot be parried.');ring(p,0xff582e,10,1.1);e.bossWait=.7;if(e.moltenCore){e.moltenCore.material=new THREE.MeshBasicMaterial({color:0xff2f15});e.moltenCore.scale.setScalar(.22);}}
 updateRendVisual(e);e.rendTime=Math.max(0,(e.rendTime||0)-dt);if(!e.rendTime)e.rend=0;
 if(finisher||e.broken>0||gameMode==='training'&&!trainingAI){e.torso.rotation.x=.5;e.hips.position.y-=.2;e.bossMove=null;e.bossWait=.7;return;}
 let m=e.bossMove;
 if(!m){e.bossWait-=dt;const destination=player.root.position.clone().sub(p).setY(0).normalize();if(dist>3){p.addScaledVector(destination,dt*e.speed*(e.enraged?1.2:1));pose(e,e.phase,.8);}if(e.bossWait<=0){const order=e.bossCounter++%4,kind=order===0?(dist>8?'charge':'stomp'):order===1?'hex':order===2?'leap':'reap';e.bossMove={kind,stage:'windup',t:0,duration:(kind==='hex'?1.25:1.45)*(e.enraged?.8:1),start:p.clone(),target:player.root.position.clone().setY(.06),dir:destination.clone(),hit:false};}return;}
 m.t+=dt;
 if(m.stage==='windup'){
  if(m.t<m.duration*.72)m.dir.copy(dir);
  const u=Math.min(1,m.t/m.duration);e.arms[1].rotation.x=-2.6*u;e.forearms[1].rotation.x=-.4;e.torso.rotation.x=-.15*u;e.hips.position.y-=.15*u;
  e.telegraph.visible=true;e.telegraph.material.color.set(m.kind==='hex'?0xc0a1ef:m.kind==='reap'?0xffc06a:0xff4e39);e.telegraph.material.opacity=.4+Math.sin(elapsed*18)*.2;e.telegraph.scale.setScalar(m.kind==='leap'?7.8:m.kind==='stomp'?10.2:3.7);if(m.kind==='leap')e.telegraph.position.set(m.target.x,.12,m.target.z);
  if(m.t>=m.duration){m.stage='strike';m.t=0;if(m.kind==='hex'){const origin=p.clone().add(new THREE.Vector3(0,2.6,0)),d=player.root.position.clone().add(new THREE.Vector3(0,1.4,0)).sub(origin).normalize();const count=e.enraged?5:3;for(let i=0;i<count;i++)projectile(origin,d.clone().applyAxisAngle(vup,(i-(count-1)/2)*.13),0xc1a0ed,16,10,'player','hex');}}
 }else if(m.stage==='strike'){
  const u=Math.min(1,m.t/(m.kind==='reap'?1.15:.78));if(m.kind==='reap'){for(const threshold of (e.enraged?[.42,.83]:[.42])){m.sweepHits??=new Set();if(u>=threshold&&!m.sweepHits.has(threshold)){m.sweepHits.add(threshold);const toward=player.root.position.clone().sub(p).setY(0);if(toward.length()<5.2&&toward.normalize().dot(m.dir)>.15)hurt(e.enraged?22:26,false,p);slash(p.clone().add(new THREE.Vector3(0,1.7,0)),e.root.rotation.y,true,0xe9b47a);tone(55,.16,'sawtooth',.10,22);}}}if(m.kind==='stomp'&&u>=.37&&!m.hit){bossImpact(e,'stomp',p);m.hit=true;}e.arms[1].rotation.x=-2.5+3.2*u;e.torso.rotation.x=.55*Math.sin(u*Math.PI);e.hips.position.y-=.18*Math.sin(u*Math.PI);
  if(m.kind==='charge'){p.addScaledVector(m.dir,dt*15);if(dist<3.2&&!m.hit){m.hit=true;hurt(24);}burst(p,0xea7646,3,2,.5);}
  if(m.kind==='leap'){p.lerpVectors(m.start,m.target,u);p.y=.06+Math.sin(Math.PI*u)*5.5;e.legs[0].rotation.x=-.8;e.shins[1].rotation.x=1.2;e.telegraph.visible=true;e.telegraph.position.set(m.target.x,.12,m.target.z);if(u>=.99&&!m.hit){m.hit=true;p.y=.06;bossImpact(e,'leap',m.target);}}
  if(u>=1){m.stage='recover';m.t=0;p.y=.06;}
 }else{e.torso.rotation.x=.35*(1-Math.min(1,m.t/.9));if(m.t>(m.kind==='reap'?1.2:.95)){e.bossMove=null;e.bossWait=e.enraged?.55:1.1;}}
 poseBossMotion(e,m);resolveWorld(p);
}
function saveRecord(){if(!['survival','boss'].includes(gameMode))return;records.wave=Math.max(records.wave,wave);records.score=Math.max(records.score,score);records.runs++;try{localStorage.setItem('hellbound-records',JSON.stringify(records))}catch{}updateRecord();}
function updateRecord(){if(records.wave>0)$('recordSummary').textContent=`BEST WAVE ${String(records.wave).padStart(2,'0')}  /  ${records.score.toLocaleString()} SOUL SCORE`;}
function updateNewHUD(){
 const striking=action&&attackTypes.has(action.type);$('meleeTiming').classList.toggle('hidden',!striking&&!clinchTime&&action?.type!=='guard');if(striking){const u=action.t/action.duration,hit=impactAt(action),open=u>hit+.025&&u<hit+.22;$('meleeTiming').textContent=open?'LINK NOW · LIGHT / HEAVY':'COMMIT → CONTACT → LINK';$('meleeTiming').classList.toggle('link-open',open);}else $('meleeTiming').textContent=action?.type==='guard'?'GUARD · WRATH ABSORBS IMPACTS':'CLINCH · HEAVY FOR KNEE';

 const casting=action?.type==='cast';$('castReadout').classList.toggle('hidden',!casting);if(casting){$('castReadout').textContent=(action.overcast?'OVERCAST · ':'')+(action.released?'RECOVERY':'GATHERING WRATH');$('castReadout').style.setProperty('--cast-progress',Math.min(100,action.t/(action.duration*action.releaseAt)*100)+'%');}

 $('ascensionFill').style.width=(ascendTime>0?ascendTime/9*100:ascendCharge)+'%';$('ascensionText').textContent=ascendTime>0?ascendTime.toFixed(1)+'s':ascendCharge>=100?'READY':Math.floor(ascendCharge)+'%';$('ascensionHUD').classList.toggle('ready',ascendCharge>=100||ascendTime>0);$('boonCount').textContent=acquired.length?`${acquired.length} BLESSING${acquired.length===1?'':'S'} CLAIMED`:'NO BLESSINGS CLAIMED';
 const boss=enemies.find(e=>e.boss&&!e.dead);$('bossHUD').classList.toggle('hidden',!boss);if(boss){$('bossName').textContent=boss.bossName;$('bossFill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';$('bossPhase').textContent=boss.bossMove?.stage==='windup'?(boss.bossMove.kind==='hex'?'REFLECT THE HEXES':boss.bossMove.kind==='reap'?(boss.enraged?'AMBER DOUBLE SWEEP · PARRY / EVADE':'AMBER SWEEP · PARRY / EVADE'):'CRIMSON ATTACK · EVADE'):boss.bossMove?.stage==='recover'?'PUNISH WINDOW · +18% DAMAGE':boss.enraged?'PHASE II · UNQUENCHABLE':'KEEPER OF THE ASH';}
 if(waypoint){const d=Math.hypot(waypoint.x-player.root.position.x,waypoint.z-player.root.position.z);$('bearing').textContent=`${waypoint.name.toUpperCase()} · ${Math.round(d)}m`;if(d<4){notify('DESTINATION REACHED · '+waypoint.name);waypoint=null;}}
 drawCartography($('radar'),true);
}
function openPanel(name){if(upgradeOpen||finisher||panelOpen)return false;panelResume=!paused;panelOpen=name;paused=true;heavyHeld=false;if(action?.type==='charge')action=null;Object.keys(keys).forEach(k=>keys[k]=false);document.exitPointerLock?.();return true;}
function closePanel(){if(!panelOpen)return;$(panelOpen==='map'?'realmMap':panelOpen==='finishers'?'finisherGrimoire':'settingsPanel').classList.add('hidden');panelOpen=null;paused=!panelResume;if(!paused)tryLock();}
function openMap(){if(!openPanel('map'))return;$('realmMap').classList.remove('hidden');updateMapButtons();drawCartography($('mapCanvas'),false);}
function openSettings(){if(!openPanel('settings'))return;$('settingsPanel').classList.remove('hidden');$('qualitySelect').value=options.quality;$('sensitivitySlider').value=options.sensitivity;$('volumeSlider').value=options.volume;$('shakeToggle').checked=options.shake;$('flashToggle').checked=options.flashes;$('distanceSlider').value=options.cameraDistance;$('fovSlider').value=options.fov;$('motionToggle').checked=options.motion;$('cueToggle').checked=options.cues;$('goreToggle').checked=options.gore;$('executionCameraToggle').checked=options.executionCamera;}
function updateMapButtons(){
 $('districtButtons').innerHTML=districts.map((d,i)=>`<button data-district="${i}" class="${waypoint?.name===d.name?'marked':''}">${d.name}<small>${Math.round(Math.hypot(d.x-player.root.position.x,d.z-player.root.position.z))}m AWAY · ${i?'SOUL SHRINE':'CENTRAL COURT'}</small></button>`).join('');
 $('districtButtons').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{waypoint={...districts[i]};updateMapButtons();drawCartography($('mapCanvas'),false);tone(230,.1,'triangle',.035,130)});
}
function drawCartography(canvas,mini){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,scale=mini?3.05:3.55,px=mini?player.root.position.x:0,pz=mini?player.root.position.z:6;
 const point=(x,z)=>[cx+(x-px)*scale,cy+(z-pz)*scale];c.clearRect(0,0,w,h);c.save();if(mini){c.beginPath();c.arc(cx,cy,cx-5,0,TAU);c.clip();}
 c.fillStyle=mini?'#0c1917b8':'#10201b99';c.fillRect(0,0,w,h);c.strokeStyle='#b8c3990d';c.lineWidth=1;
 for(let v=-120;v<140;v+=10){let a=point(v,-130),b=point(v,130);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();a=point(-130,v);b=point(130,v);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
 if(!mini){for(let i=0;i<15;i++){c.beginPath();for(let j=0;j<=110;j++){const a=j/110*TAU,r=(82+i*2.2)+Math.sin(a*7+i*.4)*3+Math.cos(a*11)*2,[x,y]=point(Math.sin(a)*r,Math.cos(a)*r);j?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#9cad7a12';c.stroke();}c.font='10px Inter,Arial';c.fillStyle='#8d9b7870';c.textAlign='center';c.fillText('N',cx,35);c.fillText('S',cx,h-31);c.fillText('W',30,cy);c.fillText('E',w-30,cy);}
 for(let i=1;i<districts.length;i++){const d=districts[i];c.beginPath();c.moveTo(...point(0,-4));c.lineTo(...point(d.x,d.z));c.strokeStyle='#b2a07636';c.setLineDash([3,6]);c.lineWidth=mini?1:2;c.stroke();c.setLineDash([]);}
 let p=point(0,0);c.beginPath();c.arc(...p,25*scale,0,TAU);c.strokeStyle='#8c9c7140';c.lineWidth=1;c.stroke();for(let i=0;i<5;i++){c.beginPath();c.arc(...p,(5+i*4.6)*scale,0,TAU);c.strokeStyle='#8c9c7122';c.stroke();}
 // Etched ruins on the map represent the actual cathedral and outer landmarks.
 c.strokeStyle='#acb38b55';for(let side of [-1,1]){for(let i=0;i<6;i++){let q=point(side*22,-31+i*12);c.strokeRect(q[0]-3,q[1]-3,6,6);}let a=point(side*11,-37);c.strokeRect(a[0]-13*scale/2,a[1]-2*scale,13*scale,4*scale);}
 districts.forEach((d,i)=>{let [x,y]=point(d.x,d.z);c.save();c.translate(x,y);c.rotate(Math.PI/4);c.strokeStyle=waypoint?.name===d.name?'#edbd75':i?'#9bc3a5':'#c8b58e';c.lineWidth=1.5;c.strokeRect(-4,-4,8,8);c.restore();if(!mini){c.textAlign='center';c.font='14px Cinzel,Georgia';c.fillStyle='#c6c8ae';c.fillText(d.name,x,y+(i===3?27:-26));c.font='7px Inter,Arial';c.fillStyle='#718a6d';c.fillText(i?'SOUL SHRINE':'THE FIRST HUNT',x,y+(i===3?41:-13));}});
 eclipseSystems?.drawMap(c,point,mini);
 enemies.filter(e=>!e.dead).forEach(e=>{let [x,y]=point(e.root.position.x,e.root.position.z);c.beginPath();c.arc(x,y,e.boss?5:2.5,0,TAU);c.fillStyle=e.boss?'#c997dd':'#d48867';c.fill();});
 if(waypoint){let [x,y]=point(waypoint.x,waypoint.z);if(mini){const d=Math.hypot(x-cx,y-cy);if(d>105){x=cx+(x-cx)*105/d;y=cy+(y-cy)*105/d;}}c.beginPath();c.arc(x,y,mini?6:10,0,TAU);c.strokeStyle='#edbe76';c.lineWidth=1.5;c.stroke();c.beginPath();c.moveTo(x-4,y);c.lineTo(x+4,y);c.moveTo(x,y-4);c.lineTo(x,y+4);c.stroke();}
 let [x,y]=point(player.root.position.x,player.root.position.z);c.save();c.translate(x,y);c.rotate(Math.PI-player.root.rotation.y);c.beginPath();c.moveTo(0,-8);c.lineTo(5,6);c.lineTo(0,3);c.lineTo(-5,6);c.closePath();c.fillStyle='#efdbb2';c.shadowColor='#d5b582';c.shadowBlur=9;c.fill();c.restore();c.restore();
}
function applyQuality(){const ratio=options.quality==='low'?1:options.quality==='high'?Math.min(devicePixelRatio,1.65):Math.min(devicePixelRatio,1.2);renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(ratio);composer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=options.quality!=='low';const size=options.quality==='high'?2048:1024;if(sun.shadow.mapSize.x!==size){sun.shadow.mapSize.set(size,size);sun.shadow.map?.dispose();sun.shadow.map=null;}bloom.strength=options.quality==='high'?.55:.38;}
function saveOptions(){try{localStorage.setItem('hellbound-settings',JSON.stringify(options))}catch{}}
let audioMaster=null,windBuffer=null;
function ensureAudio(){
 audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();if(audioMaster)return;
 audioMaster=audio.createGain();audioMaster.gain.value=audioOn?options.volume:0;audioMaster.connect(audio.destination);
 const drone=audio.createGain();drone.gain.value=.036;drone.connect(audioMaster);for(const hz of [41.2,61.75]){const o=audio.createOscillator();o.type='sine';o.frequency.value=hz;o.connect(drone);o.start();}
 windBuffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);const data=windBuffer.getChannelData(0);let prev=0;for(let i=0;i<data.length;i++){prev=(prev+Math.random()*.08-.04)/1.015;data[i]=prev;}
 const noise=audio.createBufferSource();noise.buffer=windBuffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=600;const gain=audio.createGain();gain.gain.value=.15;noise.connect(filter);filter.connect(gain);gain.connect(audioMaster);noise.start();
 const lfo=audio.createOscillator(),lfoGain=audio.createGain();lfo.frequency.value=.065;lfoGain.gain.value=230;lfo.connect(lfoGain);lfoGain.connect(filter.frequency);lfo.start();
}
function impactNoise(duration,volume){if(!audioOn||!audioMaster||!windBuffer)return;const n=audio.createBufferSource(),gain=audio.createGain(),filter=audio.createBiquadFilter();n.buffer=windBuffer;filter.type='highpass';filter.frequency.value=350;gain.gain.setValueAtTime(volume*2,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);n.connect(filter);filter.connect(gain);gain.connect(audioMaster);n.start(0,Math.random(),duration);}
function initOverhaul(){
 $('riftMapButtons').innerHTML=RIFT_DEFINITIONS.map((n,i)=>`<button data-rift-map="${i}">${n.name}<span>↗</span></button>`).join('');$('riftMapButtons').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{waypoint={...RIFT_DEFINITIONS[i]};updateMapButtons();drawCartography($('mapCanvas'),false);});
 for(const [id,key] of [['distanceSlider','cameraDistance'],['fovSlider','fov']])$(id).oninput=e=>{options[key]=Number(e.target.value);saveOptions();};
 for(const [id,key] of [['executionCameraToggle','executionCamera'],['motionToggle','motion'],['cueToggle','cues'],['goreToggle','gore']])$(id).onchange=e=>{options[key]=e.target.checked;if(key==='gore'&&!options.gore)gore.reset();saveOptions();};
 applyQuality();updateRecord();
 $('pauseMap').onclick=openMap;$('pauseSettings').onclick=openSettings;$('mapButton').onclick=openMap;$('closeMap').onclick=closePanel;$('settingsButton').onclick=openSettings;$('closeSettings').onclick=closePanel;$('settingsDone').onclick=closePanel;
 $('clearWaypoint').onclick=()=>{waypoint=null;updateMapButtons();drawCartography($('mapCanvas'),false)};
 $('mapCanvas').onclick=ev=>{const rect=ev.currentTarget.getBoundingClientRect(),x=(ev.clientX-rect.left)/rect.width*850,z=(ev.clientY-rect.top)/rect.height*690;let wx=(x-425)/3.55,wz=(z-345)/3.55+6;const r=Math.hypot(wx,wz);if(r>84){wx*=84/r;wz*=84/r;}const d=districts.find(d=>Math.hypot(d.x-wx,d.z-wz)<14);waypoint=d?{...d}:{x:wx,z:wz,name:'Marked location'};updateMapButtons();drawCartography($('mapCanvas'),false)};
 $('qualitySelect').onchange=e=>{options.quality=e.target.value;applyQuality();saveOptions()};$('sensitivitySlider').oninput=e=>{options.sensitivity=Number(e.target.value);saveOptions()};$('volumeSlider').oninput=e=>{options.volume=Number(e.target.value);if(audioMaster)audioMaster.gain.setTargetAtTime(audioOn?options.volume:0,audio.currentTime,.1);saveOptions()};$('shakeToggle').onchange=e=>{options.shake=e.target.checked;saveOptions()};$('flashToggle').onchange=e=>{options.flashes=e.target.checked;saveOptions()};
 $('sound').onclick=()=>{audioOn=!audioOn;try{ensureAudio();audioMaster.gain.setTargetAtTime(audioOn?options.volume:0,audio.currentTime,.2)}catch{}$('soundState').textContent=audioOn?'ON':'OFF';if(audioOn)tone(65,.5,'sine',.1,38)};
}

// The Execution Grimoire equips a favorite or cycles the complete roster without repeats.
let catalogBossPreview=false;
function openFinisherCatalog(){
 if(wheelOpen)closeWheel();if(!openPanel('finishers'))return;
 if(options.finisher!=='auto')catalogFocus=options.finisher;
 $('finisherGrimoire').classList.remove('hidden');renderCatalog();
}
function finisherGlyph(school){
 const path=school==='brutal'?'M4 22 8 8 6 2 11 6 12 16M12 22l4-14-1-6 5 5-2 15M2 18l20 0':iconPaths[school];
 return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
}
function renderCatalog(){
 const def=FINISHERS.find(d=>d.id===catalogFocus)||FINISHERS[0],family=FINISHER_SCHOOLS[def.school],matches=d=>matchesExecution(d,catalogFilter),filtered=FINISHERS.filter(matches),list=$('executionList'),scroll=list.scrollTop;
 list.innerHTML=filtered.map(d=>{const active=d.id===def.id,equipped=options[executionKey(d)]===d.id;return `<button class="execution-row ${active?'selected':''}" data-execution="${d.id}" aria-pressed="${active}"><span class="execution-number">${String(FINISHERS.indexOf(d)+1).padStart(2,'0')}</span><span class="execution-mini" style="color:${FINISHER_SCHOOLS[d.school].color}">${finisherGlyph(d.school)}</span><span class="execution-row-name">${d.name}<small>${d.bossOnly?'BOSS EXCLUSIVE':d.smallOnly?'MIDGET EXCLUSIVE':d.id==='soulbreaker'?'YOUR ORIGINAL':FINISHER_SCHOOLS[d.school].label} <i>·</i> ${d.duration.toFixed(1)}s</small></span><span class="execution-mark">${equipped?'◆':'↗'}</span></button>`;}).join('');
 list.querySelectorAll('button').forEach(b=>b.onclick=()=>{catalogFocus=b.dataset.execution;renderCatalog();});list.scrollTop=scroll;
 document.querySelectorAll('[data-finisher-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.finisherFilter===catalogFilter);b.setAttribute('aria-pressed',String(b.dataset.finisherFilter===catalogFilter));});
 $('executionDetail').style.setProperty('--execution-color',family.color);$('catalogSchool').textContent=(def.bossOnly?'BOSS EXCLUSIVE / ':def.smallOnly?'MIDGET EXCLUSIVE / ':family.label+' / ')+'EXECUTION '+String(FINISHERS.indexOf(def)+1).padStart(2,'0');$('catalogName').textContent=def.name;$('catalogDescription').textContent=def.description;$('catalogSignature').textContent=def.signature;$('catalogDuration').textContent=def.duration.toFixed(1)+' SECONDS';$('catalogGlyph').innerHTML=finisherGlyph(def.school);
 $('catalogBeats').innerHTML=def.beats.map((beat,i)=>`<li><span>0${i+1}</span><strong>${beat}</strong></li>`).join('');
 const option=options[executionKey(def)],selected=option===def.id;$('equipExecution').firstElementChild.textContent=selected?'EQUIPPED ON E':def.bossOnly?'EQUIP FOR BOSSES':def.smallOnly?'EQUIP FOR MIDGETS':'EQUIP ON E';$('equipExecution').classList.toggle('is-equipped',selected);$('cycleExecutions').classList.toggle('active',option==='auto');$('cycleExecutions').setAttribute('aria-pressed',String(option==='auto'));$('cycleExecutions').textContent=def.bossOnly?'CYCLE 7 BOSS EXECUTIONS':def.smallOnly?'CYCLE 2 MIDGET EXECUTIONS':'CYCLE 40 STANDARD EXECUTIONS';
 $('bossPreview').disabled=!!def.bossOnly||!!def.smallOnly;$('bossPreview').checked=!def.smallOnly&&(!!def.bossOnly||catalogBossPreview);
 $('equippedExecutionLabel').textContent=(def.bossOnly?'BOSSES: ':def.smallOnly?'MIDGETS: ':'STANDARD: ')+(option==='auto'?'SHUFFLE · NO REPEATS':FINISHERS.find(d=>d.id===option)?.name.toUpperCase());$('catalogVisibleCount').textContent=`${filtered.length} / 49 EXECUTIONS`;
}
function previewExecution(id=catalogFocus){
 if(finisher||panelOpen!=='finishers')return;const def=FINISHERS.find(d=>d.id===id);if(!def)return;catalogFocus=id;
 previewSnapshot={position:player.root.position.clone(),rotation:player.root.rotation.clone(),scale:player.root.scale.clone(),cameraPosition:camera.position.clone(),cameraQuaternion:camera.quaternion.clone(),fov:camera.fov,action,actionQueue,airTarget};
 player.root.scale.setScalar(1.2);player.root.position.set(0,.06,10.4);player.root.rotation.set(0,Math.PI,0);resetMotion(player);pose(player,elapsed);
 const boss=!def.smallOnly&&(catalogBossPreview||!!def.bossOnly),e=creature(false,boss);e.root.position.set(0,.06,8);e.root.scale.setScalar(boss?1.65:1.05);Object.assign(e,{boss,hp:1,maxHp:1,dead:false,kb:new THREE.Vector3(),vy:0,airborne:false,stagger:0});
 if(def.smallOnly)makeSmallFiend(e);panelOpen=null;paused=true;$('finisherGrimoire').classList.add('hidden');startExecution(e,def,true);
}
function initFinisherCatalog(){
 executionDirector=createExecutionDirector({polish:(f,dt)=>{polishExecution(f,player);cinematicBody(f,player,dt,obstacles)},smoothGhost:(g,dt)=>finishMotion(g,dt),scene,player,camera,pose,aimHand,chestContact,burst,ring,beam,slash,tone,wound:(f,pos,strength)=>gore.emit(pos,f.front.clone().setY(.4),strength,f.preview?f:null),sever:(f,part)=>gore.sever(f.enemy,part,f.side.clone().multiplyScalar(3).setY(5),f.preview?f:null),clearWounds:f=>gore.clearOwner(f),time:()=>elapsed,makeGhost:makeExecutionGhost,removeGhost:removeTransientRig,onImpact:executionImpact,onFinish:finishExecution,kick:(amount,stop)=>{shake=Math.max(shake,amount);hitstop=Math.max(hitstop,stop);}});
 for(const key of ['finisher','bossFinisher','smallFinisher'])if(options[key]!=='auto'&&!FINISHERS.some(d=>d.id===options[key]&&executionKey(d)===key))options[key]='auto';
 $('menuFinishers').onclick=openFinisherCatalog;$('pauseFinishers').onclick=openFinisherCatalog;$('closeGrimoire').onclick=closePanel;
 $('cycleExecutions').onclick=()=>{options[executionKey(FINISHERS.find(d=>d.id===catalogFocus))]='auto';saveOptions();renderCatalog();tone(250,.12,'triangle',.04,110)};
 $('equipExecution').onclick=()=>{options[executionKey(FINISHERS.find(d=>d.id===catalogFocus))]=catalogFocus;saveOptions();renderCatalog();tone(280,.18,'triangle',.06,80)};
 $('previewExecution').onclick=()=>previewExecution();$('bossPreview').onchange=e=>catalogBossPreview=e.target.checked;
 document.querySelectorAll('[data-finisher-filter]').forEach(b=>b.onclick=()=>{catalogFilter=b.dataset.finisherFilter;$('executionList').scrollTop=0;const match=d=>matchesExecution(d,catalogFilter);if(!match(FINISHERS.find(d=>d.id===catalogFocus)||FINISHERS[0]))catalogFocus=FINISHERS.find(match).id;renderCatalog();});
}

const MODE_INFO={survival:['Wave Survival','Endless waves · blessings · escalating bosses'],explore:['Free Roam','Four districts · local patrols · optional rift hunts'],boss:['Boss Rush','One Cinder King per round · escalating vitality · blessings'],training:['Training Arena','Immortal practice · resettable foes · all 49 executions']};
let selectedMode='survival';
function configureMode(){document.body.dataset.gameMode=gameMode;lookEdge=0;
 $('modeLabel').textContent=MODE_INFO[gameMode][0].toUpperCase();$('trainingControls').classList.toggle('hidden',gameMode!=='training');$('trainingAI').textContent='H · AI OFF';$('trainingControls').title='L: toggle walking · Shift: sprint · WASD: move';
 if(gameMode==='training'){wave=1;wavePending=false;trainingSpawn(false);banner('THE PROVING GROUND','Immortal practice. I: midget · Y: boss · K: group drill · H: AI · J: resources.');}
 if(gameMode==='explore'){wave=1;wavePending=false;banner('THE FORSAKEN REALMS','No timed waves. Explore four districts, defeat their patrols, and seal the rifts.');}
 $('waveNum').textContent=gameMode==='explore'?'∞':gameMode==='training'?'—':'00';
}
function trainingSpawn(boss=false,sparring=false,small=false){
 if(gameMode!=='training'||finisher)return;enemies.forEach(e=>removeTransientRig(e));enemies.length=0;projectiles.forEach(p=>disposeEffect(p.mesh));projectiles.length=0;zones.forEach(z=>disposeEffect(z.mesh));zones.length=0;
 wave=boss?3:1;spawnEnemy(0,1);const e=enemies.at(-1);if(small)makeSmallFiend(e);e.root.position.copy(player.root.position).addScaledVector(facing(),3);resolveWorld(e.root.position);e.root.rotation.y=player.root.rotation.y+Math.PI;e.hp=e.maxHp*(boss?.18:.5);e.broken=boss?0:20;if(sparring){e.hp=e.maxHp=1200;e.broken=0;}executeCooldown=0;action=null;cooldowns.fill(0);energy=100;health=runMods.maxHealth;
 notify(small?'Midget Fiend · E to execute · V for its exclusive finishers':boss?'Boss target · E for a boss execution · V to choose':'Revenant target · E to execute · V to choose');
}
let realmHuntTimer=45;
function realmHuntPack(){if(mode!=='game'||finisher)return;const a=Math.random()*TAU;const n=3+Math.floor(Math.random()*3);
 for(let i=0;i<n;i++){spawnEnemy(i,n,i===1);const e=enemies.at(-1);const wa=a+(i-n/2)*.6;e.root.position.copy(player.root.position).addScaledVector(new THREE.Vector3(Math.sin(wa),0,Math.cos(wa)),8+i*1.5);resolveWorld(e.root.position);e.hp=e.maxHp=.72*e.maxHp*(1+wave*.06);e.engagementWait=3;}
 banner('THE REALM HUNTS BACK','Your presence has been heard. Survive the pack.');tone(72,.5,'sawtooth',.1,26);}

function trainingDrill(){if(gameMode!=='training'||finisher)return;trainingSpawn(false,true);const base=player.root.position.clone();for(let i=1;i<3;i++){spawnEnemy(i,3,true);const e=enemies.at(-1),a=player.root.rotation.y+(i===1?1.1:-1.1);e.root.position.copy(base).add(new THREE.Vector3(Math.sin(a)*5,0,Math.cos(a)*5));e.hp=e.maxHp=500;e.broken=0;}trainingAI=true;$('trainingAI').textContent='H · AI ON';encounter.reset();notify('COMBAT DRILL · 3 opponents / immortal / parry and rupture practice');}
function updateMode(dt){if(wheelOpen)previewPower(hovered);flowGrace=Math.max(0,flowGrace-dt);if(mode==='game'&&gameMode==='explore'&&!finisher){realmHuntTimer-=dt;if(realmHuntTimer<=0){if(enemies.filter(e=>!e.dead).length<=1)realmHuntPack();realmHuntTimer=50+Math.random()*35;}}
 if(!flowGrace)flow=0;$('stanceName').textContent=STANCES[stance].name;$('flowPips').textContent='◆'.repeat(flow)+'◇'.repeat(3-flow);$('flowHint').textContent=flow===3?'N · FLOW REVERSAL':'Z · STANCE / CONTACT CANCEL';$('wardReadout').textContent=[aegis>0?'BASTION '+Math.ceil(aegis)+' · '+Math.ceil(aegisTime)+'s':'',reaperWard>0?'REAPER COUNTER · '+Math.ceil(reaperWard)+'s':''].filter(Boolean).join(' / ');aegisTime=Math.max(0,aegisTime-dt);if(!aegisTime)aegis=0;reaperWard=Math.max(0,reaperWard-dt);
 if(!document.pointerLockElement&&!paused&&!panelOpen&&!wheelOpen&&!finisher)yaw+=lookEdge*dt*1.8;
 resonanceTime=Math.max(0,resonanceTime-dt);if(!resonanceTime)resonance.clear();
 if(gameMode==='training'){health=runMods.maxHealth;energy=100;cooldowns.fill(0);}
 if(gameMode==='explore'&&!finisher){districts.forEach((d,i)=>{if(exploredDistricts.has(i)||Math.hypot(player.root.position.x-d.x,player.root.position.z-d.z)>20)return;exploredDistricts.add(i);for(let j=0;j<3;j++){spawnEnemy(j,3,true);const e=enemies.at(-1),a=j*TAU/3;e.root.position.set(d.x+Math.sin(a)*12,.06,d.z+Math.cos(a)*12);resolveWorld(e.root.position);}banner(d.name.toUpperCase(),'A local patrol guards this district. No new patrol will replace it.');});}
 const status=resonance.size===3?'CONVERGENCE READY · HEAVY':`TRIUNE RESONANCE · ${resonance.size}/3`;
 $('resonanceLabel').textContent=status;$('resonanceHUD').classList.toggle('ready',resonance.size===3);document.querySelectorAll('[data-resonance]').forEach(e=>e.classList.toggle('lit',resonance.has(e.dataset.resonance)));
 $('mouseStatus').textContent=document.pointerLockElement?'MOUSE · FREE ORBIT':'MOUSE · HOVER / EDGES TURN';
}
function returnToMenu(){
 if(mode==='game'&&['survival','boss'].includes(gameMode))saveRecord();
 // Reuse the run reset for every owned transient; don't leave an invisible hunt running.
 startGame('survival');mode='menu';paused=false;wavePending=false;document.exitPointerLock?.();Object.keys(keys).forEach(k=>keys[k]=false);
 document.body.classList.remove('playing','cinematic');$('hud').classList.add('hidden');$('menu').classList.remove('hidden');$('trainingControls').classList.add('hidden');$('modal').classList.add('hidden');player.root.position.set(6,.06,7);player.root.scale.setScalar(1.75);player.root.rotation.y=.6;
}
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{selectedMode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>{const active=b===button;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);});$('modeDescription').textContent=MODE_INFO[selectedMode][1];$('start').firstElementChild.textContent=selectedMode==='survival'?'ENTER THE ABYSS':'ENTER '+MODE_INFO[selectedMode][0].toUpperCase();});
$('returnMenu').onclick=returnToMenu;$('trainingRevenant').onclick=()=>trainingSpawn(false);$('trainingBoss').onclick=()=>trainingSpawn(true);$('trainingSmall').onclick=()=>trainingSpawn(false,false,true);$('trainingDrill').onclick=trainingDrill;$('trainingSparring').onclick=()=>trainingSpawn(false,true);
function toggleTrainingAI(){trainingAI=!trainingAI;if(!trainingAI)enemies.forEach(e=>{e.bossMove=null;e.state='chase';});$('trainingAI').textContent='H · AI '+(trainingAI?'ON':'OFF');}
$('trainingAI').onclick=toggleTrainingAI;
window.addEventListener('keydown',e=>{if(mode!=='game'||gameMode!=='training'||paused||wheelOpen||finisher||panelOpen||e.repeat)return;if(e.code==='KeyT')trainingSpawn(false);if(e.code==='KeyY')trainingSpawn(true);if(e.code==='KeyI')trainingSpawn(false,false,true);if(e.code==='KeyK')trainingDrill();if(e.code==='KeyH')toggleTrainingAI();if(e.code==='KeyU')trainingSpawn(false,true);if(e.code==='KeyJ'){executeCooldown=attackCooldown=dodgeCooldown=parryCooldown=0;energy=100;health=runMods.maxHealth;cooldowns.fill(0);notify('Practice resources reset');}});
$('world').addEventListener('wheel',e=>{if(mode!=='game'||paused||wheelOpen||finisher)return;e.preventDefault();options.cameraDistance=THREE.MathUtils.clamp(options.cameraDistance+Math.sign(e.deltaY)*.5,6,11);saveOptions();},{passive:false});
$('invertY').onchange=e=>{options.invertY=e.target.checked;saveOptions();};$('invertY').checked=!!options.invertY;
window.addEventListener('blur',()=>{dragging=false;heavyHeld=false;Object.keys(keys).forEach(k=>keys[k]=false);if(mode==='game'&&!paused&&!finisher&&!panelOpen&&!upgradeOpen)openModal();});

let last=performance.now(),hudAccum=0;
function animate(now){requestAnimationFrame(animate);const realdt=Math.min(.05,(now-last)/1000);last=now;elapsed+=realdt;let dt=paused&&!finisher?.preview?0:realdt*(wheelOpen?.065:1);if(hitstop>0){hitstop-=realdt;dt*=finisher?.22:.12}else if(finisher&&finisher.slow>0){finisher.slow-=realdt;dt*=.25;} // GRAVITAS: hit-stop freeze at contact, then the kill-beat dilatesfor(let i=0;i<ashN;i++){ashPos[i*3]+=realdt*.2;ashPos[i*3+1]+=realdt*(.08+(i%5)*.025);if(ashPos[i*3+1]>40)ashPos[i*3+1]=0}ashGeo.attributes.position.needsUpdate=true;
fires.forEach((f,i)=>{f.scale.y=.5+Math.sin(elapsed*8+i*3)*.12;f.scale.x=.24+Math.sin(elapsed*13+i)*.06;if(!paused&&Math.random()<.1){f.getWorldPosition(tmp);burst(tmp,0xff9239,1,1.8,.6)}});gateLight.intensity=60+Math.sin(elapsed*1.5)*8;shrines.forEach((s,i)=>{s.diamond.rotation.y=elapsed*.5;s.diamond.position.y=1.95+Math.sin(elapsed*2+i)*.12;});
if(mode==='menu'&&!finisher?.preview){player.motionCombat=false;pose(player,elapsed);smoothRig(player,dt);player.root.rotation.y=.6+Math.sin(elapsed*.25)*.06;camera.position.set(9+Math.sin(elapsed*.1)*.35,4.1,18);camera.lookAt(-4.2,2.7,-7);if(Math.random()<.2)burst(player.root.position.clone().add(new THREE.Vector3(0,1,0)),0xcc713c,1,1,1);}
if(finisher?.preview){const e=finisher.enemy;updateFinisher(dt);smoothRig(player,dt);if(finisher)smoothRig(e,dt);alignExecutionHands();}
if(mode==='dead'&&!finisher?.preview){player.deathTime=Math.min(1.4,(player.deathTime||0)+realdt);if(!stepBody(player,realdt,obstacles))poseDeath(player);}
if(mode==='game'&&!paused){tetherCooldown=Math.max(0,tetherCooldown-dt);ascendTime=Math.max(0,ascendTime-dt);cooldowns.forEach((c,i)=>cooldowns[i]=Math.max(0,c-dt));attackCooldown=Math.max(0,attackCooldown-dt);dodgeCooldown=Math.max(0,dodgeCooldown-dt);parryCooldown=Math.max(0,parryCooldown-dt);executeCooldown=Math.max(0,executeCooldown-dt);chainWindow=Math.max(0,chainWindow-dt);if(chainWindow<=0)chainTarget=null;invuln=Math.max(0,invuln-dt);ghostTime=Math.max(0,ghostTime-dt);riposte=Math.max(0,riposte-dt);slowTime=Math.max(0,slowTime-dt);energy=Math.min(100,energy+dt*5.5*runMods.regen*(ascendTime>0?2:1));comboTime=Math.max(0,comboTime-dt);dodgeLink=Math.max(0,dodgeLink-dt);weaveTime=Math.max(0,weaveTime-dt);if(comboTime<=0){combo=0;styleVariety.clear();}
updateMode(dt);updatePlayer(dt);updateEnemies(dt);updateProjectiles(dt);updateZones(dt);updateSummons(dt);smoothRig(player,dt);enemies.forEach(e=>{if(!e.dead)smoothRig(e,dt)});summons.forEach(e=>smoothRig(e,dt));alignExecutionHands();clawTrails(dt);contactFootsteps();if(['survival','boss'].includes(gameMode)&&!finisher&&wave>0&&!enemies.some(e=>!e.dead)&&!wavePending){wavePending=true;waveDelay=999;intermission=1.7;score+=eclipseSystems?.endWave()||0;banner('THE ASH SETTLES','The fallen offer you a forbidden blessing.');health=Math.min(runMods.maxHealth,health+10)}if(intermission>0){intermission-=dt;if(intermission<=0)openBoons();}if(wavePending&&!finisher&&!upgradeOpen&&intermission<=0){waveDelay-=dt;if(waveDelay<=0)nextWave()}
if(ascendTime>0&&Math.random()<.5)burst(player.root.position.clone().add(new THREE.Vector3(0,1.6,0)),0xff8d55,3,2,.6);hudAccum+=realdt;if(hudAccum>.08){hudAccum=0;updateHUD()}}
if(mode==='menu'&&!dragging){const ma=elapsed*.05;camera.position.set(Math.sin(ma)*16,5.8+Math.sin(elapsed*.13)*1.2,Math.cos(ma)*16);camera.lookAt(3.4,2.0,4.2);}
updateEffects(dt||mode==='menu'?dt:0);if(shake>0&&(!paused||finisher?.preview)&&options.shake){camera.position.x+=Math.sin(elapsed*47)*shake*.28;camera.position.y+=Math.cos(elapsed*39)*shake*.22;shake=Math.max(0,shake-realdt*1.4)}damageAlpha=Math.max(0,damageAlpha-realdt*1.3);$('damageVeil').style.opacity=options.flashes?damageAlpha:damageAlpha*.2;clarityFill.position.copy(camera.position);clarityFill.target.position.copy(player.root.position).y+=1.7;windUniform.value=elapsed;updateWings(mode==='dead'?realdt:dt);drawTether();eclipseWorld?.update(realdt,elapsed,options.quality);eclipseSystems?.update(dt,elapsed);document.body.classList.toggle('hide-cues',!options.cues);updateDamageNumbers(dt);if(options.quality==='low')renderer.render(scene,camera);else composer.render(realdt);}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);applyQuality()});
// Expose read-only diagnostics for local play-testing.
window.__hellbound={get state(){return{walkToggle,moveSpeed:moveVelocity.length(),stance:STANCES[stance].name,flow,aegis,reaperWard,powerCount:powers.length,gameMode,trainingAI,bossRound,resonance:[...resonance],resonanceTime,cameraYaw:yaw,cameraPitch:pitch,playerYaw:player.root.rotation.y,staging:stagingSnapshot(finisher),precise:!!action?.precise,clinchTime,gore:gore.snapshot(),bossFinisher:options.bossFinisher,overcast:!!action?.overcast,physics:{playerRagdoll:!!player.physicalBody,bodies:enemies.filter(e=>e.physicalBody).length},motion:motionInfo(player),actionDuration:action?.duration||0,actionTime:action?.t||0,castReleased:action?.type==='cast'?action.released:null,projectileCount:projectiles.length,zoneCount:zones.length,summonCount:summons.length,eclipse:eclipseSystems?.snapshot(),tetherCooldown,previousPower:powers[previousPower].name,runMods:{...runMods},mode,paused,executeCooldown,audioOn,cameraPosition:camera.position.toArray().map(v=>Math.round(v*1000)/1000),audioState:audio?.state||'uninitialized',records:{...records},upgradeOpen,panelOpen,acquired:[...acquired],ascendCharge,ascendTime,maxHealth:runMods.maxHealth,waypoint,options:{...options},wave,health,energy,score,enemies:enemies.filter(e=>!e.dead).length,selectedPower:powers[selected].name,combo,finisher:!!finisher,execution:finisher?{id:finisher.def.id,time:finisher.t,duration:finisher.def.duration,preview:finisher.preview,impactDone:finisher.impactDone,chain:!!finisher.chain}:null,chainReady:chainWindow>0,equippedFinisher:options.finisher,completedExecutions:[...completedExecutions],drawCalls:renderer.info.render.calls,action:action?.type||null,charge:action?.type==='charge'?action.t:0,combatLog:[...combatLog],weave:weaveTime>0?weaveSchool:null,player:{x:player.root.position.x,z:player.root.position.z},foes:enemies.filter(e=>!e.dead).map(e=>({hp:e.hp,guard:e.guardActive,guardMeter:e.guardMeter,enemySteps:e.enemySteps||0,soulAnchor:e.soulAnchor||0,snared:e.snared||0,riftId:e.riftId||null,enraged:!!e.enraged,boss:!!e.boss,small:!!e.small,speed:e.speed,kind:e.kind,x:e.root.position.x,z:e.root.position.z,y:e.root.position.y,downed:e.downed||0,recovering:!!e.rise,broken:e.broken||0,juggles:e.juggles||0}))}},renderer,scene};
initOverhaul();initFinisherCatalog();
eclipseWorld=createEclipseWorld({scene,player,sun,rim});
eclipseSystems=createEclipseSystems({scene,player,camera,obstacles,getState:()=>({mode,paused,finisher,wheelOpen,wave,wavePending,health,maxHealth:runMods.maxHealth,enemies,tetherCooldown,previousPower:powers[previousPower].name}),spawnGuardian:spawnRiftGuardian,reward:rewardRift,notify,banner,ring,tone,actionText});
let motionStudio=null;
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('test'))window.__hellbound.testing={
 ruinRenderProfile(quality='low'){if(options.quality!==quality){options.quality=quality;applyQuality();}renderer.info.autoReset=false;renderer.info.reset();const start=performance.now();if(quality==='low')renderer.render(scene,camera);else composer.render(0);const gl=renderer.getContext();gl.finish();const ms=performance.now()-start,ext=gl.getExtension('WEBGL_debug_renderer_info'),report={quality,ms,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'};renderer.info.autoReset=true;return report;},
 ruinSnapshot(){return {encounter:encounter.info(),action:action?{type:action.type,t:action.t,duration:action.duration,hit:!!action.hit,targets:action.targetsHit?.size||0}:null,enemies:enemies.map(e=>({kind:e.kind,rend:e.rend||0,rendTime:e.rendTime||0,state:e.state,permit:encounter.mayAttack(e),windup:e.windupDuration,recover:e.recoverDuration,hp:e.hp,bossMove:e.bossMove?{kind:e.bossMove.kind,stage:e.bossMove.stage,t:e.bossMove.t}:null}))};},
 ruinDrill(){trainingDrill();},
 revelSlay(){const e=enemies.find(e=>!e.dead);if(e){e.hp=9;e.rend=3;e.rendTime=5;}},
 revelStats(){let meshes=0,groups=0;scene.traverse(o=>{if(o.isMesh||o.isInstancedMesh)meshes++;if(o.isGroup)groups++;});return {fires:fires.length,worldMeshes:meshes,worldGroups:groups,geometries:renderer.info.memory.geometries};},
 maliceAmbush(){realmHuntPack();},
 setStyle(v){eclipseSystems?.setStyle?.(v);},
 weakenFoes(){for(const e of enemies){if(e.dead)continue;e.broken=Math.max(e.broken||0,2.5);}},
 kindKit(kind){const spec={revenant:{},stalker:{stalker:true},oracle:{caster:true},warden:{elite:true},king:{boss:true,elite:true}}[kind];const e=creature(false,!!spec.elite);e.boss=!!spec.boss;e.elite=!!spec.elite;e.caster=!!spec.caster;e.stalker=!!spec.stalker;buildKindKit(e);const out={kind,detail:e.adornDetail};removeTransientRig(e);return out;},
 hipsY(){player.root.updateMatrixWorld(true);return player.hips.getWorldPosition(new THREE.Vector3()).y;},
 ruinRend(n=3){const e=enemies.find(e=>!e.dead);if(e){e.rend=n;e.rendTime=5;}},
 ruinHit(){invuln=0;hurt(20,false,player.root.position.clone().addScaledVector(facing(),2));},
 ruinBossSweep(enraged=false){const e=enemies.find(e=>e.boss);if(e){trainingAI=true;e.broken=e.stagger=0;e.enraged=enraged;e.bossCounter=3;e.bossWait=0;e.bossMove=null;}},
 dreadSelection(boss=false,small=false,count=10){return Array.from({length:count},()=>nextExecution(true,boss,small).id);},
 trainingSmall(){trainingSpawn(false,false,true);},
 goreEnabled(value){options.gore=value;},
 stagingValid(){return finisher?.entry?stageClear(finisher.entry.plan,finisher.def,!!finisher.enemy.boss,obstacles):false;},
 obstacles(){return obstacles.map(o=>({...o}));},
 startMode(id){startGame(id);},
 arrangeExecution(id,boss,x,z,angle,distance=3){startGame('survival');wave=boss?3:1;wavePending=false;spawnEnemy(0,1);const e=enemies[0];if(FINISHERS.find(d=>d.id===id)?.smallOnly)makeSmallFiend(e);e.root.position.set(x,.06,z);e.hp=e.maxHp*.1;player.root.position.set(x+Math.sin(angle)*distance,.06,z+Math.cos(angle)*distance);player.root.rotation.y=angle+Math.PI;e.root.rotation.y=angle;options[executionKey(FINISHERS.find(d=>d.id===id))]=id;executeCooldown=0;return {actor:player.root.position.toArray(),victim:e.root.position.toArray()};},
 setWave(n){action=null;enemies.forEach(e=>removeTransientRig(e));enemies.length=0;wave=n-1;intermission=-1;upgradeOpen=false;paused=false;$('boonScreen').classList.add('hidden');nextWave();},
 restore(){health=runMods.maxHealth;energy=100;invuln=99;},
 fall(){invuln=ghostTime=ascendTime=0;action=null;hurt(9999,true);},
 charge(){ascendCharge=100;},
 killWave(){enemies.forEach(e=>killEnemy(e));},
 position(x,z){player.root.position.set(x,.06,z);},
 placeFoe(i,x,z){if(enemies[i])enemies[i].root.position.set(x,.06,z);},
 damage(i,n,type){if(enemies[i])damageEnemy(enemies[i],n,0,0,null,type);},
 burn(i){if(enemies[i]){enemies[i].burn=4;enemies[i].burnTick=.1;}},
 breakWill(i){if(enemies[i])enemies[i].broken=4;},
 stepEclipse(seconds){eclipseSystems.update(seconds,elapsed+seconds);},
 killRiftGuardians(id){enemies.filter(e=>!e.dead&&e.riftId===id).forEach(e=>damageEnemy(e,9999));},
 advanceCombat(seconds){for(let t=0;t<seconds;t+=1/60){elapsed+=1/60;attackCooldown=Math.max(0,attackCooldown-1/60);dodgeCooldown=Math.max(0,dodgeCooldown-1/60);parryCooldown=Math.max(0,parryCooldown-1/60);executeCooldown=Math.max(0,executeCooldown-1/60);invuln=Math.max(0,invuln-1/60);riposte=Math.max(0,riposte-1/60);cooldowns.forEach((c,i)=>cooldowns[i]=Math.max(0,c-1/60));tetherCooldown=Math.max(0,tetherCooldown-1/60);updateMode(1/60);updatePlayer(1/60);updateEnemies(1/60);updateProjectiles(1/60);updateZones(1/60);updateSummons(1/60);smoothRig(player,1/60);enemies.forEach(e=>{if(!e.dead)smoothRig(e,1/60);});summons.forEach(e=>smoothRig(e,1/60));alignExecutionHands();updateWings(1/60);updateEffects(1/60);eclipseSystems.update(1/60,elapsed);}drawTether();},
 combatReady(){attackCooldown=parryCooldown=dodgeCooldown=0;invuln=0;energy=100;health=100;action=null;},
 hitGuard(amount=20){invuln=0;hurt(amount,false,player.root.position.clone().addScaledVector(facing(),2));},
 toughFoe(i=0){enemies[i].hp=enemies[i].maxHp=500;},
 testHex(){projectile(player.root.position.clone().add(new THREE.Vector3(0,1.5,6)),new THREE.Vector3(1,0,0),0xb1a0da,1,10,'player','hex');},
 projectilesSnapshot(){return projectiles.map(p=>({x:p.mesh.position.x,y:p.mesh.position.y,z:p.mesh.position.z,hostile:p.hostile,rate:timeScaleAt(p.mesh.position)}));},
 executionSnapshot(){if(!finisher)return null;const f=finisher;player.root.updateMatrixWorld(true);f.enemy.root.updateMatrixWorld(true);return {id:f.def.id,small:!!f.enemy.small,events:[...f.events||[]],actorLegAngles:player.legs.map(n=>n.rotation.toArray().slice(0,3)),authoredLegAngles:f.authoredLegAngles,authoredFeet:f.authoredFeet,clock:f.clock,releaseClock:f.releaseClock,cameraFov:camera.fov,cameraShot:f.cameraShot,rootCarry:f.rootCarry?.toArray(),coreOverlap:bodyOverlap(player,f.enemy),t:f.t,phase:f.physicalPhase,framing:f.framing,victimAnatomy:[f.enemy.head,f.enemy.hips,...f.enemy.hands,...f.enemy.feet].map(n=>n.getWorldPosition(new THREE.Vector3()).toArray()),actorJoints:[player.hips,player.head,...player.hands,...player.feet].map(n=>n.getWorldPosition(new THREE.Vector3()).toArray()),camera:camera.position.toArray(),actor:player.root.position.toArray(),victim:f.enemy.root.position.toArray(),body:bodyInfo(f.enemy),grips:f.contactReport||[],drag:!!f.drag,joints:[...f.enemy.hands,...f.enemy.feet,f.enemy.hips].map(n=>n.getWorldPosition(new THREE.Vector3()).toArray()),contacts:(f.contacts||[]).map(c=>{const goal=c.node?c.node.getWorldPosition(new THREE.Vector3()):c.where==='head'?f.enemy.head.getWorldPosition(new THREE.Vector3()):chestContact(f.enemy,c.x,c.z);if(c.side)goal.addScaledVector(f.side,c.side);return {weight:c.weight,error:goal.distanceTo(player.hands[c.hand].getWorldPosition(new THREE.Vector3()))};})};},
 executionStudyFrame(){if(!finisher)return null;const f=finisher;if(!f.study){const stage=new THREE.Scene();stage.background=new THREE.Color('#142025');stage.add(new THREE.HemisphereLight('#d8e8ed','#4d3930',2.5));const sun=new THREE.DirectionalLight('#ffdbb2',3);sun.position.set(4,10,12);sun.target.position.set(0,0,8);sun.castShadow=true;sun.shadow.mapSize.set(512,512);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:35});sun.shadow.normalBias=.025;stage.add(sun,sun.target);const floor=new THREE.Mesh(new THREE.PlaneGeometry(800,800),new THREE.MeshStandardMaterial({color:'#4b5b60',roughness:.95}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;stage.add(floor);const grid=new THREE.GridHelper(80,40,0x7b8b8e,0x526b71);grid.position.y=.02;stage.add(grid);f.study={stage,sun,floor,grid};}const objects=[player.root,f.enemy.root,...f.props,...f.ghosts.map(g=>g.root),...gore.meshes()],parents=objects.map(o=>o.parent);objects.forEach(o=>f.study.stage.add(o));const shadows=renderer.shadowMap.enabled;renderer.shadowMap.enabled=true;renderer.render(f.study.stage,camera);const image=renderer.domElement.toDataURL('image/png');renderer.shadowMap.enabled=shadows;objects.forEach((o,i)=>(parents[i]||scene).add(o));return image;},
 physicsSnapshot(){return enemies.map(e=>({dead:e.dead,mass:massOf(e),body:bodyInfo(e),y:e.root.position.y,vy:e.vy,tk:e.tk||0,airborne:e.airborne,slamPower:e.slamPower||0}));},
 launchFoe(i){const e=enemies[i];if(e){e.hp=e.maxHp=500;damageEnemy(e,1,8,11);}},
 readyTether(){tetherCooldown=0;energy=100;},
 actorFrame(i=0){const e=enemies[i];if(!e)return null;camera.position.copy(e.root.position).add(new THREE.Vector3(e.boss?7:4.4,e.boss?4.5:2.8,e.boss?9:5.7));camera.lookAt(e.root.position.clone().add(new THREE.Vector3(0,e.boss?2.4:1.55,0)));camera.fov=48;camera.updateProjectionMatrix();renderer.render(scene,camera);return {image:renderer.domElement.toDataURL('image/png'),state:e.state,bossMove:e.bossMove?.kind,stage:e.bossMove?.stage,dead:e.dead,pose:[e.rig,...e.arms,...e.forearms,...e.legs,...e.shins].flatMap(n=>n.quaternion.toArray())};},
 viewOnly(i){player.root.visible=false;enemies.forEach((e,j)=>{e.root.visible=j===i;e.telegraph.visible=false;if(j!==i)e.root.position.set(55+j,0,55);else{e.timer=0;e.bossWait=0;}});},
 canvasFrame(){renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');},

 motionCatalog(){return MOTION_CATALOG;},
 prepareCast(index){action=null;selected=index;cooldowns.fill(0);energy=100;equip();},
 studioBegin(){
  if(finisher?.preview)finishExecution(finisher,true);paused=true;mode='game';action=null;resetMotion(player);player.root.position.set(0,.06,0);player.root.scale.setScalar(1.2);player.root.rotation.set(0,0,0);pose(player,0);motionStudio=new THREE.Scene();motionStudio.background=new THREE.Color('#101c20');motionStudio.add(new THREE.HemisphereLight('#d8e6e1','#29323a',2.4));const key=new THREE.DirectionalLight('#ffe0b7',3.2);key.position.set(3,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:35});key.shadow.normalBias=.03;motionStudio.add(key,key.target);motionStudio.userData.key=key;motionStudio.userData.shadowBefore=renderer.shadowMap.enabled;renderer.shadowMap.enabled=true;const fill=new THREE.DirectionalLight('#839dc3',2.1);fill.position.set(-4,3,-2);motionStudio.add(fill);const floor=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({color:'#27353a',roughness:.9}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;const tile=document.createElement('canvas');tile.width=tile.height=128;const tc=tile.getContext('2d');tc.fillStyle='#526166';tc.fillRect(0,0,128,128);tc.fillStyle='#46565d';tc.fillRect(0,0,64,64);tc.fillRect(64,64,64,64);tc.strokeStyle='#75868a';tc.lineWidth=1;tc.strokeRect(0,0,128,128);const texture=new THREE.CanvasTexture(tile);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(100,100);floor.material.map=texture;floor.material.color.set('#899d9f');motionStudio.add(floor);const grid=new THREE.GridHelper(200,100,0x586a6c,0x3c5053);grid.position.y=.002;motionStudio.add(grid);motionStudio.add(player.root);camera.fov=48;camera.updateProjectionMatrix();},
 studioSample(spec,t,dt=1/60){
  if(!motionStudio)return null;
  const kind=spec.kind,rate=spec.speed??6,walk=kind==='walk'||kind==='sprint'||kind==='strafe';
  player.root.position.set(kind==='strafe'?t*rate:0,.06,walk&&kind!=='strafe'?t*rate:0);player.root.rotation.y=spec.yaw||0;if(spec.position)player.root.position.fromArray(spec.position);
  const a=walk||kind==='idle'?null:{type:kind,step:spec.step||1,powerIndex:spec.powerIndex||0,school:powers[spec.powerIndex||0].type,t,duration:spec.duration||1,localDir:new THREE.Vector3(...(spec.direction||[0,0,1]))};action=a;elapsed+=dt;
  pose(player,t,walk?1:0,a);smoothRig(player,dt);updateWings(dt);camera.position.copy(player.root.position).add(new THREE.Vector3(...(spec.camera||(['slam','aerial','ascend'].includes(kind)?[5,3.7,7]:[4.4,3.2,5.7]))));camera.lookAt(player.root.position.clone().add(new THREE.Vector3(0,1.9,0)));motionStudio.userData.key.position.copy(player.root.position).add(new THREE.Vector3(-3,8,5));motionStudio.userData.key.target.position.copy(player.root.position);
  const nodes=[player.hips,player.spine,player.torso,player.neck,player.head,...player.arms,...player.forearms,...player.hands,...player.legs,...player.shins,...player.feet];
  return {hipsHeight:player.hips.position.y,knees:player.legs.map((leg,i)=>{const h=leg.getWorldPosition(new THREE.Vector3()),k=player.shins[i].getWorldPosition(new THREE.Vector3()),f=player.feet[i].getWorldPosition(new THREE.Vector3());return Math.PI-h.sub(k).angleTo(f.sub(k));}),motion:motionInfo(player),pose:nodes.flatMap(n=>[...n.position.toArray(),...n.quaternion.toArray()]),hands:player.hands.map(n=>n.getWorldPosition(new THREE.Vector3()).toArray()),body:player.rig.rotation.toArray().slice(0,3),wings:player.wings.map(w=>[w.rotation.y,w.userData.fan.rotation.y])};
 },
 studioFrame(){renderer.render(motionStudio,camera);return renderer.domElement.toDataURL('image/png');},
 studioEnd(){if(motionStudio){renderer.shadowMap.enabled=motionStudio.userData.shadowBefore;motionStudio.userData.key.shadow.map?.dispose();scene.add(player.root);motionStudio.traverse(o=>{if(o.isMesh||o.isLineSegments){o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else{o.material?.map?.dispose();o.material?.dispose();}}});motionStudio=null;}action=null;resetMotion(player);},
 drawFrame(){clarityFill.position.copy(camera.position);clarityFill.target.position.copy(player.root.position).y+=1.7;if(mode==='game')updateHUD();eclipseWorld?.update(.2,elapsed,options.quality);eclipseSystems?.update(0,elapsed);if(options.quality==='low')renderer.render(scene,camera);else composer.render(0);},
 executionCatalog(){return FINISHERS.map(d=>({id:d.id,name:d.name,school:d.school,duration:d.duration,bossOnly:!!d.bossOnly,smallOnly:!!d.smallOnly,description:d.description}));},
 preview(id,boss=false){if(finisher?.preview)finishExecution(finisher,true);if(panelOpen&&panelOpen!=='finishers')closePanel();if(panelOpen!=='finishers')openFinisherCatalog();catalogBossPreview=boss;previewExecution(id);},
 advanceExecution(seconds){const trace=[];for(let t=0;t<seconds;t+=1/60){if(!finisher)break;elapsed+=1/60;const f=finisher;updateFinisher(1/60);smoothRig(player,1/60);if(finisher)smoothRig(f.enemy,1/60);alignExecutionHands();updateWings(1/60);updateEffects(1/60);if(Math.round(t*60)%10===0)trace.push({time:f.t,p:player.root.position.toArray(),e:f.enemy.root.position.toArray(),pr:player.rig.rotation.toArray().slice(0,3),er:f.enemy.rig.rotation.toArray().slice(0,3),arm:player.arms[1].rotation.toArray().slice(0,3)});}return trace;},
 executeVariant(id,boss=false){if(finisher?.preview)finishExecution(finisher,true);if(panelOpen)closePanel();paused=false;const e=enemies.find(e=>!e.dead&&!!e.boss===boss);if(!e||FINISHERS.find(d=>d.id===id)?.bossOnly&&!boss)return false;player.root.position.set(0,.06,10.4);player.root.scale.setScalar(1.2);e.root.position.set(0,.06,8);e.hp=e.maxHp*.1;return startExecution(e,FINISHERS.find(d=>d.id===id));}

};
requestAnimationFrame(animate);
