/**
 * ============================================================================
 * FAYL ADI: services/matchAnalyticsData.js
 * MƏQSƏDİ: Oyunların Sofascore-tipli Dərin Statistikası, Zərbə Xəritəsi (Shotmap),
 *          Qapı POV-u (Goalmouth POV), 5v5 Minifutbol Heyətləri və
 *          Termal İstilik Xəritəsi (High-Definition Heatmap & Tactical Zones).
 * ============================================================================
 */

// 10A vs 11H (01.06.2023) - 32 dəqiqəlik videonun tam multimodal analizi (5v5 Minifutbol)
export const MATCH_10A_VS_11H_ANALYTICS = {
  matchId: "m_22_17",
  teamA: "10A",
  teamB: "11H",
  scoreA: 5,
  scoreB: 4,
  format: "5v5", // Official 5v5 Minifootball format (1 GK + 4 Outfield)
  pitchDimensions: "40m × 20m",
  stats: {
    distanceCoveredA: "13.4 km",
    distanceCoveredB: "12.8 km",
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
    sprintsA: 54,
    sprintsB: 47,
    cornersA: 5,
    cornersB: 4,
    foulsA: 11,
    foulsB: 5,
    passesA: 215,
    passesB: 168,
    passAccuracyA: 82,
    passAccuracyB: 74,
    tacklesA: 14,
    tacklesB: 21,
    freeKicksA: 5,
    freeKicksB: 11,
    possessionA: 55,
    possessionB: 45
  },
  // 5v5 Minifootball Starting 5 (1-2-1 Diamond / Romb Formasiyası)
  lineupA: [
    { id: "p1", name: "10A Qapıçı", number: 1, pos: "GK", roleName: "Qapıçı", x: 14, y: 50, rating: 6.8, isKeeper: true },
    { id: "p2", name: "Amin İsmayılov", number: 4, pos: "DF", roleName: "Son Adam (Fix)", x: 26, y: 50, rating: 7.5, assists: 1 },
    { id: "p3", name: "Məmmədi", number: 3, pos: "MF", roleName: "Sol Cinah (Ala)", x: 37, y: 25, rating: 6.5 },
    { id: "p4", name: "Fərid Əhmədli", number: 10, pos: "MF", roleName: "Sağ Cinah / Pleymeyker", x: 37, y: 75, rating: 8.5, goals: 2, assists: 2, redCard: "17'" },
    { id: "p5", name: "Murad Abdullayev", number: 9, pos: "FW", roleName: "Mərkəz Hücumçu (Pivot)", x: 46, y: 50, rating: 9.0, goals: 3, assists: 1, isMvp: true }
  ],
  benchA: [
    { id: "p6", name: "Ağacan", number: 11, pos: "SUB", roleName: "Ehtiyat Yarımmüdafiə", rating: 7.0 }
  ],
  // 11H Starting 5 (1-2-1 Diamond / Romb Formasiyası)
  lineupB: [
    { id: "p7", name: "11H Qapıçısı", number: 1, pos: "GK", roleName: "Qapıçı", x: 86, y: 50, rating: 8.5, isKeeper: true, saves: 6 },
    { id: "p8", name: "11H Müdafiəçi", number: 4, pos: "DF", roleName: "Son Adam (Fix)", x: 74, y: 50, rating: 6.5 },
    { id: "p9", name: "Murad Əhmədzadə", number: 17, pos: "MF", roleName: "Sol Cinah (Ala)", x: 63, y: 25, rating: 7.5, goals: 2, assists: 1 },
    { id: "p10", name: "11H Yarımmüdafiə", number: 8, pos: "MF", roleName: "Sağ Cinah (Ala)", x: 63, y: 75, rating: 6.8 },
    { id: "p11", name: "Şahbaz Şahbazlı", number: 13, pos: "FW", roleName: "Mərkəz Hücumçu (Pivot)", x: 54, y: 50, rating: 7.8, goals: 2, assists: 1 }
  ],
  benchB: [
    { id: "p12", name: "11H Ehtiyat", number: 5, pos: "SUB", roleName: "Ehtiyat Müdafiə", rating: 6.4 }
  ],
  // Yüksək Dəqiqlikli 5v5 Termal İstilik Xəritəsi Məlumatları (HD Heatmap)
  heatmapData: {
    // 10A hücum sıxlığı (əsasən rəqib qapısı və cinahlar)
    teamA: [
      { x: 82, y: 48, intensity: 0.95, radius: 46 }, // 11H qapı önü təzyiq mərkəzi
      { x: 76, y: 32, intensity: 0.85, radius: 40 }, // Sol cinahdan qapıya kəsmələr (Murad)
      { x: 78, y: 70, intensity: 0.80, radius: 38 }, // Sağ cinahdan Fəridin uzaq zərbə zonası
      { x: 64, y: 50, intensity: 0.75, radius: 42 }, // Mərkəz hücum yaradıcılığı
      { x: 52, y: 30, intensity: 0.65, radius: 36 }, // Sol orta xətt keçidi
      { x: 55, y: 72, intensity: 0.70, radius: 36 }, // Sağ orta xətt
      { x: 38, y: 50, intensity: 0.55, radius: 34 }, // Müdafiə və paylama nöqtəsi (Amin)
      { x: 18, y: 50, intensity: 0.40, radius: 28 }, // 10A qapıçı sərbəst zərbə başlanğıcı
    ],
    // 11H əks-hücum sıxlığı (sürətli çıxışlar və qol epizodları)
    teamB: [
      { x: 22, y: 48, intensity: 0.90, radius: 44 }, // 10A qapısı qarşısında zərbə zonası (Şahbazlı)
      { x: 26, y: 68, intensity: 0.80, radius: 38 }, // Sağ küncdən zərbələr
      { x: 32, y: 32, intensity: 0.75, radius: 36 }, // Sol cinah Murad Əhmədzadə reydləri
      { x: 44, y: 50, intensity: 0.60, radius: 38 }, // Mərkəz presinq və top qazanma
      { x: 68, y: 48, intensity: 0.85, radius: 42 }, // Müdafiə bloku və seyvlər
      { x: 82, y: 50, intensity: 0.92, radius: 40 }, // 11H qapıçısının aktiv seyv sahəsi
    ],
    // Hər oyunçunun fərdi 5v5 hərəkət və topla təmas koordinatları
    playerHeatmaps: {
      "Murad Abdullayev": {
        role: "Mərkəz Hücumçu (Pivot)",
        team: "10A",
        touches: 52,
        dominantZone: "Rəqib Cərimə Meydançası & Sol Qanad",
        duelsWon: "8/11 (73%)",
        maxSpeed: "27.4 km/s",
        passAcc: "79%",
        points: [
          { x: 82, y: 45, intensity: 0.98, radius: 40 },
          { x: 74, y: 35, intensity: 0.88, radius: 36 },
          { x: 68, y: 55, intensity: 0.72, radius: 32 },
          { x: 55, y: 40, intensity: 0.50, radius: 26 }
        ]
      },
      "Fərid Əhmədli": {
        role: "Sağ Cinah / Pleymeyker",
        team: "10A",
        touches: 64,
        dominantZone: "Sağ Cinah & 90-a Zərbə Trayektoriyası",
        duelsWon: "7/9 (78%)",
        maxSpeed: "26.8 km/s",
        passAcc: "86%",
        points: [
          { x: 76, y: 72, intensity: 0.94, radius: 38 },
          { x: 62, y: 68, intensity: 0.85, radius: 36 },
          { x: 52, y: 55, intensity: 0.75, radius: 34 },
          { x: 42, y: 62, intensity: 0.60, radius: 30 }
        ]
      },
      "Amin İsmayılov": {
        role: "Son Adam (Fix / Müdafiəçi)",
        team: "10A",
        touches: 44,
        dominantZone: "Mərkəz Müdafiə & Qurtarış Xətti",
        duelsWon: "9/10 (90%)",
        maxSpeed: "24.9 km/s",
        passAcc: "91%",
        points: [
          { x: 30, y: 50, intensity: 0.92, radius: 36 },
          { x: 40, y: 45, intensity: 0.78, radius: 32 },
          { x: 42, y: 60, intensity: 0.70, radius: 30 },
          { x: 22, y: 50, intensity: 0.65, radius: 28 }
        ]
      },
      "Məmmədi": {
        role: "Sol Cinah (Ala)",
        team: "10A",
        touches: 38,
        dominantZone: "Sol Yan Xətt & Presinq",
        duelsWon: "5/8 (63%)",
        maxSpeed: "26.1 km/s",
        passAcc: "76%",
        points: [
          { x: 55, y: 24, intensity: 0.88, radius: 34 },
          { x: 68, y: 28, intensity: 0.78, radius: 32 },
          { x: 42, y: 22, intensity: 0.65, radius: 28 }
        ]
      },
      "10A Qapıçı": {
        role: "Qapıçı (GK)",
        team: "10A",
        touches: 24,
        dominantZone: "6-metrlik D-Qövsü & Qapı Xətti",
        duelsWon: "3/3 (100%)",
        maxSpeed: "18.2 km/s",
        passAcc: "85%",
        points: [
          { x: 14, y: 50, intensity: 0.95, radius: 32 },
          { x: 18, y: 44, intensity: 0.60, radius: 24 },
          { x: 18, y: 56, intensity: 0.60, radius: 24 }
        ]
      },
      "Şahbaz Şahbazlı": {
        role: "Mərkəz Hücumçu (Pivot)",
        team: "11H",
        touches: 49,
        dominantZone: "10A Cərimə Meydançası & Penalti Nöqtəsi",
        duelsWon: "7/10 (70%)",
        maxSpeed: "28.1 km/s",
        passAcc: "72%",
        points: [
          { x: 24, y: 52, intensity: 0.96, radius: 40 },
          { x: 34, y: 62, intensity: 0.82, radius: 34 },
          { x: 45, y: 48, intensity: 0.65, radius: 30 }
        ]
      },
      "Murad Əhmədzadə": {
        role: "Sol Cinah (Ala)",
        team: "11H",
        touches: 42,
        dominantZone: "Sol Cinah & Cərimə Meydançasına Giriş",
        duelsWon: "6/9 (67%)",
        maxSpeed: "27.0 km/s",
        passAcc: "78%",
        points: [
          { x: 30, y: 32, intensity: 0.90, radius: 36 },
          { x: 45, y: 26, intensity: 0.78, radius: 32 },
          { x: 58, y: 28, intensity: 0.62, radius: 28 }
        ]
      },
      "11H Qapıçısı": {
        role: "Qapıçı (GK - Matçın Ən Yaxşı Qapıçısı)",
        team: "11H",
        touches: 52,
        dominantZone: "Qapı Xətti & 6 Seyv Nöqtəsi",
        duelsWon: "6/6 (100%)",
        maxSpeed: "19.5 km/s",
        passAcc: "81%",
        points: [
          { x: 86, y: 50, intensity: 0.99, radius: 36 },
          { x: 82, y: 42, intensity: 0.85, radius: 30 },
          { x: 82, y: 58, intensity: 0.85, radius: 30 },
          { x: 78, y: 50, intensity: 0.65, radius: 26 }
        ]
      },
      "11H Müdafiəçi": {
        role: "Son Adam (Fix / Müdafiəçi)",
        team: "11H",
        touches: 40,
        dominantZone: "Qapı Qarşısı Blok Zonası",
        duelsWon: "8/12 (67%)",
        maxSpeed: "24.5 km/s",
        passAcc: "84%",
        points: [
          { x: 72, y: 50, intensity: 0.90, radius: 36 },
          { x: 65, y: 45, intensity: 0.75, radius: 32 },
          { x: 65, y: 58, intensity: 0.70, radius: 30 }
        ]
      },
      "11H Yarımmüdafiə": {
        role: "Sağ Cinah (Ala)",
        team: "11H",
        touches: 35,
        dominantZone: "Sağ Cinah Keçidləri",
        duelsWon: "5/8 (63%)",
        maxSpeed: "25.8 km/s",
        passAcc: "77%",
        points: [
          { x: 48, y: 72, intensity: 0.80, radius: 32 },
          { x: 60, y: 74, intensity: 0.74, radius: 30 },
          { x: 38, y: 68, intensity: 0.62, radius: 28 }
        ]
      }
    },
    // Taktiki Zona Statistikası (Flank and Thirds distribution)
    tacticalZones: {
      flanksA: { left: 34, center: 48, right: 18 },
      flanksB: { left: 45, center: 36, right: 19 },
      thirdsA: { def: 20, mid: 42, att: 38 },
      thirdsB: { def: 42, mid: 36, att: 22 },
      touchesA: 312,
      touchesB: 254
    }
  },
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
 * İstənilən digər matç üçün avtomatlaşdırılmış realistik 5v5 Sofascore analitikasını generasiya edir
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

  // 5v5 Formasiyası (1 GK + 4 Outfield)
  const lineupA = [
    { id: `${match.id}_a1`, name: teamAPlayers[0]?.name || `${match.teamA} Qapıçı`, number: 1, pos: 'GK', roleName: 'Qapıçı', x: 14, y: 50, rating: Number((6.5 + (scoreB === 0 ? 1.5 : Math.max(0, 1 - scoreB * 0.2))).toFixed(1)), isKeeper: true },
    { id: `${match.id}_a2`, name: teamAPlayers[1]?.name || `${match.teamA} Müdafiə`, number: 4, pos: 'DF', roleName: 'Son Adam (Fix)', x: 26, y: 50, rating: Number((6.6 + (scoreA > scoreB ? 0.6 : 0)).toFixed(1)) },
    { id: `${match.id}_a3`, name: teamAPlayers[2]?.name || `${match.teamA} Sol Qanad`, number: 3, pos: 'MF', roleName: 'Sol Cinah (Ala)', x: 37, y: 25, rating: Number((6.7 + (scoreA > scoreB ? 0.5 : 0)).toFixed(1)) },
    { id: `${match.id}_a4`, name: teamAPlayers[3]?.name || `${match.teamA} Sağ Qanad`, number: 10, pos: 'MF', roleName: 'Sağ Cinah / Pleymeyker', x: 37, y: 75, rating: Number((7.0 + scoreA * 0.3).toFixed(1)) },
    { id: `${match.id}_a5`, name: teamAPlayers[4]?.name || `${match.teamA} Hücumçu`, number: 9, pos: 'FW', roleName: 'Mərkəz Hücumçu (Pivot)', x: 46, y: 50, rating: Number((7.5 + scoreA * 0.4).toFixed(1)), goals: scoreA }
  ];

  const benchA = teamAPlayers.slice(5, 8).map((p, idx) => ({
    id: `${match.id}_a_sub_${idx}`,
    name: p.name,
    number: 11 + idx,
    pos: 'SUB',
    roleName: 'Ehtiyat Oyunçu',
    rating: Number((6.2 + Math.random() * 0.8).toFixed(1))
  }));

  const lineupB = [
    { id: `${match.id}_b1`, name: teamBPlayers[0]?.name || `${match.teamB} Qapıçı`, number: 1, pos: 'GK', roleName: 'Qapıçı', x: 86, y: 50, rating: Number((6.5 + (scoreA === 0 ? 1.5 : Math.max(0, 1 - scoreA * 0.2))).toFixed(1)), isKeeper: true },
    { id: `${match.id}_b2`, name: teamBPlayers[1]?.name || `${match.teamB} Müdafiə`, number: 4, pos: 'DF', roleName: 'Son Adam (Fix)', x: 74, y: 50, rating: Number((6.6 + (scoreB > scoreA ? 0.6 : 0)).toFixed(1)) },
    { id: `${match.id}_b3`, name: teamBPlayers[2]?.name || `${match.teamB} Sol Qanad`, number: 17, pos: 'MF', roleName: 'Sol Cinah (Ala)', x: 63, y: 25, rating: Number((6.7 + (scoreB > scoreA ? 0.5 : 0)).toFixed(1)) },
    { id: `${match.id}_b4`, name: teamBPlayers[3]?.name || `${match.teamB} Sağ Qanad`, number: 8, pos: 'MF', roleName: 'Sağ Cinah (Ala)', x: 63, y: 75, rating: Number((7.0 + scoreB * 0.3).toFixed(1)) },
    { id: `${match.id}_b5`, name: teamBPlayers[4]?.name || `${match.teamB} Hücumçu`, number: 13, pos: 'FW', roleName: 'Mərkəz Hücumçu (Pivot)', x: 54, y: 50, rating: Number((7.4 + scoreB * 0.4).toFixed(1)), goals: scoreB }
  ];

  const benchB = teamBPlayers.slice(5, 8).map((p, idx) => ({
    id: `${match.id}_b_sub_${idx}`,
    name: p.name,
    number: 14 + idx,
    pos: 'SUB',
    roleName: 'Ehtiyat Oyunçu',
    rating: Number((6.2 + Math.random() * 0.8).toFixed(1))
  }));

  // Heatmap Data for generated matches
  const heatmapData = {
    teamA: [
      { x: 80, y: 48, intensity: scoreA >= scoreB ? 0.92 : 0.78, radius: 42 },
      { x: 72, y: 30, intensity: 0.82, radius: 36 },
      { x: 74, y: 72, intensity: 0.76, radius: 36 },
      { x: 60, y: 50, intensity: 0.70, radius: 38 },
      { x: 45, y: 45, intensity: 0.55, radius: 32 },
      { x: 20, y: 50, intensity: 0.38, radius: 26 },
    ],
    teamB: [
      { x: 20, y: 50, intensity: scoreB >= scoreA ? 0.92 : 0.78, radius: 42 },
      { x: 28, y: 70, intensity: 0.80, radius: 36 },
      { x: 30, y: 30, intensity: 0.75, radius: 36 },
      { x: 48, y: 50, intensity: 0.62, radius: 38 },
      { x: 70, y: 50, intensity: 0.75, radius: 34 },
      { x: 84, y: 50, intensity: 0.88, radius: 36 },
    ],
    playerHeatmaps: {},
    tacticalZones: {
      flanksA: { left: 32 + (scoreA % 5), center: 46, right: 22 - (scoreA % 5) },
      flanksB: { left: 40, center: 38, right: 22 },
      thirdsA: { def: 22, mid: 42, att: 36 },
      thirdsB: { def: 38, mid: 38, att: 24 },
      touchesA: 260 + scoreA * 20,
      touchesB: 240 + scoreB * 20
    }
  };

  // Add individual player heatmaps for starting 5
  lineupA.forEach((p) => {
    heatmapData.playerHeatmaps[p.name] = {
      role: p.roleName,
      team: match.teamA,
      touches: p.pos === 'GK' ? 22 : p.pos === 'FW' ? 44 : 52,
      dominantZone: p.pos === 'GK' ? '6m Cərimə Qövsü' : p.pos === 'FW' ? 'Rəqib Cərimə Sahəsi' : 'Orta Sahə və Cinah',
      duelsWon: '7/10 (70%)',
      maxSpeed: `${(23.5 + Math.random() * 4).toFixed(1)} km/s`,
      passAcc: `${Math.round(75 + Math.random() * 18)}%`,
      points: [
        { x: p.x + 30, y: p.y, intensity: 0.90, radius: 36 },
        { x: p.x + 15, y: p.y - 10, intensity: 0.70, radius: 28 },
        { x: p.x + 15, y: p.y + 10, intensity: 0.65, radius: 28 }
      ]
    };
  });

  lineupB.forEach((p) => {
    heatmapData.playerHeatmaps[p.name] = {
      role: p.roleName,
      team: match.teamB,
      touches: p.pos === 'GK' ? 24 : p.pos === 'FW' ? 42 : 48,
      dominantZone: p.pos === 'GK' ? '6m Cərimə Qövsü' : p.pos === 'FW' ? 'Rəqib Qapı Önü' : 'Orta Sahə və Müdafiə',
      duelsWon: '6/9 (67%)',
      maxSpeed: `${(23.5 + Math.random() * 4).toFixed(1)} km/s`,
      passAcc: `${Math.round(72 + Math.random() * 18)}%`,
      points: [
        { x: p.x - 30, y: p.y, intensity: 0.90, radius: 36 },
        { x: p.x - 15, y: p.y - 10, intensity: 0.70, radius: 28 },
        { x: p.x - 15, y: p.y + 10, intensity: 0.65, radius: 28 }
      ]
    };
  });

  const shots = [];
  let sId = 1;
  for (let i = 0; i < scoreA; i++) {
    shots.push({
      id: `gen_shot_a_${sId++}`,
      minute: `0${(i + 1) * 3 + 1}:00`,
      team: match.teamA,
      player: lineupA[4].name,
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
      player: lineupB[4].name,
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
    player: lineupA[3].name,
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
    format: "5v5",
    pitchDimensions: "40m × 20m",
    stats: {
      distanceCoveredA: `${(12.5 + scoreA * 0.2).toFixed(1)} km`,
      distanceCoveredB: `${(12.2 + scoreB * 0.2).toFixed(1)} km`,
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
      sprintsA: 45 + scoreA * 3,
      sprintsB: 42 + scoreB * 3,
      cornersA: 4,
      cornersB: 3,
      foulsA: 6,
      foulsB: 5,
      passesA: 180 + scoreA * 10,
      passesB: 165 + scoreB * 10,
      tacklesA: 14,
      tacklesB: 12,
      freeKicksA: 5,
      freeKicksB: 6,
      possessionA: scoreA >= scoreB ? 53 : 47,
      possessionB: scoreA >= scoreB ? 47 : 53
    },
    lineupA,
    benchA,
    lineupB,
    benchB,
    heatmapData,
    shots
  };
}
