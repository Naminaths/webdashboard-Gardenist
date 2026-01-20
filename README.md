# 🌱 Gardenist - Smart Garden Dashboard

Dashboard monitoring dan kontrol untuk sistem Smart Garden berbasis IoT, terintegrasi dengan Firebase Realtime Database.

## 🚀 Fitur Utama

-   **Realtime Monitoring**: Menampilkan data sensor (Tanah, Udara, Suhu, Cahaya, MQ135, Tangki) secara langsung.
-   **Interaktif Chart**: Grafik data historis menggunakan Chart.js dengan fitur **Pin Chart** untuk fokus pada satu grafik.
-   **Otomasi Cerdas**:
    -   Pompa otomatis menyala jika tanah kering.
    -   Mist Maker otomatis menyala jika udara kering.
    -   Buzzer berbunyi jika Tangki Kosong atau Polusi Tinggi (>900 PPM / Lonjakan >200).
-   **Log & Alarm**: Pencatatan riwayat aktivitas dan alarm bahaya, dapat diekspor ke **CSV**.
-   **Realtime Clock**: Jam digital akurat (Sync UTC/Local).
-   **Responsive Design**: Tampilan optimal di Desktop dan Mobile (Tailwind CSS).

## 🛠️ Teknologi yang Digunakan

-   **Frontend**: HTML5, Vanilla JavaScript (ES Modules), Tailwind CSS (CDN).
-   **Visualization**: Chart.js.
-   **Backend / Database**: Firebase Realtime Database.
-   **Hosting**: Firebase Hosting.

## 📂 Struktur File (Modular)

Proyek ini menggunakan arsitektur JavaScript Modular (ESM) agar kode lebih rapi dan mudah dikelola.

```
smartgarden-webdashboard/
│
├── public/                 # Folder Publik (yang di-deploy)
│   ├── index.html          # Halaman Utama (Entry Point)
│   └── js/                 # Logika JavaScript Modular
│       ├── app.js          # Controller Utama (Menghubungkan semua modul)
│       ├── config.js       # Konfigurasi API Firebase
│       ├── firebase-init.js# Inisialisasi Koneksi Database
│       ├── state.js        # State Management (Data Sensor, Status Device)
│       ├── ui.js           # Manipulasi DOM & Tampilan
│       ├── charts.js       # Konfigurasi Grafik & Fitur Pin
│       └── automation.js   # Logika Otomasi (Pompa, Alarm, Log)
│
├── firebase.json           # Konfigurasi Deployment Firebase
├── .firebaserc             # Alias Project Firebase
└── RUN_DASHBOARD.bat       # Script untuk menjalankan server lokal
```

## 💻 Cara Menjalankan (Local Development)

Karena menggunakan **ES Modules**, aplikasi ini **TIDAK BISA** dijalankan hanya dengan double-click `index.html` (Browser akan memblokir karena kebijakan CORS file://).

**Solusi:**
1.  Cari file **`RUN_DASHBOARD.bat`** di folder root.
2.  **Double Click** file tersebut.
3.  Browser akan otomatis terbuka di `http://localhost:8000`.

## ☁️ Deployment (Firebase Hosting)

Lakukan langkah ini jika ingin meng-online-kan dashboard:

1.  Pastikan Firebase CLI sudah terinstall.
2.  Buka terminal di folder project.
3.  Jalankan perintah:
    ```bash
    firebase deploy
    ```
4.  Dashboard akan aktif di URL yang diberikan (misal: `https://webdashboard-gardenist.web.app`).

## 📚 Dokumentasi Kode

### `js/app.js`
File induk yang mengimpor semua modul lain. Berisi fungsi `init`, `enterDashboard`, dan listener utama Firebase.

### `js/automation.js`
Otak dari sistem pintar.
-   `runAutomationLogic()`: Mengecek sensor terus menerus untuk memicu Pompa/Mist/Buzzer.
-   `exportLogsToCSV()`: Mengunduh data log ke format Excel.

### `js/ui.js`
Mengurus tampilan.
-   `updateDashboardUI()`: Memperbarui angka sensor dan warna status text.
-   `startClock()`: Menjalankan jam digital realtime.

### `js/charts.js`
Mengurus grafik.
-   `updateAllCharts()`: Menambah data baru ke grafik secara realtime.
-   `pinChart()`: Fitur untuk memperbesar/mem-pin grafik tertentu ke atas.

---
**Dibuat oleh:**

Rhaichan Rasyid Adi Aqhsan S.Pd.


