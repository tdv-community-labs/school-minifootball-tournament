const fs = require('fs');

let players = fs.readFileSync('components/Players.js', 'utf8');

const oldPlayerCard = `                return html\`
                  <div
                    key=\\\${player.id}
                    className="bg-white dark:bg-[#080808] dark:backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                  >
                    <!-- Top colour bar -->
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>`;

const newPlayerCard = `
                // UI/UX ProMax: Determine FUT-style gradient based on rating
                let foilGradient = 'from-slate-600/0 via-slate-400/5 to-slate-600/0';
                let borderGlow = 'hover:border-slate-500/30';
                let shadowGlow = 'hover:shadow-[0_0_30px_rgba(148,163,184,0.1)]';
                
                if (rating >= 8.5) {
                  foilGradient = 'from-amber-600/0 via-amber-400/10 to-amber-600/0';
                  borderGlow = 'hover:border-amber-500/50';
                  shadowGlow = 'hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]';
                } else if (rating >= 7.5) {
                  foilGradient = 'from-emerald-600/0 via-emerald-400/10 to-emerald-600/0';
                  borderGlow = 'hover:border-emerald-500/40';
                  shadowGlow = 'hover:shadow-[0_0_35px_rgba(16,185,129,0.15)]';
                }

                return html\`
                  <div
                    key=\${player.id}
                    onClick=\${() => onOpenPlayerProfile?.(player.name)}
                    className=\`group bg-white dark:bg-[#080808]/90 dark:backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xs \${borderGlow} \${shadowGlow} hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden cursor-pointer\`
                  >
                    <!-- FUT Holographic Foil Overlay -->
                    <div className=\`absolute inset-0 bg-gradient-to-tr \${foilGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none\`></div>
                    <div className="absolute -inset-full top-0 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-0 group-hover:animate-shine pointer-events-none"></div>

                    <!-- Top colour bar (Animated) -->
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>`;

// Wait, doing simple replace might fail if the old player card block isn't perfectly matched.
// We'll use regex.
players = players.replace(
  /return html`\s*<div\s*key=\$\{player\.id\}\s*className="bg-white dark:bg-\[\#080808\].*?relative overflow-hidden"\s*>\s*<!-- Top colour bar -->\s*<div className="absolute top-0 left-0 right-0 h-1\.5 bg-emerald-500"><\/div>/,
  newPlayerCard
);

fs.writeFileSync('components/Players.js', players, 'utf8');

// Also inject shine animation into styles.css
let css = fs.readFileSync('styles.css', 'utf8');
if (!css.includes('animate-shine')) {
  css += `
@keyframes shine {
  100% { left: 200%; }
}
.animate-shine {
  animation: shine 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
`;
  fs.writeFileSync('styles.css', css, 'utf8');
}
console.log('FUT Player Cards generated');
