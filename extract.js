const fs = require('fs');
const lines = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes("activeTab === 'shotmap'"));
const end = lines.findIndex((l, i) => i > start && l.includes("activeTab === 'heatmap'"));
console.log(lines.slice(start, end).join('\n'));
