const fs = require('fs');

// 1. Fix Players.js
let players = fs.readFileSync('components/Players.js', 'utf8');
players = players.replace(
  /className=\`group bg-white(.*?\$\{borderGlow\} \$\{shadowGlow\}.*?)\`/g,
  "className=\\$\\{\\`group bg-white$1\\`\\}"
);
players = players.replace(
  /<div className=\`absolute inset-0 bg-gradient-to-tr \$\{foilGradient\} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none\`><\/div>/g,
  "<div className=\\$\\{\\`absolute inset-0 bg-gradient-to-tr \\${foilGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none\\`\\}><\/div>"
);
fs.writeFileSync('components/Players.js', players, 'utf8');
console.log('Fixed Players.js syntax');

// 2. Fix MatchAnalyticsModal.js
let modal = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');
modal = modal.replace(
  /className=\`absolute w-3\.5 h-3\.5 rounded-full border border-white\/80 transition-all hover:scale-150 cursor-crosshair \$\{typeClass\}\`/g,
  "className=\\$\\{\\`absolute w-3.5 h-3.5 rounded-full border border-white/80 transition-all hover:scale-150 cursor-crosshair \\${typeClass}\\`\\}"
);
fs.writeFileSync('components/MatchAnalyticsModal.js', modal, 'utf8');
console.log('Fixed MatchAnalyticsModal.js syntax');
