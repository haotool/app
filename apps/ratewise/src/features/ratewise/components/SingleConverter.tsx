import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { RefreshCw, Calculator } from 'lucide-react';
import { CURRENCY_DEFINITIONS, CURRENCY_QUICK_AMOUNTS } from '../constants';
import type { CurrencyCode, RateType } from '../types';
// [fix:2025-12-24] Lazy load MiniTrendChart 減少初始 JS 載入量
// lightweight-charts (144KB) 和 motion (40KB) 只在展開趨勢圖時載入
const MiniTrendChart = lazy(() =>
  import('./MiniTrendChart').then((m) => ({ default: m.MiniTrendChart })),
);
import type { MiniTrendDataPoint } from './MiniTrendChart';
import { TrendChartSkeleton } from './TrendChartSkeleton';
import type { RateDetails } from '../hooks/useExchangeRates';
import {
  fetchHistoricalRatesRange,
  fetchLatestRates,
} from '../../../services/exchangeRateHistoryService';
import { formatExchangeRate, formatAmountDisplay } from '../../../utils/currencyFormatter';
// [fix:2025-12-24] Lazy load CalculatorKeyboard - 只在用戶點擊計算機按鈕時載入
const CalculatorKeyboard = lazy(() =>
  import('../../calculator/components/CalculatorKeyboard').then((m) => ({
    default: m.CalculatorKeyboard,
  })),
);
import { logger } from '../../../utils/logger';
import { getExchangeRate } from '../../../utils/exchangeRateCalculation';
import { useCalculatorModal } from '../hooks/useCalculatorModal';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];
const MAX_TREND_DAYS = 30;

interface SingleConverterProps {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: string;
  toAmount: string;
  exchangeRates: Record<CurrencyCode, number | null>;
  details?: Record<string, RateDetails>;
  rateType: RateType;
  onFromCurrencyChange: (currency: CurrencyCode) => void;
  onToCurrencyChange: (currency: CurrencyCode) => void;
  onFromAmountChange: (amount: string) => void;
  onToAmountChange: (amount: string) => void;
  onQuickAmount: (amount: number) => void;
  onSwapCurrencies: () => void;
  onAddToHistory: () => void;
  onRateTypeChange: (type: RateType) => void;
}

