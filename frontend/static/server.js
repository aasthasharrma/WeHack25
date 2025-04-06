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

  console.log("Received request with tone:", tone);
  console.log("Chat history length:", chatHistory?.length || 0);

  const characterIntro =
    tone === "educational"
      ? "You are an extremely kind, patient, and supportive financial mentor who helps beginners understand complex financial concepts. You are exceptionally friendly, encouraging, and always positive. You never use sarcasm or technical jargon. You always start with a warm greeting and end with encouragement."
      : "You are a shady, sarcastic financial advisor in a simulation game who gives brutally honest but funny feedback in 2-3 sentences.";

  const prompt = `
${characterIntro}

IMPORTANT: You MUST be extremely nice, patient, and supportive. The user is learning about finance and needs encouragement.

Scenario: "${scenario}"
Choices: A) ${choices[0]} B) ${choices[1]} C) ${choices[2]} D) ${choices[3]}
User selected: "${selected}"
Stats: Net Worth = ${metrics.netWorth}, Liquidity = ${metrics.liquidity}, Stress = ${metrics.stress}, Cash = ${metrics.cash}

Chat history:
${chatHistory?.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")}

If this is a follow-up question (tone is "educational"), you MUST follow this exact format:
1. Start with: "That's a wonderful question! I'm so excited you're curious about this!"
2. Directly answer their question in simple, non-technical language
3. Briefly explain the financial concept in a friendly way
4. Offer a practical tip or insight
5. End with: "You're doing an amazing job learning about finance! Keep asking questions - that's how you become a confident investor!"

Remember to be exceptionally friendly, patient, and supportive throughout your response.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const reply = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("Empty reply");
    
    console.log("Sending response:", reply.substring(0, 50) + "...");
    res.send(reply);
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).send("The dealer ghosted you. Try again later.");
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});