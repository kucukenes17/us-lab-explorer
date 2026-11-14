import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = (id) => document.getElementById(id);
const icons = {
 arrow:'M4 12h16m-6-6 6 6-6 6',right:'m9 5 7 7-7 7',left:'m15 5-7 7 7 7',up:'m5 15 7-7 7 7',down:'m5 9 7 7 7-7',
 close:'m6 6 12 12M6 18 18 6',expand:'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6',
 info:'M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 help:'M9 9a3 3 0 1 1 5 2.24c-1.2.8-2 1.2-2 2.76m0 3v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 home:'m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7',
 cube:'m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 10v8M3 8l9 5 9-5',
 layers:'m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',
 search:'M20 20l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
 focus:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 route:'M5 6a2 2 0 1 1 0 .01M19 18a2 2 0 1 1 0 .01M7 6h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h8',
 spark:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
 hand:'M8 12V5a2 2 0 0 1 4 0v6-7a2 2 0 0 1 4 0v7-4a2 2 0 0 1 4 0v8c0 4-2 7-6 7h-2c-2 0-3-1-4-3l-4-6a2 2 0 0 1 3-2l1 1',
 cursor:'m5 3 14 10-7 1-3 7L5 3Z',external:'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
 bike:'M9 17a4 4 0 1 1-8 0 4 4 0 0 1 8 0m14 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0M5 17l5-9 5 9H5m5-9h7l2 9M8 5h5m4-2h3v5',
 cable:'M6 3v5a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v5M3 3h6m6 18h6M5 1v2m2-2v2m10 18v2m2-2v2',
 rack:'M4 3h16v18H4V3Zm0 6h16M4 15h16M8 6h2m-2 6h2m-2 6h2',
 light:'M8 16c0-3-3-4-3-8a7 7 0 0 1 14 0c0 4-3 5-3 8H8Zm0 3h8m-6 3h4',
 hatch:'M6 3h12l3 3v12l-3 3H6l-3-3V6l3-3Zm2 4h8v10H8V7m5 5h1',
 screen:'M3 4h18v13H3V4Zm9 13v4m-5 0h10',
 camera:'M3 6h5l2-3h4l2 3h5v15H3V6Zm13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 frame:'M3 3h18v18H3V3m4 0v18M17 3v18M3 7h18M3 17h18'
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]||icons.cube}"/></svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));

const state={ready:false,entered:false,selected:null,hover:null,filter:'all',query:'',quality:'high',route:true,visited:new Set(),yaw:-Math.PI/2,pitch:0,targetYaw:-Math.PI/2,targetPitch:0,travel:null};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const touch=matchMedia('(pointer: coarse)').matches;
const compact=()=>touch||innerWidth<=760;
const keys=new Set();const held=new Set();
const meshes=[];const parts=[];const byName=new Map();let metadata,renderer,composer,outline,camera,scene;
let lastFrame=performance.now(),hoverTime=0,toastTimer,hoverPoint=new THREE.Vector3();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),moveRay=new THREE.Raycaster();
const velocity=new THREE.Vector3(),desired=new THREE.Vector3();
const minBounds=new THREE.Vector3(-3.15,-.45,-.4),maxBounds=new THREE.Vector3(3.15,.45,.4);
const initialPosition=new THREE.Vector3(-2.85,.03,0);

const stops=[
 {name:'CEVIS.Bike',title:'CEVIS bisikleti',sub:'Hareket ve egzersiz',icon:'bike',pos:[.25,.04,.18],target:[1.1,-.58,-.67]},
 {name:'EXPRESS_Racks_ATLAS_11B_Generic_Locker_01',title:'Deney bölmeleri',sub:'Modüler ekipman düzeni',icon:'rack',pos:[-1.15,.15,.05],target:[-.74,.7,-1.28]},
 {name:'US_Lab_Int_MSS_AV_Wires',title:'Kablo grubu',sub:'Bağlantıları takip et',icon:'cable',pos:[-.7,.05,-.12],target:[.05,-.09,.87]},
 {name:'US_Lab_Int_Lights_Emissive',title:'Aydınlatma',sub:'Modüle farklı açıdan bak',icon:'light',pos:[-1.7,-.1,0],target:[-.9,1.06,0]},
 {name:'US_Lab_Int_FWD_Bulkhead',title:'Ön geçiş bölgesi',sub:'Laboratuvarın sınırı',icon:'hatch',pos:[2.65,.03,0],target:[3.7,0,0]}
];

