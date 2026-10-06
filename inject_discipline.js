const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if (!code.includes('import Discipline from')) {
  code = code.replace(
    "import Playoffs from './components/Playoffs.js';",
    "import Playoffs from './components/Playoffs.js';\nimport Discipline from './components/Discipline.js';"
  );
}

if (!code.includes("{ id: 'discipline'")) {
  code = code.replace(
    "{ id: 'playoffs', label: 'Pley-off Ağacı', icon: 'fas fa-sitemap' },",
    "{ id: 'playoffs', label: 'Pley-off Ağacı', icon: 'fas fa-sitemap' },\n    { id: 'discipline', label: 'İntizam & Fair Play', icon: 'fas fa-gavel' },"
  );
}

if (!code.includes("activeTab === 'discipline'")) {
  code = code.replace(
    "${activeTab === 'playoffs' && html`",
    `\${activeTab === 'discipline' && html\`
          <\${Discipline} 
            activeYear=\${activeYear}
          />
        \`}
        \${activeTab === 'playoffs' && html\``
  );
}

fs.writeFileSync('app.js', code, 'utf8');
console.log('Injected Discipline into app.js');
