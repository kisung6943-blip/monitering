import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  Settings, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search,
  Bell,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Banknote,
  Boxes,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = 'dashboard' | 'inventory' | 'analytics' | 'settings';

export type Platform = 'naver' | 'auction' | '11st' | 'coupang';

interface CompetitorInfo {
  name: string;
  price: number;
  shippingFee: number;
  link: string;
}

interface Product {
  id: number;
  name: string;
  platform: Platform;
  productLink: string;
  price: number;
  shippingFee: number;
  competitors: [CompetitorInfo, CompetitorInfo, CompetitorInfo];
  lastUpdated: string;
}

const salesData = [
  { name: '월', sales: 4000, profit: 2400 },
  { name: '화', sales: 3000, profit: 1398 },
  { name: '수', sales: 2000, profit: 9800 },
  { name: '목', sales: 2780, profit: 3908 },
  { name: '금', sales: 1890, profit: 4800 },
  { name: '토', sales: 2390, profit: 3800 },
  { name: '일', sales: 3490, profit: 4300 },
];

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

async function analyzeProductLink(url: string) {
  try {
    const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
    const dataRes = await res.json();
    if (dataRes.error) return null;
    
    const { text, meta } = dataRes;
    
    // We can still use client-side Gemini for quick analysis in the modal
    const aiClient = new GoogleGenAI({ apiKey: (window as any).GEMINI_API_KEY || process.env.GEMINI_API_KEY });
    const model = aiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const response = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Extract product information from this webpage content and metadata.
          Return the data in JSON format:
          {
            "name": "Product Name",
            "platform": "naver" | "coupang" | "auction" | "11st",
            "seller": "Seller Name",
            "price": number,
            "shippingFee": number,
            "productLink": "${url}"
          }
          
          Webpage Metadata: ${JSON.stringify(meta)}
          Webpage Content: ${text.substring(0, 10000)}`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    
    return JSON.parse(response.response.text());
  } catch (err) {
    console.error("AI Analysis failed:", err);
    return null;
  }
}


export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [activePlatform, setActivePlatform] = useState<Platform>('naver');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [analyzingLink, setAnalyzingLink] = useState<number | null>(null);

  const handleAnalyzeLink = async (url: string, index: number) => {
    if (!url) return;
    setAnalyzingLink(index);
    try {
      const res = await fetch(`/api/analyze-product?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      
      if (index === -1) {
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          price: data.price || prev.price,
          shippingFee: data.shippingFee || prev.shippingFee
        }));
      } else {
        const newComps = [...formData.competitors];
        newComps[index] = {
          ...newComps[index],
          name: data.seller || data.name || newComps[index].name,
          price: data.price || newComps[index].price,
          shippingFee: data.shippingFee || newComps[index].shippingFee
        };
        setFormData(prev => ({ ...prev, competitors: newComps as any }));
      }
    } catch (err) {
      console.error("Link analysis error:", err);
    } finally {
      setAnalyzingLink(null);
    }
  };

  // Fetch products on mount
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Failed to fetch products:", err));
  }, []);

  // Sync products to server whenever they change
  const syncProducts = async (newProducts: Product[]) => {
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProducts)
      });
    } catch (err) {
      console.error("Failed to sync products:", err);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    platform: activePlatform,
    productLink: '',
    price: 0,
    shippingFee: 0,
    competitors: [
      { name: '', price: 0, shippingFee: 0, link: '' },
      { name: '', price: 0, shippingFee: 0, link: '' },
      { name: '', price: 0, shippingFee: 0, link: '' },
    ] as [CompetitorInfo, CompetitorInfo, CompetitorInfo]
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      setFormData({
        name: '',
        platform: activePlatform,
        productLink: '',
        price: 0,
        shippingFee: 0,
        competitors: [
          { name: '', price: 0, shippingFee: 0, link: '' },
          { name: '', price: 0, shippingFee: 0, link: '' },
          { name: '', price: 0, shippingFee: 0, link: '' },
        ]
      });
    }
  }, [isAddModalOpen, activePlatform]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.platform === activePlatform && 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, activePlatform, searchQuery]);

  const addProduct = (newProduct: Omit<Product, 'id' | 'lastUpdated'>) => {
    const product: Product = {
      ...newProduct,
      id: Date.now(),
      lastUpdated: '방금 전',
    };
    const newProducts = [product, ...products];
    setProducts(newProducts);
    syncProducts(newProducts);
    setIsAddModalOpen(false);
  };

  const updateProductInfo = (productId: number, field: keyof Product, value: string | number, sync = false) => {
    const newProducts = products.map(p => {
      if (p.id === productId) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setProducts(newProducts);
    if (sync) syncProducts(newProducts);
  };

  const updateCompetitorInfo = (productId: number, competitorIdx: number, field: keyof CompetitorInfo, value: string | number, sync = false) => {
    const newProducts = products.map(p => {
      if (p.id === productId) {
        const newCompetitors = [...p.competitors] as [CompetitorInfo, CompetitorInfo, CompetitorInfo];
        newCompetitors[competitorIdx] = { ...newCompetitors[competitorIdx], [field]: value };
        return { ...p, competitors: newCompetitors };
      }
      return p;
    });
    setProducts(newProducts);
    if (sync) syncProducts(newProducts);
  };

  const deleteProduct = (productId: number) => {
    if (window.confirm("정말 이 상품을 삭제하시겠습니까?")) {
      const newProducts = products.filter(p => p.id !== productId);
      setProducts(newProducts);
      syncProducts(newProducts);
    }
  };

  const crawlAllNow = async () => {
    setIsCrawling(true);
    try {
      await fetch('/api/crawl-all', { method: 'POST' });
      alert("전체 크롤링이 백그라운드에서 시작되었습니다. 잠시 후 새로고침 해주세요.");
    } catch (err) {
      console.error("Crawl failed:", err);
    } finally {
      setIsCrawling(false);
    }
  };

  const stats = [
    { label: "총 매출", value: "₩12,450,000", icon: Banknote, trend: "+12.5%", isUp: true },
    { label: "활성 상품", value: "48개", icon: ShoppingBag, trend: "+2개", isUp: true },
    { label: "총 주문", value: "856건", icon: BarChart3, trend: "+8.2%", isUp: true },
  ];

  const Dashboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <h3 className="font-bold text-slate-800 text-xl whitespace-nowrap">실시간 상품 순위 현황</h3>
          
          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
            {[
              { id: 'naver', label: '네이버' },
              { id: 'auction', label: '옥션' },
              { id: '11st', label: '11번가' },
              { id: 'coupang', label: '쿠팡' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePlatform(tab.id as Platform)}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  activePlatform === tab.id 
                    ? "bg-white text-indigo-600 shadow-sm border border-indigo-50" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-50">
                <th className="pb-6 px-4 min-w-[180px]">제품명</th>
                <th className="pb-6 px-4">ES리빙 / 배송비 / 합계</th>
                <th className="pb-6 px-4">경쟁사 1 / 배송비 / 합계</th>
                <th className="pb-6 px-4">경쟁사 2 / 배송비 / 합계</th>
                <th className="pb-6 px-4">경쟁사 3 / 배송비 / 합계</th>
                <th className="pb-6 px-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product) => {
                const myTotal = product.price + product.shippingFee;
                
                return (
                  <tr key={product.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex-shrink-0 flex items-center justify-center text-indigo-300">
                          <Package className="w-5 h-5" />
                        </div>
                        <input 
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProductInfo(product.id, 'name', e.target.value)}
                          className="font-bold text-slate-800 text-sm leading-tight bg-transparent border-none focus:ring-1 focus:ring-indigo-100 rounded p-1 w-full hover:bg-slate-50 transition-all"
                        />
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] font-bold text-slate-300 w-3">P</span>
                          <input 
                            type="number"
                            value={product.price}
                            onChange={(e) => updateProductInfo(product.id, 'price', parseInt(e.target.value) || 0)}
                            onBlur={() => syncProducts(products)}
                            className="text-sm font-bold text-slate-800 bg-transparent border-none focus:ring-1 focus:ring-indigo-100 rounded p-0 px-1 w-20 hover:bg-slate-50 transition-all"
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] font-bold text-slate-300 w-3">S</span>
                          <input 
                            type="number"
                            value={product.shippingFee}
                            onChange={(e) => updateProductInfo(product.id, 'shippingFee', parseInt(e.target.value) || 0)}
                            onBlur={() => syncProducts(products)}
                            className="text-[10px] text-slate-400 font-bold bg-transparent border-none focus:ring-1 focus:ring-indigo-100 rounded p-0 px-1 w-20 hover:bg-slate-50 transition-all"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 mt-1 bg-indigo-50 self-start px-2 py-0.5 rounded shadow-sm border border-indigo-100">합계 ₩{myTotal.toLocaleString()}</span>
                        
                        <div className="pt-2 flex items-center space-x-1 group/link">
                          <input 
                            type="text"
                            value={product.productLink}
                            onChange={(e) => updateProductInfo(product.id, 'productLink', e.target.value)}
                            onBlur={() => syncProducts(products)}
                            placeholder="제품 링크"
                            className="text-[9px] text-slate-400 bg-slate-50/50 border-none rounded px-1.5 py-0.5 w-full focus:ring-1 focus:ring-indigo-100 placeholder:text-slate-200"
                          />
                          {product.productLink && (
                            <a 
                              href={ensureAbsoluteUrl(product.productLink)} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="p-1 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                              title="링크 열기"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {product.competitors.map((comp, idx) => {
                      const compTotal = comp.price + comp.shippingFee;
                      const isWinning = myTotal <= compTotal;

                      return (
                        <td key={idx} className="py-6 px-4 align-top">
                          <div className="flex flex-col min-w-[140px] group/item">
                            <div className="flex items-center justify-between mb-1">
                              <input 
                                type="text"
                                value={comp.name}
                                onChange={(e) => updateCompetitorInfo(product.id, idx, 'name', e.target.value)}
                                onBlur={() => syncProducts(products)}
                                placeholder="경쟁사 이름"
                                className="text-[11px] font-bold text-indigo-400 bg-transparent border-none focus:ring-1 focus:ring-indigo-100 rounded p-0.5 px-1 w-full hover:bg-slate-50 transition-all placeholder:text-slate-200 uppercase tracking-tight mb-1"
                              />
                              {comp.link && (
                                <a 
                                  href={comp.link} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-slate-300 hover:text-indigo-500 transition-all opacity-0 group-hover/item:opacity-100"
                                >
                                  <Search className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 mb-0.5">
                              <span className="text-[9px] font-bold text-slate-300 w-3">P</span>
                              <input 
                                type="number"
                                value={comp.price}
                                onChange={(e) => updateCompetitorInfo(product.id, idx, 'price', parseInt(e.target.value) || 0)}
                                onBlur={() => syncProducts(products)}
                                className="bg-transparent border-none hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-200 text-xs font-bold text-slate-500 w-20 p-0 px-1 rounded transition-all"
                              />
                            </div>
                            <div className="flex items-center space-x-1 mb-1.5">
                              <span className="text-[9px] font-bold text-slate-300 w-3">S</span>
                              <input 
                                type="number"
                                value={comp.shippingFee}
                                onChange={(e) => updateCompetitorInfo(product.id, idx, 'shippingFee', parseInt(e.target.value) || 0)}
                                onBlur={() => syncProducts(products)}
                                className="bg-transparent border-none hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-200 text-[10px] text-slate-400 w-20 p-0 px-1 rounded transition-all"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <div className="flex items-baseline space-x-1">
                                <span className="text-[10px] font-black text-slate-700">합계</span>
                                <span className="text-xs font-bold text-slate-800">₩{compTotal.toLocaleString()}</span>
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block border shadow-sm",
                                isWinning ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                              )}>
                                {isWinning 
                                  ? `우위 (-₩${(compTotal - myTotal).toLocaleString()})` 
                                  : `열세 (+₩${(myTotal - compTotal).toLocaleString()})`}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center space-x-1 group/link">
                              <input 
                                type="text"
                                value={comp.link}
                                onChange={(e) => updateCompetitorInfo(product.id, idx, 'link', e.target.value)}
                                onBlur={() => syncProducts(products)}
                                placeholder="경쟁사 링크"
                                className="text-[9px] text-slate-400 bg-slate-50/50 border-none rounded px-1.5 py-0.5 w-full focus:ring-1 focus:ring-indigo-100 placeholder:text-slate-200"
                              />
                              {comp.link && (
                                <a 
                                  href={ensureAbsoluteUrl(comp.link)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-1 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                  title="링크 열기"
                                >
                                  <ArrowUpRight className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-6 px-4">
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="상품 삭제"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col p-6 space-y-10">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 rotate-3">
            <Package className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">셀러 대시보드</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Analytics Monitor</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: "대시보드" },
            { id: 'inventory', icon: Package, label: "상품 관리" },
            { id: 'analytics', icon: BarChart3, label: "상세 분석" },
            { id: 'settings', icon: Settings, label: "설정" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                activeView === item.id 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="bg-indigo-600 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4 relative z-10">
            <p className="text-white text-xs font-bold bg-white/20 inline-block px-2 py-1 rounded-lg uppercase">Premium</p>
            <h4 className="text-white font-bold leading-tight">AI 판매 예측<br/>기능 출시!</h4>
            <button className="w-full bg-white text-indigo-600 py-2 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors">자세히 보기</button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex-1 flex items-center max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="찾으시는 상품명을 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 pl-4">
            <button className="relative p-2.5 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button className="flex items-center space-x-3 p-1 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 bg-indigo-100 rounded-full overflow-hidden flex items-center justify-center text-indigo-700 font-bold">
                JS
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-none">장셀러</p>
                <p className="text-[10px] text-slate-400 font-bold">관리자</p>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">좋은 아침입니다! 👋</h2>
              <p className="text-slate-500 font-medium mt-1">오늘의 상점 현황을 확인해보세요.</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={crawlAllNow}
                disabled={isCrawling}
                className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                {isCrawling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-indigo-500" />}
                <span>전체 크롤링</span>
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:translate-y-0"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">상품 등록하기</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && <Dashboard key="dashboard" />}
            {activeView !== 'dashboard' && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4 opacity-60">
                <Package className="w-12 h-12" />
                <p className="font-bold">곧 새로운 기능이 찾아옵니다</p>
              </div>
            )}
          </AnimatePresence>
        </main>

        {/* Add Product Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddModalOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 space-y-6 overflow-y-auto max-h-[90vh] no-scrollbar"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">새 상품 등록</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-400 rotate-45" />
                  </button>
                </div>


                <form className="space-y-6" id="productForm" onSubmit={(e) => {
                  e.preventDefault();
                  addProduct({
                    ...formData,
                    competitors: formData.competitors as [CompetitorInfo, CompetitorInfo, CompetitorInfo]
                  });
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">플랫폼</label>
                      <select 
                        name="platform" 
                        value={formData.platform} 
                        onChange={(e) => setFormData({...formData, platform: e.target.value as Platform})}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all"
                      >
                        <option value="naver">네이버</option>
                        <option value="auction">옥션</option>
                        <option value="11st">11번가</option>
                        <option value="coupang">쿠팡</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">상품명</label>
                      <input 
                        name="name" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all" 
                        placeholder="제품 이름을 입력하세요" 
                      />
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50 space-y-4">
                    <p className="text-xs font-bold text-indigo-600 uppercase ml-1">ES리빙 정보</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">판매가</label>
                        <input 
                          name="price" 
                          type="number" 
                          required 
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                          className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all" 
                          placeholder="0" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">배송비</label>
                        <input 
                          name="shippingFee" 
                          type="number" 
                          required 
                          value={formData.shippingFee}
                          onChange={(e) => setFormData({...formData, shippingFee: parseInt(e.target.value) || 0})}
                          className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all" 
                          placeholder="0" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">제품 링크</label>
                      <div className="flex space-x-2">
                        <input 
                          name="productLink" 
                          required 
                          value={formData.productLink}
                          onChange={(e) => setFormData({...formData, productLink: e.target.value})}
                          className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all" 
                          placeholder="https://..." 
                        />
                        <button 
                          type="button"
                          onClick={() => handleAnalyzeLink(formData.productLink, -1)}
                          disabled={analyzingLink === -1}
                          className="bg-indigo-100 text-indigo-600 p-3 rounded-xl hover:bg-indigo-200 transition-all disabled:opacity-50"
                        >
                          {analyzingLink === -1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase ml-1">경쟁사 정보 (3사)</p>
                    {formData.competitors.map((comp, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5 col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">사명 {i+1}</label>
                            <input 
                              name={`comp${i+1}_name`} 
                              required 
                              value={comp.name}
                              onChange={(e) => {
                                const newComps = [...formData.competitors];
                                newComps[i].name = e.target.value;
                                setFormData({...formData, competitors: newComps as any});
                              }}
                              className="w-full bg-white border-none rounded-xl px-3 py-2 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all" 
                              placeholder="업체명" 
                            />
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">가격</label>
                            <input 
                              name={`comp${i+1}_price`} 
                              type="number" 
                              required 
                              value={comp.price}
                              onChange={(e) => {
                                const newComps = [...formData.competitors];
                                newComps[i].price = parseInt(e.target.value) || 0;
                                setFormData({...formData, competitors: newComps as any});
                              }}
                              className="w-full bg-white border-none rounded-xl px-3 py-2 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all" 
                              placeholder="0" 
                            />
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">배송비</label>
                            <input 
                              name={`comp${i+1}_shippingFee`} 
                              type="number" 
                              required 
                              value={comp.shippingFee}
                              onChange={(e) => {
                                const newComps = [...formData.competitors];
                                newComps[i].shippingFee = parseInt(e.target.value) || 0;
                                setFormData({...formData, competitors: newComps as any});
                              }}
                              className="w-full bg-white border-none rounded-xl px-3 py-2 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all" 
                              placeholder="0" 
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">판매 링크 {i+1}</label>
                          <div className="flex space-x-2">
                            <input 
                              name={`comp${i+1}_link`} 
                              required 
                              value={comp.link}
                              onChange={(e) => {
                                const newComps = [...formData.competitors];
                                newComps[i].link = e.target.value;
                                setFormData({...formData, competitors: newComps as any});
                              }}
                              className="flex-1 bg-white border-none rounded-xl px-3 py-2 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all" 
                              placeholder="https://..." 
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (!comp.link) return;
                                try {
                                  // Manual trigger for competitor magic analysis
                                  const analyzed = await analyzeProductLink(comp.link);
                                  if (analyzed) {
                                    const newComps = [...formData.competitors];
                                    newComps[i] = {
                                      name: analyzed.seller || analyzed.name,
                                      price: analyzed.price || 0,
                                      shippingFee: analyzed.shippingFee || 0,
                                      link: comp.link
                                    };
                                    setFormData({...formData, competitors: newComps as any});
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="px-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                              title="링크 분석"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:translate-y-0"
                    >
                      등록 완료
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex lg:hidden items-center justify-around py-3 px-4 z-50">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'inventory', icon: Package },
          { id: 'analytics', icon: BarChart3 },
          { id: 'settings', icon: Settings },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as View)}
            className={cn(
              "p-2 rounded-xl transition-all",
              activeView === item.id ? "bg-indigo-50 text-indigo-600" : "text-slate-400"
            )}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>
    </div>
  );
}
