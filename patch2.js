const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

// Tambahkan updateEcoScore
const updateEcoScoreLogic = `
    updateEcoScore: function() {
        const s = this.state.sensors;
        const c = this.state.automation;
        if (!this.state.sensorReady) return;
        
        let overwateringEvents = 0;
        if (s.soil > 65) overwateringEvents = 1; 
        
        let points = 800;
        if (c?.pump?.enabled) points += 100;
        if (s.soil >= 40 && s.soil <= 60) points += 50;
        if (s.tank > 20) points += 50;
        if (s.soil > 65) points -= 150;
        if (this.state.weather.isRaining) points += 50;
        
        // Pastikan min 0, max 1000
        points = Math.max(0, Math.min(1000, points));
        
        let waterSaved = Math.max(0, Math.round((points - 700) * 0.5));
        if (points < 700) waterSaved = 0;
        
        const ecoPointsEl = document.getElementById('eco-points');
        const ecoWaterEl = document.getElementById('eco-water-saved');
        const ecoOverEl = document.getElementById('eco-over-watering');
        const ecoGradeEl = document.getElementById('eco-score-value');
        
        if (ecoPointsEl) ecoPointsEl.innerText = \`\${points} Pts\`;
        if (ecoWaterEl) ecoWaterEl.innerText = \`+ \${waterSaved} Liter\`;
        if (ecoOverEl) ecoOverEl.innerText = \`\${overwateringEvents} Kejadian\`;
        
        if (ecoGradeEl) {
            if (points >= 900) {
                ecoGradeEl.innerText = 'A';
                ecoGradeEl.nextElementSibling.innerText = 'Excellent';
                ecoGradeEl.parentElement.parentElement.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            } else if (points >= 800) {
                ecoGradeEl.innerText = 'B';
                ecoGradeEl.nextElementSibling.innerText = 'Good';
                ecoGradeEl.parentElement.parentElement.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
            } else if (points >= 700) {
                ecoGradeEl.innerText = 'C';
                ecoGradeEl.nextElementSibling.innerText = 'Fair';
                ecoGradeEl.parentElement.parentElement.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            } else {
                ecoGradeEl.innerText = 'D';
                ecoGradeEl.nextElementSibling.innerText = 'Poor';
                ecoGradeEl.parentElement.parentElement.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            }
        }
    },
`;

code = code.replace(
    'updateSystemSummary: function () {',
    updateEcoScoreLogic + '\n    updateSystemSummary: function () {'
);

// Call updateEcoScore
code = code.replace(
    'this.updateSystemSummary();\n            this.updateAllCharts(this.state.sensors);',
    'this.updateSystemSummary();\n            this.updateEcoScore();\n            this.updateAllCharts(this.state.sensors);'
);

code = code.replace(
    'this.runAutomationLogic();\n        this.updateSystemSummary();\n    },',
    'this.runAutomationLogic();\n        this.updateSystemSummary();\n        this.updateEcoScore();\n    },'
);

fs.writeFileSync('src/main.js', code, 'utf8');
console.log('Patched main.js for EcoScore');
