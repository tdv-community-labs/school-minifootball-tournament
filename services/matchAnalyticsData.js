import { getSofascoreBadgeStyle } from './database.js';

/**
 * YouTube Rəsmi Kanal Konfiqurasiyası & API Ayarları
 */
export const YOUTUBE_CONFIG = {
  channelUrl: "https://www.youtube.com/@TDV-BTLFootballCup",
  channelName: "TDV BTL Football Cup",
  apiKeys: [
    "YOUR_YOUTUBE_API_KEY_1_HERE",
    "YOUR_YOUTUBE_API_KEY_2_HERE",
    "YOUR_YOUTUBE_API_KEY_3_HERE"
  ]
};

let cachedAnalyticsMap = {};
let isLoaded = false;
let loadPromise = null;

export const loadAnalyticsData = async () => {
  if (isLoaded) return cachedAnalyticsMap;
  if (!loadPromise) {
    loadPromise = fetch('./data/match-analytics.json?v=20260912')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        cachedAnalyticsMap = data || {};
        isLoaded = true;
        return cachedAnalyticsMap;
      })
      .catch(err => {
        console.error("Error loading match analytics JSON:", err);
        return {};
      });
  }
  return loadPromise;
};

// Avtomatik olaraq modulu yükləyən kimi arxa fonda tənbəl yükləməni başladırıq
if (typeof window !== 'undefined') {
  loadAnalyticsData();
}

/**
 * İstənilən digər matç üçün avtomatlaşdırılmış realistik 5v5 Sofascore analitikasını generasiya edir
 */