function describe(name){
 let title='Ekipman parçası',description='US Lab iç mekân modelinde ayrı seçilebilen bir ekipman parçası.',category='Ekipman',glyph='cube',group='equipment';
 if(name==='CEVIS.Bike'){title='CEVIS egzersiz bisikleti';description='Astronotların mikro yerçekiminde bisiklet egzersizi yapmasına yardımcı olan düzenek. Modüldeki bağlantı yapısını farklı açılardan inceleyebilirsin.';category='Mürettebat ekipmanı';glyph='bike';}
 else if(/Cevis.Mount/i.test(name)){title='CEVIS bağlantı düzeneği';description='Egzersiz bisikletini çevresindeki yapıya bağlayan bölümün modeldeki temsili.';glyph='bike';}
 else if(/Wires/i.test(name)){title='Kablo grubu';description='Ekipmanlar arasında uzanan kablolar. Bu seçimin altında, modelde birlikte gruplanmış birden fazla bağlantı bulunabilir.';category='Bağlantılar';glyph='cable';}
 else if(/Generic_Locker/i.test(name)){const n=name.match(/_(\d+)$/)?.[1]||'';title=`Deney bölmesi ${n}`;description='EXPress raf düzeni içindeki modüler ekipman bölmesi. Çevresindeki benzer bölmeleri de ayrı ayrı seçebilirsin.';category='Deney donanımı';glyph='rack';}
 else if(/_Base$/.test(name)){title='EXPRESS deney rafı';description='Bilimsel deney donanımlarının yerleştirildiği raf düzeninin modeldeki temsili.';category='Deney donanımı';glyph='rack';}
 else if(/Drawer/i.test(name)){title='Ekipman çekmecesi';description='Deney rafındaki çekmece biriminin modeldeki görünümü.';category='Deney donanımı';glyph='rack';}
 else if(/Lights/i.test(name)){title=/EndCaps/.test(name)?'Aydınlatma uç parçaları':'Aydınlatma grubu';description='Laboratuvar boyunca uzanan aydınlatma elemanları. Seçilen geometri birden fazla ışık elemanını birlikte içerir.';category='İç mekân';glyph='light';group='structure';}
 else if(/Bulkhead/.test(name)){title=/FWD/.test(name)?'Ön geçiş bölgesi':'Arka geçiş bölgesi';description='Laboratuvarın ucunu çevreleyen iç yapı ve geçiş açıklığı. Bu deneyimde keşif alanı US Lab ile sınırlı.';category='Modül yapısı';glyph='hatch';group='structure';}
 else if(/WORF/.test(name)){title='WORF kamera bağlantısı';description='Dünya gözlemi için kullanılan WORF düzeninin modeldeki kamera bağlantı parçası.';category='Gözlem ekipmanı';glyph='camera';}
 else if(/MainFrame/.test(name)){title='Modül taşıyıcı çerçevesi';description='İç mekânın kenarları boyunca uzanan yapısal çerçeve. Bazı elemanlar aynı model parçası altında birleştirilmiş.';category='Modül yapısı';glyph='frame';group='structure';}
 else if(/Int_Racks/.test(name)){title=`Ekipman rafları ${name.slice(-3)}`;description='Modülün iç yüzeylerini çevreleyen ekipman bölmeleri. Bu model parçası birden fazla panel ve bölmeyi birlikte kapsar.';category='İç mekân';glyph='rack';group='structure';}
 else if(/Elbow_Screens/.test(name)){title='Köşe paneli';description='Modülün yan bölümündeki panel grubunun modeldeki görünümü.';category='İç mekân';glyph='screen';}
 else if(/Elbows/.test(name)){title='Köşe bağlantıları';description='Yan bölümdeki ekipmanların çevresinde bulunan bağlantı elemanları.';category='Modül yapısı';glyph='frame';group='structure';}
 else if(/Metals/.test(name)){title='Yapısal elemanlar';description='Modelde bir grup olarak tanımlanmış iç mekân parçaları. Görsel malzeme adı, gerçek alaşım veya kimyasal bileşim bilgisi değildir.';category='Modül yapısı';glyph='frame';group='structure';}
 else if(/Patches/.test(name)){title='Görev armaları';description='Laboratuvarın iç yüzeyindeki arma ve işaretlerin modeldeki temsili.';category='İç mekân';glyph='spark';group='structure';}
 else if(/MSS_AV$/.test(name)){title='Ekipman grubu';description='Laboratuvarın içindeki ekran ve bağlantı düzeninin modelde birlikte gruplanmış görünümü.';glyph='screen';}
 else {const simple=name.replace(/^EXPRESS_Racks_ATLAS_(?:\d+_)?/,'').replaceAll('_',' ').replace(/\s+/g,' ').trim();title=simple||title;description='NASA iç mekân modelindeki bu donanım, özgün parça adıyla gösteriliyor. Çevresindeki raf ve bağlantıları da inceleyebilirsin.';category='Deney donanımı';glyph='rack';}
 return {title,description,category,icon:glyph,group};
}

