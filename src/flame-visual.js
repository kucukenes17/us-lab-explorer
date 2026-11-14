import * as THREE from 'three';

// Authored illustration of a fabric flame front. The visual progression is NOT a measured spread rate.
export function createFlameVisual(scene,source){
 const group=new THREE.Group();group.visible=false;scene.add(group);
 const frameMaterial=new THREE.MeshStandardMaterial({color:0x68747b,metalness:.78,roughness:.38});
 const bar=(size,offset)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),frameMaterial);m.position.copy(source).add(new THREE.Vector3(...offset));group.add(m);};
 bar([.76,.022,.018],[0,-.008,-.166]);bar([.76,.022,.018],[0,-.008,.166]);
 bar([.018,.022,.35],[-.371,-.008,0]);bar([.018,.022,.35],[.371,-.008,0]);
 const progress={value:-.05},burning={value:0},clock={value:0};
 const clothMat=new THREE.MeshStandardMaterial({color:0xc4c1a8,roughness:.98,side:THREE.DoubleSide});
 clothMat.onBeforeCompile=shader=>{
  shader.uniforms.uBurn=progress;shader.uniforms.uBurning=burning;shader.uniforms.uFireClock=clock;
  shader.vertexShader='varying vec2 vFabricUv;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvFabricUv=uv;');
  shader.fragmentShader=`varying vec2 vFabricUv;uniform float uBurn;uniform float uBurning;uniform float uFireClock;float fabricHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float edge=uBurn+.014*sin(vFabricUv.y*26.)+.007*sin(vFabricUv.y*63.);
   float burnt=1.-smoothstep(edge-.007,edge+.014,vFabricUv.x);
   float weave=.88+.075*sin(vFabricUv.x*1100.)*sin(vFabricUv.y*620.);
   float grain=.9+.1*fabricHash(floor(vFabricUv*650.));
   diffuseColor.rgb*=mix(vec3(weave*grain),vec3(.035,.031,.027)*(weave+.15),burnt);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   float emberCell=fabricHash(floor(vFabricUv*vec2(145.,78.)));
   float nearFront=exp(-abs(vFabricUv.x-(edge-.025))*60.);
   float ember=step(.91,emberCell)*nearFront*uBurning*(.65+.35*sin(uFireClock*1.7+emberCell*60.));
   totalEmissiveRadiance+=vec3(1.8,.24,.018)*ember;
  `);
 };
 const cloth=new THREE.Mesh(new THREE.PlaneGeometry(.72,.31,1,1),clothMat);cloth.rotation.x=-Math.PI/2;cloth.position.copy(source);group.add(cloth);
 const light=new THREE.PointLight(0xff8c42,0,1.5,2);light.position.copy(source).add(new THREE.Vector3(-.2,.06,0));group.add(light);
 const uniforms={uClock:clock,uAmount:burning,uFront:{value:-.4},uInverseModel:{value:new THREE.Matrix4()}};
 const flameMat=new THREE.ShaderMaterial({
  uniforms,transparent:true,depthWrite:false,side:THREE.BackSide,
  vertexShader:`varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
   precision highp float;varying vec3 vLocal;uniform mat4 uInverseModel;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;uniform float uClock,uAmount,uFront;
   float hash(vec3 p){p=fract(p*.3183099+vec3(.17,.23,.31));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
   float fbm(vec3 p){return noise(p)*.64+noise(p*2.07)*.25+noise(p*4.13)*.11;}
   vec2 intersectBox(vec3 ro,vec3 rd){vec3 inv=1./rd;vec3 a=(-.5-ro)*inv,b=(.5-ro)*inv;vec3 lo=min(a,b),hi=max(a,b);return vec2(max(max(lo.x,lo.y),lo.z),min(min(hi.x,hi.y),hi.z));}
   void main(){
    if(uAmount<.001)discard;
    vec3 ro=(uInverseModel*vec4(cameraPosition,1.)).xyz,rd=normalize(vLocal-ro);
    vec2 bounds=intersectBox(ro,rd);float nearT=max(bounds.x,0.);if(bounds.y<=nearT)discard;
    float stepSize=(bounds.y-nearT)/64.;vec3 sum=vec3(0.);float alpha=0.;vec3 firstHit=vLocal;bool foundHit=false;
    for(int i=0;i<64;i++){
     vec3 p=ro+rd*(nearT+(float(i)+.5)*stepSize);
     float h=p.y+.5;
     float ripple=.016*sin(p.z*27.)+.008*sin(p.z*65.);
     float n=fbm(vec3(p.x*24.-uClock*.6,p.y*15.,p.z*24.+uClock*.15));
     float tongues=noise(vec3(p.z*18.,uClock*.65,1.7));
     float height=.27+.49*tongues+.12*sin(p.z*36.-uClock*1.3);
     float lean=.24*h;
     float waviness=(n-.5)*(.018+h*.15);
     float centre=uFront+ripple+lean+waviness;
     float thickness=.008+.018*(1.-h/max(height,.001));
     float sheet=max(0.,1.-abs(p.x-centre)/max(thickness,.006));
     float lateral=1.-smoothstep(.35,.40,abs(p.z));
     float top=1.-smoothstep(height-.1,height,h);
     float density=pow(sheet,.9)*lateral*top*smoothstep(0.,.025,h)*uAmount;
     density*=mix(1.,smoothstep(.25,.62,n),smoothstep(.12,.65,h)*.65);
     float a=1.-exp(-density*stepSize*57.);if(!foundHit&&a>.003){firstHit=p;foundHit=true;}
     vec3 tint=mix(vec3(.025,.13,.62),vec3(1.7,.32,.028),smoothstep(.045,.22,h));
     tint=mix(tint,vec3(2.2,1.1,.32),pow(sheet,5.)*.4*smoothstep(.10,.3,h));
     sum+=(1.-alpha)*tint*a;alpha+=(1.-alpha)*a;
     // A faint downstream plume follows the authored flow direction, not a universal upward axis.
     float smokeWindow=smoothstep(uFront+.10,uFront+.2,p.x)*(1.-smoothstep(.40,.5,p.x));
     float smoke=smokeWindow*smoothstep(.1,.3,h)*(1.-smoothstep(.65,.9,h))*lateral*smoothstep(.48,.7,n)*uAmount;
     float sa=1.-exp(-smoke*stepSize*1.5);sum+=(1.-alpha)*vec3(.13,.16,.19)*sa;alpha+=(1.-alpha)*sa;
     if(alpha>.98)break;
    }
    if(alpha<.003)discard;vec4 clip=projectionMatrix*modelViewMatrix*vec4(firstHit,1.);gl_FragDepth=(clip.z/clip.w)*.5+.5;gl_FragColor=vec4(sum/max(alpha,.001),alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const flame=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),flameMat);flame.scale.set(.82,.18,.39);flame.position.copy(source).add(new THREE.Vector3(0,.084,0));flame.renderOrder=5;group.add(flame);
 flame.onBeforeRender=()=>uniforms.uInverseModel.value.copy(flame.matrixWorld).invert();
 return {group,update(t){
  const age=THREE.MathUtils.clamp((t-60.027)/420,0,1);
  const intensity=THREE.MathUtils.smoothstep(t,60.027,69)*(1-THREE.MathUtils.smoothstep(t,480.054,496));
  clock.value=t;burning.value=intensity;progress.value=t<60.027?-.05:age;
  const front=(age-.5)*.72;
  uniforms.uFront.value=front/.82;
  light.position.x=source.x+front;light.intensity=intensity*.14*(.9+.1*Math.sin(t*2.3));
 }};
}
