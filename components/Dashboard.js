import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db } from '../services/database.js';
import { t as fallbackT, getDivisionLabel as fallbackGetDivisionLabel } from '../services/i18n.js';

const html = htm.bind(React.createElement);

// Helper for rating colors
const getRatingClass = (rating) => {
  if (rating >= 8.5) return 'rating-sofascore-legendary';
  if (rating >= 7.5) return 'rating-sofascore-excellent';
  if (rating >= 6.5) return 'rating-sofascore-good';
  if (rating >= 5.5) return 'rating-sofascore-average';
  return 'rating-sofascore-bad';
};

export default function Dashboard({ setActiveTab, activeDivision, activeYear, lang = 'en', t = (k) => fallbackT(k, lang) }) {
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
      const players = allPlayers.filter(p => p.division === activeDivision);
      const matches = allMatches.filter(m => m.division === activeDivision);

      // General Stats
      const totalPlayers = players.length;
      const totalMatches = matches.length;
      const totalGoals = matches.reduce((sum, m) => sum + Number(m.scoreA || 0) + Number(m.scoreB || 0), 0);
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-purple-800 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-green-500 opacity-10 blur-2xl"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="mb-2 inline-block rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400 uppercase tracking-widest">
            ${fallbackGetDivisionLabel(activeDivision, lang)}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            ${t('welcomeTitle')}
          </h2>
          <p className="mt-2 text-purple-200 text-sm md:text-base">
            ${t('welcomeDesc')}
          </p>
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 shadow-sm border border-purple-100 flex items-center space-x-4">
          <div className="rounded-xl bg-purple-100 p-3 text-purple-900">
            <i className="fas fa-users text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">${t('statTotalPlayers')}</p>
            <p className="text-2xl font-black text-purple-950">${stats.totalPlayers}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-sm border border-purple-100 flex items-center space-x-4">
          <div className="rounded-xl bg-purple-100 p-3 text-purple-900">
            <i className="fas fa-running text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">${t('statTotalMatches')}</p>
            <p className="text-2xl font-black text-purple-950">${stats.totalMatches}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-sm border border-purple-100 flex items-center space-x-4">
          <div className="rounded-xl bg-purple-100 p-3 text-purple-900">
            <i className="fas fa-futbol text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">${t('statTotalGoals')}</p>
            <p className="text-2xl font-black text-purple-950">${stats.totalGoals}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-sm border border-purple-100 flex items-center space-x-4">
          <div className="rounded-xl bg-green-100 p-3 text-green-700">
            <i className="fas fa-trophy text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">${t('statLeader')}</p>
            <p className="text-2xl font-black text-purple-950">${stats.leader}</p>
          </div>
        </div>
      </div>

      <!-- Top Ranked Players (Sofascore Rating Showcase) -->
      <div>
        <h3 className="text-xl font-bold text-purple-900 mb-4 border-l-4 border-green-500 pl-2">
          ${t('sofastarTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${topPlayers.length === 0 
            ? html`
                <div className="col-span-3 text-center py-6 text-gray-400 bg-white rounded-2xl border border-dashed">
                  ${t('noMatchesYet')}
                </div>
              ` 
            : topPlayers.map((player, index) => html`
                <div key=${player.id} className="sport-card-hover bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-900"></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-extrabold text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded">
                        #${index + 1}
                      </span>
                      <h4 className="text-base font-bold text-purple-950">${player.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">${player.class} • ${player.position || ''}</p>
                    <div className="flex gap-3 mt-3 text-xs font-semibold text-gray-600">
                      <span>⚽ ${player.goals} ${t('goals')}</span>
                      <span>👟 ${player.assists} ${t('assists')}</span>
                      <span>🏟️ ${player.matchesPlayed} ${t('matchesPlayed')}</span>
                    </div>
                  </div>
                  
                  <div className=${`w-14 h-14 rounded-full flex flex-col items-center justify-center font-black shadow-md ${getRatingClass(player.overallRating)}`}>
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
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-purple-950">${t('recentMatches')}</h3>
            <button onClick=${() => setActiveTab('matches')} className="text-xs font-bold text-purple-900 hover:text-green-600 transition flex items-center space-x-1">
              <span>${t('viewAllMatches')}</span> <i className="fas fa-chevron-right text-[10px]"></i>
            </button>
          </div>
          <div className="space-y-3">
            ${recentMatches.length === 0 
              ? html`
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm font-medium">${t('noMatchesYet')}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1">${t('noMatchesArchiveHint')}</p>
                  </div>
                ` 
              : recentMatches.map(match => html`
                  <div key=${match.id} className="p-4 rounded-2xl bg-gray-50 hover:bg-purple-50/50 border border-gray-100 transition flex justify-between items-center">
                    <span className="text-[10px] font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded uppercase whitespace-nowrap">
                      ${match.stage}
                    </span>
                    <div className="flex flex-col items-center justify-center flex-1">
                      <div className="flex items-center justify-center space-x-4">
                        <span className="font-extrabold text-sm md:text-base text-purple-950 w-16 text-right">${match.teamA}</span>
                        <div className="bg-purple-950 text-white rounded-lg px-3 py-1 font-black text-sm md:text-base shadow-sm">
                          ${match.scoreA} - ${match.scoreB}
                        </div>
                        <span className="font-extrabold text-sm md:text-base text-purple-950 w-16 text-left">${match.teamB}</span>
                      </div>
                      ${(match.penaltyScoreA !== null && match.penaltyScoreA !== undefined && match.penaltyScoreA !== '') && html`
                        <span className="text-[9px] text-green-600 font-extrabold mt-0.5">${t('penaltyShootout')} ${match.penaltyScoreA} - ${match.penaltyScoreB}</span>
                      `}
                    </div>
                    <span className="text-xs text-gray-400 hidden md:inline">${match.date || t('dateNotSet')}</span>
                  </div>
                `)}
          </div>
        </div>

        <!-- Right: Stat Leaders (Goals & Assists) -->
        <div className="lg:col-span-5 grid grid-cols-1 gap-6">
          <!-- Top Goalscorers -->
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-purple-950 mb-3 flex items-center">
              <i className="fas fa-futbol text-green-500 mr-2"></i> ${t('topScorers')}
            </h3>
            <div className="divide-y divide-gray-100">
              ${topScorers.length === 0 
                ? html`
                    <div className="py-6 text-center text-gray-400">
                      <p className="text-xs">${t('noScorersYet')}</p>
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1">${t('noScorersArchiveHint')}</p>
                    </div>
                  `
                : topScorers.map((player, index) => html`
                    <div key=${player.id} className="py-2.5 flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-purple-900 w-4">${index + 1}</span>
                        <div>
                          <p className="font-bold text-purple-950">${player.name}</p>
                          <p className="text-xs text-gray-400">${player.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-extrabold text-purple-950 bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                          ⚽ ${player.goals} ${t('goals')}
                        </span>
                        <span className=${`text-xs font-bold px-1.5 py-0.5 rounded ${getRatingClass(player.overallRating)}`}>
                          ${player.overallRating}
                        </span>
                      </div>
                    </div>
                  `)}
            </div>
          </div>

          <!-- Top Assists -->
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-purple-950 mb-3 flex items-center">
              <i className="fas fa-hands-helping text-green-500 mr-2"></i> ${t('topAssists')}
            </h3>
            <div className="divide-y divide-gray-100">
              ${topAssists.length === 0 
                ? html`<p className="text-xs text-gray-400 text-center py-4">${t('noAssistsYet')}</p>`
                : topAssists.map((player, index) => html`
                    <div key=${player.id} className="py-2.5 flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-purple-900 w-4">${index + 1}</span>
                        <div>
                          <p className="font-bold text-purple-950">${player.name}</p>
                          <p className="text-xs text-gray-400">${player.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-extrabold text-purple-950 bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                          👟 ${player.assists} ${t('assists')}
                        </span>
                        <span className=${`text-xs font-bold px-1.5 py-0.5 rounded ${getRatingClass(player.overallRating)}`}>
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
