#!/usr/bin/env node

import { execSync } from 'child_process';

function run(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (error) {
        return null;
    }
}

function runInherit(command) {
    execSync(command, { stdio: 'inherit' });
}

console.log('\n🔍 [Gardenist Git Auto-Commit] Memeriksa status repository...');

// 1. Cek status git
const statusOutput = run('git status --porcelain');
if (!statusOutput) {
    console.log('✅ Repository bersih. Tidak ada perubahan yang perlu di-commit.\n');
    process.exit(0);
}

const lines = statusOutput.split('\n').filter(Boolean);
console.log(`📝 Ditemukan ${lines.length} perubahan file:`);
lines.slice(0, 8).forEach(l => console.log(`   ${l}`));
if (lines.length > 8) {
    console.log(`   ... dan ${lines.length - 8} file lainnya.`);
}

// 2. Parse argumen
const args = process.argv.slice(2);
const shouldPush = !args.includes('--no-push');
const userMessageArg = args.find(arg => !arg.startsWith('--'));

// 3. Analisis scope berdasarkan file yang diubah
const changedFiles = lines.map(line => line.substring(3).trim());

const scopes = new Set();
let isFix = false;
let isDocs = false;

for (const file of changedFiles) {
    if (file.startsWith('apps/web/')) {
        scopes.add('web');
    } else if (file.startsWith('packages/firmware/')) {
        scopes.add('firmware');
    } else if (file.startsWith('packages/database/')) {
        scopes.add('database');
    } else if (file.startsWith('packages/shared/')) {
        scopes.add('shared');
    } else if (file.startsWith('.github/')) {
        scopes.add('ci');
    } else if (file.startsWith('docs/') || file.endsWith('.md')) {
        isDocs = true;
        scopes.add('docs');
    } else if (file.includes('package') || file.includes('config') || file.includes('.json')) {
        scopes.add('config');
    }

    if (file.toLowerCase().includes('fix') || file.toLowerCase().includes('bug')) {
        isFix = true;
    }
}

let scope = 'monorepo';
if (scopes.size === 1) {
    scope = Array.from(scopes)[0];
} else if (scopes.size > 1) {
    const list = Array.from(scopes);
    if (list.length <= 2) {
        scope = list.join(',');
    } else {
        scope = 'monorepo';
    }
}

// 4. Bangun pesan commit
let commitType = isFix ? 'fix' : (isDocs && scopes.size === 1 ? 'docs' : 'feat');
let commitMessage = '';

if (userMessageArg) {
    // Jika pesan kustom sudah memiliki format conventional commit (contoh: feat(...): ...)
    if (/^(feat|fix|chore|docs|refactor|ci|test)(\(.+?\))?:/.test(userMessageArg)) {
        commitMessage = userMessageArg;
    } else {
        commitMessage = `${commitType}(${scope}): ${userMessageArg}`;
    }
} else {
    // Pesan otomatis berdasarkan scope
    const scopeDescriptions = {
        web: 'update web dashboard client',
        firmware: 'update ESP32 controller firmware',
        database: 'update Firebase security rules and schemas',
        shared: 'update shared constants and schemas',
        ci: 'update CI/CD workflows and deployment rules',
        docs: 'update technical documentation and guides',
        config: 'update project configuration files'
    };

    const description = scopeDescriptions[scope] || 'update packages and components';
    commitMessage = `${commitType}(${scope}): ${description}`;
}

console.log(`\n📌 Format Pesan Commit: "${commitMessage}"`);

try {
    // 5. Stage all changes
    console.log('📦 Menjalankan: git add -A');
    runInherit('git add -A');

    // 6. Commit
    console.log(`💾 Menjalankan: git commit -m "${commitMessage}"`);
    runInherit(`git commit -m "${commitMessage}"`);

    // 7. Push jika diaktifkan
    if (shouldPush) {
        const currentBranch = run('git rev-parse --abbrev-ref HEAD') || 'main';
        console.log(`🚀 Mengirim ke remote: git push origin ${currentBranch}...`);
        runInherit(`git push origin ${currentBranch}`);
        console.log(`\n🎉 Selesai! Perubahan berhasil di-commit & di-push ke branch '${currentBranch}'.\n`);
    } else {
        console.log(`\n✅ Perubahan berhasil di-commit secara lokal (mode --no-push).\n`);
    }
} catch (error) {
    console.error('\n❌ Terjadi kesalahan saat auto-commit/push:', error.message);
    process.exit(1);
}
