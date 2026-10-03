const fs = require('fs');
let code = fs.readFileSync('components/Players.js', 'utf8');
code = code.replace(/\\\$\\\{\\\`/g, "${\`");
code = code.replace(/\\\`\\\}/g, "\`}");
fs.writeFileSync('components/Players.js', code, 'utf8');

let appCode = fs.readFileSync('app.js', 'utf8');
appCode = appCode.replace(/\\\$\{/g, '${');
appCode = appCode.replace(/\\`/g, '`');
fs.writeFileSync('app.js', appCode, 'utf8');

let profCode = fs.readFileSync('components/PlayerProfileModal.js', 'utf8');
profCode = profCode.replace(/\\\$\{/g, '${');
profCode = profCode.replace(/\\`/g, '`');
fs.writeFileSync('components/PlayerProfileModal.js', profCode, 'utf8');

console.log("Fixed Players, App, PlayerProfileModal");
