# Design System: Gardenist

<!-- impeccable:design-schema 1 -->

## Design Philosophy

Gardenist mengusung estetika **Scandinavian Botanical Laboratory & Precision IoT Engineering**:
- **Bersih & Ilmiah**: Mengutamakan kejelasan data sensor, tipografi proporsional, dan penataan hierarki tanpa ornamen berlebih (tanpa teks gradien, tanpa glow klise).
- **Konsep 3D Ringan (Lightweight Spatial 3D)**: Menghadirkan model isometrik 3D interaktif yang tanggap terhadap pergerakan kursor dan orientasi gawai (gyroscope) menggunakan CSS 3D Transforms murni tanpa beban berat WebGL.
- **Konsistensi Codebase**: Seluruh metrik, sensor, dan aktuator menggunakan terminologi resmi Bahasa Indonesia yang selaras 100% dengan `apps/web/src/main.js` dan `packages/shared/src/index.js`.

---

## Typography

- **Primary Sans**: `Manrope`, system-ui, -apple-system, sans-serif
  - Headline H1: `clamp(34px, 4.2vw, 56px)`, line-height: `1.15`, letter-spacing: `-0.03em`, font-weight: 800
  - Headline H2: `clamp(26px, 3.2vw, 38px)`, line-height: `1.25`, letter-spacing: `-0.02em`, font-weight: 700
  - Headline H3: `clamp(18px, 2vw, 22px)`, line-height: `1.35`, letter-spacing: `-0.01em`, font-weight: 700
  - Body: `16px`, line-height: `1.65`, font-weight: 400/500
- **Technical Monospace**: `JetBrains Mono`, `SF Mono`, `Cascadia Code`, monospace
  - Digunakan untuk nilai telemetri, pembacaan ADC, status node, dan data formatif.

---

## Color Palette & Materials

### Dark Mode (Default IoT Monitor)
- Ground: `--c-bg: #090e0c`, `--c-bg-subtle: #0f1713`
- Surfaces: `--c-surface: #121c17`, Raised: `--c-surface-raised: #18261f`, Hover: `--c-surface-hover: #1f3128`
- Borders: `--c-border: rgba(16, 185, 129, 0.16)`, Subtle: `--c-border-subtle: rgba(255, 255, 255, 0.08)`
- Primary Botanical Emerald: `--c-primary: #10b981`, Deep: `--c-primary-deep: #059669`, Light: `--c-primary-light: #34d399`
- Text: Main: `--c-text-main: #f1f5f3`, Secondary: `--c-text-secondary: #94a89e`, Dim: `--c-text-dim: #647a70`

### Light Mode (Botanical Herbarium)
- Ground: `--c-bg: #f8faf8`, Subtle: `--c-bg-subtle: #f1f5f2`
- Surfaces: `--c-surface: #ffffff`, Raised: `--c-surface-raised: #f3f7f4`
- Borders: `--c-border: rgba(5, 150, 105, 0.18)`
- Primary: `--c-primary: #059669`, Deep: `--c-primary-deep: #047857`
- Text: Main: `--c-text-main: #0f1713`, Secondary: `--c-text-secondary: #475a50`

---

## Canonical Naming Matrix

| Komponen | Kode Key | Satuan | Ambang Batas Ideal | Fungsi / Deskripsi |
|---|---|---|---|---|
| **Kelembaban Tanah** | `soil` | `%` | 40% &ndash; 80% (Kering: &lt;40%) | Sensor kapasitif v1.2 anti-korosi elektrolisis |
| **Suhu Lingkungan** | `temp` | `°C` | 20&deg;C &ndash; 32&deg;C | Sensor digital DHT22 suhu udara mikro |
| **Kelembaban Udara** | `humidity` | `% RH` | 50% &ndash; 75% | Sensor digital DHT22 kelembaban relatif |
| **Intensitas Cahaya** | `light` | `Lx` | 300 &ndash; 2000 Lx | Sensor LDR Gl5528 fluks foton |
| **Kualitas Udara** | `mq135` | `PPM` | &lt; 450 PPM (&gt;900 PPM bahaya) | Sensor gas amonia, asap, CO2 MQ-135 |
| **Level Air Tangki** | `tank` | `%` | &gt; 25% (&lt;10% kritis kering) | Sensor ultrasonik HC-SR04 reservoir air |
| **Pompa Air** | `pump` | Digital | ON / OFF | Relay irigasi mikro perakaran tanaman |
| **Mist Maker** | `mist` | Digital | ON / OFF | Pengkabut ultrasonik kelembaban daun |
| **Lampu UV** | `uv` | Digital | ON / OFF | Spektrum fotosintesis pencahayaan buatan |
| **Alarm Buzzer** | `buzzer` | Digital | ON / OFF | Peringatan suara kondisi kritis dan bahaya |
| **Eco-Score** | `eco` | Poin | 0 &ndash; 1000 Poin | Indeks efisiensi pemakaian air dan energi |

---

## Verified Character & Symbol Encoding

- Simbol derajat Celsius: Gunakan `&deg;C` atau `°C` (bukan corrupted `Â°C`).
- Tanda hubung em-dash: Gunakan `&mdash;` atau `—` (bukan corrupted `â€”`).
- Tanda panah arah: Gunakan `&darr;` / `&rarr;` atau ikon FontAwesome (bukan corrupted `â†“`).
- Persentase: `%` dan tanda rentang `&ndash;` atau `–`.
