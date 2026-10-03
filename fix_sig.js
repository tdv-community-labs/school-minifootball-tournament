const fs = require('fs');

let ui = fs.readFileSync('components/ui.js', 'utf8');

ui = ui.replace(
  /export const TeamBadge = \(\{ safeName, className = 'w-10 h-10 text-sm' \}\) => \{/,
  "export const TeamBadge = ({ teamName, className = 'w-10 h-10 text-sm' }) => {"
);

ui = ui.replace(
  /const safeName = safeName \|\| '\?';/,
  "const safeName = teamName || '?';"
);

fs.writeFileSync('components/ui.js', ui, 'utf8');
console.log('Fixed TeamBadge signature');
