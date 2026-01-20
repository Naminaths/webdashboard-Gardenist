import { ref, set, push, query, limitToLast, get } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { database } from "./firebase-init.js";

export const automation = {
    syncAutomationUI: function (cfg) {
        console.log("Syncing Automation Config:", cfg);
        if (cfg) {
            this.state.automation = { ...this.state.automation, ...cfg };

            if (cfg.pump) {
                const enableEl = document.getElementById('auto-pump-enable');
                const threshEl = document.getElementById('input-soil-thresh');
                const lblEl = document.getElementById('lbl-soil-thresh');
                if (enableEl) enableEl.checked = cfg.pump.enabled;
                if (threshEl) threshEl.value = cfg.pump.threshold;
                if (lblEl) lblEl.innerText = cfg.pump.threshold + '%';
            }
            if (cfg.mist) {
                const enableEl = document.getElementById('auto-mist-enable');
                const threshEl = document.getElementById('input-hum-thresh');
                const lblEl = document.getElementById('lbl-hum-thresh');
                if (enableEl) enableEl.checked = cfg.mist.enabled;
                if (threshEl) threshEl.value = cfg.mist.threshold;
                if (lblEl) lblEl.innerText = cfg.mist.threshold + '%';
            }

            // Re-run logic immediately with new settings
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

        // Pump Logic (Soil)
        if (c?.pump?.enabled && database) {
            const threshold = parseInt(c.pump.threshold); // Ensure Number
            if (s.soil < threshold && d.pump == 0) {
                console.log("Auto: Pump ON Triggered");
                this.toggleDevice('pump', true, 'AUTO');
            }
            else if (s.soil > threshold + 5 && d.pump == 1) {
                console.log("Auto: Pump OFF Triggered");
                this.toggleDevice('pump', false, 'AUTO');
            }
        }

        // Mist Logic (Humidity)
        if (c?.mist?.enabled && database) {
            const threshold = parseInt(c.mist.threshold); // Ensure Number
            if (s.humidity < threshold && d.mist == 0) {
                console.log("Auto: Mist ON Triggered");
                this.toggleDevice('mist', true, 'AUTO');
            }
            else if (s.humidity > threshold + 5 && d.mist == 1) {
                console.log("Auto: Mist OFF Triggered");
                this.toggleDevice('mist', false, 'AUTO');
            }
        }

        // MQ135 Spike Logic (Rate of Rise > 200 in 5s)
        if (!this.state.mq135_ref || (now - this.state.mq135_ref.ts > 5000)) {
            // Reset window every 5 seconds or if undefined
            this.state.mq135_ref = { val: s.mq135 || 0, ts: now };
        }

        const mqDiff = (s.mq135 || 0) - this.state.mq135_ref.val;
        const isPollutionSpike = (mqDiff > 200);
        const isHighPollution = (s.mq135 > 900); // New Static Threshold
        const isPollutionCritical = isPollutionSpike || isHighPollution;

        if (isPollutionCritical) {
            // Force Status Update for Spike/High
            const msg = document.getElementById('mq135-msg');
            if (msg) {
                msg.innerText = isPollutionSpike ? "BAHAYA: LONJAKAN POLUSI" : "BAHAYA: POLUSI TINGGI";
                msg.className = "text-[10px] text-red-600 font-bold animate-pulse";
            }
        }

        // Buzzer Logic (Tank Critical OR Pollution Critical)
        const isTankCritical = (s.tank < 10 && s.tank > 0);
        const shouldBuzz = isTankCritical || isPollutionCritical;

        if (shouldBuzz && d.buzzer == 0) {
            set(ref(database, 'devices/buzzer'), 1);

            // Determine Reason and Priority
            let reason = "";
            let alarmState = ""; // pollution, tank, tank_and_pollution

            if (isPollutionCritical && isTankCritical) {
                reason = "Polusi Tinggi & Air Tangki Kritis!";
                alarmState = "tank_and_pollution";
            } else if (isPollutionCritical) {
                reason = "Polusi Tinggi!"; // Applies to both Spike and >900
                alarmState = "pollution";
            } else {
                reason = "Air Tangki Kritis!";
                alarmState = "tank";
            }

            // Set local alarm reason for UI
            this.state.alarmReason = alarmState;
            this.logActivity('ALARM', `Buzzer ON (${reason})`);
        }
        else if (!shouldBuzz && d.buzzer == 1 && database) {
            set(ref(database, 'devices/buzzer'), 0);
            this.state.alarmReason = null; // Reset reason
        }
    },

    exportLogsToCSV: function () {
        if (!database) return;

        get(query(ref(database, 'logs'), limitToLast(500))).then((snapshot) => {
            const data = snapshot.val();
            if (!data) { alert("Tidak ada data log untuk diexport (kosong)."); return; }

            // Add BOM (\uFEFF) so Excel opens it correctly with UTF-8
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

            // Blob Export
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

    clearLogs: function () { if (confirm("Hapus?")) set(ref(database, 'logs'), null); }
};
