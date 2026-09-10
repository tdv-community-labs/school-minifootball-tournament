/**
 * ============================================================================
 * FAYL ADI: services/tournamentGroups.js
 * MƏQSƏDİ: Turnir Qruplarının İdarə Edilməsi və Püşkatma Alqoritmləri
 * 
 * BU MODULUN VƏZİFƏLƏRİ:
 *   1. KNOWN_GROUP_SEEDS: Tarixi mövsümlər üzrə əvvəlcədən təsdiqlənmiş rəsmi qrup püşkləri.
 *   2. assignGroupsToTeams(): Qrup mərhələsi matçlarını qraf nəzəriyyəsi (Connected Components)
 *      ilə təhlil edərək komandaları avtomatik A, B, C, D qruplarına bölüşdürür.
 * 
 * İSTİFADƏ EDİLDİYİ YERLƏR:
 *   - services/database.js (recalculateData, recalculateInMemoryData)
 *   - components/Standings.js (qrup cədvəllərinin vizuallaşdırılması)
 * ============================================================================
 */

import { isMatchDivision } from './i18n.js?v=20260910_0080';

/**
 * Tarixi mövsümlərin rəsmi qrup tərkibləri
 */
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

/**
 * Komandalara qrup hərflərini (A, B, C, ...) təyin edən qraf alqoritmi.
 * 
 * @param {Array<Object>} teamsList - Komandalar siyahısı
 * @param {Array<Object>} matchesList - Matçlar siyahısı
 * @param {string} yr - Mövsüm ili (məs: '2022-2023')
 * @param {string} div - Kateqoriya kodu (məs: '10-11')
 * @returns {Array<Object>} Qrupu təyin edilmiş komandalar
 */
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
