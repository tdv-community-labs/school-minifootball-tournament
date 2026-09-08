import { useRealFirebase, firebaseConfig } from './firebase-config.js';
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { ARCHIVE_YEARS, ARCHIVE_CLASSES, ARCHIVE_MATCHES, ARCHIVE_PLAYERS } from './archiveData.js?v=20260909_0070';
import { isMatchDivision } from './i18n.js';
import { auditTournamentData, repairTournamentData, startBackgroundSelfHealing } from './selfHealing.js?v=20260909_0070';

// Initialize Firebase if useRealFirebase toggle is true
let firestore = null;
if (useRealFirebase) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestore = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// Real-time Mojibake Sanitizer for Azerbaijani Characters
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  if (/[ÃÅÄÉ]/.test(text)) {
    try {
      const bytes = new Uint8Array([...text].map(c => c.charCodeAt(0) & 0xFF));
      const decoded = new TextDecoder('utf-8').decode(bytes);
      if (decoded && !decoded.includes('\uFFFD')) return decoded;
    } catch (e) {}
    return text
      .replace(/HÃ¼cumÃ§u/g, 'Hücumçu')
      .replace(/Ã¼/g, 'ü')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã¶/g, 'ö')
      .replace(/É™/g, 'ə')
      .replace(/É˜/g, 'Ə')
      .replace(/ÅŸ/g, 'ş')
      .replace(/Åž/g, 'Ş')
      .replace(/ÄŸ/g, 'ğ')
      .replace(/Ä±/g, 'ı')
      .replace(/Ä°/g, 'İ')
      .replace(/Ã‡/g, 'Ç');
  }
  return text;
};

export const sanitizeObject = (obj) => {
  if (typeof obj === 'string') return sanitizeText(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const key in obj) {
      res[key] = sanitizeObject(obj[key]);
    }
    return res;
  }
  return obj;
};

