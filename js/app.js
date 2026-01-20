import { initialState } from './state.js';
import { database } from './firebase-init.js';
import { ui } from './ui.js';
import { charts } from './charts.js';
import { automation } from './automation.js';
import { ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

window.app = {
    // 1. STATE & STORAGE
    state: { ...initialState }, // Clone to prevent module mutation issues
    charts: {}, // Will be overwritten by charts module mixin, but good for clarity

    // 2. MIXIN MODULES
    ...ui,
    ...charts,
    ...automation,

    // 3. CORE FUNCTIONS
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

    connectFirebase: function () {
        if (!database) return;
        const statusEl = document.getElementById('connection-status');

        onValue(ref(database, 'sensors'), (snapshot) => {
            if (statusEl) statusEl.innerText = "Terhubung";
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
    }
};
