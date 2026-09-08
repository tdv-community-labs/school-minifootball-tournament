/**
 * Google Gemini AI Tournament Assistant & Tuner
 * Direct compile-free REST client for Gemini 2.5 Flash
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_INSTRUCTION = `Sən TDV BTL Məktəb Mini-Futbol Turnirinin (Bakı Türk Liseyi) baş analitiki və süni intellekt köməkçisisən.
Vəzifən: Turnir məlumatlarını (matçlar, hesablar, qrup cədvəlləri, komandalar, bombardirlər, Sofascore reytinqləri) dərindən təhlil etmək, anomaliyaları, səhvləri aşkar etmək və adminə aydın, peşəkar, strukturlaşdırılmış məsləhətlər verməkdir.
Cavablarını səliqəli Azərbaycan dilində, emojilər və github-markdown formatında ver.`;

/**
 * Call Gemini 2.5 Flash REST API
 */
export const callGemini = async (prompt, apiKey, systemInstruction = SYSTEM_INSTRUCTION) => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Gemini API açarı tələb olunur. Zəhmət olmasa yuxarıdakı xanaya etibarlı API açarı daxil edin.');
  }

  const endpoint = `${GEMINI_API_URL}?key=${encodeURIComponent(apiKey.trim())}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP xətası ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API boş cavab qaytardı.');
  }

  return text;
};

/**
 * AI Deep Audit on Tournament Data
 */
export const auditTournamentWithAI = async (contextData, apiKey) => {
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

  return callGemini(prompt, apiKey);
};

/**
 * Natural Language Query / Tuning Assistant
 */
export const askGeminiTuner = async (question, contextData, apiKey) => {
  const prompt = `Adminin sualı / əmri: "${question}"

Turnir Konteksti:
- Aktiv İl: ${contextData.activeYear}
- Kateqoriya: ${contextData.activeDivision}
- Cəmi komandalar: ${contextData.totalClasses}
- Cəmi matçlar: ${contextData.totalMatches}
- Cari Qrup Cədvəli: ${JSON.stringify(contextData.standingsSummary || [])}
- Top Bombardirlər: ${JSON.stringify(contextData.topScorers || [])}

Sualı ətraflı və dəqiq cavablandır. Əgər admin hər hansı tənzimləmə və ya düzəliş istəyirsə, addım-addım nə etməli olduğunu göstər.`;

  return callGemini(prompt, apiKey);
};
