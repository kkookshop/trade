import React, { useRef, useState } from 'react';
import { X, Printer, Download, FileText, TrendingUp, Package, Calculator, Globe, Image as ImageIcon, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    productName: string;
    unitPrice: string;
    quantity: string;
    currency: string;
    exchangeRate: number;
    breakdown: {
      baseAmountKRW: number;
      hiddenFeeKRW: number;
      forwardingFee: number;
      duty: number;
      vat: number;
      shippingFee: number;
      additionalCost: number;
      totalCostKRW: number;
      unitCostKRW: number;
    };
    sellingPrice: {
      wholesalePrice: number;
      retailPrice: number;
      onlinePrice: number;
      wholesaleTotalProfit: number;
      retailTotalProfit: number;
      onlineTotalProfit: number;
    };
    margins: {
      wholesale: number;
      retailFee: number;
      retailMargin: number;
      onlineSiteFee: number;
      onlineOtherFee: number;
      onlineTargetMargin: number;
    };
    cbm: {
      total: number;
      applied: number;
    };
  };
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, data }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSaveAsImage = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `수입원가보고서_${data.productName || '제품'}_${new Date().getTime()}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('이미지 저장 실패:', error);
      alert('이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAsPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`수입원가보고서_${data.productName || '제품'}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('PDF 저장 실패:', error);
      alert('PDF 저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 print:p-0 print:static print:block">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print\\:static { position: static !important; }
            .print\\:p-0 { padding: 0 !important; }
            .print\\:w-full { width: 100% !important; }
            .print\\:h-auto { height: auto !important; }
            .print\\:max-h-none { max-height: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:rounded-none { border-radius: 0 !important; }
            .print\\:overflow-visible { overflow: visible !important; }
            @page { margin: 1cm; }
          }
        `}} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none print:w-full print:h-auto print:static print:block print:opacity-100 print:scale-100 print:translate-y-0"
        >
          {/* Header - Hidden on Print */}
          <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="text-primary-600" size={20} />
              <h2 className="text-lg font-bold text-gray-800">수입 원가 분석 보고서 미리보기</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAsImage}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-xs shadow-sm disabled:opacity-50"
                title="이미지로 저장"
              >
                <ImageIcon size={14} /> 이미지
              </button>
              <button
                onClick={handleSaveAsPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-xs shadow-sm disabled:opacity-50"
                title="PDF로 저장"
              >
                <FileDown size={14} /> PDF
              </button>
              <button
                onClick={handlePrint}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
              >
                <Printer size={16} /> 인쇄
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div 
            ref={reportRef}
            className="flex-1 overflow-y-auto p-8 sm:p-12 bg-white print:overflow-visible print:p-0"
          >
            {/* Report Header */}
            <div className="border-b-4 border-gray-900 pb-8 mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">IMPORT COST ANALYSIS</h1>
                <p className="text-gray-500 font-medium uppercase tracking-widest text-sm">수입 원가 및 판매 전략 분석 보고서</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Report Date</p>
                <p className="text-sm font-bold text-gray-800">{today}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
              {/* Basic Info */}
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package size={14} /> 기본 제품 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">제품명</p>
                      <p className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1">{data.productName || '미지정 제품'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">수입 수량</p>
                      <p className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1">{(Number(data.quantity) || 0).toLocaleString()} 개</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">현지 매입 단가</p>
                      <p className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1">{data.currency === 'CNY' ? '¥' : '$'} {(Number(data.unitPrice) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">적용 환율</p>
                      <p className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1">₩ {(data.exchangeRate || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Calculator size={14} /> 상세 비용 분석 (KRW)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600">제품 순수 매입가</span>
                      <span className="font-bold text-gray-900">₩ {(data.breakdown.baseAmountKRW - data.breakdown.hiddenFeeKRW || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600">숨겨진 비용 (수량별 할증)</span>
                      <span className="font-bold text-gray-900">+ ₩ {(data.breakdown.hiddenFeeKRW || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600">현지 포워딩 수수료</span>
                      <span className="font-bold text-gray-900">+ ₩ {(data.breakdown.forwardingFee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600">관세 및 부가세</span>
                      <span className="font-bold text-gray-900">+ ₩ {(data.breakdown.duty + data.breakdown.vat || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600">국제 운송료 (LCL)</span>
                      <span className="font-bold text-gray-900">+ ₩ {(data.breakdown.shippingFee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-600">기타 추가 비용 (인증 등)</span>
                      <span className="font-bold text-gray-900">+ ₩ {(data.breakdown.additionalCost || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 bg-gray-900 text-white px-4 rounded-xl mt-4">
                      <span className="font-bold">총 수입 비용 합계</span>
                      <span className="text-xl font-black">₩ {(data.breakdown.totalCostKRW || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Summary Stats */}
              <div className="bg-gray-50 rounded-3xl p-8 flex flex-col justify-between border border-gray-100">
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Unit Cost Summary</h3>
                  <div className="mb-8">
                    <p className="text-xs text-gray-500 mb-1">최종 개당 원가</p>
                    <p className="text-4xl font-black text-primary-600 leading-none">₩ {(data.breakdown.unitCostKRW || 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">총 예상 CBM</p>
                      <p className="text-lg font-bold text-gray-800">{data.cbm.total.toFixed(3)} CBM</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">적용 CBM (운송료)</p>
                      <p className="text-lg font-bold text-gray-800">{data.cbm.applied} CBM</p>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-tighter">Powered by Import Calculator</p>
                  <div className="flex items-center gap-2 text-primary-600 font-black text-xl italic">
                    <Globe size={20} /> LOGIS-PRO
                  </div>
                </div>
              </div>
            </div>

            {/* Selling Strategy */}
            <section className="mb-10">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={14} /> 판매 채널별 전략 분석 (부가세 포함 기준)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Wholesale */}
                <div className="border-2 border-indigo-100 rounded-3xl p-6 bg-indigo-50/30">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Wholesale Channel</p>
                  <h4 className="text-lg font-bold text-indigo-900 mb-4">도매 공급가</h4>
                  <p className="text-2xl font-black text-indigo-600 mb-4">₩ {(data.sellingPrice.wholesalePrice || 0).toLocaleString()}</p>
                  <div className="text-xs text-indigo-700 space-y-2">
                    <div className="flex justify-between">
                      <span>적용 마진율</span>
                      <span className="font-bold">{data.margins.wholesale}%</span>
                    </div>
                    <div className="flex justify-between border-t border-indigo-100 pt-2">
                      <span>예상 총 수익</span>
                      <span className="font-bold">₩ {(data.sellingPrice.wholesaleTotalProfit || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Retail */}
                <div className="border-2 border-pink-100 rounded-3xl p-6 bg-pink-50/30">
                  <p className="text-[10px] font-black text-pink-400 uppercase mb-2">Retail Channel</p>
                  <h4 className="text-lg font-bold text-pink-900 mb-4">소매 판매가</h4>
                  <p className="text-2xl font-black text-pink-600 mb-4">₩ {(data.sellingPrice.retailPrice || 0).toLocaleString()}</p>
                  <div className="text-xs text-pink-700 space-y-2">
                    <div className="flex justify-between">
                      <span>수수료+마진</span>
                      <span className="font-bold">{data.margins.retailFee + data.margins.retailMargin}%</span>
                    </div>
                    <div className="flex justify-between border-t border-pink-100 pt-2">
                      <span>예상 총 수익</span>
                      <span className="font-bold">₩ {(data.sellingPrice.retailTotalProfit || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Online */}
                <div className="border-2 border-green-100 rounded-3xl p-6 bg-green-50/30">
                  <p className="text-[10px] font-black text-green-400 uppercase mb-2">Online Channel</p>
                  <h4 className="text-lg font-bold text-green-900 mb-4">온라인 판매가</h4>
                  <p className="text-2xl font-black text-green-600 mb-4">₩ {(data.sellingPrice.onlinePrice || 0).toLocaleString()}</p>
                  <div className="text-xs text-green-700 space-y-2">
                    <div className="flex justify-between">
                      <span>수수료+마진</span>
                      <span className="font-bold">{data.margins.onlineSiteFee + data.margins.onlineOtherFee + data.margins.onlineTargetMargin}%</span>
                    </div>
                    <div className="flex justify-between border-t border-green-100 pt-2">
                      <span>예상 총 수익</span>
                      <span className="font-bold">₩ {(data.sellingPrice.onlineTotalProfit || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Guidance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-2xl p-6 text-xs text-gray-500 leading-relaxed border border-gray-100">
                <p className="font-bold mb-2 text-gray-700">※ 보고서 유의사항</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>본 보고서의 수치는 입력된 데이터를 기반으로 산출된 시뮬레이션 결과입니다.</li>
                  <li>실제 통관 시 관세청의 품목 분류(HS Code) 및 환율 변동에 따라 오차가 발생할 수 있습니다.</li>
                  <li>운송료는 LCL(소량 화물) 기준으로 계산되었으며, 실제 포워딩 업체의 견적과 다를 수 있습니다.</li>
                  <li>판매 전략 수립 시 시장 상황 및 경쟁사 가격을 충분히 고려하시기 바랍니다.</li>
                </ul>
              </div>
              <div className="bg-blue-50/50 rounded-2xl p-6 text-xs text-blue-700 leading-relaxed border border-blue-100">
                <p className="font-bold mb-2 text-blue-800">💡 원가 계산 기준</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>환율: 실시간 네이버 매매기준율 적용</li>
                  <li>숨겨진 비용: 수량별 자동 할증 (1,000개 이하 300위안, 5,000개 이하 600위안 등)</li>
                  <li>관세/부가세: 사용자 설정 비율 적용</li>
                  <li>기타 비용: 검사비, 인증비 등 사용자 입력 항목 포함</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportModal;
