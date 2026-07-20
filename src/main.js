import './style.css';

let database, ref, onValue, set, push, query, limitToLast, get;
let Chart;
let Swal;

const SENSOR_DEFAULTS = { soil: 0, temp: 0, humidity: 0, tank: 0, light: 0, mq135: 0 };
const DEVICE_KEYS = ['pump', 'uv', 'mist', 'buzzer'];
const VIEW_KEYS = ['overview', 'automation', 'logs'];

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
    state: {
        automation: { pump: { enabled: false, threshold: 30 }, mist: { enabled: false, threshold: 50 } },
        sensors: { ...SENSOR_DEFAULTS },
        devices: { pump: 0, uv: 0, mist: 0, buzzer: 0 },
        alarmReason: null,
        mq135_ref: null,
        pinnedKey: null,
        sensorReady: false,
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

        database = fbConfig.database;
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
        this.initialized = true;

        await this.loadFirebase();
        await this.initCharts();
        this.connectFirebase();
        this.setupInputs();
        this.startClock();
    },

    enterDashboard: function () {
        document.getElementById('landing-page')?.classList.add('hidden');
        document.getElementById('dashboard-app')?.classList.remove('hidden');
        this.initSidebar();
        setTimeout(() => this.init(), 100);
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
        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('dashboard-app')?.classList.add('hidden');
                document.getElementById('landing-page')?.classList.remove('hidden');
            }
        });
    },

    navigate: function (viewId) {
        VIEW_KEYS.forEach((id) => {
            document.getElementById(`view-${id}`)?.classList.toggle('hidden', id !== viewId);
            document.getElementById(`nav-${id}`)?.classList.toggle('is-active', id === viewId);
            document.getElementById(`mobile-nav-${id}`)?.classList.toggle('is-active', id === viewId);
        });
    },

    connectFirebase: function () {
        if (!database) return;

        const handleDbError = (error) => {
            console.error('Firebase listener error:', error);
            text('connection-status', 'Koneksi gagal');
        };

        onValue(ref(database, 'sensors'), (snapshot) => {
            text('connection-status', 'Terhubung');
            const data = snapshot.val();
            if (!data) return;

            this.state.sensors = { ...this.state.sensors, ...data };
            this.state.sensorReady = true;
            this.updateDashboardUI(this.state.sensors);
            this.updateSystemSummary();
            this.updateAllCharts(this.state.sensors);
            this.runAutomationLogic();
        }, handleDbError);

        onValue(ref(database, 'devices'), (snapshot) => this.syncDeviceToggles(snapshot.val()), handleDbError);
        onValue(ref(database, 'config/automation'), (snapshot) => this.syncAutomationUI(snapshot.val()), handleDbError);
        onValue(query(ref(database, 'logs'), limitToLast(100)), (snapshot) => this.renderLogs(snapshot.val()), handleDbError);
    },

    metricStatus: function (id, label, tone) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = label;
        el.className = `metric-status ${tone}`;
    },

    updateDashboardUI: function (data) {
        if (data.soil !== undefined) {
            text('val-soil', `${data.soil}%`);
            this.metricStatus('soil-msg', data.soil < 40 ? 'Terlalu kering' : data.soil > 60 ? 'Terlalu lembab' : 'Ideal', data.soil < 40 ? 'tone-info' : data.soil > 60 ? 'tone-danger' : 'tone-good');
        }
        if (data.humidity !== undefined) {
            text('val-hum', `${data.humidity}%`);
            this.metricStatus('hum-msg', data.humidity < 40 ? 'Terlalu kering' : data.humidity > 60 ? 'Terlalu lembab' : 'Ideal', data.humidity < 40 ? 'tone-info' : data.humidity > 60 ? 'tone-danger' : 'tone-good');
        }
        if (data.temp !== undefined) {
            text('val-temp', `${data.temp}°C`);
            this.metricStatus('temp-msg', data.temp < 15 ? 'Terlalu dingin' : data.temp > 30 ? 'Terlalu panas' : 'Ideal', data.temp < 15 ? 'tone-info' : data.temp > 30 ? 'tone-danger' : 'tone-good');
        }
        if (data.light !== undefined) {
            text('val-light', data.light);
            this.metricStatus('light-msg', data.light < 500 ? 'Kurang cahaya' : data.light > 2000 ? 'Terlalu terang' : 'Ideal', data.light < 500 ? 'tone-info' : data.light > 2000 ? 'tone-danger' : 'tone-good');
        }
        if (data.mq135 !== undefined) {
            text('val-mq135', data.mq135);
            this.metricStatus('mq135-msg', data.mq135 < 450 ? 'Udara segar' : data.mq135 < 900 ? 'Cukup baik' : 'Polusi tinggi', data.mq135 < 450 ? 'tone-good' : data.mq135 < 900 ? 'tone-warning' : 'tone-danger');
        }
        if (data.tank !== undefined) {
            text('val-tank', `${data.tank}%`);
            this.metricStatus('tank-msg', data.tank < 10 ? 'Perlu isi air' : 'Aman', data.tank < 10 ? 'tone-danger animate-pulse' : 'tone-muted');
        }
    },

    getSensorIssues: function () {
        if (!this.state.sensorReady) return [];

        const s = this.state.sensors;
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

    updateSystemSummary: function () {
        const issues = this.getSensorIssues();
        const activeDevices = DEVICE_KEYS.filter((key) => this.state.devices[key] == 1);
        const activeAutomation = ['pump', 'mist'].filter((key) => this.state.automation?.[key]?.enabled);
        const healthScore = Math.max(0, Math.round(((10 - issues.length) / 10) * 100));

        text('summary-health', this.state.sensorReady ? `${healthScore}%` : '--');
        text('summary-health-note', !this.state.sensorReady ? 'Menunggu data sensor' : issues.length ? `${issues.slice(0, 2).join(', ')}${issues.length > 2 ? ` +${issues.length - 2}` : ''}` : 'Semua parameter dalam batas aman');
        text('summary-devices', `${activeDevices.length}/${DEVICE_KEYS.length}`);
        text('summary-devices-note', activeDevices.length ? activeDevices.map((key) => key.toUpperCase()).join(', ') : 'Belum ada perangkat aktif');
        text('summary-alerts', `${issues.length} isu`);
        text('summary-alerts-note', issues.length ? issues.slice(0, 3).join(', ') : 'Tidak ada alarm kritis');
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

            if (toggle) toggle.checked = enabled;
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
        if (!database) return;

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
        const section = document.getElementById('pinned-chart-section');
        if (!Chart || !section) return;

        if (this.state.pinnedKey) {
            document.getElementById(`card-${this.state.pinnedKey}`)?.classList.remove('hidden');
        }

        if (!key || !chartMeta[key]) {
            section.classList.add('hidden');
            this.state.pinnedKey = null;
            this.charts.pinned?.destroy();
            this.charts.pinned = null;
            return;
        }

        this.state.pinnedKey = key;
        section.classList.remove('hidden');
        document.getElementById(`card-${key}`)?.classList.add('hidden');
        text('pinned-chart-title', chartMeta[key].label);

        this.charts.pinned?.destroy();
        const source = this.charts[key];
        const canvas = document.getElementById('pinnedChart');
        if (!canvas) return;

        this.charts.pinned = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: [...(source?.data.labels || [])],
                datasets: [{
                    label: chartMeta[key].label,
                    data: [...(source?.data.datasets[0].data || [])],
                    borderColor: chartMeta[key].color,
                    backgroundColor: chartMeta[key].bg,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: true } },
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

    startClock: function () {
        if (this.clockTimer) clearInterval(this.clockTimer);
        this.clockTimer = setInterval(() => text('last-updated', new Date().toLocaleTimeString('id-ID', { hour12: false })), 1000);
    }
};

// Landing page initializations
document.addEventListener('DOMContentLoaded', () => {
    // Stats Counter Animation
    const stats = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target') || '0', 10);
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;
                
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        entry.target.innerText = Math.ceil(current).toLocaleString('id-ID');
                        requestAnimationFrame(updateCounter);
                    } else {
                        entry.target.innerText = target.toLocaleString('id-ID') + (target >= 10000 ? '+' : '');
                    }
                };
                
                if(target > 0) updateCounter();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => observer.observe(stat));
});
