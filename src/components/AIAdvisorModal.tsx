import React, { useState } from 'react';
import { ComputedSettlement, SettlementSummary, AIAnalysisResult } from '../types';
import { X, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, HelpCircle, Loader2 } from 'lucide-react';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlements: ComputedSettlement[];
  summary: SettlementSummary;
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  settlements,
  summary,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("gemini_api_key") || "";
    if (!apiKey) {
      setErrorMsg("API 키가 설정되지 않았습니다. 상단 AI 가격 분석 폼에서 톱니바퀴 버튼을 눌러 API 키를 먼저 입력해주세요.");
      setLoading(false);
      return;
    }

    const prompt = `
당신은 한국 쿠팡 로켓배송(Rocket Delivery) / 벤더중앙 정산 및 마진 분석 전문 AI 컨설턴트입니다.
사용자가 제공한 쿠팡 발주 정산 데이터를 분석하여 실용적이고 구체적인 인사이트 리포트를 작성해주세요.

[전체 정산 요약]
- 총 발주 건수: ${summary.totalCount}건
- 총 발주 수량: ${summary.totalOrderQty.toLocaleString()}개
- 총 납품 수량: ${summary.totalDeliveredQty.toLocaleString()}개 (평균 납품률: ${summary.deliveryRate.toFixed(1)}%)
- 총 매출액 (매입 합계): ${summary.totalGross.toLocaleString()}원
- 총 제조원가: ${summary.totalCost.toLocaleString()}원
- 총 판매 수수료: ${summary.totalCommission.toLocaleString()}원
- 총 광고비: ${summary.totalAdCost.toLocaleString()}원
- 총 기타/물류비: ${summary.totalOtherFee.toLocaleString()}원
- 총 정산 수령액: ${summary.totalSettlement.toLocaleString()}원
- 최종 순이익: ${summary.totalNetProfit.toLocaleString()}원
- 평균 순이익률: ${summary.netMargin.toFixed(1)}%

[세부 정산 내역 샘플 (최대 10건)]
${JSON.stringify(
  settlements.slice(0, 10).map((s) => ({
    poNumber: s.poNumber,
    poDate: s.poDate,
    productName: s.productName,
    category: s.category,
    orderQty: s.orderQty,
    deliveredQty: s.deliveredQty,
    supplyPrice: s.supplyPrice,
    unitCost: s.unitCost,
    commissionRate: s.commissionRate,
    grossAmount: s.grossAmount,
    adCost: s.adCost,
    otherFee: s.otherFee,
    netProfit: s.netProfit,
    netMargin: s.netMargin,
  })),
  null,
  2
)}

다음 형식의 JSON 응답만 반환해주세요 (마크다운 포맷이나 다른 텍스트 없이 pure JSON):
{
  "overallEvaluation": "전체 수익성에 대한 종합 평가 2~3문장",
  "marginHealth": "양호" | "주의" | "위험",
  "keyTakeaways": [
    "핵심 분석 포인트 1",
    "핵심 분석 포인트 2",
    "핵심 분석 포인트 3"
  ],
  "productAdvice": [
    {
      "productName": "상품명",
      "issueOrHighlight": "문제점 또는 강점 요약",
      "actionRecommendation": "권장 실행 조치 (예: 광고비 % 줄이기, 매입가 재협상, 납품률 개선 등)"
    }
  ],
  "adSpendOptimization": "광고비 관련 구체적 조언 (광고비 비중 분석 및 적정 ROAS / 광고예산 추천)",
  "rocketDeliveryTip": "쿠팡 로켓배송 정산/발주 관련 실전 팁 (밀크런 운임, 입고 지연 방지, 카테고리 수수료 등)"
}
`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'AI 분석 응답을 불러오지 못했습니다.');
      }

      const rawData = await res.json();
      const generatedText = rawData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let analysis;
      try {
        const cleanedText = generatedText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
        analysis = JSON.parse(cleanedText);
      } catch (parseErr) {
        throw new Error('AI가 응답한 데이터를 분석할 수 없습니다.');
      }

      setResult(analysis);
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setErrorMsg(err.message || 'AI 진단 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold">쿠팡 로켓발주 AI 마진 진단 리포트</h2>
              <p className="text-2xs text-purple-200">Gemini AI 기반 수익성·광고비·수수료 최적화 진단</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {!result && !loading && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  현재 등록된 {settlements.length}건의 발주 데이터를 정밀 진단할까요?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI가 총 매출 대비 적자 상품, 과도한 광고비 지출 항목, 카테고리별 수수료율 적정성을 분석하여 개선책을 제시합니다.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-2xs max-w-lg mx-auto">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleRunAnalysis}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-md inline-flex items-center space-x-2 text-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI 마진 진단 시작하기</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-16 space-y-3">
              <Loader2 className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Gemini AI가 정산 내역 및 품목별 마진율을 정밀 분석 중입니다...
              </p>
              <p className="text-2xs text-slate-400">잠시만 기다려주세요 (약 3~5초 소요)</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Health status header */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-2xs text-slate-500">수익성 상태</div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        result.marginHealth === '양호'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : result.marginHealth === '주의'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {result.marginHealth}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      평균 순이익률: {summary.netMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRunAnalysis}
                  className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                >
                  재진단하기
                </button>
              </div>

              {/* Overall Evaluation */}
              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-1">
                <h4 className="font-bold text-purple-900 dark:text-purple-300 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1.5" /> 종합 진단평가
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {result.overallEvaluation}
                </p>
              </div>

              {/* Key Takeaways */}
              {result.keyTakeaways && result.keyTakeaways.length > 0 && (
                <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">핵심 체크 포인트</h4>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    {result.keyTakeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Product Level Recommendations */}
              {result.productAdvice && result.productAdvice.length > 0 && (
                <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">주요 품목별 조치 사항</h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {result.productAdvice.map((item, idx) => (
                      <div key={idx} className="py-2 space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.productName}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 text-2xs">
                          {item.issueOrHighlight}
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                          👉 {item.actionRecommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ad Spend Optimization Advice */}
              {result.adSpendOptimization && (
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300">광고비 집행 최적화 제안</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.adSpendOptimization}
                  </p>
                </div>
              )}

              {/* Rocket Delivery Tip */}
              {result.rocketDeliveryTip && (
                <div className="p-4 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 rounded-xl space-y-1">
                  <h4 className="font-bold text-sky-900 dark:text-sky-300">쿠팡 로켓 정산 실전 팁</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.rocketDeliveryTip}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="px-5 py-2 rounded-lg bg-slate-800 text-white font-medium">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
