import { createFlameVisual } from './flame-visual.js';
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
 const visual=createFlameVisual(scene,source);const group=visual.group;

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
 function focusCamera(){travelTo([-1.05,.25,.35],[-.18,-.16,-.33]);}
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
  visual.update(t);
 }};
}
