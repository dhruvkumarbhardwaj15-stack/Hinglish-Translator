
import { GoogleGenAI, Type } from "@google/genai";
import { HindiResult } from "../types.ts";

export const transliterateHinglish = async (input: string): Promise<HindiResult[]> => {
  if (!input.trim()) return [];

  // Create instance right before call for the latest key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest", // Optimized for ultra-low latency
    contents: `Convert to Devanagari: "${input}"`,
    config: {
      systemInstruction: "Convert Romanized Hindi to Devanagari. Return a JSON array of objects with 'hindi' (Devanagari) and 'context' (brief type). Max 3 variations.",
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for immediate output
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            hindi: {
              type: Type.STRING,
            },
            context: {
              type: Type.STRING,
            }
          },
          required: ["hindi", "context"]
        }
      }
    }
  });

  try {
    const results = JSON.parse(response.text || "[]");
    return results;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return [];
  }
};
