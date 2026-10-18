// ═══════════════════════════════════════════════════════════════
// Gardenist — 3D Spatial Interactions & Interactive Simulator Rig
// Precision Botanical Hardware Rig & Rule Engine Logic
// ═══════════════════════════════════════════════════════════════

export function initLanding3D() {
    const stage = document.getElementById('garden-3d-stage');
    const container = document.getElementById('garden-3d-container');

    // ── 3D Smooth Spatial Perspective & Tilt ────────────────
    if (stage && container) {
        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;
        let isHovered = false;

        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            mouseX = (x / (rect.width / 2)) * 14; // max 14deg tilt
            mouseY = (-y / (rect.height / 2)) * 14;
        };

        container.addEventListener('mouseenter', () => { isHovered = true; });
        container.addEventListener('mouseleave', () => {
            isHovered = false;
            mouseX = 0;
            mouseY = 0;
        });
        container.addEventListener('mousemove', handleMouseMove);

        // Gyroscope / device orientation support for mobile
        if (window.DeviceOrientationEvent && 'ontouchstart' in window) {
            window.addEventListener('deviceorientation', (e) => {
                if (e.gamma !== null && e.beta !== null) {
                    mouseX = Math.min(Math.max(e.gamma / 3, -12), 12);
                    mouseY = Math.min(Math.max((e.beta - 45) / 3, -12), 12);
                }
            }, { passive: true });
        }

        const renderLoop = () => {
            // Smooth lerp easing
            currentX += (mouseX - currentX) * 0.08;
            currentY += (mouseY - currentY) * 0.08;

            stage.style.transform = `perspective(1200px) rotateX(${currentY.toFixed(2)}deg) rotateY(${currentX.toFixed(2)}deg)`;

            requestAnimationFrame(renderLoop);
        };
        requestAnimationFrame(renderLoop);
    }

    // ── Card Tilt on Telemetry & Arch Cards ─────────────────
    const interactiveCards = document.querySelectorAll('.telemetry-card, .arch-step');
    interactiveCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const tiltX = (-y / (rect.height / 2)) * 6;
            const tiltY = (x / (rect.width / 2)) * 6;
            card.style.transform = `perspective(800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ── Interactive Soil Moisture & Rule Engine Simulator ───
    const soilSlider = document.getElementById('demo-soil-slider');
    const soilValEl = document.getElementById('demo-soil-val');
    const soilBarFill = document.getElementById('demo-soil-bar');
    const soilStatusMsg = document.getElementById('demo-soil-status');
    const pumpTriggerBadge = document.getElementById('demo-auto-pump-badge');

    // 3D Rig visual elements
    const rigValSoil = document.getElementById('rig-val-soil');
    const rigSoilTag = document.getElementById('rig-soil-tag');
    const rigPumpState = document.getElementById('rig-pump-state');
    const rigLedRelay = document.getElementById('rig-led-relay');
    const rigWaterDroplets = document.getElementById('rig-water-droplets');
    const rigSoilStratum = document.getElementById('rig-soil-stratum');

    function updateSimulation(val) {
        if (soilValEl) soilValEl.innerText = `${val}%`;
        if (soilBarFill) soilBarFill.style.width = `${val}%`;
        if (rigValSoil) rigValSoil.innerText = `${val}%`;

        if (val < 40) {
            // Under threshold (<40%) -> Dry trigger
            if (soilStatusMsg) {
                soilStatusMsg.innerText = 'Kering \u2014 Ambang kritis';
                soilStatusMsg.className = 'demo-badge danger';
            }
            if (pumpTriggerBadge) {
                pumpTriggerBadge.innerText = 'POMPA AIR AKTIF';
                pumpTriggerBadge.className = 'demo-pump-indicator active';
            }
            if (rigSoilTag) {
                rigSoilTag.innerText = 'Kritis';
                rigSoilTag.className = 'tag-status tone-danger';
            }
            if (rigPumpState) {
                rigPumpState.innerText = 'AKTIF (Menyiram)';
                rigPumpState.className = 'tag-status tone-good';
            }
            if (rigLedRelay) rigLedRelay.classList.add('active');
            if (rigWaterDroplets) rigWaterDroplets.classList.add('active');
            if (rigSoilStratum) {
                rigSoilStratum.style.background = 'linear-gradient(180deg, #422d20 0%, #281b13 100%)';
            }
        } else if (val > 65) {
            // Over 65% -> Moist / saturated
            if (soilStatusMsg) {
                soilStatusMsg.innerText = 'Lembab \u2014 Kelembaban tinggi';
                soilStatusMsg.className = 'demo-badge warning';
            }
            if (pumpTriggerBadge) {
                pumpTriggerBadge.innerText = 'Siaga (Mati)';
                pumpTriggerBadge.className = 'demo-pump-indicator standby';
            }
            if (rigSoilTag) {
                rigSoilTag.innerText = 'Lembab';
                rigSoilTag.className = 'tag-status tone-good';
            }
            if (rigPumpState) {
                rigPumpState.innerText = 'Siaga (Mati)';
                rigPumpState.className = 'tag-status tone-muted';
            }
            if (rigLedRelay) rigLedRelay.classList.remove('active');
            if (rigWaterDroplets) rigWaterDroplets.classList.remove('active');
            if (rigSoilStratum) {
                rigSoilStratum.style.background = 'linear-gradient(180deg, #162a20 0%, #0d1a14 100%)';
            }
        } else {
            // Ideal zone: 40% - 65%
            if (soilStatusMsg) {
                soilStatusMsg.innerText = 'Ideal \u2014 Kondisi prima';
                soilStatusMsg.className = 'demo-badge success';
            }
            if (pumpTriggerBadge) {
                pumpTriggerBadge.innerText = 'Siaga (Mati)';
                pumpTriggerBadge.className = 'demo-pump-indicator standby';
            }
            if (rigSoilTag) {
                rigSoilTag.innerText = 'Ideal';
                rigSoilTag.className = 'tag-status tone-good';
            }
            if (rigPumpState) {
                rigPumpState.innerText = 'Siaga (Mati)';
                rigPumpState.className = 'tag-status tone-muted';
            }
            if (rigLedRelay) rigLedRelay.classList.remove('active');
            if (rigWaterDroplets) rigWaterDroplets.classList.remove('active');
            if (rigSoilStratum) {
                rigSoilStratum.style.background = 'linear-gradient(180deg, #24352a 0%, #15221b 100%)';
            }
        }
    }

    if (soilSlider) {
        soilSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            updateSimulation(val);
        });
    }

    // ── Global Demo Actuator Test Function ──────────────────
    window.app = window.app || {};
    window.app.toggleDemoDevice = function(deviceKey, button) {
        const isChecked = button.getAttribute('aria-checked') === 'true';
        const nextState = !isChecked;
        button.setAttribute('aria-checked', String(nextState));

        const msgEl = document.getElementById('demo-pump-status');

        if (deviceKey === 'pump') {
            const droplets = document.getElementById('rig-water-droplets');
            const relayLed = document.getElementById('rig-led-relay');
            const pumpState = document.getElementById('rig-pump-state');

            if (nextState) {
                droplets?.classList.add('active');
                relayLed?.classList.add('active');
                if (pumpState) {
                    pumpState.innerText = 'AKTIF (Manual)';
                    pumpState.className = 'tag-status tone-good';
                }
                if (msgEl) msgEl.innerText = 'Pompa Air aktif \u2014 Irigasi mikro perakaran sedang menyemprotkan air.';
            } else {
                droplets?.classList.remove('active');
                relayLed?.classList.remove('active');
                if (pumpState) {
                    pumpState.innerText = 'Siaga (Mati)';
                    pumpState.className = 'tag-status tone-muted';
                }
                if (msgEl) msgEl.innerText = 'Pompa Air dinonaktifkan.';
            }
        } else if (deviceKey === 'mist') {
            const mistPlume = document.getElementById('rig-mist-plume');
            if (nextState) {
                mistPlume?.classList.add('active');
                if (msgEl) msgEl.innerText = 'Mist Maker aktif \u2014 Partikel kabut ultrasonik meningkatkan kelembaban daun.';
            } else {
                mistPlume?.classList.remove('active');
                if (msgEl) msgEl.innerText = 'Mist Maker dinonaktifkan.';
            }
        } else if (deviceKey === 'uv') {
            const uvGlow = document.getElementById('rig-uv-glow');
            if (nextState) {
                uvGlow?.classList.add('active');
                if (msgEl) msgEl.innerText = 'Lampu UV aktif \u2014 Radiasi spektrum fotosintesis aktif menerangi tanaman.';
            } else {
                uvGlow?.classList.remove('active');
                if (msgEl) msgEl.innerText = 'Lampu UV dinonaktifkan.';
            }
        } else if (deviceKey === 'buzzer') {
            if (nextState) {
                if (msgEl) msgEl.innerText = 'Alarm Buzzer berbunyi \u2014 Sinyal frekuensi peringatan kritis dikirim ke speaker node.';
            } else {
                if (msgEl) msgEl.innerText = 'Alarm Buzzer diheningkan.';
            }
        }
    };
}
