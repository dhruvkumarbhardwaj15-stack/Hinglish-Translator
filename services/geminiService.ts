
import { GoogleGenAI, Type } from "@google/genai";
import { HindiResult } from "../types.ts";

export const transliterateHinglish = async (input: string): Promise<HindiResult[]> => {
  if (!input.trim()) return [];

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Convert this Romanized Hindi (Hinglish) into Devanagari Hindi: "${input}"`,
    config: {
      systemInstruction: "You are a specialized Hinglish-to-Hindi transliterator. Given Romanized Hindi text, return an array of possible Devanagari translations. Include formal variations, common spellings, and informal versions if applicable. Keep the context brief.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            hindi: {
              type: Type.STRING,
              description: "The Devanagari Hindi word or phrase."
            },
            context: {
              type: Type.STRING,
              description: "Brief context about this specific variation (e.g., 'Formal', 'Informal', 'Common Spelling')."
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
