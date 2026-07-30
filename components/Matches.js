import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db } from '../services/database.js';

const html = htm.bind(React.createElement);

// Helper for rating colors
const getRatingClass = (rating) => {
  if (rating >= 8.5) return 'rating-sofascore-legendary';
  if (rating >= 7.5) return 'rating-sofascore-excellent';
  if (rating >= 6.5) return 'rating-sofascore-good';
  if (rating >= 5.5) return 'rating-sofascore-average';
  return 'rating-sofascore-bad';
};

export default function Matches({ activeDivision, activeYear }) {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedStage, setSelectedStage] = useState('Qrup Mərhələsi');
  const [selectedMatch, setSelectedMatch] = useState(null);

  const stages = [
    { id: 'Qrup Mərhələsi', label: 'Qrup' },
    { id: '16/1 Final', label: '16/1 Final' },
    { id: '8/1 Final', label: '8/1 Final' },
    { id: '4/1 Final', label: '4/1 Final' },
    { id: 'Yarımfinal', label: 'Yarımfinal' },
    { id: 'Final', label: 'Final' }
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

  // Filter matches by active division and selected stage
  const filteredMatches = matches.filter(m => m.division === activeDivision && m.stage === selectedStage);

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
    if (div === '7') return '7-ci Siniflər';
    if (div === '8') return '8-ci Siniflər';
    if (div === '9') return '9-cu Siniflər';
    if (div === '10-11') return '10-11-ci Siniflər';
    if (div === '7-8') return '7-8-ci Siniflər';
    if (div === '9-10') return '9-10-cu Siniflər';
    return '11-ci Siniflər';
  };

  return html`
    <div className="space-y-6 animate-fadeIn">
      <!-- Title & Filters -->
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-purple-950 font-sans">Matçlar & Video - ${getDivisionLabel(activeDivision)}</h2>
          <p className="text-sm text-gray-500">Mərhələlər üzrə oyunlar, arxiv videolar və Sofascore reytinqləri</p>
        </div>
        
        <!-- Stage Tabs -->
        <div className="flex bg-purple-50 p-1.5 rounded-2xl border border-purple-100 overflow-x-auto max-w-full">
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
                Bu mərhələdə hələ heç bir matç qeydə alınmayıb.
              </div>
            `
          : filteredMatches.map(match => html`
              <div 
                key=${match.id}
                onClick=${() => setSelectedMatch(match)}
                className="sport-card-hover bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm cursor-pointer flex flex-col justify-between"
              >
                <!-- Match Card Top -->
                <div className="p-6 bg-gradient-to-b from-purple-50/50 to-white">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      ${match.stage}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center">
                      <i className="far fa-calendar-alt mr-1.5"></i> ${match.date || 'Tarix təyin edilməyib'}
                    </span>
                  </div>

                  <!-- Score Display -->
                  <div className="flex items-center justify-between py-4">
                    <div className="text-center flex-1">
                      <h4 className="text-lg font-black text-purple-950">${match.teamA}</h4>
                      <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">Ev sahibi</span>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      <div className="bg-purple-950 text-white rounded-2xl px-5 py-2 font-black text-2xl shadow-md border-b-4 border-green-500 flex flex-col items-center">
                        <span>${match.scoreA} - ${match.scoreB}</span>
                        ${(match.penaltyScoreA !== null && match.penaltyScoreA !== undefined && match.penaltyScoreA !== '') && html`
                          <span className="text-[10px] text-green-400 font-extrabold mt-0.5">pen. ${match.penaltyScoreA} - ${match.penaltyScoreB}</span>
                        `}
                      </div>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-2">
                        Bitti
                      </span>
                    </div>
                    <div className="text-center flex-1">
                      <h4 className="text-lg font-black text-purple-950">${match.teamB}</h4>
                      <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">Qonaq</span>
                    </div>
                  </div>
                </div>

                <!-- Match Card Bottom -->
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-purple-950">
                  <span className="flex items-center text-gray-500">
                    <i className="fas fa-chart-line text-green-500 mr-1.5 text-sm"></i>
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
