import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/gemini", async (req, res) => {
  const { scenario, choices, selected, metrics, chatHistory, tone } = req.body;

  const characterIntro =
    tone === "educational"
      ? "You are now a chill but helpful finance mentor explaining the concepts in detail to a beginner who just made a decision. Keep it encouraging and easy to follow."
      : "You are a shady, sarcastic financial advisor in a simulation game who gives brutally honest but funny feedback in 2-3 sentences.";

  const prompt = `
${characterIntro}

Scenario: "${scenario}"
Choices: A) ${choices[0]} B) ${choices[1]} C) ${choices[2]} D) ${choices[3]}
User selected: "${selected}"
Stats: Net Worth = ${metrics.netWorth}, Liquidity = ${metrics.liquidity}, Stress = ${metrics.stress}, Cash = ${metrics.cash}

Chat history:
${chatHistory?.map((msg) => `${msg.role === "user" ? "User" : "Dealer"}: ${msg.content}`).join("\n")}

Respond in-character with insight based on their choice. Add humor if shady, clarity if educational.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const reply = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("Empty reply");
    res.send(reply);
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).send("The dealer ghosted you. Try again later.");
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
