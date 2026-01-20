import { database } from './firebase-config.js';
import { ref, onValue, set, push, query, limitToLast, get } from "firebase/database";
import Chart from 'chart.js/auto';

// Attach app to window for global access (required for current HTML onclick handlers)
window.app = {
    charts: {},
    state: {
        automation: { pump: { enabled: false, threshold: 30 }, mist: { enabled: false, threshold: 50 } },
        sensors: { soil: 0, temp: 0, humidity: 0, tank: 0, light: 0, mq135: 0 },
        devices: { pump: 0, uv: 0, mist: 0, buzzer: 0 },
        alarmReason: null,
        pinnedKey: null
    },

    init: function () {
        this.initCharts();
        this.connectFirebase();
        this.setupInputs();
        this.startClock();
    },

    enterDashboard: function () {
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('dashboard-app').classList.remove('hidden');
        setTimeout(() => this.init(), 100);
    },

    logout: function () {
        if (confirm("Keluar dari Dashboard?")) {
            document.getElementById('dashboard-app').classList.add('hidden');
            document.getElementById('landing-page').classList.remove('hidden');
        }
    },

    exportLogsToCSV: function () {
        if (!database) return;

        get(query(ref(database, 'logs'), limitToLast(500))).then((snapshot) => {
            const data = snapshot.val();
            if (!data) { alert("Tidak ada data log untuk diexport (kosong)."); return; }
            let csvContent = "\uFEFFTimestamp,Type,Message\n";
            Object.values(data).sort((a, b) => b.timestamp - a.timestamp).forEach(log => {
                const d = new Date(log.timestamp);
                const dateStr = d.getFullYear() + "-" +
                    String(d.getMonth() + 1).padStart(2, '0') + "-" +
                    String(d.getDate()).padStart(2, '0') + " " +
                    String(d.getHours()).padStart(2, '0') + ":" +
                    String(d.getMinutes()).padStart(2, '0') + ":" +
                    String(d.getSeconds()).padStart(2, '0');
                const typeStr = (log.type || 'INFO').replace(/"/g, '""');
                const msgStr = (log.message || '').replace(/"/g, '""').replace(/\n/g, " ");
                csvContent += `"${dateStr}","${typeStr}","${msgStr}"\n`;
            });
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `smartgarden_logs_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(err => {
            console.error("Export Error:", err);
            alert("Gagal mengambil data untuk export.");
        });
    },

    navigate: function (viewId) {
        ['overview', 'automation', 'logs'].forEach(id => {
            document.getElementById(`view-${id}`).classList.add('hidden');
            document.getElementById(`nav-${id}`).classList.remove('bg-emerald-50', 'text-emerald-700');
            document.getElementById(`nav-${id}`).classList.add('text-slate-600');
        });
        document.getElementById(`view-${viewId}`).classList.remove('hidden');
        document.getElementById(`nav-${viewId}`).classList.add('bg-emerald-50', 'text-emerald-700');
        document.getElementById(`nav-${viewId}`).classList.remove('text-slate-600');
    },

    connectFirebase: function () {
        if (!database) return;
        const statusEl = document.getElementById('connection-status');

        onValue(ref(database, 'sensors'), (snapshot) => {
            statusEl.innerText = "Terhubung";
            const data = snapshot.val();
            if (data) {
                this.state.sensors = { ...this.state.sensors, ...data };
                this.updateDashboardUI(this.state.sensors);
                this.updateAllCharts(this.state.sensors);
                this.runAutomationLogic();
            }
        });

        onValue(ref(database, 'devices'), (snap) => this.syncDeviceToggles(snap.val()));
        onValue(ref(database, 'config/automation'), (snap) => this.syncAutomationUI(snap.val()));
        onValue(query(ref(database, 'logs'), limitToLast(20)), (snap) => this.renderLogs(snap.val()));
    },

    updateDashboardUI: function (data) {
        if (data.soil !== undefined) {
            document.getElementById('val-soil').innerText = data.soil + '%';
            const msg = document.getElementById('soil-msg');
            msg.innerText = data.soil < 40 ? "TERLALU KERING" : data.soil > 60 ? "TERLALU LEMBAB" : "HUMIDITAS IDEAL";
            msg.className = data.soil < 40 ? "text-[10px] text-blue-600 font-bold" : data.soil > 60 ? "text-[10px] text-red-600 font-bold" : "text-[10px] text-emerald-600 font-bold";
        }
        if (data.humidity !== undefined) {
            document.getElementById('val-hum').innerText = data.humidity + '%';
            const msg = document.getElementById('hum-msg');
            msg.innerText = data.humidity < 40 ? "TERLALU KERING" : data.humidity > 60 ? "TERLALU LEMBAB" : "HUMIDITAS IDEAL";
            msg.className = data.humidity < 40 ? "text-[10px] text-blue-600 font-bold" : data.humidity > 60 ? "text-[10px] text-red-600 font-bold" : "text-[10px] text-emerald-600 font-bold";
        }
        if (data.temp !== undefined) {
            document.getElementById('val-temp').innerText = data.temp + '°C';
            const msg = document.getElementById('temp-msg');
            msg.innerText = data.temp < 15 ? "TERLALU DINGIN" : data.temp > 30 ? "TERLALU PANAS" : "SUHU IDEAL";
            msg.className = data.temp < 15 ? "text-[10px] text-blue-600 font-bold" : data.temp > 30 ? "text-[10px] text-red-600 font-bold" : "text-[10px] text-emerald-600 font-bold";
        }
        if (data.light !== undefined) {
            document.getElementById('val-light').innerText = data.light;
            const msg = document.getElementById('light-msg');
            msg.innerText = data.light < 500 ? "KURANG CAHAYA" : data.light > 2000 ? "TERLALU TERANG" : "CAHAYA IDEAL";
            msg.className = data.light < 500 ? "text-[10px] text-blue-600 font-bold" : data.light > 2000 ? "text-[10px] text-red-600 font-bold" : "text-[10px] text-emerald-600 font-bold";
        }
        if (data.mq135 !== undefined) {
            document.getElementById('val-mq135').innerText = data.mq135;
            const msg = document.getElementById('mq135-msg');
            msg.innerText = data.mq135 < 450 ? "UDARA SEGAR" : data.mq135 < 900 ? "CUKUP BAIK" : "POLUSI TINGGI";
            msg.className = data.mq135 < 450 ? "text-[10px] text-emerald-600 font-bold" : data.mq135 < 900 ? "text-[10px] text-orange-500 font-bold" : "text-[10px] text-rose-600 font-bold";
        }
        if (data.tank !== undefined) {
            document.getElementById('val-tank').innerText = data.tank + '%';
            const msg = document.getElementById('tank-msg');
            msg.innerText = data.tank < 10 ? "PERLU ISI AIR" : "Aman";
            msg.className = data.tank < 10 ? "text-[10px] text-red-600 font-bold animate-pulse" : "text-[10px] text-slate-400";
        }
        document.getElementById('last-updated').innerText = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) + " WIB";
    },

    syncDeviceToggles: function (dev) {
        if (!dev) return;
        ['pump', 'uv', 'mist', 'buzzer'].forEach(d => {
            const el = document.getElementById(`toggle-${d}`);
            if (el) el.checked = dev[d] == 1;
            const st = document.getElementById(`status-${d}`);
            if (st) {
                let statusText = dev[d] == 1 ? "ON" : "OFF";
                let statusClass = dev[d] == 1 ? "text-xs font-bold text-emerald-600" : "text-xs text-slate-400";
                if (d === 'buzzer' && dev[d] == 1) {
                    if (this.state.alarmReason === 'tank' || this.state.sensors?.tank < 10) {
                        statusText = "ON (Air Tangki Kritis!)";
                        statusClass = "text-[10px] font-bold text-red-600 animate-pulse";
                    } else if (this.state.alarmReason === 'pollution' || this.state.sensors?.mq135 > 900) {
                        statusText = "ON (Polusi Tinggi!)";
                        statusClass = "text-[10px] font-bold text-red-600 animate-pulse";
                    } else if (this.state.alarmReason === 'tank_and_pollution' || this.state.sensors?.tank < 10 && this.state.sensors?.mq135 > 900) {
                        statusText = "ON (Air Tangki Kritis dan Polusi Tinggi!)";
                        statusClass = "text-[10px] font-bold text-green-600 animate-pulse";
                    }
                }
                st.innerText = statusText;
                st.className = statusClass;
            }
        });
    },

    syncAutomationUI: function (cfg) {
        if (cfg) {
            this.state.automation = { ...this.state.automation, ...cfg };
            if (cfg.pump) {
                document.getElementById('auto-pump-enable').checked = cfg.pump.enabled;
                document.getElementById('input-soil-thresh').value = cfg.pump.threshold;
                document.getElementById('lbl-soil-thresh').innerText = cfg.pump.threshold + '%';
            }
            if (cfg.mist) {
                document.getElementById('auto-mist-enable').checked = cfg.mist.enabled;
                document.getElementById('input-hum-thresh').value = cfg.mist.threshold;
                document.getElementById('lbl-hum-thresh').innerText = cfg.mist.threshold + '%';
            }
            this.runAutomationLogic();
        }
    },

    logActivity: function (type, message) {
        if (!database) return;
        push(ref(database, 'logs'), {
            timestamp: Date.now(),
            type: type,
            message: message
        });
    },

    toggleDevice: function (d, val, source = 'MANUAL') {
        if (database) {
            set(ref(database, `devices/${d}`), val ? 1 : 0)
                .then(() => this.logActivity(source, `${d.toUpperCase()} ${val ? 'ON' : 'OFF'}`));
        }
    },

    saveAutomation: function (type) {
        if (!database) return;
        const enabled = document.getElementById(`auto-${type}-enable`).checked;
        const threshold = parseInt(document.getElementById(type === 'pump' ? 'input-soil-thresh' : 'input-hum-thresh').value);
        set(ref(database, `config/automation/${type}`), { enabled, threshold })
            .then(() => {
                alert("Tersimpan!");
                this.logActivity('CONFIG', `Update Aturan ${type.toUpperCase()}`);
            });
    },

    runAutomationLogic: function () {
        const s = this.state.sensors; const c = this.state.automation; const d = this.state.devices;
        const now = Date.now();
        if (c?.pump?.enabled && database) {
            const threshold = parseInt(c.pump.threshold);
            if (s.soil < threshold && d.pump == 0) this.toggleDevice('pump', true, 'AUTO');
            else if (s.soil > threshold + 5 && d.pump == 1) this.toggleDevice('pump', false, 'AUTO');
        }
        if (c?.mist?.enabled && database) {
            const threshold = parseInt(c.mist.threshold);
            if (s.humidity < threshold && d.mist == 0) this.toggleDevice('mist', true, 'AUTO');
            else if (s.humidity > threshold + 5 && d.mist == 1) this.toggleDevice('mist', false, 'AUTO');
        }
        if (!this.state.mq135_ref || (now - this.state.mq135_ref.ts > 5000)) {
            this.state.mq135_ref = { val: s.mq135 || 0, ts: now };
        }
        const mqDiff = (s.mq135 || 0) - this.state.mq135_ref.val;
        const isPollutionSpike = (mqDiff > 200);
        const isHighPollution = (s.mq135 > 900);
        const isPollutionCritical = isPollutionSpike || isHighPollution;
        if (isPollutionCritical) {
            const msg = document.getElementById('mq135-msg');
            if (msg) {
                msg.innerText = isPollutionSpike ? "BAHAYA: LONJAKAN POLUSI" : "BAHAYA: POLUSI TINGGI";
                msg.className = "text-[10px] text-red-600 font-bold animate-pulse";
            }
        }
        const isTankCritical = (s.tank < 10 && s.tank > 0);
        const shouldBuzz = isTankCritical || isPollutionCritical;
        if (shouldBuzz && d.buzzer == 0) {
            set(ref(database, 'devices/buzzer'), 1);
            let reason = "";
            let alarmState = "";
            if (isPollutionCritical && isTankCritical) {
                reason = "Polusi Tinggi & Air Tangki Kritis!";
                alarmState = "tank_and_pollution";
            } else if (isPollutionCritical) {
                reason = "Polusi Tinggi!";
                alarmState = "pollution";
            } else {
                reason = "Air Tangki Kritis!";
                alarmState = "tank";
            }
            this.state.alarmReason = alarmState;
            this.logActivity('ALARM', `Buzzer ON (${reason})`);
        }
        else if (!shouldBuzz && d.buzzer == 1 && database) {
            set(ref(database, 'devices/buzzer'), 0);
            this.state.alarmReason = null;
        }
    },

    renderLogs: function (data) {
        const tbody = document.getElementById('logs-table-body');
        tbody.innerHTML = '';
        if (!data) {
            tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-400">Belum ada data log.</td></tr>';
            return;
        }
        Object.values(data).sort((a, b) => b.timestamp - a.timestamp).forEach(log => {
            let badgeClass = "bg-slate-100 text-slate-600";
            if (log.type === 'ALARM') badgeClass = "bg-red-100 text-red-600";
            if (log.type === 'AUTO') badgeClass = "bg-blue-100 text-blue-600";
            if (log.type === 'MANUAL') badgeClass = "bg-emerald-100 text-emerald-600";
            tbody.innerHTML += `
                <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td class="p-4 text-xs text-slate-400 font-mono">${new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td class="p-4"><span class="${badgeClass} px-2 py-1 rounded text-xs font-bold">${log.type || 'INFO'}</span></td>
                    <td class="p-4 text-slate-700 font-medium text-sm">${log.message}</td>
                </tr>`;
        });
    },
    clearLogs: function () { if (confirm("Hapus?")) set(ref(database, 'logs'), null); },

    createChartConfig: function (ctx, label, colorHex, bgColor) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(15).fill(''),
                datasets: [{
                    label: label,
                    data: Array(15).fill(0),
                    borderColor: colorHex,
                    backgroundColor: bgColor,
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

    initCharts: function () {
        this.charts.soil = this.createChartConfig(document.getElementById('soilChart').getContext('2d'), 'Tanah (%)', '#10b981', 'rgba(16, 185, 129, 0.1)');
        this.charts.hum = this.createChartConfig(document.getElementById('humChart').getContext('2d'), 'Udara (%)', '#06b6d4', 'rgba(6, 182, 212, 0.1)');
        this.charts.temp = this.createChartConfig(document.getElementById('tempChart').getContext('2d'), 'Suhu (°C)', '#f97316', 'rgba(249, 115, 22, 0.1)');
        this.charts.light = this.createChartConfig(document.getElementById('lightChart').getContext('2d'), 'Cahaya (Lx)', '#eab308', 'rgba(234, 179, 8, 0.1)');
        this.charts.mq135 = this.createChartConfig(document.getElementById('mq135Chart').getContext('2d'), 'Kualitas Udara (PPM)', '#e11d48', 'rgba(225, 29, 72, 0.1)');
        this.charts.tank = this.createChartConfig(document.getElementById('tankChart').getContext('2d'), 'Air (%)', '#6366f1', 'rgba(99, 102, 241, 0.1)');
    },

    updateAllCharts: function (sensors) {
        const now = new Date().toLocaleTimeString();
        const updateSingle = (chart, val) => {
            if (!chart) return;
            if (chart.data.datasets[0].data.length > 20) {
                chart.data.datasets[0].data.shift();
                chart.data.labels.shift();
            }
            chart.data.datasets[0].data.push(val);
            chart.data.labels.push(now);
            chart.update('none');
        };
        if (sensors.soil !== undefined) updateSingle(this.charts.soil, sensors.soil);
        if (sensors.humidity !== undefined) updateSingle(this.charts.hum, sensors.humidity);
        if (sensors.temp !== undefined) updateSingle(this.charts.temp, sensors.temp);
        if (sensors.light !== undefined) updateSingle(this.charts.light, sensors.light);
        if (sensors.mq135 !== undefined) updateSingle(this.charts.mq135, sensors.mq135);
        if (sensors.tank !== undefined) updateSingle(this.charts.tank, sensors.tank);
        if (this.state.pinnedKey && this.charts.pinned && sensors[this.state.pinnedKey] !== undefined) {
            updateSingle(this.charts.pinned, sensors[this.state.pinnedKey]);
        }
    },

    pinChart: function (key) {
        const map = {
            'soil': { label: 'Kelembaban Tanah (%)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            'hum': { label: 'Kelembaban Udara (%)', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
            'temp': { label: 'Suhu Lingkungan (°C)', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
            'light': { label: 'Intensitas Cahaya (Lx)', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
            'mq135': { label: 'Kualitas Udara (PPM)', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.1)' },
            'tank': { label: 'Level Air Tangki (%)', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' }
        };
        const section = document.getElementById('pinned-chart-section');
        if (!section) return;
        if (this.state.pinnedKey) {
            const oldCard = document.getElementById(`card-${this.state.pinnedKey}`);
            if (oldCard) oldCard.classList.remove('hidden');
        }
        if (!key || !map[key]) {
            section.classList.add('hidden');
            this.state.pinnedKey = null;
            if (this.charts.pinned) {
                this.charts.pinned.destroy();
                this.charts.pinned = null;
            }
            return;
        }
        const newCard = document.getElementById(`card-${key}`);
        if (newCard) newCard.classList.add('hidden');
        this.state.pinnedKey = key;
        section.classList.remove('hidden');
        const titleEl = document.getElementById('pinned-chart-title');
        if (titleEl) titleEl.innerText = map[key].label;
        if (this.charts.pinned) {
            this.charts.pinned.destroy();
            this.charts.pinned = null;
        }
        const canvas = document.getElementById('pinnedChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const sourceChart = this.charts[key];
        let initialData = [];
        let initialLabels = [];
        if (sourceChart && sourceChart.data) {
            initialData = [...(sourceChart.data.datasets[0].data || [])];
            initialLabels = [...(sourceChart.data.labels || [])];
        }
        this.charts.pinned = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initialLabels,
                datasets: [{
                    label: map[key].label,
                    data: initialData,
                    borderColor: map[key].color,
                    backgroundColor: map[key].bg,
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
        ['soil', 'hum'].forEach(t => document.getElementById(`input-${t}-thresh`).addEventListener('input', (e) => document.getElementById(`lbl-${t}-thresh`).innerText = e.target.value + '%'));
    },

    startClock: function () {
        setInterval(() => {
            const now = new Date();
            const optionsTime = { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
            const optionsDate = { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

            const timeString = now.toLocaleTimeString('id-ID', optionsTime).replace(/\./g, ':');
            const dateString = now.toLocaleDateString('id-ID', optionsDate);

            const elTime = document.getElementById('clock-time');
            const elDate = document.getElementById('clock-date');

            if (elTime) elTime.innerText = timeString + " WIB";
            if (elDate) elDate.innerText = dateString;
        }, 1000);
    }
};
