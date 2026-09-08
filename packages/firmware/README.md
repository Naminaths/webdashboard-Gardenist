# ESP32 Firmware: Gardenist IoT Controller

Kode firmware untuk mikrokontroler ESP32 yang bertugas mengumpulkan data sensor lingkungan kebun dan mengendalikan aktuator fisik, tersinkronisasi dua arah (*bidirectional sync*) dengan Firebase Realtime Database.

## Spesifikasi Pin ESP32

| Komponen | Jenis | Pin ESP32 | Keterangan |
| :--- | :--- | :--- | :--- |
| **DHT22** | Sensor Lingkungan | GPIO 4 | Suhu & Kelembaban Udara |
| **Soil Moisture** | Sensor Tanah | GPIO 34 (ADC1) | Kelembaban media tanam |
| **LDR** | Sensor Cahaya | GPIO 35 (ADC1) | Intensitas cahaya matahari |
| **MQ-135** | Sensor Udara | GPIO 32 (ADC1) | Kualitas udara / gas |
| **HC-SR04 Trig** | Sensor Air | GPIO 5 | Pemicu ultrasonik |
| **HC-SR04 Echo** | Sensor Air | GPIO 18 | Penerima pantulan |
| **Relay Pompa** | Aktuator | GPIO 19 | Siram air (Active LOW) |
| **Relay Mist Maker** | Aktuator | GPIO 21 | Pengabut kelembaban (Active LOW) |
| **Relay UV Light** | Aktuator | GPIO 22 | Lampu UV tanaman (Active LOW) |
| **Buzzer Alarm** | Aktuator | GPIO 23 | Notifikasi buzzer (Active LOW) |

## Cara Flashing (Arduino IDE / PlatformIO)
1. Pasang library: `Firebase ESP32 Client` by Mobizt, `DHT sensor library` by Adafruit.
2. Buka `src/Gardenist_ESP32.ino`.
3. Masukkan konfigurasi WiFi (`WIFI_SSID`, `WIFI_PASSWORD`) dan Token database Firebase Anda.
4. Pilih Board: **ESP32 Dev Module**, atur port COM yang sesuai, lalu tekan **Upload**.
