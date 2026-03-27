import React, { useState, useEffect, useMemo } from 'react';
import { fetchCurrentExchangeRates } from './services/geminiService';
import { Currency, ExchangeRates, CostBreakdown, GroundingSource, AdditionalCostItem } from './types';
import { Calculator, RefreshCw, DollarSign, Box, PlusCircle, ExternalLink, TrendingUp, Store, ShoppingBag, Coins, ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';
import InfoTooltip from './components/InfoTooltip';
import AdditionalCostModal from './components/AdditionalCostModal';
import ReportModal from './components/ReportModal';

const App: React.FC = () => {
  const [fetchedRates, setFetchedRates] = useState<ExchangeRates>({ USD: 0, CNY: 0 });
  const [loadingRates, setLoadingRates] = useState<boolean>(true);
  const [rateSources, setRateSources] = useState<GroundingSource[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [productName, setProductName] = useState<string>('');
  const [isManualUSD, setIsManualUSD] = useState<boolean>(false);
  const [isManualCNY, setIsManualCNY] = useState<boolean>(false);
  const [manualUSD, setManualUSD] = useState<string>('');
  const [manualCNY, setManualCNY] = useState<string>('');
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [localShippingCurrency, setLocalShippingCurrency] = useState<Currency>(Currency.USD);
  const [forwardingFee, setForwardingFee] = useState<string>('0');
  const [localShippingFee, setLocalShippingFee] = useState<string>('0');
  const [dutyRate, setDutyRate] = useState<string>('8');
  const [vatRate, setVatRate] = useState<string>('10');
  const [productCost, setProductCost] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [additionalCostItems, setAdditionalCostItems] = useState<AdditionalCostItem[]>([]);
  const [isFeeSettingsExpanded, setIsFeeSettingsExpanded] = useState<boolean>(true);
  const [isCbmExpanded, setIsCbmExpanded] = useState<boolean>(false);
  const [isAdditionalCostExpanded, setIsAdditionalCostExpanded] = useState<boolean>(true);
  const [isSellingPriceSettingsExpanded, setIsSellingPriceSettingsExpanded] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  
  // Selling Price Settings States
  const [wholesaleMargin, setWholesaleMargin] = useState<number>(10);
  const [retailMargin, setRetailMargin] = useState<number>(13);
  const [retailFee, setRetailFee] = useState<number>(12);
  
  const [onlineTargetMargin, setOnlineTargetMargin] = useState<number>(20);
  const [onlineSiteFee, setOnlineSiteFee] = useState<number>(15);
  const [onlineOtherFee, setOnlineOtherFee] = useState<number>(5);
  
  // CBM States
  const [cbmMethod, setCbmMethod] = useState<'product' | 'carton'>('carton');
  const [pL, setPL] = useState<string>('');
  const [pW, setPW] = useState<string>('');
  const [pH, setPH] = useState<string>('');
  const [pQty, setPQty] = useState<string>('1');
  
  const [cL, setCL] = useState<string>('');
  const [cW, setCW] = useState<string>('');
  const [cH, setCH] = useState<string>('');
  const [cInBox, setCInBox] = useState<string>('1');
  const [shippingRatePerCbm, setShippingRatePerCbm] = useState<string>('120000');
  const [manualCbm, setManualCbm] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Initial Data Fetch & Periodic Update
  useEffect(() => {
    loadRates();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadRates();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const loadRates = async () => {
    const effectiveApiKey = userApiKey;
    
    // Check if API key is available
    if (!effectiveApiKey) {
      console.warn("Gemini API key is missing. Switching to manual mode.");
      setLoadingRates(false);
      setIsManualUSD(true);
      setIsManualCNY(true);
      // Set some reasonable defaults if manual values are empty
      if (!manualUSD) setManualUSD('1350');
      if (!manualCNY) setManualCNY('195');
      return;
    }

    setLoadingRates(true);
    try {
      const data = await fetchCurrentExchangeRates(effectiveApiKey);
      setFetchedRates(data.rates);
      setRateSources(data.sources);
      setLastUpdated(new Date());
      
      // Initialize manual rates with fetched rates if they are empty
      if (!manualUSD) setManualUSD(data.rates.USD.toString());
      if (!manualCNY) setManualCNY(data.rates.CNY.toString());
    } catch (error) {
      console.error("Failed to load rates:", error);
      // If API fails, switch to manual mode
      setIsManualUSD(true);
      setIsManualCNY(true);
    } finally {
      setLoadingRates(false);
    }
  };

  // Effective Rates (Manual or Fetched)
  const rates = useMemo(() => {
    const r = { ...fetchedRates };
    if (isManualUSD) r.USD = parseFloat(manualUSD) || fetchedRates.USD;
    if (isManualCNY) r.CNY = parseFloat(manualCNY) || fetchedRates.CNY;
    return r;
  }, [isManualUSD, manualUSD, fetchedRates, isManualCNY, manualCNY]);

  const SHIPPING_RATE_PER_CBM = 120000;

  const calculatedCbm = useMemo(() => {
    const totalQty = parseInt(quantity) || 0;
    if (cbmMethod === 'carton') {
      const l = parseFloat(cL) || 0;
      const w = parseFloat(cW) || 0;
      const h = parseFloat(cH) || 0;
      const inBox = parseInt(cInBox) || 1;
      const cbmPerCarton = (l * w * h) / 1000000;
      const totalCartons = Math.ceil(totalQty / inBox);
      return {
        perCarton: cbmPerCarton,
        total: cbmPerCarton * totalCartons,
        cartons: totalCartons
      };
    } else {
      const l = parseFloat(pL) || 0;
      const w = parseFloat(pW) || 0;
      const h = parseFloat(pH) || 0;
      const perCarton = parseInt(pQty) || 1;
      const cbmPerCarton = (l * w * h * perCarton) / 1000000;
      const totalCartons = Math.ceil(totalQty / perCarton);
      return {
        perCarton: cbmPerCarton,
        total: cbmPerCarton * totalCartons,
        cartons: totalCartons
      };
    }
  }, [quantity, cbmMethod, cL, cW, cH, cInBox, pL, pW, pH, pQty]);

  // Calculation Logic
  const breakdown: CostBreakdown = useMemo(() => {
    const cost = parseFloat(productCost) || 0;
    const qty = parseInt(quantity) || 0;
    const rate = rates[currency] || 0;
    const lShipRate = rates[localShippingCurrency] || 0;
    const fFeeRate = (parseFloat(forwardingFee) || 0) / 100;
    const lShipFee = parseFloat(localShippingFee) || 0;
    const dRate = (parseFloat(dutyRate) || 0) / 100;
    const vRate = (parseFloat(vatRate) || 0) / 100;

    if (cost === 0 || qty === 0 || rate === 0) {
      return {
        baseAmountForeign: 0,
        baseAmountKRW: 0,
        hiddenFeeKRW: 0,
        forwardingFee: 0,
        localShippingFeeKRW: 0,
        duty: 0,
        vat: 0,
        shippingFee: 0,
        additionalCost: 0,
        totalCostKRW: 0,
        unitCostKRW: 0
      };
    }

    const productBaseKRW = cost * qty * rate;
    const lShipFeeKRW = lShipFee * lShipRate;
    
    // Hidden Fee Logic (CNY based)
    // 1000 or less: 300 CNY, 5000 or less: 600 CNY, Over 5000: 800 CNY
    let hiddenFeeCNY = 0;
    if (qty <= 1000) {
      hiddenFeeCNY = 300;
    } else if (qty <= 5000) {
      hiddenFeeCNY = 600;
    } else {
      hiddenFeeCNY = 800;
    }

    // Convert hidden fee to KRW (Always use CNY rate for this fee)
    const hiddenFeeKRW = hiddenFeeCNY * (rates.CNY || 195);

    // Base Amount in KRW includes the hidden fee invisibly
    const baseAmountKRW = productBaseKRW + lShipFeeKRW + hiddenFeeKRW;
    
    const calculatedForwardingFee = baseAmountKRW * fFeeRate;
    const duty = baseAmountKRW * dRate;
    const vat = (baseAmountKRW + duty + calculatedForwardingFee) * vRate;
    
    const sRate = parseFloat(shippingRatePerCbm) || 0;
    const autoRoundedCbm = Math.round(calculatedCbm.total);
    const cbmToUse = manualCbm !== '' ? (parseFloat(manualCbm) || 0) : autoRoundedCbm;
    const shippingFee = cbmToUse * sRate;
    
    const additionalCost = additionalCostItems.reduce((sum, item) => sum + item.amount, 0);
    const totalCostKRW = baseAmountKRW + calculatedForwardingFee + duty + vat + shippingFee + additionalCost;
    const unitCostKRW = totalCostKRW / qty;

    return {
      baseAmountForeign: cost * qty,
      baseAmountKRW,
      hiddenFeeKRW,
      forwardingFee: calculatedForwardingFee,
      localShippingFeeKRW: lShipFeeKRW,
      duty,
      vat,
      shippingFee,
      additionalCost,
      totalCostKRW,
      unitCostKRW
    };
  }, [productCost, quantity, currency, localShippingCurrency, rates, additionalCostItems, forwardingFee, localShippingFee, dutyRate, vatRate, calculatedCbm, shippingRatePerCbm, manualCbm]);

  // Selling Price Logic
  const sellingPrice = useMemo(() => {
    const qty = parseInt(quantity) || 0;
    const vatIncludedUnitCost = breakdown.unitCostKRW;
    
    // Wholesale: Price + Margin %
    const wMargin = wholesaleMargin / 100;
    const wholesalePrice = vatIncludedUnitCost * (1 + wMargin);
    const wholesaleProfitPerUnit = vatIncludedUnitCost * wMargin;
    const wholesaleTotalProfit = wholesaleProfitPerUnit * qty;

    // Retail: Price + Fee % + Margin %
    const rFee = retailFee / 100;
    const rMargin = retailMargin / 100;
    const retailPrice = vatIncludedUnitCost * (1 + rFee + rMargin);
    const retailProfitPerUnit = vatIncludedUnitCost * rMargin;
    const retailTotalProfit = retailProfitPerUnit * qty;

    // Online: Price + Site Fee % + Other Fee % + Target Margin %
    const oSiteFee = onlineSiteFee / 100;
    const oOtherFee = onlineOtherFee / 100;
    const oMargin = onlineTargetMargin / 100;
    const onlinePrice = vatIncludedUnitCost * (1 + oSiteFee + oOtherFee + oMargin);
    const onlineProfitPerUnit = vatIncludedUnitCost * oMargin;
    const onlineTotalProfit = onlineProfitPerUnit * qty;

    return {
      vatIncludedUnitCost,
      wholesalePrice,
      wholesaleTotalProfit,
      retailPrice,
      retailTotalProfit,
      onlinePrice,
      onlineTotalProfit
    };
  }, [breakdown.unitCostKRW, quantity, wholesaleMargin, retailMargin, retailFee, onlineTargetMargin, onlineSiteFee, onlineOtherFee]);


  const localShippingCurrencySymbol = useMemo(() => {
    switch (localShippingCurrency) {
      case Currency.USD: return '$';
      case Currency.CNY: return '¥';
      case Currency.JPY: return '¥';
      case Currency.EUR: return '€';
      case Currency.GBP: return '£';
      case Currency.HKD: return 'HK$';
      case Currency.TWD: return 'NT$';
      case Currency.VND: return '₫';
      case Currency.THB: return '฿';
      case Currency.PHP: return '₱';
      case Currency.SGD: return 'S$';
      case Currency.AUD: return 'A$';
      case Currency.CAD: return 'C$';
      default: return '$';
    }
  }, [localShippingCurrency]);

  const currencySymbol = useMemo(() => {
    switch (currency) {
      case Currency.USD: return '$';
      case Currency.CNY: return '¥';
      case Currency.JPY: return '¥';
      case Currency.EUR: return '€';
      case Currency.GBP: return '£';
      case Currency.HKD: return 'HK$';
      case Currency.TWD: return 'NT$';
      case Currency.VND: return '₫';
      case Currency.THB: return '฿';
      case Currency.PHP: return '₱';
      case Currency.SGD: return 'S$';
      case Currency.AUD: return 'A$';
      case Currency.CAD: return 'C$';
      default: return '$';
    }
  }, [currency]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-primary-200">
      
      {/* Header */}
      <header className={`bg-white border-b border-gray-200 sticky top-0 z-30 print:hidden`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 text-white p-2 rounded-lg shadow-sm">
              <Calculator size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
              수입 원가 계산기
            </h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="hidden sm:flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              <span className={`w-2 h-2 rounded-full ${loadingRates ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span>
              {loadingRates ? '환율 조회 중...' : '매매기준율 적용'}
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isReportModalOpen ? 'print:hidden' : ''}`}>
        
        {/* Exchange Rate Banner */}
        <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:hidden">
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <RefreshCw size={16} className="text-primary-600" />
                  실시간 환율 정보
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  환율 실시간 조회를 위해 API 키를 넣거나 수동으로 환율을 입력하세요.
                </p>
              </div>
              <button 
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 transition-colors"
              >
                {showApiKeyInput ? 'API 키 입력창 닫기' : 'Gemini API 키 입력'}
              </button>
            </div>

            {showApiKeyInput && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-gray-700 mb-2">Gemini API Key</label>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    placeholder="AI Studio에서 발급받은 API 키를 입력하세요"
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                  />
                  <button 
                    onClick={() => {
                      loadRates();
                      setShowApiKeyInput(false);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
                  >
                    적용
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  * 입력하신 API 키는 브라우저 메모리에만 유지되며 서버에 저장되지 않습니다.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-8 w-full md:w-auto">
               {/* USD Rate */}
               <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                        $
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">USD 매매기준율</p>
                        {isManualUSD ? (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-gray-400 text-sm">₩</span>
                            <input 
                              type="number" 
                              value={manualUSD}
                              onChange={(e) => setManualUSD(e.target.value)}
                              className="w-24 px-2 py-1 text-sm font-bold border border-primary-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-gray-900">
                            {loadingRates && fetchedRates.USD === 0 ? '...' : `₩${(fetchedRates.USD || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsManualUSD(!isManualUSD)}
                      className={`ml-4 text-[10px] px-2 py-1 rounded-full border transition-colors ${
                        isManualUSD ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {isManualUSD ? '수동' : '자동'}
                    </button>
                  </div>
               </div>

               <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>

               {/* CNY Rate */}
               <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold border border-red-100">
                        ¥
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">CNY 매매기준율</p>
                        {isManualCNY ? (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-gray-400 text-sm">₩</span>
                            <input 
                              type="number" 
                              value={manualCNY}
                              onChange={(e) => setManualCNY(e.target.value)}
                              className="w-24 px-2 py-1 text-sm font-bold border border-primary-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-gray-900">
                            {loadingRates && fetchedRates.CNY === 0 ? '...' : `₩${(fetchedRates.CNY || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsManualCNY(!isManualCNY)}
                      className={`ml-4 text-[10px] px-2 py-1 rounded-full border transition-colors ${
                        isManualCNY ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {isManualCNY ? '수동' : '자동'}
                    </button>
                  </div>
               </div>
            </div>

            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button 
                  onClick={loadRates}
                  disabled={loadingRates}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50 whitespace-nowrap w-full sm:w-auto justify-center"
                >
                  <RefreshCw size={16} className={loadingRates ? "animate-spin" : ""} />
                  환율 새로고침
                </button>
                
                {!process.env.GEMINI_API_KEY && (
                  <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                    <a 
                      href="https://finance.naver.com/marketindex/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap w-full sm:w-auto justify-center border border-green-200"
                    >
                      <ExternalLink size={16} />
                      네이버 환율 확인
                    </a>
                    <span className="text-[9px] text-green-600 font-medium hidden sm:block">
                      * 환율 확인 후 수동으로 입력해주세요
                    </span>
                  </div>
                )}
              </div>
              
              {lastUpdated && (
                <span className="text-[10px] text-gray-400">
                  마지막 업데이트: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Source Links */}
          {!loadingRates && rateSources.some(s => s.title.includes('네이버') || s.title.toLowerCase().includes('naver')) && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
               <span className="text-[10px] text-gray-400 self-center uppercase tracking-wider font-bold">환율 출처:</span>
               {rateSources
                 .filter(source => source.title.includes('네이버') || source.title.toLowerCase().includes('naver'))
                 .map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded hover:underline border border-primary-100"
                  >
                    {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                    <ExternalLink size={8} />
                  </a>
               ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
          
          {/* Input Section */}
          <section className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Box size={20} className="text-primary-600" />
                제품 정보 입력
              </h2>
              
              <div className="space-y-6">
                {/* Product Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제품명 (보고서용)</label>
                  <input
                    type="text"
                    placeholder="예: 캠핑용 무드등"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>

                {/* Currency Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">결제 통화</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow bg-white"
                  >
                    {Object.values(Currency).map((curr) => (
                      <option key={curr} value={curr}>
                        {curr} ({curr === Currency.USD ? '달러' : curr === Currency.CNY ? '위안' : curr === Currency.JPY ? '엔' : curr === Currency.EUR ? '유로' : curr === Currency.GBP ? '파운드' : curr})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cost Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제품 원가 (단가)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold">{currencySymbol}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="block w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                      value={productCost}
                      onChange={(e) => setProductCost(e.target.value)}
                    />
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수입 수량 (개)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Fee and General Cost Settings Block */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsFeeSettingsExpanded(!isFeeSettingsExpanded)}
              >
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600" />
                  수수료 및 세금 항목 설정
                </h2>
                {isFeeSettingsExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
              
              {isFeeSettingsExpanded && (
                <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Forwarding and Local Shipping Fees */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">포워딩 수수료 (%)</label>
                      <input
                        type="number"
                        value={forwardingFee}
                        onChange={(e) => setForwardingFee(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">현지 운송비</label>
                      <div className="flex gap-2">
                        <select
                          value={localShippingCurrency}
                          onChange={(e) => setLocalShippingCurrency(e.target.value as Currency)}
                          className="w-24 px-2 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white text-sm"
                        >
                          {Object.values(Currency).map((curr) => (
                            <option key={curr} value={curr}>{curr}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={localShippingFee}
                          onChange={(e) => setLocalShippingFee(e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tax Items Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">관세 (%)</label>
                      <input
                        type="number"
                        value={dutyRate}
                        onChange={(e) => setDutyRate(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                        placeholder="8"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">부가세 (%)</label>
                      <input
                        type="number"
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CBM Calculator Block */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsCbmExpanded(!isCbmExpanded)}
              >
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Box size={20} className="text-blue-600" />
                  제품 CBM 계산기
                </h2>
                <div className="flex items-center gap-3">
                  {calculatedCbm.total > 0 && (
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {calculatedCbm.total.toFixed(3)} CBM
                    </span>
                  )}
                  {isCbmExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </div>

              {isCbmExpanded && (
                <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button
                      onClick={() => setCbmMethod('carton')}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                        cbmMethod === 'carton' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      카톤 박스 기준
                    </button>
                    <button
                      onClick={() => setCbmMethod('product')}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                        cbmMethod === 'product' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      제품 사이즈 기준
                    </button>
                  </div>

                  {cbmMethod === 'carton' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">가로 (cm)</label>
                          <input type="number" value={cL} onChange={(e) => setCL(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="L" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">세로 (cm)</label>
                          <input type="number" value={cW} onChange={(e) => setCW(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="W" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">높이 (cm)</label>
                          <input type="number" value={cH} onChange={(e) => setCH(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="H" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">카톤당 입수량 (개)</label>
                        <input type="number" value={cInBox} onChange={(e) => setCInBox(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="In-box Qty" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">적용 CBM (반올림)</label>
                          <input 
                            type="number" 
                            value={manualCbm !== '' ? manualCbm : Math.round(calculatedCbm.total)} 
                            onChange={(e) => setManualCbm(e.target.value)} 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 font-bold text-blue-900" 
                            placeholder={Math.round(calculatedCbm.total).toString()}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CBM당 운송료 (원)</label>
                          <input type="number" value={shippingRatePerCbm} onChange={(e) => setShippingRatePerCbm(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="120,000" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">* 1 CBM당 비용 (정수 반올림 계산 적용, 수동 수정 가능)</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">가로 (cm)</label>
                          <input type="number" value={pL} onChange={(e) => setPL(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="L" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">세로 (cm)</label>
                          <input type="number" value={pW} onChange={(e) => setPW(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="W" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">높이 (cm)</label>
                          <input type="number" value={pH} onChange={(e) => setPH(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="H" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">카톤당 수량 (개)</label>
                        <input type="number" value={pQty} onChange={(e) => setPQty(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Qty per Carton" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">적용 CBM (반올림)</label>
                          <input 
                            type="number" 
                            value={manualCbm !== '' ? manualCbm : Math.round(calculatedCbm.total)} 
                            onChange={(e) => setManualCbm(e.target.value)} 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 font-bold text-blue-900" 
                            placeholder={Math.round(calculatedCbm.total).toString()}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CBM당 운송료 (원)</label>
                          <input type="number" value={shippingRatePerCbm} onChange={(e) => setShippingRatePerCbm(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="120,000" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">* 1 CBM당 비용 (정수 반올림 계산 적용, 수동 수정 가능)</p>
                    </div>
                  )}

                  {calculatedCbm.total > 0 && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-700">카톤당 CBM</span>
                        <span className="font-bold text-blue-900">{calculatedCbm.perCarton.toFixed(4)} CBM</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-700">총 카톤 수</span>
                        <span className="font-bold text-blue-900">{calculatedCbm.cartons} CTN</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-blue-200 mt-2">
                        <span className="text-blue-800 font-bold">총 예상 CBM</span>
                        <span className="text-lg font-black text-blue-900">{calculatedCbm.total.toFixed(3)} CBM</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-blue-700">적용 CBM (정수 반올림)</span>
                        <span className="font-bold text-blue-900">{manualCbm !== '' ? manualCbm : Math.round(calculatedCbm.total)} CBM</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-blue-700">예상 운송료 (LCL 기준)</span>
                        <span className="font-bold text-blue-900">₩ {(breakdown.shippingFee || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional Cost Block */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
              <div 
                className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsAdditionalCostExpanded(!isAdditionalCostExpanded)}
              >
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <PlusCircle size={20} className="text-orange-600" />
                  기타 추가 비용 설정
                </h2>
                <div className="flex items-center gap-3">
                  {breakdown.additionalCost > 0 && (
                    <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                      ₩{(breakdown.additionalCost || 0).toLocaleString()}
                    </span>
                  )}
                  {isAdditionalCostExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </div>
              
              {isAdditionalCostExpanded && (
                <div className="p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    식품검사비, KC인증비용, 정밀검사비 등 통관 및 안전 관련 고정 비용을 별도로 추가하여 원가에 반영할 수 있습니다.
                  </p>

                  {additionalCostItems.length > 0 && (
                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                      {additionalCostItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded border border-gray-100">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-semibold text-gray-800">₩{(item.amount || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-all border-2 ${
                      breakdown.additionalCost > 0 
                        ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100' 
                        : 'border-dashed border-gray-300 text-gray-500 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50'
                    }`}
                  >
                    <PlusCircle size={20} />
                    {breakdown.additionalCost > 0 ? '추가 비용 내역 수정하기' : '추가 비용 항목 추가하기'}
                  </button>
                </div>
              )}
            </div>
            
            {/* Selling Price Settings Block */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsSellingPriceSettingsExpanded(!isSellingPriceSettingsExpanded)}
              >
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary-600" />
                  판매 마진 및 수수료 설정
                </h2>
                {isSellingPriceSettingsExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
              
              {isSellingPriceSettingsExpanded && (
                <div className="p-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Wholesale & Retail Settings */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">도/소매 설정</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">도매 마진율</label>
                          <span className="text-sm font-bold text-primary-600">{wholesaleMargin}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="1"
                          value={wholesaleMargin}
                          onChange={(e) => setWholesaleMargin(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">소매 수수료</label>
                            <span className="text-sm font-bold text-pink-600">{retailFee}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="50" step="1"
                            value={retailFee}
                            onChange={(e) => setRetailFee(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">소매 마진율</label>
                            <span className="text-sm font-bold text-pink-600">{retailMargin}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="100" step="1"
                            value={retailMargin}
                            onChange={(e) => setRetailMargin(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100"></div>

                  {/* Online Settings */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">온라인 판매 설정</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">목표 마진율</label>
                          <span className="text-sm font-bold text-green-600">{onlineTargetMargin}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="1"
                          value={onlineTargetMargin}
                          onChange={(e) => setOnlineTargetMargin(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">사이트 수수료</label>
                            <span className="text-sm font-bold text-green-600">{onlineSiteFee}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="30" step="1"
                            value={onlineSiteFee}
                            onChange={(e) => setOnlineSiteFee(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">기타 부가 비용</label>
                            <span className="text-sm font-bold text-green-600">{onlineOtherFee}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="30" step="1"
                            value={onlineOtherFee}
                            onChange={(e) => setOnlineOtherFee(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400">* 기타 부가 비용: 포장, 창고, 자재비 등 포함</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 leading-relaxed border border-blue-100 shadow-sm">
              <strong className="block mb-1 flex items-center gap-1">
                <Calculator size={14} /> 원가 계산 기준 안내
              </strong>
              <ul className="list-disc pl-4 space-y-1">
                <li>현지 포워딩 수수료: 사용자 설정 ({forwardingFee}%)</li>
                <li>현지 운송비: 사용자 직접 입력 ({localShippingCurrencySymbol})</li>
                <li>관세: {dutyRate}% / 부가세: {vatRate}%</li>
                <li>환율: 실시간 네이버 매매기준율 적용</li>
                <li>숨겨진 비용: 수량별 자동 할증 (1,000개 이하 300위안 등)</li>
              </ul>
            </div>
          </section>
          {/* Result Section */}
          <section className="lg:col-span-7 space-y-6">
            {/* Cost Breakdown Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 text-white p-6">
                <h2 className="text-lg font-medium text-gray-300 mb-1">최종 개당 원가</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">
                    ₩ {(breakdown.unitCostKRW || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-gray-400">/ 개</span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">비용 상세 분석</h3>
                
                <div className="space-y-4">
                  {/* Base Cost */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600 font-medium">제품 매입가 (순수)</span>
                        <InfoTooltip content="입력한 원가에 수량을 곱한 값입니다." />
                      </div>
                      <span className="text-xs text-gray-400">
                        {currencySymbol} {(breakdown.baseAmountForeign || 0).toLocaleString()} × 환율 (보정값 포함)
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">₩ {(breakdown.baseAmountKRW - breakdown.hiddenFeeKRW || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>

                  {/* Hidden Fee */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-medium">숨겨진 비용 (수량별 할증)</span>
                      <InfoTooltip content="중국 내수 시장의 특성상 소량 구매 시 발생하는 자동 핸들링 비용(1,000개 이하 300위안 등)입니다. 수량에 따라 자동으로 계산에 반영됩니다." />
                    </div>
                    <span className="font-semibold text-gray-900">+ ₩ {(breakdown.hiddenFeeKRW || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>

                  {/* Local Shipping Fee */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-medium">현지 운송비</span>
                      <span className="ml-2 text-xs text-gray-400">({localShippingFee} {localShippingCurrencySymbol})</span>
                    </div>
                    <span className="font-semibold text-gray-900">+ ₩ {(breakdown.localShippingFeeKRW || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>

                  {/* Forwarding Fee */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">현지 포워딩 수수료</span>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5">
                        {forwardingFee}%
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">+ ₩ {(breakdown.forwardingFee || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>

                  {/* Duty & VAT */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-medium">관세 ({dutyRate}%)</span>
                    </div>
                    <span className="font-semibold text-gray-900">+ ₩ {(breakdown.duty || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-medium">부가세 ({vatRate}%)</span>
                    </div>
                    <span className="font-semibold text-gray-900">+ ₩ {(breakdown.vat || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>

                  {/* Shipping Fee */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-medium">예상 운송료 (LCL)</span>
                      <span className="ml-2 text-xs text-gray-400">({manualCbm !== '' ? manualCbm : Math.round(calculatedCbm.total)} CBM)</span>
                    </div>
                    <span className="font-semibold text-gray-900">+ ₩ {(breakdown.shippingFee || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>

                  {/* Additional Costs */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <span className="text-gray-600 font-medium">기타 추가 비용</span>
                      {breakdown.additionalCost > 0 && (
                         <span className="ml-2 text-xs text-gray-400">(검사비 등)</span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">{breakdown.additionalCost > 0 ? '+ ' : ''}₩ {(breakdown.additionalCost || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="mt-8 bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 font-medium">총 지출 예상 금액</span>
                    <span className="text-xl font-bold text-gray-800">₩ {(breakdown.totalCostKRW || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 flex overflow-hidden">
                    <div className="bg-gray-400 h-2.5" style={{ width: `${(breakdown.baseAmountKRW / breakdown.totalCostKRW) * 100 || 0}%` }}></div>
                    <div className="bg-orange-400 h-2.5" style={{ width: `${(breakdown.forwardingFee / breakdown.totalCostKRW) * 100 || 0}%` }}></div>
                    <div className="bg-indigo-400 h-2.5" style={{ width: `${((breakdown.duty + breakdown.vat) / breakdown.totalCostKRW) * 100 || 0}%` }}></div>
                    <div className="bg-blue-400 h-2.5" style={{ width: `${(breakdown.shippingFee / breakdown.totalCostKRW) * 100 || 0}%` }}></div>
                    <div className="bg-primary-500 h-2.5" style={{ width: `${(breakdown.additionalCost / breakdown.totalCostKRW) * 100 || 0}%` }}></div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 justify-end">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-400"></div>제품가</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div>포워딩</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div>세금</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div>운송료</div>
                    {breakdown.additionalCost > 0 && <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary-500"></div>기타</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Selling Price Card (New) */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
               <div className="px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={20} />
                  <h2 className="text-lg font-bold text-indigo-900">판매 예상가 (부가세 포함)</h2>
               </div>
               <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  {/* Wholesale */}
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all flex flex-col justify-between">
                     <div>
                       <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Store size={48} className="text-indigo-600" />
                       </div>
                       <h3 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1">
                          <Store size={14} /> 도매 공급가
                       </h3>
                       <div className="text-2xl font-bold text-indigo-900 mb-2">
                          ₩ {(sellingPrice.wholesalePrice || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </div>
                       <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded-lg mb-3">
                          <div className="flex justify-between">
                             <span>원가+부가세</span>
                             <span>₩ {(sellingPrice.vatIncludedUnitCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between font-medium text-indigo-700">
                             <span>+ 마진율 {wholesaleMargin}%</span>
                             <span>+ ₩ {(sellingPrice.wholesalePrice - sellingPrice.vatIncludedUnitCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                       </div>
                     </div>
                     
                     <div className="border-t border-indigo-50 pt-3">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Coins size={12} /> 총 예상 수익 (완판 시)
                        </div>
                        <div className="text-lg font-bold text-indigo-600">
                          + ₩ {(sellingPrice.wholesaleTotalProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                     </div>
                  </div>

                  {/* Retail */}
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all flex flex-col justify-between">
                     <div>
                       <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                          <ShoppingBag size={48} className="text-pink-600" />
                       </div>
                       <h3 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1">
                          <ShoppingBag size={14} /> 소매 판매가
                       </h3>
                       <div className="text-2xl font-bold text-pink-700 mb-2">
                          ₩ {(sellingPrice.retailPrice || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </div>
                       <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded-lg mb-3">
                          <div className="flex justify-between">
                             <span>원가+부가세</span>
                             <span>₩ {(sellingPrice.vatIncludedUnitCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between font-medium text-pink-700">
                             <span>+ 수수료/마진 {retailFee + retailMargin}%</span>
                             <span>+ ₩ {(sellingPrice.retailPrice - sellingPrice.vatIncludedUnitCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                       </div>
                     </div>

                     <div className="border-t border-indigo-50 pt-3">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Coins size={12} /> 총 예상 수익 (완판 시)
                        </div>
                        <div className="text-lg font-bold text-pink-600">
                          + ₩ {(sellingPrice.retailTotalProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                     </div>
                  </div>

                  {/* Online */}
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all flex flex-col justify-between">
                     <div>
                       <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                          <ExternalLink size={48} className="text-green-600" />
                       </div>
                       <h3 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1">
                          <ExternalLink size={14} /> 온라인 판매가
                       </h3>
                       <div className="text-2xl font-bold text-green-700 mb-2">
                          ₩ {(sellingPrice.onlinePrice || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </div>
                       <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded-lg mb-3">
                          <div className="flex justify-between">
                             <span>원가+부가세</span>
                             <span>₩ {(sellingPrice.vatIncludedUnitCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between font-medium text-green-700">
                             <span>+ 수수료/마진 {onlineSiteFee + onlineOtherFee + onlineTargetMargin}%</span>
                             <span>+ ₩ {(sellingPrice.onlinePrice - sellingPrice.vatIncludedUnitCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                       </div>
                     </div>

                     <div className="border-t border-indigo-50 pt-3">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Coins size={12} /> 총 예상 수익 (완판 시)
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          + ₩ {(sellingPrice.onlineTotalProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                     </div>
                  </div>

               </div>
               <div className="bg-indigo-50/50 px-6 py-3 text-xs text-indigo-700 flex items-center gap-2 border-t border-indigo-100">
                  <InfoTooltip content={`도매가는 마진 ${wholesaleMargin}%를, 소매가는 수수료 ${retailFee}%와 마진 ${retailMargin}%를, 온라인가는 수수료 ${onlineSiteFee}%, 부가비용 ${onlineOtherFee}%, 마진 ${onlineTargetMargin}%를 더한 금액입니다.`} />
                  <span>모든 판매가는 부가세 10%가 포함된 원가를 기준으로 계산됩니다.</span>
               </div>
            </div>

            <div className="flex justify-center print:hidden">
              <button 
                onClick={() => setIsReportModalOpen(true)} 
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg hover:shadow-xl active:scale-95"
              >
                <FileText size={18} /> 보고서 생성 및 PDF 저장
              </button>
            </div>

          </section>
        </div>
      </main>

      <AdditionalCostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={setAdditionalCostItems}
        initialItems={additionalCostItems}
      />

      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        data={{
          productName: productName,
          unitPrice: productCost,
          quantity: quantity,
          currency: currency,
          exchangeRate: rates[currency],
          breakdown: {
            ...breakdown,
            hiddenFeeKRW: breakdown.hiddenFeeKRW
          },
          sellingPrice: sellingPrice,
          margins: {
            wholesale: wholesaleMargin,
            retailFee: retailFee,
            retailMargin: retailMargin,
            onlineSiteFee: onlineSiteFee,
            onlineOtherFee: onlineOtherFee,
            onlineTargetMargin: onlineTargetMargin,
          },
          cbm: {
            total: calculatedCbm.total,
            applied: manualCbm !== '' ? parseInt(manualCbm) : Math.round(calculatedCbm.total)
          }
        }}
      />

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© 2026 수입 원가 계산기 - 실시간 환율 및 비용 분석 도구</p>
          <div className="flex items-center gap-4">
            <p>API 키 없이도 수동 환율 입력으로 모든 기능 사용이 가능합니다.</p>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>시스템 정상 작동 중</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;