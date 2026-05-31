// api/parse.js  –  Vercel Serverless Function
// Proxies requests to Google Gemini so the API key never touches the browser.
// Free tier: 1,500 requests/day, 0 cost — no billing required.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set." });
  }

  const { system, user } = req.body;
  if (!system || !user) {
    return res.status(400).json({ error: "Missing system or user prompt." });
  }

  // Try models in order until one works
  const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
  ];

  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
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
        responseMimeType: "application/json",
        temperature: 0.3,
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
        const errText = await geminiRes.text();
        lastError = `${model}: ${geminiRes.status} ${errText}`;
        console.error(`Model ${model} failed:`, lastError);
        continue; // try next model
      }

      const data = await geminiRes.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const clean = raw.replace(/```json|```/g, "").trim();
      const tasks = JSON.parse(clean);

      console.log(`Success with model: ${model}`);
      return res.status(200).json({ tasks });

    } catch (err) {
      lastError = `${model}: ${err.message}`;
      console.error(`Model ${model} threw:`, err.message);
      continue;
    }
  }

  // All models failed
  return res.status(500).json({ error: `All models failed. Last error: ${lastError}` });
}
