const fs = require('fs');
let code = fs.readFileSync('services/matchAnalyticsData.js', 'utf8');

const newMock = `
// 10B vs 10F (3-6) - 3-cü Yer uğrunda oyun (2023-2024)
export const MATCH_10B_VS_10F_ANALYTICS = {
  matchId: "m_yt_2023_10b_10f_3_c_0",
  teamA: "10B",
  teamB: "10F",
  scoreA: 3,
  scoreB: 6,
  format: "5v5",
  pitchDimensions: "40m x 20m",
  stadium: "TDV BTL Minifutbol Arena",
  location: "Bakı, Azərbaycan",
  date: "15.05.2024 • 15:30",
  referee: {
    name: "Kamran Bəy",
    country: "Azərbaycan",
    avgYellow: "0.20",
    avgRed: "1.10"
  },
  coaches: {
    teamA: "10B Məşqçisi",
    teamB: "10F Məşqçisi"
  },
  teamRatings: {
    teamA: 6.8,
    teamB: 8.5
  },
  stats: {
    distanceCoveredA: "11.2 km",
    distanceCoveredB: "14.1 km",
    xgA: 2.1,
    xgB: 4.8,
    xgotA: 2.5,
    xgotB: 5.9,
    bigChancesA: 3,
    bigChancesB: 8,
    totalShotsA: 10,
    totalShotsB: 22,
    shotsOnTargetA: 6,
    shotsOnTargetB: 14,
    gkSavesA: 8,
    gkSavesB: 3,
    sprintsA: 30,
    sprintsB: 55,
    cornersA: 2,
    cornersB: 7,
    foulsA: 9,
    foulsB: 4,
    passesA: 120,
    passesB: 210,
    passAccuracyA: 72,
    passAccuracyB: 86,
    tacklesA: 15,
    tacklesB: 18,
    freeKicksA: 4,
    freeKicksB: 9,
    possessionA: 38,
    possessionB: 62
  },
  lineupA: [
    { id: "p_10b_1", name: "10B Qapıçı", number: 1, pos: "GK", roleName: "Qapıçı", x: 14, y: 50, rating: 6.2, isKeeper: true, saves: 8, avgVector: { dx: 1, dy: 0 } },
    { id: "p_10b_2", name: "10B Müdafiə", number: 4, pos: "DF", roleName: "Son Adam", x: 26, y: 50, rating: 6.0, avgVector: { dx: 5, dy: 0 } },
    { id: "p_10b_3", name: "10B Sol Cinah", number: 7, pos: "MF", roleName: "Sol Cinah", x: 37, y: 25, rating: 6.5, goals: 1, avgVector: { dx: 8, dy: 5 } },
    { id: "p_10b_4", name: "10B Sağ Cinah", number: 10, pos: "MF", roleName: "Sağ Cinah", x: 37, y: 75, rating: 6.8, assists: 1, avgVector: { dx: 10, dy: -5 } },
    { id: "p_10b_5", name: "10B Hücumçu", number: 9, pos: "FW", roleName: "Hücumçu", x: 46, y: 50, rating: 7.2, goals: 2, avgVector: { dx: 12, dy: 0 } }
  ],
  benchA: [],
  lineupB: [
    { id: "p_10f_1", name: "10F Qapıçı", number: 1, pos: "GK", roleName: "Qapıçı", x: 86, y: 50, rating: 7.5, isKeeper: true, saves: 3, avgVector: { dx: -1, dy: 0 } },
    { id: "p_10f_2", name: "10F Müdafiə", number: 3, pos: "DF", roleName: "Son Adam", x: 74, y: 50, rating: 7.8, assists: 1, avgVector: { dx: -5, dy: 2 } },
    { id: "p_10f_3", name: "10F Sol Cinah", number: 8, pos: "MF", roleName: "Sol Cinah", x: 63, y: 25, rating: 8.2, goals: 2, avgVector: { dx: -12, dy: -4 } },
    { id: "p_10f_4", name: "10F Sağ Cinah", number: 11, pos: "MF", roleName: "Sağ Cinah", x: 63, y: 75, rating: 8.5, goals: 1, assists: 2, avgVector: { dx: -15, dy: 6 } },
    { id: "p_10f_5", name: "10F Hücumçu", number: 10, pos: "FW", roleName: "Pivot", x: 54, y: 50, rating: 9.4, goals: 3, assists: 1, isMvp: true, avgVector: { dx: -20, dy: 0 } }
  ],
  benchB: [],
  commentary: [
    { min: 32, type: "whistle", isKey: true, team: "both", title: "Matç Bitdi", desc: "10F 6-3 hesabı ilə qələbə qazanaraq bürünc medalların sahibi oldu!" },
    { min: 28, type: "goal", isKey: true, team: "10F", player: "10F Hücumçu", desc: "QOL! Het-trik! 10F hesab fərqini artırır. (3-6)" },
    { min: 24, type: "goal", isKey: true, team: "10F", player: "10F Sol Cinah", desc: "QOL! 10F yenidən fərqi iki topa çıxarır. (3-5)" },
    { min: 20, type: "goal", isKey: true, team: "10B", player: "10B Hücumçu", desc: "QOL! 10B təslim olmur! Fərq yenidən 1 topa endi. (3-4)" },
    { min: 18, type: "goal", isKey: true, team: "10B", player: "10B Sol Cinah", desc: "QOL! 10B ikinci hissəyə sürətli başlayır. (2-4)" },
    { min: 14, type: "goal", isKey: true, team: "10F", player: "10F Sağ Cinah", desc: "QOL! Sağ cinahdan mükəmməl zərbə! (1-4)" },
    { min: 10, type: "goal", isKey: true, team: "10F", player: "10F Hücumçu", desc: "QOL! 10F hücumçusu dubl edir! (1-3)" },
    { min: 8, type: "goal", isKey: true, team: "10F", player: "10F Hücumçu", desc: "QOL! 10F hesabda önə keçir! (1-2)" },
    { min: 5, type: "goal", isKey: true, team: "10F", player: "10F Sol Cinah", desc: "QOL! 10F tezliklə cavab verir! Hesab bərabərdir. (1-1)" },
    { min: 2, type: "goal", isKey: true, team: "10B", player: "10B Hücumçu", desc: "QOL! 10B erkən qolla önə keçir! (1-0)" }
  ],
  momentum: [
    { min: 2, valA: 80, valB: 20, event: "goalA" },
    { min: 5, valA: 30, valB: 70, event: "goalB" },
    { min: 8, valA: 20, valB: 80, event: "goalB" },
    { min: 10, valA: 10, valB: 90, event: "goalB" },
    { min: 14, valA: 25, valB: 75, event: "goalB" },
    { min: 18, valA: 70, valB: 30, event: "goalA" },
    { min: 20, valA: 85, valB: 15, event: "goalA" },
    { min: 24, valA: 40, valB: 60, event: "goalB" },
    { min: 28, valA: 20, valB: 80, event: "goalB" },
    { min: 32, valA: 40, valB: 60 }
  ],
  heatmapData: {
    teamA: [],
    teamB: [],
    playerHeatmaps: {}
  },
  shots: []
};

`;

code = code.replace(
  /export function getMatchAnalytics/,
  newMock + 'export function getMatchAnalytics'
);

code = code.replace(
  /if \(match\.id === 'm_22_17'.*?\{[\s\S]*?\}/,
  \`if (match.id === 'm_22_17' || (match.teamA === '10A' && match.teamB === '11H' && match.year === '2022-2023')) {
    return MATCH_10A_VS_11H_ANALYTICS;
  }
  if (match.id === 'm_yt_2023_10b_10f_3_c_0' || (match.teamA === '10B' && match.teamB === '10F' && match.scoreA === 3 && match.scoreB === 6)) {
    return MATCH_10B_VS_10F_ANALYTICS;
  }\`
);

fs.writeFileSync('services/matchAnalyticsData.js', code);
console.log('Successfully injected 10B vs 10F match mock.');
