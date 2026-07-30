import { useRealFirebase, firebaseConfig } from './firebase-config.js';
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

// Seed Initial Classes (Empty for custom entry)
const initialClasses = [];

// Seed Initial Players (Empty for custom entry)
const initialPlayers = [];

const initialMatches = [];

const initializeStorage = () => {
  const defaultYears = ["2025-2026", "2024-2025", "2023-2024", "2022-2023"];
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
  years.forEach(yr => {
    standingsMap[yr] = {};
    const divisions = ['6', '7-8', '9-10', '11'];
    divisions.forEach(div => {
      standingsMap[yr][div] = {};
      
      // Initialize classes for this year and division
      const filteredClasses = updatedClassesList.filter(c => c.year === yr && c.division === div);
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
    const div = m.division || "11";
    
    // Accumulate player match stats
    if (m.playerStats && Array.isArray(m.playerStats)) {
      m.playerStats.forEach(stat => {
        if (playerStatsMap[stat.playerId]) {
          playerStatsMap[stat.playerId].goals += Number(stat.goals || 0);
          playerStatsMap[stat.playerId].assists += Number(stat.assists || 0);
          playerStatsMap[stat.playerId].matchesPlayed += 1;
          if (stat.rating) {
            playerStatsMap[stat.playerId].ratingSum += Number(stat.rating);
            playerStatsMap[stat.playerId].ratingCount += 1;
          }
        }
      });
    }

    // Process team points only for group stage matches
    if (m.stage === 'Qrup Mərhələsi') {
      const yearDivMap = standingsMap[yr]?.[div];
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
    }
  });

  // Calculate Standing order list
  const finalStandings = {};
  years.forEach(yr => {
    finalStandings[yr] = {};
    const divisions = ['6', '7-8', '9-10', '11'];
    divisions.forEach(div => {
      if (!standingsMap[yr]?.[div]) {
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
    const divisions = ['6', '7', '8', '9', '10-11', '7-8', '9-10', '11'];
    divisions.forEach(div => {
      standingsMap[yr][div] = {};
      
      // Initialize classes for this year and division
      const filteredClasses = updatedClassesList.filter(c => c.year === yr && c.division === div);
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
    const div = m.division || "11";
    
    // Accumulate player match stats
    if (m.playerStats && Array.isArray(m.playerStats)) {
      m.playerStats.forEach(stat => {
        if (playerStatsMap[stat.playerId]) {
          playerStatsMap[stat.playerId].goals += Number(stat.goals || 0);
          playerStatsMap[stat.playerId].assists += Number(stat.assists || 0);
          playerStatsMap[stat.playerId].matchesPlayed += 1;
          if (stat.rating) {
            playerStatsMap[stat.playerId].ratingSum += Number(stat.rating);
            playerStatsMap[stat.playerId].ratingCount += 1;
          }
        }
      });
    }

    // Process team points only for group stage matches
    if (m.stage === 'Qrup Mərhələsi') {
      const yearDivMap = standingsMap[yr]?.[div];
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
    }
  });

  // Calculate Standing order list
  const finalStandings = {};
  yearsList.forEach(yr => {
    finalStandings[yr] = {};
    const divisions = ['6', '7-8', '9-10', '11'];
    divisions.forEach(div => {
      if (!standingsMap[yr]?.[div]) {
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
      goals: stats.goals > 0 ? stats.goals : p.goals || 0,
      assists: stats.assists > 0 ? stats.assists : p.assists || 0,
      matchesPlayed: stats.matchesPlayed > 0 ? stats.matchesPlayed : p.matchesPlayed || 0,
      overallRating: stats.ratingCount > 0 ? Number((stats.ratingSum / stats.ratingCount).toFixed(1)) : p.overallRating || 6.0
    };
  });

  return {
    players: updatedPlayers,
    standings: finalStandings
  };
};

// Initialize Mock Storage
if (!useRealFirebase) {
  initializeStorage();
}

export const db = {
  // Years CRUD
  getYears: async () => {
    if (useRealFirebase && firestore) {
      console.log("Firebase: Fetching years...");
      try {
        const querySnapshot = await getDocs(collection(firestore, "years"));
        const list = [];
        querySnapshot.forEach(docSnap => {
          list.push(docSnap.id);
        });
        console.log("Firebase: Years fetched: ", list);
        if (list.length > 0) {
          list.sort((a, b) => b.localeCompare(a));
          return list;
        }
        return ["2025-2026", "2024-2025", "2023-2024", "2022-2023"];
      } catch (err) {
        console.error("Firebase: getYears failed with error: ", err);
        return ["2025-2026", "2024-2025", "2023-2024", "2022-2023"];
      }
    }
    return JSON.parse(localStorage.getItem('minifootball_years') || '["2025-2026", "2024-2025", "2023-2024", "2022-2023"]');
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
    if (useRealFirebase && firestore) {
      console.log("Firebase: Fetching classes...");
      try {
        const querySnapshot = await getDocs(collection(firestore, "classes"));
        const list = [];
        querySnapshot.forEach(docSnap => {
          list.push(sanitizeObject(docSnap.data()));
        });
        console.log(`Firebase: Classes fetched: ${list.length} records. Filtering by year: ${year || 'all'}`);
        if (year) {
          return list.filter(c => c.year === year);
        }
        return list;
      } catch (err) {
        console.error("Firebase: getClasses failed with error: ", err);
        return [];
      }
    }
    const classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
    if (year) {
      return classes.filter(c => c.year === year);
    }
    return classes;
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
        const years = ["2025-2026", "2024-2025", "2023-2024", "2022-2023"];

        console.log(`Firebase: Raw loaded stats - Classes: ${classes.length}, Players: ${players.length}, Matches: ${matches.length}`);
        const computed = recalculateInMemoryData(classes, players, matches, years);
        console.log(`Firebase: In-memory stats computed. Total computed players: ${computed.players.length}`);
        
        let filtered = computed.players;
        if (year) {
          filtered = computed.players.filter(p => p.year === year);
        }
        console.log(`Firebase: Returning ${filtered.length} players for year ${year || 'all'}.`);
        return filtered;
      } catch (err) {
        console.error("Firebase: getPlayers failed with error: ", err);
        return [];
      }
    }
    const players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
    if (year) {
      return players.filter(p => p.year === year);
    }
    return players;
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
    if (useRealFirebase && firestore) {
      console.log("Firebase: Fetching matches...");
      try {
        const querySnapshot = await getDocs(collection(firestore, "matches"));
        const list = [];
        querySnapshot.forEach(docSnap => {
          list.push(sanitizeObject(docSnap.data()));
        });
        console.log(`Firebase: Matches fetched: ${list.length} records. Filtering by year: ${year || 'all'}`);
        if (year) {
          return list.filter(m => m.year === year);
        }
        return list;
      } catch (err) {
        console.error("Firebase: getMatches failed with error: ", err);
        return [];
      }
    }
    const matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
    if (year) {
      return matches.filter(m => m.year === year);
    }
    return matches;
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
        cSnap.forEach(d => classes.push(d.data()));
        const players = [];
        pSnap.forEach(d => players.push(d.data()));
        const matches = [];
        mSnap.forEach(d => matches.push(d.data()));
        const years = ["2025-2026", "2024-2025", "2023-2024", "2022-2023"];

        const computed = recalculateInMemoryData(classes, players, matches, years);
        const standings = computed.standings[year]?.[division] || [];
        console.log(`Firebase: Computed standings size: ${standings.length} classes for division ${division}, year ${year}`);
        return standings;
      } catch (e) {
        console.error("Firebase: getStandings failed with error: ", e);
        return [];
      }
    }
    recalculateData(); // refresh
    const allStandings = JSON.parse(localStorage.getItem('minifootball_standings_divided') || '{}');
    return allStandings[year]?.[division] || [];
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
  }
};
