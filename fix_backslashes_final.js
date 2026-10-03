const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Remove backslashes before dollar signs: \${ -> ${
  code = code.replace(/\\\$\{/g, '${');
  
  // Remove backslashes before backticks: \` -> `
  code = code.replace(/\\`/g, '`');
  
  fs.writeFileSync(file, code, 'utf8');
}

fixFile('components/Compare.js');
fixFile('components/DreamTeam.js');
console.log('Fixed backslashes in Compare and DreamTeam');
