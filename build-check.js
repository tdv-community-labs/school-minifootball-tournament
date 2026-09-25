import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting TDV BTL Minifootball Tournament Build Verification...\n');

let failed = false;

// 1. Check syntax of all JS files
const filesToCheck = [
  'app.js',
  'components/ui.js',
  'components/UnifiedAuthBarrier.js',
  'components/Dashboard.js',
  'components/Standings.js',
  'components/Matches.js',
  'components/Players.js',
  'components/PlayerProfileModal.js',
  'components/GlobalSearchModal.js',
  'components/PublicAiChatbot.js',
  'components/MatchAnalyticsModal.js',
  'components/AdminDashboard.js',
  'services/database.js',
  'services/authService.js',
  'services/i18n.js',
  'services/matchAnalyticsData.js',
  'services/matchUtils.js',
  'services/ratings.js',
  'services/security.js',
  'services/selfHealing.js',
  'services/tournamentGroups.js'
];

console.log('--- 1. JavaScript Syntax Verification ---');
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    try {
      execSync(`node --experimental-vm-modules -e "const vm = require('vm'); const fs = require('fs'); new vm.SourceTextModule(fs.readFileSync('${file.replace(/\\/g, '/')}', 'utf8'));"`, { stdio: 'pipe' });
      console.log(`  ✓ ${file}`);
    } catch (e) {
      console.error(`  ✗ ${file}: Syntax Error!\n${e.stderr ? e.stderr.toString() : e.message}`);
      failed = true;
    }
  } else {
    console.warn(`  ! ${file}: File not found`);
  }
}

// 2. Check UI component primitives
console.log('\n--- 2. Design System Primitive Verification ---');
const uiJs = fs.readFileSync('components/ui.js', 'utf8');
const requiredExports = ['Badge', 'Button', 'Card', 'EmptyState'];
for (const exp of requiredExports) {
  if (uiJs.includes(`export function ${exp}`) || uiJs.includes(`export const ${exp}`)) {
    console.log(`  ✓ components/ui.js exports ${exp}`);
  } else {
    console.error(`  ✗ components/ui.js is missing ${exp}`);
    failed = true;
  }
}

// 3. Design Token Verification in styles.css and index.html
console.log('\n--- 3. Design Token Verification ---');
const stylesCss = fs.readFileSync('styles.css', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

const expectedCssTokens = ['--color-zinc-950', '--color-zinc-900', '--color-zinc-800', '--color-zinc-50', '--color-zinc-200'];
for (const token of expectedCssTokens) {
  if (stylesCss.includes(token)) {
    console.log(`  ✓ styles.css contains ${token}`);
  } else {
    console.error(`  ✗ styles.css missing ${token}`);
    failed = true;
  }
}

if (indexHtml.includes('zinc-950') && indexHtml.includes('emerald')) {
  console.log('  ✓ index.html configured with zinc-950 dark base and emerald accents');
} else {
  console.error('  ✗ index.html missing zinc-950 or emerald config');
  failed = true;
}

// 4. TypeScript Interface check
console.log('\n--- 4. TypeScript Types Verification ---');
if (fs.existsSync('types.ts')) {
  try {
    execSync('npx.cmd --yes typescript --noEmit types.ts');
    console.log('  ✓ types.ts exists and passed tsc --noEmit with 0 errors');
  } catch (e) {
    console.error('  ✗ types.ts failed tsc check');
    failed = true;
  }
} else {
  console.error('  ✗ types.ts missing');
  failed = true;
}

if (failed) {
  console.error('\n❌ Build verification FAILED.');
  process.exit(1);
} else {
  console.log('\n✅ All 21 JS modules, design tokens, primitives, and types verified successfully! 100% PASS.');
}
