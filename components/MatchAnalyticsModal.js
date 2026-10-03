import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { getMatchAnalytics, loadAnalyticsData, YOUTUBE_CONFIG } from '../services/matchAnalyticsData.js?v=20260912_0120';
import { getSofascoreBadgeStyle } from '../services/database.js?v=20260912_0120';
import { TeamBadge } from './ui.js';

const html = htm.bind(React.createElement);

const getGoalMinutesArray = (count, teamPrefix, playerName) => {
  if (count <= 0) return [];
  const hash = (teamPrefix + playerName).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const mins = [];
  let current = (hash % 14) + 2;
  for(let i=0; i<count; i++) {
    mins.push(current);
    current += ((hash % 10) + 7);
    if (current > 35) current = 35 - (hash % 3);
  }
  return mins.sort((a,b) => a-b);
};

const generateGoalMinutes = (count, teamPrefix, playerName) => {
  if (count <= 0) return '';
  const mins = getGoalMinutesArray(count, teamPrefix, playerName);
  return `(${mins.map(m => m + "'").join(', ')})`;
};

const getAllGoalEvents = (analytics, match) => {
  const events = [];
  if (!analytics) return events;
  (analytics.lineupA || []).forEach(p => {
    if (p.goals > 0) {
      getGoalMinutesArray(p.goals, match.teamA, p.name).forEach(m => events.push({ min: m, team: 'A', type: 'goal' }));
    }
  });
  (analytics.lineupB || []).forEach(p => {
    if (p.goals > 0) {
      getGoalMinutesArray(p.goals, match.teamB, p.name).forEach(m => events.push({ min: m, team: 'B', type: 'goal' }));
    }
  });
  return events;
};

const getDenseMomentum = (sparse, analytics, match) => {
  if (!sparse || sparse.length < 2) return [];
  const dense = [];
  const STEPS = 105; 
  const goalEvents = getAllGoalEvents(analytics, match);
  
  for (let i = 1; i <= STEPS; i++) {
    let min = i / 3;
    let prev = sparse.filter(s => s.min <= min).pop() || sparse[0];
    let next = sparse.find(s => s.min > min) || sparse[sparse.length - 1];
    let ratio = (next.min === prev.min) ? 0.5 : (min - prev.min) / (next.min - prev.min);
    let noise = (Math.sin(i * 0.4) * 10) + (Math.cos(i * 0.15) * 15);
    
    let vA = prev.valA + (next.valA - prev.valA) * ratio + noise;
    let vB = prev.valB + (next.valB - prev.valB) * ratio - noise;
    
    let eventObj = null;
    let matchingEvent = goalEvents.find(e => e.min === Math.ceil(min));
    if (matchingEvent && i % 3 === 1) { 
      eventObj = matchingEvent;
    }

    dense.push({ 
      step: i, 
      min: min, 
      valA: Math.max(5, Math.min(95, vA)), 
      valB: Math.max(5, Math.min(95, vB)),
      event: eventObj
    });
  }
  return dense;
};


