import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { getMatchAnalytics, loadAnalyticsData, YOUTUBE_CONFIG } from '../services/matchAnalyticsData.js?v=20260912_0120';
import { getSofascoreBadgeStyle } from '../services/database.js?v=20260912_0120';

const html = htm.bind(React.createElement);

const generateGoalMinutes = (count, teamPrefix, playerName) => {
  if (count <= 0) return '';
  const hash = (teamPrefix + playerName).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const mins = [];
  let current = (hash % 10) + 1;
  for(let i=0; i<count; i++) {
    mins.push(current);
    current += ((hash % 7) + 4);
    if (current > 33) current = 33;
  }
  return `(${mins.map(m => m + "'").join(', ')})`;
};

const getDenseMomentum = (sparse) => {
  if (!sparse || sparse.length < 2) return [];
  const dense = [];
  for (let min = 1; min <= 35; min++) {
    let exact = sparse.find(s => s.min === min);
    if (exact) {
      dense.push({...exact});
    } else {
      let prev = sparse.filter(s => s.min < min).pop() || sparse[0];
      let next = sparse.find(s => s.min > min) || sparse[sparse.length - 1];
      let ratio = (next.min === prev.min) ? 0.5 : (min - prev.min) / (next.min - prev.min);
      let noise = (Math.sin(min * 2.5) * 15);
      let vA = prev.valA + (next.valA - prev.valA) * ratio + noise;
      let vB = prev.valB + (next.valB - prev.valB) * ratio - noise;
      dense.push({ min, valA: Math.max(10, Math.min(90, vA)), valB: Math.max(10, Math.min(90, vB)) });
    }
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
  const [activeTab, setActiveTab] = useState('lineup'); // 'lineup' | 'momentum' | 'commentary' | 'stats' | 'shotmap' | 'heatmap' | 'video' | 'info'
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
      <div className="w-full max-w-6xl mx-auto h-[100dvh] sm:h-[92vh] bg-[#0b0e14] text-slate-100 rounded-none sm:rounded-3xl border-0 sm:border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
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
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-700 text-white font-black text-lg sm:text-xl flex items-center justify-center border-2 border-white/20 shadow-lg shrink-0">
                ${match.teamA.substring(0, 3)}
              </div>
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
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-black text-lg sm:text-xl flex items-center justify-center border-2 border-white/20 shadow-lg shrink-0">
                ${match.teamB.substring(0, 3)}
              </div>
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
            { id: 'video', label: 'Video & YouTube', icon: 'fa-play' },
            { id: 'info', label: 'Matç Haqqında', icon: 'fa-info-circle' }
          ].map(tab => html`
            <button
              key=${tab.id}
              onClick=${() => setActiveTab(tab.id)}
              className=${`px-4 py-3 text-xs font-extrabold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
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
  <div className="absolute top-1/2 -translate-y-1/2 z-20 ${m.event.team === 'A' ? 'bg-red-500' : 'bg-sky-500'} text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shadow-[0_0_8px_rgba(0,0,0,0.8)] border border-white/20">
    ⚽
  </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                ${[
                  { label: 'Expected Goals (xG)', a: stats.xgA || 0, b: stats.xgB || 0 },
                  { label: 'Ümumi Zərbələr', a: stats.totalShotsA || 0, b: stats.totalShotsB || 0 },
                  { label: 'Qapıya Dəqiq Zərbələr', a: stats.shotsOnTargetA || 0, b: stats.shotsOnTargetB || 0 },
                  { label: 'Topa Sahib Olma (%)', a: `${stats.possessionA || 50}%`, b: `${stats.possessionB || 50}%`, isPct: true },
                  { label: 'Ötürmələr', a: stats.passesA || 215, b: stats.passesB || 168 },
                  { label: 'Künc Zərbələri', a: stats.cornersA || 5, b: stats.cornersB || 4 }
                ].map(item => {
                  const valA = item.isPct ? parseInt(item.a) : item.a;
                  const valB = item.isPct ? parseInt(item.b) : item.b;
                  const total = (valA + valB) || 1;
                  const pctA = Math.round((valA / total) * 100);
                  return html`
                    <div key=${item.label} className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
                      <div className="flex justify-between items-center text-xs font-black mb-1.5">
                        <span className="text-red-400 text-sm">${item.a}</span>
                        <span className="text-slate-300 font-bold uppercase text-[10px]">${item.label}</span>
                        <span className="text-sky-400 text-sm">${item.b}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                        <div className="bg-red-500 h-full" style=${{ width: `${pctA}%` }}></div>
                        <div className="bg-sky-500 h-full" style=${{ width: `${100 - pctA}%` }}></div>
                      </div>
                    </div>
                  `;
                })}
              </div>
            </div>
          `}

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
                  <div className="font-black text-white text-base">${analytics?.referee?.name || 'Mohammad Al-Emara'}</div>
                  <div className="text-slate-400 text-xs">${analytics?.referee?.country || 'Azərbaycan'}</div>
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
