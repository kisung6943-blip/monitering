import React from 'react';
import { ViewMode } from '../types';
import {
  Table,
  BarChart3,
  Sparkles,
  PackageCheck,
  Calculator,
  Download,
  Upload,
  Plus,
  RefreshCw,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenNewPO: () => void;
  onOpenWeeklyPurchase: () => void;
  onOpenProductMaster: () => void;
  onExportExcel: () => void;
  onImportExcelClick: () => void;
  onResetData: () => void;
  onOpenAIAdvisor: () => void;
  itemCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  onOpenNewPO,
  onOpenWeeklyPurchase,
  onOpenProductMaster,
  onExportExcel,
  onImportExcelClick,
  onResetData,
  onOpenAIAdvisor,
  itemCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title & Brand Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/20">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  쿠팡 로켓발주 정산 계산기
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  로켓배송 (매입가=매출 / 수수료 0원)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                쿠팡 벤더 직매입 정산: 일주일 단위 매입 입력 & 제품별 광고비 통합 관리 ({itemCount}건 발주)
              </p>
            </div>
          </div>

          {/* Secondary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenWeeklyPurchase}
              className="inline-flex items-center px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md border border-indigo-400/30 ring-2 ring-indigo-500/30"
              title="1주일 단위로 전체 제품 매입 발주수량 및 단가를 일괄 입력"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              주간 매입 일괄 입력
            </button>

            <button
              onClick={onOpenNewPO}
              className="inline-flex items-center px-3.5 py-2 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              단일 발주 등록
            </button>

            <button
              onClick={() => setViewMode('daily_ad')}
              className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="제품별 일별 광고비를 수기 또는 매트릭스로 입력"
            >
              <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-300" />
              일별 광고비 관리
            </button>



            <button
              onClick={onOpenProductMaster}
              className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
              상품 마스터
            </button>

            <button
              onClick={onOpenAIAdvisor}
              className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300 animate-pulse" />
              AI 마진 진단
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="엑셀 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            <button
              onClick={onImportExcelClick}
              className="inline-flex items-center px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="엑셀 파일 가져오기"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center px-2.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
              title="초기 샘플 데이터 재설정"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1 mt-3.5 pt-2 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'table'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5 mr-1.5" />
            정산 내역 테이블
          </button>

          <button
            onClick={() => setViewMode('daily_ad')}
            className={`inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'daily_ad'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            제품별 일별 광고비 입력
          </button>

          <button
            onClick={() => setViewMode('analytics')}
            className={`inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'analytics'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
            손익 대시보드 & 차트
          </button>
        </div>
      </div>
    </header>
  );
};
