import React, { useState, useEffect } from 'react';
import { 
  Ticket, Plus, LayoutDashboard, Search, CheckCircle, AlertCircle, ShoppingBag, Clock, Calendar, X, PlusCircle 
} from 'lucide-react';

export type CouponStatus = 'active' | 'used' | 'expired';

export interface Coupon {
  id: string;
  productName: string;
  discountAmount: number;
  validFrom: string;
  validTo: string;
  appliedDate: string;
  status: CouponStatus;
}

export interface Promotion {
  id: string;
  productName: string;
  promotionPrice: number;
  costPrice: number;
  deadline: string;
}

const INITIAL_MOCK_COUPONS: Coupon[] = [
  {
    id: '1',
    productName: '로켓프레시 신선/가공식품',
    discountAmount: 15000,
    validFrom: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    validTo: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    appliedDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    status: 'active'
  },
  {
    id: '2',
    productName: '디지털/가전 전용 (애플 제외)',
    discountAmount: 50000,
    validFrom: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
    validTo: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
    appliedDate: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString().split('T')[0],
    status: 'expired'
  },
  {
    id: '3',
    productName: '아동 패션 골드박스 기획전',
    discountAmount: 3000,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(new Date().setDate(new Date().getDate() + 11)).toISOString().split('T')[0],
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'active'
  }
];

const PROMOTION_MOCK_DATA: Promotion[] = [
  {
    id: '1',
    productName: '여름 시즌 반팔티 특가전',
    promotionPrice: 15900,
    costPrice: 9000,
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
  },
  {
    id: '2',
    productName: '캠핑용품 기획전 (텐트/침낭)',
    promotionPrice: 89000,
    costPrice: 55000,
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]
  }
];

// Helper utils
const formatKRW = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date).replace(/\. /g, '.').replace(/\.$/, '');
};

const isExpired = (validTo: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expirationDate = new Date(validTo);
  expirationDate.setHours(0, 0, 0, 0);
  return expirationDate < today;
};

const getDDay = (validTo: string): { label: string, isUrgent: boolean } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(validTo);
  expiration.setHours(0, 0, 0, 0);
  
  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { label: '만료됨', isUrgent: false };
  if (diffDays === 0) return { label: 'D-Day', isUrgent: true };
  if (diffDays <= 3) return { label: `D-${diffDays}`, isUrgent: true };
  return { label: `D-${diffDays}`, isUrgent: false };
};

