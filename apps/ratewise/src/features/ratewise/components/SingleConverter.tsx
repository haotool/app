/**
 * SingleConverter - Primary currency conversion interface
 *
 * Features:
 * - Real-time exchange rate display with trend visualization
 * - Bidirectional currency input with calculator support
 * - Quick amount selection buttons
 * - Spot/Cash rate toggle
 * - Swap currencies with haptic feedback
 *
 * @module features/ratewise/components/SingleConverter
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { RefreshCw } from 'lucide-react';
import { CURRENCY_DEFINITIONS, CURRENCY_QUICK_AMOUNTS } from '../constants';
import type { CurrencyCode, RateType } from '../types';

// Lazy load MiniTrendChart to reduce initial bundle size
// lightweight-charts (144KB) and motion (40KB) load on-demand
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

// Lazy load CalculatorKeyboard - only loads when user opens calculator
const CalculatorKeyboard = lazy(() =>
  import('../../calculator/components/CalculatorKeyboard').then((m) => ({
    default: m.CalculatorKeyboard,
  })),
);
import { logger } from '../../../utils/logger';
import { getExchangeRate } from '../../../utils/exchangeRateCalculation';
import { useCalculatorModal } from '../hooks/useCalculatorModal';
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

// Transform currency definitions to CurrencyInput format
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

  // Calculator keyboard state using unified hook
  const calculator = useCalculatorModal<'from' | 'to'>({
    onConfirm: (field, result) => {
      if (field === 'from') {
        onFromAmountChange(result.toString());
      } else {
        onToAmountChange(result.toString());
      }
    },
    getInitialValue: (field) => {
      // Use current input value, default to 0 if empty or invalid
      const value = field === 'from' ? fromAmount : toAmount;
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    },
  });

  // Get exchange rate for currency (uses details + rateType with fallback)
  const getRate = (currency: CurrencyCode): number => {
    return getExchangeRate(currency, details, rateType, exchangeRates) ?? 1;
  };

  const fromRate = getRate(fromCurrency);
  const toRate = getRate(toCurrency);
  const exchangeRate = fromRate / toRate;
  const reverseRate = toRate / fromRate;

  // Trend chart fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowTrend(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Handle currency swap button click
  const handleSwap = () => {
    setIsSwapping(true);
    onSwapCurrencies();

    // Haptic feedback if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // Reset swap animation state
  useEffect(() => {
    if (!isSwapping) return;

    const timer = setTimeout(() => setIsSwapping(false), 600);
    return () => clearTimeout(timer);
  }, [isSwapping]);

  // Get quick amount presets for current currencies
  const fromQuickAmounts = CURRENCY_QUICK_AMOUNTS[fromCurrency] || CURRENCY_QUICK_AMOUNTS.TWD;
  const toQuickAmounts = CURRENCY_QUICK_AMOUNTS[toCurrency] || CURRENCY_QUICK_AMOUNTS.TWD;

  // Load historical data for trend chart (parallel fetch optimization)
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

        // Merge latest rates with historical data
        let mergedPoints = historyPoints;

        if (latestRates) {
          const latestFromRate = latestRates.rates[fromCurrency] ?? 1;
          const latestToRate = latestRates.rates[toCurrency] ?? 1;
          const latestRate = latestFromRate / latestToRate;

          if (Number.isFinite(latestRate) && latestRate > 0) {
            // Extract date and convert to YYYY-MM-DD format
            const latestDate =
              latestRates.updateTime?.split(/\s+/)[0]?.replace(/\//g, '-') ??
              new Date().toISOString().slice(0, 10);

            // Deduplicate: filter out historical data with same date, add latest point
            mergedPoints = [
              ...historyPoints.filter((point) => point.date !== latestDate),
              { date: latestDate, rate: latestRate },
            ];
          }
        }

        // Sort by date and limit to 30 days
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

  // Dev tools: Force trigger skeleton screen effect (dev mode only)
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

  // Render trend chart with loading states
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
      {/* Source currency input */}
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

      {/* Rate display card with swap button */}
      <div className="flex flex-col items-center mb-4">
        {/* Rate card with integrated trend chart */}
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

        {/* Swap button with advanced micro-interactions */}
        <div className="relative group/swap">
          {/* Outer glow ring */}
          <div
            className={`absolute -inset-1 bg-gradient-to-r from-primary-light via-primary-hover to-primary-light rounded-full blur-md transition-all duration-500 ${
              isSwapping ? 'opacity-60 scale-125' : 'opacity-0 group-hover/swap:opacity-30'
            } animate-pulse`}
          />

          {/* Button element */}
          <button
            onClick={handleSwap}
            className={`relative p-3 bg-gradient-to-r from-brand-button-from to-brand-button-to hover:from-brand-button-hover-from hover:to-brand-button-hover-to text-white rounded-full shadow-lg transition-all duration-500 transform hover:scale-110 active:scale-95 group-hover/swap:shadow-2xl ${
              isSwapping ? 'scale-95' : ''
            }`}
            aria-label="交換幣別"
            title="交換幣別"
            disabled={isSwapping}
          >
            {/* Background pulse effect */}
            <div
              className={`absolute inset-0 rounded-full bg-white transition-opacity duration-300 ${
                isSwapping ? 'opacity-30' : 'opacity-0 group-hover/swap:opacity-20'
              } animate-ping`}
            />

            {/* Icon with rotation animation */}
            <RefreshCw
              size={20}
              className={`relative z-10 transition-all duration-600 ${
                isSwapping ? 'rotate-180' : 'group-hover/swap:rotate-180'
              }`}
              style={{
                transform: isSwapping ? 'rotate(180deg)' : undefined,
              }}
            />

            {/* Click ripple effect */}
            <span
              className={`absolute inset-0 rounded-full bg-white transition-opacity duration-300 ${
                isSwapping ? 'opacity-30 animate-ping' : 'opacity-0'
              }`}
            />
          </button>

          {/* Hover tooltip */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/swap:opacity-100 transition-all duration-300 pointer-events-none">
            <span className="text-xs font-medium text-neutral-text-secondary whitespace-nowrap bg-white px-2 py-1 rounded-full shadow-md">
              Click to swap
            </span>
          </div>
        </div>
      </div>

      {/* Target currency input */}
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
            // Set target amount directly without conversion
            const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
            onToAmountChange(amount.toFixed(decimals));
          }}
          variant="primary"
        />
      </div>

      {/* Add to history button */}
      <button
        onClick={onAddToHistory}
        className="w-full py-3 bg-gradient-to-r from-brand-button-from to-brand-button-to hover:from-brand-button-hover-from hover:to-brand-button-hover-to text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
        style={{
          minHeight: 'var(--touch-target-min, 44px)',
        }}
      >
        加入歷史記錄
      </button>

      {/* Calculator keyboard bottom sheet */}
      {/* Always render CalculatorKeyboard to allow easter eggs after close */}
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
