import * as THREE from 'three';

// GPU-driven atmosphere. No image downloads, per-frame geometry allocation or fullscreen fog overlay.
export function createEclipseWorld({scene,player,sun,rim}) {
  const clock={value:0}, tint={value:new THREE.Color('#567c7e')};
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    uniforms:{time:clock,tint},vertexShader:`varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision highp float; varying vec3 vDirection; uniform float time; uniform vec3 tint;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    float fbm(vec2 p){return noise(p)*.5+noise(p*2.1)*.25+noise(p*4.3)*.125+noise(p*8.7)*.0625;}
    void main(){vec3 d=normalize(vDirection);float h=max(0.,d.y);vec3 col=mix(tint*.52,vec3(.018,.025,.044),smoothstep(0.,.7,h));
    vec2 uv=d.xz/(.3+max(d.y,0.));float cloud=fbm(uv*2.4+vec2(time*.009,time*.004));col+=vec3(.055,.065,.07)*smoothstep(.4,.75,cloud)*(1.-h*.55);
    vec3 eclipse=normalize(vec3(-.27,.30,-1.));float dist=length(d-eclipse);float halo=exp(-dist*15.)*.32;float corona=exp(-abs(dist-.095)*220.);float rays=(.75+.25*sin(atan(d.y-eclipse.y,d.x-eclipse.x)*35.+time*.08));col+=vec3(.93,.41,.14)*(halo+corona*rays);col=mix(col,vec3(.013,.019,.025),1.-smoothstep(.083,.089,dist));
    float stars=step(.9985,hash(floor(d.xz/max(.15,d.y)*600.)))*smoothstep(.2,.8,d.y);col+=stars*.18;gl_FragColor=vec4(col,1.);}`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(210,32,20),skyMat);sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);
  const mistMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{time:clock,tint},vertexShader:`varying vec2 vUv;varying vec3 world;void main(){vUv=uv;world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
    fragmentShader:`precision highp float;uniform float time;uniform vec3 tint;varying vec2 vUv;varying vec3 world;
    float hash(vec2 p){return fract(sin(dot(p,vec2(41.37,78.21)))*43758.54);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){float edge=pow(max(0.,1.-length((vUv-.5)*2.)),1.2);float f=n(world.xz*.13+time*.035)*.65+n(world.xz*.29-time*.018)*.35;float alpha=smoothstep(.3,.85,f)*edge*.13;gl_FragColor=vec4(tint*.85,alpha);}`});
  const mists=[];
  for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(45,37),mistMat);m.rotation.x=-Math.PI/2;m.position.set(Math.sin(i*2.4)*38,.25+(i%3)*.22,Math.cos(i*2.4)*38);scene.add(m);mists.push(m);}
  // Broken ceremonial obelisks outline the outer routes without blocking movement.
  const stone=new THREE.MeshStandardMaterial({color:'#344744',roughness:.9,metalness:.25});
  const trim=new THREE.MeshStandardMaterial({color:'#bca483',metalness:.65,roughness:.55});
  const shardGeo=new THREE.ConeGeometry(.7,5,4), runeGeo=new THREE.BoxGeometry(.025,.8,.025);
  const pillars=new THREE.InstancedMesh(shardGeo,stone,24),runes=new THREE.InstancedMesh(runeGeo,trim,72),o=new THREE.Object3D();
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=44+(i%3)*4;o.position.set(Math.sin(a)*r,2.1,Math.cos(a)*r);o.rotation.set((i%3-1)*.09,a,0);o.scale.setScalar(.7+(i%4)*.13);o.updateMatrix();pillars.setMatrixAt(i,o.matrix);for(let j=0;j<3;j++){o.position.y=1.3+j*.35;o.position.x+=Math.sin(a)*.02;o.position.z+=Math.cos(a)*.02;o.scale.set(1,.4,1);o.rotation.z=j%2?.5:-.5;o.updateMatrix();runes.setMatrixAt(i*3+j,o.matrix);}}
  pillars.castShadow=true;pillars.receiveShadow=true;scene.add(pillars,runes);
  const palettes=[{at:[0,0],fog:'#263c3c',tint:'#557878',sun:'#d4c7ad',rim:'#e47840'},{at:[-53,18],fog:'#2c344c',tint:'#777c9e',sun:'#bfc6e5',rim:'#8cb6cf'},{at:[53,-18],fog:'#49352e',tint:'#9c7160',sun:'#e5c2a0',rim:'#e06531'},{at:[15,62],fog:'#233d37',tint:'#578576',sun:'#b4d0bb',rim:'#7fbd9c'}];
  palettes.forEach(v=>{for(const k of ['fog','tint','sun','rim'])v[k]=new THREE.Color(v[k]);});
  const fogTarget=new THREE.Color(),tintTarget=new THREE.Color(),sunTarget=new THREE.Color(),rimTarget=new THREE.Color();
  function update(dt,time,quality){
    clock.value=time;sky.position.copy(player.root.position);sky.position.y=0;
    const p=player.root.position,weights=palettes.map(v=>1/Math.pow(12+Math.hypot(p.x-v.at[0],p.z-v.at[1]),3)),sum=weights.reduce((a,b)=>a+b,0);
    fogTarget.setRGB(0,0,0);tintTarget.setRGB(0,0,0);sunTarget.setRGB(0,0,0);rimTarget.setRGB(0,0,0);
    palettes.forEach((v,i)=>{const w=weights[i]/sum;const c=v.fog;fogTarget.r+=c.r*w;fogTarget.g+=c.g*w;fogTarget.b+=c.b*w;const t=v.tint;tintTarget.r+=t.r*w;tintTarget.g+=t.g*w;tintTarget.b+=t.b*w;const s=v.sun;sunTarget.r+=s.r*w;sunTarget.g+=s.g*w;sunTarget.b+=s.b*w;const r=v.rim;rimTarget.r+=r.r*w;rimTarget.g+=r.g*w;rimTarget.b+=r.b*w;});
    const blend=1-Math.exp(-Math.max(dt,.001)*.7);scene.fog.color.lerp(fogTarget,blend);tint.value.lerp(tintTarget,blend);sun.color.lerp(sunTarget,blend);rim.color.lerp(rimTarget,blend);
    mists.forEach((m,i)=>m.visible=quality!=='low'||i<3);
    // Shadow volume follows the hunter instead of remaining stranded at the cathedral.
    sun.position.set(p.x-20,36,p.z+12);sun.target.position.set(p.x,0,p.z);sun.target.updateMatrixWorld();
  }
  return {update};
}

// Analytic segment/cylinder test keeps the gameplay camera out of the cathedral columns.
export function safeCamera(look,desired,obstacles){
  const dx=desired.x-look.x,dz=desired.z-look.z,len2=dx*dx+dz*dz;
  if(len2<.01)return desired;
  let limit=1;
  for(const o of obstacles){const x=look.x-o.x,z=look.z-o.z,r=o.r+.38;if(x*x+z*z<r*r||look.y>18)continue;const b=x*dx+z*dz,c=x*x+z*z-r*r,disc=b*b-len2*c;if(disc<0)continue;const t=(-b-Math.sqrt(disc))/len2;if(t>0&&t<limit&&look.y+(desired.y-look.y)*t<(o.h||18))limit=Math.max(.12,t-.055);}
  return desired.lerpVectors(look,desired,limit);
}
