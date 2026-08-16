import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required to parse price details with AI.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "텍스트 내용이 올바르지 않습니다." });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `You are an expert price auditor. Analyze the following raw copied text from a Korean e-commerce site (Naver Shopping or Coupang). 
Extract the primary selling price, shipping fee, seller name, product name, and the platform.

Here is the raw text to analyze:
"""
${text}
"""`,
      config: {
        systemInstruction: "You strictly extract price details. Identify prices, shipping costs, and seller names from text snippets, handles, or option details. Be precise. If price has discount, extract the final price the customer pays.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            platform: {
              type: Type.STRING,
              description: "Platform name: 'naver', 'coupang', or 'unknown'."
            },
            price: {
              type: Type.INTEGER,
              description: "The main selling price of the product as integer (e.g. 5890). Extract 0 if not found."
            },
            shipping: {
              type: Type.INTEGER,
              description: "The shipping fee as integer (e.g. 3000). If free or 0, return 0."
            },
            seller: {
              type: Type.STRING,
              description: "The store or seller name (e.g. '휘슬러as', '세계명품', '쿠팡')."
            },
            productName: {
              type: Type.STRING,
              description: "The extracted product name or key terms."
            }
          },
          required: ["platform", "price", "shipping", "seller", "productName"]
        }
      }
    });

    const parsedText = response.text;
    if (!parsedText) {
      return res.status(500).json({ error: "AI가 데이터를 파싱하지 못했습니다." });
    }

    const result = JSON.parse(parsedText.trim());
    return res.json({ success: true, ...result });

  } catch (error: any) {
    console.error("AI Price Parse Error:", error);
    return res.status(500).json({ 
      error: error.message || "서버 통신 중 오류가 발생했습니다." 
    });
  }
}
