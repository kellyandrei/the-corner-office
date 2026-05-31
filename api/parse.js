// api/parse.js  –  Vercel Serverless Function
// Proxies requests to Google Gemini (free tier) so the API key never touches the browser.
// Free tier: 1,500 requests/day, 0 cost — no billing required.
// Model: gemini-1.5-flash (fast, free, structured JSON output support)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set in environment variables." });
  }

  const { system, user } = req.body;
  if (!system || !user) {
    return res.status(400).json({ error: "Missing system or user prompt." });
  }

  // Gemini endpoint — gemini-1.5-flash is free tier eligible
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    // System instruction is a top-level field in Gemini
    systemInstruction: {
      parts: [{ text: system }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: user }],
      },
    ],
    generationConfig: {
      // Force JSON output — Gemini 1.5 Flash supports this natively
      responseMimeType: "application/json",
      temperature: 0.3,   // Low temp = consistent structured output
      maxOutputTokens: 2048,
    },
  };

  try {
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: err });
    }

    const data = await geminiRes.json();

    // Extract text from Gemini response structure
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Strip any accidental markdown fences just in case
    const clean = raw.replace(/```json|```/g, "").trim();
    const tasks = JSON.parse(clean);

    return res.status(200).json({ tasks });
  } catch (err) {
    console.error("Parse error:", err);
    return res.status(500).json({ error: "Failed to parse tasks. " + err.message });
  }
}
