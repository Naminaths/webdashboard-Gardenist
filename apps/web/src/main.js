import './style.css';
import './premium.css';

let database, auth, ref, onValue, set, push, query, limitToLast, get;
let signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail;
let Chart;
let Swal;

const SENSOR_DEFAULTS = { soil: 0, temp: 0, humidity: 0, tank: 0, light: 0, mq135: 0 };
const DEVICE_KEYS = ['pump', 'uv', 'mist', 'buzzer'];
const VIEW_KEYS = ['overview', 'automation', 'logs', 'devices', 'eco'];

const chartMeta = {
    soil: { label: 'Kelembaban Tanah (%)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    hum: { label: 'Kelembaban Udara (%)', color: '#0891b2', bg: 'rgba(8, 145, 178, 0.12)' },
    temp: { label: 'Suhu Lingkungan (°C)', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
    light: { label: 'Intensitas Cahaya (Lx)', color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.12)' },
    mq135: { label: 'Kualitas Udara (PPM)', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.12)' },
    tank: { label: 'Level Air Tangki (%)', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.12)' }
};

const text = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
};

window.app = {
    charts: {},
    initialized: false,
    clockTimer: null,
    authBusy: false,
    subscriptions: [],
    state: {
        automation: { pump: { enabled: false, threshold: 30 }, mist: { enabled: false, threshold: 50 } },
        sensors: { ...SENSOR_DEFAULTS },
        devices: { pump: 0, uv: 0, mist: 0, buzzer: 0 },
        alarmReason: null,
        user: null,
        ecoPoints: 0,
        weather: { isRaining: false },
        mq135_ref: null,
        pinnedKey: null,
        sensorReady: false,
        firebaseConnected: false,
        logs: {
            items: [],
            filtered: [],
            page: 0,
            pageSize: 10,
            sortField: 'timestamp',
            sortDir: 'desc'
        }
    },

    loadFirebase: async function () {
        if (database) return;
        const fbConfig = await import('./firebase-config.js');
        const fbDb = await import('firebase/database');
        const fbAuth = await import('firebase/auth');
        signInWithEmailAndPassword = fbAuth.signInWithEmailAndPassword;
        signOut = fbAuth.signOut;
        onAuthStateChanged = fbAuth.onAuthStateChanged;
        GoogleAuthProvider = fbAuth.GoogleAuthProvider;
        signInWithPopup = fbAuth.signInWithPopup;
        sendPasswordResetEmail = fbAuth.sendPasswordResetEmail;

        database = fbConfig.database;
        auth = fbConfig.auth;
        if (!auth || !database) throw new Error('Firebase tidak tersedia.');
        auth.languageCode = 'id';
        ref = fbDb.ref;
        onValue = fbDb.onValue;
        set = fbDb.set;
        push = fbDb.push;
        query = fbDb.query;
        limitToLast = fbDb.limitToLast;
        get = fbDb.get;
    },

    loadSwal: async function () {
        if (Swal) return Swal;
        const module = await import('sweetalert2');
        Swal = module.default;
        return Swal;
    },

    init: async function () {
        if (this.initialized) return;
        await this.loadFirebase();
        await this.initCharts();
        if (!this.state.user) return;
        this.initialized = true;
        this.connectFirebase();
        if (!this.inputsReady) { this.setupInputs(); this.inputsReady = true; }
        this.startClock();
    },

    
    showLoginModal: function() {
        const dialog = document.getElementById('login-modal');
        if (dialog.open) return;
        this.loginTrigger = document.activeElement;
        this.showAuthFeedback('');
        dialog.showModal();
        document.body.style.overflow = 'hidden';
        document.getElementById('google-login-button').focus();
    },

    hideLoginModal: function() {
        document.getElementById('login-modal')?.close();
    },

    showAuthFeedback: function(message, success = false) {
        const feedback = document.getElementById('auth-feedback');
        feedback.textContent = message;
        feedback.classList.toggle('hidden', !message);
        feedback.classList.toggle('is-success', success);
    },

    setAuthBusy: function(busy, method) {
        this.authBusy = busy;
        document.getElementById('login-form').setAttribute('aria-busy', String(busy));
        ['google-login-button', 'email-login-button', 'reset-password-button'].forEach(id => {
            document.getElementById(id).disabled = busy;
        });
        document.querySelector('#google-login-button span').textContent = busy && method === 'google' ? 'Menunggu konfirmasi Google…' : 'Lanjutkan dengan Google';
        document.querySelector('#email-login-button span').textContent = busy && method === 'email' ? 'Memverifikasi akun…' : 'Masuk ke dashboard';
        document.getElementById('reset-password-button').textContent = busy && method === 'reset' ? 'Mengirim…' : 'Lupa kata sandi?';
    },

    authErrorMessage: function(error) {
        const messages = {
            'auth/invalid-credential': 'Email atau kata sandi belum sesuai. Periksa kembali dan coba lagi.',
            'auth/wrong-password': 'Email atau kata sandi belum sesuai. Periksa kembali dan coba lagi.',
            'auth/user-not-found': 'Email atau kata sandi belum sesuai. Periksa kembali dan coba lagi.',
            'auth/invalid-email': 'Masukkan alamat email yang valid.',
            'auth/user-disabled': 'Akun ini dinonaktifkan. Hubungi pengelola kebun Anda.',
            'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.',
            'auth/network-request-failed': 'Koneksi terputus. Periksa internet Anda, lalu coba lagi.',
            'auth/popup-closed-by-user': 'Login Google belum selesai. Silakan coba lagi saat Anda siap.',
            'auth/cancelled-popup-request': 'Login Google dibatalkan. Silakan coba lagi.',
            'auth/popup-blocked': 'Browser memblokir jendela Google. Izinkan pop-up untuk situs ini, lalu coba lagi. Anda juga dapat masuk dengan email.',
            'auth/unauthorized-domain': 'Login belum diaktifkan untuk alamat situs ini. Hubungi pengelola Gardenist.',
            'auth/operation-not-allowed': 'Metode login ini belum diaktifkan. Gunakan metode lain atau hubungi pengelola.',
            'auth/account-exists-with-different-credential': 'Email ini menggunakan metode login lain. Masuk dengan email dan kata sandi Anda.'
        };
        return messages[error?.code] || 'Belum dapat masuk. Silakan coba lagi dalam beberapa saat.';
    },

    login: async function() {
        if (this.authBusy || !document.getElementById('login-form').reportValidity()) return;
        this.setAuthBusy(true, 'email');
        this.showAuthFeedback('');
        try {
            if (!auth) await this.loadFirebase();
            await signInWithEmailAndPassword(auth, document.getElementById('login-email').value.trim(), document.getElementById('login-password').value);
        } catch (error) {
            this.showAuthFeedback(this.authErrorMessage(error));
        } finally {
            this.setAuthBusy(false);
        }
    },

    loginWithGoogle: async function() {
        if (this.authBusy) return;
        // Keep the popup directly inside the click gesture; no async import before opening it.
        if (!auth || !GoogleAuthProvider) {
            this.showAuthFeedback('Layanan login sedang disiapkan. Coba lagi beberapa saat.');
            this.loadFirebase().catch(() => this.showAuthFeedback('Layanan login belum tersedia. Muat ulang halaman dan coba lagi.'));
            return;
        }
        this.setAuthBusy(true, 'google');
        this.showAuthFeedback('');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            this.showAuthFeedback(this.authErrorMessage(error));
        } finally {
            this.setAuthBusy(false);
        }
    },

    resetPassword: async function() {
        if (this.authBusy) return;
        const email = document.getElementById('login-email');
        if (!email.reportValidity()) { email.focus(); return; }
        this.setAuthBusy(true, 'reset');
        this.showAuthFeedback('');
        try {
            if (!auth) await this.loadFirebase();
            await sendPasswordResetEmail(auth, email.value.trim());
            this.showAuthFeedback('Jika email ini terdaftar, tautan pemulihan akan dikirim. Periksa inbox dan folder spam. Untuk akun Google, gunakan tombol Google.', true);
        } catch (error) {
            if (error.code === 'auth/user-not-found') this.showAuthFeedback('Jika email ini terdaftar, tautan pemulihan akan dikirim. Periksa inbox dan folder spam.', true);
            else this.showAuthFeedback(this.authErrorMessage(error));
        } finally { this.setAuthBusy(false); }
    },

    togglePassword: function(button) {
        const input = document.getElementById('login-password');
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        button.setAttribute('aria-pressed', String(visible));
        button.setAttribute('aria-label', visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
        button.innerHTML = '<i class="fa-regular fa-eye' + (visible ? '-slash' : '') + '"></i>';
    },

    toggleTheme: function() {
        const dark = document.documentElement.classList.toggle('dark');
        try { localStorage.setItem('gardenist-theme', dark ? 'dark' : 'light'); } catch {}
    },

    toggleDemoPump: function(button) {
        const enabled = button.getAttribute('aria-checked') !== 'true';
        button.setAttribute('aria-checked', String(enabled));
        text('demo-pump-status', enabled ? 'Aktif · simulasi penyiraman berjalan' : 'Nonaktif · coba tombol di atas');
    },

    checkWeather: async function() {
        try {
            // Menggunakan latitude/longitude dummy (misal Jogja)
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-7.7971&longitude=110.3688&current_weather=true');
            const data = await res.json();
            // Kode WMO > 50 biasanya berarti hujan
            if (data.current_weather.weathercode >= 51) {
                this.state.weather.isRaining = true;
                document.getElementById('weather-alert')?.classList.remove('hidden');
            } else {
                this.state.weather.isRaining = false;
                document.getElementById('weather-alert')?.classList.add('hidden');
            }
        } catch(e) {
            console.log('Gagal mengambil data cuaca', e);
        }
    },

    applyPlantProfile: function() {
        const val = document.getElementById('plant-profile-select').value;
        let soil = 30;
        if(val === 'kaktus') soil = 20;
        else if(val === 'anggrek') soil = 40;
        else if(val === 'sayuran') soil = 60;
        
        if (val !== 'custom') {
            document.getElementById('input-soil-thresh').value = soil;
            document.getElementById('lbl-soil-thresh').innerText = soil + '%';
        }
    },

    calculateHarvest: function() {
        const dateInput = document.getElementById('harvest-date').value;
        const duration = parseInt(document.getElementById('harvest-duration').value || '30', 10);
        const display = document.getElementById('harvest-days-left');
        
        if (!dateInput) {
            display.innerText = '--';
            return;
        }
        
        const plantDate = new Date(dateInput);
        const now = new Date();
        const diffTime = Math.abs(now - plantDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const daysLeft = duration - diffDays;
        display.innerText = daysLeft > 0 ? daysLeft : 'Siap Panen';
    },

    exportLogsToPDF: async function() {
        if (!window.jspdf || !window.html2canvas) {
            const swal = await this.loadSwal();
            swal.fire('Error', 'Library PDF belum termuat.', 'error');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Laporan Gardenist - Smart Garden', 14, 22);
        
        doc.setFontSize(12);
        doc.text('Tanggal: ' + new Date().toLocaleDateString('id-ID'), 14, 32);
        
        let y = 45;
        this.state.logs.filtered.slice(0, 30).forEach(log => {
            const dateStr = new Date(log.timestamp).toLocaleString('id-ID');
            doc.text("[" + dateStr + "] " + log.type + ": " + log.message, 14, y);
            y += 8;
            if(y > 280) {
                doc.addPage();
                y = 20;
            }
        });
        
        doc.save('Gardenist_Report_' + new Date().toISOString().split('T')[0] + '.pdf');
    },
    
    // Helper: format relative time
    _relTime: function(ts) {
        if (!ts) return 'Tidak diketahui';
        const diffMs = Date.now() - ts;
        const secs = Math.floor(diffMs / 1000);
        if (secs < 60) return 'Baru saja';
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins} menit lalu`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} jam lalu`;
        return `${Math.floor(hrs / 24)} hari lalu`;
    },

    // Helper: format uptime from seconds
    _formatUptime: function(secs) {
        if (!secs) return '--';
        const d = Math.floor(secs / 86400);
        const h = Math.floor((secs % 86400) / 3600);
        const m = Math.floor((secs % 3600) / 60);
        let parts = [];
        if (d > 0) parts.push(`${d} Hari`);
        if (h > 0) parts.push(`${h} Jam`);
        if (m > 0 && d === 0) parts.push(`${m} Menit`);
        return parts.join(', ') || '< 1 Menit';
    },

    // Helper: WiFi RSSI label
    _rssiLabel: function(rssi) {
        if (!rssi) return '--';
        if (rssi >= -60) return `${rssi} dBm (Sangat Baik)`;
        if (rssi >= -70) return `${rssi} dBm (Baik)`;
        if (rssi >= -80) return `${rssi} dBm (Lemah)`;
        return `${rssi} dBm (Kritis)`;
    },

    updateDevicesUI: function() {
        const ready = this.isNodeOnline();
        const s = this.state.sensors;
        const d = this.state.devices;
        const node = this.state.nodeInfo || {};
        const lastUpdate = this.state.lastSensorUpdate || null;

        // ── Node Status Badge ──────────────────────────────────────────────
        const statusBadge = document.getElementById('node-status-badge');
        const borderEl = document.getElementById('node-card');
        if (statusBadge) {
            statusBadge.innerText = ready ? 'Online' : 'Offline';
            statusBadge.style.background = ready ? 'var(--good-light)' : 'var(--danger-light)';
            statusBadge.style.color = ready ? 'var(--good)' : 'var(--danger)';
        }
        if (borderEl) {
            borderEl.style.borderLeftColor = ready ? 'var(--good)' : 'var(--danger)';
        }

        // ── Node Metadata ──────────────────────────────────────────────────
        // config/node is optionally sent by the ESP32 firmware
        // Fields shown as '--' when not available in Firebase
        text('node-ip',       node.ip       || '--');
        text('node-rssi',     node.rssi     ? this._rssiLabel(node.rssi) : '--');
        text('node-uptime',   node.uptime   ? this._formatUptime(node.uptime) : '--');
        text('node-firmware', node.firmware || '--');
        text('node-heap',     node.heap     ? `${Math.round(node.heap / 1024)} KB` : '--');
        // Last sync: derived from the latest sensor update timestamp
        text('node-last-sync', lastUpdate ? this._relTime(lastUpdate) : '--');

        // ── Sensor Status Table ────────────────────────────────────────────
        const sensorTableEl = document.getElementById('sensor-status-table');
        if (!sensorTableEl) return;

        const sensors = [
            {
                key: 'Kelembaban Tanah', icon: 'fa-droplet', color: '#10b981',
                value: ready ? `${s.soil}%` : '--',
                status: !ready ? 'Offline' : s.soil < 40 ? 'Kering' : s.soil > 60 ? 'Lembab' : 'Ideal',
                tone: !ready ? '#64748b' : s.soil < 40 ? '#0891b2' : s.soil > 60 ? '#ef4444' : '#10b981',
            },
            {
                key: 'Kelembaban Udara', icon: 'fa-cloud-rain', color: '#0891b2',
                value: ready ? `${s.humidity}%` : '--',
                status: !ready ? 'Offline' : s.humidity < 40 ? 'Kering' : s.humidity > 60 ? 'Lembab' : 'Ideal',
                tone: !ready ? '#64748b' : s.humidity < 40 ? '#0891b2' : s.humidity > 60 ? '#ef4444' : '#10b981',
            },
            {
                key: 'Suhu', icon: 'fa-temperature-half', color: '#f97316',
                value: ready ? `${s.temp}°C` : '--',
                status: !ready ? 'Offline' : s.temp < 15 ? 'Dingin' : s.temp > 30 ? 'Panas' : 'Ideal',
                tone: !ready ? '#64748b' : s.temp < 15 ? '#0891b2' : s.temp > 30 ? '#ef4444' : '#10b981',
            },
            {
                key: 'Cahaya (LDR)', icon: 'fa-sun', color: '#ca8a04',
                value: ready ? `${s.light} Lx` : '--',
                status: !ready ? 'Offline' : s.light < 500 ? 'Redup' : s.light > 2000 ? 'Terang' : 'Ideal',
                tone: !ready ? '#64748b' : s.light < 500 ? '#0891b2' : s.light > 2000 ? '#f59e0b' : '#10b981',
            },
            {
                key: 'Kualitas Udara', icon: 'fa-wind', color: '#e11d48',
                value: ready ? `${s.mq135} PPM` : '--',
                status: !ready ? 'Offline' : s.mq135 < 450 ? 'Segar' : s.mq135 < 900 ? 'Cukup' : 'Berbahaya',
                tone: !ready ? '#64748b' : s.mq135 < 450 ? '#10b981' : s.mq135 < 900 ? '#f59e0b' : '#ef4444',
            },
            {
                key: 'Level Tangki Air', icon: 'fa-water', color: '#4f46e5',
                value: ready ? `${s.tank}%` : '--',
                status: !ready ? 'Offline' : s.tank < 10 ? 'Kritis!' : s.tank < 30 ? 'Rendah' : 'Aman',
                tone: !ready ? '#64748b' : s.tank < 10 ? '#ef4444' : s.tank < 30 ? '#f59e0b' : '#10b981',
            },
        ];

        const actuators = [
            { key: 'Pompa Air', icon: 'fa-shower', active: d.pump == 1 },
            { key: 'Lampu UV', icon: 'fa-lightbulb', active: d.uv == 1 },
            { key: 'Mist Maker', icon: 'fa-smog', active: d.mist == 1 },
            { key: 'Buzzer', icon: 'fa-bell', active: d.buzzer == 1 },
        ];

        sensorTableEl.innerHTML = `
            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem;">
                Sensor (${ready ? sensors.length : 0}/${sensors.length} aktif)
            </div>
            ${sensors.map(sen => `
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--border-color);">
                    <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
                        background:${ready ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)'};color:${sen.color};">
                        <i class="fa-solid ${sen.icon}" style="font-size:0.875rem;"></i>
                    </div>
                    <span style="flex:1;font-size:0.875rem;color:var(--text-primary);font-weight:500;">${sen.key}</span>
                    <span style="font-size:0.875rem;font-weight:700;font-family:var(--font-mono);color:var(--text-primary);min-width:6rem;text-align:right;">${sen.value}</span>
                    <span style="font-size:0.75rem;font-weight:600;padding:0.2rem 0.5rem;border-radius:1rem;min-width:4.5rem;text-align:center;
                        background:${sen.tone}18;color:${sen.tone};">${sen.status}</span>
                </div>
            `).join('')}
            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin:1.25rem 0 0.75rem;">
                Aktuator (${actuators.filter(a=>a.active).length}/${actuators.length} aktif)
            </div>
            ${actuators.map(act => `
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--border-color);">
                    <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
                        background:${act.active ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.08)'};color:${act.active ? '#10b981' : '#94a3b8'};">
                        <i class="fa-solid ${act.icon}" style="font-size:0.875rem;"></i>
                    </div>
                    <span style="flex:1;font-size:0.875rem;color:var(--text-primary);font-weight:500;">${act.key}</span>
                    <span style="font-size:0.75rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:1rem;
                        background:${act.active ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)'};
                        color:${act.active ? '#10b981' : '#94a3b8'};">${act.active ? 'ON' : 'OFF'}</span>
                </div>
            `).join('')}
        `;
    },

    restartNode: async function() {
        const swal = await this.loadSwal();
        swal.fire({
            title: 'Restart Node Utama?',
            text: 'Perangkat ESP32 akan dimatikan dan dinyalakan ulang. Ini akan memutus sensor sementara.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Restart',
            cancelButtonText: 'Batal'
        }).then(result => {
            if (result.isConfirmed) {
                if(database) set(ref(database, 'config/commands/restart'), Date.now());
                swal.fire('Terkirim', 'Sinyal restart telah dikirim ke node.', 'success');
            }
        });
    },

    enterDashboard: async function () {
        if (!this.state.user) return;
        this.hideLoginModal();
        document.getElementById('login-password').value = '';
        document.getElementById('landing-page')?.classList.add('hidden');
        document.getElementById('dashboard-app')?.classList.remove('hidden');
        text('user-name', this.state.user.displayName || this.state.user.email || 'Akun Gardenist');
        text('user-avatar', (this.state.user.displayName || this.state.user.email || 'G').charAt(0).toUpperCase());
        this.initSidebar();
        try {
            await this.init();
            this.handleRoute();
        } catch (error) {
            this.initialized = false;
            text('connection-status', 'Gagal memuat. Muat ulang halaman.');
            console.error('Dashboard initialization failed:', error);
        }
    },

    leaveDashboard: function() {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
        clearInterval(this.clockTimer);
        clearInterval(this._uptimeTimer);
        Object.values(this.charts).forEach(chart => chart?.destroy?.());
        this.charts = {};
        this.initialized = false;
        this.state.user = null;
        this.state.firebaseConnected = false;
        this.state.sensorReady = false;
        this.state.lastSensorUpdate = null;
        this.state.sensors = { ...SENSOR_DEFAULTS };
        this.state.devices = { pump: 0, uv: 0, mist: 0, buzzer: 0 };
        this.state.automation = { pump: { enabled: false, threshold: 30 }, mist: { enabled: false, threshold: 50 } };
        this.state.logs.items = [];
        this.state.logs.filtered = [];
        document.getElementById('dashboard-app')?.classList.add('hidden');
        document.getElementById('landing-page')?.classList.remove('hidden');
    },



    initSidebar: function () {
        const collapsed = localStorage.getItem('gardenist-sidebar-collapsed') === 'true';
        this.setSidebarCollapsed(collapsed);
    },

    setSidebarCollapsed: function (collapsed) {
        const appEl = document.getElementById('dashboard-app');
        const reveal = document.getElementById('sidebar-reveal');

        appEl?.classList.toggle('sidebar-collapsed', collapsed);
        if (reveal) reveal.setAttribute('aria-expanded', String(!collapsed));
        localStorage.setItem('gardenist-sidebar-collapsed', String(collapsed));
    },

    toggleSidebar: function (collapsed) {
        this.setSidebarCollapsed(collapsed);
        setTimeout(() => {
            Object.values(this.charts).forEach((chart) => chart?.resize?.());
        }, 260);
    },

    logout: async function () {
        const swal = await this.loadSwal();
        swal.fire({
            title: 'Keluar dari Dashboard?',
            text: 'Anda akan kembali ke halaman utama.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                if (auth) {
                    try {
                        await signOut(auth);
                    } catch(e) {
                        swal.fire('Belum dapat keluar', 'Periksa koneksi internet dan coba lagi.', 'error');
                        return;
                    }
                }
                window.location.hash = '';
                document.getElementById('dashboard-app')?.classList.add('hidden');
                document.getElementById('landing-page')?.classList.remove('hidden');
            }
        });
    },

    
    initRouting: function() {
        window.addEventListener('hashchange', () => this.handleRoute());
    },
    handleRoute: function() {
        const dashboard = document.getElementById('dashboard-app');
        if (!dashboard || dashboard.classList.contains('hidden')) return;
        const hash = window.location.hash.replace('#', '') || 'overview';
        if (VIEW_KEYS.includes(hash)) {
            this.navigate(hash, true);
        } else {
            this.navigate('overview', true);
        }
    },
    navigate: function (viewId, fromRoute = false) {
        if (!fromRoute) window.location.hash = viewId;
        VIEW_KEYS.forEach((id) => {
            document.getElementById(`view-${id}`)?.classList.toggle('hidden', id !== viewId);
            document.getElementById(`nav-${id}`)?.classList.toggle('is-active', id === viewId);
            document.getElementById(`mobile-nav-${id}`)?.classList.toggle('is-active', id === viewId);
        });
        text('dashboard-page-title', { overview: 'Ringkasan Kebun', automation: 'Otomasi', logs: 'Aktivitas & Alarm', devices: 'Perangkat Cerdas', eco: 'Eco-Score' }[viewId]);
        document.querySelectorAll('.sidebar-nav .nav-item, .bottom-nav-item').forEach(button => {
            if (button.classList.contains('is-active')) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
    },


    connectFirebase: function () {
        if (!database) return;
        const subscribe = (...args) => this.subscriptions.push(onValue(...args));

        const handleDbError = (error) => {
            console.error('Firebase listener error:', error);
            text('connection-status', 'Koneksi gagal');
        };

        subscribe(ref(database, '.info/connected'), snapshot => {
            const connected = snapshot.val() === true;
            this.state.firebaseConnected = connected;
            text('connection-status', this.isNodeOnline() ? 'ESP32 Online' : 'ESP32 Offline');
            document.querySelector('.status-indicator .status-dot')?.classList.toggle('active', connected);
            document.querySelector('.status-indicator')?.classList.toggle('is-offline', !this.isNodeOnline());
        }, handleDbError);

        subscribe(ref(database, 'sensors'), (snapshot) => {
            text('connection-status', 'Terhubung');
            const data = snapshot.val();
            if (!data) return;

            this.state.sensors = { ...this.state.sensors, ...data };
            this.state.sensorReady = true;
            this.state.lastSensorUpdate = Date.now();
            this.updateDashboardUI(this.state.sensors);
            this.updateSystemSummary();
            this.updateAllCharts(this.state.sensors);
            this.runAutomationLogic();
            this.updateDevicesUI();
        }, handleDbError);

        subscribe(ref(database, 'config/node'), (snapshot) => {
            const data = snapshot.val();
            this.state.nodeInfo = data || {};
            this.updateDevicesUI();
        }, handleDbError);

        subscribe(ref(database, 'devices'), (snapshot) => this.syncDeviceToggles(snapshot.val()), handleDbError);
        subscribe(ref(database, 'config/automation'), (snapshot) => this.syncAutomationUI(snapshot.val()), handleDbError);
        subscribe(query(ref(database, 'logs'), limitToLast(100)), (snapshot) => this.renderLogs(snapshot.val()), handleDbError);

        // Mulai update relatif waktu setiap menit
        this._uptimeTimer = setInterval(() => this.updateNodeStatus(), 5000);
    },

    isNodeOnline: function () {
        const last = this.state.lastSensorUpdate;
        return Boolean(this.state.firebaseConnected && this.state.sensorReady && last && (Date.now() - last <= 15000));
    },

    updateNodeStatus: function () {
        const online = this.isNodeOnline();
        text('connection-status', online ? 'ESP32 Online' : 'ESP32 Offline');
        document.querySelector('.status-indicator')?.classList.toggle('is-offline', !online);
        const heroNodeStatus = document.getElementById('hero-node-status');
        if (heroNodeStatus) {
            heroNodeStatus.innerText = online ? 'ESP32 Online' : 'ESP32 Offline';
            heroNodeStatus.parentElement?.classList.toggle('is-offline', !online);
        }
        const liveDot = document.getElementById('sensor-live-dot');
        if (liveDot) liveDot.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${online ? '#10b981' : '#94a3b8'};display:inline-block;${online ? 'box-shadow:0 0 6px #10b981;animation:pulse 2s infinite;' : ''}"></span><span style="color:${online ? '#10b981' : '#64748b'};font-weight:600;">${online ? 'Live' : 'Offline'}</span>`;
        this.updateDevicesUI();
        this.updateSystemSummary();
    },

    metricStatus: function (id, label, tone) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = label;
        el.className = `metric-status ${tone}`;
    },

    updateGreeting: function () {
        const hour = new Date().getHours();
        let greeting = 'Kondisi Kebun Hari Ini';
        if (hour >= 4 && hour < 11) greeting = 'Selamat Pagi, Petani Cerdas 🌅';
        else if (hour >= 11 && hour < 15) greeting = 'Selamat Siang, Petani Cerdas ☀️';
        else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore, Petani Cerdas 🌇';
        else greeting = 'Selamat Malam, Petani Cerdas 🌙';
        
        const el = document.getElementById('hero-greeting-text');
        if (el) el.innerText = greeting;
    },

    updateDashboardUI: function (data) {
        // Helper: update a sensor bar fill width
        const setBar = (id, pct) => {
            const el = document.getElementById(id);
            if (el) el.style.width = Math.min(100, Math.max(0, pct)).toFixed(1) + '%';
        };

        this.updateNodeStatus();

        // Update live dot indicator & Hero node status
        const liveDot = document.getElementById('sensor-live-dot');
        if (liveDot) {
            const online = this.isNodeOnline();
            liveDot.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${online ? '#10b981' : '#94a3b8'};display:inline-block;${online ? 'box-shadow:0 0 6px #10b981;animation:pulse 2s infinite;' : ''}"></span><span style="color:${online ? '#10b981' : '#64748b'};font-weight:600;">${online ? 'Live' : 'Offline'}</span>`;
        }
        const heroNodeStatus = document.getElementById('hero-node-status');
        if (heroNodeStatus) {
            heroNodeStatus.innerText = this.isNodeOnline() ? 'ESP32 Online' : 'ESP32 Offline';
            heroNodeStatus.parentElement?.classList.toggle('is-offline', !this.isNodeOnline());
        }

        this.updateGreeting();

        if (data.soil !== undefined) {
            text('val-soil', `${data.soil}%`);
            setBar('bar-fill-soil', data.soil); // 0-100%
            this.metricStatus('soil-msg', data.soil < 40 ? 'Terlalu kering' : data.soil > 60 ? 'Terlalu lembab' : 'Ideal', data.soil < 40 ? 'tone-info' : data.soil > 60 ? 'tone-danger' : 'tone-good');
        }
        if (data.humidity !== undefined) {
            text('val-hum', `${data.humidity}%`);
            setBar('bar-fill-hum', data.humidity); // 0-100%
            this.metricStatus('hum-msg', data.humidity < 40 ? 'Terlalu kering' : data.humidity > 60 ? 'Terlalu lembab' : 'Ideal', data.humidity < 40 ? 'tone-info' : data.humidity > 60 ? 'tone-danger' : 'tone-good');
        }
        if (data.temp !== undefined) {
            text('val-temp', `${data.temp}°C`);
            setBar('bar-fill-temp', (data.temp / 50) * 100); // max scale 50°C
            this.metricStatus('temp-msg', data.temp < 15 ? 'Terlalu dingin' : data.temp > 30 ? 'Terlalu panas' : 'Ideal', data.temp < 15 ? 'tone-info' : data.temp > 30 ? 'tone-danger' : 'tone-good');
        }
        if (data.light !== undefined) {
            text('val-light', `${data.light} Lx`);
            setBar('bar-fill-light', (data.light / 3000) * 100); // max scale 3000 Lx
            this.metricStatus('light-msg', data.light < 500 ? 'Kurang cahaya' : data.light > 2000 ? 'Terlalu terang' : 'Ideal', data.light < 500 ? 'tone-info' : data.light > 2000 ? 'tone-danger' : 'tone-good');
        }
        if (data.mq135 !== undefined) {
            text('val-mq135', `${data.mq135} PPM`);
            setBar('bar-fill-mq135', (data.mq135 / 1200) * 100); // max scale 1200 PPM
            this.metricStatus('mq135-msg', data.mq135 < 450 ? 'Udara segar' : data.mq135 < 900 ? 'Cukup baik' : 'Polusi tinggi', data.mq135 < 450 ? 'tone-good' : data.mq135 < 900 ? 'tone-warning' : 'tone-danger');
        }
        if (data.tank !== undefined) {
            text('val-tank', `${data.tank}%`);
            setBar('bar-fill-tank', data.tank); // 0-100%
            this.metricStatus('tank-msg', data.tank < 10 ? 'Perlu isi air' : 'Aman', data.tank < 10 ? 'tone-danger animate-pulse' : 'tone-muted');
        }
    },


    getSensorIssues: function () {
        if (!this.state.sensorReady) return [];

        const s = this.state.sensors;
        if (s.soil === 0 && s.humidity === 0 && s.temp === 0 && s.light === 0 && s.mq135 === 0) {
            return [];
        }

        const issues = [];

        if (s.soil < 40) issues.push('Tanah kering');
        if (s.soil > 60) issues.push('Tanah lembab');
        if (s.humidity < 40) issues.push('Udara kering');
        if (s.humidity > 60) issues.push('Udara lembab');
        if (s.temp < 15) issues.push('Suhu rendah');
        if (s.temp > 30) issues.push('Suhu tinggi');
        if (s.light < 500) issues.push('Cahaya rendah');
        if (s.light > 2000) issues.push('Cahaya berlebih');
        if (s.mq135 >= 900) issues.push('Polusi tinggi');
        if (s.tank < 10 && s.tank > 0) issues.push('Tangki kritis');

        return issues;
    },

    
    // ─── ECO-SCORE RULES ────────────────────────────────────────────────────────
    // Eco-Score dimulai dari 0 dan dibangun dari rules berikut:
    //  +150  Sensor aktif & mengirim data (sensorReady)
    //  +100  Auto-siram (pump) aktif
    //  +100  Auto-mist aktif
    //  +80   Kelembaban tanah dalam range ideal (40–60%)
    //  +80   Kelembaban udara dalam range ideal (40–60%)
    //  +60   Suhu dalam range ideal (15–30°C)
    //  +60   Level tangki mencukupi (> 20%)
    //  +50   Kualitas udara baik (MQ135 < 450 PPM)
    //  +30   Intensitas cahaya cukup (500–2000 Lx)
    //  -100  per kejadian ALARM dalam log (max -300)
    //  -50   per kejadian over-watering (soil > 65%) dalam log (max -150)
    // Total maksimum: 710 pts → grade A (≥ 600), B (≥ 450), C (≥ 300), D (< 300)
    // ────────────────────────────────────────────────────────────────────────────
    ECO_RULES: [
        { id: 'sensor_active',   label: 'Sensor aktif & terhubung',           points: 150, check: (s, c, l, r) => r && !(s.soil === 0 && s.humidity === 0 && s.temp === 0 && s.light === 0 && s.mq135 === 0) },
        { id: 'auto_pump',       label: 'Otomasi siram (pompa) aktif',         points: 100, check: (s, c) => !!c?.pump?.enabled },
        { id: 'auto_mist',       label: 'Otomasi mist aktif',                  points: 100, check: (s, c) => !!c?.mist?.enabled },
        { id: 'soil_ideal',      label: 'Kelembaban tanah ideal (40–60%)',      points: 80,  check: (s) => s.soil >= 40 && s.soil <= 60 },
        { id: 'hum_ideal',       label: 'Kelembaban udara ideal (40–60%)',      points: 80,  check: (s) => s.humidity >= 40 && s.humidity <= 60 },
        { id: 'temp_ideal',      label: 'Suhu lingkungan ideal (15–30°C)',      points: 60,  check: (s) => s.temp >= 15 && s.temp <= 30 },
        { id: 'tank_ok',         label: 'Level tangki air mencukupi (> 20%)',   points: 60,  check: (s) => s.tank > 20 },
        { id: 'air_clean',       label: 'Kualitas udara baik (< 450 PPM)',      points: 50,  check: (s) => s.mq135 > 0 && s.mq135 < 450 },
        { id: 'light_ok',        label: 'Intensitas cahaya cukup (500–2000 Lx)', points: 30,  check: (s) => s.light >= 500 && s.light <= 2000 },
    ],

    updateEcoScore: function() {
        const s = this.state.sensors;
        const c = this.state.automation;
        const ready = this.state.sensorReady;
        const logs = this.state.logs.items || [];

        // Hitung poin dari rules
        let points = 0;
        const ruleResults = [];
        for (const rule of this.ECO_RULES) {
            const passed = rule.check(s, c, logs, ready);
            if (passed) points += rule.points;
            ruleResults.push({ ...rule, passed });
        }

        // Penalti dari log ALARM (max 3 kejadian = -300)
        const alarmCount = logs.filter(l => l.type === 'ALARM').length;
        const alarmPenalty = Math.min(alarmCount * 100, 300);
        points -= alarmPenalty;

        // Hitung over-watering dari log AUTO dengan kata "pump" saat tanah > 65%
        const overwateringEvents = logs.filter(l => l.type === 'ALARM' && l.message && l.message.toLowerCase().includes('over')).length
            + (s.soil > 65 ? 1 : 0);
        const overwaterPenalty = Math.min(overwateringEvents * 50, 150);
        points -= overwaterPenalty;

        // Hitung air yang "dihemat" berdasarkan poin AUTO di log
        const autoEvents = logs.filter(l => l.type === 'AUTO').length;
        const waterSaved = Math.round(autoEvents * 0.5 * 2.5); // estimasi 2.5L per sesi auto

        // Clamp 0–710
        const MAX_POINTS = 710;
        points = Math.max(0, Math.min(MAX_POINTS, points));
        this.state.ecoPoints = points;

        // Grade thresholds
        let grade, gradeLabel, gradeDesc, gradeBg;
        if (points >= 600) {
            grade = 'A'; gradeLabel = 'Excellent';
            gradeDesc = 'Taman Anda Sangat Efisien! Semua sistem berjalan optimal.';
            gradeBg = 'linear-gradient(135deg, #10b981, #059669)';
        } else if (points >= 450) {
            grade = 'B'; gradeLabel = 'Good';
            gradeDesc = 'Sistem berjalan baik. Ada beberapa area yang bisa dioptimalkan.';
            gradeBg = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        } else if (points >= 300) {
            grade = 'C'; gradeLabel = 'Fair';
            gradeDesc = 'Perlu perhatian lebih. Aktifkan otomasi dan pastikan sensor terhubung.';
            gradeBg = 'linear-gradient(135deg, #f59e0b, #d97706)';
        } else if (points > 0) {
            grade = 'D'; gradeLabel = 'Poor';
            gradeDesc = 'Sistem belum optimal. Hubungkan sensor dan aktifkan rules otomasi.';
            gradeBg = 'linear-gradient(135deg, #ef4444, #dc2626)';
        } else {
            grade = 'F'; gradeLabel = 'Offline';
            gradeDesc = 'Sensor belum terhubung. Hubungkan perangkat untuk mulai merekam data.';
            gradeBg = 'linear-gradient(135deg, #64748b, #475569)';
        }

        // Update DOM
        const ecoPointsEl = document.getElementById('eco-points');
        const ecoWaterEl = document.getElementById('eco-water-saved');
        const ecoOverEl = document.getElementById('eco-over-watering');
        const ecoGradeEl = document.getElementById('eco-score-value');
        const ecoTitleEl = document.getElementById('eco-title');
        const ecoDescEl = document.getElementById('eco-desc');
        const ecoRulesEl = document.getElementById('eco-rules-list');

        if (ecoPointsEl) ecoPointsEl.innerText = `${points} Pts`;
        if (ecoWaterEl) ecoWaterEl.innerText = waterSaved > 0 ? `+ ${waterSaved} Liter` : '0 Liter';
        if (ecoOverEl) ecoOverEl.innerText = `${overwateringEvents} Kejadian`;
        if (ecoTitleEl) ecoTitleEl.innerText = gradeDesc;
        if (ecoDescEl) ecoDescEl.innerText = `${points} / ${MAX_POINTS} poin • Alarm: ${alarmCount} • Log otomasi: ${autoEvents}`;

        if (ecoGradeEl) {
            ecoGradeEl.innerText = grade;
            ecoGradeEl.nextElementSibling.innerText = gradeLabel;
            ecoGradeEl.parentElement.parentElement.style.background = gradeBg;
        }

        // Render rules checklist
        if (ecoRulesEl) {
            ecoRulesEl.innerHTML = ruleResults.map(r => `
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--border-color);">
                    <span style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.7rem;font-weight:700;
                        background:${r.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)'};color:${r.passed ? '#10b981' : '#ef4444'};">
                        ${r.passed ? '✓' : '✗'}
                    </span>
                    <span style="flex:1;font-size:0.875rem;color:var(--text-primary);">${r.label}</span>
                    <span style="font-size:0.8rem;font-weight:700;color:${r.passed ? '#10b981' : 'var(--text-muted)'};">+${r.points} pts</span>
                </div>
            `).join('') + `
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--border-color);">
                    <span style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.7rem;font-weight:700;
                        background:${alarmPenalty > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.15)'};color:${alarmPenalty > 0 ? '#ef4444' : '#10b981'};">
                        ${alarmPenalty > 0 ? '✗' : '✓'}
                    </span>
                    <span style="flex:1;font-size:0.875rem;color:var(--text-primary);">Tidak ada alarm kritis (${alarmCount} alarm)</span>
                    <span style="font-size:0.8rem;font-weight:700;color:${alarmPenalty > 0 ? '#ef4444' : 'var(--text-muted)'};">-${alarmPenalty} pts</span>
                </div>
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;">
                    <span style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.7rem;font-weight:700;
                        background:${overwaterPenalty > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.15)'};color:${overwaterPenalty > 0 ? '#ef4444' : '#10b981'};">
                        ${overwaterPenalty > 0 ? '✗' : '✓'}
                    </span>
                    <span style="flex:1;font-size:0.875rem;color:var(--text-primary);">Tidak ada over-watering (${overwateringEvents} kejadian)</span>
                    <span style="font-size:0.8rem;font-weight:700;color:${overwaterPenalty > 0 ? '#ef4444' : 'var(--text-muted)'};">-${overwaterPenalty} pts</span>
                </div>
            `;
        }
    },

    updateSystemSummary: function () {
        const issues = this.getSensorIssues();
        const activeDevices = DEVICE_KEYS.filter((key) => this.state.devices[key] == 1);
        const activeAutomation = ['pump', 'mist'].filter((key) => this.state.automation?.[key]?.enabled);
        
        let healthScore = Math.max(0, Math.round(((10 - issues.length) / 10) * 100));
        
        const s = this.state.sensors;
        const isDisconnected = s.soil === 0 && s.humidity === 0 && s.temp === 0 && s.light === 0 && s.mq135 === 0;
        
        if (isDisconnected) {
            healthScore = 0;
        }

        text('summary-health', this.state.sensorReady ? `${healthScore}%` : '--');
        text('summary-health-note', !this.state.sensorReady ? 'Menunggu data sensor' : isDisconnected ? 'Sensor belum terhubung' : issues.length ? `${issues.slice(0, 2).join(', ')}${issues.length > 2 ? ` +${issues.length - 2}` : ''}` : 'Semua parameter dalam batas aman');
        text('summary-devices', `${activeDevices.length}/${DEVICE_KEYS.length}`);
        text('summary-devices-note', activeDevices.length ? activeDevices.map((key) => key.toUpperCase()).join(', ') : 'Belum ada perangkat aktif');
        text('summary-alerts', `${issues.length} isu`);
        text('summary-alerts-note', isDisconnected ? 'Sensor belum terhubung' : issues.length ? issues.slice(0, 3).join(', ') : 'Tidak ada alarm kritis');
        text('summary-automation', `${activeAutomation.length}/2`);
        text('summary-automation-note', activeAutomation.length ? activeAutomation.map((key) => key === 'pump' ? 'Auto Siram' : 'Auto Mist').join(', ') : 'Aturan otomatis nonaktif');
    },

    syncDeviceToggles: function (devices) {
        if (!devices) return;
        this.state.devices = { ...this.state.devices, ...devices };

        DEVICE_KEYS.forEach((key) => {
            const enabled = this.state.devices[key] == 1;
            const toggle = document.getElementById(`toggle-${key}`);
            const status = document.getElementById(`status-${key}`);
            const cardAction = document.getElementById(`card-action-${key}`);
            const stateInd = document.getElementById(`state-ind-${key}`);

            if (toggle) toggle.checked = enabled;
            if (cardAction) cardAction.classList.toggle('device-active', enabled);
            if (stateInd) stateInd.innerText = enabled ? 'ON' : 'OFF';

            if (!status) return;

            let label = enabled ? 'ON' : 'OFF';
            let className = enabled ? 'device-status is-on' : 'device-status';

            if (key === 'buzzer' && enabled) {
                const tankCritical = this.state.alarmReason === 'tank' || this.state.sensors.tank < 10;
                const pollutionCritical = this.state.alarmReason === 'pollution' || this.state.sensors.mq135 > 900;

                if (tankCritical && pollutionCritical) label = 'ON (Tangki & polusi kritis)';
                else if (tankCritical) label = 'ON (Tangki kritis)';
                else if (pollutionCritical) label = 'ON (Polusi tinggi)';

                className = 'device-status is-alert';
            }

            status.innerText = label;
            status.className = className;
        });

        this.updateSystemSummary();
    },

    syncAutomationUI: function (cfg) {
        if (!cfg) return;
        this.state.automation = { ...this.state.automation, ...cfg };

        if (cfg.pump) {
            const enable = document.getElementById('auto-pump-enable');
            const input = document.getElementById('input-soil-thresh');
            if (enable) enable.checked = cfg.pump.enabled;
            if (input) input.value = cfg.pump.threshold;
            text('lbl-soil-thresh', `${cfg.pump.threshold}%`);
        }

        if (cfg.mist) {
            const enable = document.getElementById('auto-mist-enable');
            const input = document.getElementById('input-hum-thresh');
            if (enable) enable.checked = cfg.mist.enabled;
            if (input) input.value = cfg.mist.threshold;
            text('lbl-hum-thresh', `${cfg.mist.threshold}%`);
        }

        this.runAutomationLogic();
        this.updateSystemSummary();
    },

    logActivity: function (type, message) {
        if (!database) return;
        push(ref(database, 'logs'), { timestamp: Date.now(), type, message });
    },

    toggleDevice: function (key, enabled, source = 'MANUAL') {
        if (!database) return;
        set(ref(database, `devices/${key}`), enabled ? 1 : 0)
            .then(() => this.logActivity(source, `${key.toUpperCase()} ${enabled ? 'ON' : 'OFF'}`));
    },

    saveAutomation: async function (type) {
        await this.loadFirebase();
        if (!database) return;

        const thresholdId = type === 'pump' ? 'input-soil-thresh' : 'input-hum-thresh';
        const enabled = document.getElementById(`auto-${type}-enable`)?.checked || false;
        const threshold = Number.parseInt(document.getElementById(thresholdId)?.value || '0', 10);

        set(ref(database, `config/automation/${type}`), { enabled, threshold })
            .then(async () => {
                const swal = await this.loadSwal();
                swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengaturan tersimpan.', timer: 1500, showConfirmButton: false });
                this.logActivity('CONFIG', `Update aturan ${type.toUpperCase()}`);
            });
    },

    runAutomationLogic: function () {
        if (!database || !this.state.user || !this.state.sensorReady) return;

        const s = this.state.sensors;
        const c = this.state.automation;
        const d = this.state.devices;
        const now = Date.now();

        if (c?.pump?.enabled) {
            const threshold = Number.parseInt(c.pump.threshold, 10);
            if (s.soil < threshold && d.pump == 0) this.toggleDevice('pump', true, 'AUTO');
            if (s.soil > threshold + 5 && d.pump == 1) this.toggleDevice('pump', false, 'AUTO');
        }

        if (c?.mist?.enabled) {
            const threshold = Number.parseInt(c.mist.threshold, 10);
            if (s.humidity < threshold && d.mist == 0) this.toggleDevice('mist', true, 'AUTO');
            if (s.humidity > threshold + 5 && d.mist == 1) this.toggleDevice('mist', false, 'AUTO');
        }

        if (!this.state.mq135_ref || now - this.state.mq135_ref.ts > 5000) {
            this.state.mq135_ref = { val: s.mq135 || 0, ts: now };
        }

        const pollutionSpike = (s.mq135 || 0) - this.state.mq135_ref.val > 200;
        const pollutionCritical = pollutionSpike || s.mq135 > 900;
        const tankCritical = s.tank < 10 && s.tank > 0;
        const shouldBuzz = pollutionCritical || tankCritical;

        if (pollutionCritical) {
            this.metricStatus('mq135-msg', pollutionSpike ? 'Bahaya: lonjakan polusi' : 'Bahaya: polusi tinggi', 'tone-danger animate-pulse');
        }

        if (shouldBuzz && d.buzzer == 0) {
            const alarmState = pollutionCritical && tankCritical ? 'tank_and_pollution' : pollutionCritical ? 'pollution' : 'tank';
            const reason = pollutionCritical && tankCritical ? 'Polusi Tinggi & Air Tangki Kritis!' : pollutionCritical ? 'Polusi Tinggi!' : 'Air Tangki Kritis!';

            this.state.alarmReason = alarmState;
            set(ref(database, 'devices/buzzer'), 1);
            this.logActivity('ALARM', `Buzzer ON (${reason})`);
        } else if (!shouldBuzz && d.buzzer == 1) {
            this.state.alarmReason = null;
            set(ref(database, 'devices/buzzer'), 0);
        }
    },

    renderLogs: function (data) {
        this.state.logs.items = data ? Object.values(data).map((log) => ({
            timestamp: Number(log.timestamp || 0),
            type: String(log.type || 'INFO').toUpperCase(),
            message: String(log.message || '-')
        })) : [];
        this.state.logs.page = 0;
        this.renderFilteredLogs();
        // Recalculate eco-score whenever logs change
        this.updateEcoScore();
    },

    getFilteredLogs: function () {
        const selectedType = document.getElementById('log-type-filter')?.value || 'all';
        const queryText = (document.getElementById('log-search')?.value || '').trim().toLowerCase();
        const { sortField, sortDir } = this.state.logs;

        return this.state.logs.items
            .filter((log) => selectedType === 'all' || log.type === selectedType)
            .filter((log) => !queryText || `${log.type} ${log.message}`.toLowerCase().includes(queryText))
            .sort((a, b) => {
                const aVal = a[sortField];
                const bVal = b[sortField];
                const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return sortDir === 'asc' ? comparison : -comparison;
            });
    },

    renderFilteredLogs: function () {
        const tbody = document.getElementById('logs-table-body');
        if (!tbody) return;

        const logs = this.getFilteredLogs();
        this.state.logs.filtered = logs;
        const totalPages = Math.max(1, Math.ceil(logs.length / this.state.logs.pageSize));
        this.state.logs.page = Math.min(this.state.logs.page, totalPages - 1);
        const start = this.state.logs.page * this.state.logs.pageSize;
        const visibleLogs = logs.slice(start, start + this.state.logs.pageSize);

        tbody.innerHTML = '';

        if (!visibleLogs.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="p-5 text-center text-slate-400">Tidak ada log yang cocok.</td></tr>';
        }

        visibleLogs.forEach((log) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60';

            const timeCell = document.createElement('td');
            timeCell.className = 'whitespace-nowrap p-4 text-xs font-mono text-slate-400';
            timeCell.textContent = log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID', { hour12: false }) : '-';

            const typeCell = document.createElement('td');
            typeCell.className = 'p-4';
            const badge = document.createElement('span');
            badge.className = `log-badge ${String(log.type || 'INFO').toLowerCase()}`;
            badge.textContent = log.type || 'INFO';
            typeCell.appendChild(badge);

            const messageCell = document.createElement('td');
            messageCell.className = 'min-w-64 p-4 text-sm font-medium text-slate-700 dark:text-slate-200';
            messageCell.textContent = log.message || '-';

            row.append(timeCell, typeCell, messageCell);
            tbody.appendChild(row);
        });

        // Render Mobile Activity Feed Stream
        const feedContainer = document.getElementById('logs-activity-feed');
        if (feedContainer) {
            feedContainer.innerHTML = '';
            if (!visibleLogs.length) {
                feedContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Tidak ada aktivitas log yang cocok.</div>';
            } else {
                visibleLogs.forEach((log) => {
                    const card = document.createElement('div');
                    card.className = 'log-feed-card';

                    let icon = 'fa-circle-info';
                    let iconBg = 'tone-info-bg';
                    const typeLower = String(log.type || 'INFO').toLowerCase();
                    if (typeLower === 'alarm') { icon = 'fa-triangle-exclamation'; iconBg = 'tone-danger-bg'; }
                    else if (typeLower === 'auto') { icon = 'fa-robot'; iconBg = 'tone-good-bg'; }
                    else if (typeLower === 'manual') { icon = 'fa-hand-pointer'; iconBg = 'tone-info-bg'; }
                    else if (typeLower === 'config') { icon = 'fa-sliders'; iconBg = 'tone-warning-bg'; }

                    const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
                    const relStr = this._relTime(log.timestamp);

                    card.innerHTML = `
                        <div class="log-feed-icon ${iconBg}">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div class="log-feed-content">
                            <div class="log-feed-header">
                                <span class="log-badge ${typeLower}">${log.type || 'INFO'}</span>
                                <span class="log-feed-time" title="${timeStr}">${relStr}</span>
                            </div>
                            <div class="log-feed-message">${log.message || '-'}</div>
                        </div>
                    `;
                    feedContainer.appendChild(card);
                });
            }
        }

        text('logs-count', `${logs.length} log`);
        text('logs-page-info', logs.length ? `Menampilkan ${start + 1}-${Math.min(start + this.state.logs.pageSize, logs.length)} dari ${logs.length}` : 'Tidak ada data');

        const prev = document.getElementById('logs-prev');
        const next = document.getElementById('logs-next');
        if (prev) prev.disabled = this.state.logs.page <= 0;
        if (next) next.disabled = this.state.logs.page >= totalPages - 1;

        ['timestamp', 'type', 'message'].forEach((field) => {
            text(`sort-${field}`, this.state.logs.sortField === field ? (this.state.logs.sortDir === 'asc' ? '↑' : '↓') : '');
        });
    },

    changeLogPage: function (direction) {
        const totalPages = Math.max(1, Math.ceil(this.state.logs.filtered.length / this.state.logs.pageSize));
        this.state.logs.page = Math.min(Math.max(this.state.logs.page + direction, 0), totalPages - 1);
        this.renderFilteredLogs();
    },

    sortLogs: function (field) {
        if (this.state.logs.sortField === field) {
            this.state.logs.sortDir = this.state.logs.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.logs.sortField = field;
            this.state.logs.sortDir = field === 'timestamp' ? 'desc' : 'asc';
        }
        this.state.logs.page = 0;
        this.renderFilteredLogs();
    },

    resetLogFilters: function () {
        const typeFilter = document.getElementById('log-type-filter');
        const search = document.getElementById('log-search');
        if (typeFilter) typeFilter.value = 'all';
        if (search) search.value = '';
        this.state.logs.page = 0;
        this.renderFilteredLogs();
    },

    clearLogs: async function () {
        const swal = await this.loadSwal();
        swal.fire({
            title: 'Hapus Log?',
            text: 'Data log akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed && database) {
                set(ref(database, 'logs'), null).then(() => swal.fire('Terhapus', 'Data log berhasil dihapus.', 'success'));
            }
        });
    },

    exportLogsToCSV: async function () {
        await this.loadFirebase();
        if (!database) return;

        get(query(ref(database, 'logs'), limitToLast(500))).then(async (snapshot) => {
            const data = snapshot.val();
            const swal = await this.loadSwal();

            if (!data) {
                swal.fire({ icon: 'info', title: 'Info', text: 'Tidak ada data log untuk diexport.' });
                return;
            }

            const rows = Object.values(data)
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((log) => {
                    const d = new Date(log.timestamp);
                    const date = d.toLocaleString('sv-SE').replace('T', ' ');
                    const type = String(log.type || 'INFO').replace(/"/g, '""');
                    const message = String(log.message || '').replace(/"/g, '""').replace(/\n/g, ' ');
                    return `"${date}","${type}","${message}"`;
                });

            const blob = new Blob([`\uFEFFTimestamp,Type,Message\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `smartgarden_logs_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        }).catch(async (err) => {
            console.error('Export Error:', err);
            const swal = await this.loadSwal();
            swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil data untuk export.' });
        });
    },

    createChartConfig: function (ctx, meta) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(15).fill(''),
                datasets: [{
                    label: meta.label,
                    data: Array(15).fill(0),
                    borderColor: meta.color,
                    backgroundColor: meta.bg,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { display: false }, y: { beginAtZero: true } },
                plugins: { legend: { display: false } },
                interaction: { intersect: false, mode: 'index' }
            }
        });
    },

    initCharts: async function () {
        if (!Chart) {
            const module = await import('chart.js/auto');
            Chart = module.default;
        }

        Object.entries(chartMeta).forEach(([key, meta]) => {
            const canvasId = `${key}Chart`;
            const canvas = document.getElementById(canvasId);
            if (canvas) this.charts[key] = this.createChartConfig(canvas.getContext('2d'), meta);
        });

        // Initialize default master chart with soil sensor
        this.switchMasterChart('soil');
    },

    activeMasterSensor: 'soil',
    activeTimeRange: 'realtime',

    switchMasterChart: function (key) {
        if (!key || !chartMeta[key]) return;
        this.activeMasterSensor = key;

        // Highlight active pill
        document.querySelectorAll('.chart-pill').forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.sensor === key);
        });

        // Highlight selected carousel card
        document.querySelectorAll('.sensor-carousel-card').forEach((card) => {
            card.classList.toggle('is-selected', card.id === `carousel-card-${key}`);
        });

        // Render master chart
        this.pinChart(key);
    },

    setTimeFilter: function (range, btnEl) {
        this.activeTimeRange = range;
        document.querySelectorAll('.time-filter-btn').forEach((b) => b.classList.remove('is-active'));
        if (btnEl) btnEl.classList.add('is-active');

        if (this.activeMasterSensor) {
            this.switchMasterChart(this.activeMasterSensor);
        }
    },

    updateAllCharts: function (sensors) {
        if (!this.charts.soil) return;

        const now = new Date().toLocaleTimeString('id-ID', { hour12: false });
        const updateSingle = (chart, value) => {
            if (!chart) return;
            if (chart.data.datasets[0].data.length > 20) {
                chart.data.datasets[0].data.shift();
                chart.data.labels.shift();
            }
            chart.data.datasets[0].data.push(value);
            chart.data.labels.push(now);
            chart.update('none');
        };
        const updateSensor = (chart, value) => {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) updateSingle(chart, parsed);
        };

        updateSensor(this.charts.soil, sensors.soil);
        updateSensor(this.charts.hum, sensors.humidity);
        updateSensor(this.charts.temp, sensors.temp);
        updateSensor(this.charts.light, sensors.light);
        updateSensor(this.charts.mq135, sensors.mq135);
        updateSensor(this.charts.tank, sensors.tank);

        const pinnedSource = this.state.pinnedKey === 'hum' ? 'humidity' : this.state.pinnedKey;
        if (this.state.pinnedKey && sensors[pinnedSource] !== undefined) {
            updateSensor(this.charts.pinned, sensors[pinnedSource]);
        }
    },

    pinChart: function (key) {
        if (!Chart) return;
        if (!key || !chartMeta[key]) return;

        this.state.pinnedKey = key;
        text('pinned-chart-title', `Tren ${chartMeta[key].label}`);

        this.charts.pinned?.destroy();
        const source = this.charts[key];
        const canvas = document.getElementById('pinnedChart');
        if (!canvas) return;

        const labels = source?.data.labels?.length ? [...source.data.labels] : Array(15).fill('');
        const data = source?.data.datasets[0]?.data?.length ? [...source.data.datasets[0].data] : Array(15).fill(0);

        this.charts.pinned = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: chartMeta[key].label,
                    data: data,
                    borderColor: chartMeta[key].color,
                    backgroundColor: chartMeta[key].bg,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: chartMeta[key].color,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(150, 150, 150, 0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                interaction: { intersect: false, mode: 'index' },
                animation: false
            }
        });
    },

    setupInputs: function () {
        ['soil', 'hum'].forEach((key) => {
            const input = document.getElementById(`input-${key}-thresh`);
            input?.addEventListener('input', (event) => text(`lbl-${key}-thresh`, `${event.target.value}%`));
        });

        document.getElementById('log-type-filter')?.addEventListener('change', () => {
            this.state.logs.page = 0;
            this.renderFilteredLogs();
        });
        document.getElementById('log-search')?.addEventListener('input', () => {
            this.state.logs.page = 0;
            this.renderFilteredLogs();
        });
    },

    initDynamicTheme: function() {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 6) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },
    startClock: function () {
        if (this.clockTimer) clearInterval(this.clockTimer);
        const update = () => text('last-updated', this.state.lastSensorUpdate ? 'Data: ' + this._relTime(this.state.lastSensorUpdate) : 'Menunggu data sensor');
        update();
        this.clockTimer = setInterval(update, 10000);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Check Firebase Auth persistence on every page load.
// Firebase stores the session in IndexedDB/localStorage automatically.
// We use onAuthStateChanged to restore the session without requiring re-login.
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    app.initRouting();
    const dialog = document.getElementById('login-modal');
    dialog.addEventListener('close', () => {
        document.body.style.overflow = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-password').type = 'password';
        const toggle = document.querySelector('.password-toggle');
        toggle.setAttribute('aria-pressed', 'false');
        toggle.setAttribute('aria-label', 'Tampilkan kata sandi');
        toggle.innerHTML = '<i class="fa-regular fa-eye"></i>';
        if (!app.state.user) app.loginTrigger?.focus();
    });
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    try {
        await app.loadFirebase();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                app.state.user = user;
                app.enterDashboard();
            } else {
                app.leaveDashboard();
            }
        });
    } catch (e) {
        console.error('Auth bootstrap error:', e);
        document.getElementById('landing-page')?.classList.remove('hidden');
        app.showAuthFeedback('Layanan login belum tersedia. Periksa koneksi lalu muat ulang halaman.');
    }
});
