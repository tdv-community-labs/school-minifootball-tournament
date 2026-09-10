/**
 * ============================================================================
 * FAYL ADI: services/selfHealing.js
 * MƏQSƏDİ: Məlumat Bütövlüyü Yoxlanışı (Audit) və Avtomatik Bərpa Mühərriki
 * 
 * BU MODULUN VƏZİFƏLƏRİ:
 *   1. auditTournamentData(): Bütün turnir bazasını deterministik testlərdən keçirərək
 *      dublikat profilləri, təkrar matçları, mənfi hesabları və kateqoriya xətalarını aşkar edir.
 *   2. repairTournamentData(): Tapılan bütün struktur uyğunsuzluqlarını avtomatik düzəldir,
 *      dublikatları birləşdirir və cədvəli yenidən hesablayır.
 *   3. startBackgroundSelfHealing(): Sayt açıldıqda arxa planda səssiz yoxlama aparır.
 * 
 * İSTİFADƏ EDİLDİYİ YERLƏR:
 *   - services/database.js (ilkin yükləmə zamanı arxa plan yoxlaması)
 *   - components/AdminDashboard.js (Sistem Sağlamlığı paneli və Bərpa düyməsi)
 * ============================================================================
 */
import { db, recalculateData, normalizePlayerName, OBSOLETE_PLAYER_IDS, getMatchSemanticKey, deduplicateMatches } from './database.js';
import { isMatchDivision, getDivisionsForYear } from './i18n.js';
import { ARCHIVE_CLASSES, ARCHIVE_MATCHES, ARCHIVE_PLAYERS, ARCHIVE_YEARS } from './archiveData.js';

/**
 * Run a comprehensive deterministic health audit on tournament data
 * @param {Object} data { classes, players, matches, years, standings }
 * @returns {Object} Diagnostic report with health score and actionable issues
 */
