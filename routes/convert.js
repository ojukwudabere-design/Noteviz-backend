const express = require("express");
const jwt = require("jsonwebtoken");
const History = require("../models/History");
const router = express.Router();

// Attach userId if a valid token is present, but don't block guests
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      req.userId = decoded.userId;
    } catch (e) { /* ignore invalid token, treat as guest */ }
  }
  next();
}

router.post("/", optionalAuth, async (req, res) => {
  const { notes } = req.body;
  if (!notes || !notes.trim()) {
    return res.status(400).json({ message: "Notes are required." });
  }

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Convert these lecture notes into infographic JSON. Return ONLY valid JSON, no markdown, no explanation:
{
  "title": "Short catchy title (max 6 words)",
  "subtitle": "One sentence overview",
  "points": [{"heading":"2-4 word label","point":"Key point in 1-2 sentences","detail":"Extra detail or null"}],
  "summary": "One powerful takeaway sentence",
  "tags": ["tag1","tag2","tag3"]
}
NOTES:
${notes}`
        }]
      })
    });

    const data = await resp.json();
    if (data.error) {
      return res.status(502).json({ message: "AI error: " + data.error.message });
    }

    const raw = data.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response.");
    const infographic = JSON.parse(jsonMatch[0]);

    // Save to history only if the user is logged in
    if (req.userId) {
      await History.create({
        user: req.userId,
        title: infographic.title,
        notes,
        infographic,
      });
    }

    res.json({ infographic });
  } catch (e) {
    res.status(500).json({ message: e.message || "Conversion failed." });
  }
});

module.exports = router;