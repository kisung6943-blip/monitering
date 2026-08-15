import React from 'react';
import { ComputedSettlement } from '../types';
import { computeSummary, formatKRW, formatPercent } from '../utils/settlementUtils';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Calendar, Layers } from 'lucide-react';

interface AnalyticsViewProps {
  settlements: ComputedSettlement[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ settlements }) => {
  const overallSummary = computeSummary(settlements);

  // 1. Group data by date for time-series chart
  const dateMap = new Map<string, { date: string; gross: number; profit: number; adCost: number; comm: number }>();
  settlements.forEach((item) => {
    const date = item.poDate;
    const existing = dateMap.get(date) || { date, gross: 0, profit: 0, adCost: 0, comm: 0 };
    existing.gross += item.grossAmount;
    existing.profit += item.netProfit;
    existing.adCost += item.adCost;
    existing.comm += item.commissionAmount;
    dateMap.set(date, existing);
  });

  const timeSeriesData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // 2. Cost structure pie chart data
  const pieData = [
    { name: '제조원가', value: overallSummary.totalCost, color: '#64748b' },
    { name: '광고비', value: overallSummary.totalAdCost, color: '#f59e0b' },
    { name: '기타/물류비', value: overallSummary.totalOtherFee, color: '#38bdf8' },
    { name: '최종 순이익', value: Math.max(0, overallSummary.totalNetProfit), color: '#10b981' },
  ].filter((d) => d.value > 0);

  // 3. Product profitability ranking chart data
  const productProfitMap = new Map<string, { name: string; gross: number; profit: number; margin: number }>();
  settlements.forEach((item) => {
    const existing = productProfitMap.get(item.productName) || {
      name: item.productName,
      gross: 0,
      profit: 0,
      margin: 0,
    };
    existing.gross += item.grossAmount;
    existing.profit += item.netProfit;
    productProfitMap.set(item.productName, existing);
  });

  const productRankingData = Array.from(productProfitMap.values())
    .map((p) => ({
      ...p,
      margin: p.gross > 0 ? (p.profit / p.gross) * 100 : 0,
    }))
    .sort((a, b) => b.profit - a.profit);

  // 4. Frequency type comparison
  const weeklyItems = settlements.filter((s) => s.frequencyType === '주간정기');
  const adhocItems = settlements.filter((s) => s.frequencyType === '수시비정기');
  const weeklySummary = computeSummary(weeklyItems);
  const adhocSummary = computeSummary(adhocItems);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>쿠팡 로켓발주 실시간 손익 리포트</span>
            </div>
            <h2 className="text-xl font-bold">발주 일자별 & 품목별 정산 대시보드</h2>
            <p className="text-xs text-slate-400 mt-1">
              매출액 대비 원가, 광고비 및 기타물류비 차감 구조를 정밀하게 분석하여 순이익 극대화를 돕습니다.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700">
            <div>
              <div className="text-2xs text-slate-400">총 순이익률</div>
              <div className="text-lg font-extrabold text-emerald-400 font-mono">
                {overallSummary.netMargin.toFixed(1)}%
              </div>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div>
              <div className="text-2xs text-slate-400">원가 대비 ROI</div>
              <div className="text-lg font-extrabold text-indigo-300 font-mono">
                {overallSummary.roi.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Time Series Chart & Deduction Breakdown Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Profit & Gross Revenue Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-rose-500" />
              일자별 매출액 vs 순이익 & 광고비 추이
            </h3>
            <span className="text-2xs text-slate-500">단위: 원</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `${(val / 10000).toFixed(0)}만`} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [formatKRW(Number(value)), '']}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gross" name="총매출액" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="adCost" name="광고비" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="profit" name="순이익" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost & Deduction Breakdown Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <PieChartIcon className="w-4 h-4 mr-2 text-indigo-500" />
              매출 비중 및 비용 차감 구조
            </h3>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [formatKRW(Number(val)), '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1.5 text-2xs">
            {pieData.map((item) => {
              const pct = overallSummary.totalGross > 0 ? (item.value / overallSummary.totalGross) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <div className="font-mono text-slate-900 dark:text-white font-bold">
                    {formatKRW(item.value)} ({pct.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Product Profitability Ranking & Frequency Type Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Profitability Ranking Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" />
            품목별 순이익 기여도 랭킹 (Top Profit Products)
          </h3>

          <div className="space-y-3 text-xs">
            {productRankingData.map((p, idx) => {
              const maxProfit = productRankingData[0]?.profit || 1;
              const barWidth = Math.max(5, Math.min(100, (Math.max(0, p.profit) / maxProfit) * 100));

              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[280px]">
                      {idx + 1}. {p.name}
                    </span>
                    <div className="font-mono font-extrabold text-slate-900 dark:text-white">
                      {formatKRW(p.profit)}{' '}
                      <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-normal">
                        ({p.margin.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.profit >= 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Regular vs Ad-hoc Orders Comparison Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-purple-500" />
              주간 정기발주 vs 수시 비정기발주 비교
            </h3>

            {/* Weekly Orders Summary */}
            <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 mb-3 text-xs space-y-1">
              <div className="flex justify-between font-bold text-blue-900 dark:text-blue-300">
                <span>주간 정기 발주 ({weeklySummary.totalCount}건)</span>
                <span>{formatKRW(weeklySummary.totalGross)}</span>
              </div>
              <div className="flex justify-between text-2xs text-slate-600 dark:text-slate-300">
                <span>납품률: {weeklySummary.deliveryRate.toFixed(1)}%</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  순이익: {formatKRW(weeklySummary.totalNetProfit)} ({weeklySummary.netMargin.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Ad-hoc Orders Summary */}
            <div className="bg-purple-50/60 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50 text-xs space-y-1">
              <div className="flex justify-between font-bold text-purple-900 dark:text-purple-300">
                <span>수시 비정기 발주 ({adhocSummary.totalCount}건)</span>
                <span>{formatKRW(adhocSummary.totalGross)}</span>
              </div>
              <div className="flex justify-between text-2xs text-slate-600 dark:text-slate-300">
                <span>납품률: {adhocSummary.deliveryRate.toFixed(1)}%</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  순이익: {formatKRW(adhocSummary.totalNetProfit)} ({adhocSummary.netMargin.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-2xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            💡 <strong>정산 팁:</strong> 쿠팡 타임딜이나 긴급 발주 등 수시 비정기 발주의 경우, 광고비가 집중 투입되는 경우가 많으므로 품목별·일별 광고비를 수시로 점검하세요.
          </div>
        </div>
      </div>
    </div>
  );
};