export const auditTournamentData = (data = {}) => {
  const classes = data.classes || JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
  const players = data.players || JSON.parse(localStorage.getItem('minifootball_players') || '[]');
  const matches = data.matches || JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
  const years = data.years || JSON.parse(localStorage.getItem('minifootball_years') || '[]');

  const issues = [];
  const validDivisions = ['6', '7-8', '9', '9-10', '10-11', '11', '9-10-11'];

  // 1. Check for duplicate player profiles
  const playerGroupMap = new Map();
  players.forEach(p => {
    if (p.isOwnGoal || /avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || '')) {
      issues.push({
        id: `own_goal_player_${p.id}`,
        type: 'fake_player',
        severity: 'warning',
        title: `Saxta oyunçu profili: "${p.name}"`,
        description: `Avtoqol qeydi oyunçu kimi qeydiyyatdadır (${p.class || '-'}, ${p.year || '-'}).`,
        canAutoFix: true
      });
      return;
    }

    const key = `${normalizePlayerName(p.name)}_${p.year || ''}_${p.class || ''}`;
    if (playerGroupMap.has(key)) {
      issues.push({
        id: `dupe_player_${p.id}`,
        type: 'duplicate_player',
        severity: 'warning',
        title: `Dublikat oyunçu profili: "${p.name}" (${p.class})`,
        description: `${p.year || 'Sezon'} üzrə eyni sinifdə birdən çox qeyd mövcuddur.`,
        canAutoFix: true
      });
    } else {
      playerGroupMap.set(key, p);
    }

    // Check for corrupt/inflated goals against canonical archive
    const canonArchive = (ARCHIVE_PLAYERS || []).find(ap => 
      (ap.id === p.id) || 
      (normalizePlayerName(ap.name) === normalizePlayerName(p.name) && ap.class === p.class && (!p.year || ap.year === p.year))
    );
    if (canonArchive && p.goals > canonArchive.goals) {
      issues.push({
        id: `inflated_goals_${p.id}`,
        type: 'corrupted_goals',
        severity: 'warning',
        title: `Şişirdilmiş qol sayı: "${p.name}" (${p.goals} qol yerinə ${canonArchive.goals})`,
        description: `${p.year || ''} mövsümündə "${p.name}" üçün qol sayı arxiv və matç göstəricilərindən artıqdır.`,
        canAutoFix: true
      });
    }
  });

  // 2. Check for legacy / unmapped division aliases in classes
  classes.forEach(c => {
    const allowed = getDivisionsForYear(c.year);
    if (c.division && !allowed.includes(c.division)) {
      issues.push({
        id: `legacy_div_class_${c.id || c.name}_${c.year || ''}`,
        type: 'division_alias',
        severity: 'info',
        title: `Köhnə kateqoriya kodu: "${c.name}" (${c.division})`,
        description: `Sinif ${c.year || ''} mövsümünün rəsmi kateqoriyalarından (${allowed.join(', ')}) fərqli kodda saxlanılıb.`,
        canAutoFix: true
      });
    }
  });

  // 3. Check matches data integrity
  matches.forEach(m => {
    if (m.scoreA !== null && m.scoreB !== null && (Number(m.scoreA) < 0 || Number(m.scoreB) < 0)) {
      issues.push({
        id: `negative_score_${m.id}`,
        type: 'invalid_score',
        severity: 'error',
        title: `Mənfi hesab: ${m.teamA} vs ${m.teamB}`,
        description: `Matçın hesabı mənfi ola bilməz (${m.scoreA} - ${m.scoreB}).`,
        canAutoFix: false
      });
    }

    const allowed = getDivisionsForYear(m.year);
    if (m.division && !allowed.includes(m.division)) {
      issues.push({
        id: `legacy_div_match_${m.id}`,
        type: 'division_alias',
        severity: 'info',
        title: `Matçın köhnə kateqoriyası: ${m.teamA} vs ${m.teamB}`,
        description: `Matç ${m.year || ''} mövsümünün rəsmi kateqoriyalarından (${allowed.join(', ')}) fərqli '${m.division}' kodunda saxlanılıb.`,
        canAutoFix: true
      });
    }
  });

  // 3b. Check for duplicate matches
  const matchSemanticMap = new Map();
  matches.forEach(m => {
    const key = getMatchSemanticKey(m);
    if (matchSemanticMap.has(key)) {
      issues.push({
        id: `duplicate_match_${m.id}`,
        type: 'duplicate_match',
        severity: 'warning',
        title: `Dublikat matç: ${m.teamA} vs ${m.teamB} (${m.stage || ''})`,
        description: `${m.year || ''} mövsümündə bu matç təkrar qeyd olunub.`,
        canAutoFix: true
      });
    } else {
      matchSemanticMap.set(key, m);
    }
  });

  // 4. Calculate overall Health Score (0 - 100)
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  let healthScore = 100 - (errorCount * 25) - (warningCount * 5) - (infoCount * 1);
  healthScore = Math.max(0, Math.min(100, healthScore));

  let status = 'perfect';
  if (healthScore < 60) status = 'critical';
  else if (healthScore < 85) status = 'needs_attention';
  else if (healthScore < 100) status = 'healthy';

  return {
    healthScore,
    status,
    checkedAt: new Date().toISOString(),
    summary: {
      errors: errorCount,
      warnings: warningCount,
      info: infoCount
    },
    stats: {
      totalClasses: classes.length,
      totalPlayers: players.length,
      totalMatches: matches.length,
      totalYears: years.length,
      errorCount,
      warningCount,
      infoCount
    },
    issues
  };
};

/**
 * Execute automatic repairs on tournament data
 * @returns {Promise<Object>} Summary of fixes applied
 */