function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
function modalOpen(){return !!document.querySelector('dialog[open]');}
function stopMovement(){keys.clear();held.clear();velocity.set(0,0,0);document.querySelectorAll('[data-move]').forEach(b=>b.classList.remove('pressed'));}
function showDialog(id){stopMovement();state.travel=null;$(id).showModal();}
$('help-button').onclick=()=>showDialog('help-dialog');$('info-button').onclick=()=>showDialog('info-dialog');
$('retry-button').onclick=()=>location.reload();
$('fullscreen-button').onclick=async()=>{try {if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Bu tarayıcı tam ekranı desteklemiyor.');}catch{toast('Tam ekran açılamadı; keşfe bu görünümde devam edebilirsin.');}};
document.addEventListener('fullscreenchange',()=>$('fullscreen-button').setAttribute('aria-label',document.fullscreenElement?'Tam ekrandan çık':'Tam ekran'));

function enter(){if(!state.ready)return;state.entered=true;$('welcome').hidden=true;$('hud').hidden=false;$('explore-hint').hidden=false;setRoute(!compact());renderer.domElement.focus({preventScroll:true});}
$('enter-button').onclick=enter;
function setRoute(visible){state.route=visible;$('route').hidden=!visible||!state.entered;$('route-button').setAttribute('aria-pressed',String(visible));if(visible)$('inventory').hidden=true;}
$('route-button').onclick=()=>{if(compact()&&!state.route)closeSelection();setRoute(!state.route);};
function showInventory(){if(!state.ready)return;setRoute(false);if(compact())closeSelection();$('inventory').hidden=false;renderInventory();$('part-search').focus();}
$('inventory-button').onclick=showInventory;$('inventory-close').onclick=()=>{$('inventory').hidden=true;setRoute(true);};
$('part-search').addEventListener('input',e=>{state.query=e.target.value.toLocaleLowerCase('tr');renderInventory();});
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderInventory();});

