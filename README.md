# US Lab — Orbital Explorer

NASA'nın ISS / Destiny iç mekân modelinde gezinti ve mikro yerçekimi yanma deneyleri için araştırma arayüzü.

**[Canlı uygulamayı aç](https://us-lab-explorer.eneskucuk1617.chatgpt.site)**

## Özellikler

- NASA modelinde 66 parçayı seçme, arama ve serbest gezinme.
- Saffire-I, BASS-II ve SAME-R ailelerinden 12 deney kaydı.
- Malzeme, araştırma amacı, metin ve veri türüne göre filtreleme.
- Üç kayda kadar deney koşullarını yan yana karşılaştırma.
- Saffire-I ve SAME-R için özgün sensör değerleriyle zaman çizelgeleri ve CSV dışa aktarma.
- PMMA, Nomex III ve SIBAL numuneleri için dört özgün NASA videosu.
- Temsili 3D numune yerleşimi, Saffire alev görünümü ve mobil sahne görünümü.

## Yerelde çalıştırma

Node.js ve npm gerekir. Kaynak kod ve tarayıcıya hazır varlıklar depoda bulunur.

```sh
git clone https://github.com/kucukenes17/us-lab-explorer.git
cd us-lab-explorer
npm ci
npm run build
npm run dev
```

Tarayıcıda **http://127.0.0.1:4173** adresini açın. Yerel sunucu yalnız bu bilgisayardan erişilebilir.

## Kontroller

| Eylem | Kontrol |
| --- | --- |
| Etrafa bakma | Fare veya parmakla sürükleme |
| Yatay hareket | WASD, yön tuşları veya ekrandaki düğmeler |
| Alçalma / yükselme | Q / E |
| Parça seçme | Parçaya tıklama |
| Başlangıca dönme | R |
| Paneli kapatma | Esc |

## Veri ve bilimsel kapsam

Saffire-I Numune 1 görünümü, 20.000 özgün satırdan seçilmiş 665 kaynak örneği içerir. Her saniyeye en yakın ölçümler ve kontrol geçişlerinin özgün satırları korunur. SAME-R 55, tekrar eden zaman damgaları dahil 1.402 özgün satır içerir. Değerler yumuşatılmaz, işaretleri değiştirilmez veya sentetik sensör eğrileri üretilmez.

BASS kayıtları deney koşullarını içerir; dört kayıtta NASA videosu da vardır. Fan/hava gösterge notlarının birimleri ve geçiş zamanları kaynakta belirtilmediğinde tahmin edilmez. SAME-R karıştırma fanı, deney haznesine aittir. Video ve deney tablosu arasındaki tarih farkları açıklanır; videolar telemetriyle eşzamanlı kabul edilmez.

3D yanma, numune boyutu ve US Lab içindeki yerleşim **temsili görselleştirmedir**. Bu proje doğrulanmış CFD, yangın yayılımı, söndürme başarısı veya eğitilmiş erken uyarı modeli sunmaz. Saffire deneyi Cygnus'ta yürütüldü. NASA iç mekân modeli fiziksel malzeme envanteri sağlamaz; görsel doku adları gerçek kimyasal bileşim sayılmaz.

Ek ayrıntılar: [EXPERIMENTS.md](EXPERIMENTS.md).

## Kaynaklar ve atıflar

- [ISS E Internal 3D modeli — NASA / JSC / IGOAL](https://science.nasa.gov/3d-resources/international-space-station-iss-e-internal/)
- [Saffire-I — NASA PSI-98](https://psi.nasa.gov/physci/repo/data/investigations/PSI-98)
- [BASS-II — NASA PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25)
- [SAME-R — NASA PSI-101](https://psi.nasa.gov/physci/repo/data/investigations/PSI-101)
- [Saffire-I görsel referansı](https://www.nasa.gov/image-article/fiberglass-composite/)

Kaynak dosya adları, bağlantılar, satır bilgileri ve SHA-256 değerleri ilgili JSON dosyalarında bulunur. NASA modelinin özgün geometrisi korunmuş; dokular web için hazırlanmıştır. Yaklaşık 44 MB GLB, kayıpsız üç parçaya bölünmüştür ve tarayıcıda birleştirilir. Video dosyaları özgün halleriyle sunulur. Bağımsız bir projedir; NASA tarafından onaylanmış değildir. Üçüncü taraf varlıkların kaynak atıfları korunmalıdır.

## Proje yapısı

```text
src/main.js           Sahne, gezinme ve parça seçimi
src/catalog.js        Deney filtreleme ve karşılaştırma
src/fire.js           Deney görünümü ve telemetri oynatma
src/flame-visual.js   Temsili hacimsel alev
dist/                Arayüz ve derlenmiş uygulama
dist/assets/         Model parçaları, deney JSON dosyaları ve videolar
server.mjs           Yerel statik sunucu
.openai/hosting.json  Mevcut Sites yayınının yapılandırması
```

Three.js ve esbuild kullanılır. API anahtarı veya veritabanı kurulumu gerekmez. Üretim için `npm run build` sonrasında `dist/` klasörü statik olarak sunulabilir.
