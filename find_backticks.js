const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const lines = code.split('\n');
    lines.forEach((line, i) => {
      if (line.indexOf('\\`') !== -1 || line.indexOf('\\$') !== -1) {
        console.log(filePath + ':' + (i+1) + ': ' + line.trim());
      }
    });
  } catch (e) {}
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== '.git' && file !== 'node_modules') walkDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      checkFile(fullPath);
    }
  }
}

walkDir('./components');
walkDir('./services');
checkFile('./app.js');
