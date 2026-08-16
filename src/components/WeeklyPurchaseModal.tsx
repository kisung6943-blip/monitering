import React, { useState, useEffect } from 'react';
import { ProductMaster, OrderSettlement } from '../types';
import { formatKRW, formatNumber } from '../utils/settlementUtils';
import { X, Calendar, Plus, Save, CheckCircle2, DollarSign, PackageCheck, AlertCircle, Search, Trash2 } from 'lucide-react';

interface WeeklyPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductMaster[];
  onBatchSaveWeeklyOrders: (newOrders: OrderSettlement[]) => void;
  onDeleteProduct?: (id: string) => void;
}

interface WeeklyItemRow {
  productId: string;
  productName: string;
  category: string;
  orderQty: number;
  deliveredQty: number;
  supplyPrice: number;
  unitCost: number;
  adCost: number;
  otherFee: number;
  frequencyType: '주간정기' | '수시비정기';
  memo: string;
}

export const WeeklyPurchaseModal: React.FC<WeeklyPurchaseModalProps> = ({
  isOpen,
  onClose,
  products,
  onBatchSaveWeeklyOrders,
  onDeleteProduct,
}) => {
  // 이번 주 월요일 계산
  const getMondayOfCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const getSundayFromMonday = (mondayStr: string) => {
    const mon = new Date(mondayStr);
    mon.setDate(mon.getDate() + 6);
    return mon.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState<string>(getMondayOfCurrentWeek());
  const endDate = getSundayFromMonday(startDate);

  // 입고 예정일 (기본값: 월요일 + 2일, 수요일)
  const getDefaultDeliveryDate = (monStr: string) => {
    const mon = new Date(monStr);
    mon.setDate(mon.getDate() + 1);
    return mon.toISOString().split('T')[0];
  };

  const [deliveryDate, setDeliveryDate] = useState<string>(getDefaultDeliveryDate(startDate));

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProductIdFilter, setSelectedProductIdFilter] = useState<string>('all');
  const [showOnlyEntered, setShowOnlyEntered] = useState<boolean>(false);

  // 상품별 입력 데이터 초기화
  const [rows, setRows] = useState<WeeklyItemRow[]>(() =>
    products.map((p) => ({
      productId: p.id,
      productName: p.name,
      category: p.category,
      orderQty: 0,
      deliveredQty: 0,
      supplyPrice: p.supplyPrice,
      unitCost: p.unitCost,
      adCost: 0,
      otherFee: p.defaultOtherFee || 0,
      frequencyType: '주간정기',
      memo: '주간 매입 일괄 입력',
    }))
  );

  const handleRemoveRow = (productId: string, productName: string) => {
    if (confirm(`'${productName}' 품목을 상품 마스터 및 목록에서 삭제하시겠습니까?`)) {
      setRows((prev) => prev.filter((r) => r.productId !== productId));
      if (onDeleteProduct) {
        onDeleteProduct(productId);
      }
    }
  };

  // modal open 시 혹은 products prop 변경 시 rows 동기화
  useEffect(() => {
    if (isOpen) {
      setRows((prevRows) => {
        const prevMap = new Map(prevRows.map((r) => [r.productId, r]));
        return products.map((p) => {
          const existing = prevMap.get(p.id);
          if (existing) {
            return {
              ...existing,
              productName: p.name,
              category: p.category,
              supplyPrice: existing.orderQty > 0 || existing.deliveredQty > 0 ? existing.supplyPrice : p.supplyPrice,
              unitCost: existing.orderQty > 0 || existing.deliveredQty > 0 ? existing.unitCost : p.unitCost,
            };
          }
          return {
            productId: p.id,
            productName: p.name,
            category: p.category,
            orderQty: 0,
            deliveredQty: 0,
            supplyPrice: p.supplyPrice,
            unitCost: p.unitCost,
            adCost: 0,
            otherFee: p.defaultOtherFee || 0,
            frequencyType: '주간정기',
            memo: '주간 매입 일괄 입력',
          };
        });
      });
    }
  }, [isOpen, products]);

  // startDate 변경 시 deliveryDate 동기화 및 row 초기화 확인
  const handleStartDateChange = (newMonStr: string) => {
    setStartDate(newMonStr);
    setDeliveryDate(getDefaultDeliveryDate(newMonStr));
  };

  // 행 값 변경 함수 (productId 기반)
  const handleRowChange = (productId: string, field: keyof WeeklyItemRow, value: any) => {
    setRows((prev) => {
      const copy = [...prev];
      const index = copy.findIndex((r) => r.productId === productId);
      if (index === -1) return prev;

      const updatedRow = { ...copy[index], [field]: value };

      // 발주수량 입력 시 납품수량이 0이면 동일하게 세팅 편의제공
      if (field === 'orderQty' && updatedRow.deliveredQty === 0) {
        updatedRow.deliveredQty = Number(value) || 0;
      }

      copy[index] = updatedRow;
      return copy;
    });
  };

  // 모든 제품 동일 발주/납품 수량 채우기 (빠른 입력 팁)
  const handleApplyAllQty = (qty: number) => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        orderQty: qty,
        deliveredQty: qty,
      }))
    );
  };

  if (!isOpen) return null;

  // 총 선택된 매입 건수 (발주수량 > 0)
  const validRows = rows.filter((r) => r.orderQty > 0 || r.deliveredQty > 0);
  const totalWeeklyGross = validRows.reduce(
    (sum, r) => sum + r.deliveredQty * r.supplyPrice,
    0
  );
  const totalWeeklyQty = validRows.reduce((sum, r) => sum + r.deliveredQty, 0);

  // 저장 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validRows.length === 0) {
      alert('최소 1개 이상 상품의 발주 또는 납품 수량을 입력해주세요.');
      return;
    }

    const dateCompact = startDate.replace(/-/g, '');
    const newOrders: OrderSettlement[] = validRows.map((r, idx) => ({
      id: `po-wk-${Date.now()}-${idx}`,
      poNumber: `PO-${dateCompact}-W${String(idx + 1).padStart(2, '0')}`,
      poDate: startDate,
      deliveryDate: deliveryDate,
      productId: r.productId,
      productName: r.productName,
      category: r.category,
      orderQty: r.orderQty,
      deliveredQty: r.deliveredQty,
      supplyPrice: r.supplyPrice,
      unitCost: r.unitCost,
      commissionRate: 0, // 로켓배송 수수료 0%
      adCost: r.adCost,
      otherFee: r.otherFee,
      status: '입고완료',
      memo: `[주간매입 ${startDate}~${endDate}] ${r.memo}`,
      frequencyType: r.frequencyType,
    }));

    onBatchSaveWeeklyOrders(newOrders);
    alert(`총 ${newOrders.length}건의 주간 매입 발주 데이터가 등록되었습니다!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl my-4 overflow-hidden flex flex-col max-h-[95vh]">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-500/30">
              <Calendar className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">주간 매입 일괄 입력 (1주일 단위 정산)</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                주차별(일주일 단위) 전체 제품의 매입 발주수량, 납품수량, 단가를 한 화면에서 간편하게 등록합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 주간 기간 선택 및 설정 바 */}
        <div className="p-4 bg-indigo-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <label className="text-slate-700 dark:text-slate-300">주간 시작일 (월요일):</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 dark:text-white"
              />
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              ~ 주간 종료일 (일요일): <strong className="text-indigo-700 dark:text-indigo-300">{endDate}</strong>
            </div>

            <div className="flex items-center space-x-2 ml-2">
              <label className="text-slate-700 dark:text-slate-300">대표 입고일자:</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              전체 <strong className="text-slate-800 dark:text-slate-200 font-bold">{rows.length}개 상품</strong> 중 <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{validRows.length}개 선택 입력</strong> (총 {formatNumber(totalWeeklyQty)}개)
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              주간 총 매입액: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatKRW(totalWeeklyGross)}</strong>
            </span>
          </div>
        </div>

        {/* 메인 테이블 스크롤 영역 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 품목 검색 및 빠른 선택 / 일괄채우기 바 */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-xl shadow-sm">
            {/* 품목 검색 및 빠른 선택 */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="품목명/카테고리 검색..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value) setSelectedProductIdFilter('all');
                  }}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 드롭다운 빠른 선택 */}
              <select
                value={selectedProductIdFilter}
                onChange={(e) => {
                  setSelectedProductIdFilter(e.target.value);
                  if (e.target.value !== 'all') setSearchTerm('');
                }}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[220px] truncate font-semibold cursor-pointer"
              >
                <option value="all">🔍 전체 품목 선택 이동 ({products.length}개)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* 필터 리셋 버튼 */}
              {(searchTerm || selectedProductIdFilter !== 'all' || showOnlyEntered) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedProductIdFilter('all');
                    setShowOnlyEntered(false);
                  }}
                  className="px-2 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg font-semibold flex items-center gap-1 transition"
                >
                  <X className="w-3.5 h-3.5" /> 필터 해제
                </button>
              )}

              {/* 입력중 품목만 보기 토글 */}
              <button
                type="button"
                onClick={() => setShowOnlyEntered(!showOnlyEntered)}
                className={`px-2.5 py-1.5 text-xs rounded-lg font-semibold transition-all border ${
                  showOnlyEntered
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200'
                }`}
              >
                {showOnlyEntered ? '✓ 입력된 품목만 보는 중' : '입력중 품목만 보기'} ({validRows.length})
              </button>
            </div>

            {/* 빠른 수량 채우기 */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px]">일괄 수량:</span>
              <button
                type="button"
                onClick={() => handleApplyAllQty(50)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 text-[11px] font-medium transition"
              >
                50개
              </button>
              <button
                type="button"
                onClick={() => handleApplyAllQty(100)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 text-[11px] font-medium transition"
              >
                100개
              </button>
              <button
                type="button"
                onClick={() => handleApplyAllQty(0)}
                className="px-2 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded text-[11px] font-medium hover:bg-rose-100 transition"
              >
                초기화(0)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 font-bold">카테고리</th>
                  <th className="p-3 font-bold min-w-[180px]">상품명</th>
                  <th className="p-3 font-bold text-center min-w-[90px]">발주수량(개)</th>
                  <th className="p-3 font-bold text-center min-w-[90px]">납품수량(개)</th>
                  <th className="p-3 font-bold text-right min-w-[100px]">매입 단가(원)</th>
                  <th className="p-3 font-bold text-right min-w-[110px]">주간 매입합계(원)</th>
                  <th className="p-3 font-bold text-right min-w-[95px]">제조원가(원)</th>
                  <th className="p-3 font-bold text-right min-w-[95px]">주간 광고비(원)</th>
                  <th className="p-3 font-bold text-right min-w-[90px]">물류비(원)</th>
                  <th className="p-3 font-bold text-center min-w-[90px]">구분</th>
                  <th className="p-3 font-bold text-center min-w-[60px] sticky right-0 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 z-10 shadow-xs">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(() => {
                  const filteredRows = rows.filter((r) => {
                    if (searchTerm.trim()) {
                      const q = searchTerm.trim().toLowerCase();
                      const matchName = r.productName.toLowerCase().includes(q);
                      const matchCat = r.category.toLowerCase().includes(q);
                      if (!matchName && !matchCat) return false;
                    }
                    if (selectedProductIdFilter !== 'all' && r.productId !== selectedProductIdFilter) {
                      return false;
                    }
                    if (showOnlyEntered && r.orderQty === 0 && r.deliveredQty === 0) {
                      return false;
                    }
                    return true;
                  });

                  if (filteredRows.length === 0) {
                    return (
                      <tr>
                        <td colSpan={11} className="text-center py-10 text-slate-400 font-medium">
                          검색 조건에 일치하는 품목이 없습니다.
                        </td>
                      </tr>
                    );
                  }

                  return filteredRows.map((row) => {
                    const gross = row.deliveredQty * row.supplyPrice;
                    const isSelected = row.orderQty > 0 || row.deliveredQty > 0;

                    return (
                      <tr
                        key={row.productId}
                        className={`transition ${
                          isSelected
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="p-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          {row.category}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                          {row.productName}
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={row.orderQty === 0 ? '' : row.orderQty}
                            placeholder="0"
                            onChange={(e) =>
                              handleRowChange(row.productId, 'orderQty', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-20 text-center p-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={row.deliveredQty === 0 ? '' : row.deliveredQty}
                            placeholder="0"
                            onChange={(e) =>
                              handleRowChange(row.productId, 'deliveredQty', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-20 text-center p-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 dark:text-indigo-300"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.supplyPrice}
                            onChange={(e) =>
                              handleRowChange(row.productId, 'supplyPrice', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-24 text-right p-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-slate-900 dark:text-white font-mono">
                          {formatKRW(gross)}
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.unitCost}
                            onChange={(e) =>
                              handleRowChange(row.productId, 'unitCost', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-20 text-right p-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono text-slate-600 dark:text-slate-400"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.adCost === 0 ? '' : row.adCost}
                            placeholder="0"
                            onChange={(e) =>
                              handleRowChange(row.productId, 'adCost', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-24 text-right p-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono text-amber-600 dark:text-amber-400 font-semibold"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.otherFee === 0 ? '' : row.otherFee}
                            placeholder="0"
                            onChange={(e) =>
                              handleRowChange(row.productId, 'otherFee', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-20 text-right p-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono text-slate-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={row.frequencyType}
                            onChange={(e) =>
                              handleRowChange(
                                row.productId,
                                'frequencyType',
                                e.target.value as '주간정기' | '수시비정기'
                              )
                            }
                            className="p-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                          >
                            <option value="주간정기">정기</option>
                            <option value="수시비정기">비정기</option>
                          </select>
                        </td>
                        <td className="p-2 text-center sticky right-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-10 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.productId, row.productName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                            title="품목 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* 모달 푸터 버튼 */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              선택 등록: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{validRows.length}건</strong> 발주서 생성 예정
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>주간 매입 일괄 등록 실행 ({validRows.length}건)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
