const axios = require("axios");
const express = require("express");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// PDF -> text
router.post("/pdf", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });
  let parser;
  try {
    parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    res.json({ text: result.text.trim() });
  } catch (e) {
    console.error("PDF ERROR:", e);
    res.status(500).json({ message: "Could not read PDF." });
  } finally {
    if (parser) await parser.destroy();
  }
});
// Image -> text (via Groq vision model)
router.post("/image", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });
  try {
    const base64 = req.file.buffer.toString("base64");
    const resp = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "qwen/qwen3.6-27b",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${base64}` } },
            { type: "text", text: "Extract all readable text from this image of lecture notes. Return only the extracted text, nothing else." }
          ]
        }]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.GROQ_API_KEY,
        }
      }
    );
    const data = resp.data;
    const text = data.choices?.[0]?.message?.content || "";
    res.json({ text: text.trim() });
  } catch (e) {
    console.error("IMAGE ERROR:", e.response?.data || e.message);
    const groqMessage = e.response?.data?.error?.message;
    res.status(500).json({ message: groqMessage || "Could not read image." });
  }
});

module.exports = router;