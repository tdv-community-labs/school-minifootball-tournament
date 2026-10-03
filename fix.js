const fs = require('fs');
let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

// Replace {/* comment */} with <!-- comment -->
code = code.replace(/\{\/\*(.*?)\*\/\}/g, '<!-- $1 -->');

// Replace {[ with ${[ (only when it's not already ${[)
code = code.replace(/([^$])\{\s*\[/g, '$1${[');

fs.writeFileSync('components/MatchAnalyticsModal.js', code);
console.log('Fixed syntax!');
