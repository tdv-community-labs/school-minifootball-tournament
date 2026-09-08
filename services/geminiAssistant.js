/**
 * Google Gemini AI Tournament Assistant, Guardian & Public Chatbot
 * Features:
 * - Multi-Key Pooling & Auto-Failover: 3 Guardian keys for site checks & protection
 * - Dedicated Public Visitor Chatbot Key
 * - Model Auto-Fallback: gemini-3.7-flash -> gemini-2.5-flash on 503/429/404
 * - Serverless Proxy support
 */

export const DEFAULT_MODEL = 'gemini-3.7-flash';
export const FALLBACK_MODEL = 'gemini-2.5-flash';

// 1. Dedicated Public Chatbot Key (for all website visitors)
export const DEFAULT_PUBLIC_KEY = 'AQ.Ab8RN6LL1oCM_mOpYDNdL-77xjPogrh3pLNNwUyt90YvcRcRag';

// 2. Guardian & Site Audit Key Pool (3 Keys with automatic failover rotation)
export const DEFAULT_GUARDIAN_POOL = [
  'AQ.Ab8RN6Ll8Jxb9y6enZ15PPInR8IhiE8-thTTD_NhrzQ67C7aJg',
  'AQ.Ab8RN6IP3PfF2j4CP3L_NcAxzDo2sd-w6xtulo4khkuohcuCYA',
  'AQ.Ab8RN6LaifwdZxf-ilOlYytU3G99qEuxNjtwUMrtBPrH0wAbKQ'
];

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const ADMIN_SYSTEM_INSTRUCTION = `Sən TDV BTL Məktəb Mini-Futbol Turnirinin (Bakı Türk Liseyi) baş analitiki və süni intellekt köməkçisisən.
Vəzifən: Turnir məlumatlarını (matçlar, hesablar, qrup cədvəlləri, komandalar, bombardirlər, Sofascore reytinqləri) dərindən təhlil etmək, anomaliyaları, səhvləri aşkar etmək və adminə aydın, peşəkar, strukturlaşdırılmış məsləhətlər verməkdir.
Cavablarını səliqəli Azərbaycan dilində, emojilər və github-markdown formatında ver.`;

export const PUBLIC_SYSTEM_INSTRUCTION = `Sən TDV Bakı Türk Liseyinin Mini-Futbol Turnirinin rəsmi virtual bələdçisi və intellektual çatbotusan.
Vəzifən: Sayta daxil olan şagirdlərə, müəllimlərə və azarkeşlərə turnir cədvəli, lider komandalar, oyunçuların vurduğu qollar, keçirilmiş və gələcək oyunlar barədə nəzakətli, maraqlı və dəqiq məlumat verməkdir.
Xasiyyətin: Futbolu sevən, pozitiv, dəstəkçi və aydın danışan. Yalnız turnir məlumatlarına əsaslanaraq cavab ver. Əgər hər hansı məlumat bazada yoxdursa, bunu səmimi şəkildə bildir.`;

/**
 * Get active Guardian Key Pool (from storage or defaults)
 */
export const getGuardianKeyPool = () => {
  try {
    const custom = localStorage.getItem('btl_guardian_key_pool');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...DEFAULT_GUARDIAN_POOL];
};

/**
 * Get active Public Chatbot Key (from storage or default)
 */
export const getPublicChatKey = () => {
  try {
    const custom = localStorage.getItem('btl_public_chat_key');
    if (custom && custom.trim()) return custom.trim();
  } catch (e) {}
  return DEFAULT_PUBLIC_KEY;
};

/**
 * Call single key with auto-fallback from 3.7 to 2.5
 */
const executeSingleGeminiCall = async (prompt, key, model, systemInstruction) => {
  const doReq = async (targetModel) => {
    const endpoint = `${GEMINI_BASE_URL}/${targetModel}:generateContent?key=${encodeURIComponent(key.trim())}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2500
      }
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini API boş cavab qaytardı.');
    return text;
  };

  try {
    return await doReq(model);
  } catch (err) {
    // If 3.7 model fails with 503 (overloaded) or 404/unsupported, fallback immediately to 2.5 Flash
    if (model === DEFAULT_MODEL && (err.status === 503 || err.status === 404 || /high demand|unavailable|unsupported/i.test(err.message))) {
      console.warn(`${DEFAULT_MODEL} məşğuldur (${err.message}), ${FALLBACK_MODEL} modelinə keçilir...`);
      return await doReq(FALLBACK_MODEL);
    }
    throw err;
  }
};

/**
 * Call Gemini with Key Pool (Auto-failover between keys)
 */
export const callGeminiWithKeyPool = async (prompt, keyPool = [], options = {}, systemInstruction = ADMIN_SYSTEM_INSTRUCTION) => {
  const {
    proxyUrl = localStorage.getItem('btl_gemini_proxy_url') || '',
    model = localStorage.getItem('btl_gemini_model') || DEFAULT_MODEL
  } = options;

  // 1. If Serverless Proxy is configured, use it first
  if (proxyUrl && proxyUrl.trim()) {
    try {
      const response = await fetch(proxyUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, systemInstruction })
      });
      if (response.ok) {
        const data = await response.json();
        return data.text || data.reply || 'Cavab alındı.';
      }
    } catch (e) {
      console.warn('Proxy xətası, birbaşa açar hovuzuna keçilir:', e);
    }
  }

  // 2. Try keys in the pool sequentially
  const pool = (Array.isArray(keyPool) && keyPool.length > 0) ? keyPool : getGuardianKeyPool();
  let lastError = null;

  for (let i = 0; i < pool.length; i++) {
    const key = pool[i];
    if (!key || !key.trim()) continue;

    try {
      return await executeSingleGeminiCall(prompt, key, model, systemInstruction);
    } catch (err) {
      lastError = err;
      console.warn(`Açar #${i + 1} ilə xəta baş verdi: ${err.message}. Növbəti açara keçilir...`);
      // If 429 quota exhausted or 403 or 503, continue to next key in pool
      continue;
    }
  }

  throw new Error(lastError ? `Bütün AI açarları sınaqdan keçirildi, lakin cavab alınmadı: ${lastError.message}` : 'Etibarlı AI açarı tapılmadı.');
};

