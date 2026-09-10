/**
 * ============================================================================
 * FAYL ADI: services/ratings.js
 * MƏQSƏDİ: Sofascore Tipli Canlı Reytinq və Statistik Qiymətləndirmə Mühərriki
 * 
 * BU MODULUN VƏZİFƏLƏRİ:
 *   1. calculateSofascoreRating(): Matç zamanı oyunçunun qol, assist, sarı/qırmızı vərəqə,
 *      qapıçı qurtarışları və komanda nəticəsinə əsasən 1.0 - 10.0 ballıq dəqiq reytinqini hesablayır.
 *   2. computePlayerOverallRating(): Mövsüm və ya ümumi turnir üzrə oyunçunun yekun reytinqini çıxarır.
 *   3. getSofascoreBadgeStyle(): Reytinq balına uyğun rəsmi Sofascore rənglərini (mavi, yaşıl, sarı, qırmızı) qaytarır.
 * 
 * İSTİFADƏ EDİLDİYİ YERLƏR:
 *   - services/database.js (recalculateData, recalculateInMemoryData)
 *   - components/Matches.js (matç daxili oyunçu xalları)
 *   - components/Standings.js (oyunçu cədvəli)
 *   - components/PlayerProfileModal.js (oyunçu profili kartı)
 * ============================================================================
 */

/**
 * Matçda fərdi oyunçu göstəricilərinə görə Sofascore reytinqini (1.0 - 10.0) hesablayır.
 * 
 * @param {Object} stat - Oyunçunun matçdakı statistikası
 *   { goals, assists, yellowCards, redCards, ownGoals, saves, xG, xA }
 * @param {Object} playerRole - { isKeeper: boolean }
 * @param {Object} matchContext - { isFinal: boolean, teamWon: boolean, goalDiff: number, goalsAgainst: number }
 * @returns {number} 1.0 ilə 10.0 arasında yuvarlaqlaşdırılmış reytinq balı
 */
export const calculateSofascoreRating = (stat = {}, playerRole = {}, matchContext = {}) => {
  const BASE = 6.50;
  let rating = BASE;

  const goals        = Number(stat.goals        || 0);
  const assists      = Number(stat.assists      || 0);
  const yellow       = Number(stat.yellowCards  || 0);
  const red          = Number(stat.redCards     || 0);
  const ownGoals     = Number(stat.ownGoals     || 0);
  const saves        = Number(stat.saves        || 0);

  const isKeeper     = playerRole.isKeeper    === true;
  const isFinal      = matchContext.isFinal   === true;
  const teamWon      = matchContext.teamWon    === true;
  const goalDiff     = Number(matchContext.goalDiff     || 0);
  const goalsAgainst = Number(matchContext.goalsAgainst || 0);

  // xG/xA irəliyə uyğunluq
  const xG  = Number(stat.xG  || 0);
  const xA  = Number(stat.xA  || 0);

  if (isKeeper) {
    // ── Qapıçı Qiymətləndirməsi ──────────────────────────────────────
    const cleanSheet = goalsAgainst === 0;

    if (cleanSheet) {
      rating += 1.00;
      if (isFinal) rating += 0.20; // Final bonusu
    } else {
      rating -= goalsAgainst * 0.30; // Buraxılan hər qol üçün cərimə (-0.30)
    }

    if (saves > 0) rating += saves * 0.20; // Hər qurtarış üçün (+0.20)
    if (xG > 0) rating += xG * 0.10;

    if (yellow > 0) rating -= yellow * 0.40;
    if (red    > 0) rating -= red    * 2.00;
  } else {
    // ── Sahə Oyunçusu Qiymətləndirməsi ───────────────────────────────
    if (goals > 0) {
      rating += goals * 0.80;
      if (isFinal) rating += goals * 0.20; // Finalda vurulan hər qol üçün bonus
    }
    if (assists > 0) {
      rating += assists * 0.50;
      if (isFinal) rating += assists * 0.20; // Final assist bonusu
    }

    if (xG > 0) rating += xG * 0.15;
    if (xA > 0) rating += xA * 0.10;

    if (yellow  > 0) rating -= yellow  * 0.40;
    if (red     > 0) rating -= red     * 2.00;
    if (ownGoals > 0) rating -= ownGoals * 1.00;

    // Komanda Nəticəsi Bonusu
    if (teamWon) {
      rating += 0.30;
    } else if (goalDiff <= -3) {
      rating -= 0.40; // Darmadağın məğlubiyyət (>= 3 qol fərqi)
    }
  }

  // 1.0 ilə 10.0 aralığına məhdudlaşdır
  return Number(Math.min(10.0, Math.max(1.0, rating)).toFixed(1));
};

