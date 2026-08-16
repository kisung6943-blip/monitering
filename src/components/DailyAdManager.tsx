import React, { useState } from 'react';
import { DailyProductAdCost, ProductMaster, OrderSettlement } from '../types';
import { formatKRW, formatNumber } from '../utils/settlementUtils';
import { Calendar, Plus, Trash2, RefreshCw, Save, DollarSign, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface DailyAdManagerProps {
  dailyAdCosts: DailyProductAdCost[];
  products: ProductMaster[];
  settlements: OrderSettlement[];
  onSaveDailyAd: (item: Omit<DailyProductAdCost, 'id'>) => void;
  onUpdateDailyAd: (id: string, cost: number, memo?: string) => void;
  onDeleteDailyAd: (id: string) => void;
  onSyncAdToOrders: (dailyAds: DailyProductAdCost[]) => void;
  onUpdateProduct: (item: ProductMaster) => void;
}

export const DailyAdManager: React.FC<DailyAdManagerProps> = ({
  dailyAdCosts,
  products,
  settlements,
  onSaveDailyAd,
  onUpdateDailyAd,
  onDeleteDailyAd,
  onSyncAdToOrders,
  onUpdateProduct,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [adCostInput, setAdCostInput] = useState<string>('');
  const [memoInput, setMemoInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'list'>('matrix');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // 최근 7일 날짜 배열 생성
  const getRecentDates = (daysCount = 7) => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const datesList = getRecentDates(7);

  // 등록 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseInt(adCostInput, 10);
    if (isNaN(cost) || cost < 0) {
      alert('올바른 광고 금액을 입력하세요.');
      return;
    }
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) {
      alert('제품을 선택해주세요.');
      return;
    }

    onSaveDailyAd({
      date: selectedDate,
      productId: prod.id,
      productName: prod.name,
      adCost: cost,
      memo: memoInput,
    });

    setAdCostInput('');
    setMemoInput('');
    triggerSyncMsg('광고비가 등록되었으며 발주 내역에 연동되었습니다.');
  };

  // 매트릭스 셀 광고비 직접 변경
  const handleMatrixCellChange = (date: string, prod: ProductMaster, valStr: string) => {
    const cost = parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
    const existing = dailyAdCosts.find(
      (a) => a.date === date && a.productId === prod.id
    );

    if (existing) {
      if (cost === 0) {
        onDeleteDailyAd(existing.id);
      } else {
        onUpdateDailyAd(existing.id, cost, existing.memo);
      }
    } else if (cost > 0) {
      onSaveDailyAd({
        date,
        productId: prod.id,
        productName: prod.name,
        adCost: cost,
        memo: '매트릭스 빠른입력',
      });
    }
  };

  const triggerSyncMsg = (msg: string) => {
    setSyncSuccessMsg(msg);
    setTimeout(() => {
      setSyncSuccessMsg(null);
    }, 3500);
  };

  const handleManualSync = () => {
    onSyncAdToOrders(dailyAdCosts);
    triggerSyncMsg('제품별 일별 광고비가 발주 정산 내역에 모두 동기화되었습니다!');
  };

  // 총 광고비 계산
  const totalDailyAdSpend = dailyAdCosts.reduce((acc, curr) => acc + curr.adCost, 0);

  return (
    <div className="space-y-6">
      {/* 상단 안내 & 통계 헤더 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-lg mb-1">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              <h2>제품별 / 일별 광고비 입력 관리</h2>
            </div>
            <p className="text-sm text-slate-600">
              쿠팡 로켓배송은 판매수수료(0%) 대신 <strong className="text-slate-900 font-semibold">광고비(CPC/기획전)</strong>가 주요 정산 차감 항목입니다. 
              날짜와 제품별로 광고비를 입력하면 발주일자/제품이 일치하는 정산 내역에 자동으로 분배 연동됩니다.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <div>
              <div className="text-xs text-slate-500 font-medium">등록된 총 광고 집행액</div>
              <div className="text-xl font-extrabold text-indigo-700">{formatKRW(totalDailyAdSpend)}</div>
            </div>
            <button
              onClick={handleManualSync}
              className="ml-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm transition"
              title="등록된 광고비를 정산 발주서에 동기화"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>정산 내역에 동기화</span>
            </button>
          </div>
        </div>

        {syncSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{syncSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* 광고비 신규 입력 폼 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-1.5">
          <Plus className="w-4 h-4 text-indigo-600" />
          <span>신규 광고비 직접 등록</span>
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              집행 일자 (날짜)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              대상 제품
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              광고 집행 금액 (원)
            </label>
            <input
              type="number"
              min="0"
              placeholder="예: 50000"
              value={adCostInput}
              onChange={(e) => setAdCostInput(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              광고 종류 / 비고 (선택)
            </label>
            <input
              type="text"
              placeholder="예: 쿠팡 검색광고, 타임딜"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center justify-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>광고비 저장 & 연동</span>
            </button>
          </div>
        </form>
      </div>

      {/* 탭 구분 (빠른 매트릭스 수정을 기본) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 space-x-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-1.5 ${
              activeTab === 'matrix'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>제품별 x 일별 빠른 수기 매트릭스</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-1.5 ${
              activeTab === 'list'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>등록된 일별 광고비 내역 목록 ({dailyAdCosts.length}건)</span>
          </button>
        </div>

        {/* 탭 1: 매트릭스 View */}
        {activeTab === 'matrix' && (
          <div className="p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
              <p>💡 테이블 셀에서 수치를 직접 수정하면 해당 일자와 제품의 광고비가 실시간 저장됩니다.</p>
              <span className="font-semibold text-indigo-600">최근 7일 광고비 모니터링 Grid</span>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3 text-left font-bold w-48 border-r border-slate-200">제품명</th>
                  {datesList.map((d) => (
                    <th key={d} className="py-2.5 px-2 text-center font-bold border-r border-slate-200 min-w-[100px]">
                      {d.slice(5)}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {new Date(d).toLocaleDateString('ko-KR', { weekday: 'short' })}
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold w-28 bg-indigo-50/50 text-indigo-900">
                    제품별 합계
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((prod) => {
                  let rowTotal = 0;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2 px-3 border-r border-slate-200">
                        <input
                          type="text"
                          value={prod.name}
                          onChange={(e) => onUpdateProduct({ ...prod, name: e.target.value })}
                          className="w-full text-xs font-semibold py-0.5 px-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-rose-500"
                          title="제품명 변경"
                        />
                      </td>
                      {datesList.map((dateStr) => {
                        const match = dailyAdCosts.find(
                          (a) => a.date === dateStr && a.productId === prod.id
                        );
                        const costVal = match ? match.adCost : 0;
                        rowTotal += costVal;

                        return (
                          <td key={dateStr} className="p-1 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={costVal === 0 ? '' : costVal}
                              placeholder="0"
                              onChange={(e) =>
                                handleMatrixCellChange(dateStr, prod, e.target.value)
                              }
                              className={`w-full text-right text-xs p-1.5 rounded border focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium ${
                                costVal > 0
                                  ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-400'
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-right font-extrabold text-indigo-900 bg-indigo-50/30">
                        {formatNumber(rowTotal)}원
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                  <td className="py-2.5 px-3 text-center border-r border-slate-200">
                    일자별 전체 광고비 총합
                  </td>
                  {datesList.map((d) => {
                    const colTotal = dailyAdCosts
                      .filter((a) => a.date === d)
                      .reduce((sum, curr) => sum + curr.adCost, 0);
                    return (
                      <td key={d} className="py-2.5 px-2 text-right border-r border-slate-200 text-indigo-800 font-extrabold">
                        {formatNumber(colTotal)}원
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right text-indigo-950 font-black bg-indigo-100/60">
                    {formatKRW(totalDailyAdSpend)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 탭 2: 리스트 View */}
        {activeTab === 'list' && (
          <div className="overflow-x-auto">
            {dailyAdCosts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                등록된 일별 광고비 내역이 없습니다. 위 폼에서 입력해주세요.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">집행 일자</th>
                    <th className="py-2.5 px-4 font-bold">상품명</th>
                    <th className="py-2.5 px-4 font-bold text-right">광고 집행비 (원)</th>
                    <th className="py-2.5 px-4 font-bold">비고 / 광고유형</th>
                    <th className="py-2.5 px-4 font-bold text-center">연동 발주건수</th>
                    <th className="py-2.5 px-4 font-bold text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dailyAdCosts.map((item) => {
                    // 이 날짜, 이 상품에 대한 발주건 수
                    const matchedOrdersCount = settlements.filter(
                      (s) => (s.poDate === item.date || s.deliveryDate === item.date) && s.productId === item.productId
                    ).length;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.date}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.productName}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-indigo-700 text-sm">
                          {formatKRW(item.adCost)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.memo || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          {matchedOrdersCount > 0 ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
                              {matchedOrdersCount}건 자동연동됨
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[11px]">
                              해당일 발주없음
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('이 일별 광고비 항목을 삭제하시겠습니까?')) {
                                onDeleteDailyAd(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
