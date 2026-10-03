const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if (!code.includes('import Compare from')) {
  code = code.replace(
    "import Players from './components/Players.js?v=20260912_0120';",
    "import Players from './components/Players.js?v=20260912_0120';\nimport Compare from './components/Compare.js';"
  );
}

if (!code.includes("{ id: 'compare'")) {
  code = code.replace(
    "{ id: 'players', label: t('navPlayers', lang), icon: 'fas fa-users' },",
    "{ id: 'players', label: t('navPlayers', lang), icon: 'fas fa-users' },\n    { id: 'compare', label: 'H2H', icon: 'fas fa-balance-scale' },"
  );
}

if (!code.includes("activeTab === 'compare'")) {
  code = code.replace(
    "${activeTab === 'players' && html`",
    `\${activeTab === 'compare' && html\`
          <\${Compare} 
            activeYear=\${activeYear} 
            lang=\${lang}
            t=\${t}
            onOpenPlayerProfile=\${openPlayerProfile}
          />
        \`}
        \${activeTab === 'players' && html\``
  );
}

fs.writeFileSync('app.js', code, 'utf8');
console.log("Injected Compare.js");
