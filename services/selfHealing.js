import { db, recalculateData, normalizePlayerName, OBSOLETE_PLAYER_IDS, getMatchSemanticKey, deduplicateMatches } from './database.js';
import { isMatchDivision } from './i18n.js';
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
  const validDivisions = ['6', '7-8', '9', '10-11'];

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
    if (c.division && !validDivisions.includes(c.division)) {
      issues.push({
        id: `legacy_div_class_${c.id || c.name}`,
        type: 'division_alias',
        severity: 'info',
        title: `Köhnə kateqoriya kodu: "${c.name}" (${c.division})`,
        description: `Sinif rəsmi kateqoriyalardan ('6', '7-8', '9', '10-11') fərqli kodda saxlanılıb.`,
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

    if (m.division && !validDivisions.includes(m.division)) {
      issues.push({
        id: `legacy_div_match_${m.id}`,
        type: 'division_alias',
        severity: 'info',
        title: `Matçın köhnə kateqoriyası: ${m.teamA} vs ${m.teamB}`,
        description: `Matçın kateqoriya kodu '${m.division}' olaraq qeyd edilib.`,
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

  // 2. Fix class division aliases
  let fixedClasses = 0;
  classes = classes.map(c => {
    let div = c.division;
    if (div === '11') { div = '10-11'; fixedClasses++; }
    else if (div === '9-10') { div = '9'; fixedClasses++; }
    else if (div === '7' || div === '8') { div = '7-8'; fixedClasses++; }
    return { ...c, division: div };
  });
  if (fixedClasses > 0) details.push(`${fixedClasses} sinfin kateqoriya formatı ('10-11', '7-8') standartlaşdırıldı.`);

  // 3. Fix match division aliases
  let fixedMatches = 0;
  matches = matches.map(m => {
    let div = m.division;
    if (div === '11') { div = '10-11'; fixedMatches++; }
    else if (div === '9-10') { div = '9'; fixedMatches++; }
    else if (div === '7' || div === '8') { div = '7-8'; fixedMatches++; }
    return { ...m, division: div };
  });
  if (fixedMatches > 0) details.push(`${fixedMatches} matçın kateqoriyası standartlaşdırıldı.`);

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
