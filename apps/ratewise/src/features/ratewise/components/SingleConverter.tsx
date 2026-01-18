import { useState, useEffect, lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { RefreshCw } from 'lucide-react';
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
import { formatAmountDisplay } from '../../../utils/currencyFormatter';
// [fix:2025-12-24] Lazy load CalculatorKeyboard - 只在用戶點擊計算機按鈕時載入
const CalculatorKeyboard = lazy(() =>
  import('../../calculator/components/CalculatorKeyboard').then((m) => ({
    default: m.CalculatorKeyboard,
  })),
);
import { logger } from '../../../utils/logger';
import { getExchangeRate } from '../../../utils/exchangeRateCalculation';
import { useCalculatorModal } from '../hooks/useCalculatorModal';
// 新的 UI 元件
import { CurrencyInput, QuickAmountButtons } from '../../../components/ui';
import { RateDisplayCard } from '../../../components/ui';

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

// 轉換貨幣定義為 CurrencyInput 所需格式
const currencyOptions = CURRENCY_CODES.map((code) => ({
  code,
  flag: CURRENCY_DEFINITIONS[code].flag,
  name: CURRENCY_DEFINITIONS[code].name,
}));

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
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTrend, setShowTrend] = useState(false);

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

  // 獲取當前貨幣的快速金額選項
  const fromQuickAmounts = CURRENCY_QUICK_AMOUNTS[fromCurrency] || CURRENCY_QUICK_AMOUNTS.TWD;
  const toQuickAmounts = CURRENCY_QUICK_AMOUNTS[toCurrency] || CURRENCY_QUICK_AMOUNTS.TWD;

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
            const fromRateVal = item.data.rates[fromCurrency] ?? 1;
            const toRateVal = item.data.rates[toCurrency] ?? 1;
            const rate = fromRateVal / toRateVal;

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

  // 趨勢圖渲染
  const renderTrendChart = () => (
    <div
      className={`w-full h-full transition-all duration-500 ${
        showTrend ? 'opacity-100' : 'opacity-0'
      }`}
    >
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
  );

  return (
    <>
      {/* 來源貨幣輸入 */}
      <div className="mb-4">
        <CurrencyInput
          label="轉換金額"
          currency={fromCurrency}
          value={fromAmount}
          onChange={onFromAmountChange}
          onCurrencyChange={(code) => onFromCurrencyChange(code as CurrencyCode)}
          currencies={currencyOptions}
          displayValue={formatAmountDisplay(fromAmount, fromCurrency)}
          onOpenCalculator={() => calculator.openCalculator('from')}
          aria-label={`轉換金額 (${fromCurrency})`}
          selectAriaLabel="選擇來源貨幣"
          calculatorAriaLabel="開啟計算機 (轉換金額)"
          data-testid="amount-input"
          calculatorTestId="calculator-trigger-from"
        />
        <QuickAmountButtons amounts={fromQuickAmounts} onSelect={onQuickAmount} />
      </div>

      {/* 匯率顯示卡片 + 交換按鈕 */}
      <div className="flex flex-col items-center mb-4">
        {/* 匯率卡片（含趨勢圖） */}
        <RateDisplayCard
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          rate={exchangeRate}
          reverseRate={reverseRate}
          rateType={rateType}
          onRateTypeChange={onRateTypeChange}
          trendChart={renderTrendChart()}
          isLoadingTrend={loadingTrend}
          className="mb-3"
        />

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

      {/* 目標貨幣輸入 */}
      <div className="mb-4">
        <CurrencyInput
          label="轉換結果"
          currency={toCurrency}
          value={toAmount}
          onChange={onToAmountChange}
          onCurrencyChange={(code) => onToCurrencyChange(code as CurrencyCode)}
          currencies={currencyOptions}
          displayValue={formatAmountDisplay(toAmount, toCurrency)}
          variant="highlighted"
          onOpenCalculator={() => calculator.openCalculator('to')}
          aria-label={`轉換結果 (${toCurrency})`}
          selectAriaLabel="選擇目標貨幣"
          calculatorAriaLabel="開啟計算機 (轉換結果)"
          calculatorTestId="calculator-trigger-to"
        />
        <QuickAmountButtons
          amounts={toQuickAmounts}
          onSelect={(amount) => {
            // 直接設定目標貨幣金額，不需要轉換
            const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
            onToAmountChange(amount.toFixed(decimals));
          }}
          variant="primary"
        />
      </div>

      {/* 加入歷史記錄按鈕 */}
      <button
        onClick={onAddToHistory}
        className="w-full py-3 bg-gradient-to-r from-brand-button-from to-brand-button-to hover:from-brand-button-hover-from hover:to-brand-button-hover-to text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
        style={{
          minHeight: 'var(--touch-target-min, 44px)',
        }}
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
