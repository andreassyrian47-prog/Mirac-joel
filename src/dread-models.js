import * as THREE from 'three';
// Geometry additions share each rig's ownership. No external textures or downloads.
let skinDetail;const textured=new WeakSet();
function detail(){if(skinDetail)return skinDetail;const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#999999';ctx.fillRect(0,0,128,128);let seed=347;const random=()=>((seed=seed*16807%2147483647)/2147483647);for(let i=0;i<9000;i++){const g=70+random()*100;ctx.fillStyle=`rgb(${g},${g},${g})`;ctx.fillRect(random()*128,random()*128,random()*1.7,.6+random());}skinDetail=new THREE.CanvasTexture(c);skinDetail.wrapS=skinDetail.wrapT=THREE.RepeatWrapping;skinDetail.repeat.set(3,3);return skinDetail;}
function add(node,geo,mat,p,s=[1,1,1]){const m=new THREE.Mesh(geo,mat);m.position.set(...p);m.scale.set(...s);m.castShadow=m.receiveShadow=true;node.add(m);return m;}
export function dreadSurface(r){
 const materials=new Set();r.root.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m.isMeshStandardMaterial)materials.add(m);});
 for(const m of materials){if(textured.has(m))continue;textured.add(m);if(!m.map&&m.emissive.getHex()===0){m.bumpMap=detail();m.bumpScale=.025;m.roughness=Math.max(.68,m.roughness);m.envMapIntensity=.3;}if(m.emissiveIntensity>1)m.emissiveIntensity*=.88;}
 const scar=new THREE.MeshStandardMaterial({color:'#261513',roughness:.32,metalness:.08});r.ownedMaterials?.add(scar);
 for(let i=0;i<3;i++){const points=[new THREE.Vector3(-.19+i*.10,.27,.34),new THREE.Vector3(-.11+i*.10,.43,.365),new THREE.Vector3(-.02+i*.10,.63,.33)];add(r.torso,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),9,.010,4,false),scar,[0,0,0]);}
}
export function makeSmallFiend(r){
 if(r.small)return r;r.small=true;r.kind='MIDGET FIEND';r.boss=false;r.elite=false;r.caster=false;r.stalker=false;r.root.scale.setScalar(.63);
 r.hp=r.maxHp=72;r.speed=4.35;r.broken=0;r.stagger=0;
 const hide=new THREE.MeshStandardMaterial({color:'#5b6454',roughness:.67,metalness:.04,bumpMap:detail(),bumpScale:.025});
 const tooth=new THREE.MeshStandardMaterial({color:'#c6b795',roughness:.6});
 const socket=new THREE.MeshStandardMaterial({color:'#171c18',roughness:.44});
 // A low creature with a ridged skull, elongated ears, crowded fangs and dorsal quills.
 add(r.head,new THREE.SphereGeometry(1,16,12),hide,[0,.13,-.02],[.31,.37,.27]);
 for(const side of[-1,1]){
  const ear=add(r.head,new THREE.ConeGeometry(.16,.64,7),hide,[side*.34,.22,-.07]);ear.rotation.z=-side*1.02;
  add(r.head,new THREE.SphereGeometry(1,12,8),socket,[side*.15,.17,.239],[.14,.085,.055]);
  add(r.head,new THREE.SphereGeometry(1,10,8),new THREE.MeshStandardMaterial({color:'#d4ad5f',emissive:'#ff7d19',emissiveIntensity:2}),[side*.145,.175,.287],[.044,.022,.018]);
  for(let i=0;i<3;i++){const fang=add(r.jaw||r.head,new THREE.ConeGeometry(.027,.15+i*.025,6),tooth,[side*(.04+i*.062),r.jaw?-.045:-.06,.24]);fang.rotation.z=side*.1;}
  for(let i=0;i<3;i++){const spike=add(r.torso,new THREE.ConeGeometry(.10,.50+i*.10,7),hide,[side*(.26+i*.08),.57-i*.16,-.19]);spike.rotation.x=-.8;spike.rotation.z=-side*.75;}
 }
 if(r.bar)r.bar.position.y=2.8;return r;
}
