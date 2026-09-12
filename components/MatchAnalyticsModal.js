/**
 * ============================================================================
 * FAYL ADI: components/MatchAnalyticsModal.js
 * MƏQSƏDİ: Sofascore Standartlarında Tam Matç Analitikası Modalı
 * 
 * VƏZİFƏLƏRİ:
 *   1. Sol tərəf / İcmal: Komanda qarşılaşdırma barları (xG, Zərbələr, Seyvlər, Follar, Ötürmələr).
 *   2. 5v5 Stadion Taktiki Heyəti: Meydança üzərində hər komandadan 5+1 oyunçu və Sofascore reytinqləri.
 *   3. Meydança İstilik Xəritəsi (Heatmap): Komandaların hücum və əks-hücum təzyiq zonaları.
 *   4. Stadion Baxışından Zərbələr Xəritəsi (Pitch Shotmap): Qapıya doğru haradan zərbə vurulub.
 *   5. Qapının Önü POV-u (Goalmouth POV): Topun qapı çərçivəsində dəqiq hara getdiyi və qapı zonası.
 *   6. Zərbə Seçicisi (Shot Carousel Navigator): < Oyunçu Dəqiqə >, xG, xGOT, Nəticə, Vəziyyət, Zərbə növü.
 * ============================================================================
 */

import React, { useState } from 'react';
import htm from 'htm';
import { getMatchAnalytics } from '../services/matchAnalyticsData.js';
import { getSofascoreBadgeStyle } from '../services/database.js';

const html = htm.bind(React.createElement);

