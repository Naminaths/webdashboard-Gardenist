# Gardenist - Smart Garden IoT Monorepo

Repositori resmi ekosistem **Gardenist (Smart Garden IoT)** yang mengintegrasikan aplikasi web client dashboard, skema cloud database, modul firmware mikrokontroler ESP32, dan dokumentasi arsitektur dalam format **Monorepo** (*npm workspaces*).

---

## 📂 Struktur Monorepo

```text
webdashboard-Gardenist/
├── apps/
│   └── web/                         # [App] Frontend Web Dashboard (Vite + Tailwind + Vanilla JS)
│       ├── assets/                  # Favicon dan grafis hero SVG
│       ├── public/                  # PWA Manifest dan Service Worker
│       ├── src/
│       │   ├── firebase-config.js   # Inisialisasi Firebase Auth & RTDB
│       │   ├── main.js              # State, logic, listener Firebase, Chart.js
│       │   └── style.css            # Tailwind & custom CSS layers
│       ├── index.html               # Halaman landing & dashboard app
│       ├── vite.config.js           # Konfigurasi bundler Vite
│       ├── tailwind.config.js       # Konfigurasi Tailwind CSS
│       ├── postcss.config.js        # Konfigurasi PostCSS
│       └── package.json             # (@gardenist/web)
│
├── packages/
│   ├── shared/                      # [Package] Konstanta bersama, keys sensor & batas ambang
│   │   ├── src/index.js
│   │   └── package.json             # (@gardenist/shared)
│   │
│   ├── database/                    # [Package] Firebase Security Rules & definisi skema RTDB
│   │   ├── database.rules.json
│   │   └── README.md
│   │
│   └── firmware/                    # [Package] Kode ESP32 Arduino / PlatformIO Controller
│       ├── src/Gardenist_ESP32.ino  # Firmware pembaca sensor & pengontrol aktuator
│       └── README.md                # Tabel pinout dan panduan flashing
│
├── docs/                            # Dokumentasi teknis & diagram
│   └── architecture.md              # Diagram arsitektur IoT PlantUML
│
├── .github/workflows/               # CI/CD Workflows (Firebase Hosting & Vercel)
├── firebase.json                    # Konfigurasi Firebase Hosting & Rules
├── vercel.json                      # Konfigurasi deployment Vercel
├── package.json                     # Root Monorepo configuration (npm workspaces)
└── README.md
```

---

## 🌿 Fitur Utama Web Dashboard (`apps/web`)

- **Landing Page & Dashboard**: Tampilan transisi mulus dengan autentikasi Firebase.
- **Monitoring Real-Time**: Sensor suhu, kelembaban udara (DHT22), kelembaban tanah, cahaya (LDR), kualitas udara (MQ-135), dan level air tangki (Ultrasonic).
- **Kontrol Aktuator Manual & Otomasi**: Kontrol relay pompa air, mist maker, lampu UV, dan alarm buzzer secara realtime.
- **Visualisasi & Log**: Grafik interaktif dengan Chart.js, riwayat log aktivitas dengan pencarian, filter, dan export CSV.
- **Eco Score & Dark Mode**: Sistem penilaian kesehatan kebun otomatis dan tema gelap elegan.

---

## 🚀 Panduan Memulai (Quickstart)

Semua perintah dapat dijalankan langsung dari **root direktori**:

### 1. Pasang Dependensi
```bash
npm install
```
*Perintah ini otomatis menginstal dependensi seluruh workspace.*

### 2. Jalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Dashboard akan aktif di `http://localhost:5173`.

### 3. Build untuk Produksi
```bash
npm run build
```
Hasil build akan tersimpan di folder `apps/web/dist`.

### 4. Preview Hasil Build
```bash
npm run preview
```

---

## ☁️ Deployment

### Firebase Hosting
Hosting dikonfigurasi melalui `firebase.json` mengarah langsung ke build output `apps/web/dist`:
```bash
npm run build
firebase deploy
```

### Vercel
File `vercel.json` di root direktori telah dikonfigurasi otomatis agar mengenali perintah build monorepo:
```bash
vercel --prod
```

---

## 📖 Dokumentasi Terkait
- [Arsitektur Sistem IoT](file:///d:/WEB%20DEV/webdashboard-Gardenist/docs/architecture.md)
- [Dokumentasi Firmware ESP32](file:///d:/WEB%20DEV/webdashboard-Gardenist/packages/firmware/README.md)
- [Dokumentasi Skema Database](file:///d:/WEB%20DEV/webdashboard-Gardenist/packages/database/README.md)

---

**Dibuat oleh:** Rhaichan Rasyid Adi Aqhsan S.Pd.
