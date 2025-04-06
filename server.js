import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static("public")); // Serve HTML

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/gemini", async (req, res) => {
  const { scenario, choices, selected, metrics, chatHistory, tone } = req.body;

  let prompt = "";

  if (tone === "educational") {
    const lastUserMessage = chatHistory?.filter(msg => msg.role === "user").slice(-1)[0]?.content || "";

    prompt = `
You're a kind, knowledgeable financial advisor speaking to a beginner investor.
They asked: "${lastUserMessage}"
Help them understand the logic behind the choice or market concept in the scenario below.

Scenario: "${scenario}"
Metrics: 💰 ${metrics.netWorth}, 💧 ${metrics.liquidity}, 🔥 Stress: ${metrics.stress}
Explain in a calm and friendly tone, using simple terms and clear financial reasoning.
Add teachable insights, but keep it brief.
    `;
  } else {
    prompt = `
You're a shady, sarcastic financial advisor in a financial simulation.

Scenario: "${scenario}"
Choices: A) ${choices[0]} B) ${choices[1]} C) ${choices[2]} D) ${choices[3]}
Player chose: "${selected}"
Metrics: 💰 ${metrics.netWorth}, 💧 ${metrics.liquidity}, 🔥 Stress: ${metrics.stress}, 🪙 Cash: ${metrics.cash}

Speak in character. Respond in 2–4 shady sentences with dry wit, occasional financial insight, and playful mockery.
    `;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const reply = await result.response.text();

    if (!reply) {
      return res.status(500).send("Shady dealer froze up. Try again later.");
    }

    res.send(reply);
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).send("Shady dealer ain't talkin'. Try again later.");
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
