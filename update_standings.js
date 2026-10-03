const fs = require('fs');
let code = fs.readFileSync('components/Standings.js', 'utf8');

// Update props
code = code.replace(
  "onOpenPlayerProfile",
  "onOpenPlayerProfile, onOpenTeamProfile"
);

// Add clickable link to team class cell
code = code.replace(
  /<td className="py-2 px-2 sm:py-3 sm:px-4 text-left font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate max-w-\[120px\] sm:max-w-xs">/g,
  '<td onClick=${() => onOpenTeamProfile && onOpenTeamProfile(team.class)} className="py-2 px-2 sm:py-3 sm:px-4 text-left font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate max-w-[120px] sm:max-w-xs cursor-pointer hover:text-emerald-500 transition-colors" title="Komanda profilinə bax">'
);

fs.writeFileSync('components/Standings.js', code, 'utf8');
console.log('Injected team profile links in Standings.js');
