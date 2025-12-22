
import { GoogleGenAI } from "@google/genai";

export async function askGemini(prompt: string): Promise<string> {
  try {
    // Fix: Initialize GoogleGenAI using the recommended pattern and process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        // Fix: Moved system context to systemInstruction in config
        systemInstruction: "You are a helpful assistant in a developer Slack workspace. Keep your answers concise and professional.",
        temperature: 0.7,
        maxOutputTokens: 250,
      }
    });

    // Fix: Correctly access the .text property on the response object
    return response.text || "I'm sorry, I couldn't process that request right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI seems to be offline at the moment. Please try again later.";
  }
}
