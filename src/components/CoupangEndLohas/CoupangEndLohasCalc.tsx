import React, { useState, useEffect, useRef } from 'react';
import { calculateLohas, formatKoreanWordWon } from './calculator';
import { CalculationInput, CalculationResult, CalculationRecord, DailySaleRecord } from './types';
import { ResultReport } from './ResultReport';
import { HistoryList } from './HistoryList';
import { ComparisonMatrix } from './ComparisonMatrix';
import { supabase } from '../../supabase';
import { 
  Calculator, 
  RefreshCw, 
  Info,
  CheckCircle2,
  Plus,
  CloudCheck
} from 'lucide-react';

const DEFAULT_INPUTS: CalculationInput = {
  sellingPrice: 25000,
  productCost: 8000,
  shippingFee: 1900,
  packagingFee: 500,
  otherCost: 0,
  platformFeeRate: 11.88,
  dailyAdBudget: 10000,
  adRoas: null,
};

const defaultInputsList: Array<{ title: string; input: CalculationInput; createdAt: string; memo?: string; dailySales?: DailySaleRecord[] }> = [
  {
    title: '도마거치대1라인',
    input: {
      sellingPrice: 14740,
      productCost: 6300,
      shippingFee: 1900,
      packagingFee: 500,
      otherCost: 0,
      platformFeeRate: 11.88,
      dailyAdBudget: 10000,
      adRoas: null,
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    title: '하도시품누룽지520g(5개)',
    input: {
      sellingPrice: 26900,
      productCost: 14240,
      shippingFee: 1900,
      packagingFee: 500,
      otherCost: 0,
      platformFeeRate: 11.88,
      dailyAdBudget: 10000,
      adRoas: null,
    },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    title: '깨그라인더70(로켓)',
    input: {
      sellingPrice: 5165,
      productCost: 2000,
      shippingFee: 900,
      packagingFee: 350,
      otherCost: 0,
      platformFeeRate: 0,
      dailyAdBudget: 10000,
      adRoas: null,
    },
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    title: '솔트605(500g)',
    input: {
      sellingPrice: 48300,
      productCost: 25000,
      shippingFee: 1900,
      packagingFee: 500,
      otherCost: 0,
      platformFeeRate: 11.88,
      dailyAdBudget: 10000,
      adRoas: null,
    },
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    title: '솔트605(250g)',
    input: {
      sellingPrice: 27000,
      productCost: 14940,
      shippingFee: 1900,
      packagingFee: 500,
      otherCost: 0,
      platformFeeRate: 11.88,
      dailyAdBudget: 10000,
      adRoas: null,
    },
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    title: '도마거치대2라인(로켓)',
    input: {
      sellingPrice: 16570,
      productCost: 11000,
      shippingFee: 900,
      packagingFee: 500,
      otherCost: 0,
      platformFeeRate: 0,
      dailyAdBudget: 40000,
      adRoas: null,
    },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    memo: '수동광고 중지 후 매출최적화 광고 신규 전환',
  },
  {
    title: '프리미엄고무패킹22',
    input: {
      sellingPrice: 8050,
      productCost: 2000,
      shippingFee: 1900,
      packagingFee: 500,
      otherCost: 0,
      platformFeeRate: 11.88,
      dailyAdBudget: 10000,
      adRoas: null,
    },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    dailySales: [
      { id: '1', date: '2026-07-05', qty: 1 },
      { id: '2', date: '2026-07-06', qty: 20 },
    ],
  },
];

export const DEFAULT_RECORDS: CalculationRecord[] = defaultInputsList.map((item, idx) => ({
  id: (1783240000000 + idx).toString(),
  title: item.title,
  input: item.input,
  result: calculateLohas(item.input),
  createdAt: item.createdAt,
  memo: item.memo,
  dailySales: item.dailySales,
}));

export function CoupangEndLohasCalc() {
  const [inputs, setInputs] = useState<CalculationInput>(DEFAULT_INPUTS);
  const [productTitle, setProductTitle] = useState<string>('쿠팡 상품 A');
  const [rawAdRoas, setRawAdRoas] = useState<string>('');
  const [rawPlatformFeeRate, setRawPlatformFeeRate] = useState<string>(DEFAULT_INPUTS.platformFeeRate.toString());
  const [errors, setErrors] = useState<{ sellingPrice?: string; productCost?: string }>({});

  const [activeResult, setActiveResult] = useState<CalculationResult | null>(null);
  const [activeRecord, setActiveRecord] = useState<CalculationRecord | null>(null);

  const [records, setRecords] = useState<CalculationRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lohas_records');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return DEFAULT_RECORDS;
  });

  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  // Load from Supabase DB on mount
  useEffect(() => {
    const fetchSupabaseRecords = async () => {
      try {
        const { data, error } = await supabase.from('lohas_records').select('*');
        if (!error && data && data.length > 0) {
          const parsed = data.map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            input: typeof item.input === 'string' ? JSON.parse(item.input) : item.input,
            result: typeof item.result === 'string' ? JSON.parse(item.result) : item.result,
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
            memo: item.memo || '',
            dailySales: typeof item.daily_sales === 'string' ? JSON.parse(item.daily_sales) : (item.dailySales || []),
          }));
          setRecords(parsed);
          localStorage.setItem('lohas_records', JSON.stringify(parsed));
        } else if (!error && data && data.length === 0) {
          const payload = DEFAULT_RECORDS.map(r => ({
            id: r.id,
            title: r.title,
            input: r.input,
            result: r.result,
            created_at: r.createdAt,
            memo: r.memo || '',
            daily_sales: r.dailySales || [],
          }));
          await supabase.from('lohas_records').upsert(payload);
        }
      } catch (e) {
        console.warn('Supabase lohas_records load error:', e);
      }
    };
    fetchSupabaseRecords();
  }, []);

  // Save to LocalStorage and Supabase DB automatically
  useEffect(() => {
    localStorage.setItem('lohas_records', JSON.stringify(records));

    const syncToSupabase = async () => {
      try {
        const payload = records.map(r => ({
          id: r.id,
          title: r.title,
          input: r.input,
          result: r.result,
          created_at: r.createdAt,
          memo: r.memo || '',
          daily_sales: r.dailySales || [],
        }));
        if (payload.length > 0) {
          await supabase.from('lohas_records').upsert(payload);
        }
      } catch (e) {
        console.warn('Supabase lohas_records sync error:', e);
      }
    };
    syncToSupabase();
  }, [records]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNumberChange = (field: keyof CalculationInput, valueStr: string) => {
    const cleaned = valueStr.replace(/[^0-9]/g, '');
    const numValue = cleaned === '' ? 0 : parseInt(cleaned, 10);
    
    setInputs(prev => ({
      ...prev,
      [field]: numValue
    }));

    if (field === 'sellingPrice' && numValue > 0) {
      setErrors(prev => ({ ...prev, sellingPrice: undefined }));
    }
    if (field === 'productCost' && numValue > 0) {
      setErrors(prev => ({ ...prev, productCost: undefined }));
    }
  };

  const handleFloatChange = (field: 'platformFeeRate', valueStr: string) => {
    const val = valueStr.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    const cleaned = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    
    setRawPlatformFeeRate(cleaned);
    const numValue = cleaned === '' || cleaned === '.' ? 0 : parseFloat(cleaned);
    setInputs(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleCalculate = (e?: React.FormEvent, mode: 'create' | 'update' = 'create') => {
    if (e) e.preventDefault();

    const newErrors: { sellingPrice?: string; productCost?: string } = {};
    if (!inputs.sellingPrice || inputs.sellingPrice <= 0) {
      newErrors.sellingPrice = '판매가를 입력해 주세요.';
    }
    if (!inputs.productCost || inputs.productCost <= 0) {
      newErrors.productCost = '상품원가를 입력해 주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('필수 항목을 정확히 입력해 주세요.', 'info');
      return;
    }

    const adRoasVal = rawAdRoas.trim() === '' ? null : parseInt(rawAdRoas.replace(/[^0-9]/g, ''), 10);
    const finalInputs = { ...inputs, adRoas: adRoasVal };

    const result = calculateLohas(finalInputs);
    setActiveResult(result);

    const titleText = productTitle.trim() || `상품 #${records.length + 1}`;

    if (mode === 'update' && activeRecord) {
      const updatedRecord: CalculationRecord = {
        ...activeRecord,
        title: titleText,
        input: finalInputs,
        result: result,
        createdAt: new Date().toISOString(),
      };

      setRecords(prev => prev.map(r => r.id === activeRecord.id ? updatedRecord : r));
      setActiveRecord(updatedRecord);
      showToast(`'${titleText}' 상품 정보가 업데이트되어 슈파베이스 클라우드에 자동 저장되었습니다.`);
    } else {
      const newRecord: CalculationRecord = {
        id: Date.now().toString(),
        title: titleText,
        input: finalInputs,
        result: result,
        createdAt: new Date().toISOString(),
      };

      setRecords(prev => [newRecord, ...prev].slice(0, 100));
      setActiveRecord(newRecord);
      showToast(`'${titleText}' 상품이 새롭게 등록되어 슈파베이스 클라우드에 자동 저장되었습니다.`);
    }

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setActiveRecord(null);
    setProductTitle('쿠팡 상품 A');
    showToast('수정 모드가 해제되었습니다.', 'info');
  };

  const handleUpdateMemo = (memo: string) => {
    if (!activeRecord) return;
    const updatedRecord = { ...activeRecord, memo };
    setActiveRecord(updatedRecord);
    setRecords(prev => prev.map(r => r.id === activeRecord.id ? updatedRecord : r));
  };

  const handleUpdateDailySales = (dailySales: DailySaleRecord[]) => {
    if (!activeRecord) return;
    const updatedRecord = { ...activeRecord, dailySales };
    setActiveRecord(updatedRecord);
    setRecords(prev => prev.map(r => r.id === activeRecord.id ? updatedRecord : r));
  };

  const handleSelectRecord = (record: CalculationRecord) => {
    setInputs(record.input);
    setProductTitle(record.title);
    setRawAdRoas(record.input.adRoas !== null ? record.input.adRoas.toString() : '');
    setRawPlatformFeeRate(record.input.platformFeeRate.toString());
    setActiveResult(record.result);
    setActiveRecord(record);
    showToast(`'${record.title}' 상품 정보를 불러왔습니다.`, 'info');
    
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    setSelectedForComparison(prev => prev.filter(item => item !== id));
    supabase.from('lohas_records').delete().eq('id', id).then();
    showToast('기록이 삭제되었습니다.', 'info');
  };

  const handleClearAllRecords = () => {
    if (window.confirm('정말 모든 계산 기록을 삭제하시겠습니까?')) {
      setRecords([]);
      setSelectedForComparison([]);
      setShowComparison(false);
      supabase.from('lohas_records').delete().neq('id', '0').then();
      showToast('모든 기록이 초기화되었습니다.', 'info');
    }
  };

  const handleExportBackup = () => {
    if (records.length === 0) {
      showToast('백업할 데이터가 없습니다.', 'info');
      return;
    }
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lohas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('전체 데이터 백업이 완료되었습니다.');
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          setRecords(importedData);
          showToast('데이터가 성공적으로 복구되어 슈파베이스 클라우드에 자동 저장되었습니다.');
        } else {
          showToast('잘못된 백업 파일입니다.', 'info');
        }
      } catch (err) {
        showToast('파일을 읽는 중 오류가 발생했습니다.', 'info');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleToggleCompare = (id: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleStartComparison = () => {
    setShowComparison(true);
    setTimeout(() => {
      comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleResetForm = () => {
    setInputs(DEFAULT_INPUTS);
    setProductTitle('쿠팡 상품 A');
    setRawAdRoas('');
    setRawPlatformFeeRate(DEFAULT_INPUTS.platformFeeRate.toString());
    setActiveResult(null);
    setActiveRecord(null);
    setErrors({});
    showToast('입력 필드가 초기화되었습니다.', 'info');
  };

  const handleExportExcel = (recordToExport: CalculationRecord | null) => {
    const target = recordToExport || activeRecord;
    if (!target) return;

    const { input, result, title } = target;
    const csvRows = [
      '\uFEFF' + '항목,수치,설명',
      `상품명 / 계산 별칭,${title},`,
      `판매가,${input.sellingPrice}원,`,
      `상품원가,${input.productCost}원,`,
      `배송비,${input.shippingFee}원,기본 1900원`,
      `포장비,${input.packagingFee}원,기본 500원`,
      `기타비용,${input.otherCost}원,`,
      `플랫폼 수수료율,${input.platformFeeRate}%,`,
      `플랫폼 수수료,${result.platformFee}원,판매가 * 수수료율`,
      `세전 순익,${result.preTaxProfit}원,`,
      `부가세 (10%),${result.vat}원,세전순익 * 10%`,
      `종합소득세 (25%),${result.incomeTax}원,(세전순익 - 부가세) * 25%`,
      `최종 순수익,${result.netProfit}원,세전순익 - 부가세 - 종소세`,
      `최종 마진율,${(result.marginRate * 100).toFixed(2)}%,순수익 / 판매가`,
      `손익분기 END ROAS,${result.marginRate > 0 ? result.endRoas + '%' : 'N/A'},(1 / 마진율) * 100`,
      `하루 광고비,${input.dailyAdBudget}원,`,
      `손익분기 판매수량,${result.breakEvenSalesQty === 'UNAVAILABLE' ? '불가능' : result.breakEvenSalesQty + '개'},하루 광고비 / 순수익`,
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `쿠팡_LOHAS_계산_${title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('엑셀 CSV 다운로드가 완료되었습니다!');
  };

  const handleCopyText = (recordToCopy: CalculationRecord | null) => {
    const target = recordToCopy || activeRecord;
    if (!target) return;

    const { input, result, title } = target;
    const text = `
━━━━━━━━━━━━━━━━━━━━━━
📊 쿠팡 END LOHAS 계산 결과: [${title}]
━━━━━━━━━━━━━━━━━━━━━━
• 판매가: ${input.sellingPrice.toLocaleString()}원
• 상품원가: ${input.productCost.toLocaleString()}원
• 배송비: ${input.shippingFee.toLocaleString()}원
• 포장비: ${input.packagingFee.toLocaleString()}원
• 기타비용: ${input.otherCost.toLocaleString()}원
• 플랫폼 수수료: ${result.platformFee.toLocaleString()}원 (${input.platformFeeRate}%)
──────────────────────
• 세전 순익: ${result.preTaxProfit.toLocaleString()}원
• 부가세: ${result.vat.toLocaleString()}원
• 종합소득세: ${result.incomeTax.toLocaleString()}원
• 최종 순수익: ${result.netProfit.toLocaleString()}원
• 최종 마진율: ${(result.marginRate * 100).toFixed(2)}%
• END ROAS: ${result.marginRate > 0 ? result.endRoas + '%' : 'N/A'}
──────────────────────
• 하루 광고비: ${input.dailyAdBudget.toLocaleString()}원
• 손익분기 판매량: ${result.breakEvenSalesQty === 'UNAVAILABLE' ? '불가능 (적자)' : result.breakEvenSalesQty + '개'}
• 최대 광고 가능 금액: ${result.maxAdSpend.toLocaleString()}원
━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
    
    navigator.clipboard.writeText(text);
    showToast('결과 정보가 클립보드에 복사되었습니다!');
  };

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-slate-800 shadow-sm relative overflow-hidden">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold animate-fade-in transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/10" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Coupang Seller Tool
            </span>
            <span className="bg-emerald-500/30 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-400/30">
              <CloudCheck className="w-3 h-3 text-emerald-300" />
              슈파베이스 실시간 동기화 ON
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 mt-1">
            <Calculator className="w-6 h-6 text-blue-100" />
            쿠팡 END LOHAS 계산기
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 font-medium">
            3초 만에 검증하는 광고 마진 타당성 & 손익분기 END ROAS 산출
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Inputs & History) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm sm:text-base">
                <Calculator className="w-4 h-4 text-blue-600" />
                비용 및 광고 설정 입력
              </h3>
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                초기화
              </button>
            </div>

            <form onSubmit={handleCalculate} className="space-y-4">
              
              {activeRecord ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
                    <span className="text-[11px] font-bold text-blue-800">
                      📝 '{activeRecord.title}' 수정 중
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-200 px-2 py-1 rounded cursor-pointer"
                  >
                    수정 취소
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  <span className="text-[11px] font-bold text-emerald-800">
                    ✨ 새 상품 추가 모드 (계산 시 클라우드 자동 저장)
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  상품명 / 계산 별칭
                </label>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="예: 물티슈 세트, 계절 선풍기 등"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    판매가 (필수) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.sellingPrice === 0 ? '' : inputs.sellingPrice.toLocaleString('ko-KR')}
                    onChange={(e) => handleNumberChange('sellingPrice', e.target.value)}
                    placeholder="0"
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.sellingPrice ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  <span className="text-[10px] text-blue-600 font-semibold block mt-1 min-h-[14px]">
                    {inputs.sellingPrice > 0 && formatKoreanWordWon(inputs.sellingPrice)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    상품원가 (필수) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.productCost === 0 ? '' : inputs.productCost.toLocaleString('ko-KR')}
                    onChange={(e) => handleNumberChange('productCost', e.target.value)}
                    placeholder="0"
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.productCost ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  <span className="text-[10px] text-blue-600 font-semibold block mt-1 min-h-[14px]">
                    {inputs.productCost > 0 && formatKoreanWordWon(inputs.productCost)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    배송비
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.shippingFee.toLocaleString('ko-KR')}
                    onChange={(e) => handleNumberChange('shippingFee', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">기본 1,900원</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    포장비
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.packagingFee.toLocaleString('ko-KR')}
                    onChange={(e) => handleNumberChange('packagingFee', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">기본 500원</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    기타비용
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.otherCost.toLocaleString('ko-KR')}
                    onChange={(e) => handleNumberChange('otherCost', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">기본 0원</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    쿠팡 카테고리 수수료율 (%)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={rawPlatformFeeRate}
                      onChange={(e) => handleFloatChange('platformFeeRate', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">쿠팡 평균: 11.88%</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    하루 설정 광고비
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.dailyAdBudget.toLocaleString('ko-KR')}
                    onChange={(e) => handleNumberChange('dailyAdBudget', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[9px] text-blue-600 font-semibold block mt-1">
                    {inputs.dailyAdBudget > 0 && formatKoreanWordWon(inputs.dailyAdBudget)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  현재 / 예상 광고 ROAS (선택)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rawAdRoas}
                    onChange={(e) => setRawAdRoas(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="예: 450"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">%</span>
                </div>
              </div>

              {activeRecord ? (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleCalculate(undefined, 'update')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    정보 업데이트
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalculate(undefined, 'create')}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white font-extrabold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    새 상품으로 저장
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-[#0074e9] hover:bg-[#005cb8] text-white font-extrabold py-3.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] mt-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  계산 및 상품 등록 (자동 클라우드 저장)
                </button>
              )}
            </form>
          </div>

          <HistoryList
            records={records}
            onSelect={handleSelectRecord}
            onDelete={handleDeleteRecord}
            onClearAll={handleClearAllRecords}
            selectedForComparison={selectedForComparison}
            onToggleCompare={handleToggleCompare}
            onStartComparison={handleStartComparison}
            onAddNew={handleResetForm}
            activeId={activeRecord?.id}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        </div>

        {/* Right Column (Results) */}
        <div className="lg:col-span-7 space-y-6">
          {!activeResult ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4 animate-pulse">
                <Calculator className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">계산 대기 중</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
                좌측 상품 목록에서 원하는 항목을 선택하거나, 판매가와 원가를 입력하고 <strong className="text-blue-600">"계산 및 상품 등록"</strong> 버튼을 클릭하세요.
              </p>
              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1"><Info className="w-4 h-4 text-slate-400" /> 세전 순익 & 세금 분석</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Info className="w-4 h-4 text-slate-400" /> 손익분기 END ROAS 산출</span>
              </div>
            </div>
          ) : (
            <div ref={resultsRef} className="space-y-6">
              <ResultReport
                input={activeRecord ? activeRecord.input : inputs}
                result={activeResult}
                onCopyText={() => handleCopyText(activeRecord)}
                onExportExcel={() => handleExportExcel(activeRecord)}
                record={activeRecord}
                onUpdateMemo={handleUpdateMemo}
                onUpdateDailySales={handleUpdateDailySales}
              />
            </div>
          )}

          {showComparison && selectedForComparison.length > 0 && (
            <div ref={comparisonRef} className="pt-2">
              <ComparisonMatrix
                compareIds={selectedForComparison}
                records={records}
                onRemoveCompareId={handleToggleCompare}
                onClearComparison={() => {
                  setSelectedForComparison([]);
                  setShowComparison(false);
                  showToast('비교표가 초기화되었습니다.', 'info');
                }}
                onSelectRecord={handleSelectRecord}
              />
            </div>
          )}
        </div>

      </div>

    </section>
  );
}
