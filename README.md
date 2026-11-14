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

66 özgün parça, 67.138 üçgen. Bazı parçaların birden fazla malzemesi olduğu için GPU tarafında 80 mesh oluşur; seçim ve envanter 66 özgün kimliği korur. GLB yaklaşık 14,36 MB. Dokular optimize edilmiştir. Koordinatlar görsel gezinme birimleridir, mühendislik ölçüsü değildir.

Bu sürüm keşif ve parça seçimi içerir. Yangın fiziği, malzeme bileşimi, sensör verisi veya tahmin modeli içermez. Gerçek fiziksel malzeme özellikleri görsel doku adlarından çıkarılmamalıdır.

## Yapı

- `src/main.js`: Three.js sahne, kamera, seçim, hareket ve UI bağlantıları
- `dist/index.html`, `dist/style.css`: arayüz
- `dist/assets/us-lab.glb`: optimize NASA modülü
- `dist/assets/us-lab-metadata.json`: kaynak parça adları ve görsel sınırlar
- `.openai/hosting.json`: özel Sites yayını

## Doğrulama

Tarayıcıda yükleme, rehberli bakış, 66 parçalık arama, çok malzemeli parça seçimi, seçim sonrası klavye odağı ve arama alanından Esc kontrol edildi. 390×844 ve 844×390 ekranlarda taşma ve panel erişimi kontrol edildi. Serbest hareket konum değişimi doğrulandı. Görsel kaliteye yönelik ışık ayarı yapıldı. Cihaz performansı donanıma göre değişebilir; Dengeli kalite seçeneği bulunur.
