import * as THREE from 'three';

const $=id=>document.getElementById(id);
const fmt=(n,d=1)=>Number.isFinite(n)?n.toLocaleString('tr-TR',{maximumFractionDigits:d,minimumFractionDigits:d}):'—';
const time=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
const investigations=[
 {id:'saffire',name:'Saffire-I',type:'Katı yakıt · kumaş',focus:['prevention'],place:'Cygnus · mikro yerçekimi',question:'Daha büyük bir kumaş numunesinde alev nasıl büyür?',conditions:'SIBAL kumaş; kontrollü hava akışı. Bu görünüm yalnızca Numune 1 kaydını içerir.',measure:'Termokupllar, O₂, CO₂, hava hızı, ateşleyici ve fan komutları.',limit:'US Lab yangınını veya başka malzemelerin yanmasını tahmin etmez.',source:'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',ready:true},
 {id:'bass',name:'BASS / BASS-II',type:'Katı yakıt · kumaş ve polimerler',focus:['prevention','suppression'],place:'ISS · Microgravity Science Glovebox',question:'Hava akışı ve deney koşulları katı yakıtın yanmasını nasıl değiştirir?',conditions:'Numune türü, geometrisi ve akış koşulları deneyden deneye değişir.',measure:'Alev görünümü, yayılma ve sönme davranışı.',limit:'Karşılaştırma yaparken numune ve test koşullarını eşleştirmek gerekir.',source:'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25'},
 {id:'same',name:'SAME / SAME-R',type:'Duman ve aerosol',focus:['detection'],place:'ISS · mikro yerçekimi',question:'Farklı malzemelerin ürettiği duman nasıl ölçülür?',conditions:'Uzay aracında kullanılan malzemeler kontrollü biçimde ısıtılır.',measure:'Duman parçacıklarının boyutu, dağılımı ve cihaz tepkileri.',limit:'Bir sensör sinyali, doğrulanmış bir erken uyarı modeli anlamına gelmez.',source:'https://psi.nasa.gov/physci/repo/data/investigations/PSI-101'},
 {id:'flex',name:'FLEX',type:'Sıvı yakıt · damlacık',focus:['suppression'],place:'ISS · CIR / MDCA',question:'Gazlı söndürücüler ve atmosfer koşulları sönme sınırını nasıl etkiler?',conditions:'Yakıt damlacıkları; değişen oksijen, basınç ve söndürücü karışımları.',measure:'Yanma ve sönme sınırları, damlacık davranışı.',limit:'Damlacık deneyinin sonucu doğrudan bir kablo veya kumaşa aktarılamaz.',source:'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69'}
];

