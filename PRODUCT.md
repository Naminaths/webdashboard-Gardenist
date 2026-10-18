# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pemilik kebun cerdas, urban gardener, dan pengelola greenhouse mikro yang membutuhkan sistem pemantauan kondisi mikroklimat tanah dan udara secara real-time serta otomatisasi irigasi yang presisi tanpa ketergantungan manual.

## Product Purpose

Gardenist adalah platform Smart Garden IoT terpadu yang menjembatani sensor fisik mikrokontroler ESP32 dengan web dashboard interaktif secara real-time menggunakan Firebase Realtime Database. Tujuannya adalah mengoptimalkan pertumbuhan tanaman, mencegah kekeringan atau pembusukan akar karena overwatering, serta memberikan kendali penuh terhadap aktuator irigasi dan iklim kebun.

## Positioning

Satu ekosistem IoT holistik: menggabungkan telemetri 6-sensor simultan (Kelembaban Tanah, Suhu Lingkungan, Kelembaban Udara, Intensitas Cahaya, Kualitas Udara MQ-135, Level Air Tangki) dengan otomasi cerdas 4 aktuator (Pompa Air, Mist Maker, Lampu UV, Alarm Buzzer) dan fail-safe lokal di mikrokontroler ESP32 jika koneksi internet terputus.

## Operating Context

- Lingkungan kebun: Indoor greenhouse, balkon urban garden, hidroponik, dan pot tanaman pekarangan.
- Perangkat keras: Mikrokontroler ESP32 Node, sensor kapasitif tanah, DHT22, LDR fotoresistor, sensor gas MQ-135, sensor ultrasonik HC-SR04, modul relay 4-channel.
- Protokol data: Telemetri WebSocket dua arah melalui Firebase Realtime Database.
- Dashboard pengguna: Web aplikasi responsif (desktop, tablet, smartphone) dengan mode gelap/terang.

## Capabilities and Constraints

- **Sensor Naming & Unit**:
  - Kelembaban Tanah (`soil`): 0–100%, ideal 40–80%, ambang kering <40%.
  - Suhu Lingkungan (`temp`): °C, ideal 20–32°C.
  - Kelembaban Udara (`humidity`/`hum`): 0–100% RH, ideal 50–75%.
  - Intensitas Cahaya (`light`): Lx, ideal 300–2000 Lx.
  - Kualitas Udara (`mq135`): PPM, normal <450 PPM, waspada 450–900 PPM, bahaya >900 PPM.
  - Level Air Tangki (`tank`): %, kritis <10%, aman >25%.
- **Aktuator**:
  - Pompa Air (`pump`): Irigasi mikro akar tanaman.
  - Mist Maker (`mist`): Pengkabutan kelembaban mikro udara.
  - Lampu UV (`uv`): Spektrum fotosintesis tambahan.
  - Alarm Buzzer (`buzzer`): Peringatan bahaya/kondisi kritis.
- **Otomasi & Fail-Safe**:
  - Rule engine lokal di firmware ESP32 dan rule engine cloud.
  - Sinkronisasi status aktuator manual dan otomatis secara instan.
- **Batasan Teks & Simbol**:
  - Seluruh istilah menggunakan Bahasa Indonesia yang konsisten dengan kode `apps/web/src/main.js` dan `packages/shared/src/index.js`.
  - Simbol derajat (°C), em-dash (—), tanda panah (↓ / →), serta persentase (%) harus ditampilkan sempurna tanpa encoding corruption (bukan `â€”`, `Â°C`, atau `â†“`).

## Brand Commitments

- Nama Produk: `gardenist.` / `Gardenist`
- Prinsip Visual: Clean, modern, dan mengusung konsep 3D ringan (bukan generic AI neon-glow dark mode).
- Estetika: Berkarakter botani ilmiah terapan, presisi engineering sensor, tipografi modern yang tajam, interaksi spasial 3D yang ringan dan interaktif.

## Evidence on Hand

- Firmware ESP32 aktif di `packages/firmware/src/`.
- Modul shared schemas di `packages/shared/src/index.js`.
- Web dashboard fungsional dengan Chart.js, SweetAlert2, dan Firebase Auth/RTDB di `apps/web/src/main.js`.

## Product Principles

1. **Konsistensi Terminologi**: Seluruh metrik sensor dan aktuator mencerminkan istilah teknis yang dipakai pada dashboard dan firmware.
2. **Keterbacaan & Ketepatan Data**: Presisi angka dan visualisasi sensor adalah prioritas; tidak menggunakan ilusi angka palsu tanpa konteks.
3. **Interaktivitas yang Berarti**: Konsep 3D ringan dan simulator interaktif dihadirkan untuk mendemonstrasikan logika kerja sensor dan aktuator secara nyata, bukan sekadar hiasan visual.
