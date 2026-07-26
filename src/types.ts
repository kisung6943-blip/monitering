export interface Product {
  id: string;
  name: string;
  naverUrl?: string;
  coupangUrl?: string;
  keywords?: string[];
  keywordVolumes?: string[];
}

export interface PriceLog {
  id: string;
  date: string; // YYYY-MM-DD
  productId: string;
  naverPrice: number;
  naverShipping: number;
  naverTotal: number;
  coupangSeller: string;
  coupangPrice: number;
  coupangShipping: number;
  coupangTotal: number;
  difference: number; // naverTotal - coupangTotal
  keywordRanks?: string[]; // Legacy/Naver ranks
  coupangKeywordRanks?: string[]; // Coupang specific ranks
  memo?: string; // Optional memo for the date
}

export interface ProductMaster {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplyPrice: number; // 쿠팡 매입 단가 (원)
  unitCost: number; // 제조/사입 원가 (원)
  commissionRate: number; // 판매 수수료율 (%)
  defaultOtherFee: number; // 개당 기본 기타/물류비 (원)
}

export interface OrderSettlement {
  id: string;
  poNumber: string; // 발주번호 (예: PO-20260720-01)
  poDate: string; // 발주일자 (YYYY-MM-DD)
  deliveryDate: string; // 입고/납품일자 (YYYY-MM-DD)
  productId: string;
  productName: string; // 상품명
  category: string; // 카테고리
  orderQty: number; // 발주수량
  deliveredQty: number; // 납품수량
  supplyPrice: number; // 매입가 (단가 원)
  unitCost: number; // 제조/사입 원가 (단가 원)
  commissionRate: number; // 쿠팡 판매 수수료율 (%)
  adCost: number; // 광고비 (원)
  otherFee: number; // 기타비용 / 밀크런 운임 (원)
  status: '발주완료' | '입고완료' | '정산완료' | '취소';
  memo?: string;
  frequencyType?: '주간정기' | '수시비정기'; // 발주 주기 구분
}

export interface ComputedSettlement extends OrderSettlement {
  deliveryRate: number; // 납품률 (%)
  grossAmount: number; // 합계금액 (납품수량 * 매입가)
  totalCost: number; // 총 원가 (납품수량 * 원가)
  commissionAmount: number; // 수수료 금액 (합계금액 * 수수료율%)
  totalDeductions: number; // 총 차감액 (수수료금액 + 광고비 + 기타비용)
  settlementAmount: number; // 정산 수령액 (합계금액 - 총차감액)
  vat: number; // 부가세
  incomeTax: number; // 종합소득세 (10%)
  netProfit: number; // 순이익
  netMargin: number; // 순이익률 (%)
  roi: number; // 원가 대비 수익률 (%)
}

export interface SettlementSummary {
  totalCount: number;
  totalOrderQty: number;
  totalDeliveredQty: number;
  deliveryRate: number;
  totalGross: number; // 총 합계금액 (매출)
  totalCost: number; // 총 제조원가
  totalCommission: number; // 총 판매 수수료
  totalAdCost: number; // 총 광고비
  totalOtherFee: number; // 총 기타비용
  totalDeductions: number; // 총 차감금액
  totalSettlement: number; // 총 정산 수령액
  totalVat: number; // 총 부가세
  totalIncomeTax: number; // 총 종합소득세
  totalNetProfit: number; // 최종 순이익
  netMargin: number; // 평균 순이익률 %
  roi: number; // 평균 ROI %
}

export interface DailyProductAdCost {
  id: string;
  date: string; // YYYY-MM-DD (발주일 또는 입고일)
  productId: string;
  productName: string;
  adCost: number; // 광고비 (원)
  memo?: string;
}

export type ViewMode = 'table' | 'analytics' | 'products' | 'daily_ad' | 'ad_allocator' | 'ai_advisor';

export interface FilterState {
  searchKeyword: string;
  dateRange: 'all' | 'today' | '7days' | '30days' | 'this_month' | 'custom';
  startDate: string;
  endDate: string;
  category: string;
  status: string;
  frequencyType: 'all' | '주간정기' | '수시비정기';
  groupBy: 'none' | 'date' | 'product' | 'week' | 'category';
}

export interface AIAnalysisResult {
  overallEvaluation: string;
  marginHealth: '양호' | '주의' | '위험';
  keyTakeaways: string[];
  productAdvice: Array<{
    productName: string;
    issueOrHighlight: string;
    actionRecommendation: string;
  }>;
  adSpendOptimization: string;
  rocketDeliveryTip: string;
}