/**
 * Reytinq balına uyğun Sofascore rəng stillərini qaytarır.
 * 
 * @param {number} rating - Oyunçunun reytinq balı
 * @returns {string} Tailwind CSS sinifləri
 */
export const getSofascoreBadgeStyle = (rating) => {
  const r = Number(rating) || 0;
  if (r >= 9.0) return 'bg-[#1d4ed8] text-white font-black shadow-md shadow-blue-700/40 rating-sofascore-9plus';  // 9+ Tünd Canlı Göy (Royal Blue)
  if (r >= 8.0) return 'bg-[#0284c7] text-white font-black shadow-md shadow-sky-500/30 rating-sofascore-8plus';   // 8+ Mavi (Sky Blue)
  if (r >= 7.0) return 'bg-[#15803d] text-white font-bold rating-sofascore-7plus';                               // 7+ Tünd Yaşıl
  if (r >= 6.5) return 'bg-[#eab308] text-slate-950 font-black rating-sofascore-65plus';                        // 6.5+ Sarı
  if (r >= 6.0) return 'bg-[#f97316] text-white font-bold rating-sofascore-6plus';                              // 6+ Narıncı
  return 'bg-[#dc2626] text-white font-bold rating-sofascore-below6';                                            // 6- Qırmızı
};

/**
 * Oyunçunun mövsüm/karyera üzrə ümumi reytinqini (overall rating) hesablayır.
 * 
 * @param {Object} stats - { ratingSum, ratingCount, goals, assists }
 * @param {Object} initialPlayer - Oyunçunun baza profili
 * @returns {number} Ümumi reytinq balı
 */
export const computePlayerOverallRating = (stats = {}, initialPlayer = {}) => {
  if (stats.ratingCount > 0) {
    return Number((stats.ratingSum / stats.ratingCount).toFixed(1));
  }

  const goals = Number(stats.goals > 0 ? stats.goals : initialPlayer.goals || 0);
  const assists = Number(stats.assists > 0 ? stats.assists : initialPlayer.assists || 0);
  const isKeeper = (initialPlayer.position || '').toLowerCase().includes('qap');

  if (initialPlayer.overallRating && Number(initialPlayer.overallRating) > 6.5 && goals === 0) {
    return Number(Number(initialPlayer.overallRating).toFixed(1));
  }

  let rating = 6.5;

  if (isKeeper) {
    rating = 6.8;
  } else {
    // Qol sayına görə dinamik Sofascore əyrisi
    if (goals >= 20) rating = 9.8;
    else if (goals >= 17) rating = 9.5;
    else if (goals >= 14) rating = 9.2;
    else if (goals >= 11) rating = 8.9;
    else if (goals >= 9)  rating = 8.6;
    else if (goals >= 7)  rating = 8.3;
    else if (goals >= 5)  rating = 7.9;
    else if (goals >= 3)  rating = 7.5;
    else if (goals >= 2)  rating = 7.2;
    else if (goals >= 1)  rating = 6.9;

    if (assists > 0) {
      rating += Math.min(0.8, assists * 0.15);
    }
  }

  return Number(Math.min(10.0, Math.max(1.0, rating)).toFixed(1));
};
