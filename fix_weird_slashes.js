const fs = require('fs');
let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

code = code.replace(/\\\\\\$\\\\\\{/g, '${'); // Try to match \\$\\{
code = code.replace(/\\\\\\$\\{/g, '${'); // Try to match \\${
code = code.replace(/\\$\\{/g, '${'); // Match $\\{
code = code.replace(/\\\\\\}/g, '}'); // Match \\}
code = code.replace(/\\\\\}/g, '}'); // Match \\}

// The string is: className=\\$\\{`absolute...`\\}
code = code.split('\\$\\{').join('${');
code = code.split('\\}').join('}');
code = code.split('\\`').join('\`');

fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
console.log('Fixed backslashes');
