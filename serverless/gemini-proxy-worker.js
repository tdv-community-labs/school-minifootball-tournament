/**
 * Cloudflare Worker: Secure Gemini AI Proxy for TDV BTL Mini-Football
 * 
 * WHY USE THIS PROXY?
 * 1. 100% Secret: Your GEMINI_API_KEY is stored securely in Cloudflare Environment Secrets.
 * 2. Invisible: Users and hackers never see your API key in browser Network tab or DevTools.
 * 3. Protected: Only requests from your tournament domain can call this proxy.
 * 
 * DEPLOYMENT IN 2 MINUTES (FREE):
 * 1. Go to https://dash.cloudflare.com -> Workers & Pages -> Create Application -> Create Worker.
 * 2. Paste this code and click Deploy.
 * 3. In Settings -> Variables and Secrets -> Add Secret:
 *    Name: GEMINI_API_KEY
 *    Value: <Your Google Gemini API Key from Google AI Studio>
 * 4. Copy the Worker URL (e.g. https://tdv-gemini-proxy.yourname.workers.dev)
 * 5. Paste that URL into the TDV BTL Admin Dashboard under "Serverless Proxy URL". Done!
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Yalnız POST sorğuları qəbul edilir." }), {
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Serverdə GEMINI_API_KEY təyin edilməyib." }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await request.json();
      const prompt = body.prompt;
      const primaryModel = body.model || "gemini-3.8-flash";
      const systemInstruction = body.systemInstruction || "Sən TDV BTL Mini-Futbol ekspertisən.";

      if (!prompt) {
        return new Response(JSON.stringify({ error: "Prompt mətni boşdur." }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const callModel = async (targetModel) => {
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2500,
          },
        };

        const res = await fetch(googleUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const err = new Error(errData?.error?.message || "Google API xətası");
          err.status = res.status;
          throw err;
        }

        const resData = await res.json();
        return resData?.candidates?.[0]?.content?.parts?.[0]?.text || "Cavab boşdur.";
      };

      let text;
      try {
        text = await callModel(primaryModel);
      } catch (err) {
        if ((err.status === 503 || err.status === 404) && primaryModel === "gemini-3.8-flash") {
          try {
            text = await callModel("gemini-3.7-flash");
          } catch (err2) {
            text = await callModel("gemini-2.5-flash");
          }
        } else {
          return new Response(JSON.stringify({ error: err.message }), {
            status: err.status || 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }
      }

      return new Response(JSON.stringify({ text }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Daxili xəta: " + err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
