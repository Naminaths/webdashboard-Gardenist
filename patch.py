import re

with open('src/main.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Imports and global vars
code = code.replace(
    'let database, ref, onValue, set, push, query, limitToLast, get;',
    'let database, auth, ref, onValue, set, push, query, limitToLast, get;\\nlet signInWithEmailAndPassword, signOut, onAuthStateChanged;'
)
code = code.replace(
    "const VIEW_KEYS = ['overview', 'automation', 'logs'];",
    "const VIEW_KEYS = ['overview', 'automation', 'logs', 'devices', 'eco'];"
)

# 2. Add new states
code = code.replace(
    'alarmReason: null,',
    'alarmReason: null,\\n        user: null,\\n        ecoPoints: 850,\\n        weather: { isRaining: false },'
)

# 3. loadFirebase
code = code.replace(
    'database = fbConfig.database;',
    'database = fbConfig.database;\\n        auth = fbConfig.auth;'
)
code = code.replace(
    "const fbDb = await import('./firebase-config.js');",
    "const fbDb = await import('./firebase-config.js');"
)

# Replace fbDb imports
code = code.replace(
    "const fbDb = await import('firebase/database');",
    "const fbDb = await import('firebase/database');\\n        const fbAuth = await import('firebase/auth');\\n        signInWithEmailAndPassword = fbAuth.signInWithEmailAndPassword;\\n        signOut = fbAuth.signOut;\\n        onAuthStateChanged = fbAuth.onAuthStateChanged;"
)

# 4. Auth & new logic
new_methods = """
    showLoginModal: function() {
        document.getElementById('login-modal').classList.remove('hidden');
    },

    hideLoginModal: function() {
        document.getElementById('login-modal').classList.add('hidden');
    },

    login: async function() {
        if (!auth) await this.loadFirebase();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            this.hideLoginModal();
            this.enterDashboard();
        } catch (error) {
            const swal = await this.loadSwal();
            swal.fire('Login Gagal', 'Kredensial salah atau tidak diizinkan.', 'error');
        }
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
"""

code = code.replace(
    'enterDashboard: function () {',
    new_methods + '\\n    enterDashboard: function () {'
)

# 5. Intercept init
code = code.replace(
    'this.setupInputs();\\n        this.startClock();',
    'this.setupInputs();\\n        this.startClock();\\n        this.checkWeather();\\n        this.initDynamicTheme();'
)

# Add initDynamicTheme
code = code.replace(
    'startClock: function () {',
    """initDynamicTheme: function() {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 6) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },
    startClock: function () {"""
)


# 6. runAutomationLogic modifications
run_auto_orig = """        if (c?.pump?.enabled) {
            const threshold = Number.parseInt(c.pump.threshold, 10);
            if (s.soil < threshold && d.pump == 0) this.toggleDevice('pump', true, 'AUTO');
            if (s.soil > threshold + 5 && d.pump == 1) this.toggleDevice('pump', false, 'AUTO');
        }"""

run_auto_new = """        const schedEnabled = document.getElementById('schedule-pump-enable')?.checked;
        const schedTime = document.getElementById('schedule-pump-time')?.value;
        const nowTime = new Date().toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit'});
        
        let schedTrigger = false;
        if (schedEnabled && schedTime === nowTime && d.pump == 0) {
            schedTrigger = true;
        }

        if (c?.pump?.enabled || schedTrigger) {
            const threshold = Number.parseInt(c.pump.threshold, 10);
            
            // Jika hujan, dan tanah belum sangat kering banget, kita tunda siram
            if (this.state.weather.isRaining && s.soil > (threshold - 10) && !schedTrigger) {
                if (d.pump == 1) this.toggleDevice('pump', false, 'AUTO (Hujan)');
            } else {
                if ((s.soil < threshold || schedTrigger) && d.pump == 0) this.toggleDevice('pump', true, 'AUTO');
                if (s.soil > threshold + 5 && !schedTrigger && d.pump == 1) this.toggleDevice('pump', false, 'AUTO');
            }
        }"""
code = code.replace(run_auto_orig, run_auto_new)

# Modify logout
code = code.replace(
    """        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('dashboard-app')?.classList.add('hidden');
                document.getElementById('landing-page')?.classList.remove('hidden');
            }
        });""",
    """        }).then((result) => {
            if (result.isConfirmed) {
                if(auth) signOut(auth);
                document.getElementById('dashboard-app')?.classList.add('hidden');
                document.getElementById('landing-page')?.classList.remove('hidden');
            }
        });"""
)

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(code)
