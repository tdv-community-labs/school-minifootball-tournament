/**
 * ============================================================================
 * FAYL ADI: services/matchAnalyticsData.js
 * MƏQSƏDİ: Oyunların Sofascore-tipli Dərin Statistikası, Zərbə Xəritəsi (Shotmap),
 *          Qapı POV-u (Goalmouth POV), Heyətlər və İstilik Xəritəsi (Heatmap).
 * ============================================================================
 */

// 10A vs 11H (01.06.2023) - 32 dəqiqəlik videonun tam Gemini 2.5 multimodal analizi
export const MATCH_10A_VS_11H_ANALYTICS = {
  matchId: "m_22_17",
  teamA: "10A",
  teamB: "11H",
  scoreA: 5,
  scoreB: 4,
  stats: {
    distanceCoveredA: "92.9 km",
    distanceCoveredB: "92.5 km",
    xgA: 3.99,
    xgB: 2.78,
    xgotA: 5.75,
    xgotB: 4.51,
    bigChancesA: 6,
    bigChancesB: 5,
    totalShotsA: 16,
    totalShotsB: 14,
    shotsOnTargetA: 11,
    shotsOnTargetB: 9,
    gkSavesA: 0,
    gkSavesB: 6,
    sprintsA: 95,
    sprintsB: 77,
    cornersA: 5,
    cornersB: 4,
    foulsA: 11,
    foulsB: 5,
    passesA: 555,
    passesB: 358,
    tacklesA: 10,
    tacklesB: 24,
    freeKicksA: 5,
    freeKicksB: 11,
    possessionA: 55,
    possessionB: 45
  },
  lineupA: [
    { id: "p1", name: "10A Qapıçı", number: 1, pos: "GK", x: 14, y: 50, rating: 6.8, isKeeper: true },
    { id: "p2", name: "Məmmədi", number: 3, pos: "DF", x: 26, y: 25, rating: 6.5 },
    { id: "p3", name: "Amin İsmayılov", number: 4, pos: "DF", x: 26, y: 75, rating: 7.5, assists: 1 },
    { id: "p4", name: "Fərid Əhmədli", number: 10, pos: "MF", x: 37, y: 35, rating: 8.5, goals: 2, assists: 2, redCard: "17'" },
    { id: "p5", name: "Ağacan", number: 11, pos: "MF", x: 37, y: 65, rating: 7.0 },
    { id: "p6", name: "Murad Abdullayev", number: 9, pos: "FW", x: 45, y: 50, rating: 9.0, goals: 3, assists: 1, isMvp: true }
  ],
  lineupB: [
    { id: "p7", name: "11H Qapıçısı", number: 1, pos: "GK", x: 86, y: 50, rating: 8.5, isKeeper: true, saves: 6 },
    { id: "p8", name: "11H Müdafiəçi", number: 4, pos: "DF", x: 74, y: 25, rating: 6.4 },
    { id: "p9", name: "11H Müdafiəçi", number: 5, pos: "DF", x: 74, y: 75, rating: 6.5 },
    { id: "p10", name: "Murad Əhmədzadə", number: 17, pos: "MF", x: 63, y: 35, rating: 7.5, goals: 2, assists: 1 },
    { id: "p11", name: "11H Yarımmüdafiə", number: 8, pos: "MF", x: 63, y: 65, rating: 6.8 },
    { id: "p12", name: "Şahbaz Şahbazlı", number: 13, pos: "FW", x: 55, y: 50, rating: 7.8, goals: 2, assists: 1 }
  ],
  shots: [
    { id: "s1", minute: "00:17", team: "10A", player: "Murad Abdullayev", number: 9, outcome: "missed", xg: 0.05, xgot: null, situation: "Açıq Oyun", shotType: "Sol Ayaq", goalZone: "Sağ Dirəyin Yanı", pitchX: 68, pitchY: 72, goalX: 115, goalY: 42, desc: "Cərimə meydançasından kənardan zərbə, qapının sağından kənar getdi." },
    { id: "s2", minute: "00:40", team: "10A", player: "Fərid Əhmədli", number: 10, outcome: "blocked", xg: 0.15, xgot: null, situation: "Ötürmə ilə", shotType: "Sağ Ayaq", goalZone: "Müdafiəçi Bloku", pitchX: 42, pitchY: 45, goalX: 48, goalY: 65, desc: "Cərimə meydançasının içindən zərbə, müdafiəçi tərəfindən bloklandı." },
    { id: "s3", minute: "01:00", team: "11H", player: "Şahbaz Şahbazlı", number: 13, outcome: "missed", xg: 0.08, xgot: null, situation: "Əks-hücum", shotType: "Sağ Ayaq", goalZone: "Sol Dirəyin Yanı", pitchX: 32, pitchY: 68, goalX: -15, goalY: 48, desc: "Uzaq məsafədən qapıya zərbə, sol dirəyin yanından auta getdi." },
    { id: "s4", minute: "01:25", team: "11H", player: "Şahbaz Şahbazlı", number: 13, outcome: "saved", xg: 0.15, xgot: 0.30, situation: "Açıq Oyun", shotType: "Sağ Ayaq", goalZone: "Aşağı Sağ Künc", pitchX: 55, pitchY: 38, goalX: 78, goalY: 82, desc: "Qapıçı seyv etdi - aşağı küncə yönələn təhlükəli zərbə." },
    { id: "s5", minute: "01:34", team: "10A", player: "Murad Abdullayev", number: 9, outcome: "saved", xg: 0.25, xgot: 0.45, situation: "Açıq Oyun", shotType: "Sol Ayaq", goalZone: "Qapıçı Qurtarışı", pitchX: 48, pitchY: 32, goalX: 44, goalY: 55, desc: "11H qapıçısının möhtəşəm reaksiyası və qurtarışı." },
    { id: "s6", minute: "01:49", team: "10A", player: "Fərid Əhmədli", number: 10, outcome: "saved", xg: 0.08, xgot: 0.25, situation: "Açıq Oyun", shotType: "Sağ Ayaq", goalZone: "Aşağı Mərkəz", pitchX: 52, pitchY: 58, goalX: 52, goalY: 80, desc: "Yerdən sürətli zərbə, qapıçı son anda tutdu." },
    { id: "s7", minute: "03:35", team: "10A", player: "Murad Abdullayev", number: 9, outcome: "goal", xg: 0.38, xgot: 0.95, situation: "Ötürmə ilə", shotType: "Sol Ayaq", goalZone: "Yuxarı Sol (90-a)", pitchX: 38, pitchY: 42, goalX: 20, goalY: 22, desc: "⚽ QOL! Murad Abdullayevin cərimə meydançasının solundan sol 90-a zərbəsi! (1-0)" },
    { id: "s8", minute: "04:10", team: "10A", player: "Murad Abdullayev", number: 9, outcome: "saved", xg: 0.30, xgot: 0.50, situation: "Açıq Oyun", shotType: "Sağ Ayaq", goalZone: "Sağ Künc", pitchX: 62, pitchY: 36, goalX: 82, goalY: 75, desc: "11H qapıçısı qapının sağ küncündən topu kənarlaşdırdı." },
    { id: "s9", minute: "04:40", team: "11H", player: "Şahbaz Şahbazlı", number: 13, outcome: "goal", xg: 0.45, xgot: 0.88, situation: "Əks-hücum", shotType: "Sağ Ayaq", goalZone: "Aşağı Sağ Künc", pitchX: 65, pitchY: 35, goalX: 84, goalY: 82, desc: "⚽ QOL! Şahbaz Şahbazlının sürətli əks-hücumdan bərabərlik qolu! (1-1)" },
    { id: "s10", minute: "05:15", team: "10A", player: "Fərid Əhmədli", number: 10, outcome: "goal", xg: 0.42, xgot: 0.92, situation: "Açıq Oyun", shotType: "Sağ Ayaq", goalZone: "Yuxarı Sağ (90-a)", pitchX: 58, pitchY: 48, goalX: 82, goalY: 24, desc: "⚽ QOL! Fərid Əhmədlinin mükəmməl uzaq məsafəli doxsanlığa zərbəsi! (2-1)" },
    { id: "s11", minute: "06:05", team: "11H", player: "Murad Əhmədzadə", number: 17, outcome: "goal", xg: 0.35, xgot: 0.85, situation: "Açıq Oyun", shotType: "Sol Ayaq", goalZone: "Aşağı Sol Künc", pitchX: 35, pitchY: 40, goalX: 22, goalY: 85, desc: "⚽ QOL! Murad Əhmədzadədən yaxın dirəyə kəsici zərbə! (2-2)" },
    { id: "s12", minute: "07:00", team: "11H", player: "Şahbaz Şahbazlı", number: 13, outcome: "goal", xg: 0.79, xgot: 0.96, situation: "Penalti", shotType: "Sağ Ayaq", goalZone: "Yuxarı Mərkəz", pitchX: 50, pitchY: 30, goalX: 50, goalY: 28, desc: "⚽ QOL! Dəqiq penalti zərbəsi qapının tavanına! (2-3)" },
    { id: "s13", minute: "08:20", team: "10A", player: "Murad Abdullayev", number: 9, outcome: "goal", xg: 0.52, xgot: 0.94, situation: "Ötürmə ilə", shotType: "Başla", goalZone: "Aşağı Sol Künc", pitchX: 45, pitchY: 22, goalX: 25, goalY: 82, desc: "⚽ QOL! Fəridin ötürməsindən sonra Murad başla qapıya göndərdi! (3-3)" },
    { id: "s14", minute: "09:45", team: "10A", player: "Fərid Əhmədli", number: 10, outcome: "goal", xg: 0.35, xgot: 0.89, situation: "Açıq Oyun", shotType: "Sağ Ayaq", goalZone: "Aşağı Sağ Künc", pitchX: 62, pitchY: 44, goalX: 80, goalY: 80, desc: "⚽ QOL! Fərid Əhmədli komandasını yenidən önə çıxarır! (4-3)" },
    { id: "s15", minute: "10:30", team: "11H", player: "Murad Əhmədzadə", number: 17, outcome: "goal", xg: 0.40, xgot: 0.87, situation: "Ötürmə ilə", shotType: "Sağ Ayaq", goalZone: "Aşağı Mərkəz", pitchX: 48, pitchY: 34, goalX: 46, goalY: 78, desc: "⚽ QOL! 11H heç-heçəni bərpa edir, 4-4!" },
    { id: "s16", minute: "11:00", team: "10A", player: "Murad Abdullayev", number: 9, outcome: "goal", xg: 0.65, xgot: 0.98, situation: "Açıq Oyun", shotType: "Sol Ayaq", goalZone: "Yuxarı Sağ (90-a)", pitchX: 44, pitchY: 28, goalX: 84, goalY: 20, desc: "⚽ QOL! Het-trik! Murad Abdullayevin qələbə gətirən möhtəşəm 5-ci qolu! (5-4)" },
    { id: "s17", minute: "12:10", team: "10A", player: "Ahmadzada", number: 7, outcome: "missed", xg: 0.07, xgot: null, situation: "Açıq Oyun", shotType: "Sağ Ayaq", goalZone: "Üst Dirəkdən Yuxarı", pitchX: 52, pitchY: 62, goalX: 54, goalY: -15, desc: "Zərbə qapı tirinin üstündən yüksək getdi." },
    { id: "s18", minute: "12:47", team: "10A", player: "Ahmadzada", number: 7, outcome: "blocked", xg: 0.12, xgot: null, situation: "Ötürmə ilə", shotType: "Sol Ayaq", goalZone: "Müdafiəçi Bloku", pitchX: 42, pitchY: 36, goalX: 50, goalY: 60, desc: "Müdafiəçi cərimə meydançasında fədakarlıqla zərbənin qabağını kəsdi." }
  ]
};

