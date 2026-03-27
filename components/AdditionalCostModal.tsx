import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldCheck, Utensils, Baby, Info, ChevronRight, AlertCircle } from 'lucide-react';
import { AdditionalCostItem } from '../types';

interface AdditionalCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: AdditionalCostItem[]) => void;
  initialItems: AdditionalCostItem[];
}

type SubSelectionType = 'electric' | 'food' | 'children' | null;

const AdditionalCostModal: React.FC<AdditionalCostModalProps> = ({ isOpen, onClose, onSave, initialItems }) => {
  const [items, setItems] = useState<AdditionalCostItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [subSelection, setSubSelection] = useState<SubSelectionType>(null);

  useEffect(() => {
    if (isOpen) {
      setItems([...initialItems]);
      setSubSelection(null);
    }
  }, [isOpen, initialItems]);

  if (!isOpen) return null;

  const handleAddItem = (name?: string, amount?: number) => {
    const finalName = name || newItemName;
    const finalAmount = amount !== undefined ? amount : parseFloat(newItemAmount);

    if (!finalName || isNaN(finalAmount)) return;

    setItems([...items, { id: Date.now().toString(), name: finalName, amount: finalAmount }]);
    if (!name) {
      setNewItemName('');
      setNewItemAmount('');
    }
    setSubSelection(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + item.amount, 0);

  const handleConfirm = () => {
    onSave(items);
    onClose();
  };

  const renderSubSelection = () => {
    if (subSelection === 'electric') {
      const options = ['전기 제품', '전자 제품', '모터 제품', '회로', '무선 충전기'];
      return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
            <ShieldCheck size={18} />
            <span>전기 안전 인증 항목 선택</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">항목당 최소 120,000원부터 시작합니다.</p>
          <div className="grid grid-cols-1 gap-2">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => handleAddItem(`전기 안전 인증 (${opt})`, 120000)}
                className="flex justify-between items-center p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors text-sm font-medium text-indigo-700"
              >
                {opt}
                <Plus size={16} />
              </button>
            ))}
          </div>
          <button 
            onClick={() => setSubSelection(null)}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
          >
            뒤로 가기
          </button>
        </div>
      );
    }

    if (subSelection === 'food') {
      const options = ['식품', '식품 용기', '식재료 용기', '조리 용기'];
      return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 text-green-600 font-semibold mb-2">
            <Utensils size={18} />
            <span>식품 인증 항목 선택</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">단일 재질/항목당 평균 600,000원입니다.</p>
          <div className="grid grid-cols-1 gap-2">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => handleAddItem(`식품 인증 (${opt})`, 600000)}
                className="flex justify-between items-center p-3 bg-green-50 hover:bg-green-100 rounded-xl border border-green-100 transition-colors text-sm font-medium text-green-700"
              >
                {opt}
                <Plus size={16} />
              </button>
            ))}
          </div>
          <button 
            onClick={() => setSubSelection(null)}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
          >
            뒤로 가기
          </button>
        </div>
      );
    }

    if (subSelection === 'children') {
      return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 text-pink-600 font-semibold mb-2">
            <Baby size={18} />
            <span>어린이 안전 인증 안내</span>
          </div>
          <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 space-y-3">
            <div className="flex gap-2 text-pink-700">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm leading-relaxed">
                어린이 안전 인증 대상 품목은 연령 및 재질에 따라 비용이 크게 달라집니다.
              </p>
            </div>
            <p className="text-xs text-pink-600 font-medium">
              정확한 비용은 반드시 공인 검사 기관에 직접 문의하여 견적을 확인하시기 바랍니다.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase">직접 입력 (견적가)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="금액 입력 (원)"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                onChange={(e) => setNewItemAmount(e.target.value)}
              />
              <button
                onClick={() => handleAddItem('어린이 안전 인증', parseFloat(newItemAmount))}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-bold"
              >
                추가
              </button>
            </div>
          </div>
          <button 
            onClick={() => setSubSelection(null)}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
          >
            뒤로 가기
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Quick Add Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">주요 인증 항목 (빠른 추가)</label>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => setSubSelection('electric')}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-800">전기 안전 인증</div>
                  <div className="text-[10px] text-gray-400">최소 120,000원~</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400" />
            </button>

            <button 
              onClick={() => setSubSelection('food')}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Utensils size={18} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-800">식품 인증</div>
                  <div className="text-[10px] text-gray-400">평균 600,000원~</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-green-400" />
            </button>

            <button 
              onClick={() => setSubSelection('children')}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg group-hover:bg-pink-600 group-hover:text-white transition-colors">
                  <Baby size={18} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-800">어린이 안전 인증</div>
                  <div className="text-[10px] text-gray-400">기관 별도 문의</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-pink-400" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-300">또는 직접 입력</span></div>
        </div>

        {/* Manual Input Row */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="항목명 (예: 정밀검사비)"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <input
            type="number"
            placeholder="금액 (원)"
            className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-right"
            value={newItemAmount}
            onChange={(e) => setNewItemAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <button 
            onClick={() => handleAddItem()}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* List */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">추가된 비용 내역</label>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {items.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed rounded-xl">
                추가된 비용이 없습니다.
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 group">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">₩{(item.amount || 0).toLocaleString()}</span>
                    <button onClick={() => handleRemoveItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-6 py-5 bg-white border-b flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">기타 추가 비용 설정</h3>
            <p className="text-xs text-gray-400 mt-0.5">인증비, 검사비 등 부대 비용을 관리합니다.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {renderSubSelection()}
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase">총 추가 비용 합계</span>
            <span className="font-black text-primary-600 text-xl">₩{(calculateTotal() || 0).toLocaleString()}</span>
          </div>
          <button 
            onClick={handleConfirm}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-200 transition-all active:scale-95"
          >
            설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdditionalCostModal;
