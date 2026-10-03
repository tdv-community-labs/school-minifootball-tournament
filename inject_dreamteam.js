const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if (!code.includes('import DreamTeam from')) {
  code = code.replace(
    "import Compare from './components/Compare.js';",
    "import Compare from './components/Compare.js';\nimport DreamTeam from './components/DreamTeam.js';"
  );
}

if (!code.includes("{ id: 'dreamteam'")) {
  code = code.replace(
    "{ id: 'compare', label: 'H2H', icon: 'fas fa-balance-scale' },",
    "{ id: 'compare', label: 'H2H', icon: 'fas fa-balance-scale' },\n    { id: 'dreamteam', label: 'Xəyalındakı 5-lik', icon: 'fas fa-star' },"
  );
}

if (!code.includes("activeTab === 'dreamteam'")) {
  code = code.replace(
    "${activeTab === 'compare' && html`",
    `\${activeTab === 'dreamteam' && html\`
          <\${DreamTeam} activeYear=\${activeYear} />
        \`}
        \${activeTab === 'compare' && html\``
  );
}

fs.writeFileSync('app.js', code, 'utf8');
console.log("Injected DreamTeam.js");
