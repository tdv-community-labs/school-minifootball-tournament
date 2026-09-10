/**
 * ============================================================================
 * FAYL ADI: services/matchUtils.js
 * MƏQSƏDİ: Matç Məlumatlarının Normallaşdırılması və Dublikat Əleyhinə Mühərrik
 * 
 * BU MODULUN VƏZİFƏLƏRİ:
 *   1. normalizeStage(): Azərbaycan hərflərini ('ə' -> 'e', 'ı' -> 'i') və durğu
 *      işarələrini standartlaşdıraraq matç mərhələlərini eyniləşdirir.
 *   2. normalizeMatchDivision(): Turnir kateqoriya kodlarını ('11' -> '10-11', '7'/'8' -> '7-8') vahid şəklə salır.
 *   3. getMatchSemanticKey(): Matçın unikal semantik açarını (il, kateqoriya, komandalar, mərhələ, tarix) formalaşdırır.
 *   4. mergeMatchObjects(): İki eyni matç qeydi aşkarlandıqda ən dolğun və zəngin oyunçu statistikasını qoruyur.
 *   5. deduplicateMatches(): Bütün matçlar massivini süzərək dublikatları (eyni oyunun fərqli ID ilə təkrarını) təmizləyir.
 * 
 * İSTİFADƏ EDİLDİYİ YERLƏR:
 *   - services/database.js (bütün matç oxuma və hesablama funksiyaları)
 *   - services/selfHealing.js (dublikat oyunların aşkarlanması və təmizlənməsi)
 * ============================================================================
 */

/**
 * Matç mərhələsinin adını vahid standart mərhələ koduna çevirir.
 * Məsələn: '8/1 Final' və '1/8 final' hər ikisi '8/1' qaytarır.
 * 
 * @param {string} stage
 * @returns {string}
 */
export const normalizeStage = (stage) => {
  if (!stage) return 'group';
  const s = String(stage).trim().toLowerCase();
  if (s.includes('16/1') || s.includes('1/16') || s.includes('161') || s.includes('116')) return '16/1';
  if (s.includes('8/1') || s.includes('1/8') || s.includes('81') || s.includes('18')) return '8/1';
  if (s.includes('4/1') || s.includes('1/4') || s.includes('41') || s.includes('14') || s.includes('dörddəbir') || s.includes('dorddebir')) return '4/1';
  if (s.includes('yarım') || s.includes('yarim') || s.includes('1/2') || s.includes('semi')) return 'semi';
  if (s.includes('3-cü') || s.includes('3 cü') || s.includes('3-cu') || s.includes('bürünc') || s.includes('burunc') || s.includes('3rd')) return 'third';
  if (s.includes('final')) return 'final';
  return 'group';
};

/**
 * Matçın kateqoriya kodunu vahid formata ('10-11', '7-8', '9-10', '9-10-11', '9', '6') uyğunlaşdırır.
 * 
 * @param {string} div
 * @returns {string}
 */
export const normalizeMatchDivision = (div) => {
  if (!div) return '10-11';
  if (div === '7' || div === '8') return '7-8';
  return div;
};

/**
 * Matç üçün unikal semantik açar yaradır.
 * Komandaların sırasından asılı olmayaraq (A vs B və ya B vs A) eyni açar generasiya olunur.
 * Kateqoriya adı dəyişsə belə (məsələn: '9' -> '9-10-11') eyni matç təkrar sayılmır.
 * 
 * @param {Object} m - Matç obyekti
 * @returns {string} Semantik açar
 */
export const getMatchSemanticKey = (m) => {
  if (!m) return '';
  const tA = (m.teamA || '').trim().toUpperCase();
  const tB = (m.teamB || '').trim().toUpperCase();
  // Pley-off şəbəkəsinin naməlum komandalı (?-?) oyunlarını bir-birinə qarışdırmamaq üçün ID əsas götürülür
  if (!tA || !tB || tA === '?' || tB === '?') {
    return m.id || `placeholder_${m.year || ''}_${m.stage || ''}_${Math.random()}`;
  }
  const yr = m.year || '';
  const teams = [tA, tB].sort().join('_vs_');
  const stage = normalizeStage(m.stage);
  return `${yr}_${teams}_${stage}`;
};

/**
 * İki dublikat matç obyektini birləşdirir:
 * 1. Mötəbər hesabı olan qeydə (? - ? əvəzinə) üstünlük verir.
 * 2. Ən dolğun və zəngin oyunçu statistikası olanı üstün tutur.
 * 
 * @param {Object} existing
 * @param {Object} incoming
 * @returns {Object}
 */
export const mergeMatchObjects = (existing, incoming) => {
  const hasScores = (m) => Number.isFinite(Number(m?.scoreA)) && Number.isFinite(Number(m?.scoreB));
  const existingValid = hasScores(existing);
  const incomingValid = hasScores(incoming);

  if (incomingValid && !existingValid) {
    return { ...existing, ...incoming };
  }
  if (existingValid && !incomingValid) {
    return { ...incoming, ...existing };
  }

  const existingStatsCount = (existing.playerStats || []).length;
  const incomingStatsCount = (incoming.playerStats || []).length;
  if (incomingStatsCount > existingStatsCount) {
    return { ...existing, ...incoming };
  }
  return { ...incoming, ...existing };
};

/**
 * Matç siyahısını semantik açarlara görə yoxlayaraq bütün dublikatları ləğv edir.
 * 
 * @param {Array<Object>} matchesList
 * @returns {Array<Object>} Təmizlənmiş unikal matçlar siyahısı
 */
export const deduplicateMatches = (matchesList) => {
  const map = new Map();
  (matchesList || []).forEach(m => {
    if (!m) return;
    const key = getMatchSemanticKey(m);
    if (!map.has(key)) {
      map.set(key, { ...m });
    } else {
      const current = map.get(key);
      map.set(key, mergeMatchObjects(current, m));
    }
  });
  return Array.from(map.values());
};
