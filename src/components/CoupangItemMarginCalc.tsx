import React, { useState, useEffect, useMemo } from "react";
import { 
  Calculator, Plus, Trash2, Edit2, RotateCcw, Search, Sparkles, 
  TrendingUp, Coins, Percent, Award, ArrowUpDown, Check, X 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ItemMarginRow {
  id: string;
  name: string;             // 품목명
  costPrice: number;        // 제품 원가
  packagingFee: number;     // 포장비
  transportFee: number;     // 운반비 (센티입고 등)
  discountRate: number;     // 쿠팡 할인율 (%) (35, 32, 30 등)
  retailPrice: number;      // 온라인 최저가 (소비자가)
  supplyPrice: number;      // 쿠팡 공급가
  isCustomSupply: boolean;  // 공급가 직접 정하기 여부
}

export const INITIAL_ITEM_MARGIN_ROWS: ItemMarginRow[] = [
  {
    id: "item-1",
    name: "NHB 디딜러드 양념통 350ml",
    costPrice: 6816,
    packagingFee: 500,
    transportFee: 500,
    discountRate: 30,
    retailPrice: 17280,
    supplyPrice: 12096,
    isCustomSupply: false,
  },
  {
    id: "item-2",
    name: "NHB 더블리드 양념통 500ml",
    costPrice: 10816,
    packagingFee: 500,
    transportFee: 500,
    discountRate: 35,
    retailPrice: 29000,
    supplyPrice: 18850,
    isCustomSupply: false,
  },
  {
    id: "item-3",
    name: "NHB 디딜러드 양념통 세트 (4P)",
    costPrice: 18224,
    packagingFee: 500,
    transportFee: 500,
    discountRate: 30,
    retailPrice: 37000,
    supplyPrice: 25900,
    isCustomSupply: false,
  },
  {
    id: "item-4",
    name: "NHB 도마 쟁주 집게 세트",
    costPrice: 4950,
    packagingFee: 500,
    transportFee: 500,
    discountRate: 35,
    retailPrice: 15000,
    supplyPrice: 9750,
    isCustomSupply: false,
  },
  {
    id: "item-5",
    name: "NHB 무타공 스텐 키친랙",
    costPrice: 3960,
    packagingFee: 500,
    transportFee: 500,
    discountRate: 35,
    retailPrice: 13000,
    supplyPrice: 8450,
    isCustomSupply: false,
  },
  {
    id: "item-6",
    name: "NHB 밀폐 유리 용기 4종",
    costPrice: 4025,
    packagingFee: 500,
    transportFee: 500,
    discountRate: 30,
    retailPrice: 9900,
    supplyPrice: 6930,
    isCustomSupply: false,
  },
  {
    id: "item-7",
    name: "NHB 소금 후추 전동 그라인더",
    costPrice: 9000,
    packagingFee: 500,
    transportFee: 500,
    discountRate: 30,
    retailPrice: 20000,
    supplyPrice: 14000,
    isCustomSupply: false,
  },
  {
    id: "item-8",
    name: "NHB 실리콘 꿀통 소스병 500ml",
    costPrice: 2800,
    packagingFee: 500,
    transportFee: 500,
    discountRate: 32,
    retailPrice: 12000,
    supplyPrice: 8160,
    isCustomSupply: false,
  }
];

export default function CoupangItemMarginCalc() {
  // LocalStorage state
  const [items, setItems] = useState<ItemMarginRow[]>(() => {
    const saved = localStorage.getItem("coupang_item_margin_rows");
    return saved ? JSON.parse(saved) : INITIAL_ITEM_MARGIN_ROWS;
  });

  // Save changes
  useEffect(() => {
    localStorage.setItem("coupang_item_margin_rows", JSON.stringify(items));
  }, [items]);

  // Form Mode: "retail" (최저가 기준) vs "supply" (쿠팡공급가 직접)
  const [formMode, setFormMode] = useState<"retail" | "supply">("retail");

  // Input states for form
  const [inputName, setInputName] = useState("");
  const [inputCostPrice, setInputCostPrice] = useState<string>("10000");
  const [inputPackagingFee, setInputPackagingFee] = useState<string>("500");
  const [inputTransportFee, setInputTransportFee] = useState<string>("500");
  const [inputDiscountRate, setInputDiscountRate] = useState<number>(35);
  const [inputRetailPrice, setInputRetailPrice] = useState<string>("20000");
  const [inputCustomSupplyPrice, setInputCustomSupplyPrice] = useState<string>("13000");

  // Editing Item state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter & Sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "profit" | "margin_rate" | "price">("margin_rate");

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Derived calculation for current form
  const computedCostTotal = useMemo(() => {
    const cost = parseInt(inputCostPrice) || 0;
    const pack = parseInt(inputPackagingFee) || 0;
    const trans = parseInt(inputTransportFee) || 0;
    return cost + pack + trans;
  }, [inputCostPrice, inputPackagingFee, inputTransportFee]);

  const computedCalculatedSupplyPrice = useMemo(() => {
    if (formMode === "supply") {
      return parseInt(inputCustomSupplyPrice) || 0;
    }
    const retail = parseInt(inputRetailPrice) || 0;
    const rate = inputDiscountRate || 0;
    return Math.round(retail * (1 - rate / 100));
  }, [formMode, inputRetailPrice, inputDiscountRate, inputCustomSupplyPrice]);

  // Handle Form Submission
  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      alert("품목명을 입력해주세요.");
      return;
    }

    const cost = parseInt(inputCostPrice) || 0;
    const pack = parseInt(inputPackagingFee) || 0;
    const trans = parseInt(inputTransportFee) || 0;
    const retail = parseInt(inputRetailPrice) || 0;
    const supply = computedCalculatedSupplyPrice;

    if (editingId) {
      // Update
      setItems(prev => prev.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            name: inputName.trim(),
            costPrice: cost,
            packagingFee: pack,
            transportFee: trans,
            discountRate: inputDiscountRate,
            retailPrice: retail,
            supplyPrice: supply,
            isCustomSupply: formMode === "supply"
          };
        }
        return item;
      }));
      setEditingId(null);
      showToast("품목이 성공적으로 수정되었습니다.");
    } else {
      // Create new
      const newItem: ItemMarginRow = {
        id: `item-${Date.now()}`,
        name: inputName.trim(),
        costPrice: cost,
        packagingFee: pack,
        transportFee: trans,
        discountRate: inputDiscountRate,
        retailPrice: retail,
        supplyPrice: supply,
        isCustomSupply: formMode === "supply"
      };
      setItems(prev => [newItem, ...prev]);
      showToast("새로운 품목이 추가되었습니다.");
    }

    // Reset Form
    setInputName("");
  };

  const handleEditClick = (item: ItemMarginRow) => {
    setEditingId(item.id);
    setInputName(item.name);
    setInputCostPrice(item.costPrice.toString());
    setInputPackagingFee(item.packagingFee.toString());
    setInputTransportFee(item.transportFee.toString());
    setInputDiscountRate(item.discountRate);
    setInputRetailPrice(item.retailPrice.toString());
    setInputCustomSupplyPrice(item.supplyPrice.toString());
    setFormMode(item.isCustomSupply ? "supply" : "retail");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setInputName("");
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("이 품목을 삭제하시겠습니까?")) {
      setItems(prev => prev.filter(i => i.id !== id));
      showToast("품목이 삭제되었습니다.");
    }
  };

  const handleResetSampleData = () => {
    if (confirm("샘플 18개 예시 데이터 상태로 초기화하시겠습니까?")) {
      setItems(INITIAL_ITEM_MARGIN_ROWS);
      showToast("샘플 데이터가 복원되었습니다.");
    }
  };

  const handleClearAll = () => {
    if (confirm("전체 등록 품목을 비우시겠습니까?")) {
      setItems([]);
      showToast("모든 품목이 삭제되었습니다.");
    }
  };

  // Table Data Processing with Calculations
  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const costTotal = item.costPrice + item.packagingFee + item.transportFee; // 합계 원가
      const grossMargin = item.supplyPrice - costTotal; // 마진 (공급가 - 총원가)
      
      // 순수익 (쿠팡 공급가 기준 부가세 예수금 공제 후 실순익)
      const netProfit = Math.round(grossMargin * 0.85); // 15% 세금 및 부대비용 정밀 공제
      const profitMarginRate = item.retailPrice > 0 ? (netProfit / item.retailPrice) * 100 : 0; // 이익률%

      return {
        ...item,
        costTotal,
        grossMargin,
        netProfit,
        profitMarginRate
      };
    });
  }, [items]);

  // Filter and Sort
  const filteredAndSortedItems = useMemo(() => {
    let result = calculatedItems.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === "profit") return b.netProfit - a.netProfit;
      if (sortBy === "margin_rate") return b.profitMarginRate - a.profitMarginRate;
      if (sortBy === "price") return b.retailPrice - a.retailPrice;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [calculatedItems, searchTerm, sortBy]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const itemCount = items.length;
    const totalNetProfit = calculatedItems.reduce((acc, curr) => acc + curr.netProfit, 0);
    const avgProfitMarginRate = itemCount > 0 
      ? calculatedItems.reduce((acc, curr) => acc + curr.profitMarginRate, 0) / itemCount 
      : 0;

    const highestMarginItem = [...calculatedItems].sort((a, b) => b.profitMarginRate - a.profitMarginRate)[0];

    return {
      itemCount,
      totalNetProfit,
      avgProfitMarginRate,
      highestMarginName: highestMarginItem ? highestMarginItem.name : "없음",
      highestMarginRate: highestMarginItem ? highestMarginItem.profitMarginRate : 0
    };
  }, [items, calculatedItems]);

  const formatKRW = (num: number) => num.toLocaleString() + "원";

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 p-4 sm:p-6 lg:p-8 my-8 font-sans">
      
      {/* Toast Popup */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2"
          >
            <Check size={16} />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <Calculator size={28} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              쿠팡 로켓배송 개별품목 마진 계산기
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              쿠팡 공급가 직접 지정 및 35%, 32%, 30% 할인율별 정밀 소비자 가격 역산 시뮬레이터
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSampleData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            샘플 데이터 불러오기
          </button>
          <button
            onClick={handleClearAll}
            className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-rose-800/50 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} />
            전체 비우기
          </button>
        </div>
      </div>

      {/* Top Summary Cards (4 Bento Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        
        {/* Card 1 */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">등록 품목 수</span>
            <span className="text-2xl font-black text-white tracking-tight mt-1 block">
              {metrics.itemCount}개 품목
            </span>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-blue-400">
            <Coins size={22} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">총 예상 순수익 (개당 1회 판매 기준)</span>
            <span className="text-2xl font-black text-emerald-400 tracking-tight mt-1 block">
              {formatKRW(metrics.totalNetProfit)}
            </span>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">평균 순이익률</span>
            <span className="text-2xl font-black text-blue-400 tracking-tight mt-1 block">
              {metrics.avgProfitMarginRate.toFixed(1)}%
            </span>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-blue-400">
            <Percent size={22} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
          <div className="max-w-[170px]">
            <span className="text-xs text-slate-400 font-semibold block">최고 마진율 품목</span>
            <span className="text-sm font-extrabold text-amber-400 tracking-tight mt-1 block truncate" title={metrics.highestMarginName}>
              {metrics.highestMarginName}
            </span>
            <span className="text-[11px] text-amber-300 font-bold block mt-0.5">
              ({metrics.highestMarginRate.toFixed(1)}%)
            </span>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-400">
            <Award size={22} />
          </div>
        </div>

      </div>

      {/* Main Grid: Left Form Panel & Right Table Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Plus size={16} className="text-blue-400" />
              {editingId ? "품목 정보 수정" : "신규 품목 등록"}
            </h3>
            {editingId && (
              <button 
                onClick={handleCancelEdit} 
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <X size={12} /> 취소
              </button>
            )}
          </div>

          {/* Form Mode Selector */}
          <div className="grid grid-cols-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFormMode("retail")}
              className={`py-2 rounded-lg transition ${formMode === "retail" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              최저가 기준 입력
            </button>
            <button
              type="button"
              onClick={() => setFormMode("supply")}
              className={`py-2 rounded-lg transition ${formMode === "supply" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              쿠팡공급가 직접 정하기
            </button>
          </div>

          <form onSubmit={handleSubmitItem} className="flex flex-col gap-3.5 text-xs">
            {/* 품목명 */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">품목명</label>
              <input
                type="text"
                placeholder="예: 무선 마우스 G-Pro"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* 제품 원가 & 포장비 & 운반비 Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-bold mb-1">제품 원가 (원)</label>
                <input
                  type="number"
                  value={inputCostPrice}
                  onChange={(e) => setInputCostPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">포장비 (원)</label>
                <input
                  type="number"
                  value={inputPackagingFee}
                  onChange={(e) => setInputPackagingFee(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-bold mb-1">운반비 (센티입고 등)</label>
                <input
                  type="number"
                  value={inputTransportFee}
                  onChange={(e) => setInputTransportFee(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">쿠팡 할인율 (%)</label>
                <select
                  value={inputDiscountRate}
                  onChange={(e) => setInputDiscountRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-bold"
                >
                  <option value={35}>35%</option>
                  <option value={32}>32%</option>
                  <option value={30}>30%</option>
                  <option value={25}>25%</option>
                  <option value={20}>20%</option>
                </select>
              </div>
            </div>

            {/* 원가 합계 표시 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-slate-400 font-bold">
              <span>원가 합계 (제품+포장+운반)</span>
              <span className="text-white font-mono text-sm font-extrabold">{formatKRW(computedCostTotal)}</span>
            </div>

            {/* Form Mode Dependent Fields */}
            {formMode === "retail" ? (
              <div>
                <label className="block text-slate-300 font-bold mb-1">온라인 최저가 (소비자가 입력)</label>
                <input
                  type="number"
                  value={inputRetailPrice}
                  onChange={(e) => setInputRetailPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-blue-500/50 rounded-xl px-3 py-2.5 text-blue-300 font-mono text-sm font-bold outline-none focus:border-blue-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-300 font-bold mb-1">쿠팡 공급가 (직접 지정)</label>
                <input
                  type="number"
                  value={inputCustomSupplyPrice}
                  onChange={(e) => setInputCustomSupplyPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-blue-500/50 rounded-xl px-3 py-2.5 text-blue-300 font-mono text-sm font-bold outline-none focus:border-blue-400"
                />
              </div>
            )}

            {/* 계산된 쿠팡 공급가 표시 */}
            <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3 flex items-center justify-between">
              <span className="text-blue-300 font-bold">계산된 쿠팡 공급가:</span>
              <span className="text-blue-400 font-mono text-base font-black">{formatKRW(computedCalculatedSupplyPrice)}</span>
            </div>

            <button
              type="submit"
              className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Plus size={16} />
              {editingId ? "수정 완료" : "+ 새 품목 추가하기"}
            </button>
          </form>
        </div>

        {/* Right Table Panel (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 flex flex-col gap-4">
          
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="품목명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                <ArrowUpDown size={12} /> 정렬:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="margin_rate">이익률 높은순</option>
                <option value="profit">순수익 높은순</option>
                <option value="price">최저가 높은순</option>
                <option value="name">품목명순</option>
              </select>
            </div>
          </div>

          {/* High Density Items Table */}
          <div className="overflow-x-auto border border-slate-700/60 rounded-xl max-h-[480px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-2.5">품목명</th>
                  <th className="p-2.5 text-center">할인율</th>
                  <th className="p-2.5 text-right">최저가</th>
                  <th className="p-2.5 text-right text-blue-400">쿠팡공급가</th>
                  <th className="p-2.5 text-right">원가</th>
                  <th className="p-2.5 text-right">포장비</th>
                  <th className="p-2.5 text-right">운반비</th>
                  <th className="p-2.5 text-right">합계</th>
                  <th className="p-2.5 text-right">마진</th>
                  <th className="p-2.5 text-right text-emerald-400">순수익</th>
                  <th className="p-2.5 text-center">이익률</th>
                  <th className="p-2.5 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/30">
                {filteredAndSortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500 font-medium">
                      등록된 품목이 없습니다. 왼쪽 폼에서 신규 품목을 추가해주세요.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/60 transition font-mono">
                      <td className="p-2.5 font-sans font-semibold text-white max-w-[150px] truncate" title={item.name}>
                        {item.name}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800/50 text-[10px]">
                          {item.discountRate}%
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-slate-300">
                        {item.retailPrice.toLocaleString()}원
                      </td>
                      <td className="p-2.5 text-right font-extrabold text-blue-300">
                        {item.supplyPrice.toLocaleString()}원
                      </td>
                      <td className="p-2.5 text-right text-rose-300/80">
                        {item.costPrice.toLocaleString()}원
                      </td>
                      <td className="p-2.5 text-right text-slate-400">
                        {item.packagingFee.toLocaleString()}원
                      </td>
                      <td className="p-2.5 text-right text-slate-400">
                        {item.transportFee.toLocaleString()}원
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-200">
                        {item.costTotal.toLocaleString()}원
                      </td>
                      <td className="p-2.5 text-right font-bold text-indigo-300">
                        {item.grossMargin.toLocaleString()}원
                      </td>
                      <td className="p-2.5 text-right font-black text-emerald-400">
                        {item.netProfit.toLocaleString()}원
                      </td>
                      <td className="p-2.5 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                          item.profitMarginRate >= 25 
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                            : item.profitMarginRate >= 15 
                            ? "bg-blue-950 text-blue-300 border border-blue-800" 
                            : "bg-rose-950 text-rose-300 border border-rose-800"
                        }`}>
                          {item.profitMarginRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-sans">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1 text-slate-400 hover:text-white transition"
                            title="수정"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-rose-400 hover:text-rose-200 transition"
                            title="삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-500 font-medium text-right">
            ※ 품목을 클릭하면 관련 세부 수식을 실시간 연산하여 한눈에 최저가 및 쿠팡 공급가를 시뮬레이션합니다.
          </div>

        </div>

      </div>

    </div>
  );
}
