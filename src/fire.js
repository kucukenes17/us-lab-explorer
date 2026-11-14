import { createFlameVisual } from './flame-visual.js';
import { loadCatalog, escapeHTML as esc, conditionValue } from './catalog.js';
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const fmt = (n, d = 1) =>
  Number.isFinite(n) ? n.toLocaleString('tr-TR', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—';
const time = (t) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
const colors = ['#c6803a', '#39809b', '#6d8b62', '#9179a5'];

export function createFireExperience({ scene, enter, hidePanels, travelTo, onMode, stopMovement, openResearch }) {
  let active = false,
    playing = false,
    t = 0,
    speed = 5,
    data = null,
    record = null,
    rows = [],
    charts = [],
    lastRow = -1,
    request = 0,
    records = [],
    currentRow = null;

  let gravityG = 0.0;
  let oxygenPercent = 21;

  const source = new THREE.Vector3(-0.18, -0.22, -0.33),
    placement = source.clone();
  let placementLabel = 'Merkez · numune tepsisi';

  const visual = createFlameVisual(scene, source),
    sampleGroup = new THREE.Group();
  scene.add(sampleGroup);
  sampleGroup.visible = false;

  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.014, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x3d4c53, metalness: 0.65, roughness: 0.4 })
  );
  tray.position.y = -0.025;
  sampleGroup.add(tray);

  const sampleMat = new THREE.MeshStandardMaterial({ color: 0xe4d6ba, roughness: 0.85, metalness: 0 });
  const sample = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.008, 0.22), sampleMat);
  sampleGroup.add(sample);

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.12, 14),
    new THREE.MeshStandardMaterial({ color: 0xd8c7a7 })
  );
  wick.position.y = 0.06;
  sampleGroup.add(wick);

  const heater = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.004, 6, 32),
    new THREE.MeshStandardMaterial({
      color: 0x665f55,
      emissive: 0xd65214,
      emissiveIntensity: 0,
      metalness: 0.6,
      roughness: 0.5
    })
  );
  heater.rotation.x = Math.PI / 2;
  heater.position.y = 0.02;
  sampleGroup.add(heater);

  const dropletFlameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const dropletFlame = new THREE.Mesh(new THREE.SphereGeometry(0.048, 32, 32), dropletFlameMat);
  dropletFlame.position.y = 0.24;
  sampleGroup.add(dropletFlame);

  const dropletLight = new THREE.PointLight(0x38bdf8, 0.6, 1.4, 2);
  dropletLight.position.y = 0.24;
  sampleGroup.add(dropletLight);

  const catalog = {
    open: (focus) => {
      playing = false;
      stopMovement();
      $('record-metadata').querySelector('video')?.pause();
      openResearch(focus);
    }
  };

  const expand = document.createElement('button');
  expand.id = 'scene-expand';
  expand.textContent = 'Sahneyi büyüt';
  expand.setAttribute('aria-expanded', 'false');
  expand.onclick = () => {
    const wide = document.body.classList.toggle('expanded-scene');
    expand.textContent = wide ? 'Verileri aç' : 'Sahneyi büyüt';
    expand.setAttribute('aria-expanded', String(wide));
  };
  $('fire-context').append(expand);

  const freefallBox = document.createElement('div');
  freefallBox.id = 'freefall-controls';
  freefallBox.style.cssText =
    'margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.14);display:flex;flex-direction:column;gap:8px;font-size:12px;';
  freefallBox.innerHTML = `
    <div id="ff-role-badge" style="font-size:11px;color:#93c5fd;font-weight:600;letter-spacing:0.02em;"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;flex-wrap:wrap;">
      <label for="ff-gravity" style="font-weight:600;">Yerçekimi: <span id="ff-gravity-val">0.00G (ISS)</span></label>
      <div style="display:flex;gap:4px;">
        <button type="button" id="ff-btn-0g" class="secondary" style="padding:2px 6px;font-size:10.5px;">0G ISS</button>
        <button type="button" id="ff-btn-moon" class="secondary" style="padding:2px 6px;font-size:10.5px;">Ay (%32 O₂)</button>
        <button type="button" id="ff-btn-1g" class="secondary" style="padding:2px 6px;font-size:10.5px;">1G Dünya</button>
      </div>
    </div>
    <input id="ff-gravity" type="range" min="0" max="1" step="0.01" value="0" style="width:100%;" />
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <label for="ff-o2" style="font-weight:600;">Kabin O₂: <span id="ff-o2-val">%21</span></label>
      <span id="ff-temp-badge" style="padding:2px 7px;border-radius:999px;background:rgba(56,189,248,0.2);color:#7dd3fc;font-weight:600;">~1485 K</span>
    </div>
    <input id="ff-o2" type="range" min="14" max="35" step="1" value="21" style="width:100%;" />
    <p id="ff-insight" style="margin:2px 0 0;line-height:1.4;color:#cbd5e1;background:rgba(15,23,42,0.55);padding:6px 8px;border-radius:6px;border-left:3px solid #38bdf8;"></p>
  `;
  $('fire-context').append(freefallBox);

  function getSafetyRoleLabel(rec) {
    if (!rec) return '';
    if (rec.id === 'same-r55') return 'GÖREV: Yangın Algılama (Detection) · MSG / Duman & Aerosol';
    if (/flex/i.test(rec.id)) return 'GÖREV: Yangın Söndürme (Suppression) · CIR / MDCA';
    return 'GÖREV: Yangın Önleme (Prevention) · Malzeme Yanıcılığı';
  }

  function syncEnvironmentUI() {
    const physics = visual.setEnvironment({ gravityG, oxygenPercent });
    $('ff-role-badge').textContent = getSafetyRoleLabel(record);
    $('ff-gravity').value = String(gravityG);
    $('ff-gravity-val').textContent =
      gravityG === 0
        ? '0.00G (ISS)'
        : gravityG === 0.16
        ? '0.16G (Ay Yüzeyi)'
        : gravityG === 1
        ? '1.00G (Dünya)'
        : `${gravityG.toFixed(2)}G`;
    $('ff-o2').value = String(oxygenPercent);
    $('ff-o2-val').textContent = `%${oxygenPercent}`;
    $('ff-temp-badge').textContent =
      physics.regime === 'EXTINGUISHED'
        ? 'SÖNDÜ (300 K)'
        : physics.regime === 'COOL_FLAME'
        ? `SOĞUK ALEV (~${physics.tempK} K)`
        : `~${physics.tempK} K`;
    $('ff-insight').textContent = physics.insight;
    $('ff-insight').style.borderLeftColor =
      physics.regime === 'COOL_FLAME'
        ? '#818cf8'
        : physics.regime === 'EXTINGUISHED'
        ? '#64748b'
        : oxygenPercent >= 30
        ? '#ef4444'
        : gravityG > 0.5
        ? '#f59e0b'
        : '#38bdf8';

    if (physics.regime === 'EXTINGUISHED') {
      dropletFlame.visible = false;
      dropletLight.intensity = 0;
    } else {
      dropletFlame.visible = record?.id !== 'saffire-i-sample1' && record?.id !== 'same-r55';
      const scaleFactor = 0.8 + (oxygenPercent - 15) * 0.025;
      dropletFlame.scale.set(
        scaleFactor * (1 - physics.buoyancy * 0.25),
        scaleFactor * (1 + physics.buoyancy * 1.65),
        scaleFactor * (1 - physics.buoyancy * 0.25)
      );
      if (physics.regime === 'COOL_FLAME') {
        dropletFlameMat.color.setHex(0x818cf8);
        dropletFlameMat.opacity = 0.42;
        dropletLight.color.setHex(0x818cf8);
      } else if (physics.buoyancy < 0.25) {
        dropletFlameMat.color.setHex(0x38bdf8);
        dropletFlameMat.opacity = 0.85;
        dropletLight.color.setHex(0x38bdf8);
      } else {
        dropletFlameMat.color.setHex(0xff9d3b);
        dropletFlameMat.opacity = 0.9;
        dropletLight.color.setHex(0xff9d3b);
      }
      dropletLight.intensity = 0.65;
    }
  }

  $('ff-gravity').oninput = (e) => {
    gravityG = parseFloat(e.target.value);
    syncEnvironmentUI();
  };
  $('ff-o2').oninput = (e) => {
    oxygenPercent = parseInt(e.target.value, 10);
    syncEnvironmentUI();
  };
  $('ff-btn-0g').onclick = () => {
    gravityG = 0.0;
    oxygenPercent = 21;
    syncEnvironmentUI();
  };
  $('ff-btn-moon').onclick = () => {
    gravityG = 0.16;
    oxygenPercent = 32;
    syncEnvironmentUI();
  };
  $('ff-btn-1g').onclick = () => {
    gravityG = 1.0;
    oxygenPercent = 21;
    syncEnvironmentUI();
  };

  $('lab-button').onclick = () => {
    close();
    enter();
  };
  $('fire-button').onclick = () => (active ? close() : open());
  $('fire-close').onclick = close;
  $('experiment-select').onchange = (e) => open(records.find((r) => r.id === e.target.value));

  const tabs = ['data', 'conditions', 'source'];
  function setTab(name) {
    for (const tab of tabs) {
      const b = $('tab-' + tab);
      b.setAttribute('aria-selected', String(tab === name));
      b.tabIndex = tab === name ? 0 : -1;
      $('record-' + tab).hidden = tab !== name;
    }
    if (name !== 'data') $('record-metadata').querySelector('video')?.pause();
  }
  for (const name of tabs) {
    $('tab-' + name).onclick = () => setTab(name);
    $('tab-' + name).onkeydown = (e) => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      e.preventDefault();
      const next = tabs[(tabs.indexOf(name) + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
      setTab(next);
      $('tab-' + next).focus();
    };
  }

  $('fire-play').onclick = () => {
    if (!data) return;
    if (t >= data.sampling.endElapsedS) t = 0;
    playing = !playing;
    render();
  };
  $('fire-reset').onclick = () => {
    playing = false;
    t = 0;
    render();
  };
  $('fire-speed').onchange = (e) => (speed = Number(e.target.value));
  $('fire-range').oninput = (e) => {
    t = Number(e.target.value);
    playing = false;
    render();
  };
  $('fire-focus').onclick = focusCamera;
  $('fire-visual-toggle').onchange = updateVisibility;
  $('placement-select').onchange = (e) => {
    const choices = { center: [-0.18, -0.22, -0.33], aft: [-1.75, -0.22, -0.33], forward: [1.75, -0.22, -0.33] };
    if (choices[e.target.value]) {
      placement.fromArray(choices[e.target.value]);
      placementLabel = e.target.selectedOptions[0].text;
      applyPlacement();
      focusCamera();
    }
  };
  $('fire-download').onclick = () => {
    if (!data) return;
    const lines = [data.columns.map((c) => c.key).join(','), ...rows.map((r) => r.join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.id}-source-measurements.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  function applyPlacement() {
    visual.group.position.copy(placement).sub(source);
    sampleGroup.position.copy(placement);
    $('context-caption').textContent = `${placementLabel} · temsili yerleşim`;
    $('placement-select').title = placementLabel;
  }
  function focusCamera() {
    travelTo([placement.x - 0.85, 0.22, 0.35], [placement.x, placement.y + 0.07, placement.z]);
  }
  function updateVisibility() {
    const show = active && $('fire-visual-toggle').checked;
    visual.group.visible = show && record?.id === 'saffire-i-sample1';
    sampleGroup.visible = show && !!record && record.id !== 'saffire-i-sample1';
    syncEnvironmentUI();
  }
  async function ensureCatalog() {
    records = await loadCatalog();
    $('experiment-select').replaceChildren(...records.map((r) => new Option(r.title, r.id)));
  }

  async function open(selected) {
    const token = ++request;
    active = true;
    playing = false;
    enter();
    hidePanels();
    onMode(true);
    document.body.classList.remove('has-telemetry', 'expanded-scene');
    expand.textContent = 'Sahneyi büyüt';
    expand.setAttribute('aria-expanded', 'false');
    $('fire-panel').hidden = false;
    $('fire-context').hidden = false;
    $('fire-timeline').hidden = true;
    $('fire-button').setAttribute('aria-pressed', 'true');
    $('lab-button').setAttribute('aria-pressed', 'false');
    $('fire-loading').hidden = false;
    $('fire-loading').textContent = 'Kaynak kayıt yükleniyor…';
    $('fire-content').hidden = true;
    $('record-metadata').hidden = true;
    $('fire-download').hidden = true;
    $('record-metadata').querySelector('video')?.pause();
    data = null;
    rows = [];
    currentRow = null;
    lastRow = -1;
    t = 0;
    updateVisibility();
    setTab('data');

    try {
      if (!records.length) await ensureCatalog();
      if (token !== request) return;
      record = selected ?? record ?? records[0];
      $('experiment-select').value = record.id;
      $('record-title').textContent = record.experiment;
      $('context-title').textContent = `${record.material} · ${record.experiment}${record.testId ? ' / ' + record.testId : ''}`;
      applyPlacement();
      configureSample();
      updateVisibility();
      renderConditions();
      renderSource();
      focusCamera();

      if (record.telemetryFile) {
        const response = await fetch('./assets/' + record.telemetryFile);
        if (!response.ok) throw Error('Ölçümler yüklenemedi');
        const result = await response.json();
        if (token !== request) return;
        if (result.schemaVersion !== 1 || !result.rows?.length) throw Error('Ölçüm biçimi hatalı');
        data = result;
        rows = data.rows;
        $('fire-range').max = data.sampling.endElapsedS;
        buildCharts();
        buildEvents();
        $('fire-content').hidden = false;
        $('fire-timeline').hidden = false;
        document.body.classList.add('has-telemetry');
        $('fire-download').hidden = false;
        $('record-intro').textContent =
          record.id === 'same-r55'
            ? 'Isıtma, dedektör sinyalleri ve karıştırma fanının gerçek kaydı. Voltaj, duman yoğunluğu değildir.'
            : 'SIBAL numunesinin gerçek sensör ölçümleri. Alev yayılımı temsili animasyondur.';
        renderSource();
        render();
      } else {
        renderMetadata();
        $('record-metadata').hidden = false;
      }
      $('fire-loading').hidden = true;
    } catch (e) {
      if (token !== request) return;
      $('fire-loading').replaceChildren(document.createTextNode('Kayıt yüklenemedi. '));
      const b = document.createElement('button');
      b.textContent = 'Yeniden dene';
      b.className = 'secondary';
      b.onclick = () => open(selected);
      $('fire-loading').append(b);
      $('fire-loading').hidden = false;
    }
  }

  function close() {
    ++request;
    active = false;
    playing = false;
    onMode(false);
    document.body.classList.remove('has-telemetry', 'expanded-scene');
    expand.textContent = 'Sahneyi büyüt';
    expand.setAttribute('aria-expanded', 'false');
    updateVisibility();
    $('fire-panel').hidden = true;
    $('fire-timeline').hidden = true;
    $('fire-context').hidden = true;
    $('fire-button').setAttribute('aria-pressed', 'false');
    $('lab-button').setAttribute('aria-pressed', 'true');
    $('record-metadata').querySelector('video')?.pause();
  }

  function configureSample() {
    const candle = record.geometryType === 'candle',
      same = record.id === 'same-r55';
    sample.visible = !same;
    wick.visible = same || candle;
    heater.visible = same;
    sample.geometry.dispose();
    sample.geometry = candle ? new THREE.CylinderGeometry(0.055, 0.055, 0.15, 40) : new THREE.BoxGeometry(0.52, 0.008, 0.22);
    sample.position.y = candle ? 0.075 : 0;
    wick.position.y = candle ? 0.18 : 0.06;
    dropletFlame.position.y = candle ? 0.28 : 0.14;
    dropletLight.position.y = dropletFlame.position.y;
    sampleMat.color.set(record.material === 'PMMA' ? 0xbcd4da : record.material === 'Nomex III' ? 0xb8ac89 : 0xe4d6ba);
    heater.material.emissiveIntensity = 0;
    syncEnvironmentUI();
  }

  function renderConditions() {
    $('condition-list').innerHTML = `<div><dt>Deneyin gerçek ortamı</dt><dd>${esc(record.platform)}</dd></div><div><dt>Malzeme</dt><dd>${esc(record.materialOriginal)}</dd></div>${record.conditions
      .filter((c) => !['Numune', 'Malzeme'].includes(c.label))
      .map((c) => `<div><dt>${esc(c.label)}</dt><dd>${esc(conditionValue(c))}</dd></div>`)
      .join('')}`;
  }

  function renderSource() {
    const s = data?.source ?? record.source;
    $('source-content').innerHTML = `<span class="evidence-badge ${record.kind === 'telemetry' ? 'series' : 'metadata'}">${record.kind === 'telemetry' ? 'ÖZGÜN ÖLÇÜMLER' : 'ÖZGÜN DENEY TABLOSU'}</span><p>${esc(record.evidence.description)}</p><a href="${esc(record.sourceUrl)}" target="_blank" rel="noopener noreferrer">NASA PSI kaynak kaydı ↗</a>${s?.downloadUrl ? `<a href="${esc(s.downloadUrl)}" target="_blank" rel="noopener noreferrer">Özgün veri dosyasını aç ↗</a>` : ''}<h3>Bu kayıt neyi gösterir?</h3><ul>${record.limitations.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>${s ? `<details><summary>Dosya ve izlenebilirlik</summary><code>${esc(s.fileName)}</code>${s.sheet ? `<p>Sayfa: ${esc(s.sheet)}</p>` : ''}${s.csvRow ? `<p>CSV satırı: ${s.csvRow}</p>` : ''}${s.sha256 ? `<p>SHA-256</p><code>${esc(s.sha256)}</code>` : ''}</details>` : ''}`;
  }

  function renderMetadata() {
    const video = record.media;
    $('record-metadata').innerHTML = `<span class="evidence-badge ${video ? 'video' : 'metadata'}">${video ? 'NASA DENEY VİDEOSU' : 'DENEY KOŞULLARI'}</span>${video ? `<video controls playsinline preload="metadata" aria-label="${esc(record.title)} NASA deney videosu" src="./assets/${esc(video.file)}"></video><p class="caption">${esc(video.caption ?? 'B1 numune/test kimliği eşleşir; videonun tarih yazısı ile tablo tarihi farklıdır. Sensör zamanıyla eşleştirilmemiştir.')}</p>` : `<div class="sample-card"><span class="sample-symbol ${record.geometryType}"></span><h3>${esc(record.material)}</h3><p>${esc(record.materialOriginal)}</p></div>`}<p class="data-note">Bu kayıtta deney koşulları var. Sürekli sensör eğrisi bu pakete dahil değil; 3D görünüm numune biçimini gösterir.</p><dl class="condition-list">${record.conditions.map((c) => `<div><dt>${esc(c.label)}</dt><dd>${esc(conditionValue(c))}</dd></div>`).join('')}</dl><p class="caption">BASS fan/hava alanları kaynak gösterge notlarıdır; birimleri ve geçiş zamanları belirtilmemiştir.</p>`;
  }

  function buildCharts() {
    charts = record.chartKeys.map((key, i) => {
      const index = data.columns.findIndex((c) => c.key === key);
      return {
        ...data.columns[index],
        index,
        color: colors[i],
        digits: key === 'stsDetectorV' ? 6 : key === 'issScatterV' ? 3 : key.endsWith('Pct') ? 3 : 1
      };
    });
    $('fire-charts').replaceChildren();
    for (const c of charts) {
      const [lo, hi] = c.originalRange;
      c.lo = lo;
      c.range = hi - lo || 1;
      const points = rows
        .map((r) => `${((r[0] / data.sampling.endElapsedS) * 264).toFixed(2)},${(55 - ((r[c.index] - lo) / c.range) * 48).toFixed(2)}`)
        .join(' ');
      const card = document.createElement('div');
      card.className = 'telemetry-card';
      card.style.setProperty('--trace', c.color);
      card.innerHTML = `<div class="telemetry-heading"><span>${esc(c.label)}</span><strong>—</strong></div><svg viewBox="0 0 264 62" role="img" aria-label="${esc(c.label)} zaman serisi"><path d="M0 7H264M0 31H264M0 55H264" class="chart-grid"/><polyline points="${points}" class="chart-line"/><line class="chart-cursor" x1="0" x2="0" y1="0" y2="62"/><circle class="chart-dot" r="3" cx="0" cy="55"/></svg><div class="chart-axis"><span>${fmt(lo, c.digits)} – ${fmt(hi, c.digits)} ${esc(c.unit)}</span><span>0–${Math.ceil(data.sampling.endElapsedS)} s</span></div>`;
      $('fire-charts').append(card);
      c.element = card;
    }
  }

  function buildEvents() {
    const events =
      record.id === 'same-r55'
        ? [
            { time: 0, label: 'Başlangıç' },
            { time: 398, label: 'Isıtıcı açık' },
            { time: 452, label: 'Isıtıcı kapalı' },
            { time: 498, label: 'Karıştırma açık' },
            { time: 506, label: 'Karıştırma kapalı' }
          ]
        : [
            { time: 0, label: 'Başlangıç' },
            { time: 60.027, label: 'Ateşleyici' },
            { time: 120, label: 'Yanma görünümü' },
            { time: 480.054, label: 'Fan kapalı' }
          ];
    $('timeline-events').replaceChildren(
      ...events.map((e) => {
        const b = document.createElement('button');
        b.textContent = `${e.time ? Math.round(e.time) + ' s · ' : ''}${e.label}`;
        b.onclick = () => {
          playing = false;
          t = e.time;
          render();
        };
        return b;
      })
    );
  }

  function render() {
    if (!data) return;
    $('fire-range').value = t;
    $('fire-time').textContent = `${time(t)} / ${time(data.sampling.endElapsedS)}`;
    $('fire-play').textContent = playing ? 'Ⅱ Duraklat' : '▶ Oynat';
    let lo = 0,
      hi = rows.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (rows[m][0] < t) lo = m + 1;
      else hi = m;
    }
    let index = lo;
    if (lo > 0 && Math.abs(rows[lo - 1][0] - t) < Math.abs(rows[lo][0] - t)) index = lo - 1;
    const row = rows[index];
    currentRow = row;
    $('fire-phase').textContent =
      record.id === 'same-r55'
        ? row[5]
          ? 'Isıtıcı etkin'
          : row[6]
          ? 'Karıştırma fanı etkin'
          : row[7]
          ? 'Test kaydı sürüyor'
          : 'Test dışı kayıt'
        : t < 60.027
        ? 'Ateşleme öncesi'
        : t < 68.013
        ? 'Ateşleyici etkin'
        : row[8] === 0
        ? 'Deney fanı kapalı'
        : 'Deney kaydı · alev temsili';
    for (const c of charts) {
      const x = (t / data.sampling.endElapsedS) * 264;
      c.element.querySelector('.chart-cursor').setAttribute('x1', x);
      c.element.querySelector('.chart-cursor').setAttribute('x2', x);
      c.element.querySelector('.chart-dot').setAttribute('cx', (row[0] / data.sampling.endElapsedS) * 264);
      c.element.querySelector('.chart-dot').setAttribute('cy', 55 - ((row[c.index] - c.lo) / c.range) * 48);
      if (lastRow !== index) c.element.querySelector('strong').textContent = `${fmt(row[c.index], c.digits)} ${c.unit}`;
    }
    if (lastRow !== index) {
      const controls =
        record.id === 'same-r55'
          ? [
              ['Isıtıcı', row[5] ? 'Açık' : 'Kapalı'],
              ['Karıştırma fanı', row[6] ? 'Açık' : 'Kapalı'],
              ['Test numarası', row[8]],
              ['STS alarm bayrağı', row[9] ? '1' : '0 · alarm yok']
            ]
          : [
              ['Hava hızı', fmt(row[6]) + ' cm/s'],
              ['Ateşleyici', fmt(row[7], 3) + ' A'],
              ['Fan güç komutu', row[8] === 1 ? 'Açık' : 'Kapalı']
            ];
      $('control-readings').innerHTML = controls.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      $('fire-sample').textContent = `Özgün ölçüm: ${fmt(row[0], 3)} s · Excel satırı ${row[1]}`;
      lastRow = index;
    }
  }

  return {
    get active() {
      return active;
    },
    get status() {
      return { id: record?.id, time: t, playing, sourceRow: currentRow?.[1], placement: placement.toArray(), gravityG, oxygenPercent };
    },
    close,
    openRecord: open,
    pause() {
      playing = false;
      stopMovement();
      $('record-metadata').querySelector('video')?.pause();
    },
    openCatalog: catalog.open,
    placeAt(center, title) {
      placement.set(THREE.MathUtils.clamp(center[0], -2.2, 2.2), -0.22, THREE.MathUtils.clamp(center[2] * 0.3, -0.33, 0.33));
      placementLabel = title + ' yakını';
      $('placement-select').value = 'custom';
      open();
    },
    update(dt) {
      if (!active) return;
      if (playing && !document.querySelector('dialog[open]')) {
        t = Math.min(t + dt * speed, data?.sampling.endElapsedS ?? 0);
        if (data && t >= data.sampling.endElapsedS) playing = false;
        render();
      }
      if (record?.id === 'saffire-i-sample1') visual.update(t);
      if (record?.id === 'same-r55') heater.material.emissiveIntensity = currentRow?.[5] ? 0.65 : 0;
    }
  };
}