export default function MatchAnalyticsModal({ match, isOpen, onClose, allPlayers = [], lang = 'az' }) {
  if (!isOpen || !match) return null;

  const analytics = getMatchAnalytics(match, allPlayers);
  const [activeTab, setActiveTab] = useState('shotmap'); // 'shotmap' | 'lineup' | 'heatmap' | 'stats' | 'video'
  const [selectedShotIndex, setSelectedShotIndex] = useState(0);
  const [heatmapFilter, setHeatmapFilter] = useState('all'); // 'all' | 'teamA' | 'teamB'
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const shots = analytics?.shots || [];
  const currentShot = shots[selectedShotIndex] || shots[0] || null;
  const stats = analytics?.stats || {};

  const handlePrevShot = () => {
    if (shots.length === 0) return;
    setSelectedShotIndex((prev) => (prev > 0 ? prev - 1 : shots.length - 1));
  };

  const handleNextShot = () => {
    if (shots.length === 0) return;
    setSelectedShotIndex((prev) => (prev < shots.length - 1 ? prev + 1 : 0));
  };

  // Nəticə rəngi və etiketi
  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'goal':
        return { text: 'Qol', bg: 'bg-emerald-600 text-white', icon: 'fa-futbol' };
      case 'saved':
        return { text: 'Seyv', bg: 'bg-sky-600 text-white', icon: 'fa-hand-paper' };
      case 'blocked':
        return { text: 'Blok', bg: 'bg-slate-600 text-white', icon: 'fa-shield-alt' };
      default:
        return { text: 'Meydandan Kənar', bg: 'bg-rose-600 text-white', icon: 'fa-times' };
    }
  };

  return html`
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-purple-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-950 text-slate-100 rounded-3xl max-w-5xl w-full shadow-2xl border border-purple-800/60 overflow-hidden flex flex-col max-h-[92vh]">
        
        
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border-b border-purple-800/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center text-lg shadow-inner shrink-0">
              <i className="fas fa-chart-line"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Sofascore AI Match Center
                </span>
                <span className="text-[10px] text-purple-300 font-bold">
                  ${match.year} • ${match.stage || 'Matç'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span className="text-red-400">${match.teamA}</span>
                <span className="text-emerald-400 bg-purple-900/60 px-2.5 py-0.5 rounded-xl border border-purple-700/60 font-extrabold text-lg sm:text-xl">
                  ${match.scoreA} - ${match.scoreB}
                </span>
                <span className="text-sky-400">${match.teamB}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            ${match.videoUrl && html`
              <button
                onClick=${() => setActiveTab('video')}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-red-600/20"
              >
                <i className="fas fa-play text-[10px]"></i>
                <span>Video İcmal</span>
              </button>
            `}
            <button
              onClick=${onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Bağla"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>

        
        <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar">
          ${[
            { id: 'shotmap', label: 'Zərbələr & Qapı POV', icon: 'fa-bullseye' },
            { id: 'lineup', label: '5v5 Meydança Heyəti', icon: 'fa-users' },
            { id: 'heatmap', label: 'İstilik Xəritəsi (Heatmap)', icon: 'fa-fire-flame-curved' },
            { id: 'stats', label: 'Komanda Göstəriciləri', icon: 'fa-chart-bar' },
            ...(match.videoUrl ? [{ id: 'video', label: 'Video Arxiv', icon: 'fa-video' }] : [])
          ].map(tab => html`
            <button
              key=${tab.id}
              onClick=${() => setActiveTab(tab.id)}
              className=${`py-3 px-3 sm:px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className=${`fas ${tab.icon} text-[11px]`}></i>
              <span>${tab.label}</span>
            </button>
          `)}
        </div>

        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          
          ${activeTab === 'shotmap' && html`
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              
              <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-black uppercase text-red-400">${match.teamA}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Göstərici</span>
                  <span className="text-xs font-black uppercase text-sky-400">${match.teamB}</span>
                </div>

                
                <div className="space-y-3.5 text-xs">
                  ${[
                    { label: 'Expected Goals (xG)', a: stats.xgA || 0, b: stats.xgB || 0 },
                    { label: 'Expected On Target (xGOT)', a: stats.xgotA || 0, b: stats.xgotB || 0 },
                    { label: 'Ümumi Zərbələr', a: stats.totalShotsA || 0, b: stats.totalShotsB || 0 },
                    { label: 'Çərçivəyə Zərbələr', a: stats.shotsOnTargetA || 0, b: stats.shotsOnTargetB || 0 },
                    { label: 'Qapıçı Seyvləri', a: stats.gkSavesA || 0, b: stats.gkSavesB || 0 },
                    { label: 'Qət edilən məsafə', a: stats.distanceCoveredA || '92.9 km', b: stats.distanceCoveredB || '92.5 km', isString: true },
                    { label: 'Sprintlərin sayı', a: stats.sprintsA || 95, b: stats.sprintsB || 77 },
                    { label: 'Künc zərbələri', a: stats.cornersA || 5, b: stats.cornersB || 4 },
                    { label: 'Follar', a: stats.foulsA || 11, b: stats.foulsB || 5 }
                  ].map(item => {
                    const valA = item.isString ? parseFloat(item.a) : item.a;
                    const valB = item.isString ? parseFloat(item.b) : item.b;
                    const total = (valA + valB) || 1;
                    const pctA = Math.round((valA / total) * 100);
                    const pctB = 100 - pctA;
                    return html`
                      <div key=${item.label}>
                        <div className="flex justify-between items-center text-[11px] font-extrabold mb-1">
                          <span className="text-red-400">${item.a}</span>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">${item.label}</span>
                          <span className="text-sky-400">${item.b}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full flex overflow-hidden">
                          <div className="bg-red-500 h-full" style=${{ width: `${pctA}%` }}></div>
                          <div className="bg-sky-500 h-full" style=${{ width: `${pctB}%` }}></div>
                        </div>
                      </div>
                    `;
                  })}
                </div>
              </div>

              
              <div className="lg:col-span-8 space-y-6">
                
                
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 relative shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <i className="fas fa-map-pin text-emerald-400"></i> Stadion Zərbələr Xəritəsi (Meydança Baxışı)
                    </h4>
                    <span className="text-[10px] text-slate-400">Hər zərbənin haradan vurulduğu</span>
                  </div>

                  
                  <div className="w-full h-72 sm:h-80 bg-gradient-to-b from-[#103020] via-[#16452d] to-[#0d281a] rounded-2xl border-2 border-emerald-500/60 relative overflow-hidden shadow-inner flex flex-col justify-between">
                    
                    
                    <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
                      <div className="flex-1 bg-white/5"></div>
                      <div className="flex-1"></div>
                      <div className="flex-1 bg-white/5"></div>
                      <div className="flex-1"></div>
                      <div className="flex-1 bg-white/5"></div>
                      <div className="flex-1"></div>
                    </div>

                    
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-6 border-b-2 border-x-2 border-white/90 bg-white/10 z-10 flex items-center justify-center">
                      <span className="text-[8px] font-black uppercase text-white/70 tracking-widest">Qapı</span>
                    </div>

                    
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-14 border-b border-x border-white/50"></div>

                    
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-80 h-32 border-b border-x border-white/60"></div>

                    
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-xs"></div>

                    
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 w-24 h-12 border-b border-white/50 rounded-b-full"></div>

                    
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t border-white/50 rounded-t-full"></div>

                    
                    ${shots.map((shot, idx) => {
                      const isSelected = idx === selectedShotIndex;
                      const isGoal = shot.outcome === 'goal';
                      const isSaved = shot.outcome === 'saved';
                      const isBlocked = shot.outcome === 'blocked';

                      let dotClass = 'bg-rose-500 border-white text-white';
                      if (isGoal) dotClass = 'bg-emerald-500 border-white text-slate-950 font-black';
                      else if (isSaved) dotClass = 'bg-sky-500 border-white text-white';
                      else if (isBlocked) dotClass = 'bg-slate-400 border-white text-slate-900';

                      return html`
                        <div
                          key=${shot.id}
                          onClick=${() => setSelectedShotIndex(idx)}
                          style=${{ left: `${shot.pitchX}%`, top: `${shot.pitchY}%` }}
                          className=${`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform z-20 ${
                            isSelected ? 'scale-150 z-30 ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-950 animate-bounce' : 'hover:scale-125'
                          }`}
                          title=${`${shot.player} (${shot.minute}') - ${shot.outcome.toUpperCase()} (xG: ${shot.xg})`}
                        >
                          <div className=${`w-5 h-5 rounded-full flex items-center justify-center border-2 text-[8px] shadow-lg ${dotClass}`}>
                            ${isGoal ? '⚽' : (idx + 1)}
                          </div>
                        </div>
                      `;
                    })}

                    
                    <div className="absolute bottom-2 left-3 flex items-center gap-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[9px] font-bold text-slate-300">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Qol</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Seyv</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Blok</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Kənar</span>
                    </div>
                  </div>
                </div>

                
                ${currentShot && html`
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
                    
                    
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <button
                        onClick=${handlePrevShot}
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer"
                        title="Əvvəlki Zərbə"
                      >
                        <i className="fas fa-chevron-left text-xs"></i>
                      </button>

                      <div className="flex items-center gap-2 text-center">
                        <div className="w-7 h-7 rounded-full bg-purple-900 text-white font-black text-xs flex items-center justify-center border border-purple-600">
                          ${currentShot.number || '⚽'}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                            <span>${currentShot.player}</span>
                            <span className="text-[10px] text-slate-400 font-bold">(${currentShot.team})</span>
                          </h4>
                          <span className="text-[10px] text-emerald-400 font-bold">Dəqiqə: ${currentShot.minute}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold">
                          ${selectedShotIndex + 1} / ${shots.length}
                        </span>
                        <button
                          onClick=${handleNextShot}
                          className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer"
                          title="Növbəti Zərbə"
                        >
                          <i className="fas fa-chevron-right text-xs"></i>
                        </button>
                      </div>
                    </div>

                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      
                      
                      <div className="md:col-span-6 bg-[#0c1322] border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
                        <div className="text-[10px] font-black uppercase text-purple-300 tracking-wider mb-2 flex items-center gap-1">
                          <i className="fas fa-eye text-emerald-400"></i> Qapının Önü POV-u (Goal Zone)
                        </div>

                        
                        <div className="w-64 h-36 border-4 border-slate-200 rounded-t-lg relative bg-radial from-slate-900 to-black shadow-2xl overflow-visible">
                          
                          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-25 pointer-events-none">
                            ${Array.from({ length: 24 }).map((_, i) => html`
                              <div key=${i} className="border border-white/20"></div>
                            `)}
                          </div>

                          
                          <div className="absolute -bottom-2 -left-3 -right-3 h-3 bg-emerald-700 rounded-full opacity-60"></div>

                          
                          <div
                            style=${{
                              left: `${Math.max(5, Math.min(95, currentShot.goalX))}%`,
                              top: `${Math.max(5, Math.min(90, currentShot.goalY))}%`
                            }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-30"
                          >
                            <div className=${`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-2xl border-2 border-white animate-pulse ${
                              currentShot.outcome === 'goal'
                                ? 'bg-emerald-500 shadow-emerald-500/80'
                                : currentShot.outcome === 'saved'
                                ? 'bg-sky-500 shadow-sky-500/80'
                                : 'bg-rose-500 shadow-rose-500/80'
                            }`}>
                              ${currentShot.outcome === 'goal' ? '⚽' : currentShot.outcome === 'saved' ? '🧤' : '❌'}
                            </div>
                          </div>

                          
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            <line 
                              x1="50%" 
                              y1="100%" 
                              x2=${`${Math.max(5, Math.min(95, currentShot.goalX))}%`} 
                              y2=${`${Math.max(5, Math.min(90, currentShot.goalY))}%`} 
                              stroke=${currentShot.outcome === 'goal' ? '#10b981' : '#38bdf8'} 
                              strokeWidth="2" 
                              strokeDasharray="4 2" 
                            />
                          </svg>
                        </div>

                        <div className="text-[11px] font-black mt-2.5 text-center text-slate-300 flex items-center gap-2">
                          <span className="text-slate-400">Hədəf Zonası:</span>
                          <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            ${currentShot.goalZone}
                          </span>
                        </div>
                      </div>

                      
                      <div className="md:col-span-6 grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">xG (Gözlənilən Qol)</span>
                          <span className="text-base font-black text-amber-400">${currentShot.xg}</span>
                        </div>

                        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">xGOT (Dəqiqlik)</span>
                          <span className="text-base font-black text-emerald-400">${currentShot.xgot || '—'}</span>
                        </div>

                        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Nəticə</span>
                          <span className=${`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md mt-0.5 ${getOutcomeBadge(currentShot.outcome).bg}`}>
                            <i className=${`fas ${getOutcomeBadge(currentShot.outcome).icon} text-[9px]`}></i>
                            ${getOutcomeBadge(currentShot.outcome).text}
                          </span>
                        </div>

                        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Vəziyyət</span>
                          <span className="text-xs font-black text-slate-200">${currentShot.situation}</span>
                        </div>

                        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Zərbə Növü</span>
                          <span className="text-xs font-black text-slate-200">${currentShot.shotType}</span>
                        </div>

                        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Epizod Təsviri</span>
                          <span className="text-[10px] font-bold text-slate-300 truncate block" title=${currentShot.desc}>
                            ${currentShot.desc}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                `}

              </div>
            </div>
          `}

          
          ${activeTab === 'lineup' && html`
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <i className="fas fa-users text-emerald-400"></i> Minifutbol Taktiki Düzülüşü (5+1 Formatı)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Meydança üzərində hər iki komandanın 5 oyunçusu və qapıçısı, fərdi Sofascore reytinqləri ilə</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="flex items-center gap-1 text-red-400">● ${match.teamA}</span>
                  <span className="text-slate-500">vs</span>
                  <span className="flex items-center gap-1 text-sky-400">● ${match.teamB}</span>
                </div>
              </div>

              
              <div className="w-full h-96 sm:h-[440px] bg-gradient-to-r from-[#0d2a1b] via-[#143e27] to-[#0d2a1b] rounded-3xl border-2 border-emerald-500/60 relative overflow-hidden shadow-2xl p-4">
                
                
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-white/40"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border-2 border-white/40"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-xs"></div>

                
                <div className="absolute left-0 top-1/4 bottom-1/4 w-24 sm:w-32 border-r-2 border-y-2 border-white/50 bg-white/5"></div>
                
                <div className="absolute right-0 top-1/4 bottom-1/4 w-24 sm:w-32 border-l-2 border-y-2 border-white/50 bg-white/5"></div>

                
                ${analytics.lineupA.map(p => html`
                  <div
                    key=${p.id}
                    onClick=${() => setSelectedPlayer(p)}
                    style=${{ left: `${p.x}%`, top: `${p.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group transition-transform hover:scale-125 z-20"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-red-600 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-white shadow-xl group-hover:ring-2 group-hover:ring-emerald-400">
                        ${p.number}
                      </div>
                      
                      <span className=${`absolute -bottom-1 -right-1 text-[9px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.2 rounded-md shadow-md ${getSofascoreBadgeStyle(p.rating)}`}>
                        ${p.rating}
                      </span>
                      ${p.redCard && html`<span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded shadow" title="Qırmızı Vərəqə 17'">🟥</span>`}
                    </div>
                    <span className="text-[10px] sm:text-xs font-extrabold text-white mt-1 drop-shadow-md text-center max-w-[90px] truncate">
                      ${p.name}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-red-200 opacity-80">${p.pos}</span>
                  </div>
                `)}

                
                ${analytics.lineupB.map(p => html`
                  <div
                    key=${p.id}
                    onClick=${() => setSelectedPlayer(p)}
                    style=${{ left: `${p.x}%`, top: `${p.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group transition-transform hover:scale-125 z-20"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-sky-600 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-white shadow-xl group-hover:ring-2 group-hover:ring-emerald-400">
                        ${p.number}
                      </div>
                      
                      <span className=${`absolute -bottom-1 -right-1 text-[9px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.2 rounded-md shadow-md ${getSofascoreBadgeStyle(p.rating)}`}>
                        ${p.rating}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-extrabold text-white mt-1 drop-shadow-md text-center max-w-[90px] truncate">
                      ${p.name}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-sky-200 opacity-80">${p.pos}</span>
                  </div>
                `)}
              </div>

              
              ${selectedPlayer && html`
                <div className="bg-slate-900 border border-purple-700/60 rounded-2xl p-4 flex items-center justify-between gap-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-900 text-white font-black text-base flex items-center justify-center border border-purple-500">
                      ${selectedPlayer.number}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <span>${selectedPlayer.name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">${selectedPlayer.pos}</span>
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold">
                        ${selectedPlayer.goals ? `⚽ ${selectedPlayer.goals} Qol ` : ''}
                        ${selectedPlayer.assists ? `👟 ${selectedPlayer.assists} Ötürmə ` : ''}
                        ${selectedPlayer.saves ? `🧤 ${selectedPlayer.saves} Qapıçı Seyvi ` : ''}
                        ${selectedPlayer.redCard ? `🟥 Qırmızı Vərəqə (${selectedPlayer.redCard})` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">Sofascore Reytinqi:</span>
                    <span className=${`text-sm font-black px-3 py-1 rounded-xl shadow-lg ${getSofascoreBadgeStyle(selectedPlayer.rating)}`}>
                      ${selectedPlayer.rating}
                    </span>
                  </div>
                </div>
              `}
            </div>
          `}

          
          ${activeTab === 'heatmap' && html`
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <i className="fas fa-fire-flame-curved text-red-500"></i> Meydança İstilik Xəritəsi (Pitch Heatmap)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Komandaların təzyiq, hücum sıxlığı və əks-hücum zonaları</p>
                </div>

                
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick=${() => setHeatmapFilter('all')}
                    className=${`px-3 py-1 text-xs font-black rounded-lg transition ${
                      heatmapFilter === 'all' ? 'bg-purple-900 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ümumi
                  </button>
                  <button
                    onClick=${() => setHeatmapFilter('teamA')}
                    className=${`px-3 py-1 text-xs font-black rounded-lg transition ${
                      heatmapFilter === 'teamA' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ${match.teamA} Təzyiqi
                  </button>
                  <button
                    onClick=${() => setHeatmapFilter('teamB')}
                    className=${`px-3 py-1 text-xs font-black rounded-lg transition ${
                      heatmapFilter === 'teamB' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ${match.teamB} Əks-hücum
                  </button>
                </div>
              </div>

              
              <div className="w-full h-80 sm:h-96 bg-[#0e2c1d] rounded-3xl border-2 border-emerald-500/60 relative overflow-hidden shadow-2xl flex items-center justify-center">
                
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-white/40"></div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/40"></div>
                
                <div className="absolute left-0 top-1/4 bottom-1/4 w-24 sm:w-32 border-r-2 border-y-2 border-white/50"></div>
                <div className="absolute right-0 top-1/4 bottom-1/4 w-24 sm:w-32 border-l-2 border-y-2 border-white/50"></div>

                
                ${(heatmapFilter === 'all' || heatmapFilter === 'teamA') && html`
                  <div>
                    
                    <div className="absolute right-14 top-1/3 w-36 h-36 rounded-full bg-red-600/50 blur-2xl pointer-events-none animate-pulse"></div>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-amber-400/60 blur-xl pointer-events-none"></div>
                    
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-32 rounded-full bg-red-500/40 blur-2xl pointer-events-none"></div>
                    <div className="absolute right-28 top-1/4 w-28 h-28 rounded-full bg-rose-500/40 blur-xl pointer-events-none"></div>
                  </div>
                `}

                
                ${(heatmapFilter === 'all' || heatmapFilter === 'teamB') && html`
                  <div>
                    
                    <div className="absolute left-20 top-1/4 w-32 h-32 rounded-full bg-cyan-400/40 blur-2xl pointer-events-none"></div>
                    <div className="absolute left-10 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-blue-600/50 blur-xl pointer-events-none"></div>
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-28 rounded-full bg-sky-400/50 blur-lg pointer-events-none"></div>
                  </div>
                `}

                <div className="absolute bottom-3 right-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-slate-300">
                  TDV BTL Minifutbol Meydançası (40m × 20m)
                </div>
              </div>
            </div>
          `}

          
          ${activeTab === 'stats' && html`
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="font-black text-sm text-red-400">${match.teamA}</span>
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-300">
                  Rəsmi Matç Müqayisəsi (Sofascore)
                </h4>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-sky-400">${match.teamB}</span>
                  <div className="w-4 h-4 rounded-full bg-sky-500"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                ${[
                  { label: 'Expected Goals (xG)', a: stats.xgA || 0, b: stats.xgB || 0 },
                  { label: 'Expected On Target (xGOT)', a: stats.xgotA || 0, b: stats.xgotB || 0 },
                  { label: 'Ümumi Zərbələr', a: stats.totalShotsA || 0, b: stats.totalShotsB || 0 },
                  { label: 'Qapıya Dəqiq Zərbələr', a: stats.shotsOnTargetA || 0, b: stats.shotsOnTargetB || 0 },
                  { label: 'Qapıçı Qurtarışları (Seyv)', a: stats.gkSavesA || 0, b: stats.gkSavesB || 0 },
                  { label: 'Real Qol Epizodları (Big Chances)', a: stats.bigChancesA || 0, b: stats.bigChancesB || 0 },
                  { label: 'Topa Sahib Olma (%)', a: `${stats.possessionA || 50}%`, b: `${stats.possessionB || 50}%`, isPct: true },
                  { label: 'Qət edilən məsafə', a: stats.distanceCoveredA || '92.9 km', b: stats.distanceCoveredB || '92.5 km', isString: true },
                  { label: 'Dəqiq Ötürmələr', a: stats.passesA || 320, b: stats.passesB || 290 },
                  { label: 'Top Alma Uğuru (Tackles)', a: stats.tacklesA || 14, b: stats.tacklesB || 12 },
                  { label: 'Künc Zərbələri', a: stats.cornersA || 5, b: stats.cornersB || 4 },
                  { label: 'Qayda Pozuntuları (Follar)', a: stats.foulsA || 11, b: stats.foulsB || 5 }
                ].map(item => {
                  const valA = item.isString ? parseFloat(item.a) : (item.isPct ? parseInt(item.a) : item.a);
                  const valB = item.isString ? parseFloat(item.b) : (item.isPct ? parseInt(item.b) : item.b);
                  const total = (valA + valB) || 1;
                  const pctA = Math.round((valA / total) * 100);
                  const pctB = 100 - pctA;
                  return html`
                    <div key=${item.label} className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/40">
                      <div className="flex justify-between items-center text-xs font-black mb-1.5">
                        <span className="text-red-400 text-sm">${item.a}</span>
                        <span className="text-slate-300 font-bold uppercase text-[10px] tracking-wide">${item.label}</span>
                        <span className="text-sky-400 text-sm">${item.b}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                        <div className="bg-red-500 h-full transition-all" style=${{ width: `${pctA}%` }}></div>
                        <div className="bg-sky-500 h-full transition-all" style=${{ width: `${pctB}%` }}></div>
                      </div>
                    </div>
                  `;
                })}
              </div>
            </div>
          `}

          
          ${activeTab === 'video' && match.videoUrl && html`
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-purple-800/60 shadow-2xl bg-black">
                <iframe
                  src=${match.videoUrl.replace('watch?v=', 'embed/')}
                  title="Matç Video Yayımı"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-black uppercase text-purple-300 tracking-wider mb-2 flex items-center gap-1.5">
                  <i className="fas fa-clock text-emerald-400"></i> Video Zaman Nişanələri (Qollar və Hadisələr)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  ${[
                    { min: '03:35', desc: '⚽ 10A Qol (Murad, 1-0)', color: 'text-emerald-400' },
                    { min: '04:40', desc: '⚽ 11H Qol (Şahbazlı, 1-1)', color: 'text-sky-400' },
                    { min: '05:15', desc: '⚽ 10A Qol (Fərid, 2-1)', color: 'text-emerald-400' },
                    { min: '06:05', desc: '⚽ 11H Qol (Əhmədzadə, 2-2)', color: 'text-sky-400' },
                    { min: '07:00', desc: '⚽ 11H Penalti (Şahbazlı, 2-3)', color: 'text-sky-400' },
                    { min: '08:20', desc: '⚽ 10A Qol (Murad, 3-3)', color: 'text-emerald-400' },
                    { min: '09:45', desc: '⚽ 10A Qol (Fərid, 4-3)', color: 'text-emerald-400' },
                    { min: '10:30', desc: '⚽ 11H Qol (Əhmədzadə, 4-4)', color: 'text-sky-400' },
                    { min: '11:00', desc: '⚽ 10A Qol (Murad Het-trik, 5-4)', color: 'text-emerald-400' },
                    { min: '17:19', desc: '🟥 10A Qırmızı Vərəqə (Fərid)', color: 'text-rose-400' }
                  ].map(e => html`
                    <div key=${e.min} className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60 flex items-center justify-between">
                      <span className="font-extrabold text-[10px] text-slate-300">${e.desc}</span>
                      <span className="font-mono text-[10px] font-black text-amber-400 ml-1">${e.min}</span>
                    </div>
                  `)}
                </div>
              </div>
            </div>
          `}

        </div>

        
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-bold hidden sm:block">
            TDV Bakı Türk Liseyi • Rəsmi Minifutbol AI İdman Analitikası
          </div>
          <button
            onClick=${onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-black text-xs transition shadow-lg"
          >
            Bağla
          </button>
        </div>

      </div>
    </div>
  `;
}
