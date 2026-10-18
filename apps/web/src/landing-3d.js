// 3D Spatial Interactions & Interactive Simulator for Gardenist Landing Page
export function initLanding3D() {
    const stage = document.getElementById('garden-3d-stage');
    const container = document.getElementById('garden-3d-container');
    
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
            
            // Adjust specular lighting angle
            const lightAngle = Math.atan2(currentY, currentX) * (180 / Math.PI) + 180;
            stage.style.setProperty('--sheen-angle', `${lightAngle}deg`);

            requestAnimationFrame(renderLoop);
        };
        requestAnimationFrame(renderLoop);
    }

    // Generic 3D tilt for all cards with class 'card-3d'
    const cards = document.querySelectorAll('.card-3d');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const tiltX = (-y / (rect.height / 2)) * 8;
            const tiltY = (x / (rect.width / 2)) * 8;
            card.style.transform = `perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });

    // Interactive Demo Simulator Slider
    const soilSlider = document.getElementById('demo-soil-slider');
    const soilValEl = document.getElementById('demo-soil-val');
    const soilBarFill = document.getElementById('demo-soil-bar');
    const soilStatusMsg = document.getElementById('demo-soil-status');
    const pumpTriggerBadge = document.getElementById('demo-auto-pump-badge');

    if (soilSlider && soilValEl) {
        soilSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            soilValEl.innerText = `${val}%`;
            if (soilBarFill) soilBarFill.style.width = `${val}%`;

            if (val < 40) {
                soilStatusMsg.innerText = 'Kering — Ambang batas tercapai';
                soilStatusMsg.className = 'demo-badge danger';
                if (pumpTriggerBadge) {
                    pumpTriggerBadge.innerText = 'Otomasi: POMPA AKTIF 💧';
                    pumpTriggerBadge.className = 'demo-pump-indicator active';
                }
            } else if (val > 65) {
                soilStatusMsg.innerText = 'Lembab — Kondisi basah';
                soilStatusMsg.className = 'demo-badge warning';
                if (pumpTriggerBadge) {
                    pumpTriggerBadge.innerText = 'Otomasi: Siaga (Mati)';
                    pumpTriggerBadge.className = 'demo-pump-indicator standby';
                }
            } else {
                soilStatusMsg.innerText = 'Ideal — Kondisi prima';
                soilStatusMsg.className = 'demo-badge success';
                if (pumpTriggerBadge) {
                    pumpTriggerBadge.innerText = 'Otomasi: Siaga (Mati)';
                    pumpTriggerBadge.className = 'demo-pump-indicator standby';
                }
            }
        });
    }
}
