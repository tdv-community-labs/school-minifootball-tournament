const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if (!code.includes('import Trophies from')) {
  code = code.replace(
    "import Fanzone from './components/Fanzone.js';",
    "import Fanzone from './components/Fanzone.js';\nimport Trophies from './components/Trophies.js';"
  );
}

if (!code.includes("{ id: 'trophies'")) {
  code = code.replace(
    "{ id: 'fanzone', label: 'Fanzona & Xəbərlər', icon: 'fas fa-newspaper' },",
    "{ id: 'fanzone', label: 'Fanzona & Xəbərlər', icon: 'fas fa-newspaper' },\n    { id: 'trophies', label: 'Trofey Zalı', icon: 'fas fa-trophy' },"
  );
}

if (!code.includes("activeTab === 'trophies'")) {
  code = code.replace(
    "${activeTab === 'fanzone' && html`",
    `\${activeTab === 'trophies' && html\`
          <\${Trophies} 
            activeYear=\${activeYear}
          />
        \`}
        \${activeTab === 'fanzone' && html\``
  );
}

fs.writeFileSync('app.js', code, 'utf8');
console.log('Injected Trophies into app.js');
