const fs = require('fs');
const path = require('path');

const archivePath = path.join(__dirname, '../services/archiveData.js');
const archiveContent = fs.readFileSync(archivePath, 'utf8');

const matchRegex = /export const ARCHIVE_MATCHES = (\[[\s\S]*?\n\];)/;
const matchStr = archiveContent.match(matchRegex)[1].replace(/;\s*$/, '');
const archiveMatches = new Function('return ' + matchStr)();

const analyticsPath = path.join(__dirname, '../public/data/match-analytics.json');
const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));

let addedCount = 0;
for (const m of archiveMatches) {
  if (!m.id) continue;
  if (!analytics[m.id]) {
    const scoreA = Number(m.scoreA) || 0;
    const scoreB = Number(m.scoreB) || 0;
    const totalShotsA = Math.max(scoreA + 3, Math.round(scoreA * 2.5 + 4));
    const totalShotsB = Math.max(scoreB + 3, Math.round(scoreB * 2.5 + 4));
    const shotsOnTargetA = Math.max(scoreA, Math.round(totalShotsA * 0.6));
    const shotsOnTargetB = Math.max(scoreB, Math.round(totalShotsB * 0.6));
    const xgA = Number((scoreA * 0.72 + (totalShotsA - scoreA) * 0.08).toFixed(2));
    const xgB = Number((scoreB * 0.72 + (totalShotsB - scoreB) * 0.08).toFixed(2));

    const lineupA = [
      { id: `${m.id}_a1`, name: `${m.teamA} Qapıçı`, number: 1, pos: 'GK', roleName: 'Qapıçı', x: 14, y: 50, rating: Number((6.5 + (scoreB === 0 ? 1.5 : Math.max(0, 1 - scoreB * 0.2))).toFixed(1)), isKeeper: true, avgVector: { dx: 2, dy: 0 } },
      { id: `${m.id}_a2`, name: `${m.teamA} Müdafiə`, number: 4, pos: 'DF', roleName: 'Son Adam', x: 26, y: 50, rating: Number((6.6 + (scoreA > scoreB ? 0.6 : 0)).toFixed(1)), avgVector: { dx: 8, dy: -2 } },
      { id: `${m.id}_a3`, name: `${m.teamA} Sol Qanad`, number: 3, pos: 'MF', roleName: 'Sol Cinah', x: 37, y: 25, rating: Number((6.7 + (scoreA > scoreB ? 0.5 : 0)).toFixed(1)), avgVector: { dx: 12, dy: 5 } },
      { id: `${m.id}_a4`, name: `${m.teamA} Sağ Qanad`, number: 10, pos: 'MF', roleName: 'Sağ Cinah', x: 37, y: 75, rating: Number((7.0 + (scoreA * 0.5)).toFixed(1)), goals: Math.min(scoreA, 2), avgVector: { dx: 15, dy: -6 } },
      { id: `${m.id}_a5`, name: `${m.teamA} Hücumçu`, number: 9, pos: 'FW', roleName: 'Pivot', x: 46, y: 50, rating: Number((7.2 + (scoreA * 0.6)).toFixed(1)), goals: Math.max(0, scoreA - 2), isMvp: scoreA >= scoreB, avgVector: { dx: 18, dy: 0 } }
    ];

    const lineupB = [
      { id: `${m.id}_b1`, name: `${m.teamB} Qapıçı`, number: 1, pos: 'GK', roleName: 'Qapıçı', x: 86, y: 50, rating: Number((6.5 + (scoreA === 0 ? 1.5 : Math.max(0, 1 - scoreA * 0.2))).toFixed(1)), isKeeper: true, avgVector: { dx: -2, dy: 0 } },
      { id: `${m.id}_b2`, name: `${m.teamB} Müdafiə`, number: 4, pos: 'DF', roleName: 'Son Adam', x: 74, y: 50, rating: Number((6.6 + (scoreB > scoreA ? 0.6 : 0)).toFixed(1)), avgVector: { dx: -8, dy: 2 } },
      { id: `${m.id}_b3`, name: `${m.teamB} Sol Qanad`, number: 17, pos: 'MF', roleName: 'Sol Cinah', x: 63, y: 25, rating: Number((6.7 + (scoreB > scoreA ? 0.5 : 0)).toFixed(1)), avgVector: { dx: -12, dy: -4 } },
      { id: `${m.id}_b4`, name: `${m.teamB} Sağ Qanad`, number: 8, pos: 'MF', roleName: 'Sağ Cinah', x: 63, y: 75, rating: Number((6.8 + (scoreB * 0.4)).toFixed(1)), goals: Math.min(scoreB, 1), avgVector: { dx: -10, dy: 5 } },
      { id: `${m.id}_b5`, name: `${m.teamB} Hücumçu`, number: 13, pos: 'FW', roleName: 'Pivot', x: 54, y: 50, rating: Number((7.0 + (scoreB * 0.5)).toFixed(1)), goals: Math.max(0, scoreB - 1), isMvp: scoreB > scoreA, avgVector: { dx: -16, dy: 0 } }
    ];

    const commentary = [
      { min: 32, type: 'whistle', isKey: true, team: 'both', title: 'Matç Bitdi', desc: `Final fitı çalındı! Matç ${scoreA}-${scoreB} hesabı ilə başa çatdı.` },
      { min: 28, type: 'shot', isKey: false, team: m.teamA, player: lineupA[4].name, desc: `${lineupA[4].name} qapıya təhlükəli zərbə endirdi.` },
      { min: 20, type: 'sub', isKey: true, team: m.teamA, player: `${m.teamA} Ehtiyat`, desc: 'Əvəzetmə: Meydana təzə qüvvələr daxil olur.' },
      { min: 15, type: 'goal', isKey: true, team: scoreA >= scoreB ? m.teamA : m.teamB, player: scoreA >= scoreB ? lineupA[4].name : lineupB[4].name, desc: '⚽ QOL! Gözəl kombinasiya və dəqiq zərbə!' },
      { min: 5, type: 'card_yellow', isKey: true, team: m.teamB, player: lineupB[1].name, desc: '🟨 Sarı vərəqə: Oyunçu qaydanı pozdu.' },
      { min: 1, type: 'whistle', isKey: false, team: 'both', title: 'Matç Başladı', desc: 'Hakim matçın startını verdi.' }
    ];

    const momentum = [
      { min: 1, valA: 50, valB: 50 },
      { min: 5, valA: scoreA > scoreB ? 65 : 35, valB: scoreB > scoreA ? 65 : 35 },
      { min: 15, valA: scoreA >= scoreB ? 80 : 25, valB: scoreB > scoreA ? 80 : 25, event: 'goal' },
      { min: 25, valA: 55, valB: 45 },
      { min: 32, valA: 50, valB: 50 }
    ];

    analytics[m.id] = {
      matchId: m.id,
      teamA: m.teamA,
      teamB: m.teamB,
      scoreA,
      scoreB,
      format: '5v5',
      pitchDimensions: '40m x 20m',
      stadium: 'TDV BTL Minifutbol Arena',
      location: 'Bakı, Azərbaycan',
      date: m.date || 'Arxiv Matç',
      referee: { name: 'Cavidan Bəy', country: 'Azərbaycan', avgYellow: '0.15', avgRed: '2.10' },
      coaches: { teamA: `${m.teamA} Məşqçisi`, teamB: `${m.teamB} Məşqçisi` },
      teamRatings: { teamA: Number((7.0 + (scoreA > scoreB ? 0.8 : 0)).toFixed(1)), teamB: Number((7.0 + (scoreB > scoreA ? 0.8 : 0)).toFixed(1)) },
      stats: {
        distanceCoveredA: '11.5 km', distanceCoveredB: '11.2 km',
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
    addedCount++;
  }
}

fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2), 'utf8');
console.log(`Successfully added analytics for ${addedCount} additional matches! Total count in JSON: ${Object.keys(analytics).length}`);
