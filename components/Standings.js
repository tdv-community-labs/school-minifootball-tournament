import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle, calculateSofascoreRating } from '../services/database.js';

const html = htm.bind(React.createElement);

// Normalize stage names across Azerbaijani tournament conventions
const normalizeStage = (stage) => {
  if (!stage) return '';
  const s = stage.trim().toLowerCase();
  if (s.includes('16/1') || s.includes('1/16')) return '16/1';
  if (s.includes('8/1') || s.includes('1/8')) return '8/1';
  if (s.includes('4/1') || s.includes('1/4') || s.includes('dörddəbir') || s.includes('dorddebir')) return '4/1';
  if (s.includes('yarım') || s.includes('yarim') || s.includes('1/2') || s.includes('semi')) return 'semi';
  if (s.includes('3-cü') || s.includes('3 cü') || s.includes('3-cu') || s.includes('bürünc') || s.includes('burunc')) return 'third';
  if (s.includes('final')) return 'final';
  return s;
};

export default function Standings({ activeDivision, activeYear }) {
  const [table, setTable] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'bracket'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [sortField, setSortField] = useState('points');
  const [sortAsc, setSortAsc] = useState(false);
  const [showEmptyPreview, setShowEmptyPreview] = useState(false);

  useEffect(() => {
    const loadStandingsData = async () => {
      const standingsData = await db.getStandings(activeDivision, activeYear);
      const matchesData = await db.getMatches(activeYear);
      const playersData = await db.getPlayers(activeYear);
      setTable(standingsData);
      setMatches(matchesData);
      setPlayers(playersData);
    };
    loadStandingsData();
  }, [activeDivision, activeYear]);

  // Reset view mode and preview toggle when division or year changes
  useEffect(() => {
    setViewMode('table');
    setShowEmptyPreview(false);
  }, [activeDivision, activeYear]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedTable = [...table].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

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

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYOFF BRACKET CALCULATIONS & STAGES
  // ─────────────────────────────────────────────────────────────────────────────
  const divisionMatches = matches.filter(m => m.division === activeDivision);
  
  // Separate playoff matches from group stage
  const playoffMatches = divisionMatches.filter(m => {
    const norm = normalizeStage(m.stage);
    return norm !== '' && !m.stage.toLowerCase().includes('qrup');
  });

  const stage16Matches = playoffMatches.filter(m => normalizeStage(m.stage) === '16/1');
  const stage8Matches  = playoffMatches.filter(m => normalizeStage(m.stage) === '8/1');
  const stage4Matches  = playoffMatches.filter(m => normalizeStage(m.stage) === '4/1');
  const stageSemiMatches = playoffMatches.filter(m => normalizeStage(m.stage) === 'semi');
  const stageFinalMatches = playoffMatches.filter(m => normalizeStage(m.stage) === 'final');
  const stageThirdMatches = playoffMatches.filter(m => normalizeStage(m.stage) === 'third');

  // Match winner calculation helper
  const getMatchWinner = (match) => {
    if (!match) return null;
    const sA = Number(match.scoreA || 0);
    const sB = Number(match.scoreB || 0);
    if (sA > sB) return { winner: match.teamA, loser: match.teamB, isPenalties: false };
    if (sB > sA) return { winner: match.teamB, loser: match.teamA, isPenalties: false };
    if (
      match.penaltyScoreA !== null && match.penaltyScoreB !== null && 
      match.penaltyScoreA !== undefined && match.penaltyScoreB !== undefined && 
      match.penaltyScoreA !== ''
    ) {
      const pA = Number(match.penaltyScoreA);
      const pB = Number(match.penaltyScoreB);
      if (pA > pB) return { winner: match.teamA, loser: match.teamB, isPenalties: true };
      if (pB > pA) return { winner: match.teamB, loser: match.teamA, isPenalties: true };
    }
    return null;
  };

  // Determine Champion & Runner-Up
  const finalMatch = stageFinalMatches[0] || null;
  const finalOutcome = getMatchWinner(finalMatch);
  const championTeam = finalOutcome ? finalOutcome.winner : null;
  const runnerUpTeam = finalOutcome ? finalOutcome.loser : null;

  // Determine 3rd Place Team
  const thirdMatch = stageThirdMatches[0] || null;
  const thirdOutcome = getMatchWinner(thirdMatch);
  const thirdPlaceTeam = thirdOutcome ? thirdOutcome.winner : null;

  // Filter players by active division & year for Awards
  const currentDivPlayers = players.filter(p => p.division === activeDivision && p.year === activeYear);

  // Tournament Awards
  const dreamTeam = [...currentDivPlayers]
    .sort((a, b) => (b.overallRating - a.overallRating) || (b.goals - a.goals))
    .slice(0, 5);

  const mvpPlayer = [...currentDivPlayers]
    .sort((a, b) => (b.overallRating - a.overallRating) || (b.goals - a.goals))[0] || null;

  const topScorer = [...currentDivPlayers]
    .sort((a, b) => (b.goals - a.goals) || (b.overallRating - a.overallRating))[0] || null;

  const goalkeepers = currentDivPlayers.filter(p => 
    p.isKeeper || (p.position || '').toLowerCase().includes('qap')
  );
  const bestGoalkeeper = [...goalkeepers]
    .sort((a, b) => (b.overallRating - a.overallRating) || (b.matchesPlayed - a.matchesPlayed))[0] || null;

  // Determine bracket depth / starting round
  const hasStage16 = stage16Matches.length > 0;
  const hasStage8  = stage8Matches.length > 0 || hasStage16;
  const hasStage4  = stage4Matches.length > 0 || hasStage8;

  // Prepare filled or null slots
  const slots16 = Array.from({ length: 8 }).map((_, idx) => stage16Matches[idx] || null);
  const slots8  = Array.from({ length: 4 }).map((_, idx) => stage8Matches[idx] || null);
  const slots4  = Array.from({ length: 2 }).map((_, idx) => stage4Matches[idx] || null);
  const slotsSemi = Array.from({ length: 2 }).map((_, idx) => stageSemiMatches[idx] || null);
  const slotsFinal = Array.from({ length: 1 }).map((_, idx) => stageFinalMatches[idx] || null);

  // Group an array of matches into pairs for tree branch connecting
  const createPairs = (items) => {
    const pairs = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push([items[i], items[i + 1] || null]);
    }
    return pairs;
  };

  // Helper for enriched match player stats with Sofascore rating
  const getMatchPlayerDetails = (match) => {
    if (!match || !match.playerStats) return [];

    const isFinal  = normalizeStage(match.stage) === 'final';
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
        name: playerInfo.name || "Naməlum Oyunçu",
        class: playerInfo.class || "",
        position: playerInfo.position || "",
        isKeeper,
        rating
      };
    });
  };

  const matchStats = selectedMatch ? getMatchPlayerDetails(selectedMatch) : [];
  const teamAPlayers = matchStats.filter(p => p.class === selectedMatch?.teamA);
  const teamBPlayers = matchStats.filter(p => p.class === selectedMatch?.teamB);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER SINGLE BRACKET MATCH CARD
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBracketMatchCard = (match, label, index) => {
    if (!match) {
      return html`
        <div className="border-2 border-dashed border-purple-100 bg-purple-50/20 rounded-2xl p-3 flex flex-col justify-center items-center h-[90px] w-60 text-center select-none">
          <span className="text-[9px] text-purple-900/50 font-black uppercase tracking-wider">
            ${label} #${index + 1}
          </span>
          <span className="text-[11px] text-gray-300 font-bold mt-1 flex items-center gap-1">
            <i className="fas fa-hourglass-start text-[10px]"></i> Təyin edilməyib
          </span>
        </div>
      `;
    }

    const outcome = getMatchWinner(match);
    const isFinished = outcome !== null || (match.scoreA > 0 || match.scoreB > 0);
    const isTeamAWinner = outcome && outcome.winner === match.teamA;
    const isTeamBWinner = outcome && outcome.winner === match.teamB;
    const hasPenalties = match.penaltyScoreA !== null && match.penaltyScoreA !== undefined && match.penaltyScoreA !== '';

    return html`
      <div 
        onClick=${() => setSelectedMatch(match)}
        className=${`bracket-card-hover group bg-white border rounded-2xl p-3 shadow-xs hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between w-60 h-[96px] relative select-none ${
          isFinished ? 'border-purple-100/90' : 'border-gray-200'
        }`}
      >
        <!-- Stage & Status Tag -->
        <div className="flex items-center justify-between text-[9px] font-extrabold pb-1">
          <span className="bg-purple-50 text-purple-950 px-2 py-0.5 rounded uppercase tracking-wider">
            ${label} #${index + 1}
          </span>
          
          <div className="flex items-center gap-1.5">
            ${match.videoUrl ? html`<span className="text-red-500 font-black text-[9px]"><i className="fab fa-youtube"></i></span>` : null}
            ${match.date ? html`<span className="text-gray-400 font-medium">${match.date}</span>` : null}
            ${isFinished 
              ? html`<span className="text-green-600 font-black flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>Bitib</span>`
              : html`<span className="text-gray-400">Gözlənilir</span>`
            }
          </div>
        </div>

        <!-- Team A Row -->
        <div className=${`flex items-center justify-between px-2 py-1 rounded-lg transition ${
          isTeamAWinner ? 'bg-green-50/90 font-black' : isFinished ? 'opacity-65 font-medium' : 'font-bold'
        }`}>
          <div className="flex items-center space-x-2 truncate pr-1">
            <span className="w-5 h-5 rounded-md bg-purple-950 text-white text-[9px] font-black flex items-center justify-center shrink-0">
              ${(match.teamA || '').substring(0, 3)}
            </span>
            <span className=${`text-xs truncate ${isTeamAWinner ? 'text-green-800 font-black' : 'text-purple-950'}`}>
              ${match.teamA}
            </span>
            ${isTeamAWinner ? html`<i className="fas fa-check-circle text-green-500 text-[10px] ml-0.5"></i>` : null}
          </div>
          
          <div className="flex items-center space-x-1 shrink-0">
            ${hasPenalties && html`
              <span className="text-[9px] text-green-700 bg-green-100 px-1 py-0.2 rounded font-bold">
                (${match.penaltyScoreA})
              </span>
            `}
            <span className=${`text-xs font-black min-w-[14px] text-right ${isTeamAWinner ? 'text-green-700' : 'text-purple-950'}`}>
              ${match.scoreA ?? 0}
            </span>
          </div>
        </div>

        <!-- Team B Row -->
        <div className=${`flex items-center justify-between px-2 py-1 rounded-lg transition ${
          isTeamBWinner ? 'bg-green-50/90 font-black' : isFinished ? 'opacity-65 font-medium' : 'font-bold'
        }`}>
          <div className="flex items-center space-x-2 truncate pr-1">
            <span className="w-5 h-5 rounded-md bg-purple-900 text-white text-[9px] font-black flex items-center justify-center shrink-0">
              ${(match.teamB || '').substring(0, 3)}
            </span>
            <span className=${`text-xs truncate ${isTeamBWinner ? 'text-green-800 font-black' : 'text-purple-950'}`}>
              ${match.teamB}
            </span>
            ${isTeamBWinner ? html`<i className="fas fa-check-circle text-green-500 text-[10px] ml-0.5"></i>` : null}
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            ${hasPenalties && html`
              <span className="text-[9px] text-green-700 bg-green-100 px-1 py-0.2 rounded font-bold">
                (${match.penaltyScoreB})
              </span>
            `}
            <span className=${`text-xs font-black min-w-[14px] text-right ${isTeamBWinner ? 'text-green-700' : 'text-purple-950'}`}>
              ${match.scoreB ?? 0}
            </span>
          </div>
        </div>
      </div>
    `;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER MATCH PAIR (WITH TREE BRANCH CONNECTOR)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderMatchPair = (pair, label, pairIndex, hasConnector = true) => {
    const [match1, match2] = pair;

    return html`
      <div key=${`pair-${label}-${pairIndex}`} className="relative flex flex-col justify-around gap-4 py-2">
        ${renderBracketMatchCard(match1, label, pairIndex * 2)}
        ${renderBracketMatchCard(match2, label, pairIndex * 2 + 1)}

        <!-- Right Connector Line leading to next round -->
        ${hasConnector && html`
          <div className="hidden lg:block bracket-connector-branch"></div>
          <div className="hidden lg:block bracket-connector-stem"></div>
        `}
      </div>
    `;
  };

  return html`
    <div className="space-y-6 animate-fadeIn">
      
      <!-- Top Title & View Switcher -->
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-900 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ${getDivisionLabel(activeDivision)}
            </span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-gray-500 text-xs font-bold">${activeYear} Mövsümü</span>
          </div>
          <h2 className="text-2xl font-black text-purple-950 mt-1">
            Turnir Cədvəli & Pley-off Mərhələsi
          </h2>
          <p className="text-sm text-gray-500">
            ${viewMode === 'table' 
              ? 'Qrup mərhələsi xal sıralaması və top fərqləri' 
              : 'Dörddəbir, yarımfinal və böyük final pley-off toru'}
          </p>
        </div>
        
        <!-- View Switcher Tabs -->
        <div className="flex bg-purple-50 p-1.5 rounded-2xl border border-purple-100/60 shadow-xs">
          <button
            onClick=${() => setViewMode('table')}
            className=${`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition whitespace-nowrap flex items-center space-x-2 ${
              viewMode === 'table' 
                ? 'bg-purple-900 text-white shadow-sm' 
                : 'text-purple-950 hover:bg-purple-200/50'
            }`}
          >
            <i className="fas fa-list-ol text-sm"></i>
            <span>Qrup Mərhələsi</span>
          </button>
          
          <button
            onClick=${() => setViewMode('bracket')}
            className=${`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition whitespace-nowrap flex items-center space-x-2 ${
              viewMode === 'bracket' 
                ? 'bg-purple-900 text-white shadow-sm' 
                : 'text-purple-950 hover:bg-purple-200/50'
            }`}
          >
            <i className="fas fa-sitemap text-sm"></i>
            <span>Pley-off Toru</span>
          </button>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════════════════════════ -->
      <!-- VIEW MODE 1: STANDINGS TABLE -->
      <!-- ════════════════════════════════════════════════════════════════════════ -->
      ${viewMode === 'table' && html`
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-950 text-white text-xs font-bold tracking-wider">
                  <th className="py-4 px-6 text-center w-12">#</th>
                  <th className="py-4 px-4 cursor-pointer hover:text-green-400 transition" onClick=${() => handleSort('class')}>
                    Sinif ${sortField === 'class' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-green-400 transition" onClick=${() => handleSort('played')}>
                    O ${sortField === 'played' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-green-400 transition" onClick=${() => handleSort('won')}>
                    Q ${sortField === 'won' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-green-400 transition" onClick=${() => handleSort('drawn')}>
                    H ${sortField === 'drawn' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-green-400 transition" onClick=${() => handleSort('lost')}>
                    M ${sortField === 'lost' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-green-400 transition hidden md:table-cell" onClick=${() => handleSort('goalsFor')}>
                    QV ${sortField === 'goalsFor' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-green-400 transition hidden md:table-cell" onClick=${() => handleSort('goalsAgainst')}>
                    QBur ${sortField === 'goalsAgainst' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-green-400 transition" onClick=${() => handleSort('goalDifference')}>
                    TF ${sortField === 'goalDifference' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-4 px-6 text-center cursor-pointer hover:text-green-400 transition" onClick=${() => handleSort('points')}>
                    Xal ${sortField === 'points' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                ${table.length === 0 
                  ? html`
                      <tr>
                        <td colSpan="10" className="py-8 text-center text-gray-400">
                          Bu qrupda qeydiyyatdan keçmiş sinif yoxdur.
                        </td>
                      </tr>
                    `
                  : sortedTable.map((row, index) => {
                      const isLeader = index === 0 && sortField === 'points' && !sortAsc;
                      return html`
                        <tr key=${row.class} className=${`hover:bg-purple-50/30 transition ${isLeader ? 'bg-green-50/20' : ''}`}>
                          <td className="py-4 px-6 text-center font-black">
                            ${isLeader 
                              ? html`<span className="bg-green-500 text-purple-950 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs shadow-sm">1</span>`
                              : index + 1
                            }
                          </td>
                          <td className="py-4 px-4 font-bold text-purple-950">${row.class} Sinfi</td>
                          <td className="py-4 px-4 text-center font-medium text-gray-600">${row.played}</td>
                          <td className="py-4 px-4 text-center text-green-700 font-bold">${row.won}</td>
                          <td className="py-4 px-4 text-center text-gray-500 font-medium">${row.drawn}</td>
                          <td className="py-4 px-4 text-center text-red-600 font-bold">${row.lost}</td>
                          <td className="py-4 px-4 text-center text-gray-600 hidden md:table-cell">${row.goalsFor}</td>
                          <td className="py-4 px-4 text-center text-gray-600 hidden md:table-cell">${row.goalsAgainst}</td>
                          <td className=${`py-4 px-4 text-center font-extrabold ${row.goalDifference > 0 ? 'text-green-600' : row.goalDifference < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                            ${row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </td>
                          <td className="py-4 px-6 text-center font-black text-purple-900 text-base">
                            ${row.points}
                          </td>
                        </tr>
                      `;
                    })
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Abbreviations Legend -->
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-[11px] font-semibold text-gray-500 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div><span className="text-purple-900 font-extrabold mr-1">O:</span> Oyun Sayı</div>
          <div><span className="text-green-600 font-extrabold mr-1">Q:</span> Qələbə</div>
          <div><span className="text-gray-600 font-extrabold mr-1">H:</span> Heç-heçə</div>
          <div><span className="text-red-600 font-extrabold mr-1">M:</span> Məğlubiyyət</div>
          <div><span className="text-purple-900 font-extrabold mr-1">TF:</span> Top Fərqi</div>
          <div className="hidden md:block"><span className="text-purple-900 font-extrabold mr-1">QV/QBur:</span> Qollar Vuruldu / Buraxıldı</div>
        </div>
      `}

      <!-- ════════════════════════════════════════════════════════════════════════ -->
      <!-- VIEW MODE 2: PLAYOFF BRACKET (TEKMILLEŞDIRILMIŞ PLEY-OFF TORU) -->
      <!-- ════════════════════════════════════════════════════════════════════════ -->
      ${viewMode === 'bracket' && html`
        <div className="space-y-6 animate-fadeIn">
          
          <!-- PODIUM & INDIVIDUAL AWARDS BANNER -->
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            <!-- Champion & Runner-Up Showcase (Lg: 5 cols) -->
            <div className="lg:col-span-5 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-purple-950 p-6 rounded-3xl shadow-lg border border-amber-300 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -right-6 -bottom-6 text-amber-200/25 text-9xl font-black select-none pointer-events-none">
                <i className="fas fa-trophy"></i>
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-purple-950 text-amber-300 px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                    <i className="fas fa-crown text-amber-400 text-xs"></i> TURNİR ÇEMPİONU
                  </span>
                  <span className="text-[10px] font-black uppercase text-purple-950 bg-amber-300/60 px-2 py-0.5 rounded-md">
                    ${activeYear}
                  </span>
                </div>

                <h3 className="text-3xl font-black tracking-tight text-purple-950 uppercase leading-none mt-1">
                  ${championTeam ? `${championTeam} Sinfi` : 'Müəyyənləşdirilir'}
                </h3>
                
                <p className="text-xs font-bold text-purple-950/80 mt-1.5">
                  ${championTeam 
                    ? `${getDivisionLabel(activeDivision)} Çempionu və Qızıl Medal Sahibi` 
                    : 'Pley-off final oyunu tamamlandıqdan sonra çempion burada elan ediləcək'}
                </p>
              </div>

              <!-- Podiums for 2nd and 3rd -->
              <div className="grid grid-cols-2 gap-2.5 mt-5 relative z-10 pt-3 border-t border-amber-400/60">
                <div className="bg-purple-950/20 backdrop-blur-xs p-2.5 rounded-2xl border border-white/20">
                  <span className="text-[9px] font-black uppercase text-purple-950 block flex items-center gap-1">
                    <i className="fas fa-medal text-slate-200"></i> 2-ci Yer (Finalçı)
                  </span>
                  <p className="text-xs font-black text-purple-950 truncate mt-0.5">
                    ${runnerUpTeam ? `${runnerUpTeam} Sinfi` : 'Gözlənilir'}
                  </p>
                </div>

                <div className="bg-purple-950/20 backdrop-blur-xs p-2.5 rounded-2xl border border-white/20">
                  <span className="text-[9px] font-black uppercase text-purple-950 block flex items-center gap-1">
                    <i className="fas fa-award text-amber-800"></i> 3-cü Yer (Bürünc)
                  </span>
                  <p className="text-xs font-black text-purple-950 truncate mt-0.5">
                    ${thirdPlaceTeam ? `${thirdPlaceTeam} Sinfi` : 'Gözlənilir'}
                  </p>
                </div>
              </div>
            </div>

            <!-- Awards Strip (MVP, Top Scorer, Best Goalkeeper) (Lg: 7 cols) -->
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <!-- MVP Card -->
              <div className="bg-white border border-purple-100 rounded-3xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <i className="fas fa-star"></i> MVP
                    </span>
                    <span className="text-[9px] font-bold text-gray-400">Ən Dəyərli</span>
                  </div>
                  <h4 className="text-sm font-black text-purple-950 truncate">
                    ${mvpPlayer ? mvpPlayer.name : 'Təyin edilməyib'}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                    ${mvpPlayer ? `${mvpPlayer.class} Sinfi` : '-'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold">Sofascore:</span>
                  <span className=${`text-xs font-black px-2 py-0.5 rounded-md ${getSofascoreBadgeStyle(mvpPlayer?.overallRating || 6.5)}`}>
                    ${mvpPlayer ? mvpPlayer.overallRating : '-'}
                  </span>
                </div>
              </div>

              <!-- Golden Boot (Bombardir) Card -->
              <div className="bg-white border border-purple-100 rounded-3xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <i className="fas fa-shoe-prints"></i> Bombardir
                    </span>
                    <span className="text-[9px] font-bold text-gray-400">Qızıl Butsa</span>
                  </div>
                  <h4 className="text-sm font-black text-purple-950 truncate">
                    ${topScorer ? topScorer.name : 'Təyin edilməyib'}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                    ${topScorer ? `${topScorer.class} Sinfi` : '-'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold">Qollar:</span>
                  <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                    ⚽ ${topScorer ? topScorer.goals : 0} Qol
                  </span>
                </div>
              </div>

              <!-- Golden Glove (Qızıl Əlcək) Card -->
              <div className="bg-white border border-purple-100 rounded-3xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <i className="fas fa-mitten"></i> Qapıçı
                    </span>
                    <span className="text-[9px] font-bold text-gray-400">Qızıl Əlcək</span>
                  </div>
                  <h4 className="text-sm font-black text-purple-950 truncate">
                    ${bestGoalkeeper ? bestGoalkeeper.name : 'Təyin edilməyib'}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                    ${bestGoalkeeper ? `${bestGoalkeeper.class} Sinfi` : '-'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold">Reytinq:</span>
                  <span className=${`text-xs font-black px-2 py-0.5 rounded-md ${getSofascoreBadgeStyle(bestGoalkeeper?.overallRating || 6.5)}`}>
                    ${bestGoalkeeper ? bestGoalkeeper.overallRating : '-'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          <!-- DREAM TEAM (RƏMZİ 5-LİK) EXPANDER -->
          <div className="bg-white border border-purple-100 rounded-3xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-black text-xs">
                  <i className="fas fa-star"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                    Turnirin Rəmzi 5-liyi (Dream Team)
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Sofascore performans statistikasına əsasən mövsümün ən yaxşı oyunçuları
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black text-purple-900 bg-purple-50 px-2.5 py-1 rounded-full uppercase">
                ${activeYear}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t border-gray-100">
              ${dreamTeam.length === 0 
                ? html`<div className="col-span-5 text-center text-xs text-gray-400 py-2">Hələ qeydə alınmış oyunçu statistikası yoxdur.</div>`
                : dreamTeam.map((player, i) => html`
                    <div key=${player.id || i} className="bg-purple-50/40 hover:bg-purple-100/50 p-3 rounded-2xl border border-purple-100/60 transition flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2 truncate">
                        <span className=${`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                          i === 0 ? 'bg-amber-400 text-purple-950' : i === 1 ? 'bg-slate-300 text-purple-950' : i === 2 ? 'bg-amber-700 text-white' : 'bg-purple-200 text-purple-900'
                        }`}>
                          ${i + 1}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-black text-purple-950 truncate">${player.name}</div>
                          <div className="text-[9px] font-semibold text-gray-500 truncate">${player.class} • ${player.position || 'Oyunçu'}</div>
                        </div>
                      </div>
                      <span className=${`text-[11px] font-black px-1.5 py-0.5 rounded-lg shrink-0 ${getSofascoreBadgeStyle(player.overallRating || 6.5)}`}>
                        ${player.overallRating || 6.5}
                      </span>
                    </div>
                  `)
              }
            </div>
          </div>

          <!-- ════════════════════════════════════════════════════════════════════ -->
          <!-- TOURNAMENT BRACKET TREE -->
          <!-- ════════════════════════════════════════════════════════════════════ -->
          ${playoffMatches.length === 0 && !showEmptyPreview 
            ? html`
                <div className="bg-white border border-purple-100 rounded-3xl p-10 text-center shadow-xs space-y-4">
                  <div className="w-16 h-16 bg-purple-100 text-purple-950 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
                    <i className="fas fa-sitemap"></i>
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-black text-purple-950">Bu qrupda pley-off oyunları hələ qeydə alınmayıb</h3>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      Qrup mərhələsi yekunlaşdıqdan sonra Admin panelindən daxil edilən pley-off qarşılaşmaları (16/1, 8/1, 4/1, Yarımfinal və Final) avtomatik olaraq bu ağac üzərində canlı görünəcəkdir.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick=${() => setShowEmptyPreview(true)}
                      className="bg-purple-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-purple-800 transition inline-flex items-center gap-2 shadow-sm"
                    >
                      <i className="fas fa-eye"></i> Pley-off Torunun Boş Şablonuna Bax
                    </button>
                  </div>
                </div>
              `
            : html`
                <div className="bg-slate-50/80 border border-purple-100/80 rounded-3xl p-6 shadow-sm overflow-x-auto no-scrollbar">
                  
                  <!-- Instruction banner -->
                  <div className="flex items-center justify-between pb-4 border-b border-purple-100/60 mb-6 text-xs text-gray-500 font-semibold">
                    <span className="flex items-center gap-1.5 text-purple-950 font-bold">
                      <i className="fas fa-info-circle text-green-500"></i>
                      <span>İstənilən oyuna klikləyərək matç detallarına, video icmalına və Sofascore oyunçu reytinqlərinə baxa bilərsiniz.</span>
                    </span>
                    <span className="hidden sm:inline text-[10px] text-gray-400 font-bold">
                      ← Sürüşdürərək digər mərhələlərə baxın →
                    </span>
                  </div>

                  <!-- Multi-Column Interactive Tree -->
                  <div className="flex items-stretch gap-10 min-w-max pb-4">
                    
                    <!-- COLUMN 1: 16/1 FINAL (If present) -->
                    ${hasStage16 && html`
                      <div className="flex flex-col justify-between">
                        <div className="text-center mb-4">
                          <span className="text-[10px] font-black text-purple-950 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                            <i className="fas fa-shield-alt mr-1 text-purple-700"></i> 16/1 Final
                          </span>
                          <span className="text-[9px] text-gray-400 block font-semibold mt-1">16-da 1 Mərhələ</span>
                        </div>

                        <div className="flex flex-col justify-around gap-6 flex-1">
                          ${createPairs(slots16).map((pair, pIdx) => 
                            renderMatchPair(pair, '16/1', pIdx, true)
                          )}
                        </div>
                      </div>
                    `}

                    <!-- COLUMN 2: 8/1 FINAL (If present) -->
                    ${hasStage8 && html`
                      <div className="flex flex-col justify-between">
                        <div className="text-center mb-4">
                          <span className="text-[10px] font-black text-purple-950 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                            <i className="fas fa-shield-halved mr-1 text-purple-700"></i> 8/1 Final
                          </span>
                          <span className="text-[9px] text-gray-400 block font-semibold mt-1">Səkkizdəbir Final</span>
                        </div>

                        <div className="flex flex-col justify-around gap-8 flex-1">
                          ${createPairs(slots8).map((pair, pIdx) => 
                            renderMatchPair(pair, '8/1', pIdx, true)
                          )}
                        </div>
                      </div>
                    `}

                    <!-- COLUMN 3: 4/1 FINAL (Dörddəbir Final) -->
                    ${hasStage4 && html`
                      <div className="flex flex-col justify-between">
                        <div className="text-center mb-4">
                          <span className="text-[10px] font-black text-purple-950 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                            <i className="fas fa-cubes mr-1 text-purple-700"></i> 4/1 Final
                          </span>
                          <span className="text-[9px] text-gray-400 block font-semibold mt-1">Dörddəbir Final</span>
                        </div>

                        <div className="flex flex-col justify-around gap-12 flex-1">
                          ${createPairs(slots4).map((pair, pIdx) => 
                            renderMatchPair(pair, '4/1', pIdx, true)
                          )}
                        </div>
                      </div>
                    `}

                    <!-- COLUMN 4: YARIMFİNAL (Semifinals) -->
                    <div className="flex flex-col justify-between">
                      <div className="text-center mb-4">
                        <span className="text-[10px] font-black text-purple-950 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          <i className="fas fa-flag-checkered mr-1 text-purple-700"></i> Yarımfinal
                        </span>
                        <span className="text-[9px] text-gray-400 block font-semibold mt-1">1/2 Mərhələ</span>
                      </div>

                      <div className="flex flex-col justify-around gap-16 flex-1">
                        ${createPairs(slotsSemi).map((pair, pIdx) => 
                          renderMatchPair(pair, 'Yarımfinal', pIdx, true)
                        )}
                      </div>
                    </div>

                    <!-- COLUMN 5: BÖYÜK FİNAL (Final) & 3-cü YER -->
                    <div className="flex flex-col justify-center gap-8">
                      
                      <!-- Grand Final Card -->
                      <div>
                        <div className="text-center mb-4">
                          <span className="text-[10px] font-black text-white bg-gradient-to-r from-purple-950 to-purple-800 px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md border border-purple-700 flex items-center justify-center gap-1.5 mx-auto w-max">
                            <i className="fas fa-trophy text-amber-400"></i> BÖYÜK FİNAL
                          </span>
                          <span className="text-[9px] text-green-600 font-bold block mt-1">Çempionluq Matçı</span>
                        </div>

                        <div className="relative">
                          ${renderBracketMatchCard(slotsFinal[0], 'Final', 0)}
                        </div>
                      </div>

                      <!-- 3rd Place Match (If registered or available) -->
                      ${(stageThirdMatches.length > 0 || slotsFinal[0]) && html`
                        <div className="pt-4 border-t border-dashed border-purple-200">
                          <div className="text-center mb-3">
                            <span className="text-[9px] font-black text-amber-900 bg-amber-100 px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs inline-block">
                              <i className="fas fa-award text-amber-700 mr-1"></i> 3-cü Yer Uğrunda
                            </span>
                          </div>
                          
                          <div className="relative">
                            ${renderBracketMatchCard(stageThirdMatches[0] || null, '3-cü Yer', 0)}
                          </div>
                        </div>
                      `}

                    </div>

                  </div>
                </div>
              `
          }

        </div>
      `}

      <!-- ════════════════════════════════════════════════════════════════════════ -->
      <!-- MATCH DETAILS & SOFASCORE RATINGS POPUP MODAL -->
      <!-- ════════════════════════════════════════════════════════════════════════ -->
      ${selectedMatch && html`
        <div className="fixed inset-0 z-50 overflow-y-auto bg-purple-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-100 relative">
            
            <!-- Modal Header -->
            <div className="bg-purple-950 text-white p-6 rounded-t-3xl flex justify-between items-start border-b border-purple-900">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-green-400 bg-purple-900 px-3 py-1 rounded-full uppercase tracking-wider">
                    ${selectedMatch.stage}
                  </span>
                  <span className="text-xs text-purple-300 font-bold">
                    ${getDivisionLabel(selectedMatch.division || activeDivision)}
                  </span>
                </div>

                <h3 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
                  ${selectedMatch.teamA} ${selectedMatch.scoreA} - ${selectedMatch.scoreB} ${selectedMatch.teamB}
                  ${(selectedMatch.penaltyScoreA !== null && selectedMatch.penaltyScoreA !== undefined && selectedMatch.penaltyScoreA !== '') && html`
                    <span className="text-green-400 text-lg font-extrabold ml-2"> (pen. ${selectedMatch.penaltyScoreA} - ${selectedMatch.penaltyScoreB})</span>
                  `}
                </h3>

                ${selectedMatch.date && html`
                  <p className="text-xs text-purple-200 font-medium mt-1">
                    <i className="far fa-calendar-alt mr-1"></i> Tarix: ${selectedMatch.date}
                  </p>
                `}
              </div>

              <button 
                onClick=${() => setSelectedMatch(null)}
                className="bg-purple-900 hover:bg-red-600 text-white transition w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-md"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              <!-- Video Highlights (YouTube Embed) -->
              ${selectedMatch.videoUrl && html`
                <div className="space-y-2.5">
                  <h4 className="text-sm font-black text-purple-950 uppercase tracking-wider flex items-center">
                    <i className="fab fa-youtube text-red-600 mr-2 text-lg"></i> Matçın Video İcmalı
                  </h4>
                  <div className="aspect-video bg-purple-950 rounded-2xl overflow-hidden shadow-inner border border-purple-800">
                    <iframe 
                      className="w-full h-full"
                      src=${selectedMatch.videoUrl} 
                      title="Match Highlight"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              `}

              <!-- Scores and scorers -->
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex justify-around text-center text-sm">
                <div className="flex-1">
                  <h5 className="font-extrabold text-purple-950 text-base mb-2">${selectedMatch.teamA}</h5>
                  <div className="space-y-1 text-xs text-gray-500 font-semibold">
                    ${teamAPlayers.filter(p => p.goals > 0).map(p => html`
                      <div key=${p.playerId} className="text-purple-900 font-bold">⚽ ${p.name} (${p.goals} qol)</div>
                    `)}
                    ${teamAPlayers.filter(p => p.goals > 0).length === 0 && html`<span className="text-gray-400">Qol vurulmayıb</span>`}
                  </div>
                </div>

                <div className="border-r border-gray-200 h-12 my-auto"></div>

                <div className="flex-1">
                  <h5 className="font-extrabold text-purple-950 text-base mb-2">${selectedMatch.teamB}</h5>
                  <div className="space-y-1 text-xs text-gray-500 font-semibold">
                    ${teamBPlayers.filter(p => p.goals > 0).map(p => html`
                      <div key=${p.playerId} className="text-purple-900 font-bold">⚽ ${p.name} (${p.goals} qol)</div>
                    `)}
                    ${teamBPlayers.filter(p => p.goals > 0).length === 0 && html`<span className="text-gray-400">Qol vurulmayıb</span>`}
                  </div>
                </div>
              </div>

              <!-- Sofascore Ratings Section -->
              <div className="space-y-3">
                <div className="flex items-center justify-between border-l-4 border-green-500 pl-3">
                  <h4 className="text-base font-black text-purple-950">
                    Oyunçu Performansı və Sofascore Reytinqləri
                  </h4>
                  <span className="text-[10px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full">
                    Sofascore Engine 1.0 - 10.0
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <!-- Team A Ratings -->
                  <div className="border border-purple-50 rounded-2xl p-4 bg-purple-50/20">
                    <h5 className="font-black text-purple-950 mb-3 border-b border-purple-100 pb-2 text-xs uppercase tracking-wider flex items-center justify-between">
                      <span>${selectedMatch.teamA} Heyəti</span>
                      <span className="text-[10px] text-gray-400 font-semibold">${teamAPlayers.length} Oyunçu</span>
                    </h5>
                    
                    <div className="space-y-2.5">
                      ${teamAPlayers.length === 0 
                        ? html`<p className="text-xs text-gray-400 text-center py-4 font-semibold">Oyunçu statistikası qeyd edilməyib.</p>`
                        : teamAPlayers.map(player => {
                            const badge = getSofascoreBadgeStyle(player.rating);
                            return html`
                              <div key=${player.playerId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h6 className="font-bold text-purple-950 text-xs truncate">${player.name}</h6>
                                    ${player.isKeeper ? html`<span className="text-[9px] bg-sky-100 text-sky-700 font-black px-1.5 py-0.2 rounded uppercase">🧤 Qapıçı</span>` : null}
                                  </div>
                                  <p className="text-[10px] text-gray-400">${player.position || 'Oyunçu'}</p>
                                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-semibold mt-1">
                                    ${player.isKeeper
                                      ? html`<span>🧤 Qurtarış: ${player.saves || 0}</span>`
                                      : html`<span>⚽ Qol: ${player.goals || 0}</span>`
                                    }
                                    <span>👟 Asist: ${player.assists || 0}</span>
                                    ${(player.yellowCards || 0) > 0 ? html`<span className="text-yellow-500">🟡 ×${player.yellowCards}</span>` : null}
                                    ${(player.redCards || 0) > 0 ? html`<span className="text-red-600">🔴 ×${player.redCards}</span>` : null}
                                  </div>
                                </div>
                                <span className=${"min-w-[2.75rem] h-10 rounded-xl flex flex-col items-center justify-center font-black text-xs px-1 " + badge}>
                                  <span className="text-xs leading-none">${player.rating}</span>
                                  <span className="text-[7px] opacity-75 mt-0.5">Rating</span>
                                </span>
                              </div>
                            `;
                          })
                      }
                    </div>
                  </div>

                  <!-- Team B Ratings -->
                  <div className="border border-purple-50 rounded-2xl p-4 bg-purple-50/20">
                    <h5 className="font-black text-purple-950 mb-3 border-b border-purple-100 pb-2 text-xs uppercase tracking-wider flex items-center justify-between">
                      <span>${selectedMatch.teamB} Heyəti</span>
                      <span className="text-[10px] text-gray-400 font-semibold">${teamBPlayers.length} Oyunçu</span>
                    </h5>

                    <div className="space-y-2.5">
                      ${teamBPlayers.length === 0 
                        ? html`<p className="text-xs text-gray-400 text-center py-4 font-semibold">Oyunçu statistikası qeyd edilməyib.</p>`
                        : teamBPlayers.map(player => {
                            const badge = getSofascoreBadgeStyle(player.rating);
                            return html`
                              <div key=${player.playerId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h6 className="font-bold text-purple-950 text-xs truncate">${player.name}</h6>
                                    ${player.isKeeper ? html`<span className="text-[9px] bg-sky-100 text-sky-700 font-black px-1.5 py-0.2 rounded uppercase">🧤 Qapıçı</span>` : null}
                                  </div>
                                  <p className="text-[10px] text-gray-400">${player.position || 'Oyunçu'}</p>
                                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-semibold mt-1">
                                    ${player.isKeeper
                                      ? html`<span>🧤 Qurtarış: ${player.saves || 0}</span>`
                                      : html`<span>⚽ Qol: ${player.goals || 0}</span>`
                                    }
                                    <span>👟 Asist: ${player.assists || 0}</span>
                                    ${(player.yellowCards || 0) > 0 ? html`<span className="text-yellow-500">🟡 ×${player.yellowCards}</span>` : null}
                                    ${(player.redCards || 0) > 0 ? html`<span className="text-red-600">🔴 ×${player.redCards}</span>` : null}
                                  </div>
                                </div>
                                <span className=${"min-w-[2.75rem] h-10 rounded-xl flex flex-col items-center justify-center font-black text-xs px-1 " + badge}>
                                  <span className="text-xs leading-none">${player.rating}</span>
                                  <span className="text-[7px] opacity-75 mt-0.5">Rating</span>
                                </span>
                              </div>
                            `;
                          })
                      }
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <!-- Footer -->
            <div className="p-4 bg-gray-50 rounded-b-3xl text-right border-t border-gray-100">
              <button 
                onClick=${() => setSelectedMatch(null)}
                className="bg-purple-900 text-white hover:bg-purple-800 font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-sm"
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
