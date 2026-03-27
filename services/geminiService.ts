import { GoogleGenAI, Type } from "@google/genai";
import { ExchangeRates, GroundingSource } from "../types";

interface ExchangeRateResponse {
  rates: ExchangeRates;
  sources: GroundingSource[];
}

export const fetchCurrentExchangeRates = async (
  apiKey?: string,
  currencies: string[] = ["USD", "CNY", "JPY", "EUR", "GBP", "HKD", "TWD", "VND", "THB", "PHP", "SGD", "AUD", "CAD"]
): Promise<ExchangeRateResponse> => {
  try {
    const effectiveApiKey = apiKey;
    if (!effectiveApiKey) {
      throw new Error("API Key is missing");
    }
    
    const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
    const modelId = "gemini-3-flash-preview"; 
    
    // Updated prompt to request Trading Base Rate (매매기준율) for multiple currencies
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `What is the current Trading Base Rate (매매기준율) for the following currencies to KRW today? Please provide the accurate value based on Naver Finance.
      Currencies: ${currencies.join(", ")}
      Return the result in the following JSON format: { "CURRENCY_CODE": number }`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const sources: GroundingSource[] = [];
    
    // Extract grounding chunks for sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Web Source",
            uri: chunk.web.uri || "#"
          });
        }
      });
    }

    // Default fallback values
    let rates: ExchangeRates = { 
      USD: 1400, CNY: 195, JPY: 9.5, EUR: 1500, GBP: 1800, 
      HKD: 180, TWD: 45, VND: 0.055, THB: 38, PHP: 25, 
      SGD: 1050, AUD: 920, CAD: 1020 
    };

    try {
      if (response.text) {
        // Extract JSON from text response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Merge parsed rates with defaults
          rates = { ...rates, ...parsed };
        }
      }
    } catch (e) {
      console.warn("Failed to parse JSON response from Gemini text, using fallback.", e);
    }

    return { rates, sources };

  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    // Return fallback values if API fails
    return {
      rates: { USD: 1400, CNY: 195 },
      sources: []
    };
  }
};