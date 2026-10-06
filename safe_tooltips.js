const fs = require('fs');

let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

const oldTitle = "title=${`${shot.player} (${shot.minute}') - ${shot.outcome.toUpperCase()} (xG: ${shot.xg})`}";
const newTitle = "title=${`${shot.player} (${shot.minute}') | Vəziyyət: ${shot.situation} | xG: ${shot.xg} | xGOT: ${shot.xgot || '0.00'}`}";

if (code.includes(oldTitle)) {
  code = code.replace(oldTitle, newTitle);
  fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
  console.log('Updated tooltips safely.');
} else {
  console.log('Could not find tooltips!');
}