function renderInventory(){
 const items=parts.filter(m=>{const d=m.userData.description;return (state.filter==='all'||d.group===state.filter)&&`${d.title} ${m.userData.sourceName}`.toLocaleLowerCase('tr').includes(state.query);}).sort((a,b)=>a.userData.description.title.localeCompare(b.userData.description.title,'tr'));
 $('parts-list').replaceChildren();
 for(const m of items){const d=m.userData.description;const b=document.createElement('button');b.dataset.part=String(m.userData.index);b.className='part-row'+(state.selected===m?' selected':'');b.innerHTML=`<span>${icon(d.icon)}</span><span><strong></strong><small></small></span>`;b.querySelector('strong').textContent=d.title;b.querySelector('small').textContent=d.category;b.onclick=()=>{select(m);if(compact())$('inventory').hidden=true;};$('parts-list').append(b);}
 if(!items.length){const p=document.createElement('p');p.className='empty-search';p.textContent='Bu aramada parça bulunamadı.';$('parts-list').append(p);}
 $('search-count').textContent=`${items.length} / ${parts.length} model parçası`;
}
function makeStops(){
 stops.forEach((s,i)=>{const b=document.createElement('button');b.className='route-stop';b.dataset.stop=String(i);b.innerHTML=`<span class="stop-number">${String(i+1).padStart(2,'0')}</span><span class="stop-copy"><strong>${s.title}</strong><small>${s.sub}</small></span><span class="stop-arrow">${icon('arrow')}</span>`;b.onclick=()=>{const mesh=byName.get(s.name);if(mesh){select(mesh);travelTo(s.pos,s.target);}else toast('Bu parça modelde bulunamadı.');};$('route-stops').append(b);});
}
function select(mesh){
 state.selected=mesh;state.hover=null;state.travel=null;stopMovement();$('hover-label').hidden=true;
 const d=mesh.userData.description;$('detail-title').textContent=d.title;$('detail-description').textContent=d.description;$('detail-category').textContent=d.category;$('detail-icon').innerHTML=icon(d.icon);$('detail-number').textContent=`USL / ${String(mesh.userData.index+1).padStart(2,'0')}`;$('detail-source').textContent=mesh.userData.sourceName;$('detail').hidden=false;
 if(compact()){setRoute(false);$('inventory').hidden=true;}
 const stopIndex=stops.findIndex(s=>s.name===mesh.userData.sourceName);if(stopIndex>=0)state.visited.add(stopIndex);
 document.querySelectorAll('[data-stop]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.stop)===stopIndex);b.classList.toggle('visited',state.visited.has(Number(b.dataset.stop)));});
 $('visited-count').textContent=`${state.visited.size} / ${stops.length}`;updateOutline();document.querySelectorAll('[data-part]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.part)===mesh.userData.index));
}
function closeSelection(){state.selected=null;state.hover=null;$('detail').hidden=true;$('selection-pin').hidden=true;document.querySelectorAll('[data-stop]').forEach(b=>b.classList.remove('selected'));updateOutline();}
$('detail-close').onclick=closeSelection;
function updateOutline(){if(outline)outline.selectedObjects=state.selected?[state.selected]:state.hover?[state.hover]:[];}

function anglesTo(position,target){const dir=new THREE.Vector3(...target).sub(position).normalize();return {yaw:Math.atan2(-dir.x,-dir.z),pitch:Math.asin(THREE.MathUtils.clamp(dir.y,-1,1))};}
function shortestAngle(from,to){return from+Math.atan2(Math.sin(to-from),Math.cos(to-from));}
function travelTo(pos,target){
 stopMovement();const end=new THREE.Vector3(...pos).clamp(minBounds,maxBounds);const angles=anglesTo(end,target);
 if(reducedMotion.matches){camera.position.copy(end);state.yaw=state.targetYaw=angles.yaw;state.pitch=state.targetPitch=angles.pitch;state.travel=null;return;}
 state.travel={start:camera.position.clone(),end,startYaw:state.yaw,endYaw:shortestAngle(state.yaw,angles.yaw),startPitch:state.pitch,endPitch:angles.pitch,t:0,duration:1.15};
}
$('focus-button').onclick=()=>{if(!state.selected)return;const m=state.selected;const stop=stops.find(s=>s.name===m.userData.sourceName);if(stop)travelTo(stop.pos,stop.target);else {const c=m.userData.center.clone();let p=c.clone();p.x=THREE.MathUtils.clamp(c.x-.65,-2.9,2.9);p.y=THREE.MathUtils.clamp(c.y*.15,-.15,.2);p.z=0;travelTo(p.toArray(),c.toArray());}};
function home(){closeSelection();$('inventory').hidden=true;travelTo(initialPosition.toArray(),[3.1,.03,0]);toast('Başlangıç konumuna dönüyorsun.');}
$('home-button').onclick=home;
$('quality-button').onclick=()=>{state.quality=state.quality==='high'?'balanced':'high';$('quality-label').textContent=state.quality==='high'?'Yüksek':'Dengeli';resize();toast(state.quality==='high'?'Yüksek görüntü kalitesi':'Dengeli görüntü kalitesi · daha düşük grafik yükü');};

const moveCodes={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyQ:'down',KeyE:'up'};
window.addEventListener('keydown',e=>{
 if(!state.entered||modalOpen())return;
 if(e.code==='Escape'){closeSelection();$('inventory').hidden=true;stopMovement();state.travel=null;renderer.domElement.focus({preventScroll:true});return;}
 if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))return;
 if(moveCodes[e.code]){e.preventDefault();keys.add(moveCodes[e.code]);state.travel=null;}
 if(e.code==='KeyR'&&!e.repeat)home();
 if(e.code==='Escape'){closeSelection();$('inventory').hidden=true;stopMovement();state.travel=null;}
});
window.addEventListener('keyup',e=>{if(moveCodes[e.code])keys.delete(moveCodes[e.code]);});
window.addEventListener('blur',stopMovement);document.addEventListener('visibilitychange',()=>{stopMovement();lastFrame=performance.now();});
document.querySelectorAll('[data-move]').forEach(b=>{
 b.addEventListener('pointerdown',e=>{e.preventDefault();state.travel=null;held.add(b.dataset.move);b.classList.add('pressed');b.setPointerCapture(e.pointerId);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{held.delete(b.dataset.move);b.classList.remove('pressed');});
 b.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();held.add(b.dataset.move);state.travel=null;}});b.addEventListener('keyup',()=>held.delete(b.dataset.move));b.addEventListener('blur',()=>held.delete(b.dataset.move));
});

