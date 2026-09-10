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
 * Matç mərhələsinin adını normallaşdırır (məsələn: 'Qrup Mərhələsi' və 'qrup_merhelesi' eyni nəticə verir).
 * 
 * @param {string} stage
 * @returns {string}
 */
export const normalizeStage = (stage) => {
  return (stage || '')
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Matçın kateqoriya kodunu vahid formata ('10-11', '7-8', '9', '6') uyğunlaşdırır.
 * 
 * @param {string} div
 * @returns {string}
 */
export const normalizeMatchDivision = (div) => {
  if (!div) return '10-11';
  if (div === '11') return '10-11';
  if (div === '7' || div === '8') return '7-8';
  if (div === '9-10') return '9';
  return div;
};

/**
 * Matç üçün unikal semantik açar yaradır.
 * Komandaların sırasından asılı olmayaraq (A vs B və ya B vs A) eyni açar generasiya olunur.
 * 
 * @param {Object} m - Matç obyekti
 * @returns {string} Semantik açar
 */
export const getMatchSemanticKey = (m) => {
  if (!m) return '';
  const yr = m.year || '';
  const div = normalizeMatchDivision(m.division);
  const teams = [m.teamA || '', m.teamB || ''].sort().join('_vs_');
  const stage = normalizeStage(m.stage);
  const date = (m.date || '').slice(0, 10);
  return `${yr}_${div}_${teams}_${stage}_${date}`;
};

/**
 * İki dublikat matç obyektini birləşdirir və ən çox oyunçu statistikası olanı üstün tutur.
 * 
 * @param {Object} existing
 * @param {Object} incoming
 * @returns {Object}
 */
export const mergeMatchObjects = (existing, incoming) => {
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
