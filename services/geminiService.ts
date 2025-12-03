import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAiResponse = async (
  context: string, 
  prompt: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const finalPrompt = `
      You are an AI Meeting Assistant for Taskflow-AI-Iota.
      Context of current conversation/meeting logs:
      ${context}
      
      User Request: ${prompt}
      
      Provide a helpful, concise response suitable for a chat interface.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I am currently unavailable. Please check your API key.";
  }
};