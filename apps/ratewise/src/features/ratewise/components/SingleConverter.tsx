import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { RefreshCw, Calculator } from 'lucide-react';
import { CURRENCY_DEFINITIONS, CURRENCY_QUICK_AMOUNTS } from '../constants';
import type { CurrencyCode, RateType } from '../types';
// Lazy load MiniTrendChart to reduce initial bundle size
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
// Lazy load CalculatorKeyboard on demand
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
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 text-text rounded-lg px-2 py-1.5 text-base font-semibold border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
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
            className="w-full pl-32 pr-14 py-3 text-2xl font-bold bg-surface border-2 border-border/60 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-[border-color,box-shadow] duration-300"
            placeholder="0.00"
            aria-label={`轉換金額 (${fromCurrency})`}
          />
          {/* 計算機按鈕 */}
          <button
            type="button"
            onClick={() => {
              calculator.openCalculator('from');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-primary-dark hover:bg-primary-bg rounded-lg transition-colors duration-200"
            aria-label="開啟計算機 (轉換金額)"
            data-testid="calculator-trigger-from"
          >
            <Calculator aria-hidden="true" className="w-5 h-5" />
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
              className="px-3 py-1 bg-neutral-light hover:bg-primary-light active:bg-primary-hover rounded-lg text-sm font-medium transition-[background-color,transform,box-shadow] duration-200 transform active:scale-95 hover:scale-105 hover:shadow-md"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center mb-4">
        {/* 匯率卡片 - 一體化設計，無切分感 */}
        {/* [fix:2026-01-21] 統一背景色 + 從上到下微漸層，消除上下區塊視覺切分 */}
        <div className="relative bg-gradient-to-b from-surface-card to-surface-elevated rounded-xl mb-3 w-full group cursor-pointer hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-primary/30">
          {/* 微光效果 - 極淺的漸層覆蓋 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl" />

          {/* 匯率資訊區塊 - 透明背景繼承父元素漸層 */}
          <div className="relative text-center pt-12 pb-6 px-4 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-[1.02] rounded-t-xl overflow-hidden">
            {/* 匯率類型切換按鈕 - 現代化玻璃擬態設計 */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 inline-flex bg-background/80 backdrop-blur-md rounded-full p-0.5 shadow-sm border border-border/60">
              <button
                onClick={() => onRateTypeChange('spot')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-300 ${
                  rateType === 'spot'
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'text-text/70 hover:text-text hover:bg-primary/10'
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
              {/* [fix:2026-01-20] 現金按鈕使用 primary 色保持一致，提升文字對比度 */}
              <button
                onClick={() => onRateTypeChange('cash')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-300 ${
                  rateType === 'cash'
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'text-text/70 hover:text-text hover:bg-primary/10'
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

            {/* 匯率顯示 - 使用 SSOT text 色 */}
            <div className="w-full">
              <div className="text-2xl font-bold tabular-nums text-text mb-2 transition-transform duration-300 group-hover:scale-105">
                1 {fromCurrency} = {formatExchangeRate(exchangeRate)} {toCurrency}
              </div>
              <div className="text-sm tabular-nums text-text-muted font-semibold opacity-80 group-hover:opacity-95 transition-opacity">
                1 {toCurrency} = {formatExchangeRate(reverseRate)} {fromCurrency}
              </div>
            </div>
          </div>

          {/* 滿版趨勢圖 - 無獨立背景，繼承父元素漸層實現一體化 */}
          {/* [fix:2026-01-21] 移除 bg-surface-elevated，讓上下區塊成為無縫整體 */}
          <div
            className={`relative w-full h-20 transition-[height,opacity,transform] duration-500 will-change-[height,opacity,transform] group-hover:h-24 overflow-hidden rounded-b-xl ${
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
            {/* 互動提示 - 與整體漸層融合 */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface-elevated/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-1 pointer-events-none">
              <span className="text-[10px] font-semibold text-text-muted">查看趨勢圖</span>
            </div>
          </div>
        </div>

        {/* 轉換按鈕 - 高級微互動 */}
        <div className="relative group/swap">
          {/* 外圍光環 */}
          <div
            className={`absolute -inset-1 bg-gradient-to-r from-primary-light via-primary-hover to-primary-light rounded-full blur-md transition-[opacity,transform] duration-500 ${
              isSwapping ? 'opacity-60 scale-125' : 'opacity-0 group-hover/swap:opacity-30'
            } animate-pulse motion-reduce:animate-none`}
          />

          {/* 按鈕本體 - [fix:2026-01-20] 使用 SSOT primary token */}
          <button
            ref={swapButtonRef}
            onClick={handleSwap}
            className={`relative p-3 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg transition-all duration-500 transform hover:scale-110 active:scale-95 group-hover/swap:shadow-2xl ${
              isSwapping ? 'scale-95' : ''
            }`}
            aria-label="交換幣別"
            title="交換幣別"
            disabled={isSwapping}
          >
            {/* 背景脈動效果 - SSOT surface 色 */}
            <div
              className={`absolute inset-0 rounded-full bg-surface transition-opacity duration-300 ${
                isSwapping ? 'opacity-30' : 'opacity-0 group-hover/swap:opacity-20'
              } animate-ping motion-reduce:animate-none`}
            />

            {/* 圖示 - 點擊旋轉 */}
            <RefreshCw
              aria-hidden="true"
              size={20}
              className={`relative z-10 transition-transform duration-600 ${
                isSwapping ? 'rotate-180' : 'group-hover/swap:rotate-180'
              }`}
            />

            {/* 點擊漣漪效果 - SSOT surface 色 */}
            <span
              className={`absolute inset-0 rounded-full bg-surface transition-opacity duration-300 ${
                isSwapping ? 'opacity-30 animate-ping motion-reduce:animate-none' : 'opacity-0'
              }`}
            />
          </button>

          {/* 懸停提示 - SSOT surface 色 */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/swap:opacity-100 transition-all duration-300 pointer-events-none">
            <span className="text-xs font-medium text-neutral-text-secondary whitespace-nowrap bg-surface px-2 py-1 rounded-full shadow-md">
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
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 text-text rounded-lg px-2 py-1.5 text-base font-semibold border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
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
            className="w-full pl-32 pr-14 py-3 text-2xl font-bold bg-primary-bg/30 border-2 border-primary/30 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-[border-color,box-shadow] duration-300"
            placeholder="0.00"
            aria-label={`轉換結果 (${toCurrency})`}
          />
          {/* 計算機按鈕 */}
          <button
            type="button"
            onClick={() => {
              calculator.openCalculator('to');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-primary-dark hover:bg-primary-bg rounded-lg transition-colors duration-200"
            aria-label="開啟計算機 (轉換結果)"
            data-testid="calculator-trigger-to"
          >
            <Calculator aria-hidden="true" className="w-5 h-5" />
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
              className="px-3 py-1 bg-primary-light hover:bg-primary-hover active:bg-primary-active rounded-lg text-sm font-medium transition-[background-color,transform,box-shadow] duration-200 transform active:scale-95 hover:scale-105 hover:shadow-md"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* [fix:2026-01-20] 使用 SSOT primary token */}
      <button
        onClick={onAddToHistory}
        className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
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