function setupPointer(){
 const canvas=renderer.domElement;let drag=null;let lastPointer={x:0,y:0};
 canvas.addEventListener('pointerdown',e=>{if(!state.entered||modalOpen()||drag||e.button!==0)return;canvas.focus({preventScroll:true});state.travel=null;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:0};canvas.setPointerCapture(e.pointerId);$('hover-label').hidden=true;});
 canvas.addEventListener('pointermove',e=>{lastPointer={x:e.clientX,y:e.clientY};if(!state.entered)return;if(drag&&drag.id===e.pointerId){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);state.targetYaw-=dx*.0032;state.targetPitch=THREE.MathUtils.clamp(state.targetPitch-dy*.0032,-1.38,1.38);drag.x=e.clientX;drag.y=e.clientY;state.hover=null;updateOutline();}else if(performance.now()-hoverTime>70&&!touch){hoverTime=performance.now();pick(e.clientX,e.clientY,false);}});
 canvas.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;const moved=drag.moved;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(moved<6)pick(e.clientX,e.clientY,true);});
 canvas.addEventListener('pointercancel',()=>{drag=null;});canvas.addEventListener('lostpointercapture',()=>{drag=null;});
 canvas.addEventListener('pointerleave',()=>{if(!drag){state.hover=null;$('hover-label').hidden=true;updateOutline();}});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 function pick(x,y,click){
  if(modalOpen()||!state.ready)return;pointer.set(x/window.innerWidth*2-1,-y/window.innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes,false)[0];
  if(hit){if(click){select(hit.object.userData.part);hoverPoint.copy(hit.point);}else{state.hover=hit.object.userData.part;$('hover-text').textContent=hit.object.userData.part.userData.description.title;$('hover-label').hidden=false;$('hover-label').style.left=`${Math.min(x+17,window.innerWidth-270)}px`;$('hover-label').style.top=`${Math.min(y+20,window.innerHeight-160)}px`;}}else{state.hover=null;$('hover-label').hidden=true;if(click)closeSelection();}updateOutline();
 }
}

