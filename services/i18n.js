/**
 * ============================================================================
 * FAYL ADI: services/i18n.js
 * MƏQSƏDİ: Çoxdilli Tərcümə və Beynəlmiləlləşdirmə Sistemi (Internationalization)
 * 
 * BU MODULUN VƏZİFƏLƏRİ:
 *   1. translations: Azərbaycan və İngilis dillərində tam interfeys lüğəti.
 *   2. t(): Cari seçilmiş dilə uyğun mətni qaytaran əsas tərcümə funksiyası.
 *   3. getDivisionLabel(): Yaş kateqoriyalarının rəsmi adlarını çıxarır (məs: 'X-XI Siniflər').
 *   4. getStageLabel(): Matç mərhələlərini tərcümə edir (Final, Qrup, 3-cü yer və s.).
 *   5. isMatchDivision(): Köhnə və yeni kateqoriya kodlarının eyniliyini yoxlayır.
 * 
 * İSTİFADƏ EDİLDİYİ YERLƏR:
 *   - Bütün tətbiq (app.js, Dashboard, Standings, Matches, Players, AdminDashboard)
 * ============================================================================
 */
export const translations = {
  en: {
    // Brand & Header
    appTitle: "TDV BTL",
    appSubtitle: "FOOTBALL",
    academicYear: "Academic Year:",
    navHome: "Home",
    navStandings: "Standings",
    navMatches: "Matches & Video",
    navPlayers: "Players",
    navAdmin: "Admin Panel",

    // Theme Switcher
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",

    // Languages
    langEn: "EN",
    langAz: "AZ",

    // Divisions
    div6: "6th Grade",
    div7: "7th Grade",
    div8: "8th Grade",
    div7_8: "7-8th Grade",
    div9: "9th Grade",
    div9_10: "9-10th Grade",
    div10_11: "10-11th Grade",
    div11: "11th Grade",

    // Dashboard Banner
    welcomeTag: "Official Championship",
    welcomeTitle: "TDV BTL Football Tournament",
    welcomeDesc: "Live standings, Sofascore player ratings, match video highlights, and knockout playoff brackets.",

    // Dashboard Stats
    statTotalPlayers: "Total Players",
    statTotalMatches: "Total Matches",
    statTotalGoals: "Goals Scored",
    statLeader: "Current Leader",

    // Sofascore Star XI
    sofastarTitle: "Sofascore Best Performers",
    sofastarDesc: "Top rated players based on individual performance, goals, assists, and impact.",
    goals: "Goals",
    assists: "Assists",
    matchesPlayed: "Matches",
    rating: "Rating",

    // Recent Matches & Scorers
    recentMatches: "Recent Matches",
    viewAllMatches: "All matches",
    noMatchesYet: "No matches recorded for this category yet.",
    noMatchesArchiveHint: "Select season 2022-2023 from above to view historical tournament matches.",
    topScorers: "Top Scorers",
    topAssists: "Top Playmakers",
    noScorersYet: "No goals recorded in this category yet.",
    noScorersArchiveHint: "Select season 2022-2023 and different grades to view all top scorers.",
    noAssistsYet: "No assists recorded in this category yet.",
    penaltyShootout: "pen.",
    dateNotSet: "TBD",

    // Standings & Playoff Brackets
    standingsTitle: "Tournament Standings & Playoff Tree",
    tabGroupStage: "Group Stage Table",
    tabPlayoffs: "Playoff Bracket",
    tableEmptyNotice: "No teams or standings found for this category.",
    bracketEmptyNotice: "Playoff bracket matches have not started yet for this season.",
    allGroups: "All Groups",
    groupA: "Group A",
    groupB: "Group B",
    groupC: "Group C",
    groupD: "Group D",
    top2Qualify: "Top 2 qualify for playoffs",
    colRank: "#",
    colTeam: "Team / Class",
    colPlayed: "Pld",
    colWon: "W",
    colDrawn: "D",
    colLost: "L",
    colGF: "GF",
    colGA: "GA",
    colGD: "GD",
    colPoints: "Pts",
    colForm: "Form",

    // Stages
    stageGroup: "Group Stage",
    stageRoundOf32: "Round of 32 (16/1)",
    stageRoundOf16: "Round of 16 (8/1)",
    stageQuarterFinals: "Quarter-Finals (4/1)",
    stageSemiFinals: "Semi-Finals (1/2)",
    stageThirdPlace: "3rd Place Match",
    stageFinal: "Final",
    champion: "CHAMPION",

    // Matches Page
    matchesTitle: "Matches & Video Highlights",
    stageFilter: "Stage:",
    allStages: "All Stages",
    noMatchesFound: "No matches found for this stage.",
    watchVideo: "Video Highlights",
    playerPerformances: "Player Performances",
    matchDetails: "Match Details",

    // Players Page
    playersTitle: "Tournament Players & Ratings",
    searchPlayerPlaceholder: "Search player by name...",
    filterClassAll: "All Classes",
    noPlayersFound: "No players found matching the search criteria.",
    playerDetail: "Player Profile",

    // Modals
    rulesBtn: "Tournament Rules",
    contactBtn: "Contact Committee",
    closeBtn: "Close",

    // Rules Modal
    rulesModalTitle: "TDV BTL Tournament Regulations",
    rulesModalSubtitle: "Official championship conduct, rules, and match guidelines",
    rule1Title: "1. Match Format & Substitutions",
    rule1Desc: "Matches consist of two 15-minute halves (30 minutes total). Teams field 5 outfield players plus 1 goalkeeper (5+1). Substitutions are unlimited and can be made dynamically during breaks in play.",
    rule2Title: "2. Group Stage Points & Tiebreakers",
    rule2Desc: "Win = 3 pts, Draw = 1 pt, Loss = 0 pts. In case of equal points between teams: 1) Head-to-head match result, 2) Goal difference, 3) Higher number of goals scored.",
    rule3Title: "3. Knockout Playoff Rules",
    rule3Desc: "Knockout matches (16/1, 8/1, 4/1, Semi-final, and Final) cannot end in a draw. If tied at full time, a 3-penalty shootout immediately determines the winner.",
    rule4Title: "4. Disciplinary Conduct & Cards",
    rule4Desc: "Direct red card or two yellow cards in a match results in an immediate 2-minute suspension with the team playing one man down, unless the opponent scores.",
    rule5Title: "5. Sofascore Rating System",
    rule5Desc: "Every player is evaluated from 1.0 to 10.0 based on goals, assists, defensive stops, match outcome, and importance of the stage.",

    // Contact Modal
    contactModalTitle: "Contact Tournament Committee",
    contactModalSubtitle: "Inquiries, video highlight submissions, and tournament feedback",
    contactEmailLabel: "Official Contact Email",
    contactEmailDesc: "For result corrections, video links, or referee inquiries:",
    sendEmailBtn: "Send Email",

    // Footer
    footerDesc: "Official digital platform for TDV BTL Minifootball Tournaments. Advanced Sofascore rating engine, real-time standings, and knockout playoff brackets.",
    quickLinks: "Quick Navigation",
    allRightsReserved: "All rights reserved.",
    developerTag: "Developed for TDV Bakı Türk Liseyi"
  },

  az: {
    // Brand & Header
    appTitle: "TDV BTL",
    appSubtitle: "FUTBOL",
    academicYear: "Tədris İli:",
    navHome: "Ana Səhifə",
    navStandings: "Turnir Cədvəli",
    navMatches: "Matçlar & Video",
    navPlayers: "Oyunçular",
    navAdmin: "Admin Panel",

    // Theme Switcher
    themeSystem: "Sistem",
    themeLight: "Açıq",
    themeDark: "Qaranlıq",

    // Languages
    langEn: "EN",
    langAz: "AZ",

    // Divisions
    div6: "6-cı Siniflər",
    div7: "7-ci Siniflər",
    div8: "8-ci Siniflər",
    div7_8: "7-8-ci Siniflər",
    div9: "9-cu Siniflər",
    div9_10: "9-10-cu Siniflər",
    div10_11: "10-11-ci Siniflər",
    div11: "11-ci Siniflər",

    // Dashboard Banner
    welcomeTag: "Rəsmi Çempionat",
    welcomeTitle: "TDV BTL Futbol Turniri",
    welcomeDesc: "Canlı turnir cədvəlləri, fərdi Sofascore reytinqləri, video icmallar və pley-off toru.",

    // Dashboard Stats
    statTotalPlayers: "Cəmi Oyunçu",
    statTotalMatches: "Oynanılan Matç",
    statTotalGoals: "Vurulan Qol",
    statLeader: "Lider Komanda",

    // Sofascore Star XI
    sofastarTitle: "Sofascore Ən Yaxşı Oyunçuları",
    sofastarDesc: "Qol, assist və oyun performansına əsaslanan ən yüksək reytinqli futbolçular.",
    goals: "Qol",
    assists: "Asist",
    matchesPlayed: "Oyun",
    rating: "Reytinq",

    // Recent Matches & Scorers
    recentMatches: "Son Matçlar",
    viewAllMatches: "Bütün oyunlar",
    noMatchesYet: "Bu kateqoriya və mövsüm üçün matç qeydə alınmayıb.",
    noMatchesArchiveHint: "Arxiv nəticələrini görmək üçün yuxarıdan 2022-2023 mövsümünü seçə bilərsiniz.",
    topScorers: "Bombardirlər",
    topAssists: "Asist Liderləri",
    noScorersYet: "Bu kateqoriya üçün qol qeydə alınmayıb.",
    noScorersArchiveHint: "2022-2023 mövsümünü və fərqli sinifləri seçərək bütün bombardirləri görə bilərsiniz.",
    noAssistsYet: "Bu kateqoriya üçün asist qeydə alınmayıb.",
    penaltyShootout: "pen.",
    dateNotSet: "Təyin edilməyib",

    // Standings & Playoff Brackets
    standingsTitle: "Turnir Cədvəli və Pley-off Toru",
    tabGroupStage: "Qrup Cədvəli",
    tabPlayoffs: "Pley-off Toru",
    tableEmptyNotice: "Bu kateqoriya üçün komanda cədvəli tapılmadı.",
    bracketEmptyNotice: "Bu mövsüm üçün pley-off mərhələsi hələ başlamayıb.",
    allGroups: "Bütün Qruplar",
    groupA: "Qrup A",
    groupB: "Qrup B",
    groupC: "Qrup C",
    groupD: "Qrup D",
    top2Qualify: "İlk 2 yer pley-offa yüksəlir",
    colRank: "#",
    colTeam: "Sinif",
    colPlayed: "O",
    colWon: "Q",
    colDrawn: "H",
    colLost: "M",
    colGF: "VQ",
    colGA: "BQ",
    colGD: "TF",
    colPoints: "X",
    colForm: "Forma",

    // Stages
    stageGroup: "Qrup Mərhələsi",
    stageRoundOf32: "16/1 Final",
    stageRoundOf16: "8/1 Final",
    stageQuarterFinals: "4/1 Final",
    stageSemiFinals: "Yarımfinal",
    stageThirdPlace: "3-cü Yer",
    stageFinal: "Final",
    champion: "ÇEMPİON",

    // Matches Page
    matchesTitle: "Matçlar və Video İcmallar",
    stageFilter: "Mərhələ:",
    allStages: "Bütün Mərhələlər",
    noMatchesFound: "Bu mərhələ üçün heç bir matç tapılmadı.",
    watchVideo: "Video İcmal",
    playerPerformances: "Oyunçu Çıxışları",
    matchDetails: "Matç Detalları",

    // Players Page
    playersTitle: "Turnir Oyunçuları və Reytinqlər",
    searchPlayerPlaceholder: "Oyunçu adı ilə axtar...",
    filterClassAll: "Bütün Siniflər",
    noPlayersFound: "Axtarışa uyğun oyunçu tapılmadı.",
    playerDetail: "Oyunçu Profili",

    // Modals
    rulesBtn: "Reqlament",
    contactBtn: "Əlaqə",
    closeBtn: "Bağla",

    // Rules Modal
    rulesModalTitle: "TDV BTL Turnir Reqlamenti",
    rulesModalSubtitle: "Çempionatın rəsmi qaydaları və nizam-intizam tələbləri",
    rule1Title: "1. Ümumi Turnir Qaydaları və Əvəzetmələr",
    rule1Desc: "Matçlar hər biri 15 dəqiqə olmaqla 2 hissədən (cəmi 30 dəqiqə) ibarətdir. Meydanda 5 oyunçu + 1 qapıçı olmaqla 6 oyunçu iştirak edir. Əvəzetmələrin sayı sərbəstdir.",
    rule2Title: "2. Xallar və Qrup Mərhələsi Meyarları",
    rule2Desc: "Qələbə: 3 xal, Heç-heçə: 1 xal, Məğlubiyyət: 0 xal. Xallar bərabər olduqda ardıcıllıqla: 1) Öz aralarındakı oyun, 2) Ümumi top fərqi, 3) Daha çox vurulan qol nəzərə alınır.",
    rule3Title: "3. Pley-off Mərhələsi və Penaltilər",
    rule3Desc: "Pley-off (16/1, 8/1, 4/1, Yarımfinal və Final) qarşılaşmalarında heç-heçə qeydə alınmır. Əsas vaxt bərabər bitdikdə dərhal 3 zərbəlik penalti seriyası tətbiq olunur.",
    rule4Title: "4. İntizam Qaydaları və Kartlar",
    rule4Desc: "Birbaşa qırmızı kart və ya eyni oyunda 2 sarı kart alan oyunçu dərhal meydandan çıxarılır və komanda 2 dəqiqə azlıqda qalır (qol buraxıldıqda azlıq vaxtından əvvəl bitir).",
    rule5Title: "5. Sofascore Reytinq Mexanizmi",
    rule5Desc: "Hər futbolçunun göstərdiyi oyun, qollar, assistlər və komandanın qələbəsi xüsusi alqoritmlə 1.0 - 10.0 şkalası üzrə Sofascore reytinqi ilə qiymətləndirilir.",

    // Contact Modal
    contactModalTitle: "Turnir Təşkilat Komitəsi ilə Əlaqə",
    contactModalSubtitle: "Suallar, müraciətlər və məlumat düzəlişləri üçün",
    contactEmailLabel: "Rəsmi E-poçt",
    contactEmailDesc: "Təklif, video və ya nəticə düzəlişlərinizi birbaşa göndərə bilərsiniz:",
    sendEmailBtn: "Məktub Göndər",

    // Footer
    footerDesc: "TDV Bakı Türk Liseyi minifutbol çempionatının rəsmi rəqəmsal platforması. Sofascore reytinq sistemi və real-vaxt cədvəlləri.",
    quickLinks: "Faydalı Keçidlər",
    allRightsReserved: "Bütün hüquqlar qorunur.",
    developerTag: "TDV Bakı Türk Liseyi üçün hazırlanmışdır"
  }
};

