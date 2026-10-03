const fs = require('fs');
let code = fs.readFileSync('components/MatchPlayerProfileModal.js', 'utf8');

code = code.replace(
  /style=\$\{\{ width: \\`\\\$([^`]+)\\`, transformOrigin: 'right', transform: \\`scaleX\(\\\$\{animTrigger \? 1 : 0\}\)\\` \}\}/g,
  "style=${{ width: $1 + '%', transformOrigin: 'right', transform: animTrigger ? 'scaleX(1)' : 'scaleX(0)' }}"
);

code = code.replace(
  /style=\$\{\{ width: \\`\\\$([^`]+)\\`, transformOrigin: 'left', transform: \\`scaleX\(\\\$\{animTrigger \? 1 : 0\}\)\\` \}\}/g,
  "style=${{ width: $1 + '%', transformOrigin: 'left', transform: animTrigger ? 'scaleX(1)' : 'scaleX(0)' }}"
);

fs.writeFileSync('components/MatchPlayerProfileModal.js', code, 'utf8');
console.log("Fixed width styles");
