import { GoogleGenAI, Type } from "@google/genai";
import { ExchangeRates, GroundingSource } from "../types";

interface ExchangeRateResponse {
  rates: ExchangeRates;
  sources: GroundingSource[];
  error?: string;
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
      Currencies: ${currencies.join(", ")}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: currencies.reduce((acc, curr) => {
            acc[curr] = { type: Type.NUMBER };
            return acc;
          }, {} as any)
        }
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
        const parsed = JSON.parse(response.text);
        // Merge parsed rates with defaults
        rates = { ...rates, ...parsed };
      }
    } catch (e) {
      console.warn("Failed to parse JSON response from Gemini, using fallback.", e);
    }

    return { rates, sources };

  } catch (error: any) {
    console.error("Error fetching exchange rates:", error);
    
    let errorMessage = "환율 정보를 가져오지 못했습니다.";
    if (error.message?.includes("400") || error.message?.includes("INVALID_ARGUMENT")) {
      errorMessage = "API 키가 올바르지 않거나, 해당 키에서 'Google 검색' 도구를 사용할 수 없습니다. (결제 수단 등록 확인 필요)";
    } else if (error.message?.includes("404") || error.message?.includes("NOT_FOUND")) {
      errorMessage = "모델을 찾을 수 없습니다. API 키가 최신 모델(Gemini 3)을 지원하는지 확인하세요.";
    } else if (error.message?.includes("429")) {
      errorMessage = "API 호출 한도를 초과했습니다. 잠시 후 다시 시도하세요.";
    } else {
      errorMessage = error.message || errorMessage;
    }

    return {
      rates: { USD: 1400, CNY: 195 },
      sources: [],
      error: errorMessage
    };
  }
};
