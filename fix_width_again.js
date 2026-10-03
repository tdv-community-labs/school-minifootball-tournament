const fs = require('fs');
let code = fs.readFileSync('components/MatchPlayerProfileModal.js', 'utf8');

code = code.replace(
  /style=\$\{\{ width: \{[^}]+\}% \+ '%', transformOrigin: 'right', transform: animTrigger \? 'scaleX\(1\)' : 'scaleX\(0\)' \}\}/g,
  "style=${{ width: ((50 - b.val) * 2) + '%', transformOrigin: 'right', transform: animTrigger ? 'scaleX(1)' : 'scaleX(0)' }}"
);

code = code.replace(
  /style=\$\{\{ width: \{[^}]+\}% \+ '%', transformOrigin: 'left', transform: animTrigger \? 'scaleX\(1\)' : 'scaleX\(0\)' \}\}/g,
  "style=${{ width: Math.min(100, (b.val - 50) * 2) + '%', transformOrigin: 'left', transform: animTrigger ? 'scaleX(1)' : 'scaleX(0)' }}"
);

fs.writeFileSync('components/MatchPlayerProfileModal.js', code, 'utf8');
console.log("Fixed width styles again");
