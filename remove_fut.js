const fs = require('fs');

let players = fs.readFileSync('components/Players.js', 'utf8');

players = players.replace(
  /let foilGradient = [\s\S]*?shadowGlow = 'hover:shadow-\[0_0_35px_rgba\(16,185,129,0\.15\)\]';\s*\}/g,
  ''
);

players = players.replace(
  /className=\$\{\`group bg-white dark:bg-\[\#080808\]\/90 dark:backdrop-blur-2xl border border-zinc-200 dark:border-white\/10 rounded-3xl p-4 sm:p-6 shadow-xs \$\{borderGlow\} \$\{shadowGlow\} hover:-translate-y-1\.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden cursor-pointer\`\}/g,
  'className="group bg-white dark:bg-[#080808]/90 dark:backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xs hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden cursor-pointer"'
);

players = players.replace(
  /<!-- FUT Holographic Foil Overlay -->[\s\S]*?<!-- Top colour bar \(Animated\) -->/,
  '<!-- Top colour bar (Animated) -->'
);

fs.writeFileSync('components/Players.js', players, 'utf8');
console.log('FUT removed');
