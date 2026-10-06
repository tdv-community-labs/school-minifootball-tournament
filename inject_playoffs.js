const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if (!code.includes('import Playoffs from')) {
  code = code.replace(
    "import Trophies from './components/Trophies.js';",
    "import Trophies from './components/Trophies.js';\nimport Playoffs from './components/Playoffs.js';"
  );
}

if (!code.includes("{ id: 'playoffs'")) {
  code = code.replace(
    "{ id: 'trophies', label: 'Trofey Zalı', icon: 'fas fa-trophy' },",
    "{ id: 'trophies', label: 'Trofey Zalı', icon: 'fas fa-trophy' },\n    { id: 'playoffs', label: 'Pley-off Ağacı', icon: 'fas fa-sitemap' },"
  );
}

if (!code.includes("activeTab === 'playoffs'")) {
  code = code.replace(
    "${activeTab === 'trophies' && html`",
    `\${activeTab === 'playoffs' && html\`
          <\${Playoffs} 
            activeYear=\${activeYear}
          />
        \`}
        \${activeTab === 'trophies' && html\``
  );
}

fs.writeFileSync('app.js', code, 'utf8');
console.log('Injected Playoffs into app.js');
