const fs = require('fs');

let content = fs.readFileSync('components/Matches.js', 'utf8');

if (!content.includes('TeamBadge')) {
  content = content.replace(
    "import { Card, EmptyState, Badge } from './ui.js';",
    "import { Card, EmptyState, Badge, TeamBadge } from './ui.js';"
  );
}

const teamARegex = /<h4 className=\{\`text-base sm:text-lg truncate \$\{\s*\(isTeamAWinner \|\| \(isFinalStage && match\.teamA === '\?'\)\)\s*\? 'font-black text-emerald-950 dark:text-emerald-200'\s*: isTeamALoser\s*\? 'font-semibold text-rose-950 dark:text-rose-300'\s*: 'font-bold text-zinc-900 dark:text-white'\s*\}\`\}>\s*\$\{match\.teamA\}\s*<\/h4>/g;

content = content.replace(teamARegex, 
  '<div className="flex flex-col items-center gap-2"><${TeamBadge} teamName=${match.teamA} className="w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm" />' + 
  '<h4 className={`text-base sm:text-lg truncate ${isTeamAWinner || (isFinalStage && match.teamA === "?") ? "font-black text-emerald-950 dark:text-emerald-200" : isTeamALoser ? "font-semibold text-rose-950 dark:text-rose-300" : "font-bold text-zinc-900 dark:text-white"}`}>${match.teamA}</h4></div>'
);

const teamBRegex = /<h4 className=\{\`text-base sm:text-lg truncate \$\{\s*\(isTeamBWinner \|\| \(isFinalStage && match\.teamB === '\?'\)\)\s*\? 'font-black text-emerald-950 dark:text-emerald-200'\s*: isTeamBLoser\s*\? 'font-semibold text-rose-950 dark:text-rose-300'\s*: 'font-bold text-zinc-900 dark:text-white'\s*\}\`\}>\s*\$\{match\.teamB\}\s*<\/h4>/g;

content = content.replace(teamBRegex, 
  '<div className="flex flex-col items-center gap-2"><${TeamBadge} teamName=${match.teamB} className="w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm" />' + 
  '<h4 className={`text-base sm:text-lg truncate ${isTeamBWinner || (isFinalStage && match.teamB === "?") ? "font-black text-emerald-950 dark:text-emerald-200" : isTeamBLoser ? "font-semibold text-rose-950 dark:text-rose-300" : "font-bold text-zinc-900 dark:text-white"}`}>${match.teamB}</h4></div>'
);

fs.writeFileSync('components/Matches.js', content, 'utf8');
console.log('Matches updated');
