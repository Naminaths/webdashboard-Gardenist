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
-   **Realtime Clock**: Jam digital akurat (Sync UTC/Local) yang diperbarui setiap detik.
-   **Tampilan Modern**: Dukungan **Dark Mode** & Light Mode dengan transisi halus.
-   **Responsive Design**: Desktop (Grid 4 Kolom) & Mobile (Single Column).

## 🛠️ Teknologi yang Digunakan

-   **Frontend**: HTML5, Vanilla JavaScript (ES Modules), Tailwind CSS (CDN).
-   **Visualization**: Chart.js.
-   **Backend / Database**: Firebase Realtime Database.
-   **Hosting**: Firebase Hosting.

## 📂 Struktur File

Proyek ini telah direfaktor untuk menggunakan struktur yang lebih bersih dengan pemisahan *concern* antara logika dan tampilan.

```
smartgarden-webdashboard/
│
├── assets/                 # Aset statis (Favicon, Gambar)
├── src/                    # Source Code JavaScript
│   ├── firebase-config.js  # Konfigurasi & Inisialisasi Firebase
│   └── main.js             # Logika Utama Aplikasi (Chart, Sensor, Otomasi)
│
├── index.html              # File Utama (Entry Point)
├── firebase.json           # Konfigurasi Deployment Firebase
├── .firebaserc             # Alias Project Firebase
└── README.md               # Dokumentasi Proyek
```

## 💻 Cara Menjalankan

### Versi Lokal (Development)
1.  Buka folder project di VS Code.
2.  Gunakan ekstensi "Live Server" untuk menjalankan `index.html`.
3.  Pastikan koneksi internet aktif untuk memuat CDN (Tailwind, Chart.js, Firebase) dan aset eksternal.

### Deployment (Firebase Hosting)

Lakukan langkah ini jika ingin meng-online-kan dashboard:

1.  Pastikan Firebase CLI sudah terinstall.
2.  Buka terminal di folder project.
3.  Jalankan perintah:
    ```bash
    firebase deploy
    ```
4.  Dashboard akan aktif di URL yang diberikan (misal: `https://webdashboard-gardenist.web.app`).

## 📚 Dokumentasi Fitur Code

Logika pemrograman utama terdapat di `src/main.js`:

-   **`app.init()`**: Menginisialisasi chart, koneksi firebase, input, dan memulai jam digital.
-   **`app.startClock()`**: Memperbarui jam setiap detik agar selalu sinkron.
-   **`app.runAutomationLogic()`**: "Otak" sistem. Mengecek logika sensor vs threshold setiap kali ada data baru.
-   **`app.pinChart(key)`**: Fungsi untuk menyalin data grafik kecil ke grafik utama (Pinned).
-   **`app.syncDeviceToggles()`**: Sinkronisasi tombol UI on/off dengan status asli di Database.

---
**Dibuat oleh:**

Rhaichan Rasyid Adi Aqhsan S.Pd.
