/**
 * ============================================================================
 * FAYL ADI: components/Discipline.js
 * MƏQSƏDİ: İntizam Komitəsi, Fair Play Cədvəli və Kartlar
 * ============================================================================
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export default function Discipline({ activeYear }) {
  // Placeholder data
  const fairPlayTable = [
    { rank: 1, team: '11 H', points: 95, yellow: 2, red: 0, fouls: 15 },
    { rank: 2, team: '10 A', points: 88, yellow: 4, red: 0, fouls: 22 },
    { rank: 3, team: '9 B', points: 75, yellow: 6, red: 1, fouls: 30 },
    { rank: 4, team: '11 A', points: 60, yellow: 8, red: 2, fouls: 45 }
  ];

  const suspensions = [
    { player: 'Rauf M.', team: '10 A', reason: 'Qırmızı Kart', duration: '1 Oyun', returnDate: 'Növbəti Tur' },
    { player: 'Kərim Ə.', team: '11 C', reason: 'Sarı Kart Limiti (3)', duration: '1 Oyun', returnDate: 'Növbəti Tur' }
  ];

  return html`
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      
      <!-- HEADER -->
      <div className="relative bg-[#1a0f14] border border-rose-500/20 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden flex flex-col sm:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
        
        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-gradient-to-br from-rose-500 to-red-800 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.4)] rotate-12 relative z-10 hover:rotate-0 transition-transform duration-500">
          <div className="w-16 h-20 bg-yellow-400 rounded shadow-md absolute -left-4 top-2 -rotate-12 border border-yellow-200"></div>
          <div className="w-16 h-20 bg-red-500 rounded shadow-lg absolute right-2 top-2 border border-red-300"></div>
        </div>

        <div className="relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider mb-4">
            <i className="fas fa-gavel"></i> İntizam Komitəsi
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-3">Fair Play & Cəzalar</h2>
          <p className="text-slate-400 max-w-xl text-sm sm:text-base">Meydanda hörmət və ədalət! Hansı komanda daha intizamlıdır, kimlər cəzalıdır?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- MAIN FAIR PLAY TABLE -->
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <i className="fas fa-balance-scale text-emerald-400"></i> Fair Play Reytinqi
              </h3>
              <span className="text-xs text-slate-400 font-bold">100 Xal üzərindən</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5">
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">Komanda</th>
                    <th className="p-4 text-center text-amber-400"><i className="fas fa-square"></i> Sarı</th>
                    <th className="p-4 text-center text-red-500"><i className="fas fa-square"></i> Qırmızı</th>
                    <th className="p-4 text-center">Foul</th>
                    <th className="p-4 text-right text-emerald-400">FP Xalı</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  ${fairPlayTable.map((team) => html`
                    <tr key=${team.team} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-center font-bold text-slate-500">${team.rank}</td>
                      <td className="p-4 font-black text-white group-hover:text-emerald-400 transition-colors">${team.team}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-300">${team.yellow}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-300">${team.red}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-400">${team.fouls}</td>
                      <td className="p-4 text-right font-black text-lg text-white">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className=${`h-full ${team.points > 80 ? 'bg-emerald-500' : team.points > 60 ? 'bg-amber-500' : 'bg-red-500'}`} style=${{ width: `${team.points}%` }}></div>
                          </div>
                          ${team.points}
                        </div>
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- SUSPENSIONS & REFEREES -->
        <div className="space-y-6">
          
          <!-- Suspended Players -->
          <div className="bg-gradient-to-b from-[#2a0812] to-[#161b22] border border-rose-500/20 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-rose-500/20 bg-rose-950/30 flex items-center gap-2">
              <i className="fas fa-ban text-rose-500"></i>
              <h3 className="text-lg font-black text-rose-100">Cəzalı Oyunçular</h3>
            </div>
            <div className="p-4 space-y-3">
              ${suspensions.map((susp, idx) => html`
                <div key=${idx} className="bg-black/40 border border-rose-500/10 rounded-xl p-3 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">${susp.player}</h4>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">${susp.team}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">${susp.duration}</span>
                  </div>
                  <p className="text-xs text-rose-400 font-bold"><i className="fas fa-exclamation-triangle mr-1"></i> ${susp.reason}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Dönüş: ${susp.returnDate}</p>
                </div>
              `)}
              ${suspensions.length === 0 && html`
                <div className="text-center py-6 text-slate-500 text-sm font-bold">Hazırda cəzalı oyunçu yoxdur.</div>
              `}
            </div>
          </div>

          <!-- Referee Stats Mini-Card -->
          <div className="bg-[#161b22] border border-white/5 rounded-2xl shadow-lg p-5">
            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
              <i className="fas fa-stopwatch text-slate-400"></i> Hakim Statistikası
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>Orta Sarı Kart (Oyun)</span>
                  <span className="text-amber-400">2.5</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="w-1/2 h-full bg-amber-500"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>Orta Foul (Oyun)</span>
                  <span className="text-white">14.2</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="w-3/4 h-full bg-slate-400"></div></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}
