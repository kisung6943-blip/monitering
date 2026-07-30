export async function callGeminiGenerateContent(apiKey: string, payload: any) {
  const cleanKey = apiKey ? apiKey.trim() : "";
  if (!cleanKey) {
    throw new Error("Gemini API 키가 입력되지 않았습니다. 상단 AI 가격 분석 폼에서 톱니바퀴 버튼을 눌러 API 키를 먼저 입력해주세요.");
  }

  const candidateEndpoints = [
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent",
  ];

  let lastError: any = null;

  for (const endpoint of candidateEndpoints) {
    try {
      const response = await fetch(`${endpoint}?key=${cleanKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        return responseData;
      }

      const errorMsg = responseData.error?.message || "";

      // Invalid key check
      if (errorMsg.includes("API key not valid") || errorMsg.includes("API_KEY_INVALID")) {
        throw new Error(`Gemini API 키가 유효하지 않습니다. 올바른 키를 입력했는지 확인해주세요. (입력된 키: ${cleanKey.substring(0, 8)}...)`);
      }

      // If model not found or version mismatch, retry with fallback model candidate
      if (response.status === 404 || errorMsg.includes("not found") || errorMsg.includes("no longer available") || errorMsg.includes("not supported")) {
        console.warn(`[Gemini API] ${endpoint} error: ${errorMsg}, retrying with next model...`);
        lastError = new Error(errorMsg || "Model not found on endpoint");
        continue;
      }

      throw new Error((errorMsg || `AI 분석 서버(Google)와의 통신에 실패했습니다.`) + ` (입력된키: ${cleanKey.substring(0, 8)}...)`);
    } catch (err: any) {
      if (err.message && err.message.includes("유효하지 않습니다")) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error(`Gemini API 호출 중 오류가 발생했습니다. (입력된 키: ${cleanKey.substring(0, 8)}...)`);
}
