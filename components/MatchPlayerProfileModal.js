/**
 * ============================================================================
 * FAYL ADI: components/MatchPlayerProfileModal.js
 * MƏQSƏDİ: Oyunçuya kliklədikdə açılan və konkret 1 MATÇ üçün Sofascore tipli detallı statistikanı göstərən pəncərə.
 * ============================================================================
 */
import React, { useState, useMemo, useEffect } from 'react';
import htm from 'htm';
import { getSofascoreBadgeStyle } from '../services/database.js';

const html = htm.bind(React.createElement);

export default function MatchPlayerProfileModal({ player, match, onClose }) {
  const [activeTab, setActiveTab] = useState('pass'); // 'shot' | 'pass' | 'drib' | 'def'
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [animTrigger, setAnimTrigger] = useState(0);

  // Trigger animations on tab change
  useEffect(() => {
    setAnimTrigger(prev => prev + 1);
  }, [activeTab, showHeatmap]);

  // Generate realistic stats based on rating (so a 9.8 rating gets crazy stats like De Bruyne)
  const stats = useMemo(() => {
    if (!player) return null;
    const isGK = player.pos === 'GK';
    const r = player.rating || 7.0;
    const baseMult = Math.max(0, (r - 5.0) / 5.0); // 0.0 to ~1.0
    
    // Procedural generations
    const goals = player.goals || (r > 8.5 && !isGK ? Math.floor(Math.random() * 3) + 1 : 0);
    const xG = parseFloat((goals > 0 ? goals - 0.2 + (Math.random() * 0.4) : (r > 7.5 && !isGK ? Math.random() * 0.8 : 0)).toFixed(2));
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

    // Procedural Vectors based on player position for visualizer
    const basePx = player.x || 50;
    const basePy = player.y || 50;

    const generatePoints = (count, varianceX, varianceY, type) => {
      return Array.from({ length: count }).map((_, i) => {
        const px = Math.max(5, Math.min(95, basePx + (Math.random() * varianceX * 2 - varianceX)));
        const py = Math.max(5, Math.min(95, basePy + (Math.random() * varianceY * 2 - varianceY)));
        
        let tx = px, ty = py;
        let success = true;

        if (type === 'pass') {
           tx = Math.max(5, Math.min(95, px + (Math.random() * 40 - 15)));
           ty = Math.max(5, Math.min(95, py + (Math.random() * 40 - 20)));
           success = i < accPasses;
        } else if (type === 'shot') {
           tx = 95;
           ty = 50 + (Math.random() * 20 - 10);
           success = i < goals;
        } else if (type === 'drib') {
           tx = Math.max(5, Math.min(95, px + (Math.random() * 20 + 5)));
           ty = Math.max(5, Math.min(95, py + (Math.random() * 20 - 10)));
           success = i < succDribbles;
        }

        return { px, py, tx, ty, success };
      });
    };

    return {
      goals, xG, shots, shotsOnTarget,
      totalPasses, passAcc, accPasses, assists, keyPasses,
      touches, dribbles, succDribbles, possLost,
      tackles, interc, recov,
      visuals: {
        shots: generatePoints(shots, 25, 25, 'shot'),
        passes: generatePoints(Math.min(totalPasses, 20), 30, 30, 'pass'),
        dribbles: generatePoints(dribbles, 20, 20, 'drib'),
        defends: generatePoints(tackles + interc, 20, 20, 'def')
      }
    };
  }, [player]);

  if (!player || !match) return null;

  return html`
    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/70 backdrop-blur-md sm:p-4 transition-all">
      <div 
        className="w-full sm:w-[480px] max-h-[95vh] bg-[#161a25] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in border border-white/10"
      >
        <!-- Header -->
        <div className="bg-[#1e2333] p-4 flex items-center justify-between border-b border-white/5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-lg relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <i className="fas fa-user text-2xl text-slate-400 group-hover:scale-110 transition-transform"></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                ${player.name}
                ${player.goals > 0 && html`<i className="fas fa-futbol text-emerald-400 text-xs animate-bounce"></i>`}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className=${`text-xs font-black px-1.5 py-0.5 rounded shadow ${getSofascoreBadgeStyle(player.rating)}`}>
                  ${player.rating?.toFixed(1)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Sofascore Reytinqi</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 relative z-10">
            <button onClick=${() => setIsFavorite(!isFavorite)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95">
              <i className=${`${isFavorite ? 'fas text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'far'} fa-star text-lg`}></i>
            </button>
            <button onClick=${onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          
          <!-- Match Info -->
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-wide">${match.teamA} ${match.scoreA} - ${match.scoreB} ${match.teamB}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-bold bg-white/5 px-2 py-1 rounded-md border border-white/10">${match.date || 'Tarix yoxdur'}</span>
          </div>

          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between text-sm hover:bg-white/5 transition-colors cursor-default">
            <div className="flex items-center gap-2 text-slate-300">
              <i className="far fa-clock text-slate-500"></i> Meydanda olduğu dəqiqə
            </div>
            <span className="font-bold text-white bg-slate-800 px-2 rounded border border-slate-700 shadow-inner">35'</span>
          </div>

          <!-- Rating Breakdown (Impact) -->
          <div className="p-4 border-b border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className=${`text-xs font-black px-1.5 py-0.5 rounded shadow ${getSofascoreBadgeStyle(player.rating)}`}>
                  ${player.rating?.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-white">Reytinq (Təsir Barları)</span>
              </div>
              <i className="fas fa-info-circle text-slate-500 cursor-help hover:text-slate-300 transition-colors"></i>
            </div>
            <div className="space-y-2.5">
              ${[
                { label: 'Zərbə (Shooting)', val: player.pos === 'GK' ? 10 : (stats.shots > 0 ? 60 + stats.goals * 15 : 30), color: 'bg-blue-500' },
                { label: 'Ötürmə (Passing)', val: stats.passAcc, color: 'bg-green-500' },
                { label: 'Driblinq (Dribbling)', val: player.pos === 'GK' ? 20 : (40 + stats.succDribbles * 15), color: 'bg-green-500' },
                { label: 'Müdafiə (Defending)', val: player.pos === 'GK' ? 95 : (30 + stats.tackles * 15), color: 'bg-orange-500' }
              ].map((b, i) => html`
                <div key=${b.label} className="flex items-center text-xs group/bar">
                  <span className="w-32 text-slate-400 font-medium group-hover/bar:text-slate-200 transition-colors">${b.label}</span>
                  <div className="flex-1 flex items-center gap-1">
                    <!-- Negative impact (left side of center) -->
                    <div className="h-1.5 flex-1 bg-slate-800/80 rounded-full overflow-hidden flex justify-end">
                      ${b.val < 50 && html`
                        <div 
                          className="h-full bg-orange-500/80 transition-all duration-1000 ease-out" 
                          style=${{ width: ((50 - b.val) * 2) + '%', transformOrigin: 'right', transform: animTrigger ? 'scaleX(1)' : 'scaleX(0)' }}
                        ></div>
                      `}
                    </div>
                    <!-- Center pivot -->
                    <div className="w-1 h-2 bg-slate-500 rounded-sm"></div>
                    <!-- Positive impact (right side of center) -->
                    <div className="h-1.5 flex-1 bg-slate-800/80 rounded-full overflow-hidden">
                      ${b.val >= 50 && html`
                        <div 
                          className=${`h-full shadow-[0_0_8px_rgba(255,255,255,0.3)] ${b.color} transition-all duration-1000 ease-out`} 
                          style=${{ width: Math.min(100, (b.val - 50) * 2) + '%', transformOrigin: 'left', transform: animTrigger ? 'scaleX(1)' : 'scaleX(0)' }}
                        ></div>
                      `}
                    </div>
                  </div>
                </div>
              `)}
            </div>
          </div>

          <!-- Expandable Match Heatmap -->
          <div className="border-b border-white/5">
            <button 
              onClick=${() => setShowHeatmap(!showHeatmap)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors active:bg-white/10"
            >
              <div className="flex items-center gap-2 text-sm">
                <i className="fas fa-fire-flame-curved text-red-500"></i>
                <span className="font-bold text-white">İstilik Xəritəsi (Match Heatmap)</span>
              </div>
              <i className=${`fas fa-chevron-down text-slate-500 transition-transform duration-300 ${showHeatmap ? 'rotate-180' : ''}`}></i>
            </button>
            
            <div className=${`overflow-hidden transition-all duration-500 ease-in-out bg-[#1b202d] ${showHeatmap ? 'max-h-[300px] opacity-100 border-b border-white/10' : 'max-h-0 opacity-0'}`}>
               <div className="p-4">
                 <div className="w-full aspect-[1.6] bg-[#426b48] rounded-lg border-2 border-white/20 relative overflow-hidden shadow-inner">
                    <!-- Pitch lines -->
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/30"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/30"></div>
                    <div className="absolute top-[20%] bottom-[20%] left-0 w-[15%] border-y-2 border-r-2 border-white/30"></div>
                    <div className="absolute top-[20%] bottom-[20%] right-0 w-[15%] border-y-2 border-l-2 border-white/30"></div>
                    
                    <!-- Procedural Heatmap glow blobs -->
                    <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-red-500/60 blur-[20px] sm:blur-[30px] mix-blend-screen"
                         style=${{ left: (player.x - 10) + '%', top: (player.y - 10) + '%' }}></div>
                    <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-400/60 blur-[15px] sm:blur-[20px] mix-blend-screen"
                         style=${{ left: (player.x - 5) + '%', top: (player.y - 5) + '%' }}></div>
                 </div>
               </div>
            </div>
          </div>

          <!-- Statistics Header -->
          <div className="p-4 pb-0 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <i className="fas fa-chart-line text-blue-400"></i> Detallı Statistika
            </h3>
            <div className="flex items-center gap-2">
              <i className="fas fa-bars text-slate-400 hover:text-white cursor-pointer transition-colors"></i>
              <div className="w-6 h-6 bg-white/10 hover:bg-white/20 transition-colors rounded flex items-center justify-center text-white cursor-pointer shadow-sm">
                <i className="fas fa-border-all text-[10px]"></i>
              </div>
            </div>
          </div>

          <!-- Pills Nav -->
          <div className="px-4 py-3 flex gap-1.5 border-b border-white/5 relative z-10">
            ${[
              { id: 'shot', label: 'Zərbə (Shot)' },
              { id: 'pass', label: 'Ötürmə (Pass)' },
              { id: 'drib', label: 'Driblinq (Drib)' },
              { id: 'def', label: 'Müdafiə (Def)' }
            ].map(t => html`
              <button
                key=${t.id}
                onClick=${() => setActiveTab(t.id)}
                className=${`flex-1 py-1.5 rounded-full text-xs font-black transition-all duration-300 shadow-sm ${activeTab === t.id ? 'bg-white text-black scale-105 shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'bg-[#2a3042] text-slate-300 hover:bg-[#343b4f] hover:text-white'}`}
              >
                ${t.label}
              </button>
            `)}
          </div>

          <!-- PITCH VISUALIZATION -->
          <div className="p-4 bg-[#1b202d] relative">
            <div className="w-full aspect-[1.6] bg-[#3a5a40] rounded-lg border-2 border-white/20 relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <!-- Grass Stripes -->
              <div className="absolute inset-0 pointer-events-none opacity-20"
                   style=${{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0%, transparent 10%, #000 10%, #000 20%)' }}></div>
              
              <!-- Field markings -->
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-white/40 shadow-[0_0_4px_rgba(255,255,255,0.5)]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-[2px] border-white/40 shadow-[0_0_4px_rgba(255,255,255,0.5)]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.5)]"></div>
              
              <!-- Penalty areas -->
              <div className="absolute top-[20%] bottom-[20%] left-0 w-[15%] border-y-[2px] border-r-[2px] border-white/40 shadow-[0_0_4px_rgba(255,255,255,0.5)]"></div>
              <div className="absolute top-[20%] bottom-[20%] right-0 w-[15%] border-y-[2px] border-l-[2px] border-white/40 shadow-[0_0_4px_rgba(255,255,255,0.5)]"></div>

              <!-- DYNAMIC PROCEDURAL VECTORS -->
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" key=${animTrigger}>
                <defs>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#4ade80" />
                  </marker>
                  <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
                  </marker>
                  <marker id="arrow-white" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
                  </marker>
                </defs>

                ${activeTab === 'pass' && stats.visuals.passes.map((p, i) => html`
                  <line 
                    key=${i} x1=${p.px + '%'} y1=${p.py + '%'} x2=${p.tx + '%'} y2=${p.ty + '%'} 
                    stroke=${p.success ? '#4ade80' : '#f87171'} 
                    strokeWidth="1.5" 
                    markerEnd=${p.success ? 'url(#arrow-green)' : 'url(#arrow-red)'}
                    className="origin-left"
                    style=${{ animation: 'drawArrow 0.5s ease-out ' + (i * 0.05) + 's both' }}
                  />
                `)}
                
                ${activeTab === 'drib' && stats.visuals.dribbles.map((p, i) => html`
                  <line 
                    key=${i} x1=${p.px + '%'} y1=${p.py + '%'} x2=${p.tx + '%'} y2=${p.ty + '%'} 
                    stroke="white" strokeWidth="1.5" strokeDasharray="3 3"
                    markerEnd="url(#arrow-white)"
                    style=${{ animation: 'drawArrow 0.5s ease-out ' + (i * 0.05) + 's both' }}
                  />
                `)}
              </svg>

              <!-- SHOTS & DEFENSE (Dots) -->
              <div key=${animTrigger + '-dots'}>
                ${activeTab === 'shot' && stats.visuals.shots.map((p, i) => html`
                  <div 
                    key=${i} 
                    className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg -translate-x-1/2 -translate-y-1/2 z-20"
                    style=${{ left: p.px + '%', top: p.py + '%', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ' + (i * 0.1) + 's both' }}
                  >
                    <div className=${\`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full \${p.success ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}\`}></div>
                  </div>
                `)}
                
                ${activeTab === 'def' && stats.visuals.defends.map((p, i) => html`
                  <div 
                    key=${i} 
                    className=${\`absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-[1.5px] border-slate-900 shadow-md -translate-x-1/2 -translate-y-1/2 z-20 \${i % 2 === 0 ? 'bg-orange-500' : 'bg-pink-500'}\`}
                    style=${{ left: p.px + '%', top: p.py + '%', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ' + (i * 0.05) + 's both' }}
                  ></div>
                `)}
              </div>
            </div>
            
            <div className="flex justify-center mt-3 text-slate-500 gap-1 text-[10px] animate-pulse">
              <i className="fas fa-chevron-right"></i>
              <i className="fas fa-chevron-right"></i>
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>

          <!-- Stats List -->
          <div className="p-4 pt-1 space-y-1 bg-[#161a25] pb-8">
            ${activeTab === 'shot' && html`
              ${[
                { l: 'Qollar (Goals)', v: stats.goals },
                { l: 'Gözlənilən qol (xG)', v: stats.xG, i: true, c: 'text-blue-400' },
                { l: 'Cəmi zərbə (Total shots)', v: stats.shots },
                { l: 'Dəqiq zərbə (Shots on target)', v: stats.shotsOnTarget },
                { l: 'Bloklanmış zərbə', v: Math.max(0, stats.shots - stats.shotsOnTarget - stats.goals) }
              ].map((s, i) => html`
                <div key=${s.l} className="flex justify-between items-center text-sm py-2 border-b border-white/5 hover:bg-white/5 transition-colors px-2 rounded -mx-2">
                  <div className="flex items-center gap-1.5">
                    <span className=${s.c || 'text-slate-300 font-medium'}>${s.l}</span>
                    ${s.i && html`<i className="fas fa-info-circle text-[10px] text-slate-500 cursor-help"></i>`}
                  </div>
                  <span className="font-black text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 shadow-sm">${s.v}</span>
                </div>
              `)}
            `}
            ${activeTab === 'pass' && html`
              ${[
                { l: 'Asistlər (Assists)', v: stats.assists },
                { l: 'Gözlənilən asist (xA)', v: (stats.assists * 0.4 + 0.1).toFixed(2), i: true },
                { l: 'Açar ötürmə (Key passes)', v: stats.keyPasses, c: 'text-purple-400 font-bold', i: true },
                { l: 'Dəqiq ötürmələr', v: `${stats.accPasses}/${stats.totalPasses} (${stats.passAcc}%)` },
                { l: 'Rəqib yarımsahədə (acc.)', v: `${Math.floor(stats.accPasses * 0.6)}/${Math.floor(stats.totalPasses * 0.6)} (${Math.max(0, stats.passAcc - 5)}%)` }
              ].map(s => html`
                <div key=${s.l} className="flex justify-between items-center text-sm py-2 border-b border-white/5 hover:bg-white/5 transition-colors px-2 rounded -mx-2">
                  <div className="flex items-center gap-1.5">
                    <span className=${s.c || 'text-slate-300 font-medium'}>${s.l}</span>
                    ${s.i && html`<i className="fas fa-info-circle text-[10px] text-slate-500 cursor-help"></i>`}
                  </div>
                  <span className="font-black text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 shadow-sm">${s.v}</span>
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
                <div key=${s.l} className="flex justify-between items-center text-sm py-2 border-b border-white/5 hover:bg-white/5 transition-colors px-2 rounded -mx-2">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span>${s.l}</span>
                  </div>
                  <span className="font-black text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 shadow-sm">${s.v}</span>
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
                <div key=${s.l} className="flex justify-between items-center text-sm py-2 border-b border-white/5 hover:bg-white/5 transition-colors px-2 rounded -mx-2">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span>${s.l}</span>
                  </div>
                  <span className="font-black text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 shadow-sm">${s.v}</span>
                </div>
              `)}
            `}
          </div>

        </div>
      </div>
    </div>
  `;
}
