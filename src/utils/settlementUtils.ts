import { OrderSettlement, ComputedSettlement, SettlementSummary, FilterState } from '../types';
import * as XLSX from 'xlsx';

export function computeSettlementItem(item: OrderSettlement): ComputedSettlement {
  const deliveryRate = item.orderQty > 0 ? (item.deliveredQty / item.orderQty) * 100 : 0;
  const grossAmount = item.deliveredQty * item.supplyPrice; // 총 입고금액 (합계금액)
  const totalCost = item.deliveredQty * item.unitCost; // 총 제조원가
  const commissionAmount = 0; // 쿠팡 로켓배송은 직매입으로 별도 판매수수료 없음 (0원)
  const totalDeductions = item.adCost + item.otherFee; // 총 차감금액 (광고비+기타물류비)
  const settlementAmount = grossAmount - totalDeductions; // 쿠팡 정산 수령 예정액 (합계금액 - 차감액)
  
  // 부가세 = (매입가 - 공급가) / 11
  const vat = (grossAmount - totalCost) / 11;
  // 세전이익 = 매입가 - 공급가 - 부가세 - 물류비 - 광고비
  const preTaxProfit = grossAmount - totalCost - vat - item.otherFee - item.adCost;
  // 종합소득세 (10%)
  const incomeTax = preTaxProfit > 0 ? preTaxProfit * 0.1 : 0;
  // 순이익 = 세전이익 - 종합소득세
  const netProfit = preTaxProfit - incomeTax;
  
  const netMargin = grossAmount > 0 ? (netProfit / grossAmount) * 100 : 0; // 순이익률 (%)
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0; // ROI (%)

  return {
    ...item,
    deliveryRate,
    grossAmount,
    totalCost,
    commissionAmount: 0,
    totalDeductions,
    settlementAmount,
    vat,
    incomeTax,
    netProfit,
    netMargin,
    roi,
  };
}

export function computeSummary(items: ComputedSettlement[]): SettlementSummary {
  let totalOrderQty = 0;
  let totalDeliveredQty = 0;
  let totalGross = 0;
  let totalCost = 0;
  let totalCommission = 0;
  let totalAdCost = 0;
  let totalOtherFee = 0;
  let totalDeductions = 0;
  let totalSettlement = 0;
  let totalVat = 0;
  let totalIncomeTax = 0;
  let totalNetProfit = 0;

  for (const item of items) {
    totalOrderQty += item.orderQty;
    totalDeliveredQty += item.deliveredQty;
    totalGross += item.grossAmount;
    totalCost += item.totalCost;
    totalCommission += item.commissionAmount;
    totalAdCost += item.adCost;
    totalOtherFee += item.otherFee;
    totalDeductions += item.totalDeductions;
    totalSettlement += item.settlementAmount;
    totalVat += item.vat;
    totalIncomeTax += item.incomeTax;
    totalNetProfit += item.netProfit;
  }

  const deliveryRate = totalOrderQty > 0 ? (totalDeliveredQty / totalOrderQty) * 100 : 0;
  const netMargin = totalGross > 0 ? (totalNetProfit / totalGross) * 100 : 0;
  const roi = totalCost > 0 ? (totalNetProfit / totalCost) * 100 : 0;

  return {
    totalCount: items.length,
    totalOrderQty,
    totalDeliveredQty,
    deliveryRate,
    totalGross,
    totalCost,
    totalCommission,
    totalAdCost,
    totalOtherFee,
    totalDeductions,
    totalSettlement,
    totalVat,
    totalIncomeTax,
    totalNetProfit,
    netMargin,
    roi,
  };
}

