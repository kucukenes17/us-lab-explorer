# Flame in Freefall — kapsam ve doğrulama

Resmî [Details](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/?tab=details) ve [Resources](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/?tab=resources) sekmeleri 14 Kasım 2026 tarihinde doğrudan tarayıcıdan incelendi. Bu belge proje kabul kontrolleridir; NASA'nın puanlama rubriği değildir.

## Görev ve uygulama

Görev, yanma araştırmalarını yangın güvenliği bağlamında özetleyen, sıralayan ve yorumlayan SI destekli etkileşimli bir dashboard istiyor. Belirli bir model markası, model eğitimi veya CFD zorunluluğu tanımlanmıyor. Görev ortamları, veri çıkarımı, donanım bağlantıları ve Dünya uygulamaları önerilen yönlerdir. 3D gezinti kullanıcı tarafından istenen tamamlayıcı deneyimdir.

| Alan | Bu sürüm |
| --- | --- |
| Araştırmaları özetleme | 23 kart; amaç, yakıt, geometri, koşullar, ölçümler, donanım, kaynak ve kapsam sınırları |
| İlgili araştırmayı sıralama | Amaç ve anahtar kelimeye dayalı açıklanabilir kurallar; güvenlik / yanıcılık puanı yok |
| Bulguyu yorumlama | Kaynağa dayalı editoryal güvenlik bağlantısı; beş kartta yayımlanmış bulgu, diğerlerinde sonuç eksikliği açık |
| Karşılaştırma | Üç araştırma veya aynı tablodan üç satır; ortak alanlar, koşullar ve eksikler |
| Veri çıkarımı | Dokuz tablo, 671 kaynak satırı; filtreli CSV/JSON ve yeniden üretilebilir ZIP paketi |
| Tahmine hazırlık | FLEX başlangıç koşulları / sonuç ayrımı ve veri sızıntısı rehberi; eğitilmiş model yok |
| Donanım | CIR / MDCA / MSG / Cygnus ile kaynaklı araştırma bağlantıları |
| 3D ve kayıtlar | 66 tıklanabilir US Lab parçası, 12 kayıt görünümü, iki sensör serisi, dört video |
| SI / AI | Kullanıcı tercihiyle ertelendi. API çağrısı ve anahtar kurulumu yapılmadı |

AI bileşeni ertelendiği için **challenge'ın tamamen tamamlandığı iddia edilmez**. Amaç eşleştirmesi veya editoryal metin, model çıkarımı olarak etiketlenmez.

## Kanıt sınırları

- 671 satır, 671 bağımsız deney değildir. SAME koşul şablonları, FLEX-2 konfigürasyon aralıkları, SAME-R yaşlandırılmış ölçümler, bakım ve kaynak notları ayrı türlerdir.
- Ham hücreler, satır numaraları, kaynak dosya adları ve SHA-256 değerleri korunur. Yaklaşık değerler ve aralıklar kesin sayıya çevrilmez. FLEX grafiklerinde yaklaşık / eksik çap veya süre olan kayıtlar dışarıda tutulur.
- FLEX O₂ / N₂ / CO₂ alt indisleri ve mm²/s yanma hızı sabiti, NASA/TP-2015-216046 Tablo IX ile doğrulandı. Özgün CSV başlıkları değiştirilmedi; doğrulama kaynağı metadata ve arayüzde bulunur.
- CFI-G'nin yüksek oksijen koşulu brülör akışına aittir. Kabin atmosferi olarak kullanılmaz.
- Kısmi yerçekimi için bu pakette doğrudan doğrulanmış deney tablosu yoktur. LUCI simüle Ay çekimi araştırması; FM² planlanan Ay yüzeyi çalışmasıdır.
- US Lab görsel modeli malzeme envanteri sağlamaz. Saffire, US Lab'da değil Cygnus'ta yapıldı. Numuneyi taşımak gerçek deney koşullarını değiştirmez. Alev animasyonu ölçülmüş alev maskesi veya CFD değildir.

## Yapılan kontroller

`npm test`: beş test grubu geçti. Amaç sınıflandırması, belirsiz / eksik değer filtreleri, kaynak hash'leri, 671 satır / 8.546 hücre bütünlüğü, CSV koruması ve kaynaklı FLEX düzeltmeleri doğrulandı.

Yerel tarayıcıda doğrulanan akışlar:

- Araştırma merkezi model yüklenmesini beklemeden açılır. SAME / SAME-R karşılaştırması çalışır.
- FLEX'te Methanol: 157 satır; 750–770 mmHg koşuluyla 78 satır. Tarayıcıdan indirilen JSON içindeki 78 kayıt bağımsız olarak kontrol edildi.
- Satır seçme / karşılaştırma; FLEX-2'nin konfigürasyon aralığı etiketi; Ay bağlamı ve LUCI sınırları; AI'nin ertelendiği kapsam açıklaması.
- Saffire kartından 3D sensör kaydına geçiş, 66 parça yüklenmesi, fan güç komutunun 480,054 s olayında Kapalı okunması.
- 390 × 844 mobil görünümde sayfa yatay taşması yok. Geniş kaynak tabloları kendi alanında yatay kayar.
- Üretim derlemesi başarılı. Tarayıcıda uygulama JavaScript hatası görülmedi; Three.js / ekran kartı shader derleyicisinin sayısal hassasiyet uyarıları var.

## Dosyalar

- `dist/assets/research/investigations.json`: kaynaklı araştırma kartları.
- `dist/assets/research/experimental-tables.json`: dokuz tablo, özgün / ayrıştırılmış hücreler, nitelikler ve kaynak izi.
- `dist/assets/research/source-csv/`: değiştirilmemiş NASA CSV'leri.
- `dist/assets/research/nasa-combustion-experimental-tables.zip`: özgün ve normalleştirilmiş CSV'ler, JSON, sözlük, modelleme rehberi ve hash manifestosu.
