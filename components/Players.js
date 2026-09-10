/**
 * ============================================================================
 * FAYL ADI: components/Players.js
 * MƏQSƏDİ: Bütün Turnir Oyunçularının Kataloqu və Reytinq Kartları
 * 
 * BU KOMPONENTİN VƏZİFƏLƏRİ:
 *   1. Oyunçuların ada, sinfə və mövqeyə (Hücumçu, Yarımmüdafiəçi, Müdafiəçi, Qapıçı) görə süzgəci.
 *   2. Hər oyunçunun Sofascore canlı reytinq nişanı, qol, assist və oyun sayı.
 *   3. Kart üzərinə kliklədikdə oyunçunun tam fərdi karyera profilinin açılması.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle } from '../services/database.js';
import { t as fallbackT, getDivisionLabel as fallbackGetDivisionLabel, isMatchDivision } from '../services/i18n.js';

const html = htm.bind(React.createElement);

export default function Players({ activeDivision, activeYear, lang = 'en', t = (k) => fallbackT(k, lang), onOpenPlayerProfile }) {
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

  const activeClasses = classes.filter(c => isMatchDivision(c.division, activeDivision));
  const activePlayers = players.filter(p => 
    isMatchDivision(p.division, activeDivision) &&
    !p.isOwnGoal &&
    !/avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || '')
  );

  // Guarantee strict uniqueness per card
  const seenPlayerKeys = new Set();
  const uniqueActivePlayers = [];
  activePlayers.forEach(p => {
    const key = p.id || `${p.name}_${p.class}_${p.year}`;
    if (!seenPlayerKeys.has(key)) {
      seenPlayerKeys.add(key);
      uniqueActivePlayers.push(p);
    }
  });

  const filteredPlayers = uniqueActivePlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'All' || player.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Sort by overall rating descending, then goals descending
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if ((b.overallRating || 0) !== (a.overallRating || 0)) return (b.overallRating || 0) - (a.overallRating || 0);
    return (b.goals || 0) - (a.goals || 0);
  });

  const getDivisionLabel = (div) => fallbackGetDivisionLabel(div, lang);

  return html`
    <div className="space-y-6 animate-fadeIn">
      <!-- Title & Header -->
      <div>
        <h2 className="text-2xl font-black text-purple-950 font-sans">${t('playersTitle')} — ${getDivisionLabel(activeDivision)}</h2>
        <p className="text-sm text-gray-500">${lang === 'az' ? 'Sofascore reytinq sistemi ilə hesablanmış performans statistikası' : 'Performance statistics evaluated with the Sofascore rating engine'}</p>
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
            placeholder=${t('searchPlayerPlaceholder')}
            className="w-full bg-gray-50 border border-gray-200 text-purple-950 text-xs rounded-2xl focus:ring-purple-900 focus:border-purple-900 block pl-10 pr-3 py-3"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value=${selectedClass}
            onChange=${(e) => setSelectedClass(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-purple-950 text-xs rounded-2xl focus:ring-purple-900 focus:border-purple-900 block p-3 font-semibold"
          >
            <option value="All">${t('filterClassAll')}</option>
            ${activeClasses.map(cls => html`
              <option key=${cls.id} value=${cls.name}>${cls.name} ${lang === 'az' ? 'Sinfi' : 'Grade'}</option>
            `)}
          </select>
        </div>
      </div>

      <!-- Players Cards Grid -->
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${sortedPlayers.length === 0 
          ? html`
              <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                ${t('noPlayersFound')}
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
                  className="sport-card-hover bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
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
                  <div className="flex justify-between items-start mb-4 sm:mb-6 gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          ${player.class} Sinfi
                        </span>
                        ${isKeeper ? html`
                          <span className="text-[10px] font-black text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded uppercase tracking-wider">
                            🧤 ${lang === 'az' ? 'Qapıçı' : 'Goalkeeper'}
                          </span>
                        ` : null}
                      </div>
                      <h3
                        onClick=${() => onOpenPlayerProfile && onOpenPlayerProfile(player.name)}
                        className="text-base font-black text-purple-950 dark:text-purple-200 mt-1.5 leading-snug cursor-pointer hover:underline hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1.5"
                        title=${lang === 'az' ? 'Karyera profilinə bax' : 'View career profile'}
                      >
                        ${player.name}
                        <i className="fas fa-arrow-up-right-from-square text-[10px] text-purple-400 opacity-60"></i>
                      </h3>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">${player.position || '—'}</p>
                    </div>

                    <!-- Sofascore badge -->
                    <div className=${"min-w-[3.5rem] h-14 rounded-2xl flex flex-col items-center justify-center px-2 shadow-md " + badgeClass}>
                      <span className="text-base leading-none">${rating}</span>
                      <span className="text-[8px] font-semibold opacity-80 mt-0.5">${t('rating')}</span>
                    </div>
                  </div>

                  <!-- Stats row -->
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">${t('matchesPlayed')}</span>
                      <span className="text-base font-extrabold text-purple-950">${player.matchesPlayed || 0}</span>
                    </div>
                    <div className="border-x border-gray-200 dark:border-slate-800">
                      ${isKeeper
                        ? html`
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">${lang === 'az' ? 'Qurtarış' : 'Saves'}</span>
                          <span className="text-base font-extrabold text-sky-700 dark:text-sky-400">🧤 ${player.saves || 0}</span>
                        `
                        : html`
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">${t('goals')}</span>
                          <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">⚽ ${player.goals || 0}</span>
                        `
                      }
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">${t('assists')}</span>
                      <span className="text-base font-extrabold text-purple-900 dark:text-purple-300">👟 ${player.assists || 0}</span>
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
