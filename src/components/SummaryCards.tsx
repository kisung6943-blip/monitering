import React from 'react';
import { SettlementSummary } from '../types';
import { formatKRW, formatNumber, formatPercent } from '../utils/settlementUtils';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Truck,
  Percent,
  Receipt,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface SummaryCardsProps {
  summary: SettlementSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const isPositive = summary.totalNetProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {/* 1. Gross Supply Total / 매출액 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            총 매입 합계 (매출)
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatKRW(summary.totalGross)}
          </div>
          <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>발주 {summary.totalCount}건</span>
            <span>·</span>
            <span>{formatNumber(summary.totalDeliveredQty)}개 납품</span>
          </div>
        </div>
      </div>

      {/* 2. Total Deductions / 차감 내역 (광고비+물류비) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            총 차감 비용 (광고+물류비)
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            -{formatKRW(summary.totalDeductions)}
          </div>
          <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span>광고비 {formatKRW(summary.totalAdCost)}</span>
            <span>·</span>
            <span>물류비 {formatKRW(summary.totalOtherFee)}</span>
          </div>
        </div>
      </div>

      {/* 3. Coupang Settlement Amount / 정산 수령 예정액 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            쿠팡 정산 입금 예정액
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatKRW(summary.totalSettlement)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            제조원가 차감 전 수령액
          </div>
        </div>
      </div>

      {/* 4. Net Profit / 최종 순이익 */}
      <div
        className={`rounded-xl p-4 border shadow-xs relative overflow-hidden ${
          isPositive
            ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-700/50'
            : 'bg-gradient-to-br from-red-950 to-slate-900 text-white border-red-800/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-200">
            최종 순이익 (Net Profit)
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isPositive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-red-500/20 text-red-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-extrabold tracking-tight">
            {formatKRW(summary.totalNetProfit)}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-indigo-200">
            <span>순이익률: <strong className={isPositive ? 'text-emerald-400' : 'text-red-400'}>{formatPercent(summary.netMargin)}</strong></span>
            <span>ROI: <strong className="text-indigo-300">{formatPercent(summary.roi)}</strong></span>
          </div>
        </div>
      </div>

      {/* 5. Delivery Performance / 납품 이행률 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            평균 납품 이행률
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {summary.deliveryRate.toFixed(1)}%
            </span>
            {summary.deliveryRate >= 95 ? (
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> 우수
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-500 flex items-center">
                <AlertCircle className="w-3 h-3 mr-0.5 inline" /> 관리 필요
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            발주 {formatNumber(summary.totalOrderQty)}개 중 {formatNumber(summary.totalDeliveredQty)}개 납품
          </div>
        </div>
      </div>
    </div>
  );
};