/**
 * Get translation for given key with English fallback
 */
export const t = (key, lang = 'en') => {
  const current = translations[lang] || translations.en;
  if (current[key] !== undefined) return current[key];
  if (translations.en[key] !== undefined) return translations.en[key];
  return key;
};

/**
 * Get localized division label
 */
export const getDivisionLabel = (div, lang = 'en') => {
  const d = String(div || '').trim();
  if (lang === 'az') {
    if (d === '6') return '6-cı Siniflər';
    if (d === '7') return '7-ci Siniflər';
    if (d === '8') return '8-ci Siniflər';
    if (d === '7-8') return '7-8-ci Siniflər';
    if (d === '9') return '9-cu Siniflər';
    if (d === '9-10') return '9-10-cu Siniflər';
    if (d === '10-11') return '10-11-ci Siniflər';
    if (d === '11') return '11-ci Siniflər';
    return d ? `${d}-cı Siniflər` : '10-11-ci Siniflər';
  }
  // English default
  if (d === '6') return '6th Grade';
  if (d === '7') return '7th Grade';
  if (d === '8') return '8th Grade';
  if (d === '7-8') return '7-8th Grade';
  if (d === '9') return '9th Grade';
  if (d === '9-10') return '9-10th Grade';
  if (d === '10-11') return '10-11th Grade';
  if (d === '11') return '11th Grade';
  return d ? `${d} Grade` : '10-11th Grade';
};

