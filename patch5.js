const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf8');

// Clean up old mobile grids
css = css.replace('.summary-grid { grid-template-columns: 1fr; gap: 1rem; }', '');
css = css.replace('.summary-card { flex-direction: row; text-align: left; gap: 1rem; padding: 1.25rem; }', '');
css = css.replace('.metric-grid { grid-template-columns: 1fr; gap: 1rem; }', '');
css = css.replace('.metric-card { padding: 1.5rem; }', '');

const newMobileCSS = `
  /* iOS Widget Style Mobile Layout */
  .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .summary-card { 
    flex-direction: column; 
    text-align: center; 
    gap: 0.5rem; 
    padding: 1rem 0.5rem; 
    align-items: center;
    justify-content: center;
  }
  .summary-card p { font-size: 0.75rem; line-height: 1.1; margin: 0; }
  .summary-card strong { font-size: 1.25rem; line-height: 1; }
  .summary-card small { font-size: 0.65rem; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .summary-icon { width: 36px; height: 36px; font-size: 1rem; margin-bottom: 0.25rem; }
  
  .metric-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .metric-card { padding: 1rem 0.5rem; }
  .metric-card .panel-header { justify-content: center; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px dashed var(--border-color); }
  .metric-card .panel-header h2 { font-size: 0.85rem; text-align: center; }
  
  /* Reset inline styles that force full width or flex layout in metric cards */
  .metric-card > div[style*="display: flex; justify-content: space-between"] {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 0.25rem;
  }
  .metric-card strong { font-size: 1.5rem !important; }
  .metric-card small { font-size: 0.75rem; }
`;

if (!css.includes('/* iOS Widget Style Mobile Layout */')) {
    css = css.replace('/* Penyesuaian Spacing Grid */', '/* Penyesuaian Spacing Grid */\n' + newMobileCSS);
}

fs.writeFileSync('src/style.css', css, 'utf8');
console.log('Mobile layout overhauled successfully.');
