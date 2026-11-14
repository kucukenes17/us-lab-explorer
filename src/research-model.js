export const fold = value => String(value ?? '').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
export const purposeNames = {all:'Tüm araştırmalar',prevention:'Yanma ve önleme',detection:'Duman algılama',suppression:'Söndürme',extinction:'Sönme sınırları','model-validation':'Model doğrulama'};
const focusNames={...purposeNames,'pre-fire-signatures':'Alev öncesi duman belirtileri','detection-instrumentation':'Algılama cihazları','material-comparison':'Malzeme karşılaştırması','combustion-efficiency':'Yanma verimi','active-control':'Etkin alev kontrolü',soot:'Kurum',stability:'Alev kararlılığı'};
export const kindNames = {'test-record':'Test kaydı','test-condition-record':'Test koşulu','aged-measurement-record':'Yaşlandırılmış ölçüm','condition-template':'Koşul şablonu','configuration-envelope':'Konfigürasyon aralığı','sample-summary':'Numune özeti','flow-media-reference':'Akış videosu referansı','source-note':'Kaynak notu','maintenance-log':'Bakım kaydı'};
const synonyms = {smoke:'duman',oxygen:'oksijen',flow:'akis',fan:'akis',suppression:'sondurme',detection:'algilama',ignition:'tutus',droplet:'damla',fabric:'kumas',nitrogen:'azot'};
const tokens = q => [...new Set(fold(q).split(/\s+/).filter(Boolean).map(t => synonyms[t] || t))];

const HABITAT_BOOST = {
  orbit: ['saffire-i', 'saffire-ii', 'saffire-iii', 'same-r', 'flex', 'flex-2', 'bass-ii'],
  moon: ['luci', 'fm2', 'e-field', 'bass-ii', 'bre', 'saffire-ii', 'cfi-g'],
  mars: ['e-field', 'luci', 'bass-ii', 'bre', 'saffire-iii', 'flex-2'],
  rover: ['bass-ii', 'bre', 'saffire-ii', 'cfi-g', 'same-r', 'daft']
};

export function rankStudies(studies, { query = '', purpose = 'all', habitat = 'orbit' } = {}) {
  const terms = tokens(query);
  const habitatIds = HABITAT_BOOST[habitat] || [];

  return studies
    .map((study) => {
      const haystack = fold(
        [
          study.name,
          study.objective,
          ...study.fuels,
          ...study.geometry,
          ...study.conditions,
          ...study.measurements,
          study.relevance,
          study.facility,
          ...study.focus.map((p) => purposeNames[p] || p)
        ].join(' ')
      );
      const matches = terms.filter((t) => haystack.includes(t));
      const exactPurpose = purpose !== 'all' && study.focus.includes(purpose);
      const relatedPurpose = purpose === 'detection' && study.focus.includes('detection-instrumentation');
      const habitatMatch = habitat !== 'orbit' && habitatIds.includes(study.id);

      const score =
        matches.length * 10 +
        (exactPurpose ? 30 : 0) +
        (habitatMatch ? 18 : 0) +
        (study.priority === 'core' ? 2 : 0);

      const reasons = [
        ...(exactPurpose ? [purposeNames[purpose] + ' amacıyla doğrudan eşleşir'] : []),
        ...(relatedPurpose ? ['Algılama cihazlarını doğrulayan tamamlayıcı araştırma'] : []),
        ...(habitatMatch ? ['Seçili yaşam alanı atmosferi ve yerçekimi sınırları için kritik'] : []),
        ...(matches.length ? ['Metin eşleşmesi: ' + matches.join(', ')] : []),
        ...(!terms.length && purpose === 'all' && !habitatMatch
          ? [study.priority === 'core' ? 'Yangın güvenliği için temel araştırma' : 'Tamamlayıcı araştırma']
          : [])
      ];
      return { study, score, reasons, relatedPurpose };
    })
    .filter(
      (r) =>
        (purpose === 'all' || r.study.focus.includes(purpose) || r.relatedPurpose) &&
        (!terms.length || r.reasons.some((x) => x.startsWith('Metin')))
    )
    .sort((a, b) => b.score - a.score || a.study.name.localeCompare(b.study.name));
}

