const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');

app = app.replace(/setActiveTab=\$\{setActiveTab\}/g, 'setActiveTab=${handleTabChange}');

fs.writeFileSync('app.js', app, 'utf8');
console.log('Fixed ReferenceError');
