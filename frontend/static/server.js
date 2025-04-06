import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
console.log("🔐 GEMINI API KEY:", process.env.GEMINI_API_KEY);

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/test", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Roast someone who bought the dip." }] }],
    });

    const reply = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    res.send(reply || "No shady reply generated.");
  } catch (err) {
    console.error("❌ Gemini error:", err);
    res.status(500).send("Gemini failed.");
  }
});

app.post("/gemini", async (req, res) => {
  try {
    const { scenario, choices, selected, metrics } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      You are a shady crypto dealer giving advice. The user is in this scenario:
      "${scenario}"
      
      They chose: "${selected}"
      
      Their current metrics:
      - Net Worth: ${metrics.netWorth}
      - Liquidity: ${metrics.liquidity}
      - Stress Level: ${metrics.stress}
      - Cash: ${metrics.cash}
      
      Give them a short, sarcastic, and shady response (max 2 sentences) about their choice.
      Be funny and use emojis.
    `;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    const reply = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    res.send(reply || "No shady reply generated.");
  } catch (err) {
    console.error("❌ Gemini error:", err);
    res.status(500).send("Gemini failed to generate a response.");
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});