// Character-normalizer for Azerbaijani player names
export const normalizePlayerName = (name) => {
  return (name || '')
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

export const OBSOLETE_PLAYER_IDS = [
  'p_2018_azer_10f',
  'p_2018_ilkin_11h',
  'p_2018_xezer_11h',
  'p_2018_rüstem_11h',
  'p_2017_ağəkərim_10e',
  'p_2017_avtoqol_10a',
  'p_2017_avtoqol_11f',
  'p_2017_avtoqol_11h',
  'p_2017_rüstəm(özünə_qol)_11e',
  'p_2017_şamxal(özünə_qol)_11e',
  'p_2018_seddad(öq)_11e',
  'p_22_asim_liyev_10c_10e'
];

// ─────────────────────────────────────────────────────────────────────────────
// SOFASCORE RATING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * calculateSofascoreRating(stat, playerRole, matchContext)
 *
 * @param {Object} stat          – Per-match player stat object
 *   { goals, assists, yellowCards, redCards, ownGoals, saves }
 * @param {Object} playerRole    – { isKeeper: boolean }
 * @param {Object} matchContext  – { isFinal: boolean, teamWon: boolean,
 *                                   goalDiff: number, goalsAgainst: number }
 * @returns {number}             – Rating clamped to [1.0 – 10.0]
 */
export const calculateSofascoreRating = (stat = {}, playerRole = {}, matchContext = {}) => {
  const BASE = 6.50;
  let rating = BASE;

  const goals      = Number(stat.goals      || 0);
  const assists    = Number(stat.assists     || 0);
  const yellow     = Number(stat.yellowCards || 0);
  const red        = Number(stat.redCards    || 0);
  const ownGoals   = Number(stat.ownGoals    || 0);
  const saves      = Number(stat.saves       || 0);

  const isKeeper     = playerRole.isKeeper    === true;
  const isFinal      = matchContext.isFinal   === true;
  const teamWon      = matchContext.teamWon    === true;
  const goalDiff     = Number(matchContext.goalDiff     || 0);
  const goalsAgainst = Number(matchContext.goalsAgainst || 0);

  // xG/xA forward-compat: add only when present and > 0, so existing data is unaffected
  const xG  = Number(stat.xG  || 0);
  const xA  = Number(stat.xA  || 0);

  if (isKeeper) {
    // ── Goalkeeper scoring ──────────────────────────────────────────────
    const cleanSheet = goalsAgainst === 0;

    if (cleanSheet) {
      rating += 1.00;
      if (isFinal) rating += 0.20; // Final bonus
    } else {
      rating -= goalsAgainst * 0.30; // -0.30 per goal conceded
    }

    if (saves > 0) rating += saves * 0.20; // +0.20 per save

    // xG forward-compat
    if (xG > 0) rating += xG * 0.10; // modest bonus for high-xG saves

    if (yellow > 0) rating -= yellow * 0.40;
    if (red    > 0) rating -= red    * 2.00;
  } else {
    // ── Outfield player scoring ─────────────────────────────────────────
    if (goals   > 0) {
      rating += goals   * 0.80;
      if (isFinal) rating += goals * 0.20; // Final bonus per goal
    }
    if (assists > 0) {
      rating += assists * 0.50;
      if (isFinal) rating += assists * 0.20; // Final bonus per assist
    }

    // xG/xA forward-compat
    if (xG > 0) rating += xG * 0.15;
    if (xA > 0) rating += xA * 0.10;

    if (yellow  > 0) rating -= yellow  * 0.40;
    if (red     > 0) rating -= red     * 2.00;
    if (ownGoals > 0) rating -= ownGoals * 1.00;

    // Team result modifiers
    if (teamWon) {
      rating += 0.30;
    } else if (goalDiff <= -3) {
      rating -= 0.40; // Darmadağın məğlubiyyət (>= 3 qol fərqi)
    }
  }

  // Clamp to [1.0, 10.0]
  return Number(Math.min(10.0, Math.max(1.0, rating)).toFixed(1));
};

/**
 * getSofascoreBadgeStyle(rating)
 * Returns Tailwind class string for rating badge colouring.
 * @param {number} rating
 * @returns {string}
 */
export const getSofascoreBadgeStyle = (rating) => {
  const r = Number(rating) || 0;
  if (r >= 9.0) return 'bg-[#1d4ed8] text-white font-black shadow-md shadow-blue-700/40 rating-sofascore-9plus';  // 9+ Tünd Canlı Göy (Royal Blue)
  if (r >= 8.0) return 'bg-[#0284c7] text-white font-black shadow-md shadow-sky-500/30 rating-sofascore-8plus';   // 8+ Mavi (Sky Blue)
  if (r >= 7.0) return 'bg-[#15803d] text-white font-bold rating-sofascore-7plus';                               // 7+ Tünd Yaşıl
  if (r >= 6.5) return 'bg-[#eab308] text-slate-950 font-black rating-sofascore-65plus';                        // 6.5+ Sarı
  if (r >= 6.0) return 'bg-[#f97316] text-white font-bold rating-sofascore-6plus';                              // 6+ Narıncı
  return 'bg-[#dc2626] text-white font-bold rating-sofascore-below6';                                            // 6- Qırmızı
};

/**
 * Computes an intelligent overall Sofascore rating for a player
 * based on match averages, or accumulated season metrics (goals, assists, matches)
 * if match-by-match stats are not available.
 */
export const computePlayerOverallRating = (stats = {}, initialPlayer = {}) => {
  if (stats.ratingCount > 0) {
    return Number((stats.ratingSum / stats.ratingCount).toFixed(1));
  }

  const goals = Number(stats.goals > 0 ? stats.goals : initialPlayer.goals || 0);
  const assists = Number(stats.assists > 0 ? stats.assists : initialPlayer.assists || 0);
  const isKeeper = (initialPlayer.position || '').toLowerCase().includes('qap');

  // If player already had an explicitly assigned custom high rating and no goals, respect it
  if (initialPlayer.overallRating && Number(initialPlayer.overallRating) > 6.5 && goals === 0) {
    return Number(Number(initialPlayer.overallRating).toFixed(1));
  }

  // Base rating
  let rating = 6.5;

  if (isKeeper) {
    rating = 6.8;
  } else {
    // Dynamic Sofascore curve based on goal scoring performance
    if (goals >= 20) rating = 9.8;
    else if (goals >= 17) rating = 9.5;
    else if (goals >= 14) rating = 9.2;
    else if (goals >= 11) rating = 8.9;
    else if (goals >= 9)  rating = 8.6;
    else if (goals >= 7)  rating = 8.3;
    else if (goals >= 5)  rating = 7.9;
    else if (goals >= 3)  rating = 7.5;
    else if (goals >= 2)  rating = 7.2;
    else if (goals >= 1)  rating = 6.9;

    // Assists bonus
    if (assists > 0) {
      rating += Math.min(0.8, assists * 0.15);
    }
  }

  return Number(Math.min(10.0, Math.max(1.0, rating)).toFixed(1));
};

// ─────────────────────────────────────────────────────────────────────────────

// Seed Initial Classes with historical archive
const initialClasses = ARCHIVE_CLASSES || [];

// Seed Initial Players with historical archive
const initialPlayers = ARCHIVE_PLAYERS || [];

const initialMatches = ARCHIVE_MATCHES || [];

const initializeStorage = () => {
  const defaultYears = ["2025-2026", "2024-2025", "2023-2024", "2022-2023", "2021-2022", "2018-2019", "2017-2018"];
  if (!localStorage.getItem('minifootball_years')) {
    localStorage.setItem('minifootball_years', JSON.stringify(defaultYears));
  } else {
    // Migration: make sure new default years are present in the list
    let existingYears = JSON.parse(localStorage.getItem('minifootball_years') || '[]');
    let updated = false;
    defaultYears.forEach(y => {
      if (!existingYears.includes(y)) {
        existingYears.push(y);
        updated = true;
      }
    });
    if (updated) {
      // Sort years in descending order to keep newest first
      existingYears.sort((a, b) => b.localeCompare(a));
      localStorage.setItem('minifootball_years', JSON.stringify(existingYears));
    }
  }
  if (!localStorage.getItem('minifootball_classes') || JSON.parse(localStorage.getItem('minifootball_classes')).length === 0) {
    localStorage.setItem('minifootball_classes', JSON.stringify(initialClasses));
    localStorage.setItem('minifootball_players', JSON.stringify(initialPlayers));
    localStorage.setItem('minifootball_matches', JSON.stringify(initialMatches));
  }
  recalculateData();
};


export const KNOWN_GROUP_SEEDS = {
  '2018-2019:11': { 'A': ['11A', '11E', '11H'], 'B': ['11B', '11D', '10F'] },
  '2017-2018:11': { 'A': ['11B', '11H', '11D'], 'B': ['11A', '11E', '11C'] },
  '2021-2022:6': { 'A': ['6D', '6E', '6F'], 'B': ['6A', '6B', '6C'] },
  '2021-2022:7-8': { 'A': ['7A', '7C', '7E'], 'B': ['7B', '7D', '7F'], 'C': ['8A', '8B', '8E'], 'D': ['8C', '8D', '8F'] },
  '2021-2022:11': { 'A': ['10A', '11H', '11F'], 'B': ['10B', '11B', '11D/A'] },
  '2022-2023:11': { 'A': ['10A', '11D', '11H'], 'B': ['10B', '11B', '11C'] },
  '2022-2023:7-8': { 'A': ['7A', '7B'], 'B': ['8A', '8B'] },
  '2022-2023:9-10': { 'A': ['10A', '10D'], 'B': ['10B', '10F'], 'C': ['9A', '9B'] },
};

export const assignGroupsToTeams = (teamsList, matchesList, yr, div) => {
  if (!teamsList || teamsList.length === 0) return teamsList;

  const isGroupStage = (stage) => {
    if (!stage) return true;
    const s = stage.toLowerCase();
    if (s.includes('qrup') || s.includes('group')) return true;
    if (s.includes('final') || s.includes('1/2') || s.includes('yarim') || 
        s.includes('4/1') || s.includes('8/1') || s.includes('16/1') || 
        s.includes('3-cü') || s.includes('burunc')) {
      return false;
    }
    return true;
  };

  const groupMatches = (matchesList || []).filter(m => 
    m.year === yr && isMatchDivision(m.division, div) && isGroupStage(m.stage)
  );

  const adj = {};
  const teamsInMatches = new Set();
  groupMatches.forEach(m => {
    if (m.teamA && m.teamB) {
      if (!adj[m.teamA]) adj[m.teamA] = new Set();
      if (!adj[m.teamB]) adj[m.teamB] = new Set();
      adj[m.teamA].add(m.teamB);
      adj[m.teamB].add(m.teamA);
      teamsInMatches.add(m.teamA);
      teamsInMatches.add(m.teamB);
    }
  });

  const visited = new Set();
  const comps = [];
  const allTeamNames = Array.from(new Set([
    ...teamsList.map(t => t.class),
    ...Array.from(teamsInMatches)
  ])).sort();

  allTeamNames.forEach(t => {
    if (adj[t] && !visited.has(t)) {
      const comp = [];
      const queue = [t];
      visited.add(t);
      while (queue.length > 0) {
        const curr = queue.shift();
        comp.push(curr);
        (adj[curr] || []).forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        });
      }
      comps.push(comp.sort());
    }
  });

  const seeds = KNOWN_GROUP_SEEDS[`${yr}:${div}`];
  const groupMapping = {};

  if (comps.length > 1) {
    const namedComps = {};
    const usedCompIndices = new Set();

    if (seeds) {
      Object.entries(seeds).forEach(([gLetter, seedTeams]) => {
        comps.forEach((comp, cIdx) => {
          if (!usedCompIndices.has(cIdx) && comp.some(t => seedTeams.includes(t))) {
            namedComps[gLetter] = comp;
            usedCompIndices.add(cIdx);
          }
        });
      });
    }

    const remainingComps = comps
      .map((comp, idx) => ({ comp, idx }))
      .filter(({ idx }) => !usedCompIndices.has(idx))
      .sort((a, b) => a.comp[0].localeCompare(b.comp[0]));

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const availableLetters = letters.filter(l => !namedComps[l]);

    remainingComps.forEach(({ comp }) => {
      const nextLetter = availableLetters.shift() || 'A';
      namedComps[nextLetter] = comp;
    });

    Object.entries(namedComps).forEach(([letter, comp]) => {
      comp.forEach(teamName => {
        groupMapping[teamName] = letter;
      });
    });
  } else if (comps.length === 1) {
    comps[0].forEach(teamName => {
      groupMapping[teamName] = 'A';
    });
  }

  teamsList.forEach(team => {
    if (groupMapping[team.class]) {
      team.group = groupMapping[team.class];
    } else {
      if (comps.length > 1) {
        const letter = team.class.toUpperCase().slice(-1);
        team.group = (letter === 'A' || letter === 'C' || letter === 'E') ? 'A' : 'B';
      } else {
        team.group = 'A';
      }
    }
  });

  return teamsList;
};

