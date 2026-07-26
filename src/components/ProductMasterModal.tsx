import React, { useState } from 'react';
import { ProductMaster } from '../types';
import { formatKRW } from '../utils/settlementUtils';
import { X, Plus, Trash2, Edit2, Package, Check } from 'lucide-react';

interface ProductMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductMaster[];
  onAddProduct: (prod: ProductMaster) => void;
  onUpdateProduct: (prod: ProductMaster) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductMasterModal: React.FC<ProductMasterModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ProductMaster>>({
    sku: '',
    name: '',
    category: '식품',
    supplyPrice: 10000,
    unitCost: 4000,
    commissionRate: 10.8,
    defaultOtherFee: 300,
  });

  if (!isOpen) return null;

  const handleEditClick = (p: ProductMaster) => {
    setEditingId(p.id);
    setFormData(p);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormData({
      sku: '',
      name: '',
      category: '식품',
      supplyPrice: 10000,
      unitCost: 4000,
      commissionRate: 10.8,
      defaultOtherFee: 300,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('상품명을 입력해주세요.');
      return;
    }

    if (editingId) {
      onUpdateProduct({
        id: editingId,
        sku: formData.sku || `SKU-${Date.now()}`,
        name: formData.name,
        category: formData.category || '기타',
        supplyPrice: Number(formData.supplyPrice) || 0,
        unitCost: Number(formData.unitCost) || 0,
        commissionRate: Number(formData.commissionRate) || 0,
        defaultOtherFee: Number(formData.defaultOtherFee) || 0,
      });
    } else {
      onAddProduct({
        id: `prod-${Date.now()}`,
        sku: formData.sku || `SKU-${Date.now()}`,
        name: formData.name,
        category: formData.category || '기타',
        supplyPrice: Number(formData.supplyPrice) || 0,
        unitCost: Number(formData.unitCost) || 0,
        commissionRate: Number(formData.commissionRate) || 0,
        defaultOtherFee: Number(formData.defaultOtherFee) || 0,
      });
    }
    handleResetForm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold">상품 마스터 (기본 단가/원가/수수료) 관리</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Add / Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
          >
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>{editingId ? '상품 마스터 정보 수정' : '새 상품 마스터 등록'}</span>
              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs font-normal text-slate-500 hover:underline"
                >
                  취소 후 신규 추가
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  상품명 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-semibold text-slate-900 dark:text-white"
                  placeholder="예: 유기농 수제 그릭요거트 500g"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  기본 쿠팡매입가 (원)
                </label>
                <input
                  type="number"
                  value={formData.supplyPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, supplyPrice: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  기본 제조원가 (원)
                </label>
                <input
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, unitCost: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-xs flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {editingId ? '마스터 수정' : '마스터 등록'}
                </button>
              </div>
            </div>
          </form>

          {/* Registered Product List Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span>등록된 상품 마스터 목록 ({products.length}개)</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">상품명</th>
                    <th className="p-2.5 text-right">매입가</th>
                    <th className="p-2.5 text-right">제조원가</th>
                    <th className="p-2.5 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="p-2.5 text-right font-mono">{formatKRW(p.supplyPrice)}</td>
                      <td className="p-2.5 text-right font-mono">{formatKRW(p.unitCost)}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                            title="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`${p.name} 마스터를 삭제하시겠습니까?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">
                        등록된 상품 마스터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-slate-800 text-white font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
