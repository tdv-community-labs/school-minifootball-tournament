const fs = require('fs');
const lines = fs.readFileSync('old_match.js', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes("activeTab === 'shotmap'"));
const end = lines.findIndex(l => l.includes("MERGED 3D POV COMPONENT"));
console.log(lines.slice(start, end).join('\n'));
