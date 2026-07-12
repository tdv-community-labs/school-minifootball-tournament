import { useRealFirebase } from './firebase-config.js';

// Seed Initial Classes (Empty for custom entry)
const initialClasses = [];

// Seed Initial Players (Empty for custom entry)
const initialPlayers = [];

const initialMatches = [];

const initializeStorage = () => {
  if (!localStorage.getItem('minifootball_years')) {
    localStorage.setItem('minifootball_years', JSON.stringify(["2025-2026", "2024-2025"]));
  }
  if (!localStorage.getItem('minifootball_classes')) {
    localStorage.setItem('minifootball_classes', JSON.stringify(initialClasses));
    localStorage.setItem('minifootball_players', JSON.stringify(initialPlayers));
    localStorage.setItem('minifootball_matches', JSON.stringify(initialMatches));
  }
  recalculateData();
};

export const recalculateData = () => {
  const classesList = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
  const players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
  const matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
  const years = JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025"]');
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

  // Unique divisions
  const divisions = ["6", "7-8", "9-10", "11"];
  const standingsMap = {};

  // Initialize standings per year and division
  years.forEach(yr => {
    standingsMap[yr] = {};
    divisions.forEach(div => {
      standingsMap[yr][div] = {};
      updatedClassesList.filter(c => c.year === yr && c.division === div).forEach(c => {
        standingsMap[yr][div][c.name] = {
          class: c.name,
          division: div,
          year: yr,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        };
      });
    });
  });

  // Process Matches
  matches.forEach(m => {
    const scoreA = Number(m.scoreA);
    const scoreB = Number(m.scoreB);
    const div = m.division;
    const yr = m.year || defaultYear;

    // Only "Qrup Mərhələsi" matches count towards league standings
    const isGroupStage = m.stage === "Qrup Mərhələsi";

    if (isGroupStage && standingsMap[yr] && standingsMap[yr][div] && standingsMap[yr][div][m.teamA] && standingsMap[yr][div][m.teamB]) {
      standingsMap[yr][div][m.teamA].played += 1;
      standingsMap[yr][div][m.teamB].played += 1;
      standingsMap[yr][div][m.teamA].goalsFor += scoreA;
      standingsMap[yr][div][m.teamA].goalsAgainst += scoreB;
      standingsMap[yr][div][m.teamB].goalsFor += scoreB;
      standingsMap[yr][div][m.teamB].goalsAgainst += scoreA;

      if (scoreA > scoreB) {
        standingsMap[yr][div][m.teamA].won += 1;
        standingsMap[yr][div][m.teamA].points += 3;
        standingsMap[yr][div][m.teamB].lost += 1;
      } else if (scoreA < scoreB) {
        standingsMap[yr][div][m.teamB].won += 1;
        standingsMap[yr][div][m.teamB].points += 3;
        standingsMap[yr][div][m.teamA].lost += 1;
      } else {
        standingsMap[yr][div][m.teamA].drawn += 1;
        standingsMap[yr][div][m.teamA].points += 1;
        standingsMap[yr][div][m.teamB].drawn += 1;
        standingsMap[yr][div][m.teamB].points += 1;
      }
    }

    // Accumulate player statistics
    if (m.playerStats && Array.isArray(m.playerStats)) {
      m.playerStats.forEach(stat => {
        if (!playerStatsMap[stat.playerId]) {
          playerStatsMap[stat.playerId] = { goals: 0, assists: 0, matchesPlayed: 0, ratingSum: 0, ratingCount: 0 };
        }
        playerStatsMap[stat.playerId].goals += Number(stat.goals || 0);
        playerStatsMap[stat.playerId].assists += Number(stat.assists || 0);
        playerStatsMap[stat.playerId].matchesPlayed += 1;
        if (stat.rating) {
          playerStatsMap[stat.playerId].ratingSum += Number(stat.rating);
          playerStatsMap[stat.playerId].ratingCount += 1;
        }
      });
    }
  });

  // Calculate goal differences and sort standings per year and division
  const finalStandings = {};
  years.forEach(yr => {
    finalStandings[yr] = {};
    divisions.forEach(div => {
      if (!standingsMap[yr] || !standingsMap[yr][div]) {
        finalStandings[yr][div] = [];
        return;
      }
      const list = Object.values(standingsMap[yr][div]).map(team => {
        team.goalDifference = team.goalsFor - team.goalsAgainst;
        return team;
      });

      // Sort
      list.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.class.localeCompare(b.class);
      });

      finalStandings[yr][div] = list;
    });
  });

  // Update players list with calculated values, division, and year
  const updatedPlayers = players.map(p => {
    const stats = playerStatsMap[p.id] || { goals: 0, assists: 0, matchesPlayed: 0, ratingSum: 0, ratingCount: 0 };
    const classInfo = updatedClassesList.find(c => c.name === p.class);
    const division = classInfo ? classInfo.division : p.division || "11";
    const year = classInfo ? classInfo.year : p.year || defaultYear;

    return {
      ...p,
      division,
      year,
      goals: stats.goals,
      assists: stats.assists,
      matchesPlayed: stats.matchesPlayed,
      overallRating: stats.ratingCount > 0 ? Number((stats.ratingSum / stats.ratingCount).toFixed(1)) : 6.0
    };
  });

  localStorage.setItem('minifootball_players', JSON.stringify(updatedPlayers));
  localStorage.setItem('minifootball_standings_divided', JSON.stringify(finalStandings));
};

