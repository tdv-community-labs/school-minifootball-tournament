const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');

app = app.replace(
  "import { Badge, Button, Card, EmptyState, Skeleton } from './components/ui.js",
  "import { Badge, Button, Card, EmptyState, Skeleton, SiteLogo, TeamBadge } from './components/ui.js"
);

app = app.replace(
  /<div className="w-12 h-12 rounded-2xl bg-purple-600\/20 border border-purple-500\/30 flex items-center justify-center animate-pulse">\s*<img src="assets\/tdv-logo.png" className="w-8 h-8 rounded-full" alt="TDV" \/>\s*<\/div>/g,
  '<${SiteLogo} className="w-12 h-12" />'
);

app = app.replace(
  /<img src="assets\/tdv-logo.png" alt="TDV" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-purple-500\/50 shadow-sm object-cover" \/>/g,
  '<${SiteLogo} className="w-8 h-8 sm:w-10 sm:h-10" />'
);

app = app.replace(
  /<img src="assets\/tdv-logo.jpg" alt="TDV BTL" className="w-6 h-6 rounded-full object-cover border border-amber-500\/60 shadow-xs" \/>/g,
  '<${SiteLogo} className="w-6 h-6" />'
);

fs.writeFileSync('app.js', app, 'utf8');

// Update MatchAnalyticsModal.js
let modal = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

if (!modal.includes('TeamBadge')) {
  modal = modal.replace(
    "import { getSofascoreBadgeStyle } from '../services/database.js?v=20260912_0120';",
    "import { getSofascoreBadgeStyle } from '../services/database.js?v=20260912_0120';\nimport { TeamBadge } from './ui.js';"
  );
}

// Replace team A badge
modal = modal.replace(
  /<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-700 text-white font-black text-lg sm:text-xl flex items-center justify-center border-2 border-white\/20 shadow-lg shrink-0">\s*\$\{match.teamA.substring\(0, 3\)\}\s*<\/div>/g,
  '<${TeamBadge} teamName=${match.teamA} className="w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl" />'
);

// Replace team B badge
modal = modal.replace(
  /<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-black text-lg sm:text-xl flex items-center justify-center border-2 border-white\/20 shadow-lg shrink-0">\s*\$\{match.teamB.substring\(0, 3\)\}\s*<\/div>/g,
  '<${TeamBadge} teamName=${match.teamB} className="w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl" />'
);

fs.writeFileSync('components/MatchAnalyticsModal.js', modal, 'utf8');

// Update Matches.js
let matches = fs.readFileSync('components/Matches.js', 'utf8');

if (!matches.includes('TeamBadge')) {
  matches = matches.replace(
    "import { Card, EmptyState, Badge } from './ui.js';",
    "import { Card, EmptyState, Badge, TeamBadge } from './ui.js';"
  );
}

// Replace Team A block
matches = matches.replace(
  /<div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500\/20 to-purple-500\/20 dark:from-indigo-500\/10 dark:to-purple-500\/10 rounded-2xl border border-indigo-500\/30 dark:border-indigo-500\/20 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-400 text-base sm:text-lg shadow-inner">\s*<span className="drop-shadow-sm">\$\{match.teamA\}\s*<\/span>\s*<\/div>/g,
  '<${TeamBadge} teamName=${match.teamA} className="w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base" />'
);

matches = matches.replace(
  /<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg shadow-md \$\{isTeamAWinner \? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400\/50' : 'bg-gradient-to-br from-zinc-700 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-600\/50 dark:border-zinc-700\/50'\}">\s*<span className="drop-shadow-sm">\$\{match.teamA\}\s*<\/span>\s*<\/div>/g,
  '<${TeamBadge} teamName=${match.teamA} className="w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base" />'
);

// Replace Team B block
matches = matches.replace(
  /<div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500\/20 to-purple-500\/20 dark:from-indigo-500\/10 dark:to-purple-500\/10 rounded-2xl border border-indigo-500\/30 dark:border-indigo-500\/20 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-400 text-base sm:text-lg shadow-inner">\s*<span className="drop-shadow-sm">\$\{match.teamB\}\s*<\/span>\s*<\/div>/g,
  '<${TeamBadge} teamName=${match.teamB} className="w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base" />'
);

matches = matches.replace(
  /<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg shadow-md \$\{isTeamBWinner \? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400\/50' : 'bg-gradient-to-br from-zinc-700 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-600\/50 dark:border-zinc-700\/50'\}">\s*<span className="drop-shadow-sm">\$\{match.teamB\}\s*<\/span>\s*<\/div>/g,
  '<${TeamBadge} teamName=${match.teamB} className="w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base" />'
);

fs.writeFileSync('components/Matches.js', matches, 'utf8');

console.log('App, MatchAnalytics, and Matches updated with premium logos');
