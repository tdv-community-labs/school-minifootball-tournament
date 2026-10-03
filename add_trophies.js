const fs = require('fs');

let code = fs.readFileSync('components/PlayerProfileModal.js', 'utf8');

if (!code.includes('Trofey Qarderobu')) {
  code = code.replace(
    /<\/svg>\s*<\/div>\s*`;\s*\}\)\(\)\}/,
    `</svg>
                    </div>
                  \`;
                })()}
                
                <!-- BAZAR DƏYƏRİ VƏ NAİLİYYƏTLƏR (MARKET VALUE & ACHIEVEMENTS) -->
                \${(() => {
                  const rating = parseFloat(profile.careerRating) || 6.5;
                  const goals = parseInt(profile.totalGoals) || 0;
                  const games = parseInt(profile.totalMatches) || 0;
                  
                  // Procedural Market Value Generator
                  let baseValue = 500; // Base 500k
                  if (rating > 7.0) baseValue += (rating - 7.0) * 1000;
                  if (rating >= 8.0) baseValue += (rating - 8.0) * 3000;
                  if (rating >= 9.0) baseValue += (rating - 9.0) * 10000;
                  baseValue += (goals * 100);
                  baseValue += (games * 50);
                  
                  let valueStr = '';
                  if (baseValue >= 1000) {
                     valueStr = "€" + (baseValue / 1000).toFixed(1) + "M";
                  } else {
                     valueStr = "€" + Math.floor(baseValue) + "K";
                  }

                  // Procedural Badges
                  const badges = [];
                  if (rating >= 8.5) badges.push({ icon: 'fa-trophy', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]', label: 'Əfsanə', sub: '9.0+ Reytinq' });
                  if (goals >= 10) badges.push({ icon: 'fa-shoe-prints', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]', label: 'Qızıl Buts', sub: 'Top Scorer' });
                  if (games >= 15) badges.push({ icon: 'fa-shield-heart', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]', label: 'Veteran', sub: '15+ Oyun' });
                  if (rating >= 7.5 && rating < 8.5) badges.push({ icon: 'fa-star', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', label: 'Ulduz', sub: 'Açar Oyunçu' });
                  if (profile.isKeeper) badges.push({ icon: 'fa-hand-paper', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', label: 'Qartal', sub: 'Uçan Qapıçı' });
                  if (badges.length === 0) badges.push({ icon: 'fa-seedling', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', label: 'İstedad', sub: 'Gənc Potensial' });

                  return html\`
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[24px] p-5 shadow-lg relative overflow-hidden flex flex-col justify-between mt-6">
                      <!-- Shiny background effect -->
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-yellow-500/20 blur-3xl rounded-full"></div>
                      
                      <div className="flex items-center justify-between mb-4 z-10 relative border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                           <i className="fas fa-medal text-yellow-500 text-lg"></i>
                           <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">Trofey Qarderobu</h3>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Təxmini Bazar Dəyəri</span>
                           <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 drop-shadow-sm">\${valueStr}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar z-10 relative">
                        \${badges.map(b => html\`
                          <div className="\${b.color} flex-shrink-0 flex flex-col items-center justify-center p-3 sm:p-4 rounded-[16px] border backdrop-blur-sm min-w-[80px] sm:min-w-[90px] transition-transform hover:scale-105 cursor-default">
                             <i className="\${b.icon} text-2xl sm:text-3xl mb-2 drop-shadow-md"></i>
                             <span className="text-[10px] font-black uppercase text-zinc-100 whitespace-nowrap">\${b.label}</span>
                             <span className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5">\${b.sub}</span>
                          </div>
                        \`)}
                      </div>
                    </div>
                  \`;
                })()}
`
  );
  fs.writeFileSync('components/PlayerProfileModal.js', code, 'utf8');
  console.log('Added Trophies');
}
