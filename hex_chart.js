const fs = require('fs');

let modal = fs.readFileSync('components/PlayerProfileModal.js', 'utf8');

const generateHexagonCode = `
              <!-- 5v5 Minifootball Positional Territory & Career Heatmap -->
`;

const replaceWith = `
              <!-- Hexagonal Performance Radar Chart (6-bucaqli) -->
              \${(() => {
                const isKeeper = Boolean(profile.isKeeper);
                const posStr = (profile.positions || []).join(' ').toLowerCase();
                const isDef = !isKeeper && /müdafiə|df|arxa|fix/i.test(posStr);
                const isMid = !isKeeper && !isDef && /yarımmüdafiə|mf|orta|cinah|ala/i.test(posStr);
                const isFwd = !isKeeper && !isDef && !isMid; 
                
                const rating = parseFloat(profile.careerRating) || 6.5;
                const goals = parseInt(profile.totalGoals) || 0;
                
                // Procedural generation of 6 stats based on position and rating (scaled to 1-99)
                const baseStat = Math.min(99, Math.max(50, Math.floor(rating * 10)));
                
                let stats = [];
                if (isKeeper) {
                  stats = [
                    { label: 'DIV', val: Math.min(99, baseStat + 5) },
                    { label: 'HAN', val: Math.min(99, baseStat + 2) },
                    { label: 'KIC', val: Math.min(99, baseStat - 5) },
                    { label: 'REF', val: Math.min(99, baseStat + 8) },
                    { label: 'SPD', val: Math.min(99, baseStat - 15) },
                    { label: 'POS', val: Math.min(99, baseStat + 4) }
                  ];
                } else {
                  stats = [
                    { label: 'SÜR', val: Math.min(99, baseStat + (isMid ? 8 : isFwd ? 5 : 2)) }, // Sürət
                    { label: 'ZƏR', val: Math.min(99, baseStat + (isFwd ? 10 : isMid ? 2 : -10) + Math.min(10, goals)) }, // Zərbə
                    { label: 'ÖTÜ', val: Math.min(99, baseStat + (isMid ? 10 : isDef ? 5 : 0)) }, // Ötürmə
                    { label: 'DRİ', val: Math.min(99, baseStat + (isMid ? 6 : isFwd ? 8 : -5)) }, // Driblinq
                    { label: 'MÜD', val: Math.min(99, baseStat + (isDef ? 15 : isMid ? 4 : -15)) }, // Müdafiə
                    { label: 'FİZ', val: Math.min(99, baseStat + (isDef ? 10 : 0)) } // Fiziki / Dözümlülük
                  ];
                }
                
                // SVG Calculation for Hexagon
                const rMax = 70; // Max radius
                const cx = 100, cy = 100;
                const getPoint = (r, idx) => {
                  const angle = (idx * 60 - 90) * (Math.PI / 180);
                  return \`\${cx + r * Math.cos(angle)},\${cy + r * Math.sin(angle)}\`;
                };
                
                const bgPolygon1 = [0,1,2,3,4,5].map(i => getPoint(rMax, i)).join(' ');
                const bgPolygon2 = [0,1,2,3,4,5].map(i => getPoint(rMax * 0.66, i)).join(' ');
                const bgPolygon3 = [0,1,2,3,4,5].map(i => getPoint(rMax * 0.33, i)).join(' ');
                
                const statPolygon = stats.map((st, i) => getPoint(rMax * (st.val / 100), i)).join(' ');

                // Colors based on rating
                const colorTheme = rating >= 8.5 ? 'rgba(245, 158, 11' : rating >= 7.5 ? 'rgba(16, 185, 129' : 'rgba(56, 189, 248';

                return html\`
                  <div className="bg-transparent border border-zinc-200/80 dark:border-white/10 p-5 rounded-[24px] shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 to-transparent dark:from-zinc-800/30 dark:to-transparent opacity-50"></div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 z-10">Performans Analizi</h3>
                    
                    <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center z-10">
                      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
                        <!-- Grid Webs -->
                        <polygon points="\${bgPolygon1}" fill="none" stroke="currentColor" className="text-zinc-300 dark:text-zinc-700" strokeWidth="1" />
                        <polygon points="\${bgPolygon2}" fill="none" stroke="currentColor" className="text-zinc-300 dark:text-zinc-700" strokeWidth="1" />
                        <polygon points="\${bgPolygon3}" fill="none" stroke="currentColor" className="text-zinc-300 dark:text-zinc-700" strokeWidth="1" />
                        
                        <!-- Spoke Lines -->
                        \${[0,1,2,3,4,5].map(i => html\`
                          <line key=\${i} x1="100" y1="100" x2=\${getPoint(rMax, i).split(',')[0]} y2=\${getPoint(rMax, i).split(',')[1]} stroke="currentColor" className="text-zinc-300 dark:text-zinc-700" strokeWidth="1" />
                        \`)}

                        <!-- Data Polygon -->
                        <polygon points="\${statPolygon}" fill="\${colorTheme}, 0.3)" stroke="\${colorTheme}, 1)" strokeWidth="2.5" />
                        
                        <!-- Data Points -->
                        \${stats.map((st, i) => html\`
                          <circle key=\${i} cx=\${getPoint(rMax * (st.val / 100), i).split(',')[0]} cy=\${getPoint(rMax * (st.val / 100), i).split(',')[1]} r="3" fill="\${colorTheme}, 1)" />
                        \`)}
                        
                        <!-- Labels -->
                        \${stats.map((st, i) => {
                          const lblR = rMax + 18;
                          const pos = getPoint(lblR, i).split(',');
                          return html\`
                            <text key=\${i} x=\${pos[0]} y=\${pos[1]} textAnchor="middle" dominantBaseline="middle" className="text-[9px] font-black fill-zinc-600 dark:fill-zinc-300 tracking-wider">
                              \${st.label}
                            </text>
                            <text key=\${i + '_val'} x=\${pos[0]} y=\${Number(pos[1]) + 10} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-zinc-900 dark:fill-white">
                              \${st.val}
                            </text>
                          \`;
                        })}
                      </svg>
                    </div>
                  </div>
                \`;
              })()}
              
              <!-- 5v5 Minifootball Positional Territory & Career Heatmap -->
`;

modal = modal.replace(
  /<!-- 5v5 Minifootball Positional Territory & Career Heatmap -->/g,
  replaceWith
);

fs.writeFileSync('components/PlayerProfileModal.js', modal, 'utf8');
console.log('Hexagonal Radar Chart injected into Player Profile');
