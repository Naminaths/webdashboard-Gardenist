const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

// 1. Add initRouting to init
code = code.replace(
    'this.initDynamicTheme();\n        this.initRouting();', // in case already there, avoid dup
    'this.initDynamicTheme();'
);
code = code.replace(
    'this.initDynamicTheme();',
    'this.initDynamicTheme();\n        this.initRouting();'
);

// 2. Add Routing logic
const routingLogic = `
    initRouting: function() {
        window.addEventListener('hashchange', () => this.handleRoute());
    },
    handleRoute: function() {
        const dashboard = document.getElementById('dashboard-app');
        if (!dashboard || dashboard.classList.contains('hidden')) return;
        const hash = window.location.hash.replace('#', '') || 'overview';
        if (VIEW_KEYS.includes(hash)) {
            this.navigate(hash, true);
        } else {
            this.navigate('overview', true);
        }
    },
    navigate: function (viewId, fromRoute = false) {
        if (!fromRoute) window.location.hash = viewId;
        VIEW_KEYS.forEach((id) => {
            document.getElementById(\`view-\${id}\`)?.classList.toggle('hidden', id !== viewId);
            document.getElementById(\`nav-\${id}\`)?.classList.toggle('is-active', id === viewId);
            document.getElementById(\`mobile-nav-\${id}\`)?.classList.toggle('is-active', id === viewId);
        });
    },
`;

code = code.replace(
    /navigate:\s*function\s*\(\w+\)\s*\{[\s\S]*?VIEW_KEYS\.forEach\(\(id\)\s*=>\s*\{[\s\S]*?\}\);\s*\},/m,
    routingLogic
);

// 3. Update enterDashboard
code = code.replace(
    'setTimeout(() => this.init(), 100);',
    'setTimeout(() => {\n            this.init();\n            this.handleRoute();\n        }, 100);'
);

// 4. Update logout to clear hash
code = code.replace(
    'document.getElementById(\'dashboard-app\')?.classList.add(\'hidden\');',
    'window.location.hash = \'\';\n                document.getElementById(\'dashboard-app\')?.classList.add(\'hidden\');'
);

fs.writeFileSync('src/main.js', code, 'utf8');
console.log('Patched main.js for routing endpoints');
