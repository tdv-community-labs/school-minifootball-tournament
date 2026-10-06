const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  if (code.includes('\\${')) {
    code = code.replace(/\\\$\{/g, '${');
    changed = true;
  }
  
  if (code.includes('\\`')) {
    code = code.replace(/\\`/g, '`');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== '.git' && file !== 'node_modules') walkDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      fixFile(fullPath);
    }
  }
}

walkDir('./components');
walkDir('./services');
fixFile('./app.js');
console.log('All files checked and fixed.');
