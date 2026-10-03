const fs = require('fs');
let code = fs.readFileSync('components/Matches.js', 'utf8');

// Update props
code = code.replace(
  "onSelectMatch",
  "onSelectMatch, onOpenTeamProfile"
);

// Add clickable link to team names
code = code.replace(
  /<div className="font-black text-sm sm:text-lg text-zinc-900 dark:text-white truncate uppercase tracking-tight">/g,
  '<div onClick=${(e) => { e.stopPropagation(); onOpenTeamProfile && onOpenTeamProfile(m.teamA); }} className="font-black text-sm sm:text-lg text-zinc-900 dark:text-white truncate uppercase tracking-tight cursor-pointer hover:text-emerald-500 transition-colors">'
);

code = code.replace(
  /<div className="font-black text-sm sm:text-lg text-zinc-900 dark:text-white truncate text-right uppercase tracking-tight">/g,
  '<div onClick=${(e) => { e.stopPropagation(); onOpenTeamProfile && onOpenTeamProfile(m.teamB); }} className="font-black text-sm sm:text-lg text-zinc-900 dark:text-white truncate text-right uppercase tracking-tight cursor-pointer hover:text-emerald-500 transition-colors">'
);

fs.writeFileSync('components/Matches.js', code, 'utf8');
console.log('Injected team profile links in Matches.js');