export default function CoupangCouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('coupang_coupons');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return INITIAL_MOCK_COUPONS;
        }
      }
    }
    return INITIAL_MOCK_COUPONS;
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('coupang_coupons', JSON.stringify(coupons));
    }
  }, [coupons]);

  const handleAddCoupon = (newCouponData: Omit<Coupon, 'id' | 'status'>) => {
    const newCoupon: Coupon = {
      ...newCouponData,
      id: `coupon-${Date.now()}`,
      status: 'active'
    };
    setCoupons([newCoupon, ...coupons]);
  };

  const handleStatusChange = (id: string, newStatus: CouponStatus) => {
    setCoupons(coupons.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('이 쿠폰을 정말 삭제하시겠습니까?')) {
      setCoupons(coupons.filter(c => c.id !== id));
    }
  };

  // Filter for display
  const filteredCoupons = coupons.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'active') return c.status === 'active' && !isExpired(c.validTo);
    if (filter === 'used') return c.status === 'used';
    return true;
  }).sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

  return (
    <div className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 lg:p-8 my-8 font-sans shadow-xl text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2.5 rounded-xl text-white shadow-md shadow-red-500/20">
            <Ticket size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">쿠팡 쿠폰 매니저</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">쿠팡 할인 쿠폰 신청 및 프로모션 내역 통합 관리 시스템</p>
          </div>
        </div>

        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md shadow-red-500/20 cursor-pointer"
        >
          <Plus size={16} />
          + 쿠폰 등록
        </button>
      </div>

      {/* Coupons List Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-6">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          🎟️ 내 쿠폰 목록 ({filteredCoupons.length}개)
        </h3>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 self-start sm:self-auto text-xs">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            전체보기
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`px-4 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 ${filter === 'active' ? 'bg-white dark:bg-slate-900 text-red-600 shadow-xs ring-1 ring-slate-900/5' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${filter === 'active' ? 'bg-red-600' : 'bg-transparent'}`}></span>
            사용가능
          </button>
          <button 
            onClick={() => setFilter('used')}
            className={`px-4 py-1.5 font-bold rounded-lg transition-all ${filter === 'used' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-900/5' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            사용완료
          </button>
        </div>
      </div>

      {/* Coupons List */}
      {filteredCoupons.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredCoupons.map(coupon => {
            const expired = isExpired(coupon.validTo) && coupon.status !== 'used';
            const effectiveStatus = expired ? 'expired' : coupon.status;
            const dday = getDDay(coupon.validTo);
            const isUrgent = dday.isUrgent && effectiveStatus === 'active';

            return (
              <div 
                key={coupon.id} 
                className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-md ${effectiveStatus !== 'active' ? 'opacity-75' : ''}`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Left side - Expiration / D-Day */}
                  <div className={`flex flex-col justify-center items-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-dashed border-slate-200 dark:border-slate-700 min-w-[140px] ${
                    effectiveStatus === 'active' 
                       ? (isUrgent ? 'bg-red-50 dark:bg-red-950/30' : 'bg-blue-50 dark:bg-blue-950/30')
                       : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}>
                    <span className="text-xs font-semibold text-slate-400 mb-1">마감일</span>
                    <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      effectiveStatus === 'active' 
                        ? (isUrgent ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400')
                        : 'text-slate-400'
                    }`}>
                      {effectiveStatus === 'active' ? dday.label : '만료'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 mt-1">
                      {formatDate(coupon.validTo)} 까지
                    </span>
                  </div>
                  
                  {/* Right side - Details */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="text-slate-400 size-4 shrink-0" />
                          <h4 className={`font-bold text-base ${effectiveStatus === 'active' ? 'text-slate-900 dark:text-white' : 'text-slate-500 line-through decoration-slate-300'}`}>
                            {coupon.productName}
                          </h4>
                        </div>
                        
                        {effectiveStatus === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                            <CheckCircle size={12} /> 사용가능
                          </span>
                        )}
                        {effectiveStatus === 'used' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shrink-0">
                            <CheckCircle size={12} /> 사용완료
                          </span>
                        )}
                        {effectiveStatus === 'expired' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 shrink-0">
                            <AlertCircle size={12} /> 기간만료
                          </span>
                        )}
                      </div>
                      
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 my-1">
                        <span className="font-extrabold text-sm">₩ {formatKRW(coupon.discountAmount)}원 할인</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-slate-400" />
                          <span>사용기간: {formatDate(coupon.validFrom)} ~ {formatDate(coupon.validTo)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400" />
                          <span>신청일: {formatDate(coupon.appliedDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-2 text-xs font-bold">
                      {effectiveStatus === 'active' && (
                        <button 
                          onClick={() => handleStatusChange(coupon.id, 'used')}
                          className="px-3.5 py-1.5 text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer"
                        >
                          사용 처리
                        </button>
                      )}
                      {effectiveStatus === 'used' && (
                        <button 
                          onClick={() => handleStatusChange(coupon.id, 'active')}
                          className="px-3.5 py-1.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                        >
                          사용 취소
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        className="px-3.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-16 text-center px-4">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Search size={24} />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">조건에 맞는 쿠폰이 없습니다</h4>
          <p className="text-slate-400 text-xs mb-4">상단의 '+ 쿠폰 등록' 버튼을 눌러 새로운 할인 혜택을 등록해보세요.</p>
        </div>
      )}

      {/* Promotion History Section */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <LayoutDashboard className="text-red-600" size={20} />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">프로모션 신청 내역</h3>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-sans">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">제품명</th>
                  <th className="px-5 py-3.5">프로모션가</th>
                  <th className="px-5 py-3.5">원가</th>
                  <th className="px-5 py-3.5 text-emerald-600">순이익</th>
                  <th className="px-5 py-3.5 text-blue-600">마진율</th>
                  <th className="px-5 py-3.5">마감일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                {PROMOTION_MOCK_DATA.map((promo) => {
                  const SHIPPING_FEE = 1900;
                  const PACKAGING_FEE = 1000;
                  const netProfit = promo.promotionPrice - (promo.costPrice + SHIPPING_FEE) - PACKAGING_FEE;
                  const marginRate = (netProfit / promo.promotionPrice * 100).toFixed(1);
                  return (
                    <tr key={promo.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                      <td className="px-5 py-3.5 font-sans font-bold text-slate-900 dark:text-white">{promo.productName}</td>
                      <td className="px-5 py-3.5 text-red-600 font-bold">{formatKRW(promo.promotionPrice)}원</td>
                      <td className="px-5 py-3.5 text-slate-400">{formatKRW(promo.costPrice)}원</td>
                      <td className="px-5 py-3.5 text-emerald-500 font-extrabold">{formatKRW(netProfit)}원</td>
                      <td className="px-5 py-3.5 text-blue-500 font-extrabold">{marginRate}%</td>
                      <td className="px-5 py-3.5 text-slate-400 font-sans">{promo.deadline}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Coupon Modal Form */}
      {isFormOpen && (
        <ModalCouponForm 
          onAdd={handleAddCoupon} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
}

// Modal Component for adding coupon
function ModalCouponForm({ onAdd, onClose }: { onAdd: (coupon: Omit<Coupon, 'id' | 'status'>) => void; onClose: () => void }) {
  const [productName, setProductName] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
  const [validTo, setValidTo] = useState('');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !discountAmount || !validFrom || !validTo || !appliedDate) return;

    onAdd({
      productName,
      discountAmount: Number(discountAmount.replace(/[^0-9]/g, '')),
      validFrom,
      validTo,
      appliedDate,
    });
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue) {
      setDiscountAmount(Number(rawValue).toLocaleString('ko-KR'));
    } else {
      setDiscountAmount('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="text-red-600" size={18} /> 새 쿠폰 등록
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-bold">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">제품명 또는 기획전 카테고리</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-500 font-sans"
              placeholder="예: 로켓프레시 신선식품"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">할인액 (원)</label>
            <div className="relative">
              <input
                type="text"
                required
                value={discountAmount}
                onChange={handleAmountChange}
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-500 text-right font-mono"
                placeholder="5,000"
              />
              <span className="absolute right-3 top-2.5 text-slate-400">원</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">사용기간 시작일</label>
              <input
                type="date"
                required
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">사용기간 종료일</label>
              <input
                type="date"
                required
                min={validFrom}
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-500 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1">쿠폰 신청일</label>
            <input
              type="date"
              required
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-500 font-sans"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-extrabold transition shadow-md shadow-red-600/30 cursor-pointer text-xs mt-3"
          >
            <PlusCircle size={16} />
            쿠폰 등록하기
          </button>
        </form>
      </div>
    </div>
  );
}