export const SingleConverter = ({
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  exchangeRates,
  details,
  rateType,
  onFromCurrencyChange,
  onToCurrencyChange,
  onFromAmountChange,
  onToAmountChange,
  onQuickAmount,
  onSwapCurrencies,
  onAddToHistory,
  onRateTypeChange,
}: SingleConverterProps) => {
  const [trendData, setTrendData] = useState<MiniTrendDataPoint[]>([]);
  const [_loadingTrend, setLoadingTrend] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const swapButtonRef = useRef<HTMLButtonElement>(null);

  // 追蹤正在編輯的輸入框（使用未格式化的值）
  const [editingField, setEditingField] = useState<'from' | 'to' | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // 計算機鍵盤狀態（使用統一的 Hook）
  const calculator = useCalculatorModal<'from' | 'to'>({
    onConfirm: (field, result) => {
      if (field === 'from') {
        onFromAmountChange(result.toString());
      } else {
        onToAmountChange(result.toString());
      }
    },
    getInitialValue: (field) => {
      // 使用當前輸入框的實際值，如果為空或無效則使用 0
      const value = field === 'from' ? fromAmount : toAmount;
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    },
  });

  // 獲取指定貨幣的匯率（優先使用 details + rateType，有 fallback 機制）
  const getRate = (currency: CurrencyCode): number => {
    return getExchangeRate(currency, details, rateType, exchangeRates) ?? 1;
  };

  const fromRate = getRate(fromCurrency);
  const toRate = getRate(toCurrency);
  const exchangeRate = fromRate / toRate;
  const reverseRate = toRate / fromRate;

  // 趨勢圖進場動畫
  useEffect(() => {
    const timer = setTimeout(() => setShowTrend(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 處理交換按鈕點擊
  const handleSwap = () => {
    setIsSwapping(true);
    onSwapCurrencies();

    // 觸覺反饋（如果支援）
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // 重置動畫狀態
  useEffect(() => {
    if (!isSwapping) return;

    const timer = setTimeout(() => setIsSwapping(false), 600);
    return () => clearTimeout(timer);
  }, [isSwapping]);

  // 獲取當前目標貨幣的快速金額選項
  const quickAmounts = CURRENCY_QUICK_AMOUNTS[toCurrency] || CURRENCY_QUICK_AMOUNTS.TWD;

  // Load historical data for trend chart (並行獲取優化)
  useEffect(() => {
    // Skip in test environment (avoid window is not defined error)
    if (typeof window === 'undefined') {
      return;
    }

    let isMounted = true;

    async function loadTrend() {
      try {
        if (!isMounted) return;
        setLoadingTrend(true);
        const [historicalData, latestRates] = await Promise.all([
          fetchHistoricalRatesRange(MAX_TREND_DAYS),
          fetchLatestRates().catch(() => null),
        ]);

        if (!isMounted) return;

        const historyPoints: MiniTrendDataPoint[] = historicalData
          .map((item) => {
            const fromRate = item.data.rates[fromCurrency] ?? 1;
            const toRate = item.data.rates[toCurrency] ?? 1;
            const rate = fromRate / toRate;

            return {
              date: item.date, // Keep full YYYY-MM-DD format for lightweight-charts
              rate,
            };
          })
          .filter((item): item is MiniTrendDataPoint => item !== null)
          .reverse();

        // 整合即時匯率到歷史數據
        let mergedPoints = historyPoints;

        if (latestRates) {
          const latestFromRate = latestRates.rates[fromCurrency] ?? 1;
          const latestToRate = latestRates.rates[toCurrency] ?? 1;
          const latestRate = latestFromRate / latestToRate;

          if (Number.isFinite(latestRate) && latestRate > 0) {
            // 提取日期並轉換為 YYYY-MM-DD 格式
            const latestDate =
              latestRates.updateTime?.split(/\s+/)[0]?.replace(/\//g, '-') ??
              new Date().toISOString().slice(0, 10);

            // 去重：過濾掉相同日期的歷史數據，添加最新數據點
            mergedPoints = [
              ...historyPoints.filter((point) => point.date !== latestDate),
              { date: latestDate, rate: latestRate },
            ];
          }
        }

        // 按日期排序並限制最多30天
        const sortedPoints = mergedPoints.sort((a, b) => a.date.localeCompare(b.date));
        setTrendData(sortedPoints.slice(-MAX_TREND_DAYS));
      } catch {
        if (!isMounted) return;
        setTrendData([]);
      } finally {
        if (isMounted) {
          setLoadingTrend(false);
        }
      }
    }

    void loadTrend();

    return () => {
      isMounted = false;
    };
  }, [fromCurrency, toCurrency]);

  // 開發工具：強制觸發骨架屏效果（僅開發模式）
  /* v8 ignore next 22 */
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;

    let originalData: MiniTrendDataPoint[] = [];

    interface WindowWithDevTools extends Window {
      triggerSkeleton?: (duration?: number) => void;
    }

    (window as WindowWithDevTools).triggerSkeleton = (duration = 3000) => {
      logger.debug('Triggering skeleton screen', { duration });
      originalData = trendData;
      setTrendData([]);

      setTimeout(() => {
        logger.debug('Restoring trend data');
        setTrendData(originalData);
      }, duration);
    };

    return () => {
      delete (window as WindowWithDevTools).triggerSkeleton;
    };
  }, [trendData]);

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
          轉換金額
        </label>
        <div className="relative">
          <select
            value={fromCurrency}
            onChange={(e) => onFromCurrencyChange(e.target.value as CurrencyCode)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-neutral-light rounded-lg px-2 py-1.5 text-base font-semibold border-none focus:outline-none focus:ring-2 focus:ring-primary-ring"
            aria-label="選擇來源貨幣"
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_DEFINITIONS[code].flag} {code}
              </option>
            ))}
          </select>
          <input
            ref={fromInputRef}
            type="text"
            inputMode="decimal"
            data-testid="amount-input"
            value={
              editingField === 'from' ? editingValue : formatAmountDisplay(fromAmount, fromCurrency)
            }
            onFocus={() => {
              setEditingField('from');
              setEditingValue(fromAmount);
            }}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d.]/g, '');
              const parts = cleaned.split('.');
              const validValue =
                parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
              setEditingValue(validValue);
              onFromAmountChange(validValue);
            }}
            onBlur={() => {
              onFromAmountChange(editingValue);
              setEditingField(null);
              setEditingValue('');
            }}
            onKeyDown={(e) => {
              const allowedKeys = [
                'Backspace',
                'Delete',
                'ArrowLeft',
                'ArrowRight',
                'ArrowUp',
                'ArrowDown',
                'Home',
                'End',
                'Tab',
                '.',
              ];
              const isNumber = /^[0-9]$/.test(e.key);
              const isModifierKey = e.ctrlKey || e.metaKey;
              if (!isNumber && !allowedKeys.includes(e.key) && !isModifierKey) {
                e.preventDefault();
              }
            }}
            className="w-full pl-32 pr-14 py-3 text-2xl font-bold border-2 border-neutral rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300"
            placeholder="0.00"
            aria-label={`轉換金額 (${fromCurrency})`}
          />
          {/* 計算機按鈕 */}
          <button
            type="button"
            onClick={() => {
              calculator.openCalculator('from');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-primary-dark hover:bg-primary-bg rounded-lg transition-all duration-200"
            aria-label="開啟計算機 (轉換金額)"
            data-testid="calculator-trigger-from"
          >
            <Calculator className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {(CURRENCY_QUICK_AMOUNTS[fromCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map((amount) => (
            <button
              key={amount}
              onClick={() => {
                onQuickAmount(amount);
                // 觸覺反饋
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className="px-3 py-1 bg-neutral-light hover:bg-primary-light active:bg-primary-hover rounded-lg text-sm font-medium transition-all duration-200 transform active:scale-95 hover:scale-105 hover:shadow-md"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center mb-4">
        {/* 匯率卡片 - 懸停效果 - 移除 overflow-hidden 避免遮蔽 tooltip */}
        <div className="relative bg-gradient-to-r from-primary-light to-primary-hover rounded-xl mb-3 w-full group cursor-pointer hover:shadow-xl transition-all duration-500">
          {/* 光澤效果 */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl" />

          {/* 匯率資訊區塊 - 包含切換按鈕和匯率顯示 */}
          <div className="relative text-center pt-12 pb-6 px-4 flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-[1.02] rounded-t-xl overflow-hidden">
            {/* 匯率類型切換按鈕 - 融合背景漸層的玻璃擬態設計 */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 inline-flex bg-gradient-to-r from-primary-bg/95 to-primary-bg/95 backdrop-blur-md rounded-full p-0.5 shadow-lg border border-white/40">
              <button
                onClick={() => onRateTypeChange('spot')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                  rateType === 'spot'
                    ? 'bg-brand-button-to hover:bg-brand-button-hover-to text-white shadow-md scale-105'
                    : 'text-brand-button-to/80 hover:text-brand-button-to hover:bg-brand-button-to/10'
                }`}
                aria-label="切換到即期匯率"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span>即期</span>
              </button>
              <button
                onClick={() => onRateTypeChange('cash')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                  rateType === 'cash'
                    ? 'bg-brand-button-from hover:bg-brand-button-hover-from text-white shadow-md scale-105'
                    : 'text-brand-button-from/80 hover:text-brand-button-from hover:bg-brand-button-from/10'
                }`}
                aria-label="切換到現金匯率"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>現金</span>
              </button>
            </div>

            {/* 匯率顯示 */}
            <div className="w-full">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-text to-brand-text-dark mb-2 transition-all duration-300 group-hover:scale-105">
                1 {fromCurrency} = {formatExchangeRate(exchangeRate)} {toCurrency}
              </div>
              <div className="text-sm text-neutral-text-secondary font-semibold opacity-80 group-hover:opacity-95 transition-opacity">
                1 {toCurrency} = {formatExchangeRate(reverseRate)} {fromCurrency}
              </div>
            </div>
          </div>

          {/* 滿版趨勢圖 - 下半部 - 懸停放大 + 進場動畫 */}
          <div
            className={`relative w-full h-20 transition-all duration-500 group-hover:h-24 overflow-hidden rounded-b-xl ${
              showTrend ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
              <ErrorBoundary
                fallback={
                  <div className="flex items-center justify-center h-full text-xs text-danger">
                    趨勢圖載入失敗
                  </div>
                }
                onError={(error) => {
                  logger.error('MiniTrendChart loading failed', error);
                }}
              >
                {trendData.length === 0 ? (
                  <TrendChartSkeleton />
                ) : (
                  <Suspense fallback={<TrendChartSkeleton />}>
                    <MiniTrendChart data={trendData} currencyCode={toCurrency} />
                  </Suspense>
                )}
              </ErrorBoundary>
            </div>
            {/* 互動提示 */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-1 pointer-events-none">
              <span className="text-[10px] font-semibold text-neutral-text-secondary">
                查看趨勢圖
              </span>
            </div>
          </div>
        </div>

        {/* 轉換按鈕 - 高級微互動 */}
        <div className="relative group/swap">
          {/* 外圍光環 */}
          <div
            className={`absolute -inset-1 bg-gradient-to-r from-primary-light via-primary-hover to-primary-light rounded-full blur-md transition-all duration-500 ${
              isSwapping ? 'opacity-60 scale-125' : 'opacity-0 group-hover/swap:opacity-30'
            } animate-pulse`}
          />

          {/* 按鈕本體 */}
          <button
            ref={swapButtonRef}
            onClick={handleSwap}
            className={`relative p-3 bg-gradient-to-r from-brand-button-from to-brand-button-to hover:from-brand-button-hover-from hover:to-brand-button-hover-to text-white rounded-full shadow-lg transition-all duration-500 transform hover:scale-110 active:scale-95 group-hover/swap:shadow-2xl ${
              isSwapping ? 'scale-95' : ''
            }`}
            aria-label="交換幣別"
            title="交換幣別"
            disabled={isSwapping}
          >
            {/* 背景脈動效果 */}
            <div
              className={`absolute inset-0 rounded-full bg-white transition-opacity duration-300 ${
                isSwapping ? 'opacity-30' : 'opacity-0 group-hover/swap:opacity-20'
              } animate-ping`}
            />

            {/* 圖示 - 點擊旋轉 */}
            <RefreshCw
              size={20}
              className={`relative z-10 transition-all duration-600 ${
                isSwapping ? 'rotate-180' : 'group-hover/swap:rotate-180'
              }`}
              style={{
                transform: isSwapping ? 'rotate(180deg)' : undefined,
              }}
            />

            {/* 點擊漣漪效果 */}
            <span
              className={`absolute inset-0 rounded-full bg-white transition-opacity duration-300 ${
                isSwapping ? 'opacity-30 animate-ping' : 'opacity-0'
              }`}
            />
          </button>

          {/* 懸停提示 */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/swap:opacity-100 transition-all duration-300 pointer-events-none">
            <span className="text-xs font-medium text-neutral-text-secondary whitespace-nowrap bg-white px-2 py-1 rounded-full shadow-md">
              點擊交換
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
          轉換結果
        </label>
        <div className="relative">
          <select
            value={toCurrency}
            onChange={(e) => onToCurrencyChange(e.target.value as CurrencyCode)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-neutral-light rounded-lg px-2 py-1.5 text-base font-semibold border-none focus:outline-none focus:ring-2 focus:ring-primary-ring"
            aria-label="選擇目標貨幣"
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_DEFINITIONS[code].flag} {code}
              </option>
            ))}
          </select>
          <input
            ref={toInputRef}
            type="text"
            inputMode="decimal"
            value={editingField === 'to' ? editingValue : formatAmountDisplay(toAmount, toCurrency)}
            onFocus={() => {
              setEditingField('to');
              setEditingValue(toAmount);
            }}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d.]/g, '');
              const parts = cleaned.split('.');
              const validValue =
                parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
              setEditingValue(validValue);
              onToAmountChange(validValue);
            }}
            onBlur={() => {
              onToAmountChange(editingValue);
              setEditingField(null);
              setEditingValue('');
            }}
            onKeyDown={(e) => {
              const allowedKeys = [
                'Backspace',
                'Delete',
                'ArrowLeft',
                'ArrowRight',
                'ArrowUp',
                'ArrowDown',
                'Home',
                'End',
                'Tab',
                '.',
              ];
              const isNumber = /^[0-9]$/.test(e.key);
              const isModifierKey = e.ctrlKey || e.metaKey;
              if (!isNumber && !allowedKeys.includes(e.key) && !isModifierKey) {
                e.preventDefault();
              }
            }}
            className="w-full pl-32 pr-14 py-3 text-2xl font-bold border-2 border-primary-hover rounded-2xl bg-primary-bg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300"
            placeholder="0.00"
            aria-label={`轉換結果 (${toCurrency})`}
          />
          {/* 計算機按鈕 */}
          <button
            type="button"
            onClick={() => {
              calculator.openCalculator('to');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-primary-dark hover:bg-primary-bg rounded-lg transition-all duration-200"
            aria-label="開啟計算機 (轉換結果)"
            data-testid="calculator-trigger-to"
          >
            <Calculator className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                // 直接設定目標貨幣金額，不需要轉換
                const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
                onToAmountChange(amount.toFixed(decimals));
                // 觸覺反饋
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className="px-3 py-1 bg-primary-light hover:bg-primary-hover active:bg-primary-active rounded-lg text-sm font-medium transition-all duration-200 transform active:scale-95 hover:scale-105 hover:shadow-md"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onAddToHistory}
        className="w-full py-3 bg-gradient-to-r from-brand-button-from to-brand-button-to hover:from-brand-button-hover-from hover:to-brand-button-hover-to text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
      >
        加入歷史記錄
      </button>

      {/* 計算機鍵盤 Bottom Sheet */}
      {/* [fix:2025-12-25] 始終渲染 CalculatorKeyboard，讓彩蛋在計算機關閉後仍可顯示 */}
      <Suspense fallback={null}>
        <CalculatorKeyboard
          isOpen={calculator.isOpen}
          onClose={calculator.closeCalculator}
          onConfirm={calculator.handleConfirm}
          initialValue={calculator.initialValue}
        />
      </Suspense>
    </>
  );
};
