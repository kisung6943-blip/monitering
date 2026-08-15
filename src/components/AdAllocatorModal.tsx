import React, { useState } from 'react';
import { ComputedSettlement } from '../types';
import { formatKRW } from '../utils/settlementUtils';
import { X, Calculator, Check, AlertCircle } from 'lucide-react';

interface AdAllocatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlements: ComputedSettlement[];
  onApplyAdAllocation: (allocatedCosts: Record<string, number>) => void;
}

export const AdAllocatorModal: React.FC<AdAllocatorModalProps> = ({
  isOpen,
  onClose,
  settlements,
  onApplyAdAllocation,
}) => {
  const [totalAdSpend, setTotalAdSpend] = useState<number>(500000);
  const [method, setMethod] = useState<'sales_ratio' | 'qty_ratio' | 'equal'>('sales_ratio');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    settlements.map((s) => s.id)
  );

  if (!isOpen) return null;

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(settlements.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Preview calculation
  const targetItems = settlements.filter((s) => selectedIds.includes(s.id));
  const totalGross = targetItems.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const totalQty = targetItems.reduce((acc, cur) => acc + cur.deliveredQty, 0);

  const previewAllocation: Record<string, number> = {};
  targetItems.forEach((item) => {
    let cost = 0;
    if (method === 'sales_ratio') {
      cost = totalGross > 0 ? Math.round((item.grossAmount / totalGross) * totalAdSpend) : 0;
    } else if (method === 'qty_ratio') {
      cost = totalQty > 0 ? Math.round((item.deliveredQty / totalQty) * totalAdSpend) : 0;
    } else {
      cost = targetItems.length > 0 ? Math.round(totalAdSpend / targetItems.length) : 0;
    }
    previewAllocation[item.id] = cost;
  });

  const handleApply = () => {
    if (selectedIds.length === 0) {
      alert('광고비를 배분할 발주 항목을 1개 이상 선택해주세요.');
      return;
    }
    onApplyAdAllocation(previewAllocation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">광고비 일괄 자동 배분 도구</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            쿠팡 총 광고비(주간/월간 집계금액)를 선택한 발주건들의 매출액 또는 수량 비율에 맞춰 각 건별로 자동으로 나눕니다.
          </p>

          {/* Input total spend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                배분할 총 광고비 (원)
              </label>
              <input
                type="number"
                value={totalAdSpend}
                onChange={(e) => setTotalAdSpend(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-base font-bold text-amber-600 dark:text-amber-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                배분 방식 선택
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-medium text-slate-900 dark:text-white"
              >
                <option value="sales_ratio">매출액(입고금액) 비례 배분 (추천)</option>
                <option value="qty_ratio">납품수량 비례 배분</option>
                <option value="equal">건별 균등 1/N 배분</option>
              </select>
            </div>
          </div>

          {/* Target List */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 font-semibold flex items-center justify-between text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === settlements.length && settlements.length > 0}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-rose-600 cursor-pointer"
                />
                <span>대상 발주건 ({selectedIds.length}/{settlements.length}건 선택)</span>
              </label>
              <span className="text-2xs text-slate-500">배분될 예상 광고비</span>
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {settlements.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const cost = previewAllocation[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleId(item.id)}
                    className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-rose-600 cursor-pointer"
                      />
                      <span className="font-mono text-slate-400 text-2xs">{item.poDate}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                        {item.productName}
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {isSelected ? formatKRW(cost) : '제외됨'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              취소
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-sm inline-flex items-center"
            >
              <Check className="w-4 h-4 mr-1.5" />
              선택한 {selectedIds.length}건에 광고비 적용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
