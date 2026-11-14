const $=id=>document.getElementById(id);
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const conditionValue=c=>`${c.value}${c.unit?' '+c.unit:''}`;
const saffire={id:'saffire-i-sample1',title:'Saffire-I · Numune 1',experiment:'Saffire-I',material:'SIBAL',materialOriginal:'%75 pamuk / %25 cam elyaf (kütlece)',category:'solid-fuel-combustion',platform:'Cygnus · ISS’den ayrıldıktan sonra',geometryType:'fabric',telemetryFile:'saffire-scenario.json',chartKeys:['sampleTempC','plumeTempC','oxygenPct','co2Pct'],sourceUrl:'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',evidence:{hasTelemetry:true,description:'NASA kalibre edilmiş sensör kaydı; 20.000 özgün satırdan 665 örnek.'},conditions:[{label:'Numune',value:'SIBAL · pamuk–cam elyaf kumaş'},{label:'Boyut',value:'94 × 40,6 cm'},{label:'Nominal başlangıç akışı',value:20,unit:'cm/s'},{label:'Ateşleyici akımı',value:'60,027–68,013 s'},{label:'Fan güç komutu kapandı',value:480.054,unit:'s'}],limitations:['Saffire-I, US Lab’da değil Cygnus uzay aracında yürütüldü. Konum ve 3D numune ölçeği temsilidir.','Sensörler kendi ölçüm noktalarını gösterir; kabinin tamamının sıcaklığı değildir.','Her saniyeye en yakın özgün satır ve kontrol geçişleri korunur. Seyrek görünüm kısa tepe değerlerini kaçırabilir.','Alevin yayılımı temsili animasyondur. Fanın kapanması ölçülüdür; animasyondaki sönme zamanı bir ölçüm değildir.']};
let promise;
export function loadCatalog(){return promise??=(async()=>{try{const r=await fetch('./assets/experiment-catalog.json');if(!r.ok)throw Error('Katalog yüklenemedi');const j=await r.json();if(!Array.isArray(j.records))throw Error('Katalog biçimi hatalı');return [saffire,...j.records].map(r=>({...r,focus:r.category.includes('smoke')?['detection']:['prevention',...(JSON.stringify(r.rawTableFields??{}).includes('blowoff')?['suppression']:[])],kind:r.evidence.hasTelemetry?'telemetry':r.evidence.hasRecordedVideo?'video':'metadata'}));}catch(e){promise=null;throw e;}})();}
export function createCatalog({onSelect,onOpen,onClose}){
 let records=[],chosen=new Set(),showComparison=false;
 const dialog=$('research-dialog');
 const kindLabel=r=>({telemetry:'ÖLÇÜM SERİSİ',video:'DENEY VİDEOSU',metadata:'DENEY KOŞULLARI'}[r.kind]);
 function render(){
  const q=$('research-search').value.toLocaleLowerCase('tr').trim(),purpose=$('research-focus').value,material=$('research-material').value,kind=$('research-kind').value;
  const filtered=records.filter(r=>(purpose==='all'||r.focus.includes(purpose))&&(material==='all'||r.material===material)&&(kind==='all'||r.kind===kind)&&(!q||`${r.title} ${r.materialOriginal} ${r.category.includes('smoke')?'duman algılama':'yanma'} ${r.conditions.map(c=>c.label+' '+c.value).join(' ')}`.toLocaleLowerCase('tr').includes(q)));
  $('catalog-count').textContent=`${filtered.length} kayıt · ${new Set(filtered.map(r=>r.experiment)).size} deney ailesi`;
  $('research-cards').replaceChildren();
  for(const r of filtered){const card=document.createElement('article');card.className='experiment-card';
   const badge=r.kind==='telemetry'?'series':r.kind==='video'?'video':'metadata';
   const summary=r.conditions.filter(c=>!['Numune','Malzeme'].includes(c.label)).slice(0,3);
   card.innerHTML=`<div class="experiment-card-top"><span>${escapeHTML(r.experiment)} <b>/</b> ${escapeHTML(r.testId??'01')}</span><span class="evidence-badge ${badge}">${kindLabel(r)}</span></div><h3>${escapeHTML(r.material)}</h3><p class="sample-description">${escapeHTML(r.materialOriginal)}</p><dl>${summary.map(c=>`<div><dt>${escapeHTML(c.label)}</dt><dd>${escapeHTML(conditionValue(c))}</dd></div>`).join('')}</dl><div class="experiment-card-bottom"><label><input type="checkbox" aria-label="${escapeHTML(r.title)} karşılaştır" ${chosen.has(r.id)?'checked':''}> Karşılaştır</label><button class="open-experiment" aria-label="${escapeHTML(r.title)} kaydını aç">Kaydı aç ↗</button></div>`;
   card.querySelector('input').onchange=e=>{if(e.target.checked&&chosen.size>=3){e.target.checked=false;$('catalog-count').textContent='En fazla 3 kayıt seçebilirsin. Önce bir seçimi kaldır.';return;}e.target.checked?chosen.add(r.id):chosen.delete(r.id);renderComparison();};
   card.querySelector('button').onclick=()=>{dialog.close();onSelect(r);};$('research-cards').append(card);
  }
  if(!filtered.length){const empty=document.createElement('div');empty.className='catalog-empty';empty.innerHTML='<h3>Eşleşen kayıt yok.</h3><p>Bir filtreyi kaldır veya daha kısa bir arama dene.</p>';$('research-cards').append(empty);}
  renderComparison();
 }
 function renderComparison(){
  $('compare-button').textContent=`${showComparison?'Karşılaştırmayı gizle':'Karşılaştır'} · ${chosen.size}`;$('compare-button').disabled=chosen.size<2;
  const selected=records.filter(r=>chosen.has(r.id));$('comparison').hidden=!showComparison||selected.length<2;if($('comparison').hidden)return;
  const labels=[...new Set(selected.flatMap(r=>r.conditions.map(c=>c.label)))];
  $('comparison').innerHTML=`<div class="comparison-head"><div><span class="eyebrow">KOŞULLARI YAN YANA İNCELE</span><h2>Ne değişiyor?</h2></div><button id="comparison-clear" class="secondary">Seçimi temizle</button></div><div class="comparison-scroll"><table><thead><tr><th>Deney koşulu</th>${selected.map(r=>`<th>${escapeHTML(r.title)}</th>`).join('')}</tr></thead><tbody><tr><th>Ortam</th>${selected.map(r=>`<td>${escapeHTML(r.platform)}</td>`).join('')}</tr>${labels.map(label=>`<tr><th>${escapeHTML(label)}</th>${selected.map(r=>{const c=r.conditions.find(c=>c.label===label);return `<td>${c?escapeHTML(conditionValue(c)):'<span class="missing">Bu özet tabloda yok</span>'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div><p class="caption">Bu tablo koşulları karşılaştırır; tek değişkenli kontrollü test veya “en yanıcı malzeme” sıralaması değildir. BASS fan/hava göstergelerinin birimi kaynakta belirtilmez.</p>`;
  $('comparison-clear').onclick=()=>{chosen.clear();showComparison=false;render();};
 }
 for(const id of ['research-search','research-focus','research-material','research-kind'])$(id).addEventListener(id==='research-search'?'input':'change',render);
 $('clear-filters').onclick=()=>{$('research-search').value='';for(const id of ['research-focus','research-material','research-kind'])$(id).value='all';render();};
 $('compare-button').onclick=()=>{showComparison=!showComparison;renderComparison();if(showComparison)$('comparison').scrollIntoView({block:'start',behavior:'instant'});};
 $('research-close').onclick=()=>dialog.close();dialog.addEventListener('close',onClose);
 async function open(focus='all'){
  onOpen();$('research-focus').value=focus;$('research-search').value='';$('research-material').value='all';$('research-kind').value='all';if(!dialog.open)dialog.showModal();
  try{records=await loadCatalog();$('research-material').replaceChildren(new Option('Tüm malzemeler','all'),...[...new Set(records.map(r=>r.material))].sort().map(m=>new Option(m,m)));render();}catch{const b=document.createElement('button');b.className='secondary';b.textContent='Katalog yüklenemedi · Yeniden dene';b.onclick=()=>open(focus);$('research-cards').replaceChildren(b);$('catalog-count').textContent='Bağlantı kurulamadı.';}
 }
 return {open};
}
