/**
 * ============================================================================
 * FAYL ADI: services/database.js
 * MƏQSƏDİ: Turnirin Əsas Baza və Yaddaş İdarəetmə Qatı (Data Access Layer)
 * 
 * BU MODULUN VƏZİFƏLƏRİ:
 *   1. Firestore və LocalStorage inteqrasiyası: Siniflər, oyunçular, matçlar və illər
 *      üzrə tam CRUD (Create, Read, Update, Delete) əməliyyatları.
 *   2. recalculateData() & recalculateInMemoryData(): Canlı matç nəticələrindən xal cədvəlini,
 *      top fərqlərini və Sofascore fərdi reytinqlərini real-vaxt rejimində cəmləyir.
 *   3. getUnifiedPlayerProfile(): Oyunçunun bütün mövsümlər və siniflər üzrə vahid karyera profilini formalaşdırır.
 *   4. searchAll(): Oyunçular, komandalar və oyunlar üzrə sürətli qlobal axtarış təmin edir.
 *   5. Modulların Re-Exportu: ratings.js, matchUtils.js və tournamentGroups.js funksiyalarını
 *      təkrar ixrac edərək tam geriyə uyğunluq saxlayır.
 * 
 * İSTİFADƏ EDİLDİYİ YERLƏR:
 *   - Bütün komponentlər (Dashboard, Standings, Matches, Players, AdminDashboard, Chatbot)
 * ============================================================================
 */

import { useRealFirebase, firebaseConfig } from './firebase-config.js';
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { ARCHIVE_YEARS, ARCHIVE_CLASSES, ARCHIVE_MATCHES, ARCHIVE_PLAYERS } from './archiveData.js?v=20260912_0060';
import { isMatchDivision, getDivisionsForYear } from './i18n.js?v=20260912_0060';
import { auditTournamentData, repairTournamentData, startBackgroundSelfHealing } from './selfHealing.js?v=20260912_0060';

// ── Modulların İnteqrasiyası və Təkrar İxracı (100% Geriyə Uyğunluq) ─────────────
import { 
  calculateSofascoreRating, 
  computePlayerOverallRating, 
  getSofascoreBadgeStyle 
} from './ratings.js?v=20260912_0010';

import { 
  normalizeStage, 
  normalizeMatchDivision, 
  getMatchSemanticKey, 
  mergeMatchObjects, 
  deduplicateMatches 
} from './matchUtils.js?v=20260912_0010';

import { 
  KNOWN_GROUP_SEEDS, 
  assignGroupsToTeams 
} from './tournamentGroups.js?v=20260910_0080';

export { 
  calculateSofascoreRating, 
  computePlayerOverallRating, 
  getSofascoreBadgeStyle,
  normalizeStage, 
  normalizeMatchDivision, 
  getMatchSemanticKey, 
  mergeMatchObjects, 
  deduplicateMatches,
  KNOWN_GROUP_SEEDS, 
  assignGroupsToTeams,
  getDivisionsForYear 
};

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
  'p_2018_royal_11f',
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

// Seed Initial Classes with historical archive
const initialClasses = ARCHIVE_CLASSES || [];

// Seed Initial Players with historical archive
const initialPlayers = ARCHIVE_PLAYERS || [];

const initialMatches = ARCHIVE_MATCHES || [];

const migrateStorageDivisions = () => {
  const migrationKey = 'btl_div_migrated_v20260910_archive_purge_v5';
  if (localStorage.getItem(migrationKey)) return;

  try {
    let classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');

    // 1. Purge stale archive matches from localStorage and guarantee canonical archive presence
    const liveMatches = matches.filter(m => !ARCHIVE_YEARS.includes(m.year) || m.isCustom);
    matches = deduplicateMatches([...ARCHIVE_MATCHES, ...liveMatches]);

    // 2. Purge stale archive players from localStorage and guarantee canonical archive presence
    const obsoleteSet = new Set(OBSOLETE_PLAYER_IDS);
    const livePlayers = players.filter(p => (!ARCHIVE_YEARS.includes(p.year) || p.isCustom) && !obsoleteSet.has(p.id));
    players = [...ARCHIVE_PLAYERS, ...livePlayers];

    // 3. Purge stale archive classes from localStorage and guarantee canonical archive presence
    const liveClasses = classes.filter(c => !ARCHIVE_YEARS.includes(c.year) || c.isCustom);
    classes = [...ARCHIVE_CLASSES, ...liveClasses];

    localStorage.setItem('minifootball_classes', JSON.stringify(classes));
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    localStorage.setItem('minifootball_players', JSON.stringify(players));
    localStorage.setItem(migrationKey, 'true');
  } catch (err) {
    console.error('migrateStorageDivisions error:', err);
  }
};

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
  migrateStorageDivisions();
  recalculateData();
};

