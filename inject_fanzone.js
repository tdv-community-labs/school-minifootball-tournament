const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if (!code.includes('import Fanzone from')) {
  code = code.replace(
    "import Market from './components/Market.js';",
    "import Market from './components/Market.js';\nimport Fanzone from './components/Fanzone.js';"
  );
}

if (!code.includes("{ id: 'fanzone'")) {
  code = code.replace(
    "{ id: 'market', label: 'Bazar & Liderlər', icon: 'fas fa-chart-line' },",
    "{ id: 'market', label: 'Bazar & Liderlər', icon: 'fas fa-chart-line' },\n    { id: 'fanzone', label: 'Fanzona & Xəbərlər', icon: 'fas fa-newspaper' },"
  );
}

if (!code.includes("activeTab === 'fanzone'")) {
  code = code.replace(
    "${activeTab === 'market' && html`",
    `\${activeTab === 'fanzone' && html\`
          <\${Fanzone} 
            activeYear=\${activeYear}
          />
        \`}
        \${activeTab === 'market' && html\``
  );
}

fs.writeFileSync('app.js', code, 'utf8');
console.log('Injected Fanzone into app.js');
