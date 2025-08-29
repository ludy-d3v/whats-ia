import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateReply(userText: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(userText.slice(0, 500));
    return result.response.text() || "Ok 👍";
  } catch (err: any) {
    console.error("Erro Gemini:", err.message);
    return "⚠️ IA indisponível, resposta mockada.";
  }
}