export function synthesizeInsights(rankedItems, { purpose = 'all', habitat = 'orbit', query = '' } = {}) {
  const top = rankedItems.slice(0, 3).map((r) => r.study.name);
  const habitatInsights = {
    orbit:
      'ISS ve yörünge araçlarında (0G) kaldırma kuvveti olmadığı için duman yükselmez; algılama havalandırma akışına (SAME-R), önleme ise düşük akış hızındaki malzeme tutuşma sınırlarına (Saffire, BASS-II) dayanır.',
    moon:
      'Ay Üssü (0.16G) için öngörülen %30+ O₂ ve ≤10.2 psi atmosfer, uzay giysisi ön-soluma süresini kısaltırken malzeme yanıcılığını Dünya’ya kıyasla %40’tan fazla artırır. PSI’da doğrudan Ay verisi olmadığından 0G (BASS-II/Saffire) ve 1G sınırları ile LUCI/E-FIELD verileri birlikte kullanılmalıdır.',
    mars:
      'Mars yüzeyi (0.38G) hem konveksiyonun başladığı hem de düşük basınçlı/yüksek O₂ kabin atmosferlerinin planlandığı ara rejimdir. E-FIELD iyon kontrolü ve BRE yanma hızı sınırları tahminsel modeller için temel oluşturur.',
    rover:
      'Basınçlı yüzey araçları (Rover) dar hacimde yüksek O₂ (%30–%34) ve toz/aerosol (DAFT / SAME) riskini birleştirir. Hızlı erken duman algılama ve yanmaz malzeme seçimi (Nomex, Kapton, PMMA sınırları) kritiktir.'
  };

  const purposeAction = {
    all: 'Önleme (BASS/Saffire), Algılama (SAME) ve Söndürme (FLEX) katmanlarının birlikte ele alınması önerilir.',
    prevention: 'Malzeme kalınlığı, O₂ yüzdesi ve düşük kabin hava akışı (<10 cm/s) tutuşma sınırını belirleyen ana değişkenlerdir.',
    detection: 'Mikro yerçekiminde duman parçacık boyutu değişir; optik ve iyonizasyon dedektör kalibrasyonu SAME-R verilerine göre yapılmalıdır.',
    suppression: 'FLEX verileri CO₂ ve Helyum seyreltmesinin yanı sıra görünmez "Soğuk Alev" (Cool Flame) yeniden tutuşma riskinin izlenmesi gerektiğini gösterir.',
    extinction: 'Sınırlayıcı Oksijen Konsantrasyonu (LOC), sıfır yerçekiminde hafif hava akışı altında Dünya’dakinden daha düşük O₂ seviyelerine inebilir.',
    'model-validation': 'CFD ve yanıcılık modellerini doğrulamak için 0G (alt sınır) ile 1G (üst sınır) deney tabloları birlikte kalibre edilmelidir.'
  };

  return {
    leadStudies: top.length ? top.join(', ') : 'Eşleşen kayıt bulunamadı',
    habitatTakeaway: habitatInsights[habitat] || habitatInsights.orbit,
    engineeringGuidance: purposeAction[purpose] || purposeAction.all,
    queryNote: query ? `"${query}" araması için ${rankedItems.length} bilimsel kayıt sentezlendi.` : null
  };
}

export function filterRows(dataset, { query = '', kind = 'all', field = '', min = '', max = '', includeUnknown = false } = {}) {
  const q = fold(query),
    hasRange = field && (min !== '' || max !== '');
  return dataset.records.filter((r) => {
    if (kind !== 'all' && r.kind !== kind) return false;
    if (q && !fold(r.raw.join(' ')).includes(q)) return false;
    if (hasRange) {
      const n = r.values[field],
        exact = ['numeric', 'numeric-unit-explicit'].includes(r.qualifiers[field]);
      if (typeof n !== 'number' || !exact) return includeUnknown;
      if (min !== '' && n < Number(min)) return false;
      if (max !== '' && n > Number(max)) return false;
    }
    return true;
  });
}

export function comparisonSummary(studies) {
  const shared = studies.length ? studies[0].focus.filter((f) => studies.every((s) => s.focus.includes(f))) : [];
  return {
    shared: shared.map((f) => focusNames[f] || f),
    differentFields: ['fuels', 'geometry', 'conditions', 'measurements', 'facility', 'gravity'].filter(
      (k) => new Set(studies.map((s) => JSON.stringify(s[k]))).size > 1
    )
  };
}

export function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+@\t\r]/.test(s) || (/^\-/.test(s) && !/^\-\d+(\.\d+)?$/.test(s))) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}

export function exportRows(dataset, records) {
  return [
    ['source_accession', 'source_row', 'record_kind', ...dataset.fields.flatMap((f) => [f.key, f.key + '__qualifier'])].map(csvCell).join(','),
    ...records.map((r) =>
      [dataset.accession, r.sourceRow, r.kind, ...dataset.fields.flatMap((f) => [r.values[f.key], r.qualifiers[f.key]])].map(csvCell).join(',')
    )
  ].join('\r\n');
}