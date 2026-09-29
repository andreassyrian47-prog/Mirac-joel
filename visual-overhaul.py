from pathlib import Path
p=Path('src/main.js');s=p.read_text()
def swap(a,b):
 global s
 assert a in s,a[:80]
 s=s.replace(a,b)
swap("import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';", """import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';""")
swap("const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,230);", """const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,260);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.45,.55,1.35);composer.addPass(bloom);composer.addPass(new OutputPass());
const options={quality:'balanced',sensitivity:1,volume:.6,shake:true,flashes:true};
try{Object.assign(options,JSON.parse(localStorage.getItem('hellbound-settings')||'{}'))}catch{}
""")
swap("scene.background=new THREE.Color('#182523');scene.fog=new THREE.FogExp2('#253630',.013);", "scene.background=new THREE.Color('#101e22');scene.fog=new THREE.FogExp2('#233735',.0125);")
swap("obsidian=mat('#1c2221',.35,.5)", "obsidian=mat('#252725',.75,.35)")
swap("const boxG=new THREE.BoxGeometry", "const hornObsidian=mat('#3d332b',.72,.22),wingMembrane=mat('#351c21',.94,.05);wingMembrane.side=THREE.DoubleSide;wingMembrane.emissive.set('#45160e');wingMembrane.emissiveIntensity=.12;\nconst boxG=new THREE.BoxGeometry")
swap("const ground=mesh(new THREE.CircleGeometry(135,100),mat('#242e28'),scene,0,-.12,0);", "const ground=mesh(new THREE.CircleGeometry(170,100),mat('#29342e'),scene,0,-.12,0);const earthTexture=stoneTexture.clone();earthTexture.repeat.set(65,65);earthTexture.needsUpdate=true;ground.material.map=earthTexture;ground.material.bumpMap=earthTexture;ground.material.bumpScale=.14;")
# Layered terrain, statues, hanging chains and torn standards, all material-batched.
needle='// Bake architecture by material;'
world='''// Wind-torn standards and ritual statuary bring scale to the ruins.
const windUniform={value:0};
const cloth=mat('#481f23',.96,0);cloth.side=THREE.DoubleSide;
cloth.onBeforeCompile=shader=>{shader.uniforms.windTime=windUniform;shader.vertexShader='uniform float windTime;\\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\\n transformed.z += sin(position.y * 1.4 + windTime * 1.6 + position.x)*.24*(1.0-uv.y); transformed.x += cos(position.y * 2.0 + windTime)*.08*(1.0-uv.y);');};
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
'''
assert needle in s;s=s.replace(needle,world+'\n'+needle)
# Add wing rigs before body batching so their articulated roots remain independent.
swap("batchRig(root);root.scale.setScalar", "const wings=isPlayer?makeWings(torso):[];batchRig(root);root.scale.setScalar")
swap("shins,tail,baseHip:1.22,isPlayer", "shins,tail,wings,baseHip:1.22,isPlayer")
swap(".115,bone);else horn(head", ".1,isPlayer?hornObsidian:bone);else horn(head")
swap(".08,bone)}", ".065,isPlayer?hornObsidian:bone)}")
swap("const player=creature(true);", """function makeWings(parent){
 const wings=[];
 for(const side of [-1,1]){
  const root=new THREE.Group();root.position.set(side*.3,.66,-.2);root.rotation.y=side*1.02;parent.add(root);
  const coords=[[0,0],[.56,.71],[1.1,.87],[2.35,.36],[1.69,-.08],[1.6,-.67],[1.01,-.33],[.82,-1.05],[.36,-.52],[.06,-.83]];
  const shape=new THREE.Shape();coords.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const membrane=mesh(new THREE.ShapeGeometry(shape),wingMembrane,root,0,0,-.12);membrane.scale.x=side;
  horn(root,[[0,0,0],[side*.56,.71,-.08],[side*1.1,.87,-.12],[side*2.35,.36,-.16]],.09,hornObsidian);
  for(const [x,y] of [[2.35,.36],[1.6,-.67],[.82,-1.05],[.06,-.83]])horn(root,[[side*.56,.71,-.1],[side*(x*.72),y*.62,-.13],[side*x,y,-.16]],.039,hornObsidian);
  horn(root,[[side*.56,.71,-.08],[side*.58,1.11,-.1],[side*.43,1.25,-.03]],.08,hornObsidian);
  wings.push(root);
 }
 return wings;
}
function updateWings(dt){
 const spread=ascendTime>0?.06:finisher?.45:action?.type==='charged'?.3:action?.type==='dodge'?1.35:mode==='menu'?.83:1.02;
 player.wings.forEach((w,i)=>{const side=i?1:-1;w.rotation.y=THREE.MathUtils.damp(w.rotation.y,side*(spread+Math.sin(elapsed*2+i)*.055),8,dt);w.rotation.z=side*(.05+Math.sin(elapsed*1.5)*.035);});
}
const player=creature(true);""")
# Updated settings actually control rendering and inputs.
swap("yaw-=e.movementX*.0025;pitch=THREE.MathUtils.clamp(pitch+e.movementY*.0018", "yaw-=e.movementX*.0025*options.sensitivity;pitch=THREE.MathUtils.clamp(pitch+e.movementY*.0018*options.sensitivity")
swap("if(shake>0&&!paused){", "if(shake>0&&!paused&&options.shake){")
swap("$('damageVeil').style.opacity=damageAlpha;renderer.render(scene,camera);", "$('damageVeil').style.opacity=options.flashes?damageAlpha:damageAlpha*.2;windUniform.value=elapsed;updateWings(dt);if(options.quality==='low')renderer.render(scene,camera);else composer.render(realdt);")
swap("renderer.setPixelRatio(Math.min(devicePixelRatio,1.65))});", "applyQuality()});")
p.write_text(s)