function canMove(from,delta){
 if(delta.lengthSq()<1e-9)return true;
 moveRay.set(from,delta.clone().normalize());moveRay.far=delta.length()+.14;
 return moveRay.intersectObjects(meshes,false).length===0;
}
function updateMotion(dt){
 if(!state.entered||modalOpen())return;
 if(state.travel){const t=state.travel;t.t+=dt;const a=Math.min(t.t/t.duration,1);const ease=a*a*(3-2*a);camera.position.lerpVectors(t.start,t.end,ease);state.yaw=state.targetYaw=THREE.MathUtils.lerp(t.startYaw,t.endYaw,ease);state.pitch=state.targetPitch=THREE.MathUtils.lerp(t.startPitch,t.endPitch,ease);if(a===1)state.travel=null;}
 else{
  state.yaw=THREE.MathUtils.damp(state.yaw,state.targetYaw,22,dt);state.pitch=THREE.MathUtils.damp(state.pitch,state.targetPitch,22,dt);
  const pressed=(k)=>keys.has(k)||held.has(k);let f=Number(pressed('forward'))-Number(pressed('back')),s=Number(pressed('right'))-Number(pressed('left')),v=Number(pressed('up'))-Number(pressed('down'));
  desired.set(-Math.sin(state.yaw)*f+Math.cos(state.yaw)*s,v,-Math.cos(state.yaw)*f-Math.sin(state.yaw)*s);if(desired.lengthSq()>1)desired.normalize();desired.multiplyScalar(.85);
  velocity.lerp(desired,1-Math.exp(-dt*12));
  const delta=velocity.clone().multiplyScalar(dt);
  for(const axis of ['x','y','z']){const step=new THREE.Vector3();step[axis]=delta[axis];if(canMove(camera.position,step))camera.position.add(step);else velocity[axis]=0;}
  camera.position.clamp(minBounds,maxBounds);
 }
 camera.rotation.set(state.pitch,state.yaw,0,'YXZ');
 $('map-marker').style.left=`${THREE.MathUtils.clamp((camera.position.x+3.15)/6.3*100,3,97)}%`;
 $('map-marker').firstElementChild.style.transform=`rotate(${(-state.yaw-Math.PI/2)*180/Math.PI}deg)`;
 $('position-label').textContent=camera.position.x<-1.5?'Arka bölüm':camera.position.x>1.5?'Ön bölüm':'Merkez';
 for(const b of document.querySelectorAll('[data-move]'))b.classList.toggle('pressed',pressedKey(b.dataset.move));
}
function pressedKey(k){return keys.has(k)||held.has(k);}
function resize(){if(!renderer)return;const w=innerWidth,h=innerHeight;const dpr=Math.min(devicePixelRatio,state.quality==='high'?1.65:1);renderer.setPixelRatio(dpr);renderer.setSize(w,h);composer.setPixelRatio(dpr);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);

function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastFrame)/1000,.045);lastFrame=now;if(document.hidden||!state.ready)return;updateMotion(dt);
 if(state.selected&&state.entered){const p=state.selected.userData.center.clone().project(camera);const visible=p.z>-1&&p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1;$('selection-pin').hidden=!visible;if(visible){$('selection-pin').style.left=`${(p.x*.5+.5)*innerWidth}px`;$('selection-pin').style.top=`${(-p.y*.5+.5)*innerHeight}px`;}}
 composer.render();
}