export function getMatchAnalytics(match, allPlayers = []) {
  if (!match) return null;
  
  if (cachedAnalyticsMap) {
    if (cachedAnalyticsMap[match.id]) {
      return cachedAnalyticsMap[match.id];
    }
    const foundKey = Object.keys(cachedAnalyticsMap).find(id => {
      const item = cachedAnalyticsMap[id];
      return item.matchId === match.id || 
             (item.teamA === match.teamA && item.teamB === match.teamB && String(item.scoreA) === String(match.scoreA) && String(item.scoreB) === String(match.scoreB));
    });
    if (foundKey) {
      return cachedAnalyticsMap[foundKey];
    }
  }

  const scoreA = Number(match.scoreA) || 0;
  const scoreB = Number(match.scoreB) || 0;

  const totalShotsA = Math.max(scoreA + 3, Math.round(scoreA * 2.5 + 4));
  const totalShotsB = Math.max(scoreB + 3, Math.round(scoreB * 2.5 + 4));
  const shotsOnTargetA = Math.max(scoreA, Math.round(totalShotsA * 0.6));
  const shotsOnTargetB = Math.max(scoreB, Math.round(totalShotsB * 0.6));
  const xgA = Number((scoreA * 0.72 + (totalShotsA - scoreA) * 0.08).toFixed(2));
  const xgB = Number((scoreB * 0.72 + (totalShotsB - scoreB) * 0.08).toFixed(2));

  const teamAPlayers = allPlayers.filter(p => p.class === match.teamA);
  const teamBPlayers = allPlayers.filter(p => p.class === match.teamB);

  const lineupA = [
    { id: `${match.id}_a1`, name: teamAPlayers[0]?.name || `${match.teamA} Qapıçı`, number: 1, pos: 'GK', roleName: 'Qapıçı', x: 14, y: 50, rating: Number((6.5 + (scoreB === 0 ? 1.5 : Math.max(0, 1 - scoreB * 0.2))).toFixed(1)), isKeeper: true, avgVector: { dx: 2, dy: 0 } },
    { id: `${match.id}_a2`, name: teamAPlayers[1]?.name || `${match.teamA} Müdafiə`, number: 4, pos: 'DF', roleName: 'Son Adam (Fix)', x: 26, y: 50, rating: Number((6.6 + (scoreA > scoreB ? 0.6 : 0)).toFixed(1)), avgVector: { dx: 8, dy: -2 } },
    { id: `${match.id}_a3`, name: teamAPlayers[2]?.name || `${match.teamA} Sol Qanad`, number: 3, pos: 'MF', roleName: 'Sol Cinah (Ala)', x: 37, y: 25, rating: Number((6.7 + (scoreA > scoreB ? 0.5 : 0)).toFixed(1)), avgVector: { dx: 12, dy: 5 } },
    { id: `${match.id}_a4`, name: teamAPlayers[3]?.name || `${match.teamA} Sağ Qanad`, number: 10, pos: 'MF', roleName: 'Sağ Cinah', x: 37, y: 75, rating: Number((7.0 + (scoreA * 0.5)).toFixed(1)), goals: Math.min(scoreA, 2), avgVector: { dx: 15, dy: -6 } },
    { id: `${match.id}_a5`, name: teamAPlayers[4]?.name || `${match.teamA} Hücumçu`, number: 9, pos: 'FW', roleName: 'Mərkəz Hücumçusu', x: 46, y: 50, rating: Number((7.2 + (scoreA * 0.6)).toFixed(1)), goals: Math.max(0, scoreA - 2), isMvp: scoreA >= scoreB, avgVector: { dx: 18, dy: 0 } }
  ];

  const lineupB = [
    { id: `${match.id}_b1`, name: teamBPlayers[0]?.name || `${match.teamB} Qapıçı`, number: 1, pos: 'GK', roleName: 'Qapıçı', x: 86, y: 50, rating: Number((6.5 + (scoreA === 0 ? 1.5 : Math.max(0, 1 - scoreA * 0.2))).toFixed(1)), isKeeper: true, avgVector: { dx: -2, dy: 0 } },
    { id: `${match.id}_b2`, name: teamBPlayers[1]?.name || `${match.teamB} Müdafiə`, number: 4, pos: 'DF', roleName: 'Son Adam (Fix)', x: 74, y: 50, rating: Number((6.6 + (scoreB > scoreA ? 0.6 : 0)).toFixed(1)), avgVector: { dx: -8, dy: 2 } },
    { id: `${match.id}_b3`, name: teamBPlayers[2]?.name || `${match.teamB} Sol Qanad`, number: 17, pos: 'MF', roleName: 'Sol Cinah', x: 63, y: 25, rating: Number((6.7 + (scoreB > scoreA ? 0.5 : 0)).toFixed(1)), avgVector: { dx: -12, dy: -4 } },
    { id: `${match.id}_b4`, name: teamBPlayers[3]?.name || `${match.teamB} Sağ Qanad`, number: 8, pos: 'MF', roleName: 'Sağ Cinah', x: 63, y: 75, rating: Number((6.8 + (scoreB * 0.4)).toFixed(1)), goals: Math.min(scoreB, 1), avgVector: { dx: -10, dy: 5 } },
    { id: `${match.id}_b5`, name: teamBPlayers[4]?.name || `${match.teamB} Hücumçu`, number: 13, pos: 'FW', roleName: 'Mərkəz Hücumçusu', x: 54, y: 50, rating: Number((7.0 + (scoreB * 0.5)).toFixed(1)), goals: Math.max(0, scoreB - 1), isMvp: scoreB > scoreA, avgVector: { dx: -16, dy: 0 } }
  ];

  const commentary = [
    { min: 32, type: "whistle", isKey: true, team: "both", title: "Oyun Başa Çatdı", desc: `Hakim final fitini çaldı! Matç ${scoreA}-${scoreB} hesabı ilə yekunlaşdı.` },
    { min: 28, type: "shot", isKey: false, team: match.teamA, player: lineupA[4].name, desc: `${lineupA[4].name} qapıya təhlükəli zərbə endirdi, top az fərqlə auta getdi.` },
    { min: 20, type: "sub", isKey: true, team: match.teamA, player: `${match.teamA} Ehtiyat`, desc: `Əvəzetmə: ${lineupA[2].name} daxil olur.` },
    { min: 15, type: "goal", isKey: true, team: scoreA >= scoreB ? match.teamA : match.teamB, player: scoreA >= scoreB ? lineupA[4].name : lineupB[4].name, desc: `⚽ QOL! Möhtəşəm hücum təşkili və qol!` },
    { min: 5, type: "card_yellow", isKey: true, team: match.teamB, player: lineupB[1].name, desc: `🟨 Sarı vərəqə: Fol və oyunu gecikdirmə.` },
    { min: 1, type: "whistle", isKey: false, team: "both", title: "Oyun Başladı", desc: "Matç start götürdü!" }
  ];

  const momentum = [
    { min: 1, valA: 50, valB: 50 },
    { min: 5, valA: 70, valB: 30 },
    { min: 10, valA: 40, valB: 60 },
    { min: 15, valA: scoreA >= scoreB ? 85 : 30, valB: scoreB > scoreA ? 85 : 30, event: "goalA" },
    { min: 20, valA: 55, valB: 45 },
    { min: 25, valA: 60, valB: 40 },
    { min: 32, valA: 50, valB: 50 }
  ];

  return {
    matchId: match.id,
    teamA: match.teamA,
    teamB: match.teamB,
    scoreA,
    scoreB,
    format: "5v5",
    pitchDimensions: "40m x 20m",
    stadium: "TDV BTL Minifutbol Arena",
    location: "Bakı, Azərbaycan",
    date: match.date || "Arxiv Oyun",
    referee: { name: "Cavidan Bəy", country: "Azərbaycan", avgYellow: "0.15", avgRed: "2.10" },
    coaches: { teamA: `${match.teamA} Məşqçisi`, teamB: `${match.teamB} Məşqçisi` },
    teamRatings: { teamA: 7.2, teamB: 7.0 },
    stats: {
      distanceCoveredA: "11.5 km", distanceCoveredB: "11.2 km",
      xgA, xgB, xgotA: xgA, xgotB: xgB,
      bigChancesA: Math.max(1, scoreA), bigChancesB: Math.max(1, scoreB),
      totalShotsA, totalShotsB, shotsOnTargetA, shotsOnTargetB,
      gkSavesA: Math.max(1, shotsOnTargetB - scoreB), gkSavesB: Math.max(1, shotsOnTargetA - scoreA),
      sprintsA: 40, sprintsB: 38, cornersA: 4, cornersB: 3, foulsA: 5, foulsB: 6,
      passesA: 150, passesB: 140, passAccuracyA: 78, passAccuracyB: 75,
      tacklesA: 12, tacklesB: 14, freeKicksA: 5, freeKicksB: 4,
      possessionA: 50, possessionB: 50
    },
    lineupA, benchA: [], lineupB, benchB: [], commentary, momentum,
    heatmapData: { teamA: [], teamB: [], playerHeatmaps: {} },
    shots: []
  };
}