export const repairTournamentData = async () => {
  const details = [];

  // 1. Load data
  let classes = JSON.parse(localStorage.getItem('minifootball_classes') || '[]');
  let players = JSON.parse(localStorage.getItem('minifootball_players') || '[]');
  let matches = JSON.parse(localStorage.getItem('minifootball_matches') || '[]');
  const years = JSON.parse(localStorage.getItem('minifootball_years') || '[]');

  // Merge archive fallback if empty
  if (classes.length === 0) classes = [...ARCHIVE_CLASSES];
  if (players.length === 0) players = [...ARCHIVE_PLAYERS];
  if (matches.length === 0) matches = [...ARCHIVE_MATCHES];

  const initialPlayerCount = players.length;

  // 2. Fix class division aliases to canonical seasonal format
  let fixedClasses = 0;
  classes = classes.map(c => {
    const yr = c.year || '';
    const name = c.name || '';
    let div = c.division;
    const prevDiv = div;

    if (yr === '2022-2023' || yr === '2024-2025' || yr === '2025-2026') {
      if (name.startsWith('11')) div = '11';
      else if (name.startsWith('9') || name.startsWith('10')) div = '9-10';
      else if (name.startsWith('7') || name.startsWith('8')) div = '7-8';
      else if (name.startsWith('6')) div = '6';
    } else if (yr === '2023-2024') {
      if (name.startsWith('10') || name.startsWith('11')) div = '10-11';
      else if (name.startsWith('7') || name.startsWith('8')) div = '7-8';
      else if (name.startsWith('6')) div = '6';
    } else if (yr === '2021-2022') {
      if (name.startsWith('10') || name.startsWith('11')) div = '10-11';
      else if (name.startsWith('9')) div = '9';
      else if (name.startsWith('7') || name.startsWith('8')) div = '7-8';
      else if (name.startsWith('6')) div = '6';
    } else if (yr === '2017-2018') {
      div = '9-10-11';
    } else if (yr === '2018-2019') {
      div = '10-11';
    }

    if (div !== prevDiv) fixedClasses++;
    return { ...c, division: div };
  });
  if (fixedClasses > 0) details.push(`${fixedClasses} sinfin kateqoriyası mövsümün standartına uyğunlaşdırıldı.`);

  // 3. Fix match division aliases
  let fixedMatches = 0;
  matches = matches.map(m => {
    const yr = m.year || '';
    let div = m.division;
    const prevDiv = div;
    const tA = m.teamA || '';
    const tB = m.teamB || '';

    if (yr === '2022-2023' || yr === '2024-2025' || yr === '2025-2026') {
      if (tA.startsWith('11') || tB.startsWith('11')) div = '11';
      else if (tA.startsWith('9') || tA.startsWith('10') || tB.startsWith('9') || tB.startsWith('10')) div = '9-10';
      else if (tA.startsWith('7') || tA.startsWith('8') || tB.startsWith('7') || tB.startsWith('8')) div = '7-8';
      else if (tA.startsWith('6') || tB.startsWith('6')) div = '6';
    } else if (yr === '2023-2024') {
      if (tA.startsWith('10') || tA.startsWith('11') || tB.startsWith('10') || tB.startsWith('11')) div = '10-11';
      else if (tA.startsWith('7') || tA.startsWith('8') || tB.startsWith('7') || tB.startsWith('8')) div = '7-8';
      else if (tA.startsWith('6') || tB.startsWith('6')) div = '6';
    } else if (yr === '2021-2022') {
      if (tA.startsWith('10') || tA.startsWith('11') || tB.startsWith('10') || tB.startsWith('11')) div = '10-11';
      else if (tA.startsWith('9') || tB.startsWith('9')) div = '9';
      else if (tA.startsWith('7') || tA.startsWith('8') || tB.startsWith('7') || tB.startsWith('8')) div = '7-8';
      else if (tA.startsWith('6') || tB.startsWith('6')) div = '6';
    } else if (yr === '2017-2018') {
      div = '9-10-11';
    } else if (yr === '2018-2019') {
      div = '10-11';
    }

    if (div !== prevDiv) fixedMatches++;
    return { ...m, division: div };
  });
  if (fixedMatches > 0) details.push(`${fixedMatches} matçın kateqoriyası mövsümün standartına uyğunlaşdırıldı.`);

  // 3b. Deduplicate matches
  const prevMatchCount = matches.length;
  matches = deduplicateMatches(matches);
  const dedupedMatchCount = prevMatchCount - matches.length;
  if (dedupedMatchCount > 0) {
    details.push(`${dedupedMatchCount} dublikat matç təmizləndi və birləşdirildi.`);
  }

  // 4. Purge obsolete IDs, fake own-goal players, and deduplicate players
  const obsoleteSet = new Set(OBSOLETE_PLAYER_IDS);
  const cleanPlayers = [];
  const playerDedupMap = new Map();

  const canonicalArchiveMap = new Map();
  (ARCHIVE_PLAYERS || []).forEach(ap => {
    canonicalArchiveMap.set(`${normalizePlayerName(ap.name)}_${ap.year || ''}_${ap.class || ''}`, ap);
  });

  // Calculate actual match stats per player ID to cross-reference
  const matchStatsMap = {};
  matches.forEach(m => {
    (m.playerStats || []).forEach(stat => {
      if (!matchStatsMap[stat.playerId]) {
        matchStatsMap[stat.playerId] = { goals: 0, assists: 0, matchesPlayed: 0 };
      }
      matchStatsMap[stat.playerId].goals += Number(stat.goals || 0);
      matchStatsMap[stat.playerId].assists += Number(stat.assists || 0);
      matchStatsMap[stat.playerId].matchesPlayed += 1;
    });
  });

  players.forEach(p => {
    if (obsoleteSet.has(p.id)) return;
    if (p.isOwnGoal || /avtoqol|özünə qol|ö\.q|ozune qol/i.test(p.name || '')) return;

    const key = `${normalizePlayerName(p.name)}_${p.year || ''}_${p.class || ''}`;
    const mStat = matchStatsMap[p.id];
    const canon = canonicalArchiveMap.get(key);

    let goals = (mStat && (mStat.matchesPlayed > 0 || mStat.goals > 0)) ? mStat.goals : (canon ? canon.goals : (p.goals || 0));
    let assists = (mStat && (mStat.matchesPlayed > 0 || mStat.assists > 0)) ? mStat.assists : (canon ? canon.assists : (p.assists || 0));
    let matchesPlayed = (mStat && mStat.matchesPlayed > 0) ? mStat.matchesPlayed : (canon ? canon.matchesPlayed : (p.matchesPlayed || 0));

    const normalizedP = {
      ...p,
      goals,
      assists,
      matchesPlayed
    };

    if (playerDedupMap.has(key)) {
      const exist = playerDedupMap.get(key);
      exist.goals = Math.max(exist.goals || 0, normalizedP.goals || 0);
      exist.assists = Math.max(exist.assists || 0, normalizedP.assists || 0);
      exist.matchesPlayed = Math.max(exist.matchesPlayed || 0, normalizedP.matchesPlayed || 0);
      if ((normalizedP.overallRating || 0) > (exist.overallRating || 0)) exist.overallRating = normalizedP.overallRating;
    } else {
      const cloned = { ...normalizedP };
      playerDedupMap.set(key, cloned);
      cleanPlayers.push(cloned);
    }
  });

  const removedCount = initialPlayerCount - cleanPlayers.length;
  if (removedCount > 0) {
    details.push(`${removedCount} dublikat və ya saxta avtoqol profili təmizləndi və birləşdirildi.`);
  }

  // 5. Save back to localStorage
  localStorage.setItem('minifootball_classes', JSON.stringify(classes));
  localStorage.setItem('minifootball_players', JSON.stringify(cleanPlayers));
  localStorage.setItem('minifootball_matches', JSON.stringify(matches));

  // 6. Recalculate standings, points, and goal differences
  recalculateData();
  details.push("Turnir cədvəli xalları və Sofascore reytinqləri yenidən hesablandı.");

  return {
    success: true,
    repairedCount: fixedClasses + fixedMatches + removedCount + 1,
    details
  };
};

/**
 * Background silent health check that runs periodically without obstructing UI
 */
export const startBackgroundSelfHealing = () => {
  try {
    const report = auditTournamentData();
    if (report.issues.some(i => i.canAutoFix && (i.severity === 'warning' || i.severity === 'error'))) {
      console.log('Self-Healing Engine: Auto-fixing detected minor data discrepancies in background...');
      repairTournamentData().then(res => {
        console.log('Self-Healing Engine: Successfully repaired tournament state.', res);
      });
    } else {
      console.log(`Self-Healing Engine: Tournament health is optimal (${report.healthScore}%).`);
    }
  } catch (err) {
    console.warn('Self-Healing Engine background check warning:', err);
  }
};