/**
 * Check if a match, class, or player division matches the target division filter
 */
export const isMatchDivision = (itemDiv, selectedDiv) => {
  if (!itemDiv || !selectedDiv) return false;
  const i = String(itemDiv).trim();
  const s = String(selectedDiv).trim();
  if (i === s) return true;

  // Grade 7-8 combined category includes single 7 and 8
  if (s === '7-8' && (i === '7' || i === '8')) return true;

  // Grade 9-10 combined category includes single 9 and 10
  if (s === '9-10' && (i === '9' || i === '10')) return true;

  // Grade 10-11 combined category includes single 10 and 11
  if (s === '10-11' && (i === '10' || i === '11')) return true;

  return false;
};

/**
 * Get the list of official divisions that participated in a specific tournament year.
 * Historical rules:
 * - 2017-2018: Only 9 and 10-11 participated.
 * - 2018-2019: Only 10-11 participated.
 * - 2021-2022: 6, 7-8, 9, 10-11 participated.
 * - 2022-2023: 6, 7-8, 9-10, 11 participated.
 * - 2023-2024: 6, 7-8, 10-11 participated.
 * - Modern/Future seasons (2024-2025, 2025-2026+): 6, 7-8, 9-10, 11.
 * 
 * Note: Dynamic legacy aliases are strictly rejected to prevent duplicate buttons.
 */
