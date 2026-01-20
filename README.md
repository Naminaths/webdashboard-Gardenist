# 🌱 Gardenist - Smart Garden Dashboard

Dashboard monitoring dan kontrol untuk sistem Smart Garden berbasis IoT, terintegrasi dengan Firebase Realtime Database.

## 🚀 Fitur Utama

-   **Kontrol & Monitoring Terpusat**: Layout Dashboard yang dioptimalkan dengan **Kontrol Manual** di bagian atas untuk akses cepat, diikuti oleh **Grafik Monitoring**.
-   **Realtime Monitoring**: Menampilkan data sensor (Tanah, Udara, Suhu, Cahaya, MQ135, Tangki) secara langsung.
-   **Interaktif Chart**: Grafik data historis menggunakan Chart.js dengan fitur **Pin Chart** untuk fokus pada satu grafik.
-   **Otomasi Cerdas**:
    -   Pompa otomatis menyala jika tanah kering.
    -   Mist Maker otomatis menyala jika udara kering.
    -   Buzzer berbunyi jika Tangki Kosong atau Polusi Tinggi (>900 PPM / Lonjakan >200).
-   **Log & Alarm**: Pencatatan riwayat aktivitas dan alarm bahaya, dapat diekspor ke **CSV**.
-   **Realtime Clock**: Jam digital akurat (Sync UTC/Local).
-   **Responsive Design**: Desktop (Grid 4 Kolom) & Mobile (Single Column).

## 🛠️ Teknologi yang Digunakan

-   **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (CDN).
-   **Visualization**: Chart.js.
-   **Backend / Database**: Firebase Realtime Database.
-   **Hosting**: Firebase Hosting.

## 📂 Struktur File

Saat ini proyek menggunakan struktur **Monolithic** pada `index.html` untuk memastikan stabilitas deployment di Firebase Hosting dan menghindari isu *Cross-Origin Resource Sharing (CORS)* pada modul eksternal di beberapa environment.

```
smartgarden-webdashboard/
│
├── public/                 # Folder Publik (yang di-deploy)
│   ├── index.html          # FILE UTAMA (HTML, CSS, & JS Logic ada di sini)
│   └── js/                 # (Arsip) Versi Modular - tidak digunakan di live version
│
├── firebase.json           # Konfigurasi Deployment Firebase
├── .firebaserc             # Alias Project Firebase
└── RUN_DASHBOARD.bat       # Script utility
```

## 💻 Cara Menjalankan

### Versi Live (Deploy)
Aplikasi yang aktif adalah yang berjalan dari `public/index.html`. File ini memuat semua logika yang diperlukan.

### Deployment (Firebase Hosting)

Lakukan langkah ini jika ingin meng-online-kan dashboard:

1.  Pastikan Firebase CLI sudah terinstall.
2.  Buka terminal di folder project.
3.  Jalankan perintah:
    ```bash
    firebase deploy
    ```
4.  Dashboard akan aktif di URL yang diberikan (misal: `https://webdashboard-gardenist.web.app`).

## 📚 Dokumentasi Fitur Code (Dalam index.html)

Logika pemrograman kini disatukan dalam script module di bagian bawah `index.html`:

- **`app.init()`**: Menginisialisasi chart, koneksi firebase, input, dan jam.
- **`app.runAutomationLogic()`**: "Otak" sistem. Mengecek logika sensor vs threshold setiap kali ada data baru.
- **`app.pinChart(key)`**: Fungsi untuk menyalin data grafik kecil ke grafik utama (Pinned) dan menyembunyikan grafik asalnya.
- **`app.syncDeviceToggles()`**: Memastikan tombol UI on/off sesuai dengan status asli di Database (agar tidak bentrok dengan kontrol otomatis).

---
**Dibuat oleh:**

Rhaichan Rasyid Adi Aqhsan S.Pd.
