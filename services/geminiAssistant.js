/**
 * Google Gemini AI Tournament Assistant & Tuner
 * Default Model: gemini-3.7-flash (Latest Flash Model)
 * Fallback Model: gemini-2.5-flash
 * Supports:
 * - Direct Google Gemini REST API (with client-side key)
 * - Serverless Proxy Endpoint (Cloudflare Worker / Edge Proxy - 100% hidden key)
 */

export const DEFAULT_MODEL = 'gemini-3.7-flash';
export const FALLBACK_MODEL = 'gemini-2.5-flash';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_INSTRUCTION = `Sən TDV BTL Məktəb Mini-Futbol Turnirinin (Bakı Türk Liseyi) baş analitiki və süni intellekt köməkçisisən.
Vəzifən: Turnir məlumatlarını (matçlar, hesablar, qrup cədvəlləri, komandalar, bombardirlər, Sofascore reytinqləri) dərindən təhlil etmək, anomaliyaları, səhvləri aşkar etmək və adminə aydın, peşəkar, strukturlaşdırılmış məsləhətlər verməkdir.
Cavablarını səliqəli Azərbaycan dilində, emojilər və github-markdown formatında ver.`;

/**
 * Call Gemini REST API (Direct or via Secure Serverless Proxy)
 */
export const callGemini = async (prompt, options = {}, systemInstruction = SYSTEM_INSTRUCTION) => {
  const {
    apiKey = '',
    proxyUrl = '',
    model = DEFAULT_MODEL
  } = (typeof options === 'string' ? { apiKey: options } : options);

  // If proxy is configured, send request through the secure serverless proxy
  if (proxyUrl && proxyUrl.trim() !== '') {
    const cleanProxy = proxyUrl.trim();
    const response = await fetch(cleanProxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model,
        systemInstruction
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error || `Proxy server xətası: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || data.reply || 'Cavab alındı.';
  }

  // Direct Mode requires API Key
  const cleanKey = apiKey ? apiKey.trim() : '';
  if (!cleanKey) {
    throw new Error('Gemini API açarı və ya Təhlükəsiz Proxy ünvanı tələb olunur. Zəhmət olmasa Admin Paneldə qeyd edin.');
  }

  const doRequest = async (targetModel) => {
    const endpoint = `${GEMINI_BASE_URL}/${targetModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2500
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || `HTTP xətası ${response.status}: ${response.statusText}`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API boş cavab qaytardı.');
    }
    return text;
  };

  try {
    return await doRequest(model);
  } catch (err) {
    // If 3.7 model fails with 404 or unsupported on current tier, fallback to 2.5
    if (model === DEFAULT_MODEL && (err.status === 404 || /not found|unsupported/i.test(err.message))) {
      console.warn(`${DEFAULT_MODEL} əlçatan olmadı, ${FALLBACK_MODEL} modelinə keçilir...`);
      return await doRequest(FALLBACK_MODEL);
    }
    throw err;
  }
};

/**
 * AI Deep Audit on Tournament Data
 */
export const auditTournamentWithAI = async (contextData, options) => {
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

  return callGemini(prompt, options);
};

/**
 * Natural Language Query / Tuning Assistant
 */
export const askGeminiTuner = async (question, contextData, options) => {
  const prompt = `Adminin sualı / əmri: "${question}"

Turnir Konteksti:
- Aktiv İl: ${contextData.activeYear}
- Kateqoriya: ${contextData.activeDivision}
- Cəmi komandalar: ${contextData.totalClasses}
- Cəmi matçlar: ${contextData.totalMatches}
- Cari Qrup Cədvəli: ${JSON.stringify(contextData.standingsSummary || [])}
- Top Bombardirlər: ${JSON.stringify(contextData.topScorers || [])}

Sualı ətraflı və dəqiq cavablandır. Əgər admin hər hansı tənzimləmə və ya düzəliş istəyirsə, addım-addım nə etməli olduğunu göstər.`;

  return callGemini(prompt, options);
};
