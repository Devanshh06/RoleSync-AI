import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

const GEMINI_API_KEYS = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [];

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const geminiClients = GEMINI_API_KEYS.map(apiKey => new GoogleGenAI({ apiKey }));
const groqClient = new Groq({ apiKey: GROQ_API_KEY });

let currentGeminiIndex = 0;

/**
 * Generates text using a round-robin rotation of Gemini keys.
 * Falls back to Groq if all Gemini keys fail.
 * 
 * @param {string} prompt The user prompt.
 * @param {object} options Optional settings like systemInstruction.
 * @returns {string} The generated response text.
 */
export async function generateAIContent(prompt, options = {}) {
  const { systemInstruction, responseSchema } = options;
  
  // Try all Gemini keys before falling back to Groq
  for (let attempt = 0; attempt < geminiClients.length; attempt++) {
    const ai = geminiClients[currentGeminiIndex];
    // Rotate index for the next request
    const indexUsed = currentGeminiIndex;
    currentGeminiIndex = (currentGeminiIndex + 1) % geminiClients.length;

    try {
      console.log(`[AI Client] Attempting with Gemini key index ${indexUsed}...`);
      
      const config = {
        model: 'gemini-2.5-flash',
        contents: prompt
      };
      
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      
      if (responseSchema) {
        config.responseMimeType = "application/json";
        // Convert to Gemini schema format if needed, but for simplicity, we pass raw JSON string
        // Actually the @google/genai takes responseSchema. We assume it's properly formatted.
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent(config);
      return response.text;
    } catch (error) {
      console.warn(`[AI Client] Gemini key index ${indexUsed} failed:`, error.message);
    }
  }

  // Fallback to Groq
  console.log(`[AI Client] All Gemini keys failed. Falling back to Groq...`);
  try {
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    // If responseSchema exists, append to system instruction for Groq since groq doesn't natively support strict schema objects in all models
    if (responseSchema) {
      messages.push({ role: "system", content: "You must respond with valid JSON matching this schema: " + JSON.stringify(responseSchema) });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await groqClient.chat.completions.create({
      messages,
      model: "llama3-8b-8192", // Fast standard model
      response_format: responseSchema ? { type: "json_object" } : undefined
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error(`[AI Client] Groq fallback also failed:`, error.message);
    throw new Error("All AI providers failed to process the request.");
  }
}
