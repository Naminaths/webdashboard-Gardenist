export const ui = {
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
        document.getElementById('last-updated').innerText = new Date().toLocaleTimeString();
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

                // Custom Alarm Logic for Buzzer
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

    setupInputs: function () {
        ['soil', 'hum'].forEach(t => document.getElementById(`input-${t}-thresh`).addEventListener('input', (e) => document.getElementById(`lbl-${t}-thresh`).innerText = e.target.value + '%'));
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

    startClock: function () {
        setInterval(() => {
            const now = new Date();
            // User asked for "keadaan utc asli" -> Real UTC Time
            const timeString = now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false });
            const el = document.getElementById('realtime-clock');
            if (el) el.innerText = timeString + " UTC";
        }, 1000);
    }
};
