# Gardenist - Smart Garden Dashboard

Dashboard web untuk monitoring dan kontrol sistem Smart Garden berbasis IoT. Aplikasi ini memakai Vite, Vanilla JavaScript, Tailwind CSS, Chart.js, SweetAlert2, dan Firebase Realtime Database.

## Fitur Utama

- **Landing page dan dashboard terpisah**: pengguna masuk dari halaman utama ke aplikasi dashboard.
- **Monitoring realtime**: membaca data sensor dari Firebase Realtime Database untuk kelembaban tanah, kelembaban udara, suhu, cahaya, MQ135, dan level tangki.
- **Ringkasan kondisi sistem**: menampilkan skor kesehatan, jumlah perangkat aktif, isu sensor, dan status aturan otomatis.
- **Kontrol perangkat manual**: toggle realtime untuk `pump`, `uv`, `mist`, dan `buzzer`.
- **Otomasi perangkat**: aturan otomatis untuk pompa berdasarkan kelembaban tanah dan mist maker berdasarkan kelembaban udara, lengkap dengan threshold yang bisa disimpan.
- **Alarm otomatis**: buzzer aktif saat polusi tinggi/lonjakan MQ135 atau level air tangki kritis.
- **Grafik monitoring**: Chart.js menampilkan grafik tiap sensor, termasuk fitur pin chart untuk fokus pada satu grafik.
- **Log aktivitas**: membaca 100 log terakhir, mendukung filter tipe, pencarian, sorting, pagination, hapus log, dan export CSV hingga 500 log terakhir.
- **Sidebar responsif**: navigasi overview, automation, dan logs dengan sidebar yang bisa disembunyikan serta navigasi mobile.
- **Dark mode**: tampilan mendukung mode gelap melalui class Tailwind.

## Teknologi

- **Build tool**: Vite
- **Frontend**: HTML5, Vanilla JavaScript ES Modules
- **Styling**: Tailwind CSS via PostCSS (`src/style.css`)
- **Database**: Firebase Realtime Database
- **Chart**: Chart.js
- **Dialog**: SweetAlert2
- **Hosting**: Firebase Hosting, output dari folder `dist`

## Struktur Project

```text
smartgarden-webdashboard/
├── assets/
│   ├── favicon-uny.png
│   └── smart-garden-hero.svg
├── src/
│   ├── firebase-config.js   # Inisialisasi Firebase dari env/fallback config
│   ├── main.js              # State, listener database, UI, chart, automation, log
│   └── style.css            # Tailwind layer dan komponen UI
├── index.html               # Landing page dan markup dashboard
├── firebase.json            # Firebase Hosting ke folder dist
├── vite.config.js           # Konfigurasi Vite
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## Konfigurasi Firebase

Konfigurasi Firebase dibaca dari environment variable Vite. Jika tidak tersedia, aplikasi memakai fallback config di `src/firebase-config.js`.

Buat file `.env` di root project jika ingin memakai konfigurasi sendiri:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Path database yang digunakan aplikasi:

- `sensors`: data sensor realtime.
- `devices`: status perangkat `pump`, `uv`, `mist`, dan `buzzer`.
- `config/automation`: konfigurasi otomasi `pump` dan `mist`.
- `logs`: log aktivitas manual, otomatis, konfigurasi, dan alarm.

## Cara Menjalankan

Install dependency:

```bash
npm install
```

Jalankan mode development:

```bash
npm run dev
```

Build untuk production:

```bash
npm run build
```

Preview hasil build:

```bash
npm run preview
```

## Deployment Firebase Hosting

Project dikonfigurasi agar Firebase Hosting memakai folder `dist`.

```bash
npm run build
firebase deploy
```

Konfigurasi hosting berada di `firebase.json` dengan site `webdashboard-gardenist`.

## Catatan Implementasi

- Entry logic berada di `src/main.js` melalui object global `window.app`.
- `app.enterDashboard()` menampilkan dashboard dan memulai inisialisasi aplikasi.
- `app.connectFirebase()` memasang listener realtime untuk sensor, perangkat, otomasi, dan log.
- `app.runAutomationLogic()` menjalankan aturan pompa, mist maker, dan alarm buzzer.
- `app.renderFilteredLogs()` menangani filter, pencarian, sorting, dan pagination log.
- `app.exportLogsToCSV()` mengambil log dari Firebase dan mengunduh file CSV.
- `src/firebase-config.js` memakai singleton Firebase app agar aman saat Vite hot reload.

---

**Dibuat oleh:** Rhaichan Rasyid Adi Aqhsan S.Pd.
