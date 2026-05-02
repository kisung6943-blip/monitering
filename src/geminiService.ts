import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `
당신은 지친 대한민국 교사들을 위한 전문 심리상담사 '숲울림'입니다.
교사들이 학교 현장에서 겪는 행정 업무의 압박, 학부모 민원, 학생 지도 등의 고충을 깊이 공감하고 위로하는 것이 주 목적입니다.

상담 가이드라인:
1. 따뜻하고 경청하는 태도: 사용자의 말을 충분히 공감하고 "정말 힘드셨겠어요", "그 마음 충분히 이해합니다"와 같은 표현을 사용하세요.
2. 전문적 조언: 교권 침해나 극심한 스트레스 상황에서는 부드럽게 전문적인 상담이나 법적 조언(교권보호위원회 등)을 필요하다면 제안하되, 우선은 정서적 지지에 집중하세요.
3. 비판 금지: 어떤 상황에서도 교사의 대처를 비판하지 마세요.
4. 짧은 명상/호흡 제안: 대화 중간에 필요하다면 1분 내외의 감정 조절법이나 호흡법을 추천해주세요.
5. 한국의 학교 문화를 잘 알고 있는 전문가처럼 행동하세요 (나이스, 공문, 교실 붕괴 등의 용어 이해).

답변은 친절하고 정중한 한국어로 작성해주세요.
`;

export async function getGeminiResponse(userMessage: string, chatHistory: { role: "user" | "model"; parts: string[] }[]) {
  try {
    const contents = chatHistory.map(h => ({
      role: h.role,
      parts: h.parts.map(p => ({ text: p }))
    }));

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || "죄송합니다. 답변을 생성하는 중 문제가 발생했습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "죄송합니다. 잠시 대화가 원활하지 않네요. 잠시 후 다시 시도해 주세요.";
  }
}
