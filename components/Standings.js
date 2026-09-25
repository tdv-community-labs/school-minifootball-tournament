/**
 * ============================================================================
 * FAYL ADI: components/Standings.js
 * MƏQSƏDİ: Turnir Cədvəli, Qrup Mərhələsi və Pley-Off (Knockout) Şəbəkəsi
 * 
 * BU KOMPONENTİN VƏZİFƏLƏRİ:
 *   1. Qrup Cədvəlləri: A və B qruplarında xallar, qələbələr, heç-heçələr, vurulan/buraxılan qollar və TF.
 *   2. Pley-off / Kubok Şəbəkəsi: 1/4 final, yarımfinal, 3-cü yer və Final oyunlarının interaktiv vizuallaşdırılması.
 *   3. Bombardirlər Top-3: Hər qrup və ümumi kateqoriya üzrə ən çox qol vuranlar.
 *   4. Video baxış: Oyunların video icmallarını birbaşa modal pəncərədə nümayiş etdirmək.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle, calculateSofascoreRating } from '../services/database.js?v=20260912_0120';
import { t as fallbackT, getDivisionLabel as fallbackGetDivisionLabel, getStageLabel as fallbackGetStageLabel, isMatchDivision } from '../services/i18n.js?v=20260912_0120';
import { sanitizeEmbedUrl } from '../services/security.js?v=20260912_0120';
import MatchAnalyticsModal from './MatchAnalyticsModal.js?v=20260912_0120';

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

export default function Standings({ activeDivision, activeYear, lang = 'en', t = (k) => fallbackT(k, lang), onOpenPlayerProfile }) {
  const [table, setTable] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'bracket'
  const [tournamentTrack, setTournamentTrack] = useState('main'); // 'main' (1/8 Final Tree) or 'group_cup' (Group Playoff)
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [sortField, setSortField] = useState('points');
  const [sortAsc, setSortAsc] = useState(false);
  const [showEmptyPreview, setShowEmptyPreview] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('ALL');

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

  // Reset view mode, preview toggle, and group filter when division or year changes
  useEffect(() => {
    setViewMode('table');
    setShowEmptyPreview(false);
    setSelectedGroup('ALL');
  }, [activeDivision, activeYear]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Group table into distinct groups if available
  const availableGroups = Array.from(
    new Set(table.map(t => t.group).filter(Boolean))
  ).sort();
  const hasMultipleGroups = availableGroups.length > 1;

  const sortTeams = (teams) => {
    return [...teams].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  };

  const sortedTable = sortTeams(table);

  const groupsToDisplay = (hasMultipleGroups && selectedGroup !== 'ALL')
    ? [selectedGroup]
    : (hasMultipleGroups ? availableGroups : ['ALL']);

  const getDivisionLabel = (div) => fallbackGetDivisionLabel(div, lang);

  // Sofascore Form Guide (last 5 matches)
  const getTeamForm = (teamName) => {
    if (!teamName || !matches || matches.length === 0) return [];
    const teamMatches = matches
      .filter(m => (m.teamA === teamName || m.teamB === teamName) && (m.played === true || (m.scoreA !== null && m.scoreA !== undefined && m.scoreA !== '')))
      .slice(-5);
    return teamMatches.map(m => {
      const isTeamA = m.teamA === teamName;
      const sA = Number(m.scoreA || 0);
      const sB = Number(m.scoreB || 0);
      if (sA === sB) return 'D';
      return (isTeamA ? sA > sB : sB > sA) ? 'W' : 'L';
    });
  };


  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYOFF BRACKET CALCULATIONS & STAGES
  // ─────────────────────────────────────────────────────────────────────────────
  const divisionMatches = matches.filter(m => isMatchDivision(m.division, activeDivision));
  
  // Separate playoff matches from group stage
  const playoffMatches = divisionMatches.filter(m => {
    const norm = normalizeStage(m.stage);
    if (norm === '' || m.stage.toLowerCase().includes('qrup') || m.stage.toLowerCase().includes('tur')) return false;

    // For 2017-2018: separate Main Knockout (1/8 -> 1/4 -> Semi -> Final) from Group Playoffs (June 11th grade cup)
    if (activeYear === '2017-2018') {
      const isGroupPlayoff = m.id === 'm_2017_11a_11b_2018_06_07_yarımfinal' || 
                             m.id === 'm_2017_10e_11h_2018_06_07_yarımfinal' || 
                             m.id === 'm_2017_11a_11h_2018_06_11_3_cü_yer' || 
                             m.id === 'm_2017_10e_11b_2018_06_12_final';
      return tournamentTrack === 'group_cup' ? isGroupPlayoff : !isGroupPlayoff;
    }
    return true;
  });

  const stage16Matches = playoffMatches.filter(m => normalizeStage(m.stage) === '16/1');
  const stage8Matches  = playoffMatches.filter(m => normalizeStage(m.stage) === '8/1');
  const stage4Matches  = playoffMatches.filter(m => normalizeStage(m.stage) === '4/1');
  const stageSemiMatches = playoffMatches.filter(m => normalizeStage(m.stage) === 'semi');
  const stageFinalMatches = playoffMatches.filter(m => normalizeStage(m.stage) === 'final');
  const stageThirdMatches = playoffMatches.filter(m => normalizeStage(m.stage) === 'third');

  // Track teams in 3rd place and final matches for semifinal deduction
  const thirdPlaceTeams = new Set();
  stageThirdMatches.forEach(m => {
    if (m.teamA && m.teamA !== '?') thirdPlaceTeams.add(m.teamA);
    if (m.teamB && m.teamB !== '?') thirdPlaceTeams.add(m.teamB);
  });

  const finalTeams = new Set();
  stageFinalMatches.forEach(m => {
    if (m.teamA && m.teamA !== '?') finalTeams.add(m.teamA);
    if (m.teamB && m.teamB !== '?') finalTeams.add(m.teamB);
  });

  // Match winner calculation helper
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

    // Deduce for semifinals when 3rd place or final teams are known
    const norm = normalizeStage(match.stage);
    if (norm === 'semi') {
      if (finalTeams.has(match.teamA)) return { winner: match.teamA, loser: match.teamB, isPenalties: false, isDeduced: true };
      if (finalTeams.has(match.teamB)) return { winner: match.teamB, loser: match.teamA, isPenalties: false, isDeduced: true };
      if (thirdPlaceTeams.has(match.teamA)) return { winner: match.teamB, loser: match.teamA, isPenalties: false, isDeduced: true };
      if (thirdPlaceTeams.has(match.teamB)) return { winner: match.teamA, loser: match.teamB, isPenalties: false, isDeduced: true };
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
  const currentDivPlayers = players.filter(p => 
    isMatchDivision(p.division, activeDivision) && 
    p.year === activeYear &&
    !p.isOwnGoal && 
    !/avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || '')
  );

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

  // Helper to align feeder round matches to match their winners/participants with target round slots
  const alignFeederRound = (feederMatches, targetSlots, roundSize) => {
    const slots = new Array(roundSize).fill(null);
    const usedIndices = new Set();

    targetSlots.forEach((targetMatch, tIdx) => {
      if (!targetMatch) return;
      const targetTeams = [targetMatch.teamA, targetMatch.teamB];

      targetTeams.forEach((team, teamSubIdx) => {
        if (!team || team === '?') return;
        const slotIdx = tIdx * 2 + teamSubIdx;
        if (slotIdx >= roundSize) return;

        let matchIdx = feederMatches.findIndex((fm, i) => !usedIndices.has(i) && getMatchWinner(fm)?.winner === team);
        if (matchIdx === -1) {
          matchIdx = feederMatches.findIndex((fm, i) => !usedIndices.has(i) && (fm.teamA === team || fm.teamB === team));
        }
        if (matchIdx !== -1) {
          slots[slotIdx] = feederMatches[matchIdx];
          usedIndices.add(matchIdx);
        }
      });
    });

    let unusedIdx = 0;
    for (let s = 0; s < roundSize; s++) {
      if (!slots[s]) {
        while (unusedIdx < feederMatches.length && usedIndices.has(unusedIdx)) {
          unusedIdx++;
        }
        if (unusedIdx < feederMatches.length) {
          slots[s] = feederMatches[unusedIdx];
          usedIndices.add(unusedIdx);
        }
      }
    }
    return slots;
  };

  // Prepare aligned filled or null slots (Full binary tournament tree)
  const slotsFinal = [stageFinalMatches[0] || null];
  const slotsSemi  = alignFeederRound(stageSemiMatches, slotsFinal, 2);
  const slots4     = alignFeederRound(stage4Matches, slotsSemi, 4);
  const slots8     = alignFeederRound(stage8Matches, slots4, 8);
  const slots16    = alignFeederRound(stage16Matches, slots8, 16);

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
  const selectedOutcome = selectedMatch ? getMatchWinner(selectedMatch) : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER SINGLE BRACKET MATCH CARD
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBracketMatchCard = (match, label, index) => {
    if (!match) {
      return html`
        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 rounded-[20px] p-3 flex flex-col justify-center items-center h-[102px] w-60 text-center select-none tabular-nums">
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider">
            ${label} #${index + 1}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold mt-1 flex items-center gap-1 tabular-nums">
            <i className="fas fa-hourglass-start text-[10px]"></i> Təyin edilməyib
          </span>
        </div>
      `;
    }

    const outcome = getMatchWinner(match);
    const isFinished = outcome !== null || (match.scoreA > 0 || match.scoreB > 0);
    const isTeamAWinner = outcome && outcome.winner === match.teamA;
    const isTeamBWinner = outcome && outcome.winner === match.teamB;
    const isTeamALoser  = outcome && outcome.loser === match.teamA;
    const isTeamBLoser  = outcome && outcome.loser === match.teamB;
    const isFinalStage  = normalizeStage(match.stage) === 'final';
    const hasPenalties = match.penaltyScoreA !== null && match.penaltyScoreA !== undefined && match.penaltyScoreA !== '';

    return html`
      <div 
        onClick=${() => setSelectedMatch(match)}
        className=${`group bg-white dark:bg-zinc-900 border rounded-[20px] p-2.5 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between w-60 min-h-[104px] relative select-none ${
          isFinished ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-200/80 dark:border-zinc-800/80'
        }`}
      >
        <!-- Stage & Status Tag -->
        <div className="flex items-center justify-between text-[9px] font-extrabold pb-1">
          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded uppercase tracking-wider">
            ${label} #${index + 1}
          </span>
          
          <div className="flex items-center gap-1.5">
            ${match.videoUrl ? html`<span className="text-red-500 font-black text-[9px]"><i className="fab fa-youtube"></i></span>` : null}
            ${match.date ? html`<span className="text-zinc-400 font-medium">${match.date}</span>` : null}
            ${isFinished 
              ? html`<span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>Bitib</span>`
              : html`<span className="text-zinc-400 dark:text-zinc-500">Gözlənilir</span>`
            }
          </div>
        </div>

        <!-- Team A Row -->
        <div className=${`flex items-center justify-between px-2.5 py-1.5 rounded-[8px] border transition-all ${
          (isTeamAWinner || (isFinalStage && match.teamA === '?'))
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 font-black shadow-2xs'
            : isTeamALoser
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200 font-semibold'
            : isFinished
            ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-700/40 text-zinc-600 dark:text-zinc-400 font-medium'
            : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 font-bold text-zinc-900 dark:text-zinc-100'
        }`}>
          <div className="flex items-center space-x-2 truncate pr-1">
            <span className=${`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center shrink-0 shadow-2xs ${
              (isTeamAWinner || (isFinalStage && match.teamA === '?'))
                ? 'bg-emerald-600 text-white'
                : isTeamALoser
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-800 dark:bg-zinc-700 text-white'
            }`}>
              ${(match.teamA || '').substring(0, 3)}
            </span>
            <div className="flex items-center gap-1.5 truncate">
              ${(isTeamAWinner || (isFinalStage && match.teamA === '?')) ? html`
                <span className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded shrink-0 shadow-2xs" title="Qalib (W)">W</span>
              ` : null}
              ${isTeamALoser ? html`
                <span className="bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded shrink-0 shadow-2xs" title="Məğlub (L)">L</span>
              ` : null}
              <span className="text-xs truncate font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                ${match.teamA}
              </span>
            </div>
            ${isTeamAWinner ? html`<i className="fas fa-check-circle text-emerald-600 dark:text-emerald-400 text-[10px] ml-0.5"></i>` : null}
          </div>
          
          <div className="flex items-center space-x-1 shrink-0">
            ${hasPenalties && html`
              <span className="text-[9px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1 py-0.2 rounded font-bold tabular-nums">
                (${match.penaltyScoreA})
              </span>
            `}
            <span className=${`text-xs min-w-[14px] text-right ${
              (isTeamAWinner || (isFinalStage && match.teamA === '?'))
                ? 'font-black text-emerald-600 dark:text-emerald-400'
                : isTeamALoser
                ? 'font-bold text-rose-600 dark:text-rose-400'
                : 'font-black text-zinc-900 dark:text-white'
            }`}>
              ${match.scoreA ?? 0}
            </span>
          </div>
        </div>

        <!-- Team B Row -->
        <div className=${`flex items-center justify-between px-2.5 py-1.5 rounded-[8px] border transition-all ${
          (isTeamBWinner || (isFinalStage && match.teamB === '?'))
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 font-black shadow-2xs'
            : isTeamBLoser
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200 font-semibold'
            : isFinished
            ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-700/40 text-zinc-600 dark:text-zinc-400 font-medium'
            : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 font-bold text-zinc-900 dark:text-zinc-100'
        }`}>
          <div className="flex items-center space-x-2 truncate pr-1">
            <span className=${`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center shrink-0 shadow-2xs ${
              (isTeamBWinner || (isFinalStage && match.teamB === '?'))
                ? 'bg-emerald-600 text-white'
                : isTeamBLoser
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-800 dark:bg-zinc-700 text-white'
            }`}>
              ${(match.teamB || '').substring(0, 3)}
            </span>
            <div className="flex items-center gap-1.5 truncate">
              ${(isTeamBWinner || (isFinalStage && match.teamB === '?')) ? html`
                <span className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded shrink-0 shadow-2xs" title="Qalib (W)">W</span>
              ` : null}
              ${isTeamBLoser ? html`
                <span className="bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded shrink-0 shadow-2xs" title="Məğlub (L)">L</span>
              ` : null}
              <span className="text-xs truncate font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                ${match.teamB}
              </span>
            </div>
            ${isTeamBWinner ? html`<i className="fas fa-check-circle text-emerald-600 dark:text-emerald-400 text-[10px] ml-0.5"></i>` : null}
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            ${hasPenalties && html`
              <span className="text-[9px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1 py-0.2 rounded font-bold tabular-nums">
                (${match.penaltyScoreB})
              </span>
            `}
            <span className=${`text-xs min-w-[14px] text-right ${
              (isTeamBWinner || (isFinalStage && match.teamB === '?'))
                ? 'font-black text-emerald-600 dark:text-emerald-400'
                : isTeamBLoser
                ? 'font-bold text-rose-600 dark:text-rose-400'
                : 'font-black text-zinc-900 dark:text-white'
            }`}>
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
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-zinc-200 dark:border-zinc-700">
              ${getDivisionLabel(activeDivision)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300 tabular-nums">
              ⚡ 5v5 Minifutbol
            </span>
            <span className="text-zinc-300 dark:text-zinc-700 text-xs">•</span>
            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-bold tabular-nums">${activeYear}</span>
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
            ${t('standingsTitle')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ${viewMode === 'table' 
              ? (lang === 'az' ? 'Qrup mərhələsi xal sıralaması və top fərqləri' : 'Group stage points table and goal differences')
              : (lang === 'az' ? 'Dörddəbir, yarımfinal və böyük final pley-off toru' : 'Playoff bracket tree: quarter-finals, semi-finals and final')}
          </p>
        </div>
        
        <!-- View Switcher Tabs -->
        <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-[20px] border border-zinc-200 dark:border-zinc-700/60 shadow-xs">
          <button
            onClick=${() => setViewMode('table')}
            className=${`px-4 py-2 rounded-[8px] text-xs font-extrabold uppercase tracking-wide transition-all whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
              viewMode === 'table' 
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs border border-purple-200/80 dark:border-purple-800/80 font-black' 
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-list-ol text-sm"></i>
            <span>${t('tabGroupStage')}</span>
          </button>
          
          <button
            onClick=${() => setViewMode('bracket')}
            className=${`px-4 py-2 rounded-[8px] text-xs font-extrabold uppercase tracking-wide transition-all whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
              viewMode === 'bracket' 
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs border border-purple-200/80 dark:border-purple-800/80 font-black' 
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <i className="fas fa-sitemap text-sm"></i>
            <span>${t('tabPlayoffs')}</span>
          </button>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════════════════════════ -->
      <!-- VIEW MODE 1: STANDINGS TABLE (GROUPED) -->
      <!-- ════════════════════════════════════════════════════════════════════════ -->
      ${viewMode === 'table' && html`
        <div className="space-y-6">
          
          <!-- Group Selector Filter Pills -->
          ${hasMultipleGroups && html`
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 w-fit">
              <button
                onClick=${() => setSelectedGroup('ALL')}
                className=${`px-4 py-2 rounded-[8px] text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  selectedGroup === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                }`}
              >
                ${t('allGroups')}
              </button>
              ${availableGroups.map(grp => html`
                <button
                  key=${grp}
                  onClick=${() => setSelectedGroup(grp)}
                  className=${`px-4 py-2 rounded-[8px] text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                    selectedGroup === grp
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className=${`w-2.5 h-2.5 rounded-full ${
                    grp === 'A' ? 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700' :
                    grp === 'B' ? 'bg-sky-500 ring-2 ring-sky-300 dark:ring-sky-700' :
                    grp === 'C' ? 'bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-700' :
                    'bg-purple-500 ring-2 ring-purple-300 dark:ring-purple-700'
                  }`}></span>
                  <span>${t('group' + grp) || (lang === 'az' ? `Qrup ${grp}` : `Group ${grp}`)}</span>
                </button>
              `)}
            </div>
          `}

          ${table.length === 0 ? html`
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-zinc-400 dark:text-zinc-500 shadow-xs tabular-nums">
              ${t('tableEmptyNotice')}
            </div>
          ` : groupsToDisplay.map(grp => {
              const groupTeams = hasMultipleGroups ? sortTeams(table.filter(t => t.group === grp)) : sortedTable;
              const groupTitle = t('group' + grp) || (lang === 'az' ? `Qrup ${grp}` : `Group ${grp}`);

              return html`
                <div key=${grp} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden animate-fadeIn transition-colors duration-200">
                  
                  <!-- Group Card Header -->
                  ${hasMultipleGroups && html`
                    <div className="bg-zinc-900 dark:bg-zinc-950 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <span className=${`w-3.5 h-3.5 rounded-full ring-4 ring-white/20 ${
                          grp === 'A' ? 'bg-emerald-400' :
                          grp === 'B' ? 'bg-sky-400' :
                          grp === 'C' ? 'bg-amber-400' :
                          'bg-purple-400'
                        }`}></span>
                        <h3 className="text-base font-black tracking-wide">
                          ${groupTitle}
                        </h3>
                        <span className="text-xs text-zinc-400 font-bold tabular-nums">
                          (${groupTeams.length} ${lang === 'az' ? 'Sinif' : 'Classes'})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                          <i className="fas fa-shield-alt text-[10px]"></i>
                          ${t('top2Qualify')}
                        </span>
                      </div>
                    </div>
                  `}

                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse standings-table bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-[11px] sm:text-xs font-black tracking-wider uppercase border-b border-zinc-200 dark:border-zinc-800">
                          <th className="py-3 px-2 sm:py-4 sm:px-6 text-center w-8 sm:w-14 tabular-nums">#</th>
                          <th className="py-3 px-2 sm:py-4 sm:px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" onClick=${() => handleSort('class')}>
                            ${t('colTeam')} ${sortField === 'class' ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                          <th className="py-3 px-2 sm:py-4 sm:px-4 text-center cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors tabular-nums" onClick=${() => handleSort('played')}>
                            ${t('colPlayed')} ${sortField === 'played' ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                          <th className="py-3 px-2 sm:py-4 sm:px-4 text-center cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors tabular-nums" onClick=${() => handleSort('won')}>
                            ${t('colWon')} ${sortField === 'won' ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                          <th className="py-3 px-2 sm:py-4 sm:px-4 text-center cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors tabular-nums" onClick=${() => handleSort('drawn')}>
                            ${t('colDrawn')} ${sortField === 'drawn' ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                          <th className="py-3 px-2 sm:py-4 sm:px-4 text-center cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors tabular-nums" onClick=${() => handleSort('lost')}>
                            ${t('colLost')} ${sortField === 'lost' ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                          <th className="py-3 px-2 sm:py-4 sm:px-4 text-center cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors hidden md:table-cell tabular-nums" onClick=${() => handleSort('goalsFor')}>
                            ${t('colGF')} ${sortField === 'goalsFor' ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                          <th className="py-3 px-2 sm:py-4 sm:px-4 text-center cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors hidden md:table-cell tabular-nums" onClick=${() => handleSort('goalsAgainst')}>
                            ${t('colGA')} ${sortField === 'goalsAgainst' ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                          <th className="py-3 px-2 sm:py-4 sm:px-4 text-center cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors tabular-nums" title="Top Fərqi (Vurulan - Buraxılan)" onClick=${() => handleSort('goalDifference')}>
                            ${t('colGD')} ${sortField === 'goalDifference' ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                          <th className="py-3 px-2 sm:py-4 sm:px-3 text-center hidden md:table-cell font-black tracking-wider uppercase tabular-nums">Forma</th>
                          <th className="py-3 px-2 sm:py-4 sm:px-6 text-center cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors tabular-nums" onClick=${() => handleSort('points')}>
                            ${t('colPoints')} ${sortField === 'points' ? (sortAsc ? '▲' : '▼') : ''}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs sm:text-sm">
                        ${groupTeams.length === 0 
                          ? html`
                              <tr>
                                <td colSpan="11" className="py-8 text-center text-zinc-400 dark:text-zinc-500 tabular-nums">
                                  ${t('tableEmptyNotice')}
                                </td>
                              </tr>
                            `
                          : groupTeams.map((row, index) => {
                              const isFirst = index === 0;
                              const isSecond = index === 1;
                              const isQualified = hasMultipleGroups ? (index < 2) : (index === 0);

                              const rowClass = isFirst
                                ? 'srow-first'
                                : (isSecond && hasMultipleGroups)
                                ? 'srow-second'
                                : 'srow-other';

                              return html`
                                <tr key=${row.class} className=${`transition-colors duration-150 ${rowClass}`}>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-center font-black tabular-nums">
                                    ${isFirst 
                                      ? html`<span className="bg-emerald-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full inline-flex items-center justify-center text-[11px] sm:text-xs font-black shadow-xs">1</span>`
                                      : isSecond && hasMultipleGroups
                                      ? html`<span className="bg-emerald-600 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full inline-flex items-center justify-center text-[11px] sm:text-xs font-black shadow-xs">2</span>`
                                      : html`<span className="text-zinc-500 dark:text-zinc-400 font-bold text-[11px] sm:text-xs tabular-nums">${index + 1}</span>`
                                    }
                                  </td>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 font-black flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white whitespace-nowrap">${row.class} Sinfi</span>
                                    ${isQualified && html`
                                      <span className=${`inline-flex items-center text-[8px] sm:text-[9px] font-black uppercase px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full shadow-2xs ${
                                        isFirst 
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                                          : 'bg-zinc-100 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                      }`}>
                                        ${t('playoffs') || 'Pley-off'}
                                      </span>
                                    `}
                                  </td>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-center font-bold text-zinc-700 dark:text-zinc-200 tabular-nums tabular-nums">${row.played}</td>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-center text-emerald-600 dark:text-emerald-400 font-extrabold tabular-nums">${row.won}</td>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-center text-zinc-500 dark:text-zinc-400 font-semibold tabular-nums">${row.drawn}</td>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-center text-rose-600 dark:text-rose-400 font-extrabold tabular-nums">${row.lost}</td>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-center text-zinc-600 dark:text-zinc-300 font-medium hidden md:table-cell tabular-nums">${row.goalsFor}</td>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-center text-zinc-600 dark:text-zinc-300 font-medium hidden md:table-cell tabular-nums">${row.goalsAgainst}</td>
                                  <td 
                                    className=${`py-2.5 px-2 sm:py-3.5 sm:px-4 text-center font-black ${
                                      row.goalDifference > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                      row.goalDifference < 0 ? 'text-rose-600 dark:text-rose-400' :
                                      'text-zinc-500 dark:text-zinc-400'
                                    }`}
                                    title=${`Top Fərqi (TF): ${row.goalsFor} vurulub - ${row.goalsAgainst} buraxılıb = ${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}`}
                                  >
                                    ${row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                  </td>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-3 text-center hidden md:table-cell tabular-nums">
                                    <div className="flex items-center justify-center gap-1">
                                      ${getTeamForm(row.class).map((f, i) => html`
                                        <span key=${i} className=${`w-4 h-4 rounded text-[8px] font-mono font-black inline-flex items-center justify-center text-white shadow-2xs ${
                                          f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`} title=${f === 'W' ? 'Qələbə' : f === 'D' ? 'Heç-heçə' : 'Məğlubiyyət'}>
                                          ${f}
                                        </span>
                                      `)}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-2 sm:py-3.5 sm:px-6 text-center tabular-nums">
                                    <span className="inline-block min-w-[1.75rem] sm:min-w-[2rem] py-0.5 sm:py-1 px-1.5 sm:px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-black text-xs sm:text-sm shadow-2xs border border-zinc-200 dark:border-zinc-700">
                                      ${row.points}
                                    </span>
                                  </td>
                                </tr>
                              `;
                            })
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

              `;
            })
          }

          <!-- Abbreviations Legend -->
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-[20px] border border-zinc-200 dark:border-zinc-800">
            <div><span className="text-zinc-900 dark:text-zinc-200 font-extrabold mr-1">O:</span> ${lang === 'az' ? 'Oyun Sayı' : 'Played'}</div>
            <div><span className="text-emerald-600 dark:text-emerald-400 font-extrabold mr-1">Q:</span> ${lang === 'az' ? 'Qələbə' : 'Won'}</div>
            <div><span className="text-zinc-700 dark:text-zinc-300 font-extrabold mr-1">H:</span> ${lang === 'az' ? 'Heç-heçə' : 'Drawn'}</div>
            <div><span className="text-rose-600 dark:text-rose-400 font-extrabold mr-1">M:</span> ${lang === 'az' ? 'Məğlubiyyət' : 'Lost'}</div>
            <div><span className="text-zinc-900 dark:text-zinc-200 font-extrabold mr-1">TF:</span> ${lang === 'az' ? 'Top Fərqi' : 'Goal Diff'}</div>
            <div className="hidden md:block"><span className="text-zinc-900 dark:text-zinc-200 font-extrabold mr-1">VQ/BQ:</span> ${lang === 'az' ? 'Vuruldu / Buraxıldı' : 'GF / GA'}</div>
            <div className="col-span-2 md:col-span-6 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 font-bold tabular-nums">
              <i className="fas fa-info-circle text-emerald-600 dark:text-emerald-400"></i>
              <span>${lang === 'az' ? 'Aydınlaşdırma: "TF" (+34 və s.) tək bir oyunçunun qolu deyil, komandanın vurduğu və buraxdığı qollar arasındakı Top Fərqidir (məs: 43 vurulub - 9 buraxılıb = +34 TF).' : 'Clarification: "GD" (+34 etc.) is Team Goal Difference, not individual player goals (e.g. 43 scored - 9 conceded = +34 GD).'}</span>
            </div>
          </div>
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
            <div className="lg:col-span-5 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-purple-950 p-6 rounded-3xl shadow-sm border border-amber-300 relative overflow-hidden flex flex-col justify-between">
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
                
                <p className="text-xs font-bold text-purple-950/80 mt-1.5 tabular-nums">
                  ${championTeam 
                    ? `${getDivisionLabel(activeDivision)} Çempionu və Qızıl Medal Sahibi` 
                    : 'Pley-off final oyunu tamamlandıqdan sonra çempion burada elan ediləcək'}
                </p>
              </div>

              <!-- Podiums for 2nd and 3rd -->
              <div className="grid grid-cols-2 gap-2.5 mt-5 relative z-10 pt-3 border-t border-amber-400/60">
                <div className="bg-purple-950/20 backdrop-blur-xs p-2.5 rounded-[20px] border border-white/20">
                  <span className="text-[9px] font-black uppercase text-purple-950 block flex items-center gap-1">
                    <i className="fas fa-medal text-slate-200"></i> 2-ci Yer (Finalçı)
                  </span>
                  <p className="text-xs font-black text-purple-950 truncate mt-0.5">
                    ${runnerUpTeam ? `${runnerUpTeam} Sinfi` : 'Gözlənilir'}
                  </p>
                </div>

                <div className="bg-purple-950/20 backdrop-blur-xs p-2.5 rounded-[20px] border border-white/20">
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
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <i className="fas fa-star"></i> MVP
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 tabular-nums">Ən Dəyərli</span>
                  </div>
                  <h4
                    onClick=${() => mvpPlayer && onOpenPlayerProfile && onOpenPlayerProfile(mvpPlayer.name)}
                    className=${`text-sm font-black text-zinc-900 dark:text-white truncate ${mvpPlayer ? 'cursor-pointer hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors' : ''}`}
                    title=${mvpPlayer ? (lang === 'az' ? 'Karyera profilinə bax' : 'View career profile') : ''}
                  >
                    ${mvpPlayer ? mvpPlayer.name : 'Təyin edilməyib'}
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                    ${mvpPlayer ? `${mvpPlayer.class} Sinfi` : '-'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold tabular-nums">Sofascore:</span>
                  <span className=${`text-xs font-black px-2 py-0.5 rounded-md ${getSofascoreBadgeStyle(mvpPlayer?.overallRating || 6.5)}`}>
                    ${mvpPlayer ? mvpPlayer.overallRating : '-'}
                  </span>
                </div>
              </div>

              <!-- Golden Boot (Bombardir) Card -->
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <i className="fas fa-shoe-prints"></i> Bombardir
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 tabular-nums">Qızıl Butsa</span>
                  </div>
                  <h4
                    onClick=${() => topScorer && onOpenPlayerProfile && onOpenPlayerProfile(topScorer.name)}
                    className=${`text-sm font-black text-zinc-900 dark:text-white truncate ${topScorer ? 'cursor-pointer hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors' : ''}`}
                    title=${topScorer ? (lang === 'az' ? 'Karyera profilinə bax' : 'View career profile') : ''}
                  >
                    ${topScorer ? topScorer.name : 'Təyin edilməyib'}
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                    ${topScorer ? `${topScorer.class} Sinfi` : '-'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold tabular-nums">${lang === 'az' ? 'Qollar:' : 'Goals:'}</span>
                  <span className="goal-badge text-xs font-black px-2.5 py-0.5 rounded-md shadow-xs">
                    ⚽ ${topScorer ? topScorer.goals : 0} ${t('goals')}
                  </span>
                </div>
              </div>

              <!-- Golden Glove (Qızıl Əlcək) Card -->
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <i className="fas fa-mitten"></i> Qapıçı
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 tabular-nums">Qızıl Əlcək</span>
                  </div>
                  <h4
                    onClick=${() => bestGoalkeeper && onOpenPlayerProfile && onOpenPlayerProfile(bestGoalkeeper.name)}
                    className=${`text-sm font-black text-zinc-900 dark:text-white truncate ${bestGoalkeeper ? 'cursor-pointer hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors' : ''}`}
                    title=${bestGoalkeeper ? (lang === 'az' ? 'Karyera profilinə bax' : 'View career profile') : ''}
                  >
                    ${bestGoalkeeper ? bestGoalkeeper.name : 'Təyin edilməyib'}
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                    ${bestGoalkeeper ? `${bestGoalkeeper.class} Sinfi` : '-'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold tabular-nums">Reytinq:</span>
                  <span className=${`text-xs font-black px-2 py-0.5 rounded-md ${getSofascoreBadgeStyle(bestGoalkeeper?.overallRating || 6.5)}`}>
                    ${bestGoalkeeper ? bestGoalkeeper.overallRating : '-'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          <!-- DREAM TEAM (RƏMZİ 5-LİK) EXPANDER -->
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-black text-xs border border-amber-500/20">
                  <i className="fas fa-star"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                    Turnirin Rəmzi 5-liyi (Dream Team)
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Sofascore performans statistikasına əsasən mövsümün ən yaxşı oyunçuları
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-full uppercase">
                ${activeYear}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              ${dreamTeam.length === 0 
                ? html`<div className="col-span-5 text-center text-xs text-zinc-400 dark:text-zinc-500 py-2 tabular-nums">Hələ qeydə alınmış oyunçu statistikası yoxdur.</div>`
                : dreamTeam.map((player, i) => html`
                    <div
                      key=${player.id || i}
                      onClick=${() => onOpenPlayerProfile && onOpenPlayerProfile(player.name)}
                      className="bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-3 rounded-[20px] border border-zinc-200/80 dark:border-zinc-700/60 transition-all flex items-center justify-between space-x-2 cursor-pointer"
                      title=${lang === 'az' ? 'Karyera profilinə bax' : 'View career profile'}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className=${`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                          i === 0 ? 'bg-amber-400 text-zinc-950' : i === 1 ? 'bg-zinc-300 text-zinc-950' : i === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                        }`}>
                          ${i + 1}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-black text-zinc-900 dark:text-white truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">${player.name}</div>
                          <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">${player.class} • ${player.position || 'Oyunçu'}</div>
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
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center shadow-xs space-y-4 transition-colors duration-200 tabular-nums">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-[20px] flex items-center justify-center mx-auto text-2xl border border-zinc-200 dark:border-zinc-700">
                    <i className="fas fa-sitemap"></i>
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white">Bu qrupda pley-off oyunları hələ qeydə alınmayıb</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                      Qrup mərhələsi yekunlaşdıqdan sonra Admin panelindən daxil edilən pley-off qarşılaşmaları (16/1, 8/1, 4/1, Yarımfinal və Final) avtomatik olaraq bu ağac üzərində canlı görünəcəkdir.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick=${() => setShowEmptyPreview(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-[8px] transition inline-flex items-center gap-2 shadow-xs cursor-pointer tabular-nums"
                    >
                      <i className="fas fa-eye"></i> Pley-off Torunun Boş Şablonuna Bax
                    </button>
                  </div>
                </div>
              `
            : html`
                <div className="bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs overflow-x-auto no-scrollbar transition-colors duration-200">
                  
                  <!-- Tournament Track Switcher (For seasons with multiple playoff tournaments like 2017-2018) -->
                  ${activeYear === '2017-2018' && html`
                    <div className="flex flex-wrap items-center gap-2 mb-4 p-1.5 bg-white dark:bg-zinc-900 rounded-[20px] border border-zinc-200 dark:border-zinc-800 shadow-2xs w-fit">
                      <button
                        onClick=${() => setTournamentTrack('main')}
                        className=${`px-3.5 py-1.5 rounded-[8px] text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                          tournamentTrack === 'main'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <i className="fas fa-sitemap text-xs"></i>
                        <span>1/8 Final Toru (Əsas Kubok - 16 Komanda)</span>
                      </button>
                      <button
                        onClick=${() => setTournamentTrack('group_cup')}
                        className=${`px-3.5 py-1.5 rounded-[8px] text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                          tournamentTrack === 'group_cup'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <i className="fas fa-trophy text-xs text-amber-500"></i>
                        <span>11-ci Siniflər Kuboku (Qrup Pley-offu)</span>
                      </button>
                    </div>
                  `}

                  <!-- Instruction banner -->
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                    <span className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold tabular-nums">
                      <i className="fas fa-info-circle text-emerald-500"></i>
                      <span>İstənilən oyuna klikləyərək matç detallarına, video icmalına və Sofascore oyunçu reytinqlərinə baxa bilərsiniz.</span>
                    </span>
                    <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-extrabold flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
                      👈 Sağa/sola sürüşdürün 👉
                    </span>
                  </div>

                  <!-- Multi-Column Interactive Tree -->
                  <div className="flex items-stretch gap-10 min-w-max pb-4">
                    
                    <!-- COLUMN 1: 16/1 FINAL (If present) -->
                    ${hasStage16 && html`
                      <div className="flex flex-col justify-between">
                        <div className="text-center mb-4 tabular-nums">
                          <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                            <i className="fas fa-shield-alt mr-1 text-emerald-600 dark:text-emerald-400"></i> 16/1 Final
                          </span>
                          <span className="text-[9px] text-zinc-400 block font-semibold mt-1">16-da 1 Mərhələ</span>
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
                        <div className="text-center mb-4 tabular-nums">
                          <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                            <i className="fas fa-shield-halved mr-1 text-emerald-600 dark:text-emerald-400"></i> 8/1 Final
                          </span>
                          <span className="text-[9px] text-zinc-400 block font-semibold mt-1">Səkkizdəbir Final</span>
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
                        <div className="text-center mb-4 tabular-nums">
                          <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                            <i className="fas fa-cubes mr-1 text-emerald-600 dark:text-emerald-400"></i> 4/1 Final
                          </span>
                          <span className="text-[9px] text-zinc-400 block font-semibold mt-1">Dörddəbir Final</span>
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
                      <div className="text-center mb-4 tabular-nums">
                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          <i className="fas fa-flag-checkered mr-1 text-emerald-600 dark:text-emerald-400"></i> Yarımfinal
                        </span>
                        <span className="text-[9px] text-zinc-400 block font-semibold mt-1">1/2 Mərhələ</span>
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
                        <div className="text-center mb-4 tabular-nums">
                          <span className="text-[10px] font-black text-white bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 px-3.5 py-1 rounded-full uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5 mx-auto w-max">
                            <i className="fas fa-trophy text-amber-400"></i> BÖYÜK FİNAL
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1 tabular-nums">Çempionluq Matçı</span>
                        </div>

                        <div className="relative">
                          ${renderBracketMatchCard(slotsFinal[0], 'Final', 0)}
                        </div>
                      </div>

                      <!-- 3rd Place Match (If registered or available) -->
                      ${stageThirdMatches.length > 0 && html`
                        <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                          <div className="text-center mb-3 tabular-nums">
                            <span className="text-[9px] font-black text-amber-900 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs inline-block">
                              <i className="fas fa-award text-amber-500 mr-1"></i> 3-cü Yer Uğrunda
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
