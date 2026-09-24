/**
 * ============================================================================
 * FAYL ADI: components/Dashboard.js
 * MƏQSƏDİ: Turnirin Əsas Vitrini və İcmal İdarəetmə Paneli (Home / Dashboard)
 * 
 * BU KOMPONENTİN VƏZİFƏLƏRİ:
 *   1. Turnirin cari vəziyyəti: Komandaların sayı, oyunçuların sayı, vurulan qollar.
 *   2. Liderlər lövhəsi: Mövsümün ən yaxşı bombardiri və ən yüksək Sofascore reytinqli oyunçusu.
 *   3. Son oyunlar: Son keçirilmiş matçların hesabları və video icmalları.
 *   4. Sürətli keçidlər: Digər bölmələrə rahat istiqamətləndirmə.
 * 
 * PROPS:
 *   - activeYear: string (məs: '2022-2023')
 *   - activeDivision: string (məs: '10-11')
 *   - onNavigate: function (tab dəyişməsi)
 *   - onSelectPlayer: function (oyunçu profil modalını açmaq)
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle } from '../services/database.js';
import { t as fallbackT, getDivisionLabel as fallbackGetDivisionLabel, isMatchDivision } from '../services/i18n.js';

const html = htm.bind(React.createElement);

// Helper for rating colors (uses official Sofascore tiering)
const getRatingClass = (rating) => getSofascoreBadgeStyle(rating);

export default function Dashboard({ setActiveTab, activeDivision, activeYear, lang = 'en', t = (k) => fallbackT(k, lang), onOpenPlayerProfile }) {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalMatches: 0,
    totalGoals: 0,
    leader: '-'
  });
  const [topPlayers, setTopPlayers] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [topAssists, setTopAssists] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      const allPlayers = await db.getPlayers(activeYear);
      const allMatches = await db.getMatches(activeYear);
      const standings = await db.getStandings(activeDivision, activeYear);

      // Filter by division
      const players = allPlayers.filter(p => 
        isMatchDivision(p.division, activeDivision) &&
        !p.isOwnGoal &&
        !/avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || '')
      );
      const matches = allMatches.filter(m => isMatchDivision(m.division, activeDivision));

      // General Stats
      const totalPlayers = players.length;
      const totalMatches = matches.length;
      const totalGoals = matches.reduce((sum, m) => {
        const sA = Number(m.scoreA);
        const sB = Number(m.scoreB);
        return sum + (Number.isFinite(sA) ? sA : 0) + (Number.isFinite(sB) ? sB : 0);
      }, 0);
      const leader = standings[0] ? standings[0].class : '-';

      setStats({ totalPlayers, totalMatches, totalGoals, leader });

      // Top Players (by rating, min 1 match or scored goals/assists)
      const rankedPlayers = [...players]
        .filter(p => (p.matchesPlayed > 0 || p.goals > 0 || p.assists > 0))
        .sort((a, b) => b.overallRating - a.overallRating)
        .slice(0, 3);
      setTopPlayers(rankedPlayers);

      // Top Goal Scorers (only players with at least 1 goal)
      const scorers = [...players]
        .filter(p => Number(p.goals || 0) > 0)
        .sort((a, b) => b.goals - a.goals || b.overallRating - a.overallRating)
        .slice(0, 5);
      setTopScorers(scorers);

      // Top Assist Leaders (only players with at least 1 assist)
      const assists = [...players]
        .filter(p => Number(p.assists || 0) > 0)
        .sort((a, b) => b.assists - a.assists || b.overallRating - a.overallRating)
        .slice(0, 5);
      setTopAssists(assists);

      // Recent 3 matches
      const recent = [...matches]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
      setRecentMatches(recent);
    };

    loadDashboardData();
  }, [activeDivision, activeYear]);

  return html`
    <div className="space-y-8 animate-fadeIn">
      <!-- Welcome Banner -->
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 dark:bg-zinc-900 text-white p-6 sm:p-8 shadow-xl border border-zinc-800 transition-colors duration-200">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500 opacity-15 blur-3xl pointer-events-none"></div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 hidden md:block pointer-events-none">
          <img src="assets/tdv-logo.jpg" alt="" className="w-48 h-48 rounded-full object-cover filter grayscale" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ${fallbackGetDivisionLabel(activeDivision, lang)}
            </span>
            <span className="inline-block rounded-full bg-amber-500/20 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-widest">
              TDV BTL LİQA
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            ${t('welcomeTitle')}
          </h2>
          <p className="mt-2 text-zinc-300 text-sm md:text-base leading-relaxed">
            ${t('welcomeDesc')}
          </p>
        </div>
      </div>

      <!-- Quick Stats Bento Grid (Sofascore & UEFA Grade) -->
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-base sm:text-lg border border-blue-500/20">
            <i className="fas fa-users"></i>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate">${t('statTotalPlayers')}</p>
            <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">${stats.totalPlayers}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-base sm:text-lg border border-emerald-500/20">
            <i className="fas fa-running"></i>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate">${t('statTotalMatches')}</p>
            <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">${stats.totalMatches}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-zinc-200 dark:border-zinc-800 hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 text-base sm:text-lg border border-teal-500/20">
            <i className="fas fa-futbol"></i>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate">${t('statTotalGoals')}</p>
            <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">${stats.totalGoals}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-base sm:text-lg border border-amber-500/20">
            <i className="fas fa-trophy"></i>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate">${t('statLeader')}</p>
            <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white truncate">${stats.leader}</p>
          </div>
        </div>
      </div>

      <!-- Top Ranked Players (Sofascore Rating Showcase) -->
      <div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 border-l-4 border-emerald-500 pl-3">
          ${t('sofastarTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${topPlayers.length === 0 
            ? html`
                <div className="col-span-3 text-center py-8 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                  <p className="text-sm font-semibold">${t('noMatchesYet')}</p>
                </div>
              ` 
            : topPlayers.map((player, index) => html`
                <div key=${player.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex justify-between items-center relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                        #${index + 1}
                      </span>
                      <h4
                        onClick=${() => onOpenPlayerProfile && onOpenPlayerProfile(player.name)}
                        className="text-base font-bold text-zinc-900 dark:text-white cursor-pointer hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title=${lang === 'az' ? 'Karyera profilinə bax' : 'View career profile'}
                      >
                        ${player.name}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">${player.class} • ${player.position || ''}</p>
                    <div className="flex gap-3 mt-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      <span>⚽ ${player.goals} ${t('goals')}</span>
                      <span>👟 ${player.assists} ${t('assists')}</span>
                      <span>🏟️ ${player.matchesPlayed} ${t('matchesPlayed')}</span>
                    </div>
                  </div>
                  
                  <div className=${`w-14 h-14 rounded-full flex flex-col items-center justify-center font-black shadow-xs ${getRatingClass(player.overallRating)}`}>
                    <span className="text-lg leading-none">${player.overallRating}</span>
                    <span className="text-[9px] font-medium opacity-80 mt-0.5">${t('rating')}</span>
                  </div>
                </div>
              `)}
        </div>
      </div>

      <!-- Recent Match Results & Top Stats Grid -->
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Recent Matches -->
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xs border border-zinc-200 dark:border-zinc-800 transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">${t('recentMatches')}</h3>
            <button onClick=${() => setActiveTab('matches')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center space-x-1 cursor-pointer">
              <span>${t('viewAllMatches')}</span> <i className="fas fa-chevron-right text-[10px]"></i>
            </button>
          </div>
          <div className="space-y-3">
            ${recentMatches.length === 0 
              ? html`
                  <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                    <p className="text-sm font-medium">${t('noMatchesYet')}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">${t('noMatchesArchiveHint')}</p>
                  </div>
                ` 
              : recentMatches.map(match => html`
                  <div key=${match.id} className="p-3 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors flex justify-between items-center gap-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg uppercase whitespace-nowrap shrink-0">
                      ${match.stage}
                    </span>
                    <div className="flex flex-col items-center justify-center flex-1 min-w-0">
                      <div className="flex items-center justify-center space-x-2 sm:space-x-4 w-full">
                        <span className="font-extrabold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-zinc-100 w-12 sm:w-16 text-right truncate">${match.teamA}</span>
                        <div className="bg-zinc-900 dark:bg-zinc-950 text-white border border-zinc-700/50 rounded-lg px-2.5 sm:px-3 py-0.5 sm:py-1 font-black text-xs sm:text-sm md:text-base shadow-xs shrink-0">
                          ${match.scoreA} - ${match.scoreB}
                        </div>
                        <span className="font-extrabold text-xs sm:text-sm md:text-base text-zinc-900 dark:text-zinc-100 w-12 sm:w-16 text-left truncate">${match.teamB}</span>
                      </div>
                      ${(match.penaltyScoreA !== null && match.penaltyScoreA !== undefined && match.penaltyScoreA !== '') && html`
                        <span className="text-[8px] sm:text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">${t('penaltyShootout')} ${match.penaltyScoreA} - ${match.penaltyScoreB}</span>
                      `}
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden md:inline shrink-0">${match.date || t('dateNotSet')}</span>
                  </div>
                `)}
          </div>
        </div>

        <!-- Right: Stat Leaders (Goals & Assists) -->
        <div className="lg:col-span-5 grid grid-cols-1 gap-6">
          <!-- Top Goalscorers -->
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xs border border-zinc-200 dark:border-zinc-800 transition-colors duration-200">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center">
              <i className="fas fa-futbol text-emerald-500 mr-2"></i> ${t('topScorers')}
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              ${topScorers.length === 0 
                ? html`
                    <div className="py-6 text-center text-zinc-400 dark:text-zinc-500">
                      <p className="text-xs font-semibold">${t('noScorersYet')}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">${t('noScorersArchiveHint')}</p>
                    </div>
                  `
                : topScorers.map((player, index) => html`
                    <div key=${player.id} className="py-2.5 flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-zinc-500 dark:text-zinc-400 w-4">${index + 1}</span>
                        <div>
                          <p
                            onClick=${() => onOpenPlayerProfile && onOpenPlayerProfile(player.name)}
                            className="font-bold text-zinc-900 dark:text-white cursor-pointer hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            title=${lang === 'az' ? 'Karyera profilinə bax' : 'View career profile'}
                          >
                            ${player.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">${player.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="goal-badge px-2.5 py-1 rounded-lg text-xs font-black tracking-wide flex items-center space-x-1.5 border shadow-xs">
                          <span>⚽</span>
                          <span className="font-extrabold">${player.goals} ${t('goals')}</span>
                        </span>
                        <span className=${`text-xs font-black px-2 py-0.5 rounded-md min-w-[2.4rem] text-center shadow-xs ${getRatingClass(player.overallRating)}`}>
                          ${player.overallRating}
                        </span>
                      </div>
                    </div>
                  `)}
            </div>
          </div>

          <!-- Top Assists -->
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xs border border-zinc-200 dark:border-zinc-800 transition-colors duration-200">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center">
              <i className="fas fa-hands-helping text-emerald-500 mr-2"></i> ${t('topAssists')}
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              ${topAssists.length === 0 
                ? html`<p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4 font-semibold">${t('noAssistsYet')}</p>`
                : topAssists.map((player, index) => html`
                    <div key=${player.id} className="py-2.5 flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-zinc-500 dark:text-zinc-400 w-4">${index + 1}</span>
                        <div>
                          <p
                            onClick=${() => onOpenPlayerProfile && onOpenPlayerProfile(player.name)}
                            className="font-bold text-zinc-900 dark:text-white cursor-pointer hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            title=${lang === 'az' ? 'Karyera profilinə bax' : 'View career profile'}
                          >
                            ${player.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">${player.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="assist-badge px-2.5 py-1 rounded-lg text-xs font-black tracking-wide flex items-center space-x-1.5 border shadow-xs">
                          <span>👟</span>
                          <span className="font-extrabold">${player.assists} ${t('assists')}</span>
                        </span>
                        <span className=${`text-xs font-black px-2 py-0.5 rounded-md min-w-[2.4rem] text-center shadow-xs ${getRatingClass(player.overallRating)}`}>
                          ${player.overallRating}
                        </span>
                      </div>
                    </div>
                  `)}
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
