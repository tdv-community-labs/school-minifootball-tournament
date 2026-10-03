const fs = require('fs');

let matchAnalytics = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

// 1. Add import statement
if (!matchAnalytics.includes('MatchPlayerProfileModal')) {
  matchAnalytics = matchAnalytics.replace(
    /import \{ getSofascoreBadgeStyle \} from '\.\.\/services\/database\.js\?v=[^']+';/,
    "import { getSofascoreBadgeStyle } from '../services/database.js';\nimport MatchPlayerProfileModal from './MatchPlayerProfileModal.js';"
  );
  if (!matchAnalytics.includes('MatchPlayerProfileModal')) {
    matchAnalytics = matchAnalytics.replace(
      /import \{ getSofascoreBadgeStyle \} from '\.\.\/services\/database\.js';/,
      "import { getSofascoreBadgeStyle } from '../services/database.js';\nimport MatchPlayerProfileModal from './MatchPlayerProfileModal.js';"
    );
  }
}

// 2. Render it inside the modal at the very end
if (!matchAnalytics.includes('<MatchPlayerProfileModal')) {
  // We can insert it before the final closing div tag of the component
  const lastIndex = matchAnalytics.lastIndexOf('</div>');
  if (lastIndex !== -1) {
    matchAnalytics = matchAnalytics.slice(0, lastIndex) + 
      `\n        \${selectedPlayer && html\`\n          <MatchPlayerProfileModal\n            player=\${selectedPlayer}\n            match=\${match}\n            onClose=\${() => setSelectedPlayer(null)}\n          />\n        \`}\n      </div>` +
      matchAnalytics.slice(lastIndex + 6);
  }
}

fs.writeFileSync('components/MatchAnalyticsModal.js', matchAnalytics, 'utf8');
console.log('Integrated MatchPlayerProfileModal');
