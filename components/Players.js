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
import { EmptyState, Skeleton } from './ui.js?v=2026';
import { t as fallbackT, getDivisionLabel as fallbackGetDivisionLabel, isMatchDivision } from '../services/i18n.js';

const html = htm.bind(React.createElement);

export default function Players({ activeDivision, activeYear, lang = 'en', t = (k) => fallbackT(k, lang), onOpenPlayerProfile }) {
  const [players, setPlayers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayersData = async () => {
      const allPlayers = await db.getPlayers(activeYear);
      const allClasses = await db.getClasses(activeYear);
      setPlayers(allPlayers);
      setClasses(allClasses);
      setLoading(false);
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
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white font-sans tabular-nums tracking-tight">${t('playersTitle')} — ${getDivisionLabel(activeDivision)}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">${lang === 'az' ? 'Sofascore reytinq sistemi ilə hesablanmış performans statistikası' : 'Performance statistics evaluated with the Sofascore rating engine'}</p>
      </div>

      <!-- Filters Panel -->
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch transition-colors duration-200">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
            <i className="fas fa-search text-xs"></i>
          </span>
          <input
            type="text"
            value=${searchTerm}
            onChange=${(e) => setSearchTerm(e.target.value)}
            placeholder=${t('searchPlayerPlaceholder')}
            className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 text-xs rounded-2xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 block pl-10 pr-3 py-3 transition"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value=${selectedClass}
            onChange=${(e) => setSelectedClass(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs rounded-2xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 block p-3 font-semibold transition cursor-pointer"
          >
            <option value="All" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">${t('filterClassAll')}</option>
            ${activeClasses.map(cls => html`
              <option key=${cls.id} value=${cls.name} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">${cls.name} ${lang === 'az' ? 'Sinfi' : 'Grade'}</option>
            `)}
          </select>
        </div>
      </div>

      <!-- Players Cards Grid -->
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${sortedPlayers.length === 0 
          ? html`
              <div className="col-span-3 text-center py-12 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 tabular-nums tracking-tight">
                ${t('noPlayersFound')}
              </div>
            `
          : sortedPlayers.map((player, idx) => {
              const rating = player.overallRating || 6.5;
              const badgeClass = getSofascoreBadgeStyle(rating);
              const isKeeper = player.isKeeper ||
                (player.position || '').toLowerCase().includes('qap');

              const rankColors = [
                'bg-amber-400 text-zinc-950',
                'bg-zinc-300 text-zinc-950',
                'bg-amber-700 text-white'
              ];

              return html`
                <div
                  key=${player.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                >
                  <!-- Top colour bar -->
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>

                  <!-- Top-3 rank medal -->
                  ${idx < 3 ? html`
                    <div className=${"absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shadow-xs " + rankColors[idx]}>
                      ${idx + 1}
                    </div>
                  ` : null}

                  <!-- Player Details row -->
                  <div className="flex justify-between items-start mb-4 sm:mb-6 gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 px-2 py-0.5 rounded-lg uppercase tracking-wider tabular-nums tracking-tight">
                          ${player.class} Sinfi
                        </span>
                        ${isKeeper ? html`
                          <span className="text-[10px] font-black text-sky-700 dark:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg uppercase tracking-wider tabular-nums tracking-tight">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 11V4a2 2 0 0 0-4 0v7M10 11V5a2 2 0 0 0-4 0v6M6 11V7a2 2 0 0 0-4 0v9a8 8 0 0 0 16 0v-4a2 2 0 0 0-4 0v-1"></path></svg> ${lang === 'az' ? 'Qapıçı' : 'Goalkeeper'}
                          </span>
                        ` : null}
                      </div>
                      <h3
                        onClick=${() => onOpenPlayerProfile && onOpenPlayerProfile(player.name)}
                        className="text-base font-black text-zinc-900 dark:text-white mt-1.5 leading-snug cursor-pointer hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 tabular-nums tracking-tight"
                        title=${lang === 'az' ? 'Karyera profilinə bax' : 'View career profile'}
                      >
                        ${player.name}
                        <i className="fas fa-arrow-up-right-from-square text-[10px] text-zinc-400 opacity-60"></i>
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">${player.position || '—'}</p>
                    </div>

                    <!-- Sofascore badge -->
                    <div className=${"min-w-[3.5rem] h-14 rounded-2xl flex flex-col items-center justify-center px-2 shadow-xs " + badgeClass}>
                      <span className="text-base leading-none">${rating}</span>
                      <span className="text-[8px] font-semibold opacity-80 mt-0.5">${t('rating')}</span>
                    </div>
                  </div>

                  <!-- Stats row -->
                  <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 text-center tabular-nums tracking-tight">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">${t('matchesPlayed')}</span>
                      <span className="text-base font-extrabold text-zinc-900 dark:text-white">${player.matchesPlayed || 0}</span>
                    </div>
                    <div className="border-x border-zinc-200 dark:border-zinc-700/60">
                      ${isKeeper
                        ? html`
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">${lang === 'az' ? 'Qurtarış' : 'Saves'}</span>
                          <span className="text-base font-extrabold text-sky-600 dark:text-sky-400"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 11V4a2 2 0 0 0-4 0v7M10 11V5a2 2 0 0 0-4 0v6M6 11V7a2 2 0 0 0-4 0v9a8 8 0 0 0 16 0v-4a2 2 0 0 0-4 0v-1"></path></svg> ${player.saves || 0}</span>
                        `
                        : html`
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">${t('goals')}</span>
                          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/><path d="M12 12l3.5-2m-7 4l3.5-2m0 0v4m-3.5-2h7"></path></svg> ${player.goals || 0}</span>
                        `
                      }
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">${t('assists')}</span>
                      <span className="text-base font-extrabold text-zinc-900 dark:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><path d="M4 16v-2.38C4 11.5 5.97 10 8 10h.88c1.33 0 2.6-.53 3.54-1.46L13.8 7.15A2 2 0 0 1 15.2 6.57h1.46c.74 0 1.34.6 1.34 1.34V9.6c0 .48.16.94.46 1.3l2.08 2.6c.3.37.46.83.46 1.3v1.2c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2z"></path></svg> ${player.assists || 0}</span>
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
