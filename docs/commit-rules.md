# Aturan & Standar Git Commit (Conventional Commits Monorepo)

Dokumen ini mendefinisikan aturan dan standar penulisan pesan commit pada repositori **Gardenist Monorepo**.

---

## 1. Format Standar Commit

```text
<type>(<scope>): <deskripsi singkat perubahan>
```

Contoh:
- `feat(web): tambahkan widget indikator kelembaban tanah`
- `fix(firmware): perbaiki timeout pembacaan sensor ultrasonic HC-SR04`
- `chore(database): perbarui aturan indeks timestamp di Firebase RTDB`
- `docs(monorepo): tambahkan panduan setup ESP32 di README`

---

## 2. Pilihan Type

| Type | Kapan Digunakan |
| :--- | :--- |
| `feat` | Penambahan fitur baru ke sistem atau antarmuka |
| `fix` | Perbaikan bug atau kesalahan logic |
| `refactor` | Restrukturisasi kode tanpa mengubah alur fungsionalitas |
| `chore` | Pembaruan dependensi, konfigurasi build, atau skrip repo |
| `docs` | Perubahan khusus dokumentasi (README, markdown, diagram) |
| `style` | Perapihan tampilan, format whitespace, CSS minor |
| `ci` | Perubahan pada file workflow GitHub Actions (`.github/`) |

---

## 3. Pilihan Scope (Monorepo Modules)

| Scope | Folder Terkait |
| :--- | :--- |
| `web` | `apps/web/` (Dashboard Vite, Tailwind, UI) |
| `firmware` | `packages/firmware/` (ESP32 Arduino sketch, pinout) |
| `database` | `packages/database/` (Firebase rules & schema) |
| `shared` | `packages/shared/` (Konstanta, status, ambang batas) |
| `ci` | `.github/workflows/` (Action build & deploy) |
| `docs` | `docs/`, `architecture.md`, `README.md` |
| `monorepo` | Perubahan global yang mencakup lebih dari 2 modul |

---

## 4. Perintah Auto-Commit Otomatis

Anda dapat menggunakan skrip otomatis yang mendeteksi folder yang diubah:

### A. Auto-Commit Penuh (Auto Detect Scope + Commit + Push)
```bash
npm run commit
```
*Skrip otomatis men-stage seluruh file, mendeteksi scope yang diubah, membuat pesan commit terstandar, dan langsung melakukan push ke GitHub.*

### B. Auto-Commit dengan Keterangan Khusus
```bash
npm run commit -- "tambahkan grafik perbandingan suhu mingguan"
```
*Otomatis diformat menjadi: `feat(web): tambahkan grafik perbandingan suhu mingguan` lalu di-push.*

### C. Auto-Commit Lokal Tanpa Push
```bash
npm run commit -- --no-push
```

---

## 5. Cloud Auto-Commit (GitHub Actions)

Repositori juga dilengkapi workflow [.github/workflows/auto-commit.yml](file:///d:/WEB%20DEV/webdashboard-Gardenist/.github/workflows/auto-commit.yml):
- Dapat dijalankan secara manual dari tab **Actions > Auto Commit & Sync > Run workflow** di GitHub.
- Memiliki jadwal otomatis mingguan untuk memeriksa sinkronisasi status repositori.
