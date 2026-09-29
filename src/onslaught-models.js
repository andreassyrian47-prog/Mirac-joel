import * as THREE from 'three';
// Local, articulated armor: plates follow their actual bone, never a world-space
// shell that floats through the elbow or knee. Geometry/materials join rig batching.
export function detailRig(r,time){
 const {torso,head,hips,arms,forearms,hands,shins,isPlayer,elite}=r;
 const steel=new THREE.MeshStandardMaterial({color:isPlayer?0x343c40:elite?0x484251:0x414d4b,roughness:.42,metalness:.72});
 const edge=new THREE.MeshStandardMaterial({color:isPlayer?0x927958:elite?0x817995:0x667e75,roughness:.53,metalness:.58});
 const clothDrive={value:new THREE.Vector2()};hips.userData.clothDrive=clothDrive;
 const leather=new THREE.MeshStandardMaterial({color:isPlayer?0x241b1b:0x252f2d,roughness:.94,side:THREE.DoubleSide});
 leather.onBeforeCompile=s=>{s.uniforms.clothTime=time;s.uniforms.clothDrive=clothDrive;s.vertexShader='uniform float clothTime;\nuniform vec2 clothDrive;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.z -= clothDrive.x*pow(clamp(-position.y/.7,0.0,1.0),2.0); transformed.x -= clothDrive.y*pow(clamp(-position.y/.7,0.0,1.0),2.0); transformed.z += sin(position.y*9.0+clothTime*3.0+position.x*5.0)*.035*pow(clamp(-position.y/.7,0.0,1.0),2.0);');};
 function plate(parent,points,position,scale,material=steel){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.028,bevelEnabled:true,bevelSegments:3,bevelThickness:.018,bevelSize:.019,steps:1});const m=new THREE.Mesh(g,material);m.position.set(...position);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;}
 const shield=[[-.5,.22],[-.4,.49],[.25,.46],[.5,.15],[.23,-.28],[0,-.5],[-.34,-.29]];
 for(let i=0;i<2;i++){const side=i?1:-1;
  const breast=plate(torso,shield,[side*.235,.47,.267],[.43,.29,.7]);breast.rotation.z=-side*.26;breast.rotation.y=side*.15;
  for(let j=0;j<3;j++){const rib=plate(torso,shield,[side*(.32-j*.035),.24-j*.13,.215],[.22,.13,.7],j===0?edge:steel);rib.rotation.z=side*.38;}
  for(let j=0;j<2;j++){const pauldron=plate(arms[i],shield,[side*(.08+j*.035),.025-j*.10,.10],[.40-j*.035,.33,.7]);pauldron.rotation.z=side*(.4+j*.15);}
  for(let j=0;j<3;j++){const gauntlet=plate(forearms[i],shield,[0,-.06-j*.095,.102],[.245-j*.018,.15,.8]);gauntlet.rotation.z=side*.08;const greave=plate(shins[i],shield,[0,-.11-j*.12,.12],[.25-j*.02,.17,.9]);greave.rotation.z=side*.045;}
  for(let j=0;j<4;j++){const stud=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),edge);stud.scale.set(1,.72,.65);stud.position.set((j-1.5)*.074,-.08,.077);hands[i].add(stud);}
  const temple=plate(head,shield,[side*.175,.16,.14],[.14,.27,.6]);temple.rotation.y=side*.5;temple.rotation.z=-side*.18;
  const panel=new THREE.PlaneGeometry(.30,.72,5,10);panel.translate(0,-.36,0);const cloth=new THREE.Mesh(panel,leather);cloth.position.set(side*.27,-.11,.18);cloth.rotation.z=side*.16;hips.add(cloth);
 }
 plate(head,[[0,.53],[.17,.18],[.1,-.2],[0,-.34],[-.1,-.2],[-.17,.18]],[0,.27,.205],[.55,.5,.8],edge);
 // A dark recessed sternum gives the emissive cracks contrast without larger glow blobs.
 plate(torso,[[0,.5],[.10,.28],[.055,-.38],[0,-.5],[-.055,-.38],[-.10,.28]],[0,.4,.286],[1,.63,.6],steel);
}
export function wingSurface(shape){
 let g=new THREE.ShapeGeometry(shape);if(g.index)g=g.toNonIndexed();let a=Array.from(g.attributes.position.array);g.dispose();
 for(let pass=0;pass<2;pass++){const out=[];for(let j=0;j<a.length;j+=9){const A=a.slice(j,j+3),B=a.slice(j+3,j+6),C=a.slice(j+6,j+9),AB=A.map((v,i)=>(v+B[i])/2),BC=B.map((v,i)=>(v+C[i])/2),CA=C.map((v,i)=>(v+A[i])/2);out.push(...A,...AB,...CA,...AB,...B,...BC,...CA,...BC,...C,...AB,...BC,...CA);}a=out;}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(a,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(a.flatMap((v,i)=>i%3===2?[]:[v]),2));out.computeVertexNormals();return out;
}