export function filterSettlements(items: ComputedSettlement[], filter: FilterState): ComputedSettlement[] {
  return items.filter((item) => {
    // Search keyword
    if (filter.searchKeyword.trim()) {
      const kw = filter.searchKeyword.toLowerCase().trim();
      const matchName = item.productName.toLowerCase().includes(kw);
      const matchPo = item.poNumber.toLowerCase().includes(kw);
      const matchCategory = item.category.toLowerCase().includes(kw);
      const matchMemo = (item.memo || '').toLowerCase().includes(kw);
      if (!matchName && !matchPo && !matchCategory && !matchMemo) return false;
    }

    // Category filter
    if (filter.category !== 'all' && item.category !== filter.category) {
      return false;
    }

    // Status filter
    if (filter.status !== 'all' && item.status !== filter.status) {
      return false;
    }

    // Frequency type filter
    if (filter.frequencyType !== 'all' && item.frequencyType !== filter.frequencyType) {
      return false;
    }

    // Date range filter
    if (filter.dateRange !== 'all') {
      const itemDate = new Date(item.poDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (filter.dateRange === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (item.poDate !== todayStr) return false;
      } else if (filter.dateRange === '7days') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        d7.setHours(0, 0, 0, 0);
        if (itemDate < d7) return false;
      } else if (filter.dateRange === '30days') {
        const d30 = new Date();
        d30.setDate(d30.getDate() - 30);
        d30.setHours(0, 0, 0, 0);
        if (itemDate < d30) return false;
      } else if (filter.dateRange === 'this_month') {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (itemDate < monthStart) return false;
      } else if (filter.dateRange === 'custom') {
        if (filter.startDate && item.poDate < filter.startDate) return false;
        if (filter.endDate && item.poDate > filter.endDate) return false;
      }
    }

    return true;
  });
}

// Grouping Helper
export function groupSettlements(items: ComputedSettlement[], groupBy: FilterState['groupBy']) {
  if (groupBy === 'none') return items;

  const map = new Map<string, ComputedSettlement[]>();

  items.forEach((item) => {
    let key = '';
    if (groupBy === 'date') key = item.poDate;
    else if (groupBy === 'product') key = item.productName;
    else if (groupBy === 'category') key = item.category;
    else if (groupBy === 'week') {
      // Calculate week string (e.g. 2026년 07월 3주차)
      const d = new Date(item.poDate);
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      const weekNum = Math.ceil((d.getDate() + firstDay.getDay()) / 7);
      key = `${d.getFullYear()}년 ${(d.getMonth() + 1).toString().padStart(2, '0')}월 ${weekNum}주차`;
    }

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });

  return Array.from(map.entries()).map(([groupKey, groupItems]) => {
    const summary = computeSummary(groupItems);
    return {
      groupKey,
      items: groupItems,
      summary,
    };
  });
}

// Formatters
export function formatKRW(val: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('ko-KR').format(val);
}

export function formatPercent(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
}

// Excel Export
export function exportToExcel(items: ComputedSettlement[], filename = '쿠팡로켓발주_정산서.xlsx') {
  const exportData = items.map((item) => ({
    '발주일자': item.poDate,
    '입고일자': item.deliveryDate,
    '발주번호': item.poNumber,
    '발주주기': item.frequencyType || '수시비정기',
    '카테고리': item.category,
    '상품명': item.productName,
    '발주수량': item.orderQty,
    '납품수량': item.deliveredQty,
    '납품률(%)': `${item.deliveryRate.toFixed(1)}%`,
    '매입가(원)': item.supplyPrice,
    '합계금액(매출)': item.grossAmount,
    '광고비(원)': item.adCost,
    '제조원가(원)': item.totalCost,
    '기타물류비(원)': item.otherFee,
    '총차감액(원)': item.totalDeductions,
    '부가세(원)': Math.round(item.vat),
    '종합소득세(원)': Math.round(item.incomeTax),
    '쿠팡정산액(원)': item.settlementAmount,
    '순이익(원)': item.netProfit,
    '순이익률(%)': `${item.netMargin.toFixed(1)}%`,
    'ROI(%)': `${item.roi.toFixed(1)}%`,
    '상태': item.status,
    '비고': item.memo || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '로켓발주정산');
  XLSX.writeFile(workbook, filename);
}