export const getDivisionsForYear = (year, dynamicDetectedList = []) => {
  const y = String(year || '').trim();

  // Canonical ordering of divisions by school grade level
  const canonicalOrder = ['6', '7-8', '7', '8', '9', '9-10', '10-11', '11'];
  const sortByGrade = (list) => {
    return Array.from(new Set(list)).sort((a, b) => {
      const idxA = canonicalOrder.indexOf(a);
      const idxB = canonicalOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  };

  // Authoritative canonical sets for each tournament year
  let canonicalDivs = [];
  if (y === '2017-2018') {
    canonicalDivs = ['9', '10-11'];
  } else if (y === '2018-2019') {
    canonicalDivs = ['10-11'];
  } else if (y === '2021-2022') {
    canonicalDivs = ['6', '7-8', '9', '10-11'];
  } else if (y === '2022-2023') {
    canonicalDivs = ['6', '7-8', '9-10', '11'];
  } else if (y === '2023-2024') {
    canonicalDivs = ['6', '7-8', '10-11'];
  } else {
    // 2024-2025, 2025-2026 və sonrakı illər
    canonicalDivs = ['6', '7-8', '9-10', '11'];
  }

  // If dynamic classes were passed in, ONLY accept custom non-standard divisions
  // (e.g. 'Müəllimlər' or 'Qızlar'). NEVER accept legacy aliases that cause duplicates.
  const standardDivisionCodes = new Set(['6', '7', '8', '7-8', '9', '10', '9-10', '10-11', '11']);
  if (Array.isArray(dynamicDetectedList) && dynamicDetectedList.length > 0) {
    const customDivs = dynamicDetectedList.filter(d => 
      Boolean(d) && typeof d === 'string' && !standardDivisionCodes.has(d)
    );
    if (customDivs.length > 0) {
      return sortByGrade([...canonicalDivs, ...customDivs]);
    }
  }

  return sortByGrade(canonicalDivs);
};

/**
 * Get localized stage label
 */
export const getStageLabel = (stage, lang = 'en') => {
  if (!stage) return '';
  const s = stage.trim().toLowerCase();
  if (lang === 'az') {
    if (s.includes('16/1') || s.includes('1/16')) return '16/1 Final';
    if (s.includes('8/1') || s.includes('1/8')) return '8/1 Final';
    if (s.includes('4/1') || s.includes('1/4') || s.includes('dörddəbir') || s.includes('dorddebir')) return '4/1 Final';
    if (s.includes('yarım') || s.includes('yarim') || s.includes('1/2') || s.includes('semi')) return 'Yarımfinal';
    if (s.includes('3-cü') || s.includes('3 cü') || s.includes('3-cu') || s.includes('bürünc') || s.includes('burunc')) return '3-cü Yer';
    if (s.includes('final')) return 'Final';
    return 'Qrup Mərhələsi';
  }
  // English
  if (s.includes('16/1') || s.includes('1/16')) return 'Round of 32';
  if (s.includes('8/1') || s.includes('1/8')) return 'Round of 16';
  if (s.includes('4/1') || s.includes('1/4') || s.includes('dörddəbir') || s.includes('dorddebir')) return 'Quarter-Final';
  if (s.includes('yarım') || s.includes('yarim') || s.includes('1/2') || s.includes('semi')) return 'Semi-Final';
  if (s.includes('3-cü') || s.includes('3 cü') || s.includes('3-cu') || s.includes('bürünc') || s.includes('burunc')) return '3rd Place';
  if (s.includes('final')) return 'Final';
  return 'Group Stage';
};
