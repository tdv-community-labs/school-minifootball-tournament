import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db } from '../services/database.js';

const html = htm.bind(React.createElement);

// Helper for rating colors inside the details modal
const getRatingClass = (rating) => {
  if (rating >= 8.5) return 'rating-sofascore-legendary';
  if (rating >= 7.5) return 'rating-sofascore-excellent';
  if (rating >= 6.5) return 'rating-sofascore-good';
  if (rating >= 5.5) return 'rating-sofascore-average';
  return 'rating-sofascore-bad';
};

export default function Standings({ activeDivision, activeYear }) {
  const [table, setTable] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'bracket'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [sortField, setSortField] = useState('points');
  const [sortAsc, setSortAsc] = useState(false);

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

  // Reset view mode when division or year changes
  useEffect(() => {
    setViewMode('table');
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

  // Bracket Calculations
  const divisionMatches = matches.filter(m => m.division === activeDivision);
  const m16 = divisionMatches.filter(m => m.stage === "16/1 Final");
  const m8 = divisionMatches.filter(m => m.stage === "8/1 Final");
  const m4 = divisionMatches.filter(m => m.stage === "Yarımfinal");
  const m2 = divisionMatches.filter(m => m.stage === "Final");

  const has16 = m16.length > 0;
  const has8 = m8.length > 0 || has16;

  const slots16 = Array.from({ length: 8 }).map((_, idx) => m16[idx] || null);
  const slots8 = Array.from({ length: 4 }).map((_, idx) => m8[idx] || null);
  const slots4 = Array.from({ length: 2 }).map((_, idx) => m4[idx] || null);
  const slots2 = Array.from({ length: 1 }).map((_, idx) => m2[idx] || null);

  // Calculations for Champion & Team of Tournament (Dream Team)
  const getChampion = () => {
    const finalM = divisionMatches.find(m => m.stage === "Final");
    if (!finalM) return null;
    const sA = Number(finalM.scoreA || 0);
    const sB = Number(finalM.scoreB || 0);
    if (sA > sB) return finalM.teamA;
    if (sB > sA) return finalM.teamB;
    if (finalM.penaltyScoreA !== null && finalM.penaltyScoreB !== null && finalM.penaltyScoreA !== undefined && finalM.penaltyScoreB !== undefined && finalM.penaltyScoreA !== '') {
      return Number(finalM.penaltyScoreA) > Number(finalM.penaltyScoreB) ? finalM.teamA : finalM.teamB;
    }
    return null;
  };

  const championTeam = getChampion();

  // Filter players by active division & year
  const currentDivPlayers = players.filter(p => p.division === activeDivision && p.year === activeYear);
  
  // Dream Team (Top 5 players by Sofascore overall rating & goals)
  const dreamTeam = [...currentDivPlayers]
    .sort((a, b) => (b.overallRating - a.overallRating) || (b.goals - a.goals))
    .slice(0, 5);

  // MVP Player
  const mvpPlayer = [...currentDivPlayers]
    .sort((a, b) => (b.overallRating - a.overallRating) || (b.goals - a.goals))[0];

  // Top Scorer
  const topScorer = [...currentDivPlayers]
    .sort((a, b) => (b.goals - a.goals) || (b.overallRating - a.overallRating))[0];

  const getMatchPlayerDetails = (match) => {
    if (!match || !match.playerStats) return [];
    return match.playerStats.map(stat => {
      const playerInfo = players.find(p => p.id === stat.playerId) || {};
      return {
        ...stat,
        name: playerInfo.name || "Naməlum Oyunçu",
        class: playerInfo.class || "",
        position: playerInfo.position || ""
      };
    });
  };

  const matchStats = selectedMatch ? getMatchPlayerDetails(selectedMatch) : [];
  const teamAPlayers = matchStats.filter(p => p.class === selectedMatch?.teamA);
  const teamBPlayers = matchStats.filter(p => p.class === selectedMatch?.teamB);

  const getDivisionLabel = (div) => {
    if (div === '6') return '6-cı Siniflər';
    if (div === '7-8') return '7-8-ci Siniflər';
    if (div === '9-10') return '9-10-cu Siniflər';
    return '11-ci Siniflər';
  };

  const renderBracketMatch = (match, label, index) => {
    if (!match) {
      return html`
        <div className="border border-dashed border-gray-200 bg-gray-50/50 rounded-2xl p-4 flex flex-col justify-center items-center h-20 text-center w-52 select-none">
          <span className="text-[9px] text-purple-900/60 font-extrabold uppercase tracking-wider">${label} #${index + 1}</span>
          <span className="text-[10px] text-gray-300 font-bold mt-1">Təyin edilməyib</span>
        </div>
      `;
    }

    const isWinner = (team, score, penScore, otherScore, otherPenScore) => {
      const s1 = Number(score);
      const s2 = Number(otherScore);
      if (s1 > s2) return true;
      if (s1 < s2) return false;
      if (penScore !== null && otherPenScore !== null && penScore !== '' && otherPenScore !== '') {
        return Number(penScore) > Number(otherPenScore);
      }
      return false;
    };

    const isTeamAWinner = isWinner(match.teamA, match.scoreA, match.penaltyScoreA, match.scoreB, match.penaltyScoreB);
    const isTeamBWinner = isWinner(match.teamB, match.scoreB, match.penaltyScoreB, match.scoreA, match.penaltyScoreA);

    return html`
      <div 
        onClick=${() => setSelectedMatch(match)}
        className="bg-white border border-purple-100 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-purple-200 transition cursor-pointer flex flex-col justify-between w-52 h-20 relative select-none"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-900 rounded-l-2xl"></div>
        
        <!-- Team A -->
        <div className="flex justify-between items-center text-xs">
          <span className=${`font-extrabold truncate pr-2 ${isTeamAWinner ? 'text-green-600' : 'text-purple-950'}`}>
            ${match.teamA}
            ${isTeamAWinner && html`<i className="fas fa-circle-check text-[9px] ml-1 text-green-500"></i>`}
          </span>
          <span className="font-black text-purple-950">
            ${match.scoreA}
            ${(match.penaltyScoreA !== null && match.penaltyScoreA !== undefined && match.penaltyScoreA !== '') && html`
              <span className="text-[9px] text-green-500 font-bold ml-1">(${match.penaltyScoreA})</span>
            `}
          </span>
        </div>

        <div className="border-t border-gray-100 my-1"></div>

        <!-- Team B -->
        <div className="flex justify-between items-center text-xs">
          <span className=${`font-extrabold truncate pr-2 ${isTeamBWinner ? 'text-green-600' : 'text-purple-950'}`}>
            ${match.teamB}
            ${isTeamBWinner && html`<i className="fas fa-circle-check text-[9px] ml-1 text-green-500"></i>`}
          </span>
          <span className="font-black text-purple-950">
            ${match.scoreB}
            ${(match.penaltyScoreB !== null && match.penaltyScoreB !== undefined && match.penaltyScoreB !== '') && html`
              <span className="text-[9px] text-green-500 font-bold ml-1">(${match.penaltyScoreB})</span>
            `}
          </span>
        </div>
      </div>
    `;
  };

  return html`
    <div className="space-y-6 animate-fadeIn">
      <!-- Title & Filters Switcher -->
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-purple-950">Turnir Cədvəli - ${getDivisionLabel(activeDivision)}</h2>
          <p className="text-sm text-gray-500">Qrup mərhələsi xalları və pley-off mərhələsi püşkü</p>
        </div>
        
        <!-- View Switcher -->
        <div className="flex bg-purple-50 p-1.5 rounded-2xl border border-purple-100/50">
          <button
            onClick=${() => setViewMode('table')}
            className=${`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition whitespace-nowrap ${
              viewMode === 'table' 
                ? 'bg-purple-900 text-white shadow-sm' 
                : 'text-purple-950 hover:bg-purple-200/50'
            }`}
          >
            <i className="fas fa-list-ol mr-1.5"></i> Qrup Mərhələsi
          </button>
          <button
            onClick=${() => setViewMode('bracket')}
            className=${`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition whitespace-nowrap ${
              viewMode === 'bracket' 
                ? 'bg-purple-900 text-white shadow-sm' 
                : 'text-purple-950 hover:bg-purple-200/50'
            }`}
          >
            <i className="fas fa-sitemap mr-1.5"></i> Pley-off Toru
          </button>
        </div>
      </div>

      <!-- VIEW MODE 1: STANDINGS TABLE -->
      ${viewMode === 'table' && html`
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
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

      <!-- VIEW MODE 2: PLAYOFF BRACKET -->
      ${viewMode === 'bracket' && html`
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-8 justify-start p-6 bg-slate-50 border border-slate-100 rounded-3xl min-w-max items-stretch">
            
            <!-- Round of 16 -->
            ${has16 && html`
              <div className="flex flex-col justify-between py-2 space-y-6">
                <div className="text-[10px] font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wider text-center mb-2">16/1 Final</div>
                ${slots16.map((match, idx) => renderBracketMatch(match, '16/1', idx))}
              </div>
            `}

            <!-- Quarterfinals -->
            ${has8 && html`
              <div className="flex flex-col justify-around py-2 space-y-12">
                <div className="text-[10px] font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wider text-center mb-2">8/1 Final</div>
                ${slots8.map((match, idx) => renderBracketMatch(match, '8/1', idx))}
              </div>
            `}

            <!-- Semifinals -->
            <div className="flex flex-col justify-around py-2">
              <div className="text-[10px] font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wider text-center mb-2">Yarımfinal</div>
              ${slots4.map((match, idx) => renderBracketMatch(match, 'Yarımfinal', idx))}
            </div>

            <!-- Final -->
            <div className="flex flex-col justify-center py-2">
              <div className="text-[10px] font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wider text-center mb-2">Final</div>
              ${slots2.map((match, idx) => renderBracketMatch(match, 'Final', idx))}
            </div>

            <!-- Column 5: Tournament Champion & Team of the Tournament (Dream Team) -->
            <div className="flex flex-col justify-between py-2 ml-4 border-l-2 border-dashed border-purple-200/80 pl-8 w-80">
              
              <!-- Champion Badge Card -->
              <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-purple-950 p-5 rounded-3xl shadow-md border border-amber-300 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-amber-300/30 text-7xl font-black select-none">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-purple-950 text-amber-300 px-2.5 py-1 rounded-full inline-block mb-2 shadow-sm">
                    🏆 TURNİR QALİBİ
                  </span>
                  <h4 className="text-xl font-black tracking-tight text-purple-950 uppercase">
                    ${championTeam ? `${championTeam} Sinfi` : 'Müəyyənləşdirilir'}
                  </h4>
                  <p className="text-[11px] font-bold text-purple-900/80 mt-1">
                    ${activeYear} Mövsümü Çempionu
                  </p>
                </div>
              </div>

              <!-- Dream Team (Rəmzi 5-lik) Widget -->
              <div className="bg-white border border-purple-100 p-4 rounded-3xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center">
                    <i className="fas fa-star text-amber-400 mr-1.5 text-sm"></i> Rəmzi Komanda (TOP 5)
                  </h4>
                  <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Sofascore</span>
                </div>
                
                <div className="space-y-2 pt-1">
                  ${dreamTeam.length === 0 
                    ? html`<div className="text-[11px] text-gray-400 font-bold text-center py-2">Məlumat yoxdur</div>`
                    : dreamTeam.map((player, i) => html`
                      <div key=${player.id || i} className="flex items-center justify-between bg-purple-50/50 hover:bg-purple-100/50 p-2 rounded-xl transition border border-purple-100/40">
                        <div className="flex items-center space-x-2">
                          <span className=${`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                            i === 0 ? 'bg-amber-400 text-purple-950' : i === 1 ? 'bg-slate-300 text-purple-950' : i === 2 ? 'bg-amber-700 text-white' : 'bg-purple-200 text-purple-900'
                          }`}>
                            ${i + 1}
                          </span>
                          <div>
                            <div className="text-xs font-extrabold text-purple-950 leading-tight">${player.name}</div>
                            <div className="text-[9px] font-semibold text-gray-500">${player.class} • ${player.position || 'Oyunçu'}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">⚽ ${player.goals || 0}</span>
                          <span className=${`text-xs font-black px-2 py-0.5 rounded-lg ${getRatingClass(player.overallRating || 6.0)}`}>
                            ${player.overallRating || 6.0}
                          </span>
                        </div>
                      </div>
                    `)
                  }
                </div>
              </div>

              <!-- MVP & Golden Boot Awards -->
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-purple-900 to-purple-950 text-white p-3 rounded-2xl border border-purple-800">
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">⭐ MVP Oyunçu</span>
                  <div className="text-xs font-extrabold truncate mt-1">${mvpPlayer ? mvpPlayer.name : '-'}</div>
                  <div className="text-[9px] text-purple-200 mt-0.5">${mvpPlayer ? `${mvpPlayer.class} (${mvpPlayer.overallRating})` : '-'}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-900 to-purple-950 text-white p-3 rounded-2xl border border-purple-800">
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">👟 Qızıl Butsa</span>
                  <div className="text-xs font-extrabold truncate mt-1">${topScorer ? topScorer.name : '-'}</div>
                  <div className="text-[9px] text-purple-200 mt-0.5">${topScorer ? `${topScorer.class} (${topScorer.goals} Qol)` : '-'}</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      `}

      <!-- Match Details & Sofascore Rating Modal -->
      ${selectedMatch && html`
        <div className="fixed inset-0 z-50 overflow-y-auto bg-purple-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn relative">
            
            <!-- Modal Header -->
            <div className="bg-purple-900 text-white p-6 rounded-t-3xl flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-green-400 bg-purple-950/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  ${selectedMatch.stage} • Match Details
                </span>
                <h3 className="text-2xl font-black mt-2">
                  ${selectedMatch.teamA} ${selectedMatch.scoreA} - ${selectedMatch.scoreB} ${selectedMatch.teamB}
                  ${(selectedMatch.penaltyScoreA !== null && selectedMatch.penaltyScoreA !== undefined && selectedMatch.penaltyScoreA !== '') && html`
                    <span className="text-green-400 text-lg font-extrabold ml-2"> (pen. ${selectedMatch.penaltyScoreA} - ${selectedMatch.penaltyScoreB})</span>
                  `}
                </h3>
              </div>
              <button 
                onClick=${() => setSelectedMatch(null)}
                className="bg-purple-950 text-white hover:bg-red-600 transition w-8 h-8 rounded-full flex items-center justify-center font-bold"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-8">
              <!-- Video Highlights -->
              ${selectedMatch.videoUrl && html`
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-purple-950 flex items-center">
                    <i className="fab fa-youtube text-red-600 mr-2 text-xl"></i> Matçın İcmalı (Video)
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
                <div>
                  <h5 className="font-extrabold text-purple-950 text-base mb-2">${selectedMatch.teamA}</h5>
                  <div className="space-y-1 text-xs text-gray-500 font-semibold">
                    ${teamAPlayers.filter(p => p.goals > 0).map(p => html`
                      <div key=${p.playerId}>⚽ ${p.name} (${p.goals}')</div>
                    `)}
                    ${teamAPlayers.filter(p => p.goals === 0).length === 0 && teamAPlayers.filter(p => p.goals > 0).length === 0 ? '-' : ''}
                  </div>
                </div>
                <div className="border-r border-gray-200 h-12 my-auto"></div>
                <div>
                  <h5 className="font-extrabold text-purple-950 text-base mb-2">${selectedMatch.teamB}</h5>
                  <div className="space-y-1 text-xs text-gray-500 font-semibold">
                    ${teamBPlayers.filter(p => p.goals > 0).map(p => html`
                      <div key=${p.playerId}>⚽ ${p.name} (${p.goals}')</div>
                    `)}
                    ${teamBPlayers.filter(p => p.goals === 0).length === 0 && teamBPlayers.filter(p => p.goals > 0).length === 0 ? '-' : ''}
                  </div>
                </div>
              </div>

              <!-- Sofascore Ratings -->
              <div className="space-y-4">
                <h4 className="text-base font-bold text-purple-950 flex items-center border-l-4 border-green-500 pl-2">
                  Oyunçu Performansı və Sofascore Reytinqləri
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Team A Ratings -->
                  <div className="border border-purple-50 rounded-2xl p-4 bg-purple-50/10">
                    <h5 className="font-black text-purple-950 mb-3 border-b pb-2 text-sm">${selectedMatch.teamA} Heyəti</h5>
                    <div className="space-y-3">
                      ${teamAPlayers.length === 0 
                        ? html`<p className="text-xs text-gray-400 text-center py-4">Oyunçu statistikası qeyd edilməyib.</p>`
                        : teamAPlayers.map(player => html`
                            <div key=${player.playerId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                              <div>
                                <h6 className="font-bold text-purple-950 text-xs">${player.name}</h6>
                                <p className="text-[10px] text-gray-500">${player.position}</p>
                                <div className="flex gap-3 text-[10px] text-gray-500 font-semibold mt-1">
                                  <span>⚽ Qol: ${player.goals}</span>
                                  <span>👟 Asist: ${player.assists}</span>
                                  <span>⚙️ Ötürmə: ${player.passes}</span>
                                </div>
                              </div>
                              <span className=${`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${getRatingClass(player.rating)}`}>
                                ${player.rating}
                              </span>
                            </div>
                          `)}
                    </div>
                  </div>

                  <!-- Team B Ratings -->
                  <div className="border border-purple-50 rounded-2xl p-4 bg-purple-50/10">
                    <h5 className="font-black text-purple-950 mb-3 border-b pb-2 text-sm">${selectedMatch.teamB} Heyəti</h5>
                    <div className="space-y-3">
                      ${teamBPlayers.length === 0 
                        ? html`<p className="text-xs text-gray-400 text-center py-4">Oyunçu statistikası qeyd edilməyib.</p>`
                        : teamBPlayers.map(player => html`
                            <div key=${player.playerId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                              <div>
                                <h6 className="font-bold text-purple-950 text-xs">${player.name}</h6>
                                <p className="text-[10px] text-gray-500">${player.position}</p>
                                <div className="flex gap-3 text-[10px] text-gray-500 font-semibold mt-1">
                                  <span>⚽ Qol: ${player.goals}</span>
                                  <span>👟 Asist: ${player.assists}</span>
                                  <span>⚙️ Ötürmə: ${player.passes}</span>
                                </div>
                              </div>
                              <span className=${`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${getRatingClass(player.rating)}`}>
                                ${player.rating}
                              </span>
                            </div>
                          `)}
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
