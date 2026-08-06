const fs = require('fs');

// 1. Revert mistake in index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
    '<select id="plant-profile-select" style="width: 90%; max-width: 400px; padding: 0.5rem;',
    '<select id="plant-profile-select" style="width: 100%; padding: 0.5rem;'
);

// 2. Fix login-modal in index.html
html = html.replace(
    '<div class="glass-panel" style="width: 400px; padding: 2rem;',
    '<div class="glass-panel" style="width: 90%; max-width: 400px; padding: 2rem;'
);

// 3. Add eco-main-panel class in index.html
html = html.replace(
    '<div class="glass-panel" style="text-align: center; padding: 3rem 1rem;">',
    '<div class="glass-panel eco-main-panel" style="text-align: center;">'
);

// 4. Automation Grid fix: The plant profile and custom threshold have no grid, they are block, which is fine.

fs.writeFileSync('index.html', html, 'utf8');

// 5. Update style.css for better mobile grids
let css = fs.readFileSync('src/style.css', 'utf8');

// Remove old mobile grids
css = css.replace('.summary-grid { grid-template-columns: 1fr; gap: 1rem; }', '');
css = css.replace('.metric-grid { grid-template-columns: repeat(auto-fit, minmax(100%, 1fr)); gap: 1rem; }', '');

// Add better mobile grids
const mobileCSS = `
  /* Enhanced Mobile Grids */
  .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .summary-card { flex-direction: column; text-align: center; gap: 0.5rem; padding: 1rem; }
  
  .metric-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .metric-card { padding: 1rem; }
  .metric-card strong { font-size: 1.5rem; }
  .metric-card .panel-header h2 { font-size: 1rem; }
  
  .small-charts-grid { grid-template-columns: 1fr; gap: 1rem; }
  
  .topbar { flex-wrap: nowrap; padding: 0.75rem 1rem; }
  
  .eco-main-panel { padding: 1.5rem 1rem !important; }
`;

// Insert the new CSS right after /* Penyesuaian Spacing Grid */
css = css.replace('/* Penyesuaian Spacing Grid */', '/* Penyesuaian Spacing Grid */' + mobileCSS);

// Also add default eco-main-panel padding for desktop
if(!css.includes('.eco-main-panel { padding: 3rem 1rem; }')) {
    css += '\n.eco-main-panel { padding: 3rem 1rem; }\n';
}

fs.writeFileSync('src/style.css', css, 'utf8');

console.log('Mobile optimizations applied.');