async function init(){
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.setClearColor(0x1a2933);
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D sahne. Sürükleyerek bak, WASD ile hareket et, parçaya tıklayarak seç.');$('viewport').append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stopMovement();showError('Grafik bağlantısı kesildi. Yeniden yükleyerek devam edebilirsin.');});
  scene=new THREE.Scene();scene.background=new THREE.Color(0x13222e);camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.035,45);camera.position.copy(initialPosition);camera.rotation.set(0,-Math.PI/2,0,'YXZ');
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.32;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf2f8ff,0x8698a5,.75));scene.add(new THREE.AmbientLight(0xffffff,.22));
  for(const x of [-2.7,-1.35,0,1.35,2.7]){const light=new THREE.PointLight(0xf6f6ec,1.5,4,1.5);light.position.set(x,.72,0);scene.add(light);}
  const fill=new THREE.PointLight(0xdceeff,.7,5,1);fill.position.set(-2.8,0,0);scene.add(fill);
  composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));outline=new OutlinePass(new THREE.Vector2(innerWidth,innerHeight),scene,camera);outline.edgeStrength=3;outline.edgeGlow=.1;outline.edgeThickness=1;outline.visibleEdgeColor.set('#efbc64');outline.hiddenEdgeColor.set('#665235');outline.pulsePeriod=0;composer.addPass(outline);composer.addPass(new OutputPass());resize();
  const metaResponse=await fetch('./assets/us-lab-metadata.json');if(!metaResponse.ok)throw new Error('Model bilgisi yüklenemedi.');metadata=await metaResponse.json();
  const gltf=await new GLTFLoader().loadAsync('./assets/us-lab.glb',e=>{if(e.total){const percent=Math.round(e.loaded/e.total*93);$('load-progress').style.width=`${percent}%`;$('load-status').textContent=`US Lab iç mekânı yükleniyor · %${percent}`;}});
  const descriptions=new Map(metadata.items.map(i=>[i.name,i]));
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(part=>{
   const name=part.userData.source_name;if(!name||!descriptions.has(name))return;
   const meta=descriptions.get(name);part.userData.sourceName=name;part.userData.description=describe(name);part.userData.index=parts.length;part.userData.center=new THREE.Vector3(...meta.center);
   parts.push(part);byName.set(name,part);
   part.traverse(o=>{if(!o.isMesh)return;o.userData.part=part;meshes.push(o);o.frustumCulled=true;
    const materials=Array.isArray(o.material)?o.material:[o.material];for(const mat of materials){if(mat.map)mat.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(/Lights/i.test(name)&&mat.emissive)mat.emissiveIntensity=Math.min(mat.emissiveIntensity,1.3);}
   });
  });
  scene.add(gltf.scene);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  if(meshes.length<10)throw new Error('Model parçaları okunamadı.');
  $('part-count').textContent=String(parts.length);makeStops();setupPointer();$('load-progress').style.width='100%';$('load-status').textContent='Son ayrıntılar hazırlanıyor';
  await renderer.compileAsync(scene,camera);composer.render();state.ready=true;$('loading').hidden=true;$('welcome').hidden=false;requestAnimationFrame(frame);
  // A compact read-only status lets diagnostics verify the loaded asset without exposing controls.
  Object.defineProperty(window,'explorerStatus',{get:()=>({ready:state.ready,entered:state.entered,partCount:parts.length,meshCount:meshes.length,selected:state.selected?.userData.sourceName??null,position:camera.position.toArray(),quality:state.quality,triangles:renderer.info.render.triangles})});
 }catch(error){console.error('US Lab initialization:',error);showError(error.message?.includes('WebGL')?'Bu cihazda WebGL açılamadı. Donanım hızlandırması olan güncel bir tarayıcıyla deneyebilirsin.':'İç mekân yüklenemedi. Bağlantını kontrol edip yeniden deneyebilirsin.');}
}
function showError(message){$('loading').hidden=false;$('loading').querySelector('h1').textContent='Keşfe kısa bir ara.';$('load-status').textContent=message;$('retry-button').hidden=false;$('retry-button').style.marginTop='25px';}
init();
