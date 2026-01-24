
import { GoogleGenAI } from "@google/genai";

/**
 * Technical assistant for BitChat. 
 * Using gemini-3-pro-preview as it handles complex reasoning and technical security queries better.
 */
export async function getGeminiResponse(prompt: string, history: { role: string, parts: { text: string }[] }[] = []) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: `You are the BitChat Mesh Assistant, a secure AI integrated into a privacy-focused decentralized messaging app. 
        - Your goal is to help users with technical queries, security tips, and general chat.
        - Keep responses concise and use clean Markdown.
        - BitChat uses Web Crypto API (AES-GCM) for client-side E2EE.
        - You are conversational but professional.`,
        temperature: 0.8,
        topP: 0.9,
      }
    });

    // Access .text property directly. Ensure it returns a string.
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error communicating with Gemini AI. Ensure the environment is correctly configured.";
  }
}
