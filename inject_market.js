const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if (!code.includes('import Market from')) {
  code = code.replace(
    "import DreamTeam from './components/DreamTeam.js';",
    "import DreamTeam from './components/DreamTeam.js';\nimport Market from './components/Market.js';"
  );
}

if (!code.includes("{ id: 'market'")) {
  code = code.replace(
    "{ id: 'players', label: t('navPlayers', lang), icon: 'fas fa-users' },",
    "{ id: 'players', label: t('navPlayers', lang), icon: 'fas fa-users' },\n    { id: 'market', label: 'Bazar & Liderlər', icon: 'fas fa-chart-line' },"
  );
}

if (!code.includes("activeTab === 'market'")) {
  code = code.replace(
    "${activeTab === 'players' && html`",
    `\${activeTab === 'market' && html\`
          <\${Market} 
            activeYear=\${activeYear}
            onOpenPlayerProfile=\${openPlayerProfile}
          />
        \`}
        \${activeTab === 'players' && html\``
  );
}

fs.writeFileSync('app.js', code, 'utf8');
console.log('Injected Market into app.js');
