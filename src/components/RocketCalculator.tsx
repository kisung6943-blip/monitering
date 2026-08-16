import React, { useState, useEffect, useRef } from 'react';
import {
  OrderSettlement,
  ComputedSettlement,
  ProductMaster,
  DailyProductAdCost,
  FilterState,
  ViewMode,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTLEMENTS, INITIAL_DAILY_AD_COSTS } from '../data/mockData';
import {
  computeSettlementItem,
  computeSummary,
  filterSettlements,
  exportToExcel,
} from '../utils/settlementUtils';
import { Header } from './Header';
import { SummaryCards } from './SummaryCards';
import { SettlementTable } from './SettlementTable';
import { AnalyticsView } from './AnalyticsView';
import { DailyAdManager } from './DailyAdManager';
import { POModal } from './POModal';
import { WeeklyPurchaseModal } from './WeeklyPurchaseModal';
import { AdAllocatorModal } from './AdAllocatorModal';
import { ProductMasterModal } from './ProductMasterModal';
import { AIAdvisorModal } from './AIAdvisorModal';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx';

const mergeAllProductSources = (...sources: any[][]): ProductMaster[] => {
  const map = new Map<string, ProductMaster>();

  const initialByName = new Map<string, ProductMaster>();
  INITIAL_PRODUCTS.forEach((p) => {
    if (p.name) initialByName.set(p.name.trim(), p);
  });

  sources.forEach((list) => {
    if (Array.isArray(list)) {
      list.forEach((p) => {
        if (p && p.name) {
          const trimmedName = p.name.trim();
          const id = p.id || `prod-${trimmedName}`;
          const existingById = map.get(id);
          const existingByName = Array.from(map.values()).find((item) => item.name === trimmedName);
          const existing = existingById || existingByName;

          const initialMatch = initialByName.get(trimmedName);

          const supplyPrice =
            existing && existing.supplyPrice > 0
              ? existing.supplyPrice
              : typeof p.supplyPrice === 'number' && p.supplyPrice > 0
              ? p.supplyPrice
              : initialMatch?.supplyPrice || 10000;

          const unitCost =
            existing && existing.unitCost > 0
              ? existing.unitCost
              : typeof p.unitCost === 'number' && p.unitCost > 0
              ? p.unitCost
              : initialMatch?.unitCost || 4000;

          const commissionRate =
            typeof p.commissionRate === 'number'
              ? p.commissionRate
              : existing?.commissionRate ?? initialMatch?.commissionRate ?? 10.8;

          const defaultOtherFee =
            typeof p.defaultOtherFee === 'number'
              ? p.defaultOtherFee
              : existing?.defaultOtherFee ?? initialMatch?.defaultOtherFee ?? 0;

          const item: ProductMaster = {
            id: existing ? existing.id : id,
            sku: p.sku || existing?.sku || initialMatch?.sku || `SKU-${id}`,
            name: trimmedName,
            category: p.category || existing?.category || initialMatch?.category || '주방용품',
            supplyPrice,
            unitCost,
            commissionRate,
            defaultOtherFee,
          };
          map.set(item.id, item);
        }
      });
    }
  });

  return Array.from(map.values());
};

