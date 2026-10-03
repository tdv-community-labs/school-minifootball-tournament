const fs = require('fs');

let ui = fs.readFileSync('components/ui.js', 'utf8');

ui = ui.replace(
  /export const TeamBadge = \(\{ teamName = '\?', className = 'w-10 h-10 text-sm' \}\) => \{/,
  "export const TeamBadge = ({ teamName, className = 'w-10 h-10 text-sm' }) => {\n  const safeName = teamName || '?';"
);

ui = ui.replace(
  /const nameToHash = teamName === '\?' \? 'Unknown' : teamName;/,
  "const nameToHash = safeName === '?' ? 'Unknown' : String(safeName);"
);

ui = ui.replace(
  /const \[bg, border\] = teamName === '\?'/,
  "const [bg, border] = safeName === '?'"
);

ui = ui.replace(
  /const initials = teamName\.substring\(0, 3\)\.toUpperCase\(\);/,
  "const initials = String(safeName).substring(0, 3).toUpperCase();"
);

ui = ui.replace(
  /teamName/g, // replace remaining `title=${teamName}` with `title=${safeName}` in the html
  "safeName"
);

fs.writeFileSync('components/ui.js', ui, 'utf8');
console.log('Fixed TeamBadge crash');
