# US Lab — Orbital Explorer

NASA ISS iç mekân modelinin Destiny / US Lab bölümü üzerinde çalışan tarayıcı keşfi.

## Çalıştırma

Node.js ile `npm ci`, `npm run build`, `npm run dev`; ardından http://127.0.0.1:4173 adresini açın.

## Kontroller

- Fareyi / parmağı sürükle: bakış
- WASD veya yön tuşları: yatay hareket
- Q / E: alçal / yüksel
- Tıkla: parçayı seç
- R: başlangıç; Esc: seçim ve listeyi kapat
- Ekrandaki düğmeleri basılı tutarak da hareket edilebilir.

## Kaynak ve kapsam

Model: NASA / Johnson Space Center / IGOAL, ISS E Internal.
https://science.nasa.gov/3d-resources/international-space-station-iss-e-internal/

66 özgün parça, 67.138 üçgen. Bazı parçaların birden fazla malzemesi olduğu için GPU tarafında 80 mesh oluşur; seçim ve envanter 66 özgün kimliği korur. GLB yaklaşık 43,95 MB. Renk dokuları özgün 4K çözünürlüğündedir; normal/metalness dokuları 2K kayıpsız PNG olarak korunur. Kaynak arşivdeki eksik Generic_Misc_Details atlas bağlantısı onarıldı. Koordinatlar görsel gezinme birimleridir, mühendislik ölçüsü değildir.

Bu sürüm keşif, parça seçimi, Saffire-I gerçek ölçüm oynatıcısı, temsili alev/duman ve araştırma rehberi içerir. Doğrulanmış yangın fiziği veya eğitilmiş tahmin modeli içermez. Gerçek fiziksel malzeme özellikleri görsel doku adlarından çıkarılmamalıdır.

## Yapı

- `src/main.js`: Three.js sahne, kamera, seçim, hareket ve UI bağlantıları
- `dist/index.html`, `dist/style.css`: arayüz
- `dist/assets/us-lab.asset.json` ve `us-lab.part*.bin`: kayıpsız bölünmüş NASA modülü; tarayıcıda birleştirilir
- `dist/assets/us-lab-metadata.json`: kaynak parça adları ve görsel sınırlar
- `.openai/hosting.json`: özel Sites yayını

## Doğrulama

Tarayıcıda yükleme, rehberli bakış, 66 parçalık arama, çok malzemeli parça seçimi, seçim sonrası klavye odağı ve arama alanından Esc kontrol edildi. 390×844 ve 844×390 ekranlarda taşma ve panel erişimi kontrol edildi. Serbest hareket konum değişimi doğrulandı. Görsel kaliteye yönelik ışık ayarı yapıldı. Cihaz performansı donanıma göre değişebilir; Dengeli kalite seçeneği bulunur.


## Yangın ve veriler

Üst menüden **Yangın & veriler** açılır. Kayıt başlangıcından 659,967 saniyeye kadar oynatma, duraklatma,1×/5×/10× hız, sürükleme ve olaylara atlama vardır. Grafikler numuneTC9/sıcak gazTC3 sıcaklığı, O₂ ve CO₂ sensörleridir; hava hızı, ateşleyici akımı ve fan komutu da gösterilir. Kaynak Excel satırı ve gerçek ölçüm zamanı her seçime eşlik eder. Görüntülenen veri CSV olarak indirilebilir.

`dist/assets/saffire-scenario.json`, NASA PSI-98 Saffire-I Numune1 Calibrated Data sayfasından gelen665 özgün satır içerir. Yaklaşık1Hz en yakın özgün örnekler ve ateşleyici/fan olaylarının tam geçiş satırları korunur. Ortalama, yumuşatma, interpolasyon veya değer normalizasyonu yoktur. Orijinal dosyanın SHA256 değeri JSON içinde bulunur. İlgili kaynak20.000 satırdır. Bu seyrek görünüm kısa süreli tepe değerlerinin veya alarm eşiklerinin doğrulanması için kullanılamaz.

- Ateşleyici açık:60,027s; bu ilk görünür alevin bağımsız olarak doğrulanmış zamanı değildir.
- Ateşleyici ilk kapalı örnek:68,013s; son enerjili örnek67,980s.
- Deney fanı güç komutu kapalı:480,054s; anlık tam sönme iddiası değildir.
- Deney Cygnus'ta yapıldı. US Lab'daki sahne ve alev/duman hareketi temsili animasyondur; hesaplanmış kabin yangını değildir. Görsel alev zarfı sensör sıcaklığından çıkarılmaz.

## Yarışma kapsamı

Görev metni; yanma araştırmalarını özetleyen, sıralayan ve yorumlayan bilimsel dashboard ister.3D keşif bunun bağlamsal arayüzüdür. Araştırmalar bölümü Saffire/BASS/SAME/FLEX'i amaç, ortam, koşullar, ölçümler ve sınırlamalarla sunar. Önleme/tespit/söndürme sıralaması açıklanmış konu eşleştirmesine dayanır; AI puanı değildir. Bu aşamada yalnız Saffire-I zaman serisi entegredir. Kaynaklara bağlı AI yorumlama, çoklu deneylerin sayısal karşılaştırması ve tahmin modelleri henüz uygulanmamıştır.

## Bu sürümün kontrolleri

665 kayıt satırındaki5.320 sayısal alan özgün workbook XML değerleriyle eşleştirildi. Olay geçişlerinde akım/fan durumu ayrıca kontrol edildi. Yeni GLB'nin66 parçası ve tüm POSITION verileri önceki geometriyle birebir aynı. Tarayıcıda zaman atlama, olay ölçümleri, araştırma sıralaması ve küçük ekran panel erişimi kontrol edildi.43,95MB yüksek çözünürlüklü modelin ilk yüklemesi bağlantıya ve cihaza göre değişir.


## Alev görünümü revizyonu

Önceki kameraya dönük ışık katmanları kaldırıldı. Yerine numuneye bağlı üç boyutlu hacim içinde çizilen, kumaş üzerinde ilerleyen dalgalı bir yanma cephesi; dokuma, kömürleşme ve yüzeye bağlı kor noktaları eklendi. Perspektif değiştiğinde alev numunede kalır. Görsel referans NASA Saffire-I fotoğrafıdır: https://www.nasa.gov/image-article/fiberglass-composite/ . İlerleme hızı ve alev şekli sanatsal temsildir; fotoğraf/veri üzerinden kalibre edilmiş fizik modeli değildir.
