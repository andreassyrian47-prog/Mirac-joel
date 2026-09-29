import * as THREE from 'three';
// Smooth taper replaces chains of intersecting cone segments while preserving
// all bone pivots, collision proxies, rig proportions and finisher sockets.
export function curvedHorn(points,radius){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments=Math.max(6,(points.length-1)*5),sides=8,frames=curve.computeFrenetFrames(segments,false),pos=[],uv=[],indices=[];
 for(let i=0;i<=segments;i++){const t=i/segments,center=curve.getPointAt(t),r=Math.max(.0006,radius*Math.pow(1-t,.78))*(1+.035*Math.sin(t*55));for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,p=center.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);pos.push(...p.toArray());uv.push(j/sides,t);if(i<segments&&j<sides){const k=i*(sides+1)+j,n=k+sides+1;indices.push(k,n,k+1,n,n+1,k+1);}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
// A bounded, bone-attached wound shell: gradual roughness/color change, no
// topology claim or arbitrary cutting. It stays registered to the chest.
export function addRendVisual(r){
 const group=new THREE.Group();r.torso.add(group);group.position.set(0,.40,.375);const material=new THREE.MeshStandardMaterial({color:'#982a1f',emissive:'#d53c18',emissiveIntensity:.35,roughness:.34,transparent:true,opacity:0,depthWrite:false});r.ownedMaterials?.add(material);
 for(let i=0;i<3;i++){const g=new THREE.PlaneGeometry(.022,.31),m=new THREE.Mesh(g,material);m.position.set((i-1)*.085,0,Math.abs(i-1)*-.025);m.rotation.z=-.28;group.add(m);}
 group.visible=false;r.rendVisual={group,material};
}
export function updateRendVisual(r){if(!r.rendVisual)return;const {group,material}=r.rendVisual;group.visible=!!r.rend&&!r.dead;material.opacity=Math.min(.9,(r.rend||0)*.3);material.emissiveIntensity=(r.rend||0)>=3?1.5:.25;}
