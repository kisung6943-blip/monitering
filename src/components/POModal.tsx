import React, { useState, useEffect } from 'react';
import { OrderSettlement, ProductMaster } from '../types';
import { computeSettlementItem, formatKRW, formatPercent } from '../utils/settlementUtils';
import { X, Calculator, Plus, Package } from 'lucide-react';

interface POModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (po: OrderSettlement) => void;
  initialData?: OrderSettlement | null;
  products: ProductMaster[];
}

export const POModal: React.FC<POModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  products,
}) => {
  const [formData, setFormData] = useState<Partial<OrderSettlement>>({
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
    productId: '',
    productName: '',
    category: '기타',
    orderQty: 100,
    deliveredQty: 100,
    supplyPrice: 10000,
    unitCost: 5000,
    commissionRate: 10.8,
    adCost: 50000,
    otherFee: 30000,
    status: '입고완료',
    frequencyType: '주간정기',
    memo: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Generate a new PO number
      const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomSeq = Math.floor(Math.random() * 900 + 100);
      const defaultProduct = products[0];

      setFormData({
        poNumber: `PO-${todayStr}-${randomSeq}`,
        poDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date().toISOString().split('T')[0],
        productId: defaultProduct ? defaultProduct.id : '',
        productName: defaultProduct ? defaultProduct.name : '',
        category: defaultProduct ? defaultProduct.category : '기타',
        orderQty: 100,
        deliveredQty: 100,
        supplyPrice: defaultProduct ? defaultProduct.supplyPrice : 10000,
        unitCost: defaultProduct ? defaultProduct.unitCost : 5000,
        commissionRate: defaultProduct ? defaultProduct.commissionRate : 10.8,
        adCost: 50000,
        otherFee: defaultProduct ? defaultProduct.defaultOtherFee * 100 : 30000,
        status: '입고완료',
        frequencyType: '주간정기',
        memo: '',
      });
    }
  }, [initialData, isOpen, products]);

  if (!isOpen) return null;

  // Auto-fill when product is selected
  const handleProductSelect = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setFormData((prev) => ({
        ...prev,
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        supplyPrice: prod.supplyPrice,
        unitCost: prod.unitCost,
        commissionRate: prod.commissionRate,
        otherFee: prod.defaultOtherFee * (prev.deliveredQty || 100),
      }));
    }
  };

  // Compute live preview
  const previewItem = computeSettlementItem({
    id: formData.id || 'temp',
    poNumber: formData.poNumber || '',
    poDate: formData.poDate || '',
    deliveryDate: formData.deliveryDate || '',
    productId: formData.productId || '',
    productName: formData.productName || '미지정 상품',
    category: formData.category || '기타',
    orderQty: Number(formData.orderQty) || 0,
    deliveredQty: Number(formData.deliveredQty) || 0,
    supplyPrice: Number(formData.supplyPrice) || 0,
    unitCost: Number(formData.unitCost) || 0,
    commissionRate: Number(formData.commissionRate) || 0,
    adCost: Number(formData.adCost) || 0,
    otherFee: Number(formData.otherFee) || 0,
    status: (formData.status as any) || '발주완료',
    frequencyType: (formData.frequencyType as any) || '주간정기',
    memo: formData.memo,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName?.trim()) {
      alert('상품명을 입력해주세요.');
      return;
    }

    const newItem: OrderSettlement = {
      id: formData.id || `po-${Date.now()}`,
      poNumber: formData.poNumber || `PO-${Date.now()}`,
      poDate: formData.poDate || new Date().toISOString().split('T')[0],
      deliveryDate: formData.deliveryDate || formData.poDate || new Date().toISOString().split('T')[0],
      productId: formData.productId || 'custom',
      productName: formData.productName,
      category: formData.category || '기타',
      orderQty: Number(formData.orderQty) || 0,
      deliveredQty: Number(formData.deliveredQty) || 0,
      supplyPrice: Number(formData.supplyPrice) || 0,
      unitCost: Number(formData.unitCost) || 0,
      commissionRate: Number(formData.commissionRate) || 0,
      adCost: Number(formData.adCost) || 0,
      otherFee: Number(formData.otherFee) || 0,
      status: (formData.status as any) || '입고완료',
      frequencyType: (formData.frequencyType as any) || '주간정기',
      memo: formData.memo,
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold">
              {initialData ? '로켓발주 정산 데이터 수정' : '신규 로켓발주 정산 입력'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Preset Product Quick Selector */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              등록된 상품 마스터에서 불러오기 (자동채우기)
            </label>
            <select
              value={formData.productId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-900 dark:text-white"
            >
              <option value="">-- 직접 입력 / 마스터 선택 --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (매입가: {formatKRW(p.supplyPrice)} / 원가: {formatKRW(p.unitCost)} / 수수료: {p.commissionRate}%)
                </option>
              ))}
            </select>
          </div>

          {/* Row 1: 발주번호, 발주일자, 입고일자 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                발주번호 (PO No.)
              </label>
              <input
                type="text"
                required
                value={formData.poNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, poNumber: e.target.value }))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                발주일자 (PO Date)
              </label>
              <input
                type="date"
                required
                value={formData.poDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, poDate: e.target.value }))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                입고/납품일자
              </label>
              <input
                type="date"
                required
                value={formData.deliveryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Row 2: 상품명 */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                상품명 *
              </label>
              <input
                type="text"
                required
                value={formData.productName}
                onChange={(e) => {
                  const newName = e.target.value;
                  const matched = products.find((p) => p.name === newName);
                  setFormData((prev) => {
                    const updated = { ...prev, productName: newName };
                    if (matched) {
                      updated.productId = matched.id;
                      updated.supplyPrice = matched.supplyPrice;
                      updated.unitCost = matched.unitCost;
                      updated.commissionRate = matched.commissionRate;
                    }
                    return updated;
                  });
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-semibold"
                placeholder="예: 유기농 그릭요거트 500g"
              />
            </div>
          </div>

          {/* Row 3: 발주수량, 납품수량, 매입단가, 제조원가 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                발주 수량 (개)
              </label>
              <input
                type="number"
                min="0"
                value={formData.orderQty}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, orderQty: parseInt(e.target.value) || 0 }))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                납품 수량 (개)
              </label>
              <input
                type="number"
                min="0"
                value={formData.deliveredQty}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deliveredQty: parseInt(e.target.value) || 0 }))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-blue-600 dark:text-blue-400 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                쿠팡 매입가 (원/개)
              </label>
              <input
                type="number"
                min="0"
                value={formData.supplyPrice}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supplyPrice: parseInt(e.target.value) || 0 }))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                제조/사입원가 (원/개)
              </label>
              <input
                type="number"
                min="0"
                value={formData.unitCost}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unitCost: parseInt(e.target.value) || 0 }))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Row 4: 광고비, 기타물류비, 발주주기 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                할당 광고비 (원)
              </label>
              <input
                type="number"
                min="0"
                value={formData.adCost}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, adCost: parseInt(e.target.value) || 0 }))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-amber-600 dark:text-amber-400 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                기타/밀크런 물류비 (원)
              </label>
              <input
                type="number"
                min="0"
                value={formData.otherFee}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, otherFee: parseInt(e.target.value) || 0 }))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                발주 구분 (주기)
              </label>
              <select
                value={formData.frequencyType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, frequencyType: e.target.value as any }))
                }
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
              >
                <option value="주간정기">주간 정기 발주</option>
                <option value="수시비정기">수시 비정기 발주</option>
              </select>
            </div>
          </div>

          {/* Row 5: 상태 & 메모 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                진행 상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-semibold"
              >
                <option value="발주완료">발주완료</option>
                <option value="입고완료">입고완료</option>
                <option value="정산완료">정산완료</option>
                <option value="취소">취소</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                메모 / 비고
              </label>
              <input
                type="text"
                value={formData.memo}
                onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                placeholder="예: 타임딜 행사진행, 입고 지연 2개 등"
              />
            </div>
          </div>

          {/* Live Profit Calculation Preview Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
              <span className="flex items-center">
                <Calculator className="w-4 h-4 mr-1.5" /> 자동 실시간 정산 시뮬레이션
              </span>
              <span>납품률: {previewItem.deliveryRate.toFixed(1)}%</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs pt-1 border-t border-slate-800">
              <div>
                <span className="text-slate-400 block">총 매출 (매입합계)</span>
                <span className="font-mono text-sm font-bold text-white">
                  {formatKRW(previewItem.grossAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">총 차감비용 (수수료+광고+물류)</span>
                <span className="font-mono text-sm font-bold text-rose-400">
                  -{formatKRW(previewItem.totalDeductions)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">쿠팡 입금 정산액</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {formatKRW(previewItem.settlementAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">최종 순이익 (마진률)</span>
                <span
                  className={`font-mono text-sm font-extrabold ${
                    previewItem.netProfit < 0 ? 'text-red-400' : 'text-emerald-300'
                  }`}
                >
                  {formatKRW(previewItem.netProfit)} ({previewItem.netMargin.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-sm"
            >
              {initialData ? '수정 완료' : '발주 정산 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