/**
 * Main Gemini call interface
 */
export const callGemini = async (prompt, options = {}, systemInstruction = ADMIN_SYSTEM_INSTRUCTION) => {
  const opts = typeof options === 'string' ? { apiKey: options } : options;
  const pool = opts.keyPool || (opts.apiKey ? [opts.apiKey] : getGuardianKeyPool());
  return callGeminiWithKeyPool(prompt, pool, opts, systemInstruction);
};

/**
 * Public Visitor Chatbot Query
 */
export const askPublicChatbot = async (question, contextData, options = {}) => {
  const publicApiKey = options.apiKey || getPublicChatKey();
  const pool = [publicApiKey, ...getGuardianKeyPool()]; // if public key hits limit, backup with pool

  const prompt = `İstifadəçinin / Ziyarətçinin sualı: "${question}"

Cari Turnir Bazasının Məlumatları:
- Aktiv İl: ${contextData.activeYear || 'Cari'}
- Kateqoriya: ${contextData.activeDivision || 'Bütün'}
- Qrup Cədvəli və Liderlər: ${JSON.stringify(contextData.standingsSummary || [])}
- Top Bombardirlər və Qol Statistikası: ${JSON.stringify(contextData.topScorers || [])}
- Son və Növbəti Matçlar: ${JSON.stringify(contextData.recentMatches || [])}

Ziyarətçiyə qısa, aydın, futbol həvəskarının dilində maraqlı cavab ver. Lazım gələrsə futbol emojiləri istifadə et.`;

  return callGeminiWithKeyPool(prompt, pool, options, PUBLIC_SYSTEM_INSTRUCTION);
};

/**
 * AI Deep Audit on Tournament Data (Admin Guardian)
 */
export const auditTournamentWithAI = async (contextData, options = {}) => {
  const prompt = `Cari turnir məlumatlarını təhlil et:
- Aktiv İl: ${contextData.activeYear || 'Bütün illər'}
- Aktiv Kateqoriya: ${contextData.activeDivision || 'Bütün kateqoriyalar'}
- Cəmi Siniflər: ${contextData.totalClasses || 0}
- Cəmi Matçlar: ${contextData.totalMatches || 0}
- Cəmi Oyunçular: ${contextData.totalPlayers || 0}
- Qrup Liderləri və Cədvəl İcmalı: ${JSON.stringify(contextData.standingsSummary || [])}
- Top Bombardirlər: ${JSON.stringify(contextData.topScorers || [])}
- Son Matçlar: ${JSON.stringify(contextData.recentMatches || [])}
- Sistemin Diaqnostika Xətaları: ${JSON.stringify(contextData.diagnosticIssues || [])}

Zəhmət olmasa aşağıdakı başlıqlarla qısa və peşəkar hesabat hazırla:
1. 🏆 Turnir Vəziyyəti və Liderlər İcmalı
2. ⚠️ Aşkar Edilən Potensial Problemlər və Anomaliyalar (əgər varsa)
3. 💡 Admin üçün Tövsiyələr və Tənzimləmə Təklifləri`;

  return callGemini(prompt, options, ADMIN_SYSTEM_INSTRUCTION);
};

/**
 * Natural Language Query / Tuning Assistant (Admin)
 */
export const askGeminiTuner = async (question, contextData, options = {}) => {
  const prompt = `Adminin sualı / əmri: "${question}"

Turnir Konteksti:
- Aktiv İl: ${contextData.activeYear}
- Kateqoriya: ${contextData.activeDivision}
- Cəmi komandalar: ${contextData.totalClasses}
- Cəmi matçlar: ${contextData.totalMatches}
- Cari Qrup Cədvəli: ${JSON.stringify(contextData.standingsSummary || [])}
- Top Bombardirlər: ${JSON.stringify(contextData.topScorers || [])}

Sualı ətraflı və dəqiq cavablandır. Əgər admin hər hansı tənzimləmə və ya düzəliş istəyirsə, addım-addım nə etməli olduğunu göstər.`;

  return callGemini(prompt, options, ADMIN_SYSTEM_INSTRUCTION);
};
