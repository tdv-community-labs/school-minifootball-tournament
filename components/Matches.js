import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle, calculateSofascoreRating } from '../services/database.js';
import { t as fallbackT, getDivisionLabel as fallbackGetDivisionLabel, getStageLabel as fallbackGetStageLabel, isMatchDivision } from '../services/i18n.js';
import { sanitizeEmbedUrl } from '../services/security.js?v=20260910_0080';

const html = htm.bind(React.createElement);

export default function Matches({ activeDivision, activeYear, lang = 'en', t = (k) => fallbackT(k, lang) }) {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedStage, setSelectedStage] = useState('Qrup Mərhələsi');
  const [selectedMatch, setSelectedMatch] = useState(null);

  const stages = [
    { id: 'Qrup Mərhələsi', label: lang === 'az' ? 'Qrup' : 'Group' },
    { id: '16/1 Final', label: lang === 'az' ? '16/1 Final' : 'Round of 32' },
    { id: '8/1 Final', label: lang === 'az' ? '8/1 Final' : 'Round of 16' },
    { id: '4/1 Final', label: lang === 'az' ? '4/1 Final' : 'Quarter-Final' },
    { id: 'Yarımfinal', label: lang === 'az' ? 'Yarımfinal' : 'Semi-Final' },
    { id: 'Final', label: 'Final' },
    { id: '3-cü Yer', label: lang === 'az' ? '3-cü Yer' : '3rd Place' }
  ];

  useEffect(() => {
    const loadMatchesData = async () => {
      const allMatches = await db.getMatches(activeYear);
      const allPlayers = await db.getPlayers(activeYear);
      setMatches(allMatches);
      setPlayers(allPlayers);
    };
    loadMatchesData();
  }, [activeDivision, activeYear]);

  const filteredMatches = matches.filter(m => isMatchDivision(m.division, activeDivision) && m.stage === selectedStage);

  /**
   * Returns enriched per-player stats for a given match,
   * including auto-computed Sofascore rating when not manually stored.
   */
  const getMatchPlayerDetails = (match) => {
    if (!match || !match.playerStats) return [];

    const isFinal  = match.stage === 'Final';
    const scoreA   = Number(match.scoreA || 0);
    const scoreB   = Number(match.scoreB || 0);
    const diffAB   = scoreA - scoreB;

    return match.playerStats.map(stat => {
      const playerInfo = players.find(p => p.id === stat.playerId) || {};
      const playerTeam   = playerInfo.class || '';
      const teamWon      = playerTeam === match.teamA ? scoreA > scoreB
                         : playerTeam === match.teamB ? scoreB > scoreA : false;
      const myGoalDiff   = playerTeam === match.teamA ? diffAB : -diffAB;
      const goalsAgainst = playerTeam === match.teamA ? scoreB : scoreA;
      const isKeeper     = stat.isKeeper === true ||
        (playerInfo.position || '').toLowerCase().includes('qap');

      const rating = stat.rating
        ? Number(stat.rating)
        : calculateSofascoreRating(
            stat,
            { isKeeper },
            { isFinal, teamWon, goalDiff: myGoalDiff, goalsAgainst }
          );

      return {
        ...stat,
        name:     playerInfo.name     || 'Naməlum Oyunçu',
        class:    playerInfo.class    || '',
        position: playerInfo.position || '',
        isKeeper,
        rating
      };
    });
  };

  const matchStats  = selectedMatch ? getMatchPlayerDetails(selectedMatch) : [];
  const teamAPlayers = matchStats.filter(p => p.class === selectedMatch?.teamA);
  const teamBPlayers = matchStats.filter(p => p.class === selectedMatch?.teamB);

  const getDivisionLabel = (div) => {
    if (div === '6') return '6-cı Siniflər';
    if (div === '7') return '7-ci Siniflər';
    if (div === '8') return '8-ci Siniflər';
    if (div === '9') return '9-cu Siniflər';
    if (div === '10-11') return '10-11-ci Siniflər';
    if (div === '7-8') return '7-8-ci Siniflər';
    if (div === '9-10') return '9-10-cu Siniflər';
    return '11-ci Siniflər';
  };

  /** Render a single player row inside the match detail modal */
  const renderPlayerRow = (player) => {
    const badge = getSofascoreBadgeStyle(player.rating);
    return html`
      <div key=${player.playerId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h6 className="font-bold text-purple-950 text-xs truncate">${player.name}</h6>
            ${player.isKeeper ? html`<span className="text-[9px] bg-sky-100 text-sky-700 font-black px-1.5 py-0.5 rounded uppercase">🧤 Qapıçı</span>` : null}
          </div>
          <p className="text-[10px] text-gray-400">${player.position || '—'}</p>
          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-semibold mt-1">
            ${player.isKeeper
              ? html`<span>🧤 Qurtarış: ${player.saves || 0}</span>`
              : html`<span>⚽ Qol: ${player.goals || 0}</span>`
            }
            <span>👟 Asist: ${player.assists || 0}</span>
            ${(player.yellowCards || 0) > 0 ? html`<span className="text-yellow-500">🟡 ×${player.yellowCards}</span>` : null}
            ${(player.redCards    || 0) > 0 ? html`<span className="text-red-600">🔴 ×${player.redCards}</span>`    : null}
          </div>
        </div>
        <!-- Rating badge -->
        <span className=${"min-w-[2.75rem] h-11 rounded-xl flex flex-col items-center justify-center font-black text-xs ml-3 px-1 " + badge}>
          <span className="text-sm leading-none">${player.rating}</span>
          <span className="text-[8px] opacity-75 mt-0.5">Rating</span>
        </span>
      </div>
    `;
  };

  return html`
    <div className="space-y-6 animate-fadeIn">
      <!-- Title & Filters -->
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-purple-950 font-sans">${t('matchesTitle')} — ${fallbackGetDivisionLabel(activeDivision, lang)}</h2>
          <p className="text-sm text-gray-500">${lang === 'az' ? 'Mərhələlər üzrə oyunlar, arxiv videolar və Sofascore reytinqləri' : 'Stage fixtures, match highlights, and Sofascore player ratings'}</p>
        </div>
        
        <!-- Stage Tabs -->
        <div className="flex bg-purple-50 p-1.5 rounded-2xl border border-purple-100 overflow-x-auto max-w-full no-scrollbar">
          ${stages.map(st => html`
            <button
              key=${st.id}
              onClick=${() => setSelectedStage(st.id)}
              className=${`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition whitespace-nowrap ${
                selectedStage === st.id 
                  ? 'bg-purple-900 text-white shadow-sm' 
                  : 'text-purple-950 hover:bg-purple-200/50'
              }`}
            >
              ${st.label}
            </button>
          `)}
        </div>
      </div>

      <!-- Match Cards Grid -->
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${filteredMatches.length === 0 
          ? html`
              <div className="col-span-2 text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                ${t('noMatchesFound')}
              </div>
            `
          : filteredMatches.map(match => html`
              <div 
                key=${match.id}
                onClick=${() => setSelectedMatch(match)}
                className="sport-card-hover bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm cursor-pointer flex flex-col justify-between"
              >
                <!-- Match Card Top -->
                <div className="p-4 sm:p-6 bg-gradient-to-b from-purple-50/50 to-white">
                  <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] sm:text-xs font-black text-purple-900 bg-purple-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
                        ${match.stage}
                      </span>
                      ${match.videoTitle && html`
                        <span className="text-[9px] sm:text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs" title=${match.videoTitle}>
                          <i className="fab fa-youtube text-red-600"></i>
                          <span>${match.videoDuration || 'Video'}</span>
                        </span>
                      `}
                    </div>
                    <span className="text-[11px] sm:text-xs text-gray-400 flex items-center shrink-0">
                      <i className="far fa-calendar-alt mr-1"></i> ${match.date || 'Tarix təyin edilməyib'}
                    </span>
                  </div>


                  <!-- Score Display -->
                  <div className="flex items-center justify-between py-3 sm:py-4 gap-1 sm:gap-3">
                    <div className="text-center flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-black text-purple-950 truncate">${match.teamA}</h4>
                      <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold tracking-widest uppercase truncate block">Ev sahibi</span>
                    </div>
                    <div className="flex flex-col items-center px-2 sm:px-4 shrink-0">
                      <div className="bg-purple-950 text-white rounded-2xl px-3.5 sm:px-5 py-1.5 sm:py-2 font-black text-xl sm:text-2xl shadow-md border-b-4 border-green-500 flex flex-col items-center">
                        <span>${match.scoreA} - ${match.scoreB}</span>
                        ${(match.penaltyScoreA !== null && match.penaltyScoreA !== undefined && match.penaltyScoreA !== '') && html`
                          <span className="text-[9px] sm:text-[10px] text-green-400 font-extrabold mt-0.5">pen. ${match.penaltyScoreA} - ${match.penaltyScoreB}</span>
                        `}
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1.5 sm:mt-2">
                        Bitti
                      </span>
                    </div>
                    <div className="text-center flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-black text-purple-950 truncate">${match.teamB}</h4>
                      <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold tracking-widest uppercase truncate block">Qonaq</span>
                    </div>
                  </div>
                </div>

                <!-- Match Card Bottom -->
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[11px] sm:text-xs font-bold text-purple-950">
                  <span className="flex items-center text-gray-500">
                    <i className="fas fa-chart-line text-green-500 mr-1.5 text-xs sm:text-sm"></i>
                    ${match.playerStats?.length || 0} Oyunçu reytinqi
                  </span>
                  <span className="text-purple-900 hover:text-green-600 transition flex items-center space-x-1">
                    <span>Detallar və Video</span>
                    <i className="fas fa-chevron-right text-[9px]"></i>
                  </span>
                </div>
              </div>
            `)}
      </div>

      <!-- Match Details & Sofascore Rating Modal -->
      ${selectedMatch && html`
        <div className="fixed inset-0 z-50 overflow-y-auto bg-purple-950/40 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl animate-fadeIn relative">
            
            <!-- Modal Header -->
            <div className="bg-purple-900 text-white p-4 sm:p-6 rounded-t-3xl flex justify-between items-start gap-2">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold text-green-400 bg-purple-950/50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
                  ${selectedMatch.stage} • Match Details
                  ${selectedMatch.stage === 'Final' ? ' 🏆' : ''}
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-2 break-words">
                  ${selectedMatch.teamA} ${selectedMatch.scoreA} - ${selectedMatch.scoreB} ${selectedMatch.teamB}
                  ${(selectedMatch.penaltyScoreA !== null && selectedMatch.penaltyScoreA !== undefined && selectedMatch.penaltyScoreA !== '') && html`
                    <span className="text-green-400 text-base sm:text-lg font-extrabold ml-1 sm:ml-2">(pen. ${selectedMatch.penaltyScoreA} - ${selectedMatch.penaltyScoreB})</span>
                  `}
                </h3>
              </div>
              <button 
                onClick=${() => setSelectedMatch(null)}
                className="bg-purple-950 text-white hover:bg-red-600 transition w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
              <!-- Video Highlights & YouTube Archive -->
              ${(selectedMatch.videoUrl || selectedMatch.videoTitle) && html`
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-purple-950 dark:text-white flex items-center">
                    <i className="fab fa-youtube text-red-600 mr-2 text-xl"></i> ${lang === 'az' ? 'Matçın İcmalı (Video)' : 'Match Highlights (Video)'}
                  </h4>
                  ${(sanitizeEmbedUrl(selectedMatch.videoUrl)) ? html`
                    <div className="aspect-video bg-purple-950 rounded-2xl overflow-hidden shadow-inner border border-purple-800">
                      <iframe 
                        className="w-full h-full"
                        src=${sanitizeEmbedUrl(selectedMatch.videoUrl)} 
                        title="Match Highlight"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        referrerPolicy="strict-origin-when-cross-origin"
                      ></iframe>
                    </div>
                  ` : html`
                    <div className="bg-gradient-to-r from-red-500/10 via-purple-500/10 to-transparent border border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                          <i className="fab fa-youtube"></i>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                            TDV-BTL Football Cup • YouTube Arxiv
                          </span>
                          <h5 className="text-sm font-black text-purple-950 dark:text-white mt-0.5">
                            ${selectedMatch.videoTitle || `${selectedMatch.teamA} ${selectedMatch.scoreA}-${selectedMatch.scoreB} ${selectedMatch.teamB}`}
                          </h5>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 font-semibold mt-1">
                            ${selectedMatch.videoDuration && html`
                              <span className="flex items-center gap-1"><i className="far fa-clock text-gray-400"></i> ${selectedMatch.videoDuration}</span>
                            `}
                            ${selectedMatch.viewCount && html`
                              <span className="flex items-center gap-1"><i className="far fa-eye text-gray-400"></i> ${selectedMatch.viewCount}</span>
                            `}
                          </div>
                        </div>
                      </div>
                      <a
                        href=${selectedMatch.videoUrl || `https://www.youtube.com/results?search_query=TDV-BTL+Football+Cup+${encodeURIComponent(selectedMatch.videoTitle || `${selectedMatch.teamA} ${selectedMatch.teamB}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg flex-shrink-0 cursor-pointer"
                      >
                        <i className="fas fa-play text-xs"></i>
                        <span>${lang === 'az' ? 'YouTube-da İzlə' : 'Watch on YouTube'}</span>
                        <i className="fas fa-external-link-alt text-[10px]"></i>
                      </a>
                    </div>
                  `}
                </div>
              `}


              <!-- Scores and scorers -->
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex justify-around text-center text-sm">
                <div>
                  <h5 className="font-extrabold text-purple-950 text-base mb-2">${selectedMatch.teamA}</h5>
                  <div className="space-y-1 text-xs text-gray-500 font-semibold">
                    ${teamAPlayers.filter(p => (p.goals || 0) > 0).map(p => html`
                      <div key=${p.playerId}>⚽ ${p.name} (${p.goals}')</div>
                    `)}
                    ${teamAPlayers.filter(p => (p.goals || 0) > 0).length === 0 ? html`<span>—</span>` : null}
                  </div>
                </div>
                <div className="border-r border-gray-200 h-12 my-auto"></div>
                <div>
                  <h5 className="font-extrabold text-purple-950 text-base mb-2">${selectedMatch.teamB}</h5>
                  <div className="space-y-1 text-xs text-gray-500 font-semibold">
                    ${teamBPlayers.filter(p => (p.goals || 0) > 0).map(p => html`
                      <div key=${p.playerId}>⚽ ${p.name} (${p.goals}')</div>
                    `)}
                    ${teamBPlayers.filter(p => (p.goals || 0) > 0).length === 0 ? html`<span>—</span>` : null}
                  </div>
                </div>
              </div>

              <!-- Sofascore Ratings -->
              <div className="space-y-4">
                <h4 className="text-base font-bold text-purple-950 flex items-center border-l-4 border-green-500 pl-2">
                  Oyunçu Performansı — Sofascore Reytinqləri
                  ${selectedMatch.stage === 'Final' ? html`<span className="ml-2 text-amber-500 text-sm">🏆 Final Bonusu aktiv</span>` : null}
                </h4>

                <!-- Rating legend -->
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="bg-indigo-600 text-white px-2 py-0.5 rounded">9.0+ Əfsanəvi</span>
                  <span className="bg-sky-500 text-white px-2 py-0.5 rounded">8.0+ Əla</span>
                  <span className="bg-emerald-500 text-white px-2 py-0.5 rounded">7.0+ Yaxşı</span>
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded">6.0+ Orta</span>
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded">< 6.0 Zəif</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Team A Ratings -->
                  <div className="border border-purple-50 rounded-2xl p-4 bg-purple-50/10">
                    <h5 className="font-black text-purple-950 mb-3 border-b pb-2 text-sm">${selectedMatch.teamA} Heyəti</h5>
                    <div className="space-y-3">
                      ${teamAPlayers.length === 0 
                        ? html`<p className="text-xs text-gray-400 text-center py-4">Oyunçu statistikası qeyd edilməyib.</p>`
                        : teamAPlayers
                            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                            .map(renderPlayerRow)
                      }
                    </div>
                  </div>

                  <!-- Team B Ratings -->
                  <div className="border border-purple-50 rounded-2xl p-4 bg-purple-50/10">
                    <h5 className="font-black text-purple-950 mb-3 border-b pb-2 text-sm">${selectedMatch.teamB} Heyəti</h5>
                    <div className="space-y-3">
                      ${teamBPlayers.length === 0 
                        ? html`<p className="text-xs text-gray-400 text-center py-4">Oyunçu statistikası qeyd edilməyib.</p>`
                        : teamBPlayers
                            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                            .map(renderPlayerRow)
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div className="p-4 bg-gray-50 rounded-b-3xl text-right">
              <button 
                onClick=${() => setSelectedMatch(null)}
                className="bg-purple-900 text-white hover:bg-purple-800 font-bold px-6 py-2.5 rounded-xl text-xs transition"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
