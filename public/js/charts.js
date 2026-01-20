export const charts = {
    charts: {}, // Placeholder for chart instances

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
            // Keep history same length (20)
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

        // Update Pinned Chart if active
        if (this.state.pinnedKey && this.charts.pinned && sensors[this.state.pinnedKey] !== undefined) {
            updateSingle(this.charts.pinned, sensors[this.state.pinnedKey]);
        }
    },

    pinChart: function (key) {
        console.log("Pin Chart Triggered:", key);
        const map = {
            'soil': { label: 'Kelembaban Tanah (%)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            'hum': { label: 'Kelembaban Udara (%)', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
            'temp': { label: 'Suhu Lingkungan (°C)', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
            'light': { label: 'Intensitas Cahaya (Lx)', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
            'mq135': { label: 'Kualitas Udara (PPM)', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.1)' },
            'tank': { label: 'Level Air Tangki (%)', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' }
        };

        const section = document.getElementById('pinned-chart-section');
        if (!section) { console.error("Pinned Section Not Found"); return; }

        // Restore previously pinned card visibility
        if (this.state.pinnedKey) {
            const oldCard = document.getElementById(`card-${this.state.pinnedKey}`);
            if (oldCard) oldCard.classList.remove('hidden');
        }

        if (!key || !map[key]) {
            // Close/Unpin
            section.classList.add('hidden');
            this.state.pinnedKey = null;
            if (this.charts.pinned) {
                this.charts.pinned.destroy();
                this.charts.pinned = null;
            }
            return;
        }

        // Hide new card
        const newCard = document.getElementById(`card-${key}`);
        if (newCard) newCard.classList.add('hidden');

        // Open/Pin
        this.state.pinnedKey = key;
        section.classList.remove('hidden');

        const titleEl = document.getElementById('pinned-chart-title');
        if (titleEl) titleEl.innerText = map[key].label;

        // Destroy old instance
        if (this.charts.pinned) {
            this.charts.pinned.destroy();
            this.charts.pinned = null;
        }

        const canvas = document.getElementById('pinnedChart');
        if (!canvas) { console.error("Pinned Canvas Not Found"); return; }
        const ctx = canvas.getContext('2d');

        // Safer Data Copying
        const sourceChart = this.charts[key];
        let initialData = [];
        let initialLabels = [];

        if (sourceChart && sourceChart.data) {
            initialData = [...(sourceChart.data.datasets[0].data || [])];
            initialLabels = [...(sourceChart.data.labels || [])];
        } else {
            console.warn(`Source chart for ${key} not ready. Starting empty.`);
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
    }
};