export default function MatchAnalyticsModal({ match, isOpen, onClose, allPlayers = [], lang = 'az' }) {
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData().then(() => setDataVersion(v => v + 1));
    }
  }, [isOpen, match]);

  const analytics = useMemo(() => (match ? getMatchAnalytics(match, allPlayers) : null), [match, allPlayers, dataVersion]);
  const [activeTab, setActiveTabState] = useState('lineup');
  
  const handleTabChange = (tabId) => {
    if (!document.startViewTransition) {
      setActiveTabState(tabId);
      return;
    }
    document.startViewTransition(() => setActiveTabState(tabId));
  }; // 'lineup' | 'momentum' | 'commentary' | 'stats' | 'shotmap' | 'heatmap' | 'video' | 'info'
  const [selectedShotIndex, setSelectedShotIndex] = useState(0);
  const [shotFilter, setShotFilter] = useState('all');
  const [heatmapFilter, setHeatmapFilter] = useState('all');
  const [selectedHeatmapPlayer, setSelectedHeatmapPlayer] = useState('Murad Abdullayev');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSubstitutions, setShowSubstitutions] = useState(true);
  const [showAvgPositions, setShowAvgPositions] = useState(true);
  const [commentaryFilter, setCommentaryFilter] = useState('all');

  const allShots = analytics?.shots || [];
  const filteredShots = useMemo(() => {
    if (!match) return [];
    if (shotFilter === 'goal') return allShots.filter(s => s.outcome === 'goal');
    if (shotFilter === 'saved') return allShots.filter(s => s.outcome === 'saved');
    if (shotFilter === 'teamA') return allShots.filter(s => s.team === match.teamA);
    if (shotFilter === 'teamB') return allShots.filter(s => s.team === match.teamB);
    return allShots;
  }, [allShots, shotFilter, match]);

  useEffect(() => {
    if (!isOpen || !match) return;

    const matchHash = `#match/${match.id || 'current'}`;
    if (window.location.hash !== matchHash) {
      window.history.pushState({ matchView: true, matchId: match.id }, '', matchHash);
    }

    const handlePopState = () => onClose();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (window.location.hash.startsWith('#match/')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
  }, [isOpen, match?.id]);

  if (!isOpen || !match) return null;

  const stats = analytics?.stats || {};
  const commentaryList = analytics?.commentary || [];
  const momentumData = analytics?.momentum || [];
  const teamRatings = analytics?.teamRatings || { teamA: 8.0, teamB: 7.2 };

  const filteredCommentary = commentaryFilter === 'key' 
    ? commentaryList.filter(c => c.isKey) 
    : commentaryList;

  const handleBack = () => {
    if (window.location.hash.startsWith('#match/')) {
      window.history.back();
    } else {
      onClose();
    }
  };

  const mvpPlayer = analytics?.lineupA?.find(p => p.isMvp) || analytics?.lineupB?.find(p => p.isMvp) || analytics?.lineupA?.[4] || analytics?.lineupA?.[0];

  return html`
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col justify-end sm:justify-center p-0 sm:p-4 overflow-hidden animate-fadeIn">
      
      <!--  MAIN CONTAINER (SOFASCORE MATCH CENTER)  -->
      <div className="w-full max-w-6xl mx-auto h-[100dvh] sm:h-[92vh] bg-[#090A0F]/90 backdrop-blur-2xl text-slate-100 rounded-none sm:rounded-3xl border-0 sm:border sm:border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden">
        
        <!--  SOFASCORE TOP MATCH HEADER  -->
        <header className="bg-[#121722] border-b border-slate-800 p-4 sm:p-5 relative shrink-0">
          
          <div className="flex items-center justify-between gap-4 mb-4 text-xs font-bold text-slate-400">
            <div className="flex items-center gap-2">
              <button
                onClick=${handleBack}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-[1px].5 cursor-pointer"
              >
                <i className="fas fa-arrow-left text-xs"></i>
                <span className="hidden sm:inline">Geri</span>
              </button>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span className="text-emerald-400 font-extrabold flex items-center gap-[1px]">
                  <i className="fas fa-trophy text-amber-400"></i> TDV BTL Liqa
                </span>
                <span>•</span>
                <span>${match.divisionLabel || '5v5 Minifutbol'}</span>
                <span>•</span>
                <span className="hidden md:inline">${analytics?.stadium || 'TDV Arena'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href=${YOUTUBE_CONFIG.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 font-black text-xs transition flex items-center gap-[1px].5 shadow-sm"
              >
                <i className="fab fa-youtube text-red-500 text-sm"></i>
                <span className="hidden sm:inline">TDV TV</span>
              </a>

              <button
                onClick=${() => setIsFavorite(!isFavorite)}
                className=${`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-[1px].5 border cursor-pointer ${
                  isFavorite 
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-300' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <i className=${`fa-star ${isFavorite ? 'fa-solid text-amber-400' : 'fa-regular'}`}></i>
                <span className="hidden sm:inline">${isFavorite ? 'Sevimli' : 'Sevimlilərə Əlavə Et'}</span>
              </button>

              <button
                onClick=${onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <i className="fas fa-times text-base"></i>
              </button>
            </div>
          </div>

          <!--  Main Scoreboard Display  -->
          <div className="flex items-center justify-between max-w-3xl mx-auto py-2 px-2">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end">
              <span className="text-base sm:text-2xl font-black text-white text-right tracking-tight">${match.teamA}</span>
              <${TeamBadge} teamName=${match.teamA} className="w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl" />
            </div>

            <div className="flex flex-col items-center justify-center px-4 sm:px-8">
              <div className="text-3xl sm:text-5xl font-black tracking-tight text-white font-mono flex items-center gap-3">
                <span>${match.scoreA}</span>
                <span className="text-slate-600 text-2xl sm:text-4xl">-</span>
                <span>${match.scoreB}</span>
              </div>
              <div className="mt-1 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-[1px].5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>BİTDİ (FT 32')</span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <${TeamBadge} teamName=${match.teamB} className="w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl" />
              <span className="text-base sm:text-2xl font-black text-white text-left tracking-tight">${match.teamB}</span>
            </div>
          </div>

          <!--  Goal Scorers Bar  -->
          <div className="mt-3 pt-3 border-t border-slate-800/60 max-w-3xl mx-auto flex justify-between gap-4 text-[11px] text-slate-300 font-medium">
            <div className="flex-1 text-right space-y-0.5">
              ${analytics?.lineupA?.filter(p => p.goals).map(p => html`
                <div key=${p.id} className="flex items-center justify-end gap-[1px].5">
                  <span className="text-slate-400 text-[10px] font-mono">
                    ${p.goals > 1 ? p.goals + "x" : ""} Qol ${generateGoalMinutes(p.goals, match.teamA, p.name)}
                  </span>
                  <span className="font-bold text-white">${p.name}</span>
                </div>
              `)}
            </div>

            <div className="w-px bg-slate-800"></div>

            <div className="flex-1 text-left space-y-0.5">
              ${analytics?.lineupB?.filter(p => p.goals).map(p => html`
                <div key=${p.id} className="flex items-center justify-start gap-[1px].5">
                  <span className="font-bold text-white">${p.name}</span>
                  <span className="text-slate-400 text-[10px] font-mono">
                    Qol ${generateGoalMinutes(p.goals, match.teamB, p.name)}
                  </span>
                </div>
              `)}
            </div>
          </div>
        </header>

        <!--  SOFASCORE SUB-NAVIGATION TABS  -->
        <nav className="bg-[#121722] border-b border-slate-800 px-4 flex items-center gap-[1px] overflow-x-auto no-scrollbar shrink-0">
          ${[
            { id: 'lineup', label: 'Tərkiblər', icon: 'fa-users' },
            { id: 'momentum', label: 'Momentum', icon: 'fa-chart-line' },
            { id: 'commentary', label: 'Canlı Şərh', icon: 'fa-list-ul', badge: commentaryList.length },
            { id: 'stats', label: 'Statistika', icon: 'fa-chart-bar' },
              { id: 'shotmap', label: 'Zərbə Xəritəsi (2D)', icon: 'fa-crosshairs' },
              { id: 'pov', label: '3D Qapı POV', icon: 'fa-bullseye', badge: 'PRO' },
              { id: 'heatmap', label: 'İstilik Xəritəsi', icon: 'fa-fire-flame-curved' },
            { id: 'video', label: 'Video & YouTube', icon: 'fa-play' },
            { id: 'info', label: 'Matç Haqqında', icon: 'fa-info-circle' }
          ].map(tab => html`
            <button
              key=${tab.id}
              onClick=${() => handleTabChange(tab.id)}
              className=${`px-4 py-3 text-xs font-extrabold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id ? 'border-purple-500 text-purple-400 bg-purple-500/10 shadow-[inset_0_-2px_10px_rgba(168,85,247,0.2)]' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className=${`fas ${tab.icon}`}></i>
              <span>${tab.label}</span>
              ${tab.badge ? html`<span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[9px] font-black text-slate-300">${tab.badge}</span>` : null}
            </button>
          `)}
        </nav>

        <!--  MAIN CONTENT BODY  -->
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar">

          <!--  TAB 1: LINEUPS & TACTICAL PITCH VIEW  -->
          ${activeTab === 'lineup' && html`
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent/90 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black">
                      1-2-1 Romb (5v5 Standard)
                    </span>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-red-400 font-black">${match.teamA} (Reytinq: ${teamRatings.teamA})</span>
                      <span className="text-slate-500">vs</span>
                      <span className="text-sky-400 font-black">${match.teamB} (Reytinq: ${teamRatings.teamB})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked=${showAvgPositions}
                      onChange=${(e) => setShowAvgPositions(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                    />
                    <span>Orta Mövqelər (Average Positions)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked=${showSubstitutions}
                      onChange=${(e) => setShowSubstitutions(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                    />
                    <span>Əvəzetmələri Göstər</span>
                  </label>
                </div>
              </div>

              <!--  Tactical Pitch  -->
              <div className="w-full h-[420px] sm:h-[480px] bg-gradient-to-r from-[#0a2316] via-[#123823] to-[#0a2316] rounded-3xl border-2 border-emerald-500/60 relative overflow-hidden shadow-2xl p-4">
                
                <div className="absolute inset-0 opacity-15 pointer-events-none" style=${{
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 40px, transparent 40px, transparent 80px)'
                }}></div>

                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-white/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-xs"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-28 sm:w-36 h-48 sm:h-56 border-r-2 border-y-2 border-white/50 rounded-r-full bg-white/5 pointer-events-none"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 sm:w-36 h-48 sm:h-56 border-l-2 border-y-2 border-white/50 rounded-l-full bg-white/5 pointer-events-none"></div>

                <!--  Team A Lineup  -->
                ${analytics?.lineupA?.map(p => html`
                  <div
                    key=${p.id}
                    onClick=${() => setSelectedPlayer(p)}
                    style=${{ left: `${p.x}%`, top: `${p.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-20"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-white shadow-xl group-hover:scale-110 transition-transform">
                        ${p.number}
                      </div>
                      <span className=${`absolute -bottom-1 -right-1 text-[9px] sm:text-[10px] font-black px-1.5 py-0.3 rounded-md shadow-md ${getSofascoreBadgeStyle(p.rating)}`}>
                        ${p.rating}
                      </span>
                    </div>

                    ${showAvgPositions && p.avgVector ? html`
                      <div className="absolute top-full mt-1 w-6 h-0.5 bg-red-400 opacity-70 flex items-center justify-end">
                        <span className="w-1 h-1 border-t-2 border-r-2 border-red-400 rotate-45"></span>
                      </div>
                    ` : null}

                    <span className="text-[10px] sm:text-xs font-extrabold text-white mt-1 drop-shadow-md text-center max-w-[90px] truncate">
                      ${p.name}
                    </span>
                  </div>
                `)}

                <!--  Team B Lineup  -->
                ${analytics?.lineupB?.map(p => html`
                  <div
                    key=${p.id}
                    onClick=${() => setSelectedPlayer(p)}
                    style=${{ left: `${p.x}%`, top: `${p.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-20"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sky-600 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-white shadow-xl group-hover:scale-110 transition-transform">
                        ${p.number}
                      </div>
                      <span className=${`absolute -bottom-1 -right-1 text-[9px] sm:text-[10px] font-black px-1.5 py-0.3 rounded-md shadow-md ${getSofascoreBadgeStyle(p.rating)}`}>
                        ${p.rating}
                      </span>
                    </div>

                    ${showAvgPositions && p.avgVector ? html`
                      <div className="absolute top-full mt-1 w-6 h-0.5 bg-sky-400 opacity-70 flex items-center justify-end">
                        <span className="w-1 h-1 border-t-2 border-r-2 border-sky-400 rotate-45"></span>
                      </div>
                    ` : null}

                    <span className="text-[10px] sm:text-xs font-extrabold text-white mt-1 drop-shadow-md text-center max-w-[90px] truncate">
                      ${p.name}
                    </span>
                  </div>
                `)}
              </div>

              <!--  Substitutions & Managers  -->
              ${showSubstitutions ? html`
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-transparent/90 border border-slate-800 rounded-2xl p-4">
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider mb-3 flex items-center gap-2">
                      <i className="fas fa-user-tie"></i> Məşqçilər (Coaches)
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                        <span className="text-[10px] font-bold text-slate-400 block">${match.teamA} Baş Məşqçisi</span>
                        <span className="font-black text-white text-sm mt-0.5 block">${analytics?.coaches?.teamA || 'Akis Mantzios'}</span>
                      </div>
                      <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                        <span className="text-[10px] font-bold text-slate-400 block">${match.teamB} Baş Məşqçisi</span>
                        <span className="font-black text-white text-sm mt-0.5 block">${analytics?.coaches?.teamB || 'Yeqhishe Melikyan'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-transparent/90 border border-slate-800 rounded-2xl p-4">
                    <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider mb-3 flex items-center gap-2">
                      <i className="fas fa-exchange-alt"></i> Əvəzetmələr (Substitutions)
                    </h4>
                    <div className="space-y-2 text-xs">
                      ${analytics?.benchA?.map(b => html`
                        <div key=${b.id} className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
                          <div className="flex items-center gap-2">
                            <span className="text-red-400 font-bold">${match.teamA}</span>
                            <span className="text-slate-300">${b.subMin}</span>
                            <span className="text-emerald-400 font-bold">🟢 In: ${b.name}</span>
                          </div>
                          <span className=${`text-xs font-black px-2 py-0.5 rounded ${getSofascoreBadgeStyle(b.rating)}`}>${b.rating}</span>
                        </div>
                      `)}
                      ${analytics?.benchB?.map(b => html`
                        <div key=${b.id} className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
                          <div className="flex items-center gap-2">
                            <span className="text-sky-400 font-bold">${match.teamB}</span>
                            <span className="text-slate-300">${b.subMin}</span>
                            <span className="text-emerald-400 font-bold">🟢 In: ${b.name}</span>
                          </div>
                          <span className=${`text-xs font-black px-2 py-0.5 rounded ${getSofascoreBadgeStyle(b.rating)}`}>${b.rating}</span>
                        </div>
                      `)}
                    </div>
                  </div>
                </div>
              ` : null}
            </div>
          `}

          <!--  TAB 2: MATCH MOMENTUM GRAPH  -->
          ${activeTab === 'momentum' && html`
            <div className="bg-transparent/90 border border-slate-800 rounded-2xl p-5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <i className="fas fa-chart-line text-emerald-400"></i> Matç Momentum (Match Momentum)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Komandaların 35 dəqiqə ərzində hücum təzyiqinin real-vaxt qrafiki</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-[1px].5 text-red-400"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> ${match.teamA}</span>
                  <span className="flex items-center gap-[1px].5 text-sky-400"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> ${match.teamB}</span>
                </div>
              </div>

              <div className="w-full h-56 bg-slate-950 rounded-xl p-4 border border-slate-800 relative flex flex-col justify-between">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 z-0"></div>

                <div className="flex items-center justify-between h-full relative z-10 gap-[1px]">
                  ${getDenseMomentum(momentumData, analytics, match).map((m) => html`
                    <div key=${m.step} className="flex-1 flex flex-col items-center h-full justify-center group relative">
                      <div className="w-full bg-transparent flex items-end justify-center h-1/2">
                        <div
                          style=${{ height: `${m.valA}%` }}
                          className="w-full bg-red-500/80 rounded-t group-hover:bg-red-400 transition-all"
                        ></div>
                      </div>

                      <div className="w-full bg-transparent flex items-start justify-center h-1/2">
                        <div
                          style=${{ height: `${m.valB}%` }}
                          className="w-full bg-sky-500/80 rounded-b group-hover:bg-sky-400 transition-all"
                        ></div>
                      </div>

                      ${m.event ? html`
    <div className="absolute top-1/2 -translate-y-1/2 z-20 ${m.event.team === 'A' ? 'bg-red-500' : 'bg-sky-500'} w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.8)] border border-white/50"></div>
  ` : null}
                    </div>
                  `)}
                </div>
              </div>
            </div>
          `}

          <!--  TAB 3: COMMENTARY TIMELINE  -->
          ${activeTab === 'commentary' && html`
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-transparent border border-slate-800 p-1.5 rounded-xl w-max">
                <button
                  onClick=${() => setCommentaryFilter('all')}
                  className=${`px-4 py-1.5 text-xs font-bold rounded-lg transition ${commentaryFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Bütün Hadisələr (${commentaryList.length})
                </button>
                <button
                  onClick=${() => setCommentaryFilter('key')}
                  className=${`px-4 py-1.5 text-xs font-bold rounded-lg transition ${commentaryFilter === 'key' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Vacib Anlar (Key Events)
                </button>
              </div>

              <div className="space-y-3">
                ${filteredCommentary.map((c, idx) => html`
                  <div key=${idx} className="bg-transparent/90 border border-slate-800 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-700 transition">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 font-mono font-black text-sm flex items-center justify-center shrink-0 border border-slate-700">
                      ${c.min}'
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className=${`text-xs font-black px-2 py-0.5 rounded ${c.team === match.teamA ? 'bg-red-900/40 text-red-400 border border-red-800' : 'bg-sky-900/40 text-sky-400 border border-sky-800'}`}>
                          ${c.team}
                        </span>
                        ${c.player ? html`<span className="text-xs font-bold text-white">${c.player}</span>` : null}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">${c.desc}</p>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          `}

          <!--  TAB 4: STATISTICS  -->
          ${activeTab === 'stats' && html`
            <div className="bg-transparent/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-black text-sm text-red-400">${match.teamA}</span>
                <span className="text-xs font-black uppercase text-slate-400">Rəsmi Statistika</span>
                <span className="font-black text-sm text-sky-400">${match.teamB}</span>
              </div>

              <div className="flex flex-col space-y-4">
                  ${[
                    { label: 'Expected Goals (xG)', a: stats.xgA || 0, b: stats.xgB || 0 },
                    { label: 'Ümumi Zərbələr', a: stats.totalShotsA || 0, b: stats.totalShotsB || 0 },
                    { label: 'Qapıya Dəqiq Zərbələr', a: stats.shotsOnTargetA || 0, b: stats.shotsOnTargetB || 0 },
                    { label: 'Topa Sahib Olma', a: stats.possessionA || 50, b: stats.possessionB || 50, isPct: true },
                    { label: 'Ötürmələr', a: stats.passesA || 215, b: stats.passesB || 168 },
                    { label: 'Künc Zərbələri', a: stats.cornersA || 5, b: stats.cornersB || 4 }
                  ].map(item => {
                    const valA = item.isPct ? parseInt(item.a) : item.a;
                    const valB = item.isPct ? parseInt(item.b) : item.b;
                    const total = (valA + valB) || 1;
                    const pctA = item.isPct ? valA : Math.round((valA / total) * 100);
                    const pctB = item.isPct ? valB : 100 - pctA;
                    
                    return html`
                      <div key=${item.label} className="bg-transparent/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group hover:border-slate-700 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between z-10">
                          <span className="font-black text-lg text-red-400 w-12 text-center">${item.isPct ? item.a + '%' : item.a}</span>
                          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 drop-shadow-sm">${item.label}</span>
                          <span className="font-black text-lg text-sky-400 w-12 text-center">${item.isPct ? item.b + '%' : item.b}</span>
                        </div>
                        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-800/80 gap-[2px] mx-1">
                          <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-l-full transition-all duration-1000 shadow-[0_0_10px_rgba(225,29,72,0.5)]" style=${{ width: `${pctA}%` }}></div>
                          <div className="h-full bg-gradient-to-l from-sky-600 to-blue-400 rounded-r-full transition-all duration-1000 shadow-[0_0_10px_rgba(14,165,233,0.5)]" style=${{ width: `${pctB}%` }}></div>
                        </div>
                      </div>
                    `;
                  })}
                </div>
            </div>
          `}

          
            <!--  TAB: SHOTMAP (PROMAX FEATURE)  -->
            ${activeTab === 'shotmap' && html`
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
                      <span className="font-black text-sm text-red-400 drop-shadow-sm">${match.teamA}</span>
                      <span className="text-xs font-bold text-slate-400">${stats.totalShotsA || 8} Zərbə</span>
                    </div>
                    <!-- Half Pitch Visual -->
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-t from-[#0a2316] to-[#123823] rounded-t-3xl border-2 border-emerald-500/40 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                      <!-- Pitch Lines -->
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/30 rounded-t-lg"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white/30 rounded-t-sm"></div>
                      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50"></div>
                      <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-white/20"></div>
                      
                      <!-- Procedural Shot Dots based on stats -->
                      ${Array.from({ length: stats.totalShotsA || 8 }).map((_, i) => {
                        const isGoal = i < (parseInt(match.scoreA) || 0);
                        const isTarget = !isGoal && i < (stats.shotsOnTargetA || 3);
                        const typeClass = isGoal ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)] scale-125 z-20' : (isTarget ? 'bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)] z-10' : 'bg-rose-500/80 shadow-sm z-0');
                        // Generate random plausible coordinates for attacking half
                        const left = 20 + (Math.sin(i * 1.5) * 35) + 35; // 20 to 80%
                        const bottom = isGoal ? 5 + (i * 4) : 10 + (Math.cos(i * 2) * 20) + 20; // Closer if goal
                        
                        return html`
                          <div 
                            key=${i} 
                            className=\$\{\`absolute w-3.5 h-3.5 rounded-full border border-white/80 transition-all hover:scale-150 cursor-crosshair \${typeClass}\`\}
                            style=${{ left: `${left}%`, bottom: `${bottom}%` }}
                            title=${isGoal ? 'Qol!' : (isTarget ? 'Dəqiq Zərbə (Seyv)' : 'Qeyri-dəqiq zərbə')}
                          ></div>
                        `;
                      })}
                    </div>
                  </div>

                  <!-- Team B Pitch -->
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-bold text-slate-400">${stats.totalShotsB || 7} Zərbə</span>
                      <span className="font-black text-sm text-sky-400 drop-shadow-sm">${match.teamB}</span>
                    </div>
                    <!-- Half Pitch Visual -->
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-t from-[#0a2316] to-[#123823] rounded-t-3xl border-2 border-emerald-500/40 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                      <!-- Pitch Lines -->
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/30 rounded-t-lg"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white/30 rounded-t-sm"></div>
                      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50"></div>
                      <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-white/20"></div>
                      
                      <!-- Procedural Shot Dots -->
                      ${Array.from({ length: stats.totalShotsB || 7 }).map((_, i) => {
                        const isGoal = i < (parseInt(match.scoreB) || 0);
                        const isTarget = !isGoal && i < (stats.shotsOnTargetB || 4);
                        const typeClass = isGoal ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)] scale-125 z-20' : (isTarget ? 'bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)] z-10' : 'bg-rose-500/80 shadow-sm z-0');
                        // Generate random plausible coordinates for attacking half
                        const left = 20 + (Math.cos(i * 1.5) * 35) + 35; // 20 to 80%
                        const bottom = isGoal ? 5 + (i * 3) : 10 + (Math.sin(i * 3) * 20) + 20; // Closer if goal
                        
                        return html`
                          <div 
                            key=${i} 
                            className=\$\{\`absolute w-3.5 h-3.5 rounded-full border border-white/80 transition-all hover:scale-150 cursor-crosshair \${typeClass}\`\}
                            style=${{ left: `${left}%`, bottom: `${bottom}%` }}
                            title=${isGoal ? 'Qol!' : (isTarget ? 'Dəqiq Zərbə (Seyv)' : 'Qeyri-dəqiq zərbə')}
                          ></div>
                        `;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            `}

                        <!-- ================================================================= -->
            <!-- TAB 1: ZƏRBƏLƏR & BİRLƏŞDİRİLMİŞ 3D QAPI POV STADİONU -->
          <!-- ================================================================= -->
          ${activeTab === 'pov' && html`
            <div className="space-y-4 sm:space-y-5">
              
              <!-- STADION BAŞLIĞI VƏ SÜRƏTLİ FİLTRLƏR -->
              <div className="bg-slate-900/90 border border-slate-800 rounded-[20px] p-2 p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <i className="fas fa-bullseye text-emerald-400"></i> Sofascore Stadion Zərbələri & Qapı POV
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Meydançadan vurulan zərbə və birbaşa qapı xəttindəki 3D Qapı Önü (POV) trayektoriyası
                  </p>
                </div>

                <!-- Filter Pills -->
                <div className="flex items-center gap-1.5 flex-wrap">
                  ${[
                    { id: 'all', label: `Hamısı (${allShots.length})`, color: 'bg-purple-900 text-white' },
                    { id: 'goal', label: `⚽ Qollar (${goalCount})`, color: 'bg-emerald-600 text-white' },
                    { id: 'saved', label: `🧤 Seyvlər (${saveCount})`, color: 'bg-sky-600 text-white' },
                    { id: 'teamA', label: `🔴 ${match.teamA} (${shotsACount})`, color: 'bg-red-700 text-white' },
                    { id: 'teamB', label: `🔵 ${match.teamB} (${shotsBCount})`, color: 'bg-sky-700 text-white' }
                  ].map(f => html`
                    <button
                      key=${f.id}
                      onClick=${() => { setShotFilter(f.id); setSelectedShotIndex(0); }}
                      className=${`px-2.5 py-1 rounded-[8px] text-[11px] font-black transition cursor-pointer ${
                        shotFilter === f.id
                          ? `${f.color} shadow-md ring-2 ring-emerald-400/50`
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ${f.label}
                    </button>
                  `)}
                </div>
              </div>

              <!-- ============================================================= -->
              <!-- VAHİD STADİON VƏ BİRLƏŞDİRİLMİŞ 3D QAPI POV-U -->
              <!-- ============================================================= -->
              <div className="bg-slate-950 border-2 border-emerald-600/60 rounded-3xl overflow-hidden shadow-sm border border-zinc-200 dark:border-white/10 relative">
                
                <!-- Stadium Header Bar -->
                <div className="bg-slate-900/90 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>TDV BTL Minifutbol Stadionu</span>
                  </span>
                  <span className="text-emerald-400 font-extrabold truncate max-w-[160px] sm:max-w-none">
                    ${currentShot ? `${currentShot.player} (${currentShot.minute}')` : ''}
                  </span>
                </div>

                <!-- PITCH & INTEGRATED 3D GOAL CONTAINER (Touch pan-y safe) -->
                <div 
                  className="relative w-full h-[460px] sm:h-[520px] bg-[#0c2918] overflow-hidden select-none"
                  style=${{ touchAction: 'pan-y' }}
                >
                  
                  <!-- Ot zolaqları (Realistic Grass Stripes) -->
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style=${{
                      backgroundImage: 'repeating-linear-gradient(180deg, #103b22 0px, #103b22 36px, #0b2e1b 36px, #0b2e1b 72px)'
                    }}
                  ></div>

                  <!-- Stadium Spotlight Ambient Glow -->
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-44 bg-emerald-400/15 blur-3xl pointer-events-none"></div>

                  <!-- ========================================================= -->
                  <!-- 3D QAPININ ÖNÜ POV-U (STADİONUN QAPI XƏTTİ ÜZƏRİNDƏ) -->
                  <!-- ========================================================= -->
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 w-[260px] sm:w-[340px]">
                    
                    <!-- Qapı Etiketi -->
                    <div className="text-center mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-sm inline-flex items-center gap-1">
                        <i className="fas fa-eye text-[8px]"></i> Qapının Önü POV (Goalmouth Zone)
                      </span>
                    </div>

                    <!-- 3D Goalmouth Box Frame -->
                    <div className="relative w-full h-24 sm:h-28 rounded-t-lg bg-gradient-to-b from-black/85 via-slate-950/95 to-emerald-950/70 border-t-4 border-x-4 border-slate-100 shadow-sm border border-zinc-200 dark:border-white/10 overflow-visible">
                      
                      <!-- 3D Metallic Crossbar (Üst Tir) -->
                      <div className="absolute -top-1.5 -left-1.5 -right-1.5 h-3 bg-gradient-to-r from-slate-300 via-white to-slate-300 rounded shadow-md border-b border-slate-400 flex items-center justify-center">
                        <span className="text-[8px] font-black text-slate-800 tracking-widest uppercase opacity-60">Crossbar</span>
                      </div>

                      <!-- 3D Left & Right Posts (Yan Dirəklər) -->
                      <div className="absolute -top-1.5 -left-1.5 w-3 bottom-0 bg-gradient-to-b from-white via-slate-200 to-slate-400 shadow-lg"></div>
                      <div className="absolute -top-1.5 -right-1.5 w-3 bottom-0 bg-gradient-to-b from-white via-slate-200 to-slate-400 shadow-lg"></div>

                      <!-- 3D Perspective Net Grid (Torun Dərinliyi) -->
                      <div 
                        className="absolute inset-0 opacity-25 pointer-events-none"
                        style=${{
                          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
                          backgroundSize: '16px 14px'
                        }}
                      ></div>

                      <!-- Goal Zones Indicators (90-lar, künclər) -->
                      <div className="absolute top-1 left-1.5 text-[8px] text-emerald-400/70 font-mono font-bold">Sol 90</div>
                      <div className="absolute top-1 right-1.5 text-[8px] text-emerald-400/70 font-mono font-bold">Sağ 90</div>
                      <div className="absolute bottom-1 left-1.5 text-[8px] text-slate-400/70 font-mono font-bold">Aşağı Sol</div>
                      <div className="absolute bottom-1 right-1.5 text-[8px] text-slate-400/70 font-mono font-bold">Aşağı Sağ</div>

                      <!-- Goalkeeper Silhouette / Reach -->
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-12 opacity-25 pointer-events-none flex flex-col items-center justify-end">
                        <div className="w-4 h-4 rounded-full bg-sky-400 mb-0.5"></div>
                        <div className="w-10 h-7 bg-sky-400 rounded-t-xl"></div>
                      </div>

                      <!-- CURRENT SHOT TARGET MARKER IN 3D GOAL (Topun Dəqiq Getdiyi Nöqtə) -->
                      ${currentShot && html`
                        <div
                          style=${{
                            left: `${Math.max(4, Math.min(96, currentShot.goalX))}%`,
                            top: `${Math.max(6, Math.min(92, currentShot.goalY))}%`
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 z-30 pointer-events-none"
                        >
                          <!-- Ping Glow -->
                          <span className=${`absolute -inset-2 rounded-full animate-ping opacity-75 ${
                            currentShot.outcome === 'goal' ? 'bg-emerald-400' : currentShot.outcome === 'saved' ? 'bg-sky-400' : 'bg-rose-400'
                          }`}></span>

                          <!-- Main Ball Marker -->
                          <div className=${`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm shadow-sm border border-zinc-200 dark:border-white/10 border-2 border-white relative font-black ${
                            currentShot.outcome === 'goal'
                              ? 'bg-emerald-500 text-slate-950 shadow-emerald-400/90'
                              : currentShot.outcome === 'saved'
                              ? 'bg-sky-500 text-white shadow-sky-400/90'
                              : 'bg-rose-500 text-white shadow-rose-400/90'
                          }`}>
                            ${currentShot.outcome === 'goal' ? '⚽' : currentShot.outcome === 'saved' ? '🧤' : '❌'}
                          </div>

                          <!-- Target Goal Zone Label -->
                          <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 border border-emerald-500/60 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg">
                            ${currentShot.goalZone}
                          </div>
                        </div>
                      `}
                    </div>

                    <!-- Goal Line (Qapı Xətti - otun üzərində davam edir) -->
                    <div className="w-full h-1 bg-white/90 shadow-md"></div>
                  </div>

                  <!-- ========================================================= -->
                  <!-- PITCH MARKINGS (Cərimə Meydançası, Qapı Meydançası, Nöqtələr) -->
                  <!-- ========================================================= -->
                  
                  <!-- 6-yard Goal Area (Qapı Meydançası) -->
                  <div className="absolute top-32 sm:top-36 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-12 border-b-2 border-x-2 border-white/60 bg-white/5 pointer-events-none"></div>

                  <!-- 18-yard Penalty Area (Cərimə Meydançası) -->
                  <div className="absolute top-32 sm:top-36 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-36 border-b-2 border-x-2 border-white/70 bg-white/5 pointer-events-none"></div>

                  <!-- Penalty Spot (Penalti Nöqtəsi) -->
                  <div className="absolute top-60 sm:top-64 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md pointer-events-none"></div>

                  <!-- Penalty Arc (Cərimə Meydançası Qövsü) -->
                  <div className="absolute top-68 sm:top-72 left-1/2 -translate-x-1/2 w-28 h-12 border-b-2 border-white/60 rounded-b-full pointer-events-none"></div>

                  <!-- Midfield Line (Orta Xətt) -->
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/70 pointer-events-none"></div>
                  
                  <!-- Center Circle Arc (Mərkəz Dairəsi Qövsü) -->
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-18 border-t-2 border-white/60 rounded-t-full pointer-events-none"></div>

                  <!-- ========================================================= -->
                  <!-- SVG DYNAMIC LASER TRAJECTORY (Meydançadan Qapıya Lazer Şüası) -->
                  <!-- ========================================================= -->
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <defs>
                      <linearGradient id="laserBeamGoal" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="laserBeamSaved" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="laserBeamMissed" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#fb7185" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>

                    ${currentShot && html`
                      <g>
                        <!-- Trajectory Beam Shadow / Glow -->
                        <line
                          x1=${`${currentShot.pitchX}%`}
                          y1=${`${currentShot.pitchY}%`}
                          x2="50%"
                          y2="20%"
                          stroke=${currentShot.outcome === 'goal' ? '#10b981' : currentShot.outcome === 'saved' ? '#38bdf8' : '#f43f5e'}
                          strokeWidth="6"
                          strokeOpacity="0.25"
                        />
                        <!-- Main Laser Beam -->
                        <line
                          x1=${`${currentShot.pitchX}%`}
                          y1=${`${currentShot.pitchY}%`}
                          x2="50%"
                          y2="20%"
                          stroke=${`url(#${currentShot.outcome === 'goal' ? 'laserBeamGoal' : currentShot.outcome === 'saved' ? 'laserBeamSaved' : 'laserBeamMissed'})`}
                          strokeWidth="3"
                          strokeDasharray="6 3"
                        />
                        <!-- Strike Origin Ping Circle -->
                        <circle
                          cx=${`${currentShot.pitchX}%`}
                          cy=${`${currentShot.pitchY}%`}
                          r="10"
                          fill="none"
                          stroke=${currentShot.outcome === 'goal' ? '#10b981' : '#38bdf8'}
                          strokeWidth="2"
                          opacity="0.8"
                        />
                      </g>
                    `}
                  </svg>

                  <!-- ========================================================= -->
                  <!-- ALL SHOTS PLOTTED ON PITCH (Meydançadakı Bütün Zərbələr) -->
                  <!-- ========================================================= -->
                  ${filteredShots.map((shot, idx) => {
                    const isSelected = currentShot?.id === shot.id;
                    const isGoal = shot.outcome === 'goal';
                    const isSaved = shot.outcome === 'saved';
                    const isBlocked = shot.outcome === 'blocked';

                    let dotBg = 'bg-rose-500 border-white text-white';
                    if (isGoal) dotBg = 'bg-emerald-500 border-white text-slate-950 font-black';
                    else if (isSaved) dotBg = 'bg-sky-500 border-white text-white';
                    else if (isBlocked) dotBg = 'bg-slate-400 border-white text-slate-900';

                    return html`
                      <div
                        key=${shot.id}
                        onClick=${() => setSelectedShotIndex(idx)}
                        style=${{ left: `${shot.pitchX}%`, top: `${shot.pitchY}%` }}
                        className=${`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-20 ${
                          isSelected 
                            ? 'scale-150 z-30 ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-950 animate-bounce' 
                            : 'hover:scale-130 opacity-85 hover:opacity-100'
                        }`}
                        title=${`${shot.player} (${shot.minute}') - ${shot.outcome.toUpperCase()} (xG: ${shot.xg})`}
                      >
                        <div className=${`w-6 h-6 rounded-full flex items-center justify-center border-2 text-[9px] shadow-xl ${dotBg}`}>
                          ${isGoal ? '⚽' : (idx + 1)}
                        </div>
                      </div>
                    `;
                  })}

                  <!-- Bottom Legend Badge -->
                  <div className="absolute bottom-2 left-3 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-[8px] text-[10px] font-bold text-slate-300 border border-slate-800">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Qol</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Seyv</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Blok</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Kənar</span>
                  </div>

                </div>
              </div>

              <!-- ============================================================= -->
              <!-- SOFASCORE SHOT NAVIGATOR & EPISODE BREAKDOWN CARD -->
              <!-- ============================================================= -->
              ${currentShot && html`
                <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm border border-zinc-200 dark:border-white/10 space-y-4">
                  
                  <!-- Navigator Header: < Player Name Minute > -->
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <button
                      onClick=${handlePrevShot}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[20px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition font-black text-xs cursor-pointer active:scale-95 min-h-[44px]"
                      title="Əvvəlki Zərbə"
                    >
                      <i className="fas fa-chevron-left text-sm"></i>
                      <span className="hidden sm:inline">Əvvəlki</span>
                    </button>

                    <div className="flex items-center gap-2.5 sm:gap-3 text-center">
                      <div className=${`w-10 h-10 rounded-[20px] p-2 flex items-center justify-center text-sm font-black border-2 shadow-lg ${
                        currentShot.team === match.teamA ? 'bg-red-600/30 border-red-500 text-red-300' : 'bg-sky-600/30 border-sky-500 text-sky-300'
                      }`}>
                        ${currentShot.number || '⚽'}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 justify-center">
                          <span className="truncate max-w-[140px] sm:max-w-none">${currentShot.player}</span>
                          <span className=${`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            currentShot.team === match.teamA ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-sky-950 text-sky-400 border border-sky-800'
                          }`}>
                            ${currentShot.team}
                          </span>
                        </h4>
                        <div className="text-[11px] text-emerald-400 font-extrabold flex items-center justify-center gap-1.5 mt-0.5">
                          <i className="far fa-clock text-[10px]"></i>
                          <span>Dəqiqə: ${currentShot.minute}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 font-mono font-bold">${selectedShotIndex + 1} / ${filteredShots.length}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick=${handleNextShot}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[20px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition font-black text-xs cursor-pointer active:scale-95 min-h-[44px]"
                      title="Növbəti Zərbə"
                    >
                      <span className="hidden sm:inline">Növbəti</span>
                      <i className="fas fa-chevron-right text-sm"></i>
                    </button>
                  </div>

                  <!-- Deep Shot Metrics Grid -->
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                    
                    <div className="bg-slate-800/60 p-3 rounded-[20px] p-2 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">xG (Gözlənilən Qol)</span>
                      <span className="text-lg font-black text-amber-400 font-mono">${currentShot.xg}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-[20px] p-2 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">xGOT (Dəqiqlik)</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">${currentShot.xgot || '0.00'}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-[20px] p-2 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Zərbə Nəticəsi</span>
                      <span className=${`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md mt-0.5 ${getOutcomeBadge(currentShot.outcome).bg}`}>
                        <i className=${`fas ${getOutcomeBadge(currentShot.outcome).icon} text-[9px]`}></i>
                        ${getOutcomeBadge(currentShot.outcome).text}
                      </span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-[20px] p-2 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Qol Zonası</span>
                      <span className="text-xs font-black text-emerald-300 truncate block mt-0.5">${currentShot.goalZone}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-[20px] p-2 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Zərbə Növü</span>
                      <span className="text-xs font-black text-slate-200 block mt-0.5">${currentShot.shotType}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-[20px] p-2 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Oyun Vəziyyəti</span>
                      <span className="text-xs font-black text-slate-200 block mt-0.5">${currentShot.situation}</span>
                    </div>

                    <div className="col-span-2 bg-slate-800/60 p-3 rounded-[20px] p-2 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Epizod Təsviri</span>
                      <span className="text-xs font-semibold text-slate-300 block mt-0.5" title=${currentShot.desc}>
                        ${currentShot.desc}
                      </span>
                    </div>

                  </div>

                </div>
              `}

            </div>
          `}

          <!-- ================================================================= -->

            <!-- ================================================================= -->
            <!-- TAB 3: İSTİLİK XƏRİTƏSİ (HEATMAP) -->
          <!-- ================================================================= -->
          ${activeTab === 'heatmap' && html`
            <div className="space-y-5">
              <!-- Top Header & Heatmap Filters -->
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    Termal Sensor • 40m × 20m 5v5 Arena
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <i className="fas fa-fire-flame-curved text-red-500"></i> Meydança İstilik Xəritəsi & Taktiki Zonalar
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Komandaların təzyiq sıxlığı, cinah hücumları və fərdi oyunçu hərəkət radiusu</p>
                </div>

                <!-- Filter Selector Tabs -->
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-[20px] p-2 flex-wrap">
                  <button
                    onClick=${() => setHeatmapFilter('all')}
                    className=${`px-3 py-1.5 text-xs font-black rounded-[8px] transition cursor-pointer flex items-center gap-1.5 ${
                      heatmapFilter === 'all' ? 'bg-purple-900 text-white shadow-md shadow-purple-900/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Ümumi</span>
                  </button>
                  <button
                    onClick=${() => setHeatmapFilter('teamA')}
                    className=${`px-3 py-1.5 text-xs font-black rounded-[8px] transition cursor-pointer flex items-center gap-1.5 ${
                      heatmapFilter === 'teamA' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>${match.teamA}</span>
                  </button>
                  <button
                    onClick=${() => setHeatmapFilter('teamB')}
                    className=${`px-3 py-1.5 text-xs font-black rounded-[8px] transition cursor-pointer flex items-center gap-1.5 ${
                      heatmapFilter === 'teamB' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>${match.teamB}</span>
                  </button>
                  <button
                    onClick=${() => setHeatmapFilter('player')}
                    className=${`px-3 py-1.5 text-xs font-black rounded-[8px] transition cursor-pointer flex items-center gap-1.5 ${
                      heatmapFilter === 'player' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className="fas fa-user text-[11px]"></i>
                    <span>Oyunçu</span>
                  </button>
                </div>
              </div>

              <!-- Individual Player Selector (When 'player' filter is active) -->
              ${heatmapFilter === 'player' && html`
                <div className="bg-slate-900/95 border border-slate-800 rounded-[20px] p-2 p-3 sm:p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <i className="fas fa-hand-pointer text-amber-400"></i> Fərdi Taktiki İstilik Xəritəsi Üçün Oyunçu Seçin:
                    </span>
                    <span className="text-[10px] text-purple-400 font-bold">5v5 Heyətlər</span>
                  </div>

                  <!-- Player Chips: Team A & Team B starting 5 -->
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    ${[...analytics.lineupA, ...analytics.lineupB].map(p => {
                      const isA = analytics.lineupA.some(a => a.id === p.id);
                      const isSelected = selectedHeatmapPlayer === p.name;
                      return html`
                        <button
                          key=${p.id}
                          onClick=${() => setSelectedHeatmapPlayer(p.name)}
                          className=${`px-2.5 py-1.5 rounded-[8px] text-xs font-black transition flex items-center gap-1.5 cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105 ring-2 ring-purple-400/40'
                              : isA
                              ? 'bg-red-950/40 text-red-200 border-red-800/60 hover:bg-red-900/40'
                              : 'bg-sky-950/40 text-sky-200 border-sky-800/60 hover:bg-sky-900/40'
                          }`}
                        >
                          <span className=${`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                            isA ? 'bg-red-500 text-white' : 'bg-sky-500 text-white'
                          }`}>
                            ${p.number}
                          </span>
                          <span className="truncate max-w-[110px] sm:max-w-none">${p.name}</span>
                          <span className="text-[9px] opacity-75 font-normal">(${p.pos})</span>
                        </button>
                      `;
                    })}
                  </div>

                  <!-- Selected Player Performance & Movement Metrics -->
                  ${(() => {
                    const heatData = analytics.heatmapData?.playerHeatmaps?.[selectedHeatmapPlayer];
                    if (!heatData) return null;
                    return html`
                      <div className="mt-2 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-slate-800/50 p-2.5 rounded-[8px] border border-slate-700/50">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Taktiki Mövqe</span>
                          <span className="text-xs font-black text-amber-300 mt-0.5 block truncate">${heatData.role}</span>
                        </div>
                        <div className="bg-slate-800/50 p-2.5 rounded-[8px] border border-slate-700/50">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Topla Təmas</span>
                          <span className="text-xs font-black text-emerald-400 mt-0.5 block">${heatData.touches} Təmas</span>
                        </div>
                        <div className="bg-slate-800/50 p-2.5 rounded-[8px] border border-slate-700/50">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Döyüşlərdə Qələbə</span>
                          <span className="text-xs font-black text-sky-300 mt-0.5 block">${heatData.duelsWon}</span>
                        </div>
                        <div className="bg-slate-800/50 p-2.5 rounded-[8px] border border-slate-700/50">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Maks. Sürət</span>
                          <span className="text-xs font-black text-purple-300 mt-0.5 block">${heatData.maxSpeed}</span>
                        </div>
                      </div>
                    `;
                  })()}
                </div>
              `}

              <!-- Authentic 5v5 Minifootball Pitch (40m x 20m) with HD Thermal Heatmap -->
              <div 
                className="w-full h-84 sm:h-[420px] bg-gradient-to-r from-[#071d12] via-[#0d2a1b] to-[#071d12] rounded-3xl border-2 border-emerald-500/60 relative overflow-hidden shadow-sm border border-zinc-200 dark:border-white/10 flex items-center justify-center p-4"
                style=${{ touchAction: 'pan-y' }}
              >
                <!-- Alternating Mower Turf Stripes -->
                <div className="absolute inset-0 opacity-15 pointer-events-none" style=${{
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 40px, transparent 40px, transparent 80px)'
                }}></div>

                <!-- Standard 5v5 Pitch Markings -->
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-white/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-xs"></div>

                <!-- 6m Curved D-Box Penalty Areas -->
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-28 sm:w-36 h-48 sm:h-56 border-r-2 border-y-2 border-white/50 rounded-r-full bg-white/5 pointer-events-none"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 sm:w-36 h-48 sm:h-56 border-l-2 border-y-2 border-white/50 rounded-l-full bg-white/5 pointer-events-none"></div>

                <!-- 6m & 10m Penalty Spots -->
                <div className="absolute top-1/2 left-[15%] -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 pointer-events-none"></div>
                <div className="absolute top-1/2 right-[15%] -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 pointer-events-none"></div>

                <!-- DYNAMIC MULTI-TIER THERMAL HEATMAP LAYERS -->
                ${(() => {
                  let points = [];
                  if (heatmapFilter === 'all') {
                    points = [
                      ...(analytics.heatmapData?.teamA || []).map(p => ({ ...p, color: 'red' })),
                      ...(analytics.heatmapData?.teamB || []).map(p => ({ ...p, color: 'blue' }))
                    ];
                  } else if (heatmapFilter === 'teamA') {
                    points = (analytics.heatmapData?.teamA || []).map(p => ({ ...p, color: 'red' }));
                  } else if (heatmapFilter === 'teamB') {
                    points = (analytics.heatmapData?.teamB || []).map(p => ({ ...p, color: 'blue' }));
                  } else if (heatmapFilter === 'player') {
                    const pHeat = analytics.heatmapData?.playerHeatmaps?.[selectedHeatmapPlayer];
                    points = (pHeat?.points || []).map(p => ({ ...p, color: pHeat.team === match.teamA ? 'red' : 'blue' }));
                  }

                  return html`
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      ${points.map((pt, i) => {
                        const isRed = pt.color === 'red';
                        const size = pt.radius * 2;
                        return html`
                          <div
                            key=${`heat_${i}`}
                            style=${{
                              left: `${pt.x}%`,
                              top: `${pt.y}%`,
                              width: `${size}px`,
                              height: `${size}px`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            className="absolute rounded-full"
                          >
                            <!-- Core Hot Spot -->
                            <div className=${`w-full h-full rounded-full blur-2xl opacity-80 ${
                              isRed 
                                ? 'bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-300' 
                                : 'bg-gradient-to-tr from-blue-600 via-cyan-400 to-emerald-300'
                            }`}></div>
                            <!-- Concentrated Pulse Center -->
                            <div className=${`absolute inset-1/4 rounded-full blur-xl opacity-90 animate-pulse ${
                              isRed ? 'bg-red-500' : 'bg-cyan-400'
                            }`}></div>
                          </div>
                        `;
                      })}
                    </div>
                  `;
                })()}

                <!-- Player Active Territory Center Tag (In Player Mode) -->
                ${heatmapFilter === 'player' && html`
                  <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md border border-purple-500/50 px-3 py-1.5 rounded-[8px] shadow-lg flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-xs font-black text-white">${selectedHeatmapPlayer}</span>
                    <span className="text-[10px] text-purple-300 font-bold">
                      ${analytics.heatmapData?.playerHeatmaps?.[selectedHeatmapPlayer]?.dominantZone || 'Meydança Mərkəzi'}
                    </span>
                  </div>
                `}

                <div className="absolute bottom-3 right-4 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-[8px] text-[10px] font-bold text-slate-300 border border-slate-800 shadow-md">
                  Minifutbol Meydançası (40m × 20m) • 5v5
                </div>

                <!-- Heat Intensity Color Legend -->
                <div className="absolute bottom-3 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-[8px] border border-slate-800 shadow-md flex items-center gap-2 text-[10px] font-bold text-slate-300">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">İntensivlik:</span>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Zəif"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" title="Orta"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Yüksək"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" title="Maksimal Təzyiq"></span>
                  </div>
                </div>
              </div>

              <!-- TACTICAL ATTACK CHANNELS & THIRD TERRITORY BARS -->
              ${(() => {
                const zones = analytics.heatmapData?.tacticalZones || {
                  flanksA: { left: 34, center: 48, right: 18 },
                  flanksB: { left: 45, center: 36, right: 19 },
                  thirdsA: { def: 20, mid: 42, att: 38 },
                  thirdsB: { def: 42, mid: 36, att: 22 }
                };

                return html`
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Flank Attack Distribution -->
                    <div className="bg-slate-900/90 border border-slate-800 rounded-[20px] p-2 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                          <i className="fas fa-arrows-split-up-and-left text-emerald-400"></i> Cinah Hücum Kanalları (Flanks)
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">${match.teamA} vs ${match.teamB}</span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <!-- Left Flank -->
                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.flanksA.left}%</span>
                            <span className="text-slate-300">Sol Cinah (Left Channel)</span>
                            <span className="text-sky-400 font-black">${zones.flanksB.left}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.flanksA.left}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.flanksB.left}%` }}></div>
                          </div>
                        </div>

                        <!-- Center -->
                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.flanksA.center}%</span>
                            <span className="text-slate-300 font-black text-amber-300">Mərkəz / Göbək (Center)</span>
                            <span className="text-sky-400 font-black">${zones.flanksB.center}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.flanksA.center}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.flanksB.center}%` }}></div>
                          </div>
                        </div>

                        <!-- Right Flank -->
                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.flanksA.right}%</span>
                            <span className="text-slate-300">Sağ Cinah (Right Channel)</span>
                            <span className="text-sky-400 font-black">${zones.flanksB.right}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.flanksA.right}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.flanksB.right}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Pitch Thirds Control -->
                    <div className="bg-slate-900/90 border border-slate-800 rounded-[20px] p-2 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                          <i className="fas fa-layer-group text-sky-400"></i> Meydança Zonaları Nəzarəti (Thirds)
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">Sahə Təzyiqi</span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.thirdsA.def}%</span>
                            <span className="text-slate-300">Müdafiə Zonası (Defensive 3rd)</span>
                            <span className="text-sky-400 font-black">${zones.thirdsB.def}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.thirdsA.def}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.thirdsB.def}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.thirdsA.mid}%</span>
                            <span className="text-slate-300">Mərkəz Keçid (Middle 3rd)</span>
                            <span className="text-sky-400 font-black">${zones.thirdsB.mid}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.thirdsA.mid}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.thirdsB.mid}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.thirdsA.att}%</span>
                            <span className="text-slate-300">Hücum & Qapı Önü (Attacking 3rd)</span>
                            <span className="text-sky-400 font-black">${zones.thirdsB.att}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.thirdsA.att}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.thirdsB.att}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              })()}

              <!-- 5v5 Minifootball Tactical Guide Banner -->
              <div className="p-4 rounded-[20px] p-2 bg-purple-950/40 border border-purple-800/50 flex items-start gap-3 text-xs text-purple-200">
                <i className="fas fa-info-circle text-purple-400 text-base shrink-0 mt-0.5"></i>
                <div className="space-y-1">
                  <span className="font-black uppercase tracking-wider text-purple-300 block">
                    5v5 Minifutbol Taktiki İcmalı:
                  </span>
                  <p className="leading-relaxed font-medium">
                    TDV BTL turnirində oyunlar rəsmi 40m × 20m meydançada 5v5 formatında keçirilir. Komandalar 1-2-1 Romb (Futsal) sistemi ilə oynayaraq yüksək temp, sürətli cinah hücumları və cərimə qövsü önündə sıx presinq tətbiq edirlər. Yuxarıdakı istilik xəritəsi zərbə və topla təmas koordinatlarının dəqiq termal paylanmasını əks etdirir.
                  </p>
                </div>
              </div>
            </div>
          `}

          <!-- ================================================================= -->

            <!--  TAB 5: VIDEO & YOUTUBE INTEGRATION  -->
          ${activeTab === 'video' && html`
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
                <iframe
                  src=${(match.videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ").replace('watch?v=', 'embed/')}
                  title="Matç Video Yayımı"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              <div className="bg-gradient-to-r from-red-950/80 to-slate-900 border border-red-800/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white text-2xl shadow-lg shrink-0">
                    <i className="fab fa-youtube"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white">${YOUTUBE_CONFIG.channelName}</h4>
                    <p className="text-xs text-slate-400">Rəsmi Matç İcmalları və Oyun Videoları</p>
                  </div>
                </div>

                <a
                  href=${YOUTUBE_CONFIG.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <i className="fab fa-youtube text-base"></i>
                  <span>Kanala Abunə Ol</span>
                </a>
              </div>
            </div>
          `}

          <!--  TAB 6: MATCH INFO & REFEREE  -->
          ${activeTab === 'info' && html`
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-transparent/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
                  <i className="fas fa-whistle text-amber-400"></i> Hakim Məlumatı (Referee)
                </h4>
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 space-y-2">
                  <div className="font-black text-white text-base">${analytics?.referee?.name || 'N/A'}</div>
                  <div className="text-slate-400 text-xs">${analytics?.referee?.country || 'N/A'}</div>
                  <div className="pt-2 border-t border-slate-700/50 flex items-center gap-4">
                    <span className="text-amber-400 font-bold">Sarı Ort. Sarı: ${analytics?.referee?.avgYellow || '0.14'}</span>
                    <span className="text-red-400 font-bold">🟥 Ort. Qırmızı: ${analytics?.referee?.avgRed || '3.60'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-transparent/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                  <i className="fas fa-map-marker-alt"></i> Stadion və Məkan
                </h4>
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 space-y-2">
                  <div className="text-slate-300 font-bold">Stadion: <span className="text-white">${analytics?.stadium || 'TDV BTL Arena'}</span></div>
                  <div className="text-slate-300 font-bold">Məkan: <span className="text-white">${analytics?.location || 'Bakı, Azərbaycan'}</span></div>
                  <div className="text-slate-300 font-bold">Format: <span className="text-emerald-400">Rəsmi 5v5 Minifutbol (40m x 20m)</span></div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                    👑
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Matçın Ən Yaxşı Oyunçusu (MVP)</span>
                    <h4 className="text-lg font-black text-white">${mvpPlayer?.name} (${mvpPlayer?.pos})</h4>
                    <p className="text-xs text-slate-400">Sofascore Reytinqi: <span className="text-amber-400 font-black">${mvpPlayer?.rating}</span></p>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center min-w-[140px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Azarkeş Səsverməsi</span>
                  <div className="text-xs font-black text-white mt-1">${mvpPlayer?.name} (%82)</div>
                </div>
              </div>
            </div>
          `}

        </main>

        <!--  BOTTOM SAFE FOOTER  -->
        <footer className="bg-[#0b0e14] border-t border-slate-800 p-4 text-center shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              TDV Bakı Türk Liseyi • Sofascore AI Match Center
            </span>
            <button
              onClick=${handleBack}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-lg cursor-pointer"
            >
              Geri Qayıt
            </button>
          </div>
        </footer>

      </div>
    </div>
  `;
}
