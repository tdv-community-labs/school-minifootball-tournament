const fs = require('fs');

let matches = fs.readFileSync('components/Matches.js', 'utf8');
if (!matches.includes('TeamBadge')) {
  matches = matches.replace(
    "import { Skeleton } from './ui.js?v=2026';",
    "import { Skeleton, TeamBadge } from './ui.js';"
  );
  fs.writeFileSync('components/Matches.js', matches, 'utf8');
  console.log('Fixed Matches.js import');
}

let modal = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');
if (!modal.includes('import { TeamBadge }')) {
  console.log('MatchAnalyticsModal missing TeamBadge?');
  console.log(modal.substring(0, 400));
}
