export function computeFreefallCombustion({ gravityG = 0.0, oxygenPercent = 21 }) {
  const o2Ratio = oxygenPercent / 21.0;
  const buoyancy = Math.pow(Math.max(0, Math.min(1, gravityG)), 0.75);

  const spreadMultiplier = (0.7 + 0.7 * buoyancy) * Math.pow(o2Ratio, 1.25);
  const baseTemp = 300 + 1520 * Math.pow(o2Ratio, 0.85) * (0.78 + 0.22 * buoyancy);
  const tempK = oxygenPercent < 15.5 ? 300 : Math.round(Math.min(2350, baseTemp));

  let regime = 'HOT_FLAME';
  if (oxygenPercent < 15.5) {
    regime = 'EXTINGUISHED';
  } else if (gravityG < 0.2 && oxygenPercent <= 18) {
    regime = 'COOL_FLAME';
  }

  let insight = '';
  if (regime === 'EXTINGUISHED') {
    insight =
      'FLEX Söndürme Sınırı (LOC): CO₂ / Helyum seyreltmesiyle O₂ %15.5 altına düştüğü için yanma kimyasal olarak durdu.';
  } else if (regime === 'COOL_FLAME') {
    insight =
      'SOĞUK ALEV (Cool Flame — FLEX / CFI): 0G ve düşük O₂ ortamında görünür sarı alev söndü; ~680 K sıcaklıkta görünmez mor/UV yanma sürüyor.';
  } else if (oxygenPercent >= 30) {
    insight =
      'AY ÜSSÜ / ROVER ATMOSFERİ (%30+ O₂): Uzay giysisi ön-soluma süresini kısaltmak için artırılan O₂ oranı yanıcılığı ve alev yayılım hızını kritik seviyeye çıkardı.';
  } else if (gravityG === 0) {
    insight =
      'ISS Serbest Düşüş (0G): Kaldırma kuvveti yok. Sıcak gaz yükselmediği için alev alçak, küresel/yayvan, mavi ağırlıklı ve dumansız yanıyor.';
  } else if (gravityG === 1) {
    insight =
      'Dünya Yerçekimi (1G): Konveksiyon sıcak gazı yukarı çekiyor; alev dikey uzuyor, türbülanslı diller ve yoğun sarı is oluşturuyor.';
  } else {
    insight = `Kısmi Yerçekimi (${gravityG.toFixed(
      2
    )}G — Ay 0.16G / Mars 0.38G Sınır Aralığı): 0G ve 1G verileri arasındaki bu geçişte konveksiyon akımı başlar ve alev dikleşir.`;
  }

  return {
    regime,
    tempK,
    spreadMultiplier,
    buoyancy,
    o2Ratio,
    insight
  };
}