// Initialize Mock Storage
if (!useRealFirebase) {
  initializeStorage();
}

export const db = {
  // Years CRUD
  getYears: async () => {
    return JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025"]');
  },

  addYear: async (year) => {
    const years = JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025"]');
    if (!years.includes(year)) {
      years.unshift(year); // add to beginning
      localStorage.setItem('minifootball_years', JSON.stringify(years));
    }
    recalculateData();
    return year;
  },

  deleteYear: async (year) => {
    let years = JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025"]');
    years = years.filter(y => y !== year);
    localStorage.setItem('minifootball_years', JSON.stringify(years));

    // Delete all classes, players, matches for this year
    let classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    classes = classes.filter(c => c.year !== year);
    localStorage.setItem('minifootball_classes', JSON.stringify(classes));

    let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    players = players.filter(p => p.year !== year);
    localStorage.setItem('minifootball_players', JSON.stringify(players));

    let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    matches = matches.filter(m => m.year !== year);
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));

    recalculateData();
  },

  // Classes CRUD
  getClasses: async (year) => {
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    if (year) {
      return classes.filter(c => c.year === year);
    }
    return classes;
  },

  addClass: async (cls) => {
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const newClass = {
      id: "c_" + Date.now(),
      year: cls.year || "2025-2026",
      ...cls
    };
    classes.push(newClass);
    localStorage.setItem('minifootball_classes', JSON.stringify(classes));
    recalculateData();
    return newClass;
  },

  deleteClass: async (id) => {
    let classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classToDelete = classes.find(c => c.id === id);
    classes = classes.filter(c => c.id !== id);
    localStorage.setItem('minifootball_classes', JSON.stringify(classes));
    
    // Delete players belonging to deleted class
    if (classToDelete) {
      let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
      players = players.filter(p => p.class !== classToDelete.name || p.year !== classToDelete.year);
      localStorage.setItem('minifootball_players', JSON.stringify(players));
    }
    recalculateData();
  },

  // Players CRUD
  getPlayers: async (year) => {
    const players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    if (year) {
      return players.filter(p => p.year === year);
    }
    return players;
  },
  
  addPlayer: async (player) => {
    const players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classInfo = classes.find(c => c.name === player.class && c.year === player.year);
    const division = classInfo ? classInfo.division : "11";
    const year = player.year || (classInfo ? classInfo.year : "2025-2026");

    const newPlayer = {
      id: "p_" + Date.now(),
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      overallRating: 6.0,
      division,
      year,
      ...player
    };
    players.push(newPlayer);
    localStorage.setItem('minifootball_players', JSON.stringify(players));
    recalculateData();
    return newPlayer;
  },

  updatePlayer: async (updatedPlayer) => {
    let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classInfo = classes.find(c => c.name === updatedPlayer.class && c.year === updatedPlayer.year);
    const division = classInfo ? classInfo.division : updatedPlayer.division || "11";
    const year = updatedPlayer.year || (classInfo ? classInfo.year : "2025-2026");

    players = players.map(p => p.id === updatedPlayer.id ? { ...p, ...updatedPlayer, division, year } : p);
    localStorage.setItem('minifootball_players', JSON.stringify(players));
    recalculateData();
    return updatedPlayer;
  },

  deletePlayer: async (id) => {
    let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    players = players.filter(p => p.id !== id);
    localStorage.setItem('minifootball_players', JSON.stringify(players));
    
    // Remove stats from matches
    let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    matches = matches.map(m => ({
      ...m,
      playerStats: (m.playerStats || []).filter(stat => stat.playerId !== id)
    }));
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    
    recalculateData();
  },

  // Matches CRUD
  getMatches: async (year) => {
    const matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    if (year) {
      return matches.filter(m => m.year === year);
    }
    return matches;
  },

  addMatch: async (match) => {
    const matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classInfo = classes.find(c => c.name === match.teamA && c.year === match.year);
    const division = classInfo ? classInfo.division : "11";
    const year = match.year || (classInfo ? classInfo.year : "2025-2026");

    const newMatch = {
      id: "m_" + Date.now(),
      playerStats: [],
      division,
      year,
      ...match
    };
    matches.push(newMatch);
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    recalculateData();
    return newMatch;
  },

  updateMatch: async (updatedMatch) => {
    let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    const classInfo = classes.find(c => c.name === updatedMatch.teamA && c.year === updatedMatch.year);
    const division = classInfo ? classInfo.division : updatedMatch.division || "11";
    const year = updatedMatch.year || (classInfo ? classInfo.year : "2025-2026");

    matches = matches.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch, division, year } : m);
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    recalculateData();
    return updatedMatch;
  },

  deleteMatch: async (id) => {
    let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    matches = matches.filter(m => m.id !== id);
    localStorage.setItem('minifootball_matches', JSON.stringify(matches));
    recalculateData();
  },

  // Standings Read (Divided by active division & year)
  getStandings: async (division = "11", year = "2025-2026") => {
    recalculateData(); // refresh
    const allStandings = JSON.parse(localStorage.getItem('minifootball_standings_divided') || '{}');
    return allStandings[year]?.[division] || [];
  },

  // Reset Database
  resetDatabase: async () => {
    localStorage.setItem('minifootball_classes', JSON.stringify(initialClasses));
    localStorage.setItem('minifootball_players', JSON.stringify(initialPlayers));
    localStorage.setItem('minifootball_matches', JSON.stringify(initialMatches));
    recalculateData();
  }
};
