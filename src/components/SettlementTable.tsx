import React, { useState } from 'react';
import { ComputedSettlement, FilterState, OrderSettlement } from '../types';
import { formatKRW, formatNumber, formatPercent, groupSettlements } from '../utils/settlementUtils';
import {
  Search,
  Filter,
  Layers,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  Copy,
  Plus,
} from 'lucide-react';

interface SettlementTableProps {
  settlements: ComputedSettlement[];
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  onEditPO: (item: ComputedSettlement) => void;
  onDeletePO: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onDuplicatePO: (item: ComputedSettlement) => void;
  onUpdateInline: (id: string, field: keyof OrderSettlement, value: any) => void;
  categories: string[];
}

export const SettlementTable: React.FC<SettlementTableProps> = ({
  settlements,
  filter,
  setFilter,
  onEditPO,
  onDeletePO,
  onBatchDelete,
  onDuplicatePO,
  onUpdateInline,
  categories,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isGrouped = filter.groupBy !== 'none';
  const groupedData = isGrouped ? groupSettlements(settlements, filter.groupBy) : [];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(settlements.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`선택한 ${selectedIds.length}개 정산 항목을 삭제하시겠습니까?`)) {
      onBatchDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const toggleGroupExpand = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="상품명, 발주번호, 카테고리, 메모 검색..."
              value={filter.searchKeyword}
              onChange={(e) => setFilter((prev) => ({ ...prev, searchKeyword: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Group By Selector */}
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-slate-500 dark:text-slate-400">보기 방식:</span>
              <select
                value={filter.groupBy}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, groupBy: e.target.value as any }))
                }
                className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="none">개별 발주건별 목록</option>
                <option value="date">일자별 정산 합계</option>
                <option value="product">품목별 정산 합계</option>
                <option value="week">주차별 정산 합계</option>
                <option value="category">카테고리별 합계</option>
              </select>
            </div>

            {/* Date Range Selector */}
            <select
              value={filter.dateRange}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, dateRange: e.target.value as any }))
              }
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">전체 기간</option>
              <option value="today">오늘 발주</option>
              <option value="7days">최근 7일</option>
              <option value="30days">최근 30일</option>
              <option value="this_month">이번 달</option>
              <option value="custom">사용자 지정 기간</option>
            </select>

            {/* Frequency Type Filter */}
            <select
              value={filter.frequencyType}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, frequencyType: e.target.value as any }))
              }
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">발주주기: 전체</option>
              <option value="주간정기">주간 정기 발주</option>
              <option value="수시비정기">수시 비정기 발주</option>
            </select>

            {/* Category Filter */}
            <select
              value={filter.category}
              onChange={(e) => setFilter((prev) => ({ ...prev, category: e.target.value }))}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">카테고리: 전체</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filter.status}
              onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">상태: 전체</option>
              <option value="발주완료">발주완료</option>
              <option value="입고완료">입고완료</option>
              <option value="정산완료">정산완료</option>
              <option value="취소">취소</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {filter.dateRange === 'custom' && (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">기간 선택:</span>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter((prev) => ({ ...prev, startDate: e.target.value }))}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100"
            />
            <span className="text-xs text-slate-400">~</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter((prev) => ({ ...prev, endDate: e.target.value }))}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>
        )}

        {/* Selected Rows Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg px-3 py-1.5 text-xs">
            <span className="font-semibold text-rose-700 dark:text-rose-300">
              {selectedIds.length}개 항목이 선택됨
            </span>
            <button
              onClick={handleBatchDeleteClick}
              className="inline-flex items-center text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> 선택 삭제
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[11px] md:text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 select-none">
              <th className="px-1.5 py-2 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    settlements.length > 0 && selectedIds.length === settlements.length
                  }
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </th>
              <th className="px-1.5 py-2 min-w-[105px]">발주일자</th>
              <th className="px-2 py-2 min-w-[260px]">상품명</th>
              <th className="px-1.5 py-2 text-right min-w-[55px]">발주수량</th>
              <th className="px-1.5 py-2 text-right min-w-[55px]">납품수량</th>
              <th className="px-1.5 py-2 text-right min-w-[75px]">매입가(단가)</th>
              <th className="px-1.5 py-2 text-right min-w-[85px]">합계금액(매출)</th>
              <th className="px-1.5 py-2 text-right min-w-[75px] bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300">
                광고비
              </th>
              <th className="px-1.5 py-2 text-right min-w-[75px]">제조원가</th>
              <th className="px-1.5 py-2 text-right min-w-[75px]">기타/물류비</th>
              <th className="px-1.5 py-2 text-right min-w-[90px]">쿠팡 정산액</th>
              <th className="px-1.5 py-2 text-right min-w-[95px] bg-emerald-50/50 dark:bg-emerald-950/20 font-bold text-emerald-900 dark:text-emerald-300">
                순이익 (마진%)
              </th>
              <th className="px-1.5 py-2 text-center min-w-[75px]">상태</th>
              <th className="px-1.5 py-2 text-center min-w-[65px]">관리</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {/* Case 1: Grouped View */}
            {isGrouped ? (
              groupedData.map((group) => {
                const isExpanded = expandedGroups[group.groupKey] !== false; // default expanded
                const isLoss = group.summary.totalNetProfit < 0;

                return (
                  <React.Fragment key={group.groupKey}>
                    {/* Group Header Row */}
                    <tr
                      onClick={() => toggleGroupExpand(group.groupKey)}
                      className="bg-slate-100/90 dark:bg-slate-800/80 font-bold hover:bg-slate-200/80 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <td colSpan={3} className="px-1.5 py-2">
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="text-slate-900 dark:text-white font-extrabold">
                            {group.groupKey}
                          </span>
                          <span className="text-xs font-normal text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {group.items.length}건
                          </span>
                        </div>
                      </td>
                      <td className="px-1.5 py-2 text-right">{formatNumber(group.summary.totalOrderQty)}</td>
                      <td className="px-1.5 py-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                        {formatNumber(group.summary.totalDeliveredQty)}
                      </td>
                      <td className="px-1.5 py-2 text-right text-slate-400">-</td>
                      <td className="px-1.5 py-2 text-right font-extrabold text-slate-900 dark:text-white">
                        {formatKRW(group.summary.totalGross)}
                      </td>
                      <td className="px-1.5 py-2 text-right font-semibold text-amber-600 dark:text-amber-400">
                        {formatKRW(group.summary.totalAdCost)}
                      </td>
                      <td className="px-1.5 py-2 text-right text-slate-600 dark:text-slate-400">
                        {formatKRW(group.summary.totalCost)}
                      </td>
                      <td className="px-1.5 py-2 text-right text-slate-600 dark:text-slate-400">
                        {formatKRW(group.summary.totalOtherFee)}
                      </td>
                      <td className="px-1.5 py-2 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatKRW(group.summary.totalSettlement)}
                      </td>
                      <td className="px-1.5 py-2 text-right font-black">
                        <span
                          className={`inline-block px-2 py-0.5 rounded ${
                            isLoss
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          }`}
                        >
                          {formatKRW(group.summary.totalNetProfit)} ({group.summary.netMargin.toFixed(1)}%)
                        </span>
                        <div className="text-[8px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 scale-95 origin-right">
                          부가세 {formatNumber(Math.round(group.summary.totalVat))} / 소득세 {formatNumber(Math.round(group.summary.totalIncomeTax))}
                        </div>
                      </td>
                      <td colSpan={2} className="px-1.5 py-2 text-center text-slate-400 text-2xs">
                        {isExpanded ? '상세 접기' : '상세 펼치기'}
                      </td>
                    </tr>

                    {/* Group Detailed Sub-rows */}
                    {isExpanded &&
                      group.items.map((item) => (
                        <RowItem
                          key={item.id}
                          item={item}
                          isSelected={selectedIds.includes(item.id)}
                          onSelect={() => handleSelectRow(item.id)}
                          onEdit={() => onEditPO(item)}
                          onDelete={() => onDeletePO(item.id)}
                          onDuplicate={() => onDuplicatePO(item)}
                          onUpdateInline={onUpdateInline}
                          isSubRow={true}
                        />
                      ))}
                  </React.Fragment>
                );
              })
            ) : (
              /* Case 2: Flat List View */
              settlements.map((item) => (
                <RowItem
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  onSelect={() => handleSelectRow(item.id)}
                  onEdit={() => onEditPO(item)}
                  onDelete={() => onDeletePO(item.id)}
                  onDuplicate={() => onDuplicatePO(item)}
                  onUpdateInline={onUpdateInline}
                  isSubRow={false}
                />
              ))
            )}

            {settlements.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <p className="text-sm font-medium">검색 결과 또는 정산 데이터가 없습니다.</p>
                  <p className="text-xs mt-1">상단 "신규 발주 등록" 버튼을 클릭하여 새로운 발주건을 추가해보세요.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Sub-component for individual row
interface RowItemProps {
  item: ComputedSettlement;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateInline: (id: string, field: keyof OrderSettlement, value: any) => void;
  isSubRow: boolean;
}

const RowItem: React.FC<RowItemProps> = ({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateInline,
  isSubRow,
}) => {
  const isLoss = item.netProfit < 0;
  const isLowMargin = item.netMargin > 0 && item.netMargin < 5;

  return (
    <tr
      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
        isSelected ? 'bg-rose-50/70 dark:bg-rose-950/30' : ''
      } ${isSubRow ? 'bg-slate-50/40 dark:bg-slate-900/30' : ''}`}
    >
      <td className="px-1.5 py-2 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
        />
      </td>

      {/* 발주일자 */}
      <td className="px-1.5 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-2xs">
        <input
          type="date"
          value={item.poDate}
          onChange={(e) => onUpdateInline(item.id, 'poDate', e.target.value)}
          className="w-[102px] py-0.5 px-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-rose-500"
          title="발주일자 변경"
        />
      </td>

      {/* 상품명 */}
      <td className="px-2 py-2">
        <div className="flex items-center space-x-1.5 w-full">
          <input
            type="text"
            value={item.productName}
            onChange={(e) => onUpdateInline(item.id, 'productName', e.target.value)}
            className="flex-1 min-w-[220px] font-semibold py-1 px-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-rose-500"
            title="상품명 변경"
          />
          {item.frequencyType && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap shrink-0 ${
                item.frequencyType === '주간정기'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
              }`}
            >
              {item.frequencyType === '주간정기' ? '정기' : '수시'}
            </span>
          )}
        </div>
      </td>

      {/* 발주수량 */}
      <td className="px-1.5 py-2 text-right font-medium">
        <input
          type="number"
          value={item.orderQty}
          onChange={(e) => onUpdateInline(item.id, 'orderQty', Math.max(0, parseInt(e.target.value) || 0))}
          className="w-12 text-right py-0.5 px-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-rose-500"
          title="발주 수량 변경"
        />
      </td>

      {/* 납품수량 (Editable inline) */}
      <td className="px-1.5 py-2 text-right">
        <input
          type="number"
          value={item.deliveredQty}
          onChange={(e) => onUpdateInline(item.id, 'deliveredQty', Math.max(0, parseInt(e.target.value) || 0))}
          className="w-12 text-right py-0.5 px-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-rose-500"
          title="납품 수량 변경"
        />
        <div className="text-[9px] text-slate-400 mt-0.5">
          {item.deliveryRate.toFixed(0)}% 입고
        </div>
      </td>

      {/* 매입가 (Editable inline) */}
      <td className="px-1.5 py-2 text-right font-mono">
        <input
          type="number"
          value={item.supplyPrice}
          onChange={(e) => onUpdateInline(item.id, 'supplyPrice', Math.max(0, parseInt(e.target.value) || 0))}
          className="w-16 text-right py-0.5 px-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-rose-500"
          title="매입 단가 변경"
        />
      </td>

      {/* 합계금액 (Gross) */}
      <td className="px-1.5 py-2 text-right font-extrabold text-slate-900 dark:text-slate-100 font-mono">
        {formatKRW(item.grossAmount)}
      </td>

      {/* 광고비 (Editable inline) */}
      <td className="px-1.5 py-2 text-right bg-amber-50/40 dark:bg-amber-950/10 font-mono">
        <input
          type="number"
          value={item.adCost}
          onChange={(e) => onUpdateInline(item.id, 'adCost', Math.max(0, parseInt(e.target.value) || 0))}
          className="w-16 text-right py-0.5 px-1 border border-amber-300 dark:border-amber-800 rounded bg-amber-50/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold focus:ring-1 focus:ring-amber-500"
          title="광고비 변경"
        />
      </td>

      {/* 제조원가 (총원가) */}
      <td className="px-1.5 py-2 text-right text-slate-600 dark:text-slate-400 font-mono">
        <div>{formatKRW(item.totalCost)}</div>
        <div className="text-[9px] text-slate-400">단가 {formatKRW(item.unitCost)}</div>
      </td>

      {/* 기타/물류비 (Editable inline) */}
      <td className="px-1.5 py-2 text-right font-mono">
        <input
          type="number"
          value={item.otherFee}
          onChange={(e) => onUpdateInline(item.id, 'otherFee', Math.max(0, parseInt(e.target.value) || 0))}
          className="w-16 text-right py-0.5 px-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-rose-500"
          title="기타/물류비 변경"
        />
      </td>

      {/* 쿠팡 정산액 */}
      <td className="px-1.5 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
        {formatKRW(item.settlementAmount)}
      </td>

      {/* 순이익 & 순이익률 */}
      <td className="px-1.5 py-2 text-right font-mono bg-emerald-50/30 dark:bg-emerald-950/10" title={`부가세: ${formatKRW(item.vat)} | 종합소득세: ${formatKRW(item.incomeTax)}`}>
        <div
          className={`font-black ${
            isLoss ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
          }`}
        >
          {formatKRW(item.netProfit)}
        </div>
        <div className="mt-0.5 flex flex-col items-end">
          <div className="flex items-center space-x-1">
            <span
              className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                isLoss
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : isLowMargin
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              }`}
            >
              {item.netMargin.toFixed(1)}%
            </span>
            {isLoss && <AlertTriangle className="w-3 h-3 text-red-500 inline" title="적자 주의!" />}
          </div>
          <div className="text-[8px] text-slate-400 dark:text-slate-500 scale-95 origin-right mt-0.5 whitespace-nowrap">
            부가세 {formatNumber(Math.round(item.vat))} / 소득세 {formatNumber(Math.round(item.incomeTax))}
          </div>
        </div>
      </td>

      {/* 상태 */}
      <td className="px-1.5 py-2 text-center">
        <select
          value={item.status}
          onChange={(e) => onUpdateInline(item.id, 'status', e.target.value)}
          className={`text-[11px] font-semibold rounded-md px-1.5 py-0.5 border cursor-pointer ${
            item.status === '정산완료'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
              : item.status === '입고완료'
              ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
              : item.status === '발주완료'
              ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-slate-100 text-slate-600 border-slate-300'
          }`}
        >
          <option value="발주완료">발주완료</option>
          <option value="입고완료">입고완료</option>
          <option value="정산완료">정산완료</option>
          <option value="취소">취소</option>
        </select>
      </td>

      {/* 관리 액션 */}
      <td className="px-1.5 py-2 text-center">
        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={onEdit}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="수정"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 rounded text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="복사 추가"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