/**
 * İstənilən digər matç üçün avtomatlaşdırılmış realistik Sofascore analitikasını generasiya edir
 */
export function getMatchAnalytics(match, allPlayers = []) {
  if (!match) return null;
  
  if (match.id === 'm_22_17' || (match.teamA === '10A' && match.teamB === '11H' && match.year === '2022-2023')) {
    return MATCH_10A_VS_11H_ANALYTICS;
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
    { id: `${match.id}_a1`, name: teamAPlayers[0]?.name || `${match.teamA} Qapıçı`, number: 1, pos: 'GK', x: 14, y: 50, rating: Number((6.5 + (scoreB === 0 ? 1.5 : Math.max(0, 1 - scoreB * 0.2))).toFixed(1)), isKeeper: true },
    { id: `${match.id}_a2`, name: teamAPlayers[1]?.name || `${match.teamA} Müdafiə`, number: 3, pos: 'DF', x: 26, y: 25, rating: Number((6.6 + (scoreA > scoreB ? 0.6 : 0)).toFixed(1)) },
    { id: `${match.id}_a3`, name: teamAPlayers[2]?.name || `${match.teamA} Müdafiə`, number: 4, pos: 'DF', x: 26, y: 75, rating: Number((6.7 + (scoreA > scoreB ? 0.5 : 0)).toFixed(1)) },
    { id: `${match.id}_a4`, name: teamAPlayers[3]?.name || `${match.teamA} Yarımmüdafiə`, number: 8, pos: 'MF', x: 37, y: 35, rating: Number((7.0 + scoreA * 0.3).toFixed(1)) },
    { id: `${match.id}_a5`, name: teamAPlayers[4]?.name || `${match.teamA} Yarımmüdafiə`, number: 10, pos: 'MF', x: 37, y: 65, rating: Number((7.2 + scoreA * 0.3).toFixed(1)) },
    { id: `${match.id}_a6`, name: teamAPlayers[5]?.name || `${match.teamA} Hücumçu`, number: 9, pos: 'FW', x: 45, y: 50, rating: Number((7.5 + scoreA * 0.4).toFixed(1)), goals: scoreA }
  ];

  const lineupB = [
    { id: `${match.id}_b1`, name: teamBPlayers[0]?.name || `${match.teamB} Qapıçı`, number: 1, pos: 'GK', x: 86, y: 50, rating: Number((6.5 + (scoreA === 0 ? 1.5 : Math.max(0, 1 - scoreA * 0.2))).toFixed(1)), isKeeper: true },
    { id: `${match.id}_b2`, name: teamBPlayers[1]?.name || `${match.teamB} Müdafiə`, number: 4, pos: 'DF', x: 74, y: 25, rating: Number((6.6 + (scoreB > scoreA ? 0.6 : 0)).toFixed(1)) },
    { id: `${match.id}_b3`, name: teamBPlayers[2]?.name || `${match.teamB} Müdafiə`, number: 5, pos: 'DF', x: 74, y: 75, rating: Number((6.7 + (scoreB > scoreA ? 0.5 : 0)).toFixed(1)) },
    { id: `${match.id}_b4`, name: teamBPlayers[3]?.name || `${match.teamB} Yarımmüdafiə`, number: 7, pos: 'MF', x: 63, y: 35, rating: Number((7.0 + scoreB * 0.3).toFixed(1)) },
    { id: `${match.id}_b5`, name: teamBPlayers[4]?.name || `${match.teamB} Yarımmüdafiə`, number: 11, pos: 'MF', x: 63, y: 65, rating: Number((7.1 + scoreB * 0.3).toFixed(1)) },
    { id: `${match.id}_b6`, name: teamBPlayers[5]?.name || `${match.teamB} Hücumçu`, number: 13, pos: 'FW', x: 55, y: 50, rating: Number((7.4 + scoreB * 0.4).toFixed(1)), goals: scoreB }
  ];

  const shots = [];
  let sId = 1;
  for (let i = 0; i < scoreA; i++) {
    shots.push({
      id: `gen_shot_a_${sId++}`,
      minute: `0${(i + 1) * 3 + 1}:00`,
      team: match.teamA,
      player: lineupA[5].name,
      number: 9,
      outcome: 'goal',
      xg: 0.42,
      xgot: 0.91,
      situation: i % 2 === 0 ? 'Ötürmə ilə' : 'Açıq Oyun',
      shotType: i % 2 === 0 ? 'Sağ Ayaq' : 'Sol Ayaq',
      goalZone: i % 2 === 0 ? 'Yuxarı Sağ (90-a)' : 'Aşağı Sol Künc',
      pitchX: 40 + (i * 12) % 25,
      pitchY: 35 + (i * 8) % 20,
      goalX: i % 2 === 0 ? 82 : 22,
      goalY: i % 2 === 0 ? 25 : 78,
      desc: `⚽ QOL! ${match.teamA} komandasından dəqiq zərbə!`
    });
  }
  for (let i = 0; i < scoreB; i++) {
    shots.push({
      id: `gen_shot_b_${sId++}`,
      minute: `0${(i + 1) * 3 + 2}:00`,
      team: match.teamB,
      player: lineupB[5].name,
      number: 13,
      outcome: 'goal',
      xg: 0.39,
      xgot: 0.88,
      situation: 'Açıq Oyun',
      shotType: 'Sağ Ayaq',
      goalZone: 'Yuxarı Sol (90-a)',
      pitchX: 60 - (i * 10) % 20,
      pitchY: 38 + (i * 7) % 20,
      goalX: 25,
      goalY: 28,
      desc: `⚽ QOL! ${match.teamB} komandasından cavab qolu!`
    });
  }

  shots.push({
    id: `gen_shot_save_${sId++}`,
    minute: "14:20",
    team: match.teamA,
    player: lineupA[4].name,
    number: 10,
    outcome: 'saved',
    xg: 0.22,
    xgot: 0.45,
    situation: 'Açıq Oyun',
    shotType: 'Sağ Ayaq',
    goalZone: 'Qapıçı Qurtarışı',
    pitchX: 48,
    pitchY: 42,
    goalX: 52,
    goalY: 55,
    desc: "Qapıçıdan kritik qurtarış!"
  });

  return {
    matchId: match.id,
    teamA: match.teamA,
    teamB: match.teamB,
    scoreA,
    scoreB,
    stats: {
      distanceCoveredA: "91.2 km",
      distanceCoveredB: "90.8 km",
      xgA,
      xgB,
      xgotA: Number((xgA * 1.2).toFixed(2)),
      xgotB: Number((xgB * 1.2).toFixed(2)),
      bigChancesA: Math.max(scoreA, 3),
      bigChancesB: Math.max(scoreB, 2),
      totalShotsA,
      totalShotsB,
      shotsOnTargetA,
      shotsOnTargetB,
      gkSavesA: Math.max(0, shotsOnTargetB - scoreB),
      gkSavesB: Math.max(0, shotsOnTargetA - scoreA),
      sprintsA: 78,
      sprintsB: 72,
      cornersA: 4,
      cornersB: 3,
      foulsA: 6,
      foulsB: 5,
      passesA: 320,
      passesB: 290,
      tacklesA: 14,
      tacklesB: 12,
      freeKicksA: 5,
      freeKicksB: 6,
      possessionA: scoreA >= scoreB ? 53 : 47,
      possessionB: scoreA >= scoreB ? 47 : 53
    },
    lineupA,
    lineupB,
    shots
  };
}
