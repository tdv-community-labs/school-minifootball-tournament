import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle } from '../services/database.js';

const html = htm.bind(React.createElement);

export default function Players({ activeDivision, activeYear }) {
  const [players, setPlayers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');

  useEffect(() => {
    const loadPlayersData = async () => {
      const allPlayers = await db.getPlayers(activeYear);
      const allClasses = await db.getClasses(activeYear);
      setPlayers(allPlayers);
      setClasses(allClasses);
    };
    loadPlayersData();
  }, [activeDivision, activeYear]);

  useEffect(() => {
    setSelectedClass('All');
  }, [activeDivision, activeYear]);

  const activeClasses = classes.filter(c => c.division === activeDivision);
  const activePlayers = players.filter(p => p.division === activeDivision);

  const filteredPlayers = activePlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'All' || player.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Sort by overall rating descending, then goals descending
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if ((b.overallRating || 0) !== (a.overallRating || 0)) return (b.overallRating || 0) - (a.overallRating || 0);
    return (b.goals || 0) - (a.goals || 0);
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

  return html`
    <div className="space-y-6 animate-fadeIn">
      <!-- Title & Header -->
      <div>
        <h2 className="text-2xl font-black text-purple-950 font-sans">Oyunçular & Reytinqlər — ${getDivisionLabel(activeDivision)}</h2>
        <p className="text-sm text-gray-500">Sofascore reytinq sistemi ilə hesablanmış performans statistikası</p>
      </div>

      <!-- Filters Panel -->
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <i className="fas fa-search text-xs"></i>
          </span>
          <input
            type="text"
            value=${searchTerm}
            onChange=${(e) => setSearchTerm(e.target.value)}
            placeholder="Oyunçu adı axtar..."
            className="w-full bg-gray-50 border border-gray-200 text-purple-950 text-xs rounded-2xl focus:ring-purple-900 focus:border-purple-900 block pl-10 pr-3 py-3"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value=${selectedClass}
            onChange=${(e) => setSelectedClass(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-purple-950 text-xs rounded-2xl focus:ring-purple-900 focus:border-purple-900 block p-3 font-semibold"
          >
            <option value="All">Bütün Siniflər</option>
            ${activeClasses.map(cls => html`
              <option key=${cls.id} value=${cls.name}>${cls.name} Sinfi</option>
            `)}
          </select>
        </div>
      </div>

      <!-- Players Cards Grid -->
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${sortedPlayers.length === 0 
          ? html`
              <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                Axtarışa uyğun heç bir oyunçu tapılmadı.
              </div>
            `
          : sortedPlayers.map((player, idx) => {
              const rating = player.overallRating || 6.5;
              const badgeClass = getSofascoreBadgeStyle(rating);
              const isKeeper = player.isKeeper ||
                (player.position || '').toLowerCase().includes('qap');

              const rankColors = [
                'bg-yellow-400 text-yellow-900',
                'bg-gray-300 text-gray-700',
                'bg-amber-600 text-white'
              ];

              return html`
                <div
                  key=${player.id}
                  className="sport-card-hover bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
                >
                  <!-- Top colour bar -->
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-900 to-purple-800"></div>

                  <!-- Top-3 rank medal -->
                  ${idx < 3 ? html`
                    <div className=${"absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shadow " + rankColors[idx]}>
                      ${idx + 1}
                    </div>
                  ` : null}

                  <!-- Player Details row -->
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          ${player.class} Sinfi
                        </span>
                        ${isKeeper ? html`
                          <span className="text-[10px] font-black text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded uppercase tracking-wider">
                            🧤 Qapıçı
                          </span>
                        ` : null}
                      </div>
                      <h3 className="text-base font-black text-purple-950 mt-1.5 leading-snug">${player.name}</h3>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">${player.position || '—'}</p>
                    </div>

                    <!-- Sofascore badge -->
                    <div className=${"min-w-[3.5rem] h-14 rounded-2xl flex flex-col items-center justify-center px-2 shadow-md " + badgeClass}>
                      <span className="text-base leading-none">${rating}</span>
                      <span className="text-[8px] font-semibold opacity-80 mt-0.5">Rating</span>
                    </div>
                  </div>

                  <!-- Stats row -->
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Oyun</span>
                      <span className="text-base font-extrabold text-purple-950">${player.matchesPlayed || 0}</span>
                    </div>
                    <div className="border-x border-gray-200">
                      ${isKeeper
                        ? html`
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Qurtarış</span>
                          <span className="text-base font-extrabold text-sky-700">🧤 ${player.saves || 0}</span>
                        `
                        : html`
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Qol</span>
                          <span className="text-base font-extrabold text-green-700">⚽ ${player.goals || 0}</span>
                        `
                      }
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Asist</span>
                      <span className="text-base font-extrabold text-purple-900">👟 ${player.assists || 0}</span>
                    </div>
                  </div>
                </div>
              `;
            })
        }
      </div>
    </div>
  `;
}
