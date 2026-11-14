# Orbital Research — Flame in Freefall

NASA yanma araştırmalarını özetleyen, araştırma amacına göre sıralayan ve özgün deney tablolarını karşılaştırmaya açan araştırma merkezi. ISS / Destiny iç mekânında gezinti ve kaynak kaydı oynatma aynı uygulamaya bağlıdır.

**[Canlı uygulamayı aç](https://us-lab-explorer.eneskucuk1617.chatgpt.site)**

## Özellikler

- 23 kaynaklı araştırma kartı; 19 benzersiz PSI kaydı. Amaç, malzeme, geometri, koşullar, sensörler, donanım ve sınırlamalar.
- Amaç ve anahtar kelimeye dayalı açıklanabilir sıralama; üç araştırmayı karşılaştırma ve JSON dışa aktarma.
- Beş araştırma için kaynakta bildirilen bulgu; diğer kartlarda sonuç özeti eksikliği açık belirtilir.
- Dokuz resmî deney tablosunda 671 kaynak satırı ve 8.546 özgün hücre; satır türü, metin ve sayısal koşul filtreleri.
- Satır karşılaştırma, FLEX betimsel saçılım grafiği, kaynak izi, veri sözlüğü ve CSV / JSON / ZIP indirme.
- CIR, MDCA, MSG ve Cygnus donanım ilişkileri; resmî challenge'ın 10 kaynak bağlantısı ve Dünya uygulamaları.
- NASA modelinde 66 parçayı seçme, arama ve serbest gezinme.
- 12 adet 3D kayıt görünümü: iki sensör zaman serisi, dört özgün NASA videosu ve numune koşulları.

**AI/API yorumlama katmanı kullanıcı tercihiyle ertelendi.** Mevcut sıralama kural tabanlıdır, özetler kaynaklara dayalı editoryal içeriktir. Bunlar AI/SI çıktısı veya evrensel güvenlik puanı değildir; resmî görevin SI bileşeni tamamlanmış sayılmaz. [Görev kapsamı ve kabul kontrolleri](CHALLENGE.md).

## Yerelde çalıştırma

Node.js ve npm gerekir. Kaynak kod ve tarayıcıya hazır varlıklar depoda bulunur.

```sh
git clone https://github.com/kucukenes17/us-lab-explorer.git
cd us-lab-explorer
npm ci
npm run build
npm test
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

Araştırma merkezi ilk açılır; 3D model arka planda hazırlanır. Veriler ve kaynak kartları için modelin bitmesini beklemek gerekmez. Araştırma ekranı açıkken 3D render döngüsü duraklatılır.

671 satır, 671 bağımsız deney değildir. FLEX-2 konfigürasyon aralıkları, SAME koşul şablonları, SAME-R yaşlandırılmış ölçümler, Saffire akış referansları ve kaynak notları ayrı türlerdir. Sayısal filtreler yaklaşık ve aralık değerlerini kendiliğinden kesin sayıya dönüştürmez. Orijinal CSV'ler değişmemiştir; SHA-256 ile doğrulanır. FLEX'teki kimyasal alt indisler ve mm²/s birimi NASA/TP-2015-216046 Tablo IX ile doğrulanmış, kaynak başlıkları korunmuştur.

ZIP paketi özgün CSV, normalleştirilmiş CSV/JSON, veri sözlüğü, checksum manifestosu ve modelleme rehberi içerir. FLEX modelleme görünümü başlangıç koşullarını sonuçlardan ayırır; veri sızıntısını önlemek için sönme çapı ve yanma süresi başlangıç tahmin özellikleri sayılmaz. Bir model eğitilmemiştir.


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
src/catalog.js        3D kayıt kataloğu
src/research.js       Araştırma merkezi ve tablo arayüzü
src/research-model.js Sıralama, filtreleme ve dışa aktarma kuralları
tests/               Kaynak bütünlüğü ve araştırma kuralları testleri
src/fire.js           Deney görünümü ve telemetri oynatma
src/flame-visual.js   Temsili hacimsel alev
dist/                Arayüz ve derlenmiş uygulama
dist/assets/         Model parçaları, deney JSON dosyaları ve videolar
server.mjs           Yerel statik sunucu
.openai/hosting.json  Mevcut Sites yayınının yapılandırması
```

Three.js ve esbuild kullanılır. API anahtarı veya veritabanı kurulumu gerekmez. Üretim için `npm run build` sonrasında `dist/` klasörü statik olarak sunulabilir.
