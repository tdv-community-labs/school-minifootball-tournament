/**
 * ============================================================================
 * FAYL ADI: components/MatchPlayerProfileModal.js
 * MƏQSƏDİ: Oyunçuya kliklədikdə açılan və konkret 1 MATÇ üçün Sofascore tipli detallı statistikanı göstərən pəncərə.
 * ============================================================================
 */
import React, { useState, useMemo } from 'react';
import htm from 'htm';
import { getSofascoreBadgeStyle } from '../services/database.js';

const html = htm.bind(React.createElement);

export default function MatchPlayerProfileModal({ player, match, onClose }) {
  const [activeTab, setActiveTab] = useState('pass'); // 'shot' | 'pass' | 'drib' | 'def'
  const [isFavorite, setIsFavorite] = useState(false);

  // Generate realistic stats based on rating (so a 9.8 rating gets crazy stats like De Bruyne)
  const stats = useMemo(() => {
    if (!player) return null;
    const isGK = player.pos === 'GK';
    const r = player.rating || 7.0;
    const baseMult = (r - 5.0) / 5.0; // 0.0 to ~1.0
    
    // Procedural generations
    const goals = player.goals || (r > 8.5 && !isGK ? Math.floor(Math.random() * 3) + 1 : 0);
    const xG = (goals > 0 ? goals - 0.2 + (Math.random() * 0.4) : (r > 7.5 && !isGK ? Math.random() * 0.8 : 0)).toFixed(2);
    const shots = goals + Math.floor(Math.random() * 4 * baseMult);
    const shotsOnTarget = goals + Math.floor(Math.random() * (shots - goals));
    
    const totalPasses = isGK ? 15 + Math.floor(Math.random() * 15) : 30 + Math.floor(Math.random() * 40 * baseMult);
    const passAcc = isGK ? 60 + Math.floor(Math.random() * 20) : 75 + Math.floor(Math.random() * 20 * baseMult);
    const accPasses = Math.floor((totalPasses * passAcc) / 100);
    const assists = r > 8.0 && !isGK ? Math.floor(Math.random() * 3) : 0;
    const keyPasses = assists + Math.floor(Math.random() * 4 * baseMult);
    
    const touches = totalPasses + shots + Math.floor(Math.random() * 20);
    const dribbles = isGK ? 0 : Math.floor(Math.random() * 5 * baseMult);
    const succDribbles = Math.floor(dribbles * (0.5 + Math.random() * 0.5));
    const possLost = Math.floor(Math.random() * 15) + 5;
    
    const tackles = isGK ? 0 : 1 + Math.floor(Math.random() * 5 * baseMult);
    const interc = isGK ? 0 : Math.floor(Math.random() * 4 * baseMult);
    const recov = isGK ? 2 : 3 + Math.floor(Math.random() * 7 * baseMult);

    return {
      goals, xG, shots, shotsOnTarget,
      totalPasses, passAcc, accPasses, assists, keyPasses,
      touches, dribbles, succDribbles, possLost,
      tackles, interc, recov
    };
  }, [player]);

  if (!player || !match) return null;

  return html`
    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div 
        className="w-full sm:w-[480px] max-h-[95vh] bg-[#161a25] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in"
      >
        <!-- Header -->
        <div className="bg-[#1e2333] p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
              <i className="fas fa-user text-2xl text-slate-500"></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">${player.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className=${`text-xs font-black px-1.5 py-0.5 rounded shadow ${getSofascoreBadgeStyle(player.rating)}`}>
                  ${player.rating?.toFixed(1)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Sofascore Rating</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick=${() => setIsFavorite(!isFavorite)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition">
              <i className=${`${isFavorite ? 'fas text-blue-500' : 'far'} fa-star text-lg`}></i>
            </button>
            <button onClick=${onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          
          <!-- Match Info -->
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">${match.teamA} ${match.scoreA} - ${match.scoreB} ${match.teamB}</span>
            </div>
            <span className="text-xs text-slate-400 font-bold">${match.date || 'Tarix yoxdur'}</span>
          </div>

          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <i className="far fa-clock"></i> Meydanda olduğu dəqiqə
            </div>
            <span className="font-bold text-white">35'</span>
          </div>

          <!-- Rating Breakdown (Impact) -->
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className=${`text-xs font-black px-1.5 py-0.5 rounded ${getSofascoreBadgeStyle(player.rating)}`}>
                  ${player.rating?.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-white">Reytinq (Təsir)</span>
              </div>
              <i className="fas fa-info-circle text-slate-500"></i>
            </div>
            <div className="space-y-2">
              ${[
                { label: 'Zərbə (Shooting)', val: player.pos === 'GK' ? 10 : (stats.shots > 0 ? 70 + stats.goals * 10 : 30), color: 'bg-blue-500' },
                { label: 'Ötürmə (Passing)', val: stats.passAcc, color: 'bg-green-500' },
                { label: 'Driblinq (Dribbling)', val: player.pos === 'GK' ? 20 : (50 + stats.succDribbles * 10), color: 'bg-green-500' },
                { label: 'Müdafiə (Defending)', val: player.pos === 'GK' ? 90 : (40 + stats.tackles * 10), color: 'bg-orange-500' }
              ].map(b => html`
                <div key=${b.label} className="flex items-center text-xs">
                  <span className="w-32 text-slate-300 font-medium">${b.label}</span>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden flex justify-end">
                      ${b.val < 50 && html`<div className="h-full bg-orange-500/50 w-1/4"></div>`}
                    </div>
                    <div className="w-1 h-2 bg-slate-400 rounded-sm"></div>
                    <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className=${`h-full ${b.color}`} style=${{ width: \`\${Math.min(100, Math.max(0, (b.val - 50) * 2))}%\` }}></div>
                    </div>
                  </div>
                </div>
              `)}
            </div>
          </div>

          <!-- Statistics Header -->
          <div className="p-4 pb-0 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Statistika</h3>
            <div className="flex items-center gap-2">
              <i className="fas fa-bars text-slate-400"></i>
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-black">
                <i className="fas fa-border-all text-[10px]"></i>
              </div>
            </div>
          </div>

          <!-- Pills Nav -->
          <div className="px-4 py-3 flex gap-1 border-b border-white/5">
            ${[
              { id: 'shot', label: 'Shot' },
              { id: 'pass', label: 'Pass' },
              { id: 'drib', label: 'Drib' },
              { id: 'def', label: 'Def' }
            ].map(t => html`
              <button
                key=${t.id}
                onClick=${() => setActiveTab(t.id)}
                className=${`flex-1 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === t.id ? 'bg-white text-black' : 'bg-[#2a3042] text-slate-300 hover:bg-[#343b4f]'}`}
              >
                ${t.label}
              </button>
            `)}
          </div>

          <!-- PITCH VISUALIZATION -->
          <div className="p-4 bg-[#1b202d]">
            <div className="w-full aspect-[1.6] bg-[#426b48] rounded-md border-2 border-white/20 relative overflow-hidden shadow-inner">
              <!-- Field markings -->
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/30"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/30"></div>
              <!-- Penalty areas -->
              <div className="absolute top-[20%] bottom-[20%] left-0 w-[15%] border-y-2 border-r-2 border-white/30"></div>
              <div className="absolute top-[20%] bottom-[20%] right-0 w-[15%] border-y-2 border-l-2 border-white/30"></div>

              <!-- Fake dynamic dots based on tab -->
              ${activeTab === 'shot' && html`
                <!-- Shots -->
                <div className="absolute right-[15%] top-[40%] w-3 h-3 bg-white rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
                ${stats.shots > 1 && html`
                  <div className="absolute right-[25%] top-[60%] w-3 h-3 bg-white rounded-full border-2 border-black shadow-lg"></div>
                `}
              `}
              ${activeTab === 'pass' && html`
                <!-- Pass arrows -->
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#4ade80" />
                    </marker>
                    <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
                    </marker>
                  </defs>
                  <line x1="20%" y1="50%" x2="40%" y2="60%" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
                  <line x1="40%" y1="60%" x2="70%" y2="40%" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
                  <line x1="60%" y1="80%" x2="80%" y2="20%" stroke="#f87171" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
                  <line x1="50%" y1="30%" x2="70%" y2="30%" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
                </svg>
              `}
              ${activeTab === 'drib' && html`
                <!-- Dribble arrows (dashed) -->
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <marker id="arrow-white" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
                    </marker>
                  </defs>
                  <line x1="30%" y1="70%" x2="50%" y2="50%" stroke="white" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#arrow-white)" />
                  <line x1="60%" y1="20%" x2="80%" y2="30%" stroke="white" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#arrow-white)" />
                </svg>
              `}
              ${activeTab === 'def' && html`
                <!-- Def dots -->
                <div className="absolute left-[30%] top-[30%] w-2.5 h-2.5 bg-orange-500 rounded-full border border-black shadow"></div>
                <div className="absolute left-[45%] top-[60%] w-2.5 h-2.5 bg-pink-500 rounded-full border border-black shadow"></div>
                <div className="absolute left-[20%] top-[40%] w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black shadow"></div>
                <div className="absolute left-[25%] top-[70%] w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black shadow"></div>
              `}
            </div>
            
            <div className="flex justify-center mt-2 text-slate-500 gap-1 text-[10px]">
              <i className="fas fa-chevron-right"></i>
              <i className="fas fa-chevron-right"></i>
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>

          <!-- Stats List -->
          <div className="p-4 pt-2 space-y-4 bg-[#161a25]">
            ${activeTab === 'shot' && html`
              ${[
                { l: 'Qollar (Goals)', v: stats.goals },
                { l: 'Gözlənilən qol (xG)', v: stats.xG, i: true, c: 'text-blue-400' },
                { l: 'Cəmi zərbə (Total shots)', v: stats.shots },
                { l: 'Dəqiq zərbə (Shots on target)', v: stats.shotsOnTarget },
                { l: 'Bloklanmış zərbə', v: Math.max(0, stats.shots - stats.shotsOnTarget - stats.goals) }
              ].map(s => html`
                <div key=${s.l} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className=${s.c || 'text-slate-200'}>${s.l}</span>
                    ${s.i && html`<i className="fas fa-info-circle text-[10px] text-slate-500"></i>`}
                  </div>
                  <span className="font-bold text-white">${s.v}</span>
                </div>
              `)}
            `}
            ${activeTab === 'pass' && html`
              ${[
                { l: 'Asistlər (Assists)', v: stats.assists },
                { l: 'Gözlənilən asist (xA)', v: (stats.assists * 0.4 + 0.1).toFixed(2), i: true },
                { l: 'Açar ötürmə (Key passes)', v: stats.keyPasses, c: 'text-purple-400', i: true },
                { l: 'Dəqiq ötürmələr', v: `${stats.accPasses}/${stats.totalPasses} (${stats.passAcc}%)` },
                { l: 'Rəqib yarımsahədə', v: `${Math.floor(stats.accPasses * 0.6)}/${Math.floor(stats.totalPasses * 0.6)} (${Math.max(0, stats.passAcc - 5)}%)` }
              ].map(s => html`
                <div key=${s.l} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className=${s.c || 'text-slate-200'}>${s.l}</span>
                    ${s.i && html`<i className="fas fa-info-circle text-[10px] text-slate-500"></i>`}
                  </div>
                  <span className="font-bold text-white">${s.v}</span>
                </div>
              `)}
            `}
            ${activeTab === 'drib' && html`
              ${[
                { l: 'Toxunuşlar (Touches)', v: stats.touches },
                { l: 'Uğursuz toxunuş', v: Math.floor(stats.touches * 0.1) },
                { l: 'Driblinq (uğurlu)', v: `${stats.dribbles} (${stats.succDribbles})` },
                { l: 'Fola məruz qalıb', v: Math.floor(Math.random() * 3) },
                { l: 'Top itkisi (Possession lost)', v: stats.possLost }
              ].map(s => html`
                <div key=${s.l} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <span>${s.l}</span>
                  </div>
                  <span className="font-bold text-white">${s.v}</span>
                </div>
              `)}
            `}
            ${activeTab === 'def' && html`
              ${[
                { l: 'Müdafiə töhfəsi (Def. contributions)', v: stats.tackles + stats.interc },
                { l: 'Uğurlu Təkbətək (Tackles won)', v: `${stats.tackles} (${Math.floor(stats.tackles * 0.8)})` },
                { l: 'Kəsmələr (Interceptions)', v: stats.interc },
                { l: 'Uzaqlaşdırma (Clearances)', v: Math.floor(stats.interc * 0.5) },
                { l: 'Top Qazanma (Recoveries)', v: stats.recov }
              ].map(s => html`
                <div key=${s.l} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <span>${s.l}</span>
                  </div>
                  <span className="font-bold text-white">${s.v}</span>
                </div>
              `)}
            `}
          </div>

        </div>
      </div>
    </div>
  `;
}