export const recalculateData = () => {
  const classesList = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
  const players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
  const matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
  const years = JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025", "2023-2024", "2022-2023"]');
  const defaultYear = years[0] || "2025-2026";

  // Ensure every class has a year
  const updatedClassesList = classesList.map(c => {
    if (!c.year) c.year = defaultYear;
    return c;
  });
  localStorage.setItem('minifootball_classes', JSON.stringify(updatedClassesList));

  // Reset player stats accumulator
  const playerStatsMap = {};
  players.forEach(p => {
    playerStatsMap[p.id] = {
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      ratingSum: 0,
      ratingCount: 0
    };
  });

  // Calculate Standing Points Map: standingsMap[year][division][class]
  const standingsMap = {};
  const allTournamentDivisions = ['6', '7-8', '9', '10-11', '7', '8', '9-10', '11'];
  years.forEach(yr => {
    standingsMap[yr] = {};
    allTournamentDivisions.forEach(div => {
      standingsMap[yr][div] = {};
      
      // Initialize classes for this year and division
      const filteredClasses = updatedClassesList.filter(c => c.year === yr && isMatchDivision(c.division, div));
      filteredClasses.forEach(c => {
        standingsMap[yr][div][c.name] = {
          class: c.name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        };
      });
    });
  });

  // Process Matches
  matches.forEach(m => {
    const yr = m.year || defaultYear;
    const div = m.division || "10-11";

    // Match result context
    const isFinal    = m.stage === 'Final';
    const scoreA     = Number(m.scoreA || 0);
    const scoreB     = Number(m.scoreB || 0);
    const goalDiffAB = scoreA - scoreB;

    // Accumulate player match stats with Sofascore rating
    if (m.playerStats && Array.isArray(m.playerStats)) {
      m.playerStats.forEach(stat => {
        if (playerStatsMap[stat.playerId]) {
          playerStatsMap[stat.playerId].goals        += Number(stat.goals   || 0);
          playerStatsMap[stat.playerId].assists      += Number(stat.assists || 0);
          playerStatsMap[stat.playerId].matchesPlayed += 1;

          const playerInfo   = players.find(p => p.id === stat.playerId) || {};
          const playerTeam   = playerInfo.class || '';
          const teamWon      = playerTeam === m.teamA ? scoreA > scoreB
                             : playerTeam === m.teamB ? scoreB > scoreA : false;
          const myGoalDiff   = playerTeam === m.teamA ? goalDiffAB : -goalDiffAB;
          const goalsAgainst = playerTeam === m.teamA ? scoreB : scoreA;
          const isKeeper     = stat.isKeeper === true ||
            (playerInfo.position || '').toLowerCase().includes('qap');

          const computedRating = stat.rating
            ? Number(stat.rating)
            : calculateSofascoreRating(
                stat,
                { isKeeper },
                { isFinal, teamWon, goalDiff: myGoalDiff, goalsAgainst }
              );

          playerStatsMap[stat.playerId].ratingSum   += computedRating;
          playerStatsMap[stat.playerId].ratingCount += 1;
        }
      });
    }

    // Process team points only for group stage matches
    const isGroupMatch = m.stage === 'Qrup Mərhələsi' || m.stage === 'Qrup' || (m.stage || '').toLowerCase().includes('qrup');
    if (isGroupMatch) {
      const allDivKeys = Object.keys(standingsMap[yr] || {});
      const relevantDivs = allDivKeys.filter(d => isMatchDivision(m.division, d));
      relevantDivs.forEach(divKey => {
        const yearDivMap = standingsMap[yr]?.[divKey];
        if (yearDivMap) {
          if (!yearDivMap[m.teamA]) {
            yearDivMap[m.teamA] = { class: m.teamA, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
          }
          if (!yearDivMap[m.teamB]) {
            yearDivMap[m.teamB] = { class: m.teamB, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
          }

          const teamA = yearDivMap[m.teamA];
          const teamB = yearDivMap[m.teamB];

          teamA.played += 1;
          teamB.played += 1;

          teamA.goalsFor += m.scoreA;
          teamA.goalsAgainst += m.scoreB;
          teamB.goalsFor += m.scoreB;
          teamB.goalsAgainst += m.scoreA;

          if (m.scoreA > m.scoreB) {
            teamA.won += 1;
            teamA.points += 3;
            teamB.lost += 1;
          } else if (m.scoreA < m.scoreB) {
            teamB.won += 1;
            teamB.points += 3;
            teamA.lost += 1;
          } else {
            teamA.drawn += 1;
            teamA.points += 1;
            teamB.drawn += 1;
            teamB.points += 1;
          }
        }
      });
    }
  });

  // Calculate Standing order list
  const finalStandings = {};
  years.forEach(yr => {
    finalStandings[yr] = {};
    allTournamentDivisions.forEach(div => {
      if (!standingsMap[yr]?.[div]) {
        finalStandings[yr][div] = [];
        return;
      }
      const list = Object.values(standingsMap[yr][div]).map(team => {
        team.goalDifference = team.goalsFor - team.goalsAgainst;
        return team;
      });

      // Assign tournament groups (A, B, etc.)
      assignGroupsToTeams(list, matches, yr, div);

      // Sort: primary by group (if different), then by points, goalDifference, goalsFor
      list.sort((a, b) => {
        if (a.group && b.group && a.group !== b.group) return a.group.localeCompare(b.group);
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.class.localeCompare(b.class);
      });

      finalStandings[yr][div] = list;
    });
  });

  // Update players list with calculated values, division, and year
  const canonicalArchiveMap = new Map();
  (ARCHIVE_PLAYERS || []).forEach(ap => {
    canonicalArchiveMap.set(`${normalizePlayerName(ap.name)}_${ap.year || defaultYear}_${ap.class || ''}`, ap);
  });

  const updatedPlayers = players.map(p => {
    const stats = playerStatsMap[p.id] || { goals: 0, assists: 0, matchesPlayed: 0, ratingSum: 0, ratingCount: 0 };
    const classInfo = updatedClassesList.find(c => c.name === p.class && (!p.year || c.year === p.year));
    const division = p.division || (classInfo ? classInfo.division : "11");
    const year = p.year || (classInfo ? classInfo.year : defaultYear);
    const isKeeper = (p.position || '').toLowerCase().includes('qap');

    // Ground truth: If match stats exist, match stats are authoritative
    let goals = (stats.matchesPlayed > 0 || stats.goals > 0) ? stats.goals : (p.goals || 0);
    let assists = (stats.matchesPlayed > 0 || stats.assists > 0) ? stats.assists : (p.assists || 0);
    let matchesPlayed = stats.matchesPlayed > 0 ? stats.matchesPlayed : (p.matchesPlayed || 0);

    // Cross-check with canonical archive to prevent corrupted goals from persisting
    const canonKey = `${normalizePlayerName(p.name)}_${year}_${p.class || ''}`;
    const canonicalArchive = canonicalArchiveMap.get(canonKey);
    if (canonicalArchive) {
      if (stats.matchesPlayed === 0 && stats.goals === 0) {
        goals = canonicalArchive.goals || 0;
        assists = canonicalArchive.assists || 0;
        matchesPlayed = canonicalArchive.matchesPlayed || 0;
      }
    }

    if (matchesPlayed === 0 && (goals > 0 || assists > 0)) {
      matchesPlayed = Math.max(1, Math.ceil(goals / 2.5));
    }
    const overallRating = computePlayerOverallRating({ ...stats, goals, assists }, p);

    return {
      ...p,
      division,
      year,
      isKeeper,
      goals,
      assists,
      matchesPlayed,
      overallRating
    };
  });

  // Filter out own-goal records and deduplicate duplicate player profiles in same year & class
  const deduplicatedPlayers = [];
  const playerDedupMap = new Map();
  updatedPlayers.forEach(p => {
    if (p.isOwnGoal || /avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || '')) return;
    const key = `${normalizePlayerName(p.name)}_${p.year || defaultYear}_${p.class || ''}`;
    if (playerDedupMap.has(key)) {
      const existing = playerDedupMap.get(key);
      // NEVER sum duplicate profiles of the same player!
      if ((p.matchesPlayed || 0) > (existing.matchesPlayed || 0) && (p.goals || 0) > 0) {
        existing.goals = p.goals;
        existing.assists = p.assists;
        existing.matchesPlayed = p.matchesPlayed;
        existing.overallRating = p.overallRating;
      } else {
        existing.goals = Math.max(existing.goals || 0, p.goals || 0);
        existing.assists = Math.max(existing.assists || 0, p.assists || 0);
        existing.matchesPlayed = Math.max(existing.matchesPlayed || 0, p.matchesPlayed || 0);
        if ((p.overallRating || 0) > (existing.overallRating || 0)) existing.overallRating = p.overallRating;
      }
    } else {
      const cloned = { ...p };
      playerDedupMap.set(key, cloned);
      deduplicatedPlayers.push(cloned);
    }
  });

  localStorage.setItem('minifootball_players', JSON.stringify(deduplicatedPlayers));
  localStorage.setItem('minifootball_standings_divided', JSON.stringify(finalStandings));
};

export const recalculateInMemoryData = (classes, players, matches, yearsList) => {
  const defaultYear = yearsList[0] || "2025-2026";

  // Ensure every class has a year
  const updatedClassesList = classes.map(c => {
    if (!c.year) c.year = defaultYear;
    return c;
  });

  // Reset player stats accumulator
  const playerStatsMap = {};
  players.forEach(p => {
    playerStatsMap[p.id] = {
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      ratingSum: 0,
      ratingCount: 0
    };
  });

  // Calculate Standing Points Map: standingsMap[year][division][class]
  const standingsMap = {};
  const allTournamentDivisions = ['6', '7-8', '9', '10-11', '7', '8', '9-10', '11'];
  yearsList.forEach(yr => {
    standingsMap[yr] = {};
    allTournamentDivisions.forEach(div => {
      standingsMap[yr][div] = {};
      
      // Initialize classes for this year and division
      const filteredClasses = updatedClassesList.filter(c => c.year === yr && isMatchDivision(c.division, div));
      filteredClasses.forEach(c => {
        standingsMap[yr][div][c.name] = {
          class: c.name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        };
      });
    });
  });

  // Process Matches (recalculateInMemoryData — Firebase path)
  matches.forEach(m => {
    const yr = m.year || defaultYear;
    const div = m.division || "10-11";

    const isFinal    = m.stage === 'Final';
    const scoreA     = Number(m.scoreA || 0);
    const scoreB     = Number(m.scoreB || 0);
    const goalDiffAB = scoreA - scoreB;

    if (m.playerStats && Array.isArray(m.playerStats)) {
      m.playerStats.forEach(stat => {
        if (playerStatsMap[stat.playerId]) {
          playerStatsMap[stat.playerId].goals         += Number(stat.goals   || 0);
          playerStatsMap[stat.playerId].assists       += Number(stat.assists || 0);
          playerStatsMap[stat.playerId].matchesPlayed += 1;

          const playerInfo   = players.find(p => p.id === stat.playerId) || {};
          const playerTeam   = playerInfo.class || '';
          const teamWon      = playerTeam === m.teamA ? scoreA > scoreB
                             : playerTeam === m.teamB ? scoreB > scoreA : false;
          const myGoalDiff   = playerTeam === m.teamA ? goalDiffAB : -goalDiffAB;
          const goalsAgainst = playerTeam === m.teamA ? scoreB : scoreA;
          const isKeeper     = stat.isKeeper === true ||
            (playerInfo.position || '').toLowerCase().includes('qap');

          const computedRating = stat.rating
            ? Number(stat.rating)
            : calculateSofascoreRating(
                stat,
                { isKeeper },
                { isFinal, teamWon, goalDiff: myGoalDiff, goalsAgainst }
              );

          playerStatsMap[stat.playerId].ratingSum   += computedRating;
          playerStatsMap[stat.playerId].ratingCount += 1;
        }
      });
    }

    // Process team points only for group stage matches
    const isGroupMatch = m.stage === 'Qrup Mərhələsi' || m.stage === 'Qrup' || (m.stage || '').toLowerCase().includes('qrup');
    if (isGroupMatch) {
      const allDivKeys = Object.keys(standingsMap[yr] || {});
      const relevantDivs = allDivKeys.filter(d => isMatchDivision(m.division, d));
      relevantDivs.forEach(divKey => {
        const yearDivMap = standingsMap[yr]?.[divKey];
        if (yearDivMap) {
          // Ensure teams exist in mapping
          if (!yearDivMap[m.teamA]) {
            yearDivMap[m.teamA] = { class: m.teamA, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
          }
          if (!yearDivMap[m.teamB]) {
            yearDivMap[m.teamB] = { class: m.teamB, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
          }

          const teamA = yearDivMap[m.teamA];
          const teamB = yearDivMap[m.teamB];

          teamA.played += 1;
          teamB.played += 1;

          teamA.goalsFor += m.scoreA;
          teamA.goalsAgainst += m.scoreB;
          teamB.goalsFor += m.scoreB;
          teamB.goalsAgainst += m.scoreA;

          if (m.scoreA > m.scoreB) {
            teamA.won += 1;
            teamA.points += 3;
            teamB.lost += 1;
          } else if (m.scoreA < m.scoreB) {
            teamB.won += 1;
            teamB.points += 3;
            teamA.lost += 1;
          } else {
            teamA.drawn += 1;
            teamA.points += 1;
            teamB.drawn += 1;
            teamB.points += 1;
          }
        }
      });
    }
  });

  // Calculate Standing order list
  const finalStandings = {};
  yearsList.forEach(yr => {
    finalStandings[yr] = {};
    allTournamentDivisions.forEach(div => {
      if (!standingsMap[yr]?.[div]) {
        finalStandings[yr][div] = [];
        return;
      }
      const list = Object.values(standingsMap[yr][div]).map(team => {
        team.goalDifference = team.goalsFor - team.goalsAgainst;
        return team;
      });

      // Assign tournament groups (A, B, etc.)
      assignGroupsToTeams(list, matches, yr, div);

      // Sort: primary by group (if different), then by points, goalDifference, goalsFor
      list.sort((a, b) => {
        if (a.group && b.group && a.group !== b.group) return a.group.localeCompare(b.group);
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.class.localeCompare(b.class);
      });

      finalStandings[yr][div] = list;
    });
  });

  const canonicalArchiveMap = new Map();
  (ARCHIVE_PLAYERS || []).forEach(ap => {
    canonicalArchiveMap.set(`${normalizePlayerName(ap.name)}_${ap.year || defaultYear}_${ap.class || ''}`, ap);
  });

  // Update players list with calculated values, division, and year
  const updatedPlayers = players.map(p => {
    const stats = playerStatsMap[p.id] || { goals: 0, assists: 0, matchesPlayed: 0, ratingSum: 0, ratingCount: 0 };
    const classInfo = updatedClassesList.find(c => c.name === p.class && (!p.year || c.year === p.year));
    const division = p.division || (classInfo ? classInfo.division : "11");
    const year = p.year || (classInfo ? classInfo.year : defaultYear);
    const isKeeper = (p.position || '').toLowerCase().includes('qap');

    // Ground truth: If match stats exist, match stats are authoritative
    let goals = (stats.matchesPlayed > 0 || stats.goals > 0) ? stats.goals : (p.goals || 0);
    let assists = (stats.matchesPlayed > 0 || stats.assists > 0) ? stats.assists : (p.assists || 0);
    let matchesPlayed = stats.matchesPlayed > 0 ? stats.matchesPlayed : (p.matchesPlayed || 0);

    // Cross-check with canonical archive to prevent corrupted goals from persisting
    const canonKey = `${normalizePlayerName(p.name)}_${year}_${p.class || ''}`;
    const canonicalArchive = canonicalArchiveMap.get(canonKey);
    if (canonicalArchive) {
      if (stats.matchesPlayed === 0 && stats.goals === 0) {
        goals = canonicalArchive.goals || 0;
        assists = canonicalArchive.assists || 0;
        matchesPlayed = canonicalArchive.matchesPlayed || 0;
      }
    }

    if (matchesPlayed === 0 && (goals > 0 || assists > 0)) {
      matchesPlayed = Math.max(1, Math.ceil(goals / 2.5));
    }
    const overallRating = computePlayerOverallRating({ ...stats, goals, assists }, p);

    return {
      ...p,
      division,
      year,
      isKeeper,
      goals,
      assists,
      matchesPlayed,
      overallRating
    };
  });

  // Filter out own-goal records and deduplicate duplicate player profiles in same year & class
  const deduplicatedPlayers = [];
  const playerDedupMap = new Map();
  updatedPlayers.forEach(p => {
    if (p.isOwnGoal || /avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || '')) return;
    const key = `${normalizePlayerName(p.name)}_${p.year || defaultYear}_${p.class || ''}`;
    if (playerDedupMap.has(key)) {
      const existing = playerDedupMap.get(key);
      // NEVER sum duplicate profiles of the same player!
      if ((p.matchesPlayed || 0) > (existing.matchesPlayed || 0) && (p.goals || 0) > 0) {
        existing.goals = p.goals;
        existing.assists = p.assists;
        existing.matchesPlayed = p.matchesPlayed;
        existing.overallRating = p.overallRating;
      } else {
        existing.goals = Math.max(existing.goals || 0, p.goals || 0);
        existing.assists = Math.max(existing.assists || 0, p.assists || 0);
        existing.matchesPlayed = Math.max(existing.matchesPlayed || 0, p.matchesPlayed || 0);
        if ((p.overallRating || 0) > (existing.overallRating || 0)) existing.overallRating = p.overallRating;
      }
    } else {
      const cloned = { ...p };
      playerDedupMap.set(key, cloned);
      deduplicatedPlayers.push(cloned);
    }
  });

  return {
    players: deduplicatedPlayers,
    standings: finalStandings
  };
};

// Initialize Mock Storage & Self-Healing
if (!useRealFirebase) {
  initializeStorage();
}
startBackgroundSelfHealing();

export const db = {
  // Years CRUD
  getYears: async () => {
    const defaultArchiveYears = ["2025-2026", "2024-2025", "2023-2024", "2022-2023", "2021-2022", "2018-2019", "2017-2018"];
    if (useRealFirebase && firestore) {
      console.log("Firebase: Fetching years...");
      try {
        const querySnapshot = await getDocs(collection(firestore, "years"));
        const list = [];
        querySnapshot.forEach(docSnap => {
          list.push(docSnap.id);
        });
        defaultArchiveYears.forEach(y => {
          if (!list.includes(y)) list.push(y);
        });
        console.log("Firebase: Years fetched: ", list);
        list.sort((a, b) => b.localeCompare(a));
        return list;
      } catch (err) {
        console.error("Firebase: getYears failed with error: ", err);
        return defaultArchiveYears;
      }
    }
    const local = JSON.parse(localStorage.getItem('minifootball_years') || '[]');
    const merged = Array.from(new Set([...local, ...defaultArchiveYears])).sort((a, b) => b.localeCompare(a));
    return merged;
  },

  addYear: async (year) => {
    if (useRealFirebase && firestore) {
      try {
        await setDoc(doc(firestore, "years", year), {});
      } catch (err) {
        console.error("Firebase addYear failed:", err);
      }
    }
    const years = JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025", "2023-2024", "2022-2023"]');
    if (!years.includes(year)) {
      years.unshift(year);
      localStorage.setItem('minifootball_years', JSON.stringify(years));
    }
    recalculateData();
    return year;
  },

  deleteYear: async (year) => {
    if (useRealFirebase && firestore) {
      try {
        await deleteDoc(doc(firestore, "years", year));
      } catch (err) {
        console.error("Firebase deleteYear failed:", err);
      }
    }
    
    let years = JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025", "2023-2024", "2022-2023"]');
    years = years.filter(y => y !== year);
    localStorage.setItem('minifootball_years', JSON.stringify(years));

    let classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classesToDelete = classes.filter(c => c.year === year);
    classes = classes.filter(c => c.year !== year);
    localStorage.setItem('minifootball_classes', JSON.stringify(classes));

    let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    const playersToDelete = players.filter(p => p.year === year);
    players = players.filter(p => p.year !== year);
    localStorage.setItem('minifootball_players', JSON.stringify(players));

    let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    const matchesToDelete = matches.filter(m => m.year === year);
    matches = matches.filter(m => m.year !== year);
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));

    if (useRealFirebase && firestore) {
      try {
        for (let c of classesToDelete) { await deleteDoc(doc(firestore, "classes", c.id)); }
        for (let p of playersToDelete) { await deleteDoc(doc(firestore, "players", p.id)); }
        for (let m of matchesToDelete) { await deleteDoc(doc(firestore, "matches", m.id)); }
      } catch (err) {
        console.error("Firebase cascade deletes failed:", err);
      }
    }

    recalculateData();
  },

  // Classes CRUD
  getClasses: async (year) => {
    let list = [];
    if (useRealFirebase && firestore) {
      console.log("Firebase: Fetching classes...");
      try {
        const querySnapshot = await getDocs(collection(firestore, "classes"));
        querySnapshot.forEach(docSnap => {
          list.push(sanitizeObject(docSnap.data()));
        });
        console.log(`Firebase: Classes fetched: ${list.length} records. Filtering by year: ${year || 'all'}`);
      } catch (err) {
        console.error("Firebase: getClasses failed with error: ", err);
      }
    }
    if (list.length === 0) {
      list = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    }
    // Merge archive classes ensuring no duplicate IDs
    const existingIds = new Set(list.map(c => c.id || `${c.year}_${c.name}`));
    ARCHIVE_CLASSES.forEach(ac => {
      if (!existingIds.has(ac.id) && !existingIds.has(`${ac.year}_${ac.name}`)) {
        list.push(ac);
      }
    });
    if (year) {
      return list.filter(c => c.year === year);
    }
    return list;
  },


  addClass: async (cls) => {
    const newClass = {
      id: cls.id || "c_" + Date.now(),
      year: cls.year || "2025-2026",
      ...cls
    };
    if (useRealFirebase && firestore) {
      try {
        await setDoc(doc(firestore, "classes", newClass.id), newClass);
      } catch (err) {
        console.error("Firebase addClass failed:", err);
      }
    }
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    classes.push(newClass);
    localStorage.setItem('minifootball_classes', JSON.stringify(classes));
    recalculateData();
    return newClass;
  },

  deleteClass: async (id) => {
    if (useRealFirebase && firestore) {
      try {
        await deleteDoc(doc(firestore, "classes", id));
      } catch (err) {
        console.error("Firebase deleteClass failed:", err);
      }
    }
    let classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classToDelete = classes.find(c => c.id === id);
    classes = classes.filter(c => c.id !== id);
    localStorage.setItem('minifootball_classes', JSON.stringify(classes));
    
    if (classToDelete) {
      let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
      const playersToDelete = players.filter(p => p.class === classToDelete.name && p.year === classToDelete.year);
      players = players.filter(p => p.class !== classToDelete.name || p.year !== classToDelete.year);
      localStorage.setItem('minifootball_players', JSON.stringify(players));

      if (useRealFirebase && firestore) {
        try {
          for (let p of playersToDelete) { await deleteDoc(doc(firestore, "players", p.id)); }
        } catch (err) {
          console.error("Firebase cascade delete players failed:", err);
        }
      }
    }
    recalculateData();
  },

  // Players CRUD
  getPlayers: async (year) => {
    if (useRealFirebase && firestore) {
      console.log(`Firebase: Fetching players, classes, and matches for year: ${year || 'all'}...`);
      try {
        const [cSnap, pSnap, mSnap] = await Promise.all([
          getDocs(collection(firestore, "classes")),
          getDocs(collection(firestore, "players")),
          getDocs(collection(firestore, "matches"))
        ]);
        const classes = [];
        cSnap.forEach(d => classes.push(sanitizeObject(d.data())));
        const players = [];
        pSnap.forEach(d => players.push(sanitizeObject(d.data())));
        const matches = [];
        mSnap.forEach(d => matches.push(sanitizeObject(d.data())));
        const baseYears = ["2025-2026", "2024-2025", "2023-2024", "2022-2023", "2021-2022", "2018-2019", "2017-2018"];
        // Merge archive classes, players, and matches
        const cIds = new Set(classes.map(c => c.id || `${c.year}_${c.name}`));
        ARCHIVE_CLASSES.forEach(ac => { if (!cIds.has(ac.id) && !cIds.has(`${ac.year}_${ac.name}`)) classes.push(ac); });
        const obsoleteSet = new Set(OBSOLETE_PLAYER_IDS);
        const validPlayers = players.filter(p => !obsoleteSet.has(p.id));

        // Background purge of obsolete duplicates from Firestore
        if (useRealFirebase && firestore) {
          players.forEach(p => {
            if (obsoleteSet.has(p.id)) {
              deleteDoc(doc(firestore, "players", p.id)).catch(() => {});
            }
          });
        }

        const pIds = new Set(validPlayers.map(p => p.id));
        ARCHIVE_PLAYERS.forEach(ap => { if (!pIds.has(ap.id) && !obsoleteSet.has(ap.id)) validPlayers.push(ap); });
        const mIds = new Set(matches.map(m => m.id));
        ARCHIVE_MATCHES.forEach(am => { if (!mIds.has(am.id)) matches.push(am); });

        const detectedYears = Array.from(new Set([
          ...baseYears,
          ...classes.map(c => c.year),
          ...validPlayers.map(p => p.year),
          ...matches.map(m => m.year)
        ])).filter(Boolean);
        detectedYears.sort((a, b) => b.localeCompare(a));
        const years = detectedYears;

        console.log(`Firebase: Raw loaded stats - Classes: ${classes.length}, Players: ${validPlayers.length}, Matches: ${matches.length}`);
        const computed = recalculateInMemoryData(classes, validPlayers, matches, years);
        console.log(`Firebase: In-memory stats computed. Total computed players: ${computed.players.length}`);
        
        let filtered = computed.players;
        if (year) {
          filtered = computed.players.filter(p => p.year === year);
        }
        console.log(`Firebase: Returning ${filtered.length} players for year ${year || 'all'}.`);
        return filtered;
      } catch (err) {
        console.warn("Firebase: getPlayers failed or quota reached, falling back to local archive & storage:", err);
      }
    }
    const rawPlayers = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    const obsoleteSet = new Set(OBSOLETE_PLAYER_IDS);
    const players = rawPlayers.filter(p => !obsoleteSet.has(p.id));
    const existingPIds = new Set(players.map(p => p.id));
    ARCHIVE_PLAYERS.forEach(ap => { if (!existingPIds.has(ap.id) && !obsoleteSet.has(ap.id)) players.push(ap); });
    let valid = players.filter(p => !p.isOwnGoal && !/avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || ''));
    if (year) {
      valid = valid.filter(p => p.year === year);
    }
    return valid;
  },

  
  addPlayer: async (player) => {
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classInfo = classes.find(c => c.name === player.class && c.year === player.year);
    const division = classInfo ? classInfo.division : "11";
    const year = player.year || (classInfo ? classInfo.year : "2025-2026");

    const newPlayer = {
      id: player.id || "p_" + Date.now(),
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      overallRating: 6.0,
      division,
      year,
      ...player
    };
    if (useRealFirebase && firestore) {
      try {
        await setDoc(doc(firestore, "players", newPlayer.id), newPlayer);
      } catch (err) {
        console.error("Firebase addPlayer failed:", err);
      }
    }
    const players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    players.push(newPlayer);
    localStorage.setItem('minifootball_players', JSON.stringify(players));
    recalculateData();
    return newPlayer;
  },

  updatePlayer: async (updatedPlayer) => {
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classInfo = classes.find(c => c.name === updatedPlayer.class && c.year === updatedPlayer.year);
    const division = classInfo ? classInfo.division : updatedPlayer.division || "11";
    const year = updatedPlayer.year || (classInfo ? classInfo.year : "2025-2026");

    const fullPlayer = { ...updatedPlayer, division, year };

    if (useRealFirebase && firestore) {
      try {
        await setDoc(doc(firestore, "players", fullPlayer.id), fullPlayer);
      } catch (err) {
        console.error("Firebase updatePlayer failed:", err);
      }
    }
    let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    players = players.map(p => p.id === fullPlayer.id ? fullPlayer : p);
    localStorage.setItem('minifootball_players', JSON.stringify(players));
    recalculateData();
    return fullPlayer;
  },

  deletePlayer: async (id) => {
    if (useRealFirebase && firestore) {
      try {
        await deleteDoc(doc(firestore, "players", id));
      } catch (err) {
        console.error("Firebase deletePlayer failed:", err);
      }
    }
    let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    players = players.filter(p => p.id !== id);
    localStorage.setItem('minifootball_players', JSON.stringify(players));
    
    let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    matches = matches.map(m => {
      const filteredStats = (m.playerStats || []).filter(stat => stat.playerId !== id);
      const isChanged = (m.playerStats || []).length !== filteredStats.length;
      const updatedMatch = { ...m, playerStats: filteredStats };
      if (isChanged && useRealFirebase && firestore) {
        setDoc(doc(firestore, "matches", m.id), updatedMatch).catch(e => console.error(e));
      }
      return updatedMatch;
    });
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    recalculateData();
  },

  // Matches CRUD
  getMatches: async (year) => {
    let list = [];
    if (useRealFirebase && firestore) {
      console.log("Firebase: Fetching matches...");
      try {
        const querySnapshot = await getDocs(collection(firestore, "matches"));
        querySnapshot.forEach(docSnap => {
          list.push(sanitizeObject(docSnap.data()));
        });
        console.log(`Firebase: Matches fetched: ${list.length} records. Filtering by year: ${year || 'all'}`);
      } catch (err) {
        console.error("Firebase: getMatches failed with error: ", err);
      }
    }
    if (list.length === 0) {
      list = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    }
    // Merge archive matches ensuring no duplicates
    const existingIds = new Set(list.map(m => m.id));
    ARCHIVE_MATCHES.forEach(am => {
      if (!existingIds.has(am.id)) {
        list.push(am);
      }
    });
    if (year) {
      return list.filter(m => m.year === year);
    }
    return list;
  },


  addMatch: async (match) => {
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classInfo = classes.find(c => c.name === match.teamA && c.year === match.year);
    const division = classInfo ? classInfo.division : "11";
    const year = match.year || (classInfo ? classInfo.year : "2025-2026");

    const newMatch = {
      id: match.id || "m_" + Date.now(),
      playerStats: [],
      division,
      year,
      ...match
    };

    if (useRealFirebase && firestore) {
      try {
        await setDoc(doc(firestore, "matches", newMatch.id), newMatch);
      } catch (err) {
        console.error("Firebase addMatch failed:", err);
      }
    }
    const matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    matches.push(newMatch);
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    recalculateData();
    return newMatch;
  },

  updateMatch: async (updatedMatch) => {
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classInfo = classes.find(c => c.name === updatedMatch.teamA && c.year === updatedMatch.year);
    const division = classInfo ? classInfo.division : updatedMatch.division || "11";
    const year = updatedMatch.year || (classInfo ? classInfo.year : "2025-2026");

    const fullMatch = { ...updatedMatch, division, year };

    if (useRealFirebase && firestore) {
      try {
        await setDoc(doc(firestore, "matches", fullMatch.id), fullMatch);
      } catch (err) {
        console.error("Firebase updateMatch failed:", err);
      }
    }
    let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    matches = matches.map(m => m.id === fullMatch.id ? fullMatch : m);
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    recalculateData();
    return fullMatch;
  },

  deleteMatch: async (id) => {
    if (useRealFirebase && firestore) {
      try {
        await deleteDoc(doc(firestore, "matches", id));
      } catch (err) {
        console.error("Firebase deleteMatch failed:", err);
      }
    }
    let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    matches = matches.filter(m => m.id !== id);
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    recalculateData();
  },

  // Standings Read (Divided by active division & year)
  getStandings: async (division = "11", year = "2025-2026") => {
    if (useRealFirebase && firestore) {
      console.log(`Firebase: Fetching standings for division: ${division}, year: ${year}...`);
      try {
        const [cSnap, pSnap, mSnap] = await Promise.all([
          getDocs(collection(firestore, "classes")),
          getDocs(collection(firestore, "players")),
          getDocs(collection(firestore, "matches"))
        ]);
        const classes = [];
        cSnap.forEach(d => classes.push(sanitizeObject(d.data())));
        const players = [];
        pSnap.forEach(d => players.push(sanitizeObject(d.data())));
        const matches = [];
        mSnap.forEach(d => matches.push(sanitizeObject(d.data())));
        const baseYears = ["2025-2026", "2024-2025", "2023-2024", "2022-2023"];
        const detectedYears = Array.from(new Set([
          ...baseYears,
          ...classes.map(c => c.year),
          ...players.map(p => p.year),
          ...matches.map(m => m.year)
        ])).filter(Boolean);
        detectedYears.sort((a, b) => b.localeCompare(a));
        const years = detectedYears;

        const computed = recalculateInMemoryData(classes, players, matches, years);
        let standings = computed.standings[year]?.[division] || [];
        if (standings.length === 0) {
          if (division === '10-11') standings = computed.standings[year]?.['11'] || [];
          else if (division === '11') standings = computed.standings[year]?.['10-11'] || [];
          else if (division === '9') standings = computed.standings[year]?.['9-10'] || [];
          else if (division === '9-10') standings = computed.standings[year]?.['9'] || [];
        }
        console.log(`Firebase: Computed standings size: ${standings.length} classes for division ${division}, year ${year}`);
        return standings;
      } catch (e) {
        console.error("Firebase: getStandings failed with error: ", e);
        return [];
      }
    }
    recalculateData(); // refresh
    const allStandings = JSON.parse(localStorage.getItem('minifootball_standings_divided') || '{}');
    let localStandings = allStandings[year]?.[division] || [];
    if (localStandings.length === 0) {
      if (division === '10-11') localStandings = allStandings[year]?.['11'] || [];
      else if (division === '11') localStandings = allStandings[year]?.['10-11'] || [];
      else if (division === '9') localStandings = allStandings[year]?.['9-10'] || [];
      else if (division === '9-10') localStandings = allStandings[year]?.['9'] || [];
    }
    return localStandings;
  },

  // Reset Database
  resetDatabase: async () => {
    if (useRealFirebase && firestore) {
      try {
        const [cSnap, pSnap, mSnap] = await Promise.all([
          getDocs(collection(firestore, "classes")),
          getDocs(collection(firestore, "players")),
          getDocs(collection(firestore, "matches"))
        ]);
        cSnap.forEach(d => deleteDoc(doc(firestore, "classes", d.id)));
        pSnap.forEach(d => deleteDoc(doc(firestore, "players", d.id)));
        mSnap.forEach(d => deleteDoc(doc(firestore, "matches", d.id)));
      } catch (e) {
        console.error("Firebase resetDatabase failed:", e);
      }
    }
    localStorage.setItem('minifootball_classes', JSON.stringify(initialClasses));
    localStorage.setItem('minifootball_players', JSON.stringify(initialPlayers));
    localStorage.setItem('minifootball_matches', JSON.stringify(initialMatches));
    recalculateData();
  },

  importData: async (data) => {
    // 1. Years
    const years = JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025", "2023-2024", "2022-2023"]');
    let yearsUpdated = false;
    
    const allItems = [...(data.classes || []), ...(data.players || []), ...(data.matches || [])];
    allItems.forEach(item => {
      if (item.year && !years.includes(item.year)) {
        years.push(item.year);
        yearsUpdated = true;
      }
    });
    if (yearsUpdated) {
      years.sort((a, b) => b.localeCompare(a));
      localStorage.setItem('minifootball_years', JSON.stringify(years));
      if (useRealFirebase && firestore) {
        try {
          for (let y of years) { await setDoc(doc(firestore, "years", y), {}); }
        } catch (e) {
          console.error("Firebase importing years failed:", e);
        }
      }
    }

    // 2. Classes
    if (data.classes && data.classes.length > 0) {
      let classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
      for (let c of data.classes) {
        if (!classes.some(existing => existing.name === c.name && existing.year === c.year)) {
          const newClass = {
            id: c.id || "c_" + Math.random().toString(36).substr(2, 9),
            ...c
          };
          classes.push(newClass);
          if (useRealFirebase && firestore) {
            await setDoc(doc(firestore, "classes", newClass.id), newClass).catch(e => console.error(e));
          }
        }
      }
      localStorage.setItem('minifootball_classes', JSON.stringify(classes));
    }

    // 3. Players
    if (data.players && data.players.length > 0) {
      let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
      for (let p of data.players) {
        if (!players.some(existing => existing.name === p.name && existing.class === p.class && existing.year === p.year)) {
          const newPlayer = {
            id: p.id || "p_" + Math.random().toString(36).substr(2, 9),
            goals: p.goals || 0,
            assists: p.assists || 0,
            matchesPlayed: p.matchesPlayed || 0,
            overallRating: p.overallRating || 6.0,
            ...p
          };
          players.push(newPlayer);
          if (useRealFirebase && firestore) {
            await setDoc(doc(firestore, "players", newPlayer.id), newPlayer).catch(e => console.error(e));
          }
        }
      }
      localStorage.setItem('minifootball_players', JSON.stringify(players));
    }

    // 4. Matches
    if (data.matches && data.matches.length > 0) {
      let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
      for (let m of data.matches) {
        if (!matches.some(existing => existing.teamA === m.teamA && existing.teamB === m.teamB && existing.year === m.year && existing.date === m.date)) {
          const newMatch = {
            id: m.id || "m_" + Math.random().toString(36).substr(2, 9),
            ...m
          };
          matches.push(newMatch);
          if (useRealFirebase && firestore) {
            await setDoc(doc(firestore, "matches", newMatch.id), newMatch).catch(e => console.error(e));
          }
        }
      }
      localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    }

    recalculateData();
  },

  // Get Unified Player Profile across all seasons
  getUnifiedPlayerProfile: async (playerName) => {
    if (!playerName) return null;
    const targetNorm = playerName.trim().toLowerCase();

    let allPlayers = [];
    let allMatches = [];

    if (useRealFirebase && firestore) {
      try {
        const [pSnap, mSnap] = await Promise.all([
          getDocs(collection(firestore, "players")),
          getDocs(collection(firestore, "matches"))
        ]);
        pSnap.forEach(d => allPlayers.push(sanitizeObject(d.data())));
        mSnap.forEach(d => allMatches.push(sanitizeObject(d.data())));
      } catch (e) {
        console.error("getUnifiedPlayerProfile firestore error:", e);
      }
    }

    if (allPlayers.length === 0) {
      allPlayers = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
      allMatches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    }

    const obsoleteSet = new Set(OBSOLETE_PLAYER_IDS);
    allPlayers = allPlayers.filter(p => !obsoleteSet.has(p.id));
    const existingPIds = new Set(allPlayers.map(p => p.id));
    ARCHIVE_PLAYERS.forEach(ap => { if (!existingPIds.has(ap.id) && !obsoleteSet.has(ap.id)) allPlayers.push(ap); });
    const existingMIds = new Set(allMatches.map(m => m.id));
    ARCHIVE_MATCHES.forEach(am => { if (!existingMIds.has(am.id)) allMatches.push(am); });

    const targetKey = normalizePlayerName(playerName);
    if (!targetKey) return null;

    const matchingRecords = allPlayers.filter(p => {
      if (p.isOwnGoal || /avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || '')) return false;
      return normalizePlayerName(p.name) === targetKey;
    });

    if (matchingRecords.length === 0) return null;

    const displayName = matchingRecords.reduce((best, curr) => 
      (curr.name && curr.name.length > (best?.length || 0)) ? curr.name : best, matchingRecords[0].name
    );

    const positions = Array.from(new Set(matchingRecords.map(p => p.position).filter(Boolean)));
    const isKeeper = matchingRecords.some(p => p.isKeeper || (p.position || '').toLowerCase().includes('qap'));

    const seasonMap = new Map();
    matchingRecords.forEach(p => {
      const yr = p.year || '2022-2023';
      const cls = p.class || '-';
      const key = `${yr}_${cls}`;
      const goals = Number(p.goals) || 0;
      const assists = Number(p.assists) || 0;
      const matchesPlayed = Number(p.matchesPlayed) || 0;
      const rating = Number(p.overallRating) || 6.5;
      const saves = Number(p.saves) || 0;
      const keeper = p.isKeeper || (p.position || '').toLowerCase().includes('qap');

      if (seasonMap.has(key)) {
        const exist = seasonMap.get(key);
        exist.goals += goals;
        exist.assists += assists;
        exist.matchesPlayed = Math.max(exist.matchesPlayed, matchesPlayed);
        exist.saves += saves;
        if (rating > exist.rating) exist.rating = rating;
      } else {
        seasonMap.set(key, {
          id: p.id,
          year: yr,
          class: cls,
          division: p.division || '10-11',
          goals,
          assists,
          matchesPlayed,
          rating,
          saves,
          isKeeper: keeper
        });
      }
    });

    const seasons = Array.from(seasonMap.values()).sort((a, b) => (b.year || '').localeCompare(a.year || ''));

    const totalGoals = seasons.reduce((sum, s) => sum + s.goals, 0);
    const totalAssists = seasons.reduce((sum, s) => sum + s.assists, 0);
    const totalMatches = seasons.reduce((sum, s) => sum + s.matchesPlayed, 0);
    const totalSaves = seasons.reduce((sum, s) => sum + s.saves, 0);

    let careerRating = 6.5;
    if (totalMatches > 0) {
      const weightedSum = seasons.reduce((sum, s) => sum + (s.rating * Math.max(1, s.matchesPlayed)), 0);
      const totalWeight = seasons.reduce((sum, s) => sum + Math.max(1, s.matchesPlayed), 0);
      careerRating = Number((weightedSum / totalWeight).toFixed(1));
    } else {
      const mean = seasons.reduce((sum, s) => sum + s.rating, 0) / seasons.length;
      careerRating = Number(mean.toFixed(1));
    }

    const matchingIds = new Set(matchingRecords.map(p => p.id));
    const playerMatches = [];

    allMatches.forEach(m => {
      let matchedStat = null;
      if (m.playerStats && m.playerStats.length > 0) {
        matchedStat = m.playerStats.find(s => 
          matchingIds.has(s.playerId) || 
          (!s.isOwnGoal && normalizePlayerName(s.name) === targetKey)
        );
      }

      const mGoals = matchedStat?.goals || 0;
      const mAssists = matchedStat?.assists || 0;
      const mRating = matchedStat?.rating || null;

      if (matchedStat || mGoals > 0) {
        playerMatches.push({
          id: m.id,
          year: m.year,
          division: m.division,
          stage: m.stage,
          date: m.date,
          teamA: m.teamA,
          teamB: m.teamB,
          scoreA: m.scoreA,
          scoreB: m.scoreB,
          goals: mGoals,
          assists: mAssists,
          rating: mRating,
          isKeeper: matchedStat?.isKeeper || false,
          videoUrl: m.videoUrl
        });
      }
    });

    playerMatches.sort((a, b) => (b.date || b.year || '').localeCompare(a.date || a.year || ''));
    const latestSeason = seasons[0];

    return {
      name: displayName,
      normalizedName: targetNorm,
      primaryClass: latestSeason?.class || '-',
      latestYear: latestSeason?.year || '',
      positions: positions.length > 0 ? positions : [isKeeper ? 'Qapıçı' : 'Oyunçu'],
      isKeeper,
      totalGoals,
      totalAssists,
      totalMatches,
      totalSaves,
      careerRating,
      goalRatio: totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : totalGoals.toFixed(2),
      seasons,
      matches: playerMatches
    };
  },

  // Fast Multi-Entity Search across players, teams, and matches
  searchAll: async (query) => {
    if (!query || query.trim().length < 2) {
      return { players: [], classes: [], matches: [] };
    }
    const q = query.trim().toLowerCase();

    let allPlayers = [];
    let allMatches = [];
    let allClasses = [];

    if (useRealFirebase && firestore) {
      try {
        const [pSnap, mSnap, cSnap] = await Promise.all([
          getDocs(collection(firestore, "players")),
          getDocs(collection(firestore, "matches")),
          getDocs(collection(firestore, "classes"))
        ]);
        pSnap.forEach(d => allPlayers.push(sanitizeObject(d.data())));
        mSnap.forEach(d => allMatches.push(sanitizeObject(d.data())));
        cSnap.forEach(d => allClasses.push(sanitizeObject(d.data())));
      } catch (e) {
        console.error("searchAll firestore error:", e);
      }
    }

    if (allPlayers.length === 0) {
      allPlayers = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
      allMatches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
      allClasses = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    }

    // Merge archive items so search finds historical matches and classes
    const obsoleteSet = new Set(OBSOLETE_PLAYER_IDS);
    allPlayers = allPlayers.filter(p => !obsoleteSet.has(p.id));
    const existingPIds = new Set(allPlayers.map(p => p.id));
    ARCHIVE_PLAYERS.forEach(ap => { if (!existingPIds.has(ap.id) && !obsoleteSet.has(ap.id)) allPlayers.push(ap); });
    const existingMIds = new Set(allMatches.map(m => m.id));
    ARCHIVE_MATCHES.forEach(am => { if (!existingMIds.has(am.id)) allMatches.push(am); });
    const existingCIds = new Set(allClasses.map(c => c.id || `${c.year}_${c.name}`));
    ARCHIVE_CLASSES.forEach(ac => { if (!existingCIds.has(ac.id) && !existingCIds.has(`${ac.year}_${ac.name}`)) allClasses.push(ac); });

    // 1. Group players by normalized name (deduplicate spelling variants & aliases)
    const playerGroups = {};
    allPlayers.forEach(p => {
      const name = (p.name || '').trim();
      if (!name) return;
      if (p.isOwnGoal || /avtoqol|özünə qol|ö\.q|ozune qol/i.test(name)) return;
      const normKey = normalizePlayerName(name);
      if (!normKey) return;

      if (!playerGroups[normKey]) {
        playerGroups[normKey] = {
          name,
          normalizedName: name.toLowerCase(),
          normKey,
          classes: new Set(),
          years: new Set(),
          totalGoals: 0,
          totalAssists: 0,
          totalMatches: 0,
          ratingSum: 0,
          ratingCount: 0,
          position: p.position || '',
          isKeeper: p.isKeeper || false
        };
      }
      // Prefer proper Azerbaijani spelling
      if (/[əıöüğşç]/i.test(name) && !/[əıöüğşç]/i.test(playerGroups[normKey].name)) {
        playerGroups[normKey].name = name;
      }
      if (p.class) playerGroups[normKey].classes.add(p.class);
      if (p.year) playerGroups[normKey].years.add(p.year);
      playerGroups[normKey].totalGoals += Number(p.goals) || 0;
      playerGroups[normKey].totalAssists += Number(p.assists) || 0;
      playerGroups[normKey].totalMatches += Number(p.matchesPlayed) || 0;
      if (p.overallRating) {
        playerGroups[normKey].ratingSum += Number(p.overallRating);
        playerGroups[normKey].ratingCount += 1;
      }
    });

    const qKey = normalizePlayerName(query);
    const matchingPlayers = Object.values(playerGroups)
      .filter(p => (qKey && p.normKey.includes(qKey)) || p.normalizedName.includes(q))
      .map(p => ({
        name: p.name,
        normalizedName: p.normalizedName,
        classes: Array.from(p.classes),
        years: Array.from(p.years).sort().reverse(),
        totalGoals: p.totalGoals,
        totalAssists: p.totalAssists,
        totalMatches: p.totalMatches,
        overallRating: p.ratingCount > 0 ? Number((p.ratingSum / p.ratingCount).toFixed(1)) : 6.5,
        position: p.position,
        isKeeper: p.isKeeper
      }))
      .sort((a, b) => b.totalGoals - a.totalGoals || b.overallRating - a.overallRating)
      .slice(0, 10);

    // 2. Search Classes
    const classMap = {};
    allClasses.forEach(c => {
      const name = c.name || '';
      if (!classMap[name]) {
        classMap[name] = {
          name,
          division: c.division || '11',
          years: new Set()
        };
      }
      if (c.year) classMap[name].years.add(c.year);
    });

    const matchingClasses = Object.values(classMap)
      .filter(c => c.name.toLowerCase().includes(q))
      .map(c => ({
        name: c.name,
        division: c.division,
        years: Array.from(c.years).sort().reverse()
      }))
      .slice(0, 8);

    // 3. Search Matches (teamA, teamB, stage, year, date)
    const matchingMatches = allMatches
      .filter(m => 
        (m.teamA && m.teamA.toLowerCase().includes(q)) ||
        (m.teamB && m.teamB.toLowerCase().includes(q)) ||
        (m.stage && m.stage.toLowerCase().includes(q)) ||
        (m.year && m.year.toLowerCase().includes(q))
      )
      .slice(0, 8);

    return {
      players: matchingPlayers,
      classes: matchingClasses,
      matches: matchingMatches
    };
  },

  // Health Check & Self-Healing Engine API
  runHealthAudit: async () => {
    return auditTournamentData();
  },

  repairData: async () => {
    return repairTournamentData();
  }
};
