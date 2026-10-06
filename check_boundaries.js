const fs = require('fs');
const lines = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes("activeTab === 'shotmap'"));
const end = lines.findIndex((l, i) => i > start && l.includes("activeTab === 'heatmap'"));
console.log('--- START ---');
console.log(lines.slice(start, start + 20).join('\n'));
console.log('---- END ----');
console.log(lines.slice(end - 10, end).join('\n'));
