
import { GoogleGenAI, Type } from "@google/genai";
import { AdvancedTransliterationResult } from "../types.ts";

export const transliterateHinglish = async (input: string): Promise<AdvancedTransliterationResult> => {
  if (!input.trim()) {
    return { results: [], words: [] };
  }

  // Create GenAI client with correct telemetry header
  const ai = new GoogleGenAI({ 
    apiKey: process.env.API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash", 
    contents: `Analyze and transliterate this Hinglish (Romanized Hindi) sentence: "${input}". 
Identify each word, provide multiple Devanagari spelling alternatives with context, and also provide 2-3 full sentence options.`,
    config: {
      systemInstruction: `You are an expert Hinglish (Romanzed Hindi) to Devanagari transliterator and translation aid. 
Break down the Hinglish sentence into its constituent words/tokens in correct sequence order.
For each word/token:
1. Provide the original Hinglish spelling (e.g. "main").
2. Provide a list of 1 to 4 Devanagari spelling 'alternatives' (e.g., for "main", provide "मैं" with meaning "I, me" and "में" with meaning "in, inside", and maybe "मैल" meaning "dirt").
3. For each spelling alternative, provide a brief English meaning/context clue and mark 'isDefault: true' for the most standard/likely transliteration spelling in this sentence context. Make sure exactly one alternative has 'isDefault: true'.

Also provide 2-3 full-sentence Devanagari conversions under 'results' with brief description of their context (e.g. informal, formal, different meanings).
Your response must strictly match the JSON schema.`,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for ultra-fast performance
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          results: {
            type: Type.ARRAY,
            description: "2-3 variations of the translated/transliterated sentence as a whole",
            items: {
              type: Type.OBJECT,
              properties: {
                hindi: { type: Type.STRING },
                context: { type: Type.STRING }
              },
              required: ["hindi", "context"]
            }
          },
          words: {
            type: Type.ARRAY,
            description: "The constituent word tokens in sequence matching the user's input phrase",
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                alternatives: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      hindi: { type: Type.STRING },
                      meaning: { type: Type.STRING },
                      isDefault: { type: Type.BOOLEAN }
                    },
                    required: ["hindi", "meaning", "isDefault"]
                  }
                }
              },
              required: ["original", "alternatives"]
                }
              }
            },
        required: ["results", "words"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}") as AdvancedTransliterationResult;
    
    // Safety processing: make sure selectedHindi is initialized to the default alternative
    if (data.words && Array.isArray(data.words)) {
      data.words = data.words.map(w => {
        const defaultAlt = w.alternatives.find(a => a.isDefault) || w.alternatives[0];
        return {
          ...w,
          selectedHindi: defaultAlt ? defaultAlt.hindi : ""
        };
      });
    }

    return {
      results: data.results || [],
      words: data.words || []
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return { results: [], words: [] };
  }
};

