/**
 * ============================================================================
 * FAYL ADI: components/Matches.js
 * MƏQSƏDİ: Matçların Tam Siyahısı, Turlar Üzrə Filtrləmə və Video İcmallar
 * 
 * BU KOMPONENTİN VƏZİFƏLƏRİ:
 *   1. Oyunların xronoloji və turlar üzrə qruplaşdırılmış kartları.
 *   2. Canlı hesablar, qol vuran oyunçuların siyahısı və Sofascore fərdi matç xalları.
 *   3. Təhlükəsiz YouTube inteqrasiyası ilə oyunların tam video yazılarını izləmək.
 *   4. Mərhələ filtri (Qrup, 1/4 Final, Yarımfinal, Final).
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { Skeleton } from './ui.js?v=2026';
import { db, getSofascoreBadgeStyle, calculateSofascoreRating } from '../services/database.js?v=20260912_0120';
import { t as fallbackT, getDivisionLabel as fallbackGetDivisionLabel, getStageLabel as fallbackGetStageLabel, isMatchDivision } from '../services/i18n.js?v=20260912_0120';
import { sanitizeEmbedUrl } from '../services/security.js?v=20260912_0120';
import { normalizeStage } from '../services/matchUtils.js?v=20260912_0120';
import MatchAnalyticsModal from './MatchAnalyticsModal.js?v=20260912_0120';

const html = htm.bind(React.createElement);

export default function Matches({ activeDivision, activeYear, lang = 'en', t = (k) => fallbackT(k, lang) }) {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedStage, setSelectedStage] = useState('Qrup Mərhələsi');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
    let isMounted = true;
    setIsLoading(true);
    const loadMatchesData = async () => {
      try {
        const allMatches = await db.getMatches(activeYear);
        const allPlayers = await db.getPlayers(activeYear);
        if (isMounted) {
          setMatches(allMatches || []);
          setPlayers(allPlayers || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Matches load error:", err);
        if (isMounted) setIsLoading(false);
      }
    };
    loadMatchesData();
    return () => { isMounted = false; };
  }, [activeDivision, activeYear]);

  // Handle direct URL #match/:id and browser navigation
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#match/')) {
        const targetId = hash.replace('#match/', '');
        const found = matches.find(m => m.id === targetId);
        if (found) {
          setSelectedMatch(found);
        }
      }
    };
    if (matches.length > 0) {
      handleHashCheck();
    }
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, [matches]);
  const isStageMatch = (matchStage, targetStage) => {
    if (!matchStage || !targetStage) return false;
    if (matchStage === targetStage) return true;
    const s1 = matchStage.toLowerCase().replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/\s+/g, '');
    const s2 = targetStage.toLowerCase().replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/\s+/g, '');
    if (s1 === s2) return true;
    if (s2.includes('qrup') && (s1.includes('qrup') || s1.includes('tur'))) return true;
    if ((s2.includes('16/1') || s2.includes('1/16')) && (s1.includes('16/1') || s1.includes('1/16'))) return true;
    if ((s2.includes('8/1') || s2.includes('1/8')) && (s1.includes('8/1') || s1.includes('1/8'))) return true;
    if ((s2.includes('4/1') || s2.includes('1/4')) && (s1.includes('4/1') || s1.includes('1/4'))) return true;
    if ((s2.includes('yarim') || s2.includes('semi')) && (s1.includes('yarim') || s1.includes('semi'))) return true;
    if ((s2.includes('3') && (s2.includes('yer') || s2.includes('place') || s2.includes('luk'))) &&
        (s1.includes('3') && (s1.includes('yer') || s1.includes('place') || s1.includes('luk')))) return true;
    if (s2 === 'final') return s1 === 'final' || s1 === 'finaloyunu';
    return false;
  };

  const filteredMatches = matches.filter(m => {
    const isDivDirect = isMatchDivision(m.division, activeDivision);
    const isTeamRelevant = (activeDivision === '11' && (m.teamA?.startsWith('11') || m.teamB?.startsWith('11'))) ||
                           (activeDivision === '9-10' && (m.teamA?.startsWith('10') || m.teamB?.startsWith('10') || m.teamA?.startsWith('9') || m.teamB?.startsWith('9')));
    return (isDivDirect || isTeamRelevant) && isStageMatch(m.stage, selectedStage);
  });

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

  // Tournament 3rd place and final teams for deductive semifinal winner/loser
  const thirdPlaceTeams = new Set();
  const finalTeams = new Set();
  matches.forEach(m => {
    const norm = normalizeStage(m.stage);
    if (norm === 'third') {
      if (m.teamA && m.teamA !== '?') thirdPlaceTeams.add(m.teamA);
      if (m.teamB && m.teamB !== '?') thirdPlaceTeams.add(m.teamB);
    }
    if (norm === 'final') {
      if (m.teamA && m.teamA !== '?') finalTeams.add(m.teamA);
      if (m.teamB && m.teamB !== '?') finalTeams.add(m.teamB);
    }
  });

  const getMatchWinner = (match) => {
    if (!match) return null;
    if (match.winner) {
      const loser = match.loser || (match.winner === match.teamA ? match.teamB : (match.winner === match.teamB ? match.teamA : null));
      return { winner: match.winner, loser, isPenalties: Boolean(match.penaltyScoreA != null && match.penaltyScoreB != null) };
    }
    const sA = Number(match.scoreA);
    const sB = Number(match.scoreB);
    if (!isNaN(sA) && !isNaN(sB) && (sA > 0 || sB > 0 || match.played === true)) {
      if (sA > sB) return { winner: match.teamA, loser: match.teamB, isPenalties: false };
      if (sB > sA) return { winner: match.teamB, loser: match.teamA, isPenalties: false };
      if (sA === sB) return { winner: null, loser: null, isDraw: true };
    }
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

    const norm = normalizeStage(match.stage);
    if (norm === 'semi') {
      if (finalTeams.has(match.teamA)) return { winner: match.teamA, loser: match.teamB, isDeduced: true };
      if (finalTeams.has(match.teamB)) return { winner: match.teamB, loser: match.teamA, isDeduced: true };
      if (thirdPlaceTeams.has(match.teamA)) return { winner: match.teamB, loser: match.teamA, isDeduced: true };
      if (thirdPlaceTeams.has(match.teamB)) return { winner: match.teamA, loser: match.teamB, isDeduced: true };
    }

    return null;
  };

  const selectedOutcome = selectedMatch ? getMatchWinner(selectedMatch) : null;

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
      <div key=${player.playerId} className="flex justify-between items-center bg-white p-3 rounded-[20px] p-2 border border-gray-100 ">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h6 className="font-bold text-purple-950 text-xs truncate">${player.name}</h6>
            ${player.isKeeper ? html`<span className="text-[9px] bg-sky-100 text-sky-700 font-black px-1.5 py-0.5 rounded uppercase"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="inline-block mr-1 opacity-70"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 11V4a2 2 0 0 0-4 0v7M10 11V5a2 2 0 0 0-4 0v6M6 11V7a2 2 0 0 0-4 0v9a8 8 0 0 0 16 0v-4a2 2 0 0 0-4 0v-1"></path></svg> Qapıçı</span>` : null}
          </div>
          <p className="text-[10px] text-gray-400">${player.position || '—'}</p>
          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-semibold mt-1">
            ${player.isKeeper
              ? html`<span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="inline-block mr-1 opacity-70"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 11V4a2 2 0 0 0-4 0v7M10 11V5a2 2 0 0 0-4 0v6M6 11V7a2 2 0 0 0-4 0v9a8 8 0 0 0 16 0v-4a2 2 0 0 0-4 0v-1"></path></svg> Qurtarış: ${player.saves || 0}</span>`
              : html`<span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="inline-block mr-1 opacity-70"><circle cx="12" cy="12" r="10"></circle><path d="M12 12l3.5-2m-7 4l3.5-2m0 0v4m-3.5-2h7"></path></svg> Qol: ${player.goals || 0}</span>`
            }
            <span>👟 Asist: ${player.assists || 0}</span>
            ${(player.yellowCards || 0) > 0 ? html`<span className="text-yellow-500"><span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-yellow-500 mr-1 shadow-sm"></span> ×${player.yellowCards}</span>` : null}
            ${(player.redCards    || 0) > 0 ? html`<span className="text-red-600"><span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-red-600 mr-1 shadow-sm"></span> ×${player.redCards}</span>`    : null}
          </div>
        </div>
        <!-- Rating badge -->
        <span className=${"min-w-[2.75rem] h-11 rounded-[20px] p-2 flex flex-col items-center justify-center font-black text-xs ml-3 px-1 " + badge}>
          <span className="text-sm leading-none">${player.rating}</span>
          <span className="text-[8px] opacity-75 mt-0.5">Rating</span>
        </span>
      </div>
    `;
  };

  return html`
    <div className="space-y-6 animate-fadeIn opacity-100">
      <!-- Title & Filters -->
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-4xl tabular-nums tracking-tight font-black text-zinc-900 dark:text-white font-sans tabular-nums tracking-tight">${t('matchesTitle')} — ${fallbackGetDivisionLabel(activeDivision, lang)}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="inline-block mr-1 opacity-70"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> 5v5 Minifutbol
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">${lang === 'az' ? 'Mərhələlər üzrə 5v5 oyunlar və Sofascore reytinqləri' : 'Stage fixtures, 5v5 lineups and Sofascore ratings'}</p>
        </div>
        
        <!-- Stage Tabs -->
        <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 overflow-x-auto max-w-full no-scrollbar shadow-xs">
          ${stages.map(st => html`
            <button
              key=${st.id}
              onClick=${() => setSelectedStage(st.id)}
              className=${`px-4 py-2 rounded-[20px] p-2 text-xs font-extrabold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedStage === st.id 
                  ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 font-black shadow-xs border border-purple-200/80 dark:border-purple-800/80' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              ${st.label}
            </button>
          `)}
        </div>
      </div>

      <!-- Match Cards Grid -->
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${isLoading ? html`
          <div className="col-span-1 md:col-span-2 text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">${lang === 'az' ? 'Oyunlar yüklənir...' : 'Loading matches...'}</p>
          </div>
        ` : filteredMatches.length === 0 
          ? html`
              <div className="col-span-1 md:col-span-2 text-center py-12 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                ${t('noMatchesFound')}
              </div>
            `
          : filteredMatches.map(match => {
              const outcome = getMatchWinner(match);
              const isTeamAWinner = outcome && outcome.winner === match.teamA;
              const isTeamBWinner = outcome && outcome.winner === match.teamB;
              const isTeamALoser  = outcome && outcome.loser === match.teamA;
              const isTeamBLoser  = outcome && outcome.loser === match.teamB;
              const isFinalStage  = normalizeStage(match.stage) === 'final';

              return html`
              <div 
                key=${match.id}
                onClick=${() => setSelectedMatch(match)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/40 dark:hover:border-purple-500/40 rounded-3xl overflow-hidden shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <!-- Match Card Top -->
                <div className="p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] sm:text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
                        ${match.stage}
                      </span>
                      ${match.videoTitle && html`
                        <span className="text-[9px] sm:text-[10px] font-extrabold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs" title=${match.videoTitle}>
                          <i className="fab fa-youtube text-red-600 dark:text-red-400"></i>
                          <span>${match.videoDuration || 'Video'}</span>
                        </span>
                      `}
                    </div>
                    <span className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 flex items-center shrink-0">
                      <i className="far fa-calendar-alt mr-1"></i> ${match.date || 'Tarix təyin edilməyib'}
                    </span>
                  </div>

                  <!-- Score Display -->
                  <div className="flex items-center justify-between py-3 sm:py-4 gap-2 sm:gap-3">
                    <!-- Team A Box -->
                    <div className=${`text-center flex-1 min-w-0 p-2.5 sm:p-3.5 rounded-2xl border transition-all ${
                      (isTeamAWinner || (isFinalStage && match.teamA === '?'))
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 shadow-2xs'
                        : isTeamALoser
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-950 dark:text-rose-300'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-700/60'
                    }`}>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        ${(isTeamAWinner || (isFinalStage && match.teamA === '?')) ? html`
                          <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs tracking-wider uppercase inline-flex items-center gap-1" title="Qalib (W)">
                            <i className="fas fa-check-circle text-[9px]"></i> W
                          </span>
                        ` : null}
                        ${isTeamALoser ? html`
                          <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs tracking-wider uppercase inline-flex items-center gap-1" title="Məğlub (L)">
                            L
                          </span>
                        ` : null}
                      </div>
                      <h4 className=${`text-base sm:text-lg truncate ${
                        (isTeamAWinner || (isFinalStage && match.teamA === '?'))
                          ? 'font-black text-emerald-950 dark:text-emerald-200'
                          : isTeamALoser
                          ? 'font-semibold text-rose-950 dark:text-rose-300'
                          : 'font-black text-zinc-900 dark:text-white'
                      }`}>
                        ${match.teamA}
                      </h4>
                      <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold tracking-widest uppercase truncate block mt-0.5">Ev sahibi</span>
                    </div>

                    <!-- Score Box -->
                    <div className="flex flex-col items-center px-1 sm:px-2 shrink-0">
                      <div className="bg-zinc-900 dark:bg-zinc-950 text-white rounded-2xl px-4 sm:px-6 py-2 font-mono font-black text-4xl tabular-nums tracking-tight sm:text-5xl tabular-nums tracking-tight shadow-xs border border-zinc-700/60 flex flex-col items-center tracking-tight tabular-nums tracking-tight tabular-nums tracking-tight">
                        <span>${match.scoreA} - ${match.scoreB}</span>
                        ${(match.penaltyScoreA !== null && match.penaltyScoreA !== undefined && match.penaltyScoreA !== '') && html`
                          <span className="text-[9px] sm:text-[10px] text-emerald-400 font-extrabold mt-0.5">pen. ${match.penaltyScoreA} - ${match.penaltyScoreB}</span>
                        `}
                      </div>
                      ${(match.scoreA === '?' || match.scoreA == null) ? html`
                        <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full mt-1.5 sm:mt-2">
                          ${lang === 'az' ? 'Nəticə naməlum' : 'Score unknown'}
                        </span>
                      ` : html`
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mt-1.5 sm:mt-2">
                          ${lang === 'az' ? 'Bitti' : 'Completed'}
                        </span>
                      `}
                    </div>

                    <!-- Team B Box -->
                    <div className=${`text-center flex-1 min-w-0 p-2.5 sm:p-3.5 rounded-2xl border transition-all ${
                      (isTeamBWinner || (isFinalStage && match.teamB === '?'))
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 shadow-2xs'
                        : isTeamBLoser
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-950 dark:text-rose-300'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-700/60'
                    }`}>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        ${(isTeamBWinner || (isFinalStage && match.teamB === '?')) ? html`
                          <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs tracking-wider uppercase inline-flex items-center gap-1" title="Qalib (W)">
                            <i className="fas fa-check-circle text-[9px]"></i> W
                          </span>
                        ` : null}
                        ${isTeamBLoser ? html`
                          <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs tracking-wider uppercase inline-flex items-center gap-1" title="Məğlub (L)">
                            L
                          </span>
                        ` : null}
                      </div>
                      <h4 className=${`text-base sm:text-lg truncate ${
                        (isTeamBWinner || (isFinalStage && match.teamB === '?'))
                          ? 'font-black text-emerald-950 dark:text-emerald-200'
                          : isTeamBLoser
                          ? 'font-semibold text-rose-950 dark:text-rose-300'
                          : 'font-black text-zinc-900 dark:text-white'
                      }`}>
                        ${match.teamB}
                      </h4>
                      <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold tracking-widest uppercase truncate block mt-0.5">Qonaq</span>
                    </div>
                  </div>
                </div>

                <!-- Match Card Bottom -->
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-between items-center text-[11px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center text-zinc-500 dark:text-zinc-400">
                      <i className="fas fa-chart-line text-emerald-500 mr-1.5 text-xs sm:text-sm"></i>
                      ${match.playerStats?.length || 0} Oyunçu reytinqi
                    </span>
                  </div>
                  <span className="text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 font-extrabold transition-colors flex items-center space-x-1.5">
                    <i className="fas fa-fire-alt text-amber-500 text-[10px]"></i>
                    <span>5v5 Analiz & Heatmap</span>
                    <i className="fas fa-chevron-right text-[9px]"></i>
                  </span>
                </div>
              </div>
            `;
          })}
      </div>

      <!-- Match Details & Sofascore Analytics Modal (Shotmap, Goal POV, Heatmap, 5v5 Lineup) -->
      ${Boolean(selectedMatch) && html`
        <${MatchAnalyticsModal}
          match=${selectedMatch}
          isOpen=${Boolean(selectedMatch)}
          onClose=${() => {
            setSelectedMatch(null);
            if (window.location.hash.startsWith('#match/')) {
              window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
            }
          }}
          allPlayers=${players}
          lang=${lang}
        />
      `}
    </div>
  `;
}
