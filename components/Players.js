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

  // When division or year changes, reset class selection
  useEffect(() => {
    setSelectedClass('All');
  }, [activeDivision, activeYear]);

  // Filter classes & players by active division context
  const activeClasses = classes.filter(c => c.division === activeDivision);
  const activePlayers = players.filter(p => p.division === activeDivision);

  const filteredPlayers = activePlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'All' || player.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getDivisionLabel = (div) => {
    if (div === '6') return '6-cı Siniflər';
    if (div === '7-8') return '7-8-ci Siniflər';
    if (div === '9-10') return '9-10-cu Siniflər';
    return '11-ci Siniflər';
  };

  return html`
    <div className="space-y-6 animate-fadeIn">
      <!-- Title & Header -->
      <div>
        <h2 className="text-2xl font-black text-purple-950 font-sans">Oyunçular & Reytinqlər - ${getDivisionLabel(activeDivision)}</h2>
        <p className="text-sm text-gray-500">Bu turnir qrupu üzrə iştirakçıların statistikası</p>
      </div>

      <!-- Filters Panel -->
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <!-- Search bar -->
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

        <!-- Class Filter Dropdown -->
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
        ${filteredPlayers.length === 0 
          ? html`
              <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                Axtarışa uyğun heç bir oyunçu tapılmadı.
              </div>
            `
          : filteredPlayers.map(player => html`
              <div 
                key=${player.id} 
                className="sport-card-hover bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
              >
                <!-- Decorative Top Edge color bar -->
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-900 to-purple-800"></div>
                
                <!-- Player Details -->
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-wider">
                      ${player.class} Sinfi
                    </span>
                    <h3 className="text-lg font-black text-purple-950 mt-1.5 leading-snug">${player.name}</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">${player.position}</p>
                  </div>
                  
                  <div className=${`w-12 h-12 rounded-full flex flex-col items-center justify-center font-black shadow-inner ${getRatingClass(player.overallRating)}`}>
                    <span className="text-sm leading-none">${player.overallRating}</span>
                    <span className="text-[8px] font-semibold opacity-80 mt-0.5">Rating</span>
                  </div>
                </div>

                <!-- Career Statistics -->
                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Oyun</span>
                    <span className="text-base font-extrabold text-purple-950">${player.matchesPlayed}</span>
                  </div>
                  <div className="border-x border-gray-200">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Qol</span>
                    <span className="text-base font-extrabold text-green-700">⚽ ${player.goals}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Asist</span>
                    <span className="text-base font-extrabold text-purple-900">👟 ${player.assists}</span>
                  </div>
                </div>
              </div>
            `)}
      </div>
    </div>
  `;
}
