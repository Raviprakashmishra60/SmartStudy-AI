// Optional real-AI backend for SmartStudy AI.
// Deploy this on Vercel alongside index.html — it becomes POST /api/tutor.
// The frontend (script.js) already calls this automatically and falls
// back to the offline knowledge base if it's missing or fails.
//
// Setup:
// 1. Get an API key from https://console.anthropic.com (or swap the
//    fetch below for OpenAI/any provider you prefer).
// 2. In your Vercel project settings, add an Environment Variable:
//    ANTHROPIC_API_KEY = your key
// 3. Deploy. That's it — no other code changes needed.
 
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }
 
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing 'prompt' in request body" });
  }
 
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key configured yet — tell the frontend to use its offline fallback.
    return res.status(503).json({ error: "AI backend not configured" });
  }
 
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      })
    });
 
    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Upstream AI error", detail: errText });
    }
 
    const data = await response.json();
    const answer = (data.content || [])
      .map(block => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();
 
    return res.status(200).json({ answer: answer || "Sorry, I couldn't generate an answer." });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
 