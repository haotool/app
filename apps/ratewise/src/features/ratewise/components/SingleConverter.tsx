/**
 * SingleConverter Component - Single Currency Converter
 * 單幣別轉換器組件
 *
 * @description Single currency converter with inline calculator activation.
 *              Click on the amount input to open the calculator keyboard.
 *              Simplified design without separate calculator buttons.
 *              點擊金額輸入框即可開啟計算機鍵盤。
 *              簡化設計，移除獨立計算機按鈕。
 * @version 2.0.0
 */

import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
// RefreshCw 已替換為自定義雙箭頭 SVG
import { useTranslation } from 'react-i18next';
import {
  CURRENCY_DEFINITIONS,
  CURRENCY_QUICK_AMOUNTS,
  DEFAULT_RATE_MODE,
  DEFAULT_RATE_SOURCE,
} from '../constants';
import type { CurrencyCode, RateMode, RateSource, RateType } from '../types';
// lazy import：ErrorBoundary 已涵蓋載入失敗；chunk 已在 PWA precache manifest 內，離線可用
const MiniTrendChart = lazy(() =>
  import('./MiniTrendChart').then((m) => ({ default: m.MiniTrendChart })),
);
import type { MiniTrendDataPoint } from './MiniTrendChart';
import { TrendChartSkeleton } from './TrendChartSkeleton';
import type { RateDetails } from '../../../utils/offlineStorage';
import {
  fetchHistoricalRatesRange,
  fetchLatestRates,
} from '../../../services/exchangeRateHistoryService';
import { formatExchangeRate, formatAmountDisplay } from '../../../utils/currencyFormatter';
import {
  quickAmountButtonTokens,
  singleConverterLayoutTokens,
} from '../../../config/design-tokens';
// 直接 import 以確保離線冷啟動可用
import { CalculatorKeyboard } from '../../calculator/components/CalculatorKeyboard';
import { logger } from '../../../utils/logger';
import {
  getReciprocalExchangeRate,
  getUnitExchangeRate,
} from '../../../utils/exchangeRateCalculation';
import type { RateTypeAvailability } from '../../../utils/exchangeRateCalculation';
import { useCalculatorModal } from '../hooks/useCalculatorModal';
import { TREND_CHART_DEFER_MS, TREND_CHART_IDLE_TIMEOUT_MS } from '../../../config/performance';
import { RateSelector } from './RateSelector';
import {
  computeConverterRate,
  fetchExchangeShopHistoricalRatesRange,
  type ExchangeShopRate,
} from '../../../services/moneyboxRateService';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];
const MAX_TREND_DAYS = 30;

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKeyFromUpdateTime(updateTime: string | undefined, fallback: string): string {
  const datePart = updateTime?.match(/\d{4}\/\d{2}\/\d{2}/)?.[0];
  return datePart ? datePart.replace(/\//g, '-') : fallback;
}

interface SingleConverterProps {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: string;
  toAmount: string;
  exchangeRates: Record<CurrencyCode, number | null>;
  details?: Record<string, RateDetails>;
  rateType: RateType;
  rateMode?: RateMode;
  rateTypeAvailability?: RateTypeAvailability;
  onFromCurrencyChange: (currency: CurrencyCode) => void;
  onToCurrencyChange: (currency: CurrencyCode) => void;
  onFromAmountChange: (amount: string) => void;
  onToAmountChange: (amount: string) => void;
  onQuickAmount: (amount: number) => void;
  onSwapCurrencies: () => void;
  onAddToHistory: () => void;
  onRateTypeChange: (type: RateType) => void;
  rateSource?: RateSource;
  moneyBoxRate?: ExchangeShopRate | null;
  exchangeShopCurrency?: CurrencyCode | null;
  onRateSourceChange?: (source: RateSource) => void;
}

export const SingleConverter = ({
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  exchangeRates,
  details,
  rateType,
  rateMode = DEFAULT_RATE_MODE,
  rateTypeAvailability = { spot: true, cash: true },
  onFromCurrencyChange,
  onToCurrencyChange,
  onFromAmountChange,
  onToAmountChange,
  onQuickAmount,
  onSwapCurrencies,
  onAddToHistory,
  onRateTypeChange,
  rateSource = DEFAULT_RATE_SOURCE,
  moneyBoxRate = null,
  exchangeShopCurrency = null,
  onRateSourceChange,
}: SingleConverterProps) => {
  const { t } = useTranslation();
  const [trendData, setTrendData] = useState<MiniTrendDataPoint[]>([]);
  const [_loadingTrend, setLoadingTrend] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [trendDateKey, setTrendDateKey] = useState(() => getLocalDateKey());
  const swapButtonRef = useRef<HTMLButtonElement>(null);

  // 輸入框 refs（用於焦點管理）
  const fromInputRef = useRef<HTMLButtonElement>(null);
  const toInputRef = useRef<HTMLButtonElement>(null);

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

  // 匯率卡片與實際換算共用同一套核心。
  const exchangeRate = getUnitExchangeRate(
    fromCurrency,
    toCurrency,
    details,
    rateType,
    rateMode,
    exchangeRates,
    {
      rateSource,
      exchangeShopRate: moneyBoxRate,
    },
  );
  const reverseRate = getReciprocalExchangeRate(exchangeRate);

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

  // 長時間背景分頁回前景時，重新載入趨勢資料，避免停在舊日期。
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshTrendDateKey = () => {
      const currentDateKey = getLocalDateKey();
      setTrendDateKey((previousDateKey) =>
        previousDateKey === currentDateKey ? previousDateKey : currentDateKey,
      );
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) refreshTrendDateKey();
    };

    window.addEventListener('focus', refreshTrendDateKey);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshTrendDateKey);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load historical data for trend chart（使用 requestIdleCallback 等瀏覽器空閒後才載入）
  // 避免 30 筆 JSON 請求在首屏關鍵路徑期間與主要 JS bundle 競爭頻寬
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    async function loadTrend() {
      try {
        if (!isMounted) return;
        setLoadingTrend(true);
        const exchangeShopLatestRate = moneyBoxRate
          ? computeConverterRate(moneyBoxRate, fromCurrency, toCurrency, rateMode)
          : null;
        const shouldUseExchangeShopTrend =
          rateSource === 'exchange-shop' &&
          moneyBoxRate !== null &&
          !!exchangeShopCurrency &&
          exchangeShopLatestRate !== null;

        if (shouldUseExchangeShopTrend) {
          const historicalRates = await fetchExchangeShopHistoricalRatesRange(
            exchangeShopCurrency,
            MAX_TREND_DAYS,
          );

          if (!isMounted) return;

          const historyPoints = historicalRates
            .map(({ date, rate }) => {
              const converterRate = computeConverterRate(rate, fromCurrency, toCurrency, rateMode);
              return converterRate && Number.isFinite(converterRate) && converterRate > 0
                ? { date, rate: converterRate }
                : null;
            })
            .filter((item): item is MiniTrendDataPoint => item !== null)
            .reverse();

          const latestDate = getDateKeyFromUpdateTime(moneyBoxRate.updateTime, trendDateKey);
          const mergedPoints =
            Number.isFinite(exchangeShopLatestRate) && exchangeShopLatestRate > 0
              ? [
                  ...historyPoints.filter((point) => point.date !== latestDate),
                  { date: latestDate, rate: exchangeShopLatestRate },
                ]
              : historyPoints;

          const sortedPoints = mergedPoints.sort((a, b) => a.date.localeCompare(b.date));
          setTrendData(sortedPoints.slice(-MAX_TREND_DAYS));
          return;
        }

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

    // 趨勢圖載入策略：使用 requestIdleCallback 在瀏覽器空閒時載入。
    // 不再使用硬延遲（TREND_CHART_DEFER_MS 已設為 0），符合 web.dev LCP 優化建議。
    // idle timeout 確保最多等待 TREND_CHART_IDLE_TIMEOUT_MS 後強制開始載入。
    type IdleHandle = number | ReturnType<typeof setTimeout>;
    let idleHandle: IdleHandle | null = null;

    const startLoading = () => {
      if (isMounted) void loadTrend();
    };

    // 若有額外 defer（舊版相容或測試用），先等待
    if (TREND_CHART_DEFER_MS > 0) {
      const deferHandle = setTimeout(() => {
        if (typeof requestIdleCallback === 'function') {
          idleHandle = requestIdleCallback(startLoading, { timeout: TREND_CHART_IDLE_TIMEOUT_MS });
        } else {
          idleHandle = setTimeout(startLoading, TREND_CHART_IDLE_TIMEOUT_MS);
        }
      }, TREND_CHART_DEFER_MS);

      return () => {
        isMounted = false;
        clearTimeout(deferHandle);
        if (typeof cancelIdleCallback === 'function' && idleHandle !== null) {
          cancelIdleCallback(idleHandle as number);
        } else if (idleHandle !== null) {
          clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
        }
      };
    }

    // 預設行為：直接使用 requestIdleCallback（推薦）
    if (typeof requestIdleCallback === 'function') {
      idleHandle = requestIdleCallback(startLoading, { timeout: TREND_CHART_IDLE_TIMEOUT_MS });
    } else {
      // Safari fallback：短暫延遲後執行
      idleHandle = setTimeout(startLoading, 100);
    }

    return () => {
      isMounted = false;
      if (typeof cancelIdleCallback === 'function' && idleHandle !== null) {
        cancelIdleCallback(idleHandle as number);
      } else if (idleHandle !== null) {
        clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
      }
    };
  }, [
    fromCurrency,
    toCurrency,
    trendDateKey,
    rateSource,
    rateMode,
    moneyBoxRate,
    exchangeShopCurrency,
  ]);

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
      <div className={singleConverterLayoutTokens.section.className}>
        <label
          className={`block text-sm font-medium text-neutral-text-secondary ${singleConverterLayoutTokens.label.className}`}
        >
          {t('singleConverter.fromAmount')}
        </label>
        <div className="relative">
          <select
            value={fromCurrency}
            onChange={(e) => onFromCurrencyChange(e.target.value as CurrencyCode)}
            className="absolute left-3 top-1/2 min-h-11 -translate-y-1/2 rounded-control border border-border/80 bg-surface-elevated px-2 py-2 text-base font-semibold text-text shadow-soft transition-[border-color,box-shadow,color,background-color] duration-200 focus:outline-none focus:ring-2 focus:ring-primary/25"
            aria-label={t('singleConverter.selectFromCurrency')}
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_DEFINITIONS[code].flag} {code}
              </option>
            ))}
          </select>
          {/* 金額輸入框 - 點擊開啟計算機鍵盤 */}
          <button
            type="button"
            ref={fromInputRef}
            data-testid="amount-input"
            onClick={() => calculator.openCalculator('from')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                calculator.openCalculator('from');
              }
            }}
            className={`block w-full appearance-none rounded-control border-2 border-border/60 bg-surface pl-32 pr-4 ${singleConverterLayoutTokens.amountInput.className} cursor-pointer font-bold text-right text-text transition-[border-color,box-shadow,background-color] duration-300 hover:border-primary/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20`}
            aria-label={`${t('singleConverter.fromAmountLabel', { code: fromCurrency })}: ${formatAmountDisplay(fromAmount, fromCurrency) || '0.00'}`}
          >
            {formatAmountDisplay(fromAmount, fromCurrency) || '0.00'}
          </button>
        </div>
        {/* 快速金額按鈕 - 來源貨幣
         *
         * SSOT 設計規範：中性變體（所有轉換器一致）
         * @see design-tokens.ts - quickAmountButtonTokens
         *
         * 響應式設計（行動端單行水平滾動）：
         * - overflow-x-auto：內容溢出時啟用水平滾動
         * - scrollbar-hide：隱藏滾動條保持簡潔美觀
         * - flex-nowrap：防止按鈕換行
         * - -webkit-overflow-scrolling: touch：iOS 慣性滾動
         *
         * 互動狀態：
         * - 預設：抬升表面背景 + 柔和文字
         * - 懸停：主色調淡化 + 主色文字 + 微幅放大
         * - 按壓：主色調加深 + 縮放回饋
         *
         * min-w-0：允許 flex 子元素收縮，避免擠壓父容器
         * @reference [context7:/websites/tailwindcss:overflow-wrap:min-width:2026-01-27]
         */}
        <div
          data-testid="quick-amounts-from"
          className={`${singleConverterLayoutTokens.quickAmounts.container} ${singleConverterLayoutTokens.quickAmounts.fromVisibility}`}
        >
          {(CURRENCY_QUICK_AMOUNTS[fromCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map((amount) => (
            <button
              type="button"
              key={amount}
              onClick={() => {
                // 直接更新來源金額，繞過 mode 狀態依賴
                onFromAmountChange(amount.toString());
                onQuickAmount(amount);
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className={quickAmountButtonTokens.className}
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className={singleConverterLayoutTokens.rateCard.section}>
        {/* 匯率卡片 - 一體化設計，無切分感 */}
        <div
          className={`group relative w-full rounded-card border border-border/80 bg-surface shadow-soft transition-[border-color,box-shadow] duration-300 hover:border-primary/20 hover:shadow-floating ${singleConverterLayoutTokens.rateCard.cardSpacing}`}
        >
          {/* 匯率資訊區塊 - 透明背景繼承父元素漸層 */}
          <div
            className={`relative flex flex-col items-center justify-center overflow-hidden rounded-t-control px-4 text-center ${singleConverterLayoutTokens.rateCard.infoPadding}`}
          >
            <RateSelector
              rateType={rateType}
              rateSource={rateSource}
              rateTypeAvailability={rateTypeAvailability}
              hasExchangeShop={!!exchangeShopCurrency}
              onRateTypeChange={onRateTypeChange}
              onRateSourceChange={onRateSourceChange ?? (() => undefined)}
            />

            {/* 匯率顯示 - 使用 SSOT text 色 */}
            <div className="w-full">
              <div
                className={`${singleConverterLayoutTokens.rateCard.rateText} mb-1 font-semibold tabular-nums text-text`}
              >
                1 {fromCurrency} = {formatExchangeRate(exchangeRate)} {toCurrency}
              </div>
              <div
                className={`${singleConverterLayoutTokens.rateCard.rateSubText} font-medium tabular-nums text-text-muted`}
              >
                1 {toCurrency} = {formatExchangeRate(reverseRate)} {fromCurrency}
              </div>
            </div>
          </div>

          {/* 滿版趨勢圖 - 無獨立背景，繼承父元素漸層實現一體化 */}
          <div
            data-testid="trend-chart"
            className={`relative w-full ${singleConverterLayoutTokens.rateCard.chartHeight} ${singleConverterLayoutTokens.rateCard.chartHoverHeight} transition-[opacity,transform] duration-500 will-change-[opacity,transform] overflow-hidden rounded-b-card ${
              showTrend ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="absolute inset-0">
              <ErrorBoundary
                fallback={
                  <div className="flex items-center justify-center h-full text-xs text-danger">
                    {t('singleConverter.trendChartLoadFailed')}
                  </div>
                }
                onError={(error: unknown) => {
                  logger.error(
                    'MiniTrendChart loading failed',
                    error instanceof Error ? error : undefined,
                  );
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-8 items-end justify-center bg-gradient-to-t from-surface/80 to-transparent pb-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-xs font-medium text-text-muted">
                {t('singleConverter.viewTrendChart')}
              </span>
            </div>
          </div>
        </div>

        {/* 轉換按鈕 - 現代化微互動設計
         *
         * 設計規範：
         * - 雙箭頭圖示 (ArrowUpDown) 取代旋轉圖示
         * - 漸層光環效果 (gradient glow)
         * - 懸停放大 + 陰影加深
         * - 點擊縮放 + Y軸旋轉動畫
         */}
        <div
          data-testid="swap-button"
          className={`${singleConverterLayoutTokens.swap.wrapper} ${singleConverterLayoutTokens.swap.visibility}`}
        >
          {/* 交換按鈕 - 收斂為清楚但安靜的工具按鈕 */}
          <button
            type="button"
            ref={swapButtonRef}
            onClick={handleSwap}
            className={`
              relative rounded-full border border-border bg-surface p-3.5 text-text shadow-soft
              transition-[border-color,color,box-shadow,transform] duration-300 ease-out
              hover:border-primary/25 hover:text-primary hover:shadow-card
              hover:scale-105 active:scale-95
              ${isSwapping ? 'scale-90' : ''}
            `}
            aria-label={t('singleConverter.swapCurrencies')}
            title={t('singleConverter.swapCurrencies')}
            disabled={isSwapping}
          >
            {/* 雙箭頭圖示 - Y軸旋轉動畫 */}
            <svg
              className={`relative z-10 w-5 h-5 transition-transform duration-500 ${
                isSwapping
                  ? '[transform:rotateY(180deg)]'
                  : 'group-hover/swap:[transform:rotateY(180deg)]'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 16V4m0 0L3 8m4-4l4 4" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>

          {/* 懸停提示標籤 */}
          <div className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 transition-[opacity,transform] duration-300 group-hover/swap:opacity-100">
            <span className="whitespace-nowrap rounded-full border border-border/70 bg-surface px-2.5 py-1 text-xs font-medium text-text-muted shadow-soft">
              {t('singleConverter.clickToSwap')}
            </span>
          </div>
        </div>
      </div>

      <div className={singleConverterLayoutTokens.section.className}>
        <label
          className={`block text-sm font-medium text-neutral-text-secondary ${singleConverterLayoutTokens.label.className}`}
        >
          {t('singleConverter.toAmount')}
        </label>
        <div className="relative">
          <select
            value={toCurrency}
            onChange={(e) => onToCurrencyChange(e.target.value as CurrencyCode)}
            className="absolute left-3 top-1/2 min-h-11 -translate-y-1/2 rounded-control border border-primary/20 bg-primary/10 px-2 py-2 text-base font-semibold text-text transition-[border-color,box-shadow,color,background-color] duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={t('singleConverter.selectToCurrency')}
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_DEFINITIONS[code].flag} {code}
              </option>
            ))}
          </select>
          {/* 金額輸入框 - 點擊開啟計算機鍵盤 */}
          <button
            type="button"
            ref={toInputRef}
            data-testid="amount-output"
            onClick={() => calculator.openCalculator('to')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                calculator.openCalculator('to');
              }
            }}
            className={`block w-full appearance-none rounded-control border-2 border-border/70 bg-surface-elevated pl-32 pr-4 ${singleConverterLayoutTokens.amountInput.className} cursor-pointer font-bold text-right text-text transition-[border-color,box-shadow,background-color] duration-300 hover:border-primary/35 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15`}
            aria-label={`${t('singleConverter.toAmountLabel', { code: toCurrency })}: ${formatAmountDisplay(toAmount, toCurrency) || '0.00'}`}
          >
            {formatAmountDisplay(toAmount, toCurrency) || '0.00'}
          </button>
        </div>
        {/* 快速金額按鈕 - 目標貨幣
         *
         * SSOT 設計規範：中性變體（所有轉換器一致）
         * @see design-tokens.ts - quickAmountButtonTokens
         *
         * 響應式設計（行動端單行水平滾動）：
         * - overflow-x-auto：內容溢出時啟用水平滾動
         * - scrollbar-hide：隱藏滾動條保持簡潔美觀
         * - flex-nowrap：防止按鈕換行
         * - -webkit-overflow-scrolling: touch：iOS 慣性滾動
         *
         * min-w-0：允許 flex 子元素收縮，避免擠壓父容器
         * @reference [context7:/websites/tailwindcss:overflow-wrap:min-width:2026-01-27]
         */}
        <div
          data-testid="quick-amounts-to"
          className={`${singleConverterLayoutTokens.quickAmounts.container} ${singleConverterLayoutTokens.quickAmounts.toVisibility}`}
        >
          {quickAmounts.map((amount) => (
            <button
              type="button"
              key={amount}
              onClick={() => {
                const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
                onToAmountChange(amount.toFixed(decimals));
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className={quickAmountButtonTokens.className}
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* 加入歷史記錄按鈕 - 現代化微互動設計
       *
       * 設計規範：
       * - 主色調實底背景 (primary → primary-hover)
       * - hover 品牌陰影 (shadow-brand)
       * - 微互動：hover scale + 漣漪光暈
       * - 點擊縮放回饋 (active:scale-[0.98])
       */}
      <button
        type="button"
        onClick={onAddToHistory}
        className={`
          relative w-full ${singleConverterLayoutTokens.addToHistory.className}
          rounded-control bg-primary text-primary-foreground font-semibold
          shadow-soft
          transition-[background-color,box-shadow,transform] duration-300 ease-out
          hover:bg-primary-hover hover:shadow-brand
          hover:scale-[1.01] active:scale-[0.98]
          group
        `}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('singleConverter.addToHistory')}
        </span>
      </button>

      {/* 計算機鍵盤 Bottom Sheet */}
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
