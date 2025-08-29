import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in environment");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message = "", subject = "General", mode = "tutor" } = req.body;

    const system = `You are AI Tutor Bot, a helpful assistant for ${subject}. 
    If mode is 'solver' show step-by-step reasoning and final answer. 
    If mode is 'tutor', be clear, concise and give short examples when helpful.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `${system}\nUser: ${message}`;
    const result = await model.generateContent(prompt);

    const reply = result.response.text() || "(no reply)";
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err?.message || err);
    res.status(500).json({ error: "Chat failed" });
  }
});

// Quiz endpoint
app.post("/api/quiz", async (req, res) => {
  try {
    const { topic = "DSA", difficulty = "easy", count = 5 } = req.body;

    const prompt = `Create ${count} multiple-choice questions (A-D) on the topic: ${topic} 
    at ${difficulty} difficulty. For each question return JSON object with keys: 
    question, options (object with keys A,B,C,D), answer (A/B/C/D), explanation. 
    Return a JSON array only.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    const raw = result.response.text();
    let parsed = [];
    try {
      parsed = JSON.parse(raw);
    } catch {
      const firstBracket = raw.indexOf("[");
      const lastBracket = raw.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1) {
        try {
          parsed = JSON.parse(raw.slice(firstBracket, lastBracket + 1));
        } catch {}
      }
    }

    if (!parsed || parsed.length === 0) {
      return res.json({ raw });
    }

    res.json({ items: parsed });
  } catch (err) {
    console.error("Quiz error:", err?.message || err);
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