export const recalculateData = () => {
  let classesList = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
  let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
  let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
  const years = JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025", "2023-2024", "2022-2023"]');
  const defaultYear = years[0] || "2025-2026";

  // Enforce clean archive records without historical pollution
  const liveClasses = classesList.filter(c => !ARCHIVE_YEARS.includes(c.year) || c.isCustom);
  classesList = [...ARCHIVE_CLASSES, ...liveClasses];

  const liveMatches = matches.filter(m => !ARCHIVE_YEARS.includes(m.year) || m.isCustom);
  matches = deduplicateMatches([...ARCHIVE_MATCHES, ...liveMatches]);

  const obsoleteSet = new Set(OBSOLETE_PLAYER_IDS);
  const livePlayers = players.filter(p => (!ARCHIVE_YEARS.includes(p.year) || p.isCustom) && !obsoleteSet.has(p.id));
  players = [...ARCHIVE_PLAYERS, ...livePlayers];

  // Ensure every class has a year
  const updatedClassesList = classesList.map(c => {
    if (!c.year) c.year = defaultYear;
    return c;
  });
  localStorage.setItem('minifootball_classes', JSON.stringify(updatedClassesList));
  localStorage.setItem('minifootball_matches', JSON.stringify(matches));

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
  years.forEach(yr => {
    standingsMap[yr] = {};
    const yearDivisions = getDivisionsForYear(yr);
    yearDivisions.forEach(div => {
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

  // Process Matches (semantically deduplicated)
  const uniqueMatches = deduplicateMatches(matches);
  uniqueMatches.forEach(m => {
    const yr = m.year || defaultYear;
    const div = m.division || "10-11";

    // Match result context
    const isFinal        = m.stage === 'Final';
    const numScoreA      = Number(m.scoreA);
    const numScoreB      = Number(m.scoreB);
    const hasValidScores = Number.isFinite(numScoreA) && Number.isFinite(numScoreB);
    const scoreA         = hasValidScores ? numScoreA : 0;
    const scoreB         = hasValidScores ? numScoreB : 0;
    const goalDiffAB     = scoreA - scoreB;

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

    // Process team points only for group stage matches with valid numeric scores
    const isGroupMatch = (m.stage === 'Qrup Mərhələsi' || m.stage === 'Qrup' || (m.stage || '').toLowerCase().includes('qrup')) && hasValidScores;
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

          teamA.goalsFor += scoreA;
          teamA.goalsAgainst += scoreB;
          teamB.goalsFor += scoreB;
          teamB.goalsAgainst += scoreA;

          if (scoreA > scoreB) {
            teamA.won += 1;
            teamA.points += 3;
            teamB.lost += 1;
          } else if (scoreA < scoreB) {
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
    const yearDivisions = getDivisionsForYear(yr);
    yearDivisions.forEach(div => {
      if (!standingsMap[yr]?.[div]) {
        finalStandings[yr][div] = [];
        return;
      }
      const list = Object.values(standingsMap[yr][div]).map(team => {
        team.goalDifference = team.goalsFor - team.goalsAgainst;
        return team;
      });

      // Assign tournament groups (A, B, etc.)
      assignGroupsToTeams(list, uniqueMatches, yr, div);

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
  yearsList.forEach(yr => {
    standingsMap[yr] = {};
    const yearDivisions = getDivisionsForYear(yr);
    yearDivisions.forEach(div => {
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

  // Process Matches (recalculateInMemoryData — semantically deduplicated)
  const uniqueMatches = deduplicateMatches(matches);
  uniqueMatches.forEach(m => {
    const yr = m.year || defaultYear;
    const div = m.division || "10-11";

    const isFinal        = m.stage === 'Final';
    const numScoreA      = Number(m.scoreA);
    const numScoreB      = Number(m.scoreB);
    const hasValidScores = Number.isFinite(numScoreA) && Number.isFinite(numScoreB);
    const scoreA         = hasValidScores ? numScoreA : 0;
    const scoreB         = hasValidScores ? numScoreB : 0;
    const goalDiffAB     = scoreA - scoreB;

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

    // Process team points only for group stage matches with valid numeric scores
    const isGroupMatch = (m.stage === 'Qrup Mərhələsi' || m.stage === 'Qrup' || (m.stage || '').toLowerCase().includes('qrup')) && hasValidScores;
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

          teamA.goalsFor += scoreA;
          teamA.goalsAgainst += scoreB;
          teamB.goalsFor += scoreB;
          teamB.goalsAgainst += scoreA;

          if (scoreA > scoreB) {
            teamA.won += 1;
            teamA.points += 3;
            teamB.lost += 1;
          } else if (scoreA < scoreB) {
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
    const yearDivisions = getDivisionsForYear(yr);
    yearDivisions.forEach(div => {
      if (!standingsMap[yr]?.[div]) {
        finalStandings[yr][div] = [];
        return;
      }
      const list = Object.values(standingsMap[yr][div]).map(team => {
        team.goalDifference = team.goalsFor - team.goalsAgainst;
        return team;
      });

      // Assign tournament groups (A, B, etc.)
      assignGroupsToTeams(list, uniqueMatches, yr, div);

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

  // Dynamic divisions per tournament academic year
  getDivisions: async (year) => {
    let classes = [];
    let matches = [];
    if (useRealFirebase && firestore) {
      try {
        const [cSnap, mSnap] = await Promise.all([
          getDocs(collection(firestore, "classes")),
          getDocs(collection(firestore, "matches"))
        ]);
        cSnap.forEach(d => classes.push(sanitizeObject(d.data())));
        mSnap.forEach(d => matches.push(sanitizeObject(d.data())));
      } catch (e) {
        console.error("Firebase: getDivisions failed with error:", e);
      }
    }
    if (classes.length === 0) {
      classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
      matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    }
    // Include archive data as fallback
    classes = [...classes, ...ARCHIVE_CLASSES];
    matches = [...matches, ...ARCHIVE_MATCHES];

    const detected = new Set();
    classes.filter(c => c.year === year).forEach(c => { if (c.division) detected.add(c.division); });
    matches.filter(m => m.year === year).forEach(m => { if (m.division) detected.add(m.division); });

    return getDivisionsForYear(year, Array.from(detected));
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
    if (year && ARCHIVE_YEARS.includes(year)) {
      const archiveClasses = ARCHIVE_CLASSES.filter(c => c.year === year);
      let customClasses = [];
      try {
        const localClasses = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
        customClasses = localClasses.filter(c => c.year === year && c.isCustom);
      } catch (e) {}
      return customClasses.length > 0 ? [...archiveClasses, ...customClasses] : archiveClasses;
    }

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

    const nonArchiveClasses = list.filter(c => !ARCHIVE_YEARS.includes(c.year));
    const customClasses = list.filter(c => ARCHIVE_YEARS.includes(c.year) && c.isCustom);
    const combined = [...ARCHIVE_CLASSES, ...customClasses, ...nonArchiveClasses];

    if (year) {
      return combined.filter(c => c.year === year);
    }
    return combined;
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
    if (year && ARCHIVE_YEARS.includes(year)) {
      const archivePlayers = ARCHIVE_PLAYERS.filter(p => p.year === year && !p.isOwnGoal && !/avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || ''));
      let customPlayers = [];
      try {
        const localPlayers = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
        customPlayers = localPlayers.filter(p => p.year === year && p.isCustom);
      } catch (e) {}
      return customPlayers.length > 0 ? [...archivePlayers, ...customPlayers] : archivePlayers;
    }

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
        
        // Strip out stale archive records from Firestore to prevent duplication
        const nonArchiveClasses = classes.filter(c => !ARCHIVE_YEARS.includes(c.year) || c.isCustom);
        const combinedClasses = [...ARCHIVE_CLASSES, ...nonArchiveClasses];

        const obsoleteSet = new Set(OBSOLETE_PLAYER_IDS);
        const nonArchivePlayers = players.filter(p => (!ARCHIVE_YEARS.includes(p.year) || p.isCustom) && !obsoleteSet.has(p.id));
        const combinedPlayers = [...ARCHIVE_PLAYERS, ...nonArchivePlayers];

        const nonArchiveMatches = matches.filter(m => !ARCHIVE_YEARS.includes(m.year) || m.isCustom);
        const deduplicatedMatches = deduplicateMatches([...ARCHIVE_MATCHES, ...nonArchiveMatches]);

        // Background purge of obsolete duplicates from Firestore
        if (useRealFirebase && firestore) {
          players.forEach(p => {
            if (obsoleteSet.has(p.id)) {
              deleteDoc(doc(firestore, "players", p.id)).catch(() => {});
            }
          });
        }

        const detectedYears = Array.from(new Set([
          ...baseYears,
          ...combinedClasses.map(c => c.year),
          ...combinedPlayers.map(p => p.year),
          ...deduplicatedMatches.map(m => m.year)
        ])).filter(Boolean);
        detectedYears.sort((a, b) => b.localeCompare(a));
        const years = detectedYears;

        console.log(`Firebase: Raw loaded stats - Classes: ${combinedClasses.length}, Players: ${combinedPlayers.length}, Matches: ${deduplicatedMatches.length}`);
        const computed = recalculateInMemoryData(combinedClasses, combinedPlayers, deduplicatedMatches, years);
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
    const nonArchivePlayers = rawPlayers.filter(p => (!ARCHIVE_YEARS.includes(p.year) || p.isCustom) && !obsoleteSet.has(p.id));
    const combinedPlayers = [...ARCHIVE_PLAYERS, ...nonArchivePlayers];
    let valid = combinedPlayers.filter(p => !p.isOwnGoal && !/avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || ''));
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
    // 1. If querying an archive year specifically, return canonical archive matches directly!
    if (year && ARCHIVE_YEARS.includes(year)) {
      const archiveMatches = ARCHIVE_MATCHES.filter(m => m.year === year);
      let customMatches = [];
      try {
        const localMatches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
        customMatches = localMatches.filter(m => m.year === year && m.isCustom);
      } catch (e) {}
      return customMatches.length > 0 ? deduplicateMatches([...archiveMatches, ...customMatches]) : archiveMatches;
    }

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

    // For archive years, ALWAYS prefer canonical ARCHIVE_MATCHES over stale Firebase/localStorage records
    const nonArchiveMatches = list.filter(m => !ARCHIVE_YEARS.includes(m.year));
    const customArchiveMatches = list.filter(m => ARCHIVE_YEARS.includes(m.year) && m.isCustom);
    const combined = [...ARCHIVE_MATCHES, ...customArchiveMatches, ...nonArchiveMatches];
    const deduplicatedMatches = deduplicateMatches(combined);

    if (year) {
      return deduplicatedMatches.filter(m => m.year === year);
    }
    return deduplicatedMatches;
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
        const baseYears = ["2025-2026", "2024-2025", "2023-2024", "2022-2023", "2021-2022", "2018-2019", "2017-2018"];
        
        // Strip out stale archive records from Firestore to prevent duplication
        const nonArchiveClasses = classes.filter(c => !ARCHIVE_YEARS.includes(c.year) || c.isCustom);
        const combinedClasses = [...ARCHIVE_CLASSES, ...nonArchiveClasses];

        const obsoleteSet = new Set(OBSOLETE_PLAYER_IDS);
        const nonArchivePlayers = players.filter(p => (!ARCHIVE_YEARS.includes(p.year) || p.isCustom) && !obsoleteSet.has(p.id));
        const combinedPlayers = [...ARCHIVE_PLAYERS, ...nonArchivePlayers];

        const nonArchiveMatches = matches.filter(m => !ARCHIVE_YEARS.includes(m.year) || m.isCustom);
        const deduplicatedMatches = deduplicateMatches([...ARCHIVE_MATCHES, ...nonArchiveMatches]);

        const detectedYears = Array.from(new Set([
          ...baseYears,
          ...combinedClasses.map(c => c.year),
          ...combinedPlayers.map(p => p.year),
          ...deduplicatedMatches.map(m => m.year)
        ])).filter(Boolean);
        detectedYears.sort((a, b) => b.localeCompare(a));
        const years = detectedYears;

        const computed = recalculateInMemoryData(combinedClasses, combinedPlayers, deduplicatedMatches, years);
        const validYearDivs = getDivisionsForYear(year);
        let standings = computed.standings[year]?.[division] || [];
        if (standings.length === 0 && !validYearDivs.includes(division)) {
          if ((division === '11' || division === '10-11') && validYearDivs.includes('10-11')) standings = computed.standings[year]?.['10-11'] || [];
          else if ((division === '11' || division === '10-11') && validYearDivs.includes('11')) standings = computed.standings[year]?.['11'] || [];
          else if ((division === '9' || division === '9-10') && validYearDivs.includes('9-10')) standings = computed.standings[year]?.['9-10'] || [];
          else if ((division === '9' || division === '9-10') && validYearDivs.includes('9')) standings = computed.standings[year]?.['9'] || [];
          else if (validYearDivs.includes('9-10-11')) standings = computed.standings[year]?.['9-10-11'] || [];
        }
        console.log(`Firebase: Computed standings size: ${standings.length} classes for division ${division}, year ${year}`);
        return standings;
      } catch (e) {
        console.error("Firebase: getStandings failed with error: ", e);
        return [];
      }
    }
    recalculateData(); // refresh
    const validYearDivs = getDivisionsForYear(year);
    const allStandings = JSON.parse(localStorage.getItem('minifootball_standings_divided') || '{}');
    let localStandings = allStandings[year]?.[division] || [];
    if (localStandings.length === 0 && !validYearDivs.includes(division)) {
      if ((division === '11' || division === '10-11') && validYearDivs.includes('10-11')) localStandings = allStandings[year]?.['10-11'] || [];
      else if ((division === '11' || division === '10-11') && validYearDivs.includes('11')) localStandings = allStandings[year]?.['11'] || [];
      else if ((division === '9' || division === '9-10') && validYearDivs.includes('9-10')) localStandings = allStandings[year]?.['9-10'] || [];
      else if ((division === '9' || division === '9-10') && validYearDivs.includes('9')) localStandings = allStandings[year]?.['9'] || [];
      else if (validYearDivs.includes('9-10-11')) localStandings = allStandings[year]?.['9-10-11'] || [];
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
    allMatches = deduplicateMatches([...allMatches, ...ARCHIVE_MATCHES]);

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
        // Deduplicate duplicate profiles in same year & class (never sum duplicate records!)
        if (matchesPlayed > exist.matchesPlayed && goals > 0) {
          exist.goals = goals;
          exist.assists = assists;
          exist.matchesPlayed = matchesPlayed;
          exist.saves = Math.max(exist.saves, saves);
          if (rating > exist.rating) exist.rating = rating;
        } else {
          exist.goals = Math.max(exist.goals, goals);
          exist.assists = Math.max(exist.assists, assists);
          exist.matchesPlayed = Math.max(exist.matchesPlayed, matchesPlayed);
          exist.saves = Math.max(exist.saves, saves);
          if (rating > exist.rating) exist.rating = rating;
        }
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
    allMatches = deduplicateMatches([...allMatches, ...ARCHIVE_MATCHES]);
    const existingCIds = new Set(allClasses.map(c => c.id || `${c.year}_${c.name}`));
    ARCHIVE_CLASSES.forEach(ac => { if (!existingCIds.has(ac.id) && !existingCIds.has(`${ac.year}_${ac.name}`)) allClasses.push(ac); });

    // 1. Group players by normalized name (deduplicate spelling variants & aliases)
    // First deduplicate per (normKey + year + class) so duplicate profiles in the same season never multiply stats
    const seasonPlayerMap = new Map();
    allPlayers.forEach(p => {
      const name = (p.name || '').trim();
      if (!name) return;
      if (p.isOwnGoal || /avtoqol|özünə qol|ö\.q|ozune qol/i.test(name)) return;
      const normKey = normalizePlayerName(name);
      if (!normKey) return;

      const seasonClassKey = `${normKey}_${p.year || ''}_${p.class || ''}`;
      if (seasonPlayerMap.has(seasonClassKey)) {
        const exist = seasonPlayerMap.get(seasonClassKey);
        exist.goals = Math.max(exist.goals || 0, Number(p.goals) || 0);
        exist.assists = Math.max(exist.assists || 0, Number(p.assists) || 0);
        exist.matchesPlayed = Math.max(exist.matchesPlayed || 0, Number(p.matchesPlayed) || 0);
        if ((Number(p.overallRating) || 0) > (exist.overallRating || 0)) {
          exist.overallRating = Number(p.overallRating);
        }
        if (/[əıöüğşç]/i.test(name) && !/[əıöüğşç]/i.test(exist.name)) {
          exist.name = name;
        }
      } else {
        seasonPlayerMap.set(seasonClassKey, {
          ...p,
          normKey,
          name,
          goals: Number(p.goals) || 0,
          assists: Number(p.assists) || 0,
          matchesPlayed: Number(p.matchesPlayed) || 0,
          overallRating: Number(p.overallRating) || 6.5
        });
      }
    });

    const playerGroups = {};
    seasonPlayerMap.forEach(p => {
      const normKey = p.normKey;
      if (!playerGroups[normKey]) {
        playerGroups[normKey] = {
          name: p.name,
          normalizedName: p.name.toLowerCase(),
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
      if (/[əıöüğşç]/i.test(p.name) && !/[əıöüğşç]/i.test(playerGroups[normKey].name)) {
        playerGroups[normKey].name = p.name;
      }
      if (p.class) playerGroups[normKey].classes.add(p.class);
      if (p.year) playerGroups[normKey].years.add(p.year);
      playerGroups[normKey].totalGoals += p.goals;
      playerGroups[normKey].totalAssists += p.assists;
      playerGroups[normKey].totalMatches += p.matchesPlayed;
      if (p.overallRating) {
        playerGroups[normKey].ratingSum += p.overallRating;
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