export default function RocketCalculator() {
  // LocalStorage & Supabase state initialization
  const [products, setProducts] = useState<ProductMaster[]>(() => {
    let p1: any[] = [];
    let p2: any[] = [];
    try {
      const saved1 = localStorage.getItem('coupang_products');
      if (saved1) p1 = JSON.parse(saved1);
    } catch (e) {}
    try {
      const saved2 = localStorage.getItem('price_monitor_products');
      if (saved2) p2 = JSON.parse(saved2);
    } catch (e) {}

    const merged = mergeAllProductSources(INITIAL_PRODUCTS, p1, p2);
    return merged;
  });

  const [settlements, setSettlements] = useState<OrderSettlement[]>(() => {
    const saved = localStorage.getItem('coupang_settlements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((s: any) => s.productName?.includes('요거트'))) return INITIAL_SETTLEMENTS;
        return parsed;
      } catch (e) {}
    }
    return INITIAL_SETTLEMENTS;
  });

  const [dailyAdCosts, setDailyAdCosts] = useState<DailyProductAdCost[]>(() => {
    const saved = localStorage.getItem('coupang_daily_ads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((a: any) => a.productName?.includes('요거트'))) return INITIAL_DAILY_AD_COSTS;
        return parsed;
      } catch (e) {}
    }
    return INITIAL_DAILY_AD_COSTS;
  });

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [editingPO, setEditingPO] = useState<OrderSettlement | null>(null);
  const [isPOModalOpen, setIsPOModalOpen] = useState<boolean>(false);
  const [isWeeklyPurchaseOpen, setIsWeeklyPurchaseOpen] = useState<boolean>(false);
  const [isAdAllocatorOpen, setIsAdAllocatorOpen] = useState<boolean>(false);
  const [isProductMasterOpen, setIsProductMasterOpen] = useState<boolean>(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState<boolean>(false);

  // Hidden file input for Excel import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    searchKeyword: '',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    category: 'all',
    status: 'all',
    frequencyType: 'all',
    groupBy: 'none',
  });

  // Fetch real data from Supabase Cloud DB on mount
  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const { data: cloudProds } = await supabase.from('products').select('*');
        const { data: coupangProds } = await supabase.from('coupang_products').select('*');
        const { data: cloudSettles } = await supabase.from('coupang_settlements').select('*');
        const { data: cloudDailyAds } = await supabase.from('coupang_daily_ads').select('*');

        let p1: any[] = [];
        let p2: any[] = [];
        try {
          const saved1 = localStorage.getItem('coupang_products');
          if (saved1) p1 = JSON.parse(saved1);
        } catch (e) {}
        try {
          const saved2 = localStorage.getItem('price_monitor_products');
          if (saved2) p2 = JSON.parse(saved2);
        } catch (e) {}

        let merged = mergeAllProductSources(INITIAL_PRODUCTS, p1, p2, coupangProds || [], cloudProds || []);

        if (cloudSettles && cloudSettles.length > 0) {
          setSettlements(cloudSettles);
          localStorage.setItem('coupang_settlements', JSON.stringify(cloudSettles));

          const extraProds: any[] = [];
          cloudSettles.forEach((s) => {
            if (s.productId && s.productName) {
              extraProds.push({
                id: s.productId,
                name: s.productName,
                category: s.category || '주방용품',
                supplyPrice: s.supplyPrice || 0,
                unitCost: s.unitCost || 0,
                commissionRate: s.commissionRate || 0,
                defaultOtherFee: s.otherFee || 0,
              });
            }
          });
          merged = mergeAllProductSources(merged, extraProds);
        } else {
          // Seed Supabase if empty
          await supabase.from('coupang_settlements').upsert(INITIAL_SETTLEMENTS);
        }

        setProducts(merged);
        localStorage.setItem('coupang_products', JSON.stringify(merged));
      } catch (err) {
        console.warn('Supabase cloud sync warning:', err);
      }
    };
    fetchCloudData();
  }, []);

  // Save to LocalStorage & Supabase DB
  useEffect(() => {
    localStorage.setItem('coupang_products', JSON.stringify(products));
    try {
      const formatted = products.map((p) => ({
        id: p.id,
        name: p.name,
      }));
      supabase.from('products').upsert(formatted, { onConflict: 'id' }).then();
      supabase.from('coupang_products').upsert(products).then();
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    localStorage.setItem('coupang_settlements', JSON.stringify(settlements));
    try {
      supabase.from('coupang_settlements').upsert(settlements);
    } catch (e) {}
  }, [settlements]);

  useEffect(() => {
    localStorage.setItem('coupang_daily_ads', JSON.stringify(dailyAdCosts));
    try {
      supabase.from('coupang_daily_ads').upsert(dailyAdCosts);
    } catch (e) {}
  }, [dailyAdCosts]);

  // Compute settlements & summary
  const computedSettlements: ComputedSettlement[] = settlements.map(computeSettlementItem);
  const filteredSettlements = filterSettlements(computedSettlements, filter);
  const summary = computeSummary(filteredSettlements);

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category).concat(settlements.map((s) => s.category))));

  // Handlers
  const handleOpenNewPO = () => {
    setEditingPO(null);
    setIsPOModalOpen(true);
  };

  const handleEditPO = (item: OrderSettlement) => {
    setEditingPO(item);
    setIsPOModalOpen(true);
  };

  const handleSavePO = (savedPO: OrderSettlement) => {
    setSettlements((prev) => {
      const exists = prev.some((s) => s.id === savedPO.id);
      if (exists) {
        return prev.map((s) => (s.id === savedPO.id ? savedPO : s));
      }
      return [savedPO, ...prev];
    });
  };

  const handleBatchSaveWeeklyOrders = (newOrders: OrderSettlement[]) => {
    setSettlements((prev) => [...newOrders, ...prev]);
  };

  const handleDeletePO = (id: string) => {
    if (confirm('이 정산 항목을 삭제하시겠습니까?')) {
      setSettlements((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleBatchDelete = (ids: string[]) => {
    setSettlements((prev) => prev.filter((s) => !ids.includes(s.id)));
  };

  const handleDuplicatePO = (item: OrderSettlement) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newItem: OrderSettlement = {
      ...item,
      id: `po-${Date.now()}`,
      poNumber: `${item.poNumber}-COPY`,
      poDate: todayStr,
      deliveryDate: todayStr,
    };
    setSettlements((prev) => [newItem, ...prev]);
  };

  const handleUpdateInline = (id: string, field: keyof OrderSettlement, value: any) => {
    setSettlements((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = {
          ...item,
          [field]: value,
        };
        if (field === 'productName') {
          const matched = products.find((p) => p.name === value);
          if (matched) {
            updated.productId = matched.id;
            updated.supplyPrice = matched.supplyPrice;
            updated.unitCost = matched.unitCost;
            updated.commissionRate = matched.commissionRate;
          }
        }
        return updated;
      })
    );
  };

  // Daily Ad Handlers
  const handleSaveDailyAd = (newAd: Omit<DailyProductAdCost, 'id'>) => {
    const adId = `ad-${Date.now()}`;
    const createdItem: DailyProductAdCost = { ...newAd, id: adId };

    setDailyAdCosts((prev) => {
      // 만약 동일 날짜 동일 상품 기존 항목이 있으면 업데이트
      const existsIdx = prev.findIndex(
        (a) => a.date === newAd.date && a.productId === newAd.productId
      );
      if (existsIdx >= 0) {
        const copy = [...prev];
        copy[existsIdx] = createdItem;
        return copy;
      }
      return [createdItem, ...prev];
    });

    // 해당 날짜 및 제품 정산건 광고비 자동 반영
    setSettlements((prev) =>
      prev.map((s) => {
        if ((s.poDate === newAd.date || s.deliveryDate === newAd.date) && s.productId === newAd.productId) {
          return { ...s, adCost: newAd.adCost };
        }
        return s;
      })
    );
  };

  const handleUpdateDailyAd = (id: string, cost: number, memo?: string) => {
    setDailyAdCosts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, adCost: cost, memo: memo ?? a.memo };
        // 발주건에도 즉시 반영
        setSettlements((sList) =>
          sList.map((s) => {
            if ((s.poDate === a.date || s.deliveryDate === a.date) && s.productId === a.productId) {
              return { ...s, adCost: cost };
            }
            return s;
          })
        );
        return updated;
      })
    );
  };

  const handleDeleteDailyAd = (id: string) => {
    setDailyAdCosts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSyncAdToOrders = (adsList: DailyProductAdCost[]) => {
    setSettlements((prev) =>
      prev.map((item) => {
        const matchingAd = adsList.find(
          (a) => (a.date === item.poDate || a.date === item.deliveryDate) && a.productId === item.productId
        );
        if (matchingAd) {
          return {
            ...item,
            adCost: matchingAd.adCost,
          };
        }
        return item;
      })
    );
  };

  // Apply batch ad spend allocation
  const handleApplyAdAllocation = (allocatedCosts: Record<string, number>) => {
    setSettlements((prev) =>
      prev.map((item) => {
        if (allocatedCosts[item.id] !== undefined) {
          return {
            ...item,
            adCost: allocatedCosts[item.id],
          };
        }
        return item;
      })
    );
  };

  // Product master handlers
  const handleAddProduct = (prod: ProductMaster) => {
    setProducts((prev) => [prod, ...prev]);
  };

  const handleUpdateProduct = (prod: ProductMaster) => {
    setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
    setSettlements((prev) =>
      prev.map((s) =>
        s.productId === prod.id || s.productName === prod.name
          ? {
              ...s,
              productName: prod.name,
              supplyPrice: prod.supplyPrice > 0 ? prod.supplyPrice : s.supplyPrice,
              unitCost: prod.unitCost > 0 ? prod.unitCost : s.unitCost,
            }
          : s
      )
    );
    setDailyAdCosts((prev) =>
      prev.map((a) => (a.productId === prod.id || a.productName === prod.name ? { ...a, productName: prod.name } : a))
    );
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Reset to mock initial data
  const handleResetData = () => {
    if (confirm('초기 샘플 데이터로 복원하시겠습니까? 기존 변경사항이 초기화됩니다.')) {
      setProducts(INITIAL_PRODUCTS);
      setSettlements(INITIAL_SETTLEMENTS);
      setDailyAdCosts(INITIAL_DAILY_AD_COSTS);
    }
  };

  // Excel Import Handler
  const handleImportExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!data || data.length === 0) {
          alert('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        const newItems: OrderSettlement[] = data.map((row, idx) => ({
          id: `po-import-${Date.now()}-${idx}`,
          poNumber: row['발주번호'] || `PO-IMP-${idx + 1}`,
          poDate: row['발주일자'] || row['발주일'] || new Date().toISOString().split('T')[0],
          deliveryDate: row['입고일자'] || row['발주일자'] || new Date().toISOString().split('T')[0],
          productId: 'custom',
          productName: row['상품명'] || '미지정 상품',
          category: row['카테고리'] || '기타',
          orderQty: Number(row['발주수량']) || 0,
          deliveredQty: Number(row['납품수량']) || Number(row['발주수량']) || 0,
          supplyPrice: Number(row['매입가']) || Number(row['매입가(원)']) || 0,
          unitCost: Number(row['제조원가']) || Number(row['제조원가(원)']) || 0,
          commissionRate: Number(row['판매수수료율']) || Number(row['수수료율']) || 0, // 쿠팡 로켓 수수료 0%
          adCost: Number(row['광고비']) || Number(row['광고비(원)']) || 0,
          otherFee: Number(row['기타물류비']) || Number(row['기타비용']) || 0,
          status: row['상태'] || '입고완료',
          frequencyType: row['발주주기'] || '수시비정기',
          memo: row['비고'] || '엑셀 가져오기 항목',
        }));

        setSettlements((prev) => [...newItems, ...prev]);
        alert(`${newItems.length}건의 발주 정산 데이터가 정상 등록되었습니다.`);
      } catch (err) {
        console.error('Excel Import Error:', err);
        alert('엑셀 파일 처리 중 오류가 발생했습니다. 양식을 확인해주세요.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased pb-12">
      {/* Hidden file input for Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcelFile}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Main Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenNewPO={handleOpenNewPO}
        onOpenWeeklyPurchase={() => setIsWeeklyPurchaseOpen(true)}
        onOpenProductMaster={() => setIsProductMasterOpen(true)}
        onExportExcel={() => exportToExcel(filteredSettlements)}
        onImportExcelClick={() => fileInputRef.current?.click()}
        onResetData={handleResetData}
        onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
        itemCount={settlements.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* KPI Cards Overview */}
        <SummaryCards summary={summary} />

        {/* View Content Switcher */}
        {viewMode === 'table' && (
          <SettlementTable
            settlements={filteredSettlements}
            filter={filter}
            setFilter={setFilter}
            onEditPO={handleEditPO}
            onDeletePO={handleDeletePO}
            onBatchDelete={handleBatchDelete}
            onDuplicatePO={handleDuplicatePO}
            onUpdateInline={handleUpdateInline}
            categories={categories}
          />
        )}

        {viewMode === 'daily_ad' && (
          <DailyAdManager
            dailyAdCosts={dailyAdCosts}
            products={products}
            settlements={settlements}
            onSaveDailyAd={handleSaveDailyAd}
            onUpdateDailyAd={handleUpdateDailyAd}
            onDeleteDailyAd={handleDeleteDailyAd}
            onSyncAdToOrders={handleSyncAdToOrders}
            onUpdateProduct={handleUpdateProduct}
          />
        )}

        {viewMode === 'analytics' && (
          <AnalyticsView settlements={computedSettlements} />
        )}
      </main>

      {/* Modals */}
      <WeeklyPurchaseModal
        isOpen={isWeeklyPurchaseOpen}
        onClose={() => setIsWeeklyPurchaseOpen(false)}
        products={products}
        onBatchSaveWeeklyOrders={handleBatchSaveWeeklyOrders}
        onDeleteProduct={handleDeleteProduct}
      />

      <POModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        onSave={handleSavePO}
        initialData={editingPO}
        products={products}
      />

      <AdAllocatorModal
        isOpen={isAdAllocatorOpen}
        onClose={() => setIsAdAllocatorOpen(false)}
        settlements={computedSettlements}
        onApplyAdAllocation={handleApplyAdAllocation}
      />

      <ProductMasterModal
        isOpen={isProductMasterOpen}
        onClose={() => setIsProductMasterOpen(false)}
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      <AIAdvisorModal
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
        settlements={computedSettlements}
        summary={summary}
      />
    </div>
  );
}

