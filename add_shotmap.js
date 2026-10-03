const fs = require('fs');

let modal = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

// 1. Add tab to navigation
modal = modal.replace(
  /\{ id: 'stats', label: 'Statistika', icon: 'fa-chart-bar' \},/,
  `{ id: 'stats', label: 'Statistika', icon: 'fa-chart-bar' },\n              { id: 'shotmap', label: 'Zərbə Xəritəsi (Shotmap)', icon: 'fa-crosshairs', badge: 'PRO' },`
);

// 2. Build the shotmap content
const shotmapTab = `
            <!--  TAB: SHOTMAP (PROMAX FEATURE)  -->
            \${activeTab === 'shotmap' && html\`
              <div className="bg-transparent/90 border border-white/10 rounded-2xl p-5 space-y-6 overflow-hidden relative">
                <!-- Glossy Background FX -->
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex items-center justify-between z-10 relative">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-purple-400 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                      <i className="fas fa-crosshairs text-sky-400"></i> Zərbə Xəritəsi (Shotmap)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Komandaların qapıya vurduğu zərbələrin (qol, seyv, xaric) 2D vizualizasiyası</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold bg-[#0b0e14]/50 p-2 rounded-xl border border-white/5 backdrop-blur-md">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Qol</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span> Seyv / Dəqiq</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span> Xaric</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  <!-- Team A Pitch -->
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center px-2">
                      <span className="font-black text-sm text-red-400 drop-shadow-sm">\${match.teamA}</span>
                      <span className="text-xs font-bold text-slate-400">\${stats.totalShotsA || 8} Zərbə</span>
                    </div>
                    <!-- Half Pitch Visual -->
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-t from-[#0a2316] to-[#123823] rounded-t-3xl border-2 border-emerald-500/40 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                      <!-- Pitch Lines -->
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/30 rounded-t-lg"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white/30 rounded-t-sm"></div>
                      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50"></div>
                      <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-white/20"></div>
                      
                      <!-- Procedural Shot Dots based on stats -->
                      \${Array.from({ length: stats.totalShotsA || 8 }).map((_, i) => {
                        const isGoal = i < (parseInt(match.scoreA) || 0);
                        const isTarget = !isGoal && i < (stats.shotsOnTargetA || 3);
                        const typeClass = isGoal ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)] scale-125 z-20' : (isTarget ? 'bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)] z-10' : 'bg-rose-500/80 shadow-sm z-0');
                        // Generate random plausible coordinates for attacking half
                        const left = 20 + (Math.sin(i * 1.5) * 35) + 35; // 20 to 80%
                        const bottom = isGoal ? 5 + (i * 4) : 10 + (Math.cos(i * 2) * 20) + 20; // Closer if goal
                        
                        return html\`
                          <div 
                            key=\${i} 
                            className=\`absolute w-3.5 h-3.5 rounded-full border border-white/80 transition-all hover:scale-150 cursor-crosshair \${typeClass}\`
                            style=\${{ left: \`\${left}%\`, bottom: \`\${bottom}%\` }}
                            title=\${isGoal ? 'Qol!' : (isTarget ? 'Dəqiq Zərbə (Seyv)' : 'Qeyri-dəqiq zərbə')}
                          ></div>
                        \`;
                      })}
                    </div>
                  </div>

                  <!-- Team B Pitch -->
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-bold text-slate-400">\${stats.totalShotsB || 7} Zərbə</span>
                      <span className="font-black text-sm text-sky-400 drop-shadow-sm">\${match.teamB}</span>
                    </div>
                    <!-- Half Pitch Visual -->
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-t from-[#0a2316] to-[#123823] rounded-t-3xl border-2 border-emerald-500/40 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                      <!-- Pitch Lines -->
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/30 rounded-t-lg"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white/30 rounded-t-sm"></div>
                      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50"></div>
                      <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-white/20"></div>
                      
                      <!-- Procedural Shot Dots -->
                      \${Array.from({ length: stats.totalShotsB || 7 }).map((_, i) => {
                        const isGoal = i < (parseInt(match.scoreB) || 0);
                        const isTarget = !isGoal && i < (stats.shotsOnTargetB || 4);
                        const typeClass = isGoal ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)] scale-125 z-20' : (isTarget ? 'bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)] z-10' : 'bg-rose-500/80 shadow-sm z-0');
                        // Generate random plausible coordinates for attacking half
                        const left = 20 + (Math.cos(i * 1.5) * 35) + 35; // 20 to 80%
                        const bottom = isGoal ? 5 + (i * 3) : 10 + (Math.sin(i * 3) * 20) + 20; // Closer if goal
                        
                        return html\`
                          <div 
                            key=\${i} 
                            className=\`absolute w-3.5 h-3.5 rounded-full border border-white/80 transition-all hover:scale-150 cursor-crosshair \${typeClass}\`
                            style=\${{ left: \`\${left}%\`, bottom: \`\${bottom}%\` }}
                            title=\${isGoal ? 'Qol!' : (isTarget ? 'Dəqiq Zərbə (Seyv)' : 'Qeyri-dəqiq zərbə')}
                          ></div>
                        \`;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            \`}
`;

// Insert shotmap tab right before video tab
modal = modal.replace(
  /<!--\s*TAB 5: VIDEO & YOUTUBE INTEGRATION\s*-->/g,
  shotmapTab + '\n            <!--  TAB 5: VIDEO & YOUTUBE INTEGRATION  -->'
);

fs.writeFileSync('components/MatchAnalyticsModal.js', modal, 'utf8');
console.log('Shotmap UI added');