export function createFireExperience({scene,enter,hidePanels,travelTo,onMode,stopMovement}){
 let active=false,playing=false,t=0,speed=5,data=null,pending=null,lastRow=-1,lastPhase='',visualTime=0;
 const source=new THREE.Vector3(-.18,-.22,-.33);
 const group=new THREE.Group();group.visible=false;scene.add(group);
 // An illustrative floating sample. No dimensions or material properties are inferred from the station model.
 const tray=new THREE.Mesh(new THREE.BoxGeometry(.43,.012,.25),new THREE.MeshStandardMaterial({color:0x273b45,metalness:.6,roughness:.48}));tray.position.copy(source);tray.position.y-=.03;group.add(tray);
 const cloth=new THREE.Mesh(new THREE.PlaneGeometry(.36,.2,12,8),new THREE.MeshStandardMaterial({color:0xc1af88,roughness:1,side:THREE.DoubleSide}));cloth.rotation.x=-Math.PI/2;cloth.position.copy(source);cloth.position.y-=.02;group.add(cloth);
 const light=new THREE.PointLight(0xff9b50,0,2,2);light.position.copy(source);group.add(light);
 const particles=[];
 const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 const fragment=`varying vec2 vUv;uniform vec3 tint;uniform float opacity;void main(){float d=length((vUv-.5)*2.);float a=pow(max(0.,1.-d),2.)*opacity;gl_FragColor=vec4(tint,a);}`;
 const geometry=new THREE.PlaneGeometry(1,1);
 const flameMaterial=new THREE.ShaderMaterial({vertexShader:vertex,transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{clock:{value:0},amount:{value:0}},fragmentShader:`
 varying vec2 vUv;uniform float clock;uniform float amount;
 float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.01)*.15;}
 void main(){vec2 uv=(vUv-.5)*2.;vec3 color=vec3(0.);float alpha=0.;
 for(int i=0;i<20;i++){float z=float(i)/19.*2.-1.;vec3 p=vec3(uv.x,uv.y*1.5,z*1.4);float n=fbm(p*4.-vec3(clock*.6,clock*.17,0.));float envelope=max(0.,1.-length(p));float density=smoothstep(.12,.65,envelope*.85+n*.55-.13);float a=density*.13*amount;vec3 hot=mix(vec3(.10,.35,.95),vec3(1.,.26,.025),smoothstep(.1,.42,density));hot=mix(hot,vec3(1.,.83,.37),smoothstep(.6,1.,density));color+=(1.-alpha)*hot*a;alpha+=(1.-alpha)*a;}
 if(alpha<.002)discard;gl_FragColor=vec4(color/max(alpha,.001),alpha);}`});
 const flame=new THREE.Mesh(new THREE.PlaneGeometry(.82,.58),flameMaterial);flame.position.copy(source).add(new THREE.Vector3(.15,.08,0));flame.renderOrder=6;group.add(flame);
 for(let i=0;i<126;i++){
  const smoke=i>=78;
  const mat=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{tint:{value:new THREE.Color(smoke?0x555c62:i%4===0?0x559eff:0xff8d36)},opacity:{value:0}},transparent:true,depthWrite:false,blending:smoke?THREE.NormalBlending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,mat);mesh.renderOrder=smoke?4:5;group.add(mesh);particles.push({mesh,smoke,seed:i*.61803398875%1,angle:i*2.39996});
 }

 function phase(){return t<60.027?'Ateşleme öncesi':t<68.013?'Ateşleyici etkin':t<480.054?'Yanma evresi · temsili':'Fan kapalı · kayıt sürüyor';}
 function renderResearch(){
  const focus=$('research-focus').value;
  const ordered=[...investigations].sort((a,b)=>Number(b.focus.includes(focus))-Number(a.focus.includes(focus)));
  $('research-cards').replaceChildren();
  for(const inv of ordered){
   const card=document.createElement('article');card.className='research-card';
   const direct=focus==='all'||inv.focus.includes(focus);
   card.innerHTML=`<div class="research-card-top"><span class="research-tag">${focus==='all'?inv.type:direct?'Doğrudan ilgili':'Tamamlayıcı'}</span><span>${inv.ready?'VERİ HAZIR':'KAYNAK REHBERİ'}</span></div><h3>${inv.name}</h3><p class="research-question">${inv.question}</p><dl><dt>Ortam</dt><dd>${inv.place}</dd><dt>Koşullar</dt><dd>${inv.conditions}</dd><dt>Ölçümler</dt><dd>${inv.measure}</dd></dl><p class="research-limit">${inv.limit}</p><a href="${inv.source}" target="_blank" rel="noopener noreferrer">NASA kaynağını incele ↗</a>`;
   if(inv.ready){const b=document.createElement('button');b.className='primary';b.textContent='Gerçek kaydı aç →';b.onclick=()=>{$('research-dialog').close();open();};card.append(b);}
   $('research-cards').append(card);
  }
 }
 $('research-focus').onchange=renderResearch;
 $('research-button').onclick=()=>{playing=false;stopMovement();$('research-dialog').showModal();renderResearch();};
 $('research-close').onclick=()=>$('research-dialog').close();
 $('fire-button').onclick=()=>active?close():open();
 $('fire-close').onclick=close;
 $('fire-play').onclick=()=>{if(!data)return;if(t>=data.sampling.endElapsedS)t=0;playing=!playing;render();};
 $('fire-reset').onclick=()=>{playing=false;t=0;render();};
 $('fire-speed').onchange=e=>speed=Number(e.target.value);
 $('fire-range').oninput=e=>{t=Number(e.target.value);render();};
 $('fire-focus').onclick=focusCamera;
 $('fire-collapse').onclick=()=>{const r=$('fire-readings');r.hidden=!r.hidden;$('fire-panel').classList.toggle('folded',r.hidden);$('fire-collapse').textContent=r.hidden?'Grafikleri göster +':'Grafikleri gizle −';$('fire-collapse').setAttribute('aria-expanded',String(!r.hidden));};
 $('fire-visual-toggle').onchange=e=>{group.visible=active&&e.target.checked;};
 document.querySelectorAll('[data-fire-time]').forEach(b=>b.onclick=()=>{t=Number(b.dataset.fireTime);playing=false;render();});
 $('fire-download').onclick=()=>{
  if(!data)return;const lines=[data.columns.map(c=>c.key).join(','),...data.rows.map(r=>r.join(','))];const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Saffire-I-Sample1-nearest-original-1s.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 function focusCamera(){travelTo([-1.05,.16,.34],[.06,-.14,-.33]);}
 async function load(){
  if(data)return;if(pending)return pending;
  pending=(async()=>{const r=await fetch('./assets/saffire-scenario.json');if(!r.ok)throw Error('Kayıt yüklenemedi');data=await r.json();if(data.schemaVersion!==1||!data.rows?.length)throw Error('Kayıt biçimi okunamadı');$('fire-range').max=data.sampling.endElapsedS;buildCharts();$('fire-loading').hidden=true;$('fire-content').hidden=false;render();})().catch(()=>{pending=null;data=null;lastRow=-1;$('fire-content').hidden=true;$('fire-loading').hidden=false;$('fire-loading').textContent='Kayıt yüklenemedi. Paneli kapatıp yeniden açabilirsin.';});return pending;
 }
 function open(){
  active=true;enter();hidePanels();onMode(true);group.visible=$('fire-visual-toggle').checked;$('fire-panel').hidden=false;$('fire-timeline').hidden=false;$('fire-context').hidden=false;$('fire-button').setAttribute('aria-pressed','true');focusCamera();load();
 }
 function close(){active=false;playing=false;group.visible=false;onMode(false);$('fire-panel').hidden=true;$('fire-timeline').hidden=true;$('fire-context').hidden=true;$('fire-button').setAttribute('aria-pressed','false');}
 const charts=[{key:'sampleTempC',index:2,label:'Numune sıcaklığı · TC9',unit:'°C',color:'#df9f62',digits:1},{key:'plumeTempC',index:3,label:'Sıcak gaz bölgesi · TC3',unit:'°C',color:'#dfc585',digits:1},{key:'oxygenPct',index:4,label:'Oksijen sensörü',unit:'%',color:'#76b6d3',digits:3},{key:'co2Pct',index:5,label:'Karbondioksit sensörü',unit:'%',color:'#9dbf9e',digits:3}];
 function buildCharts(){
  $('fire-charts').replaceChildren();
  charts.forEach(c=>{
   const col=data.columns.find(v=>v.key===c.key);const lo=col.originalRange[0],hi=col.originalRange[1],range=hi-lo||1;
   const points=data.rows.map(r=>`${(r[0]/data.sampling.endElapsedS*264).toFixed(2)},${(55-(r[c.index]-lo)/range*48).toFixed(2)}`).join(' ');
   const card=document.createElement('div');card.className='telemetry-card';card.style.setProperty('--trace',c.color);
   card.innerHTML=`<div class="telemetry-heading"><span>${c.label}</span><strong id="value-${c.key}">—</strong></div><svg viewBox="0 0 264 62" role="img" aria-label="${c.label} zaman serisi"><path d="M0 7H264M0 31H264M0 55H264" class="chart-grid"/><polyline points="${points}" class="chart-line"/><line class="chart-cursor" x1="0" x2="0" y1="0" y2="62"/><circle class="chart-dot" r="3" cx="0" cy="55"/></svg><div class="chart-axis"><span>${fmt(lo,c.digits)}–${fmt(hi,c.digits)} ${c.unit}</span><span>0–660 s</span></div>`;
   $('fire-charts').append(card);c.element=card;c.lo=lo;c.range=range;
  });
 }
 function render(){
  if(!data)return;$('fire-range').value=t;$('fire-time').textContent=`${time(t)} / ${time(data.sampling.endElapsedS)}`;$('fire-play').textContent=playing?'Ⅱ Duraklat':'▶ Oynat';
  const p=phase();if(p!==lastPhase){$('fire-phase').textContent=p;lastPhase=p;}
  let lo=0,hi=data.rows.length-1;while(lo<hi){const m=(lo+hi)>>1;if(data.rows[m][0]<t)lo=m+1;else hi=m;}let rowIndex=lo;if(lo>0&&Math.abs(data.rows[lo-1][0]-t)<Math.abs(data.rows[lo][0]-t))rowIndex=lo-1;
  const row=data.rows[rowIndex];const cursorX=t/data.sampling.endElapsedS*264;
  for(const c of charts){c.element.querySelector('.chart-cursor').setAttribute('x1',cursorX);c.element.querySelector('.chart-cursor').setAttribute('x2',cursorX);c.element.querySelector('.chart-dot').setAttribute('cx',row[0]/data.sampling.endElapsedS*264);c.element.querySelector('.chart-dot').setAttribute('cy',55-(row[c.index]-c.lo)/c.range*48);if(lastRow!==rowIndex)$(`value-${c.key}`).textContent=`${fmt(row[c.index],c.digits)} ${c.unit}`;}
  if(lastRow!==rowIndex){$('fire-air').textContent=`${fmt(row[6])} cm/s`;$('fire-current').textContent=`${fmt(row[7],3)} A`;$('fire-fan').textContent=row[8]===1?'Açık':'Kapalı';$('fire-sample').textContent=`Ölçüm: ${fmt(row[0],3)} s · Excel satırı ${row[1]}`;lastRow=rowIndex;}
 }
 return {get active(){return active;},close,update(dt,camera){
  if(!active)return;if(playing&&!document.querySelector('dialog[open]')){t=Math.min(t+dt*speed,data?.sampling.endElapsedS??0);if(data&&t>=data.sampling.endElapsedS)playing=false;render();}
  visualTime=t;
  const ignition=THREE.MathUtils.smoothstep(t,60.027,76);
  const fade=1-THREE.MathUtils.smoothstep(t,480.054,505);
  const strength=ignition*fade;
  // This visual envelope is authored, not inferred from temperatures or used as a propagation model.
  light.intensity=strength*.7;cloth.material.color.setRGB(.66-strength*.38,.58-strength*.38,.43-strength*.3);flame.quaternion.copy(camera.quaternion);flameMaterial.uniforms.clock.value=visualTime;flameMaterial.uniforms.amount.value=strength;
  for(const p of particles){
   const cycle=(p.seed+visualTime*(p.smoke?.055:.35))%1;
   const width=p.smoke?.12+cycle*.25:.04+cycle*.09;
   const x=source.x+cycle*(p.smoke?1.1:.42),y=source.y+Math.sin(p.angle+cycle*3)*width,z=source.z+Math.cos(p.angle+cycle*2)*width;
   p.mesh.position.set(x,y,z);p.mesh.quaternion.copy(camera.quaternion);const size=p.smoke?.2+cycle*.38:.11+(1-cycle)*.1;p.mesh.scale.setScalar(size);
   p.mesh.material.uniforms.opacity.value=strength*(p.smoke?.13:.1)*Math.sin(Math.PI*cycle);
  }
 }};
}
