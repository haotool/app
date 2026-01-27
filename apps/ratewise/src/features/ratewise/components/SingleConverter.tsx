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

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
// RefreshCw 已替換為自定義雙箭頭 SVG
import { useTranslation } from 'react-i18next';
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
import { singleConverterLayoutTokens } from '../../../config/design-tokens';

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
  const { t } = useTranslation();
  const [trendData, setTrendData] = useState<MiniTrendDataPoint[]>([]);
  const [_loadingTrend, setLoadingTrend] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const swapButtonRef = useRef<HTMLButtonElement>(null);

  // 輸入框 refs（用於焦點管理）
  const fromInputRef = useRef<HTMLDivElement>(null);
  const toInputRef = useRef<HTMLDivElement>(null);

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
      <div
        className={[
          singleConverterLayoutTokens.section.base,
          singleConverterLayoutTokens.section.compact,
          singleConverterLayoutTokens.section.short,
        ].join(' ')}
      >
        <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
          {t('singleConverter.fromAmount')}
        </label>
        <div className="relative">
          <select
            value={fromCurrency}
            onChange={(e) => onFromCurrencyChange(e.target.value as CurrencyCode)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 text-text rounded-lg px-2 py-1.5 text-base font-semibold border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
            aria-label={t('singleConverter.selectFromCurrency')}
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_DEFINITIONS[code].flag} {code}
              </option>
            ))}
          </select>
          {/* 金額輸入框 - 點擊開啟計算機鍵盤 */}
          <div
            ref={fromInputRef}
            role="button"
            tabIndex={0}
            data-testid="amount-input"
            onClick={() => calculator.openCalculator('from')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                calculator.openCalculator('from');
              }
            }}
            className={`w-full pl-32 pr-4 ${singleConverterLayoutTokens.amountDisplay.padding} ${singleConverterLayoutTokens.amountDisplay.typography} font-bold text-right bg-surface border-2 border-border/60 rounded-2xl cursor-pointer hover:border-primary/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-[border-color,box-shadow] duration-300`}
            aria-label={t('singleConverter.fromAmountLabel', { code: fromCurrency })}
          >
            {formatAmountDisplay(fromAmount, fromCurrency) || '0.00'}
          </div>
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
          className={[
            singleConverterLayoutTokens.quickAmounts.base,
            singleConverterLayoutTokens.quickAmounts.fromVisibility,
          ].join(' ')}
        >
          {(CURRENCY_QUICK_AMOUNTS[fromCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map((amount) => (
            <button
              key={amount}
              onClick={() => {
                // 直接更新來源金額，繞過 mode 狀態依賴
                onFromAmountChange(amount.toString());
                onQuickAmount(amount);
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className="
                flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold
                bg-surface-elevated text-text/70
                hover:bg-primary/10 hover:text-primary
                active:bg-primary/20 active:text-primary
                transition-all duration-200 ease-out
                hover:scale-[1.03] active:scale-[0.97]
                hover:shadow-md active:shadow-sm
              "
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div
        className={[
          'flex flex-col items-center',
          singleConverterLayoutTokens.section.base,
          singleConverterLayoutTokens.section.compact,
          singleConverterLayoutTokens.section.short,
        ].join(' ')}
      >
        {/* 匯率卡片 - 一體化設計，無切分感 */}
        <div className="relative bg-gradient-to-b from-surface-card to-surface-elevated rounded-xl mb-3 w-full group cursor-pointer hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-primary/30">
          {/* 微光效果 - 極淺的漸層覆蓋 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl" />

          {/* 匯率資訊區塊 - 透明背景繼承父元素漸層 */}
          <div
            className={`relative text-center ${singleConverterLayoutTokens.rateCard.padding} px-4 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-[1.02] rounded-t-xl overflow-hidden`}
          >
            {/* 匯率類型切換按鈕 - 現代化玻璃擬態設計 */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 inline-flex bg-background/80 backdrop-blur-md rounded-full p-0.5 shadow-sm border border-border/60">
              <button
                onClick={() => onRateTypeChange('spot')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-300 ${
                  rateType === 'spot'
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'text-text/70 hover:text-text hover:bg-primary/10'
                }`}
                aria-label={t('singleConverter.switchToSpot')}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span>{t('singleConverter.spotRate')}</span>
              </button>
              <button
                onClick={() => onRateTypeChange('cash')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-300 ${
                  rateType === 'cash'
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'text-text/70 hover:text-text hover:bg-primary/10'
                }`}
                aria-label={t('singleConverter.switchToCash')}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{t('singleConverter.cashRate')}</span>
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
          <div
            data-testid="trend-chart"
            className={`relative w-full ${singleConverterLayoutTokens.rateCard.chartHeight} transition-[height,opacity,transform] duration-500 will-change-[height,opacity,transform] overflow-hidden rounded-b-xl ${
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
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface-elevated/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-1 pointer-events-none">
              <span className="text-[10px] font-semibold text-text-muted">查看趨勢圖</span>
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
          className={`relative group/swap ${singleConverterLayoutTokens.swap.compactHidden}`}
        >
          {/* 外圍漸層光環 */}
          <div
            className={`absolute -inset-2 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl transition-all duration-500 short:hidden ${
              isSwapping
                ? 'opacity-80 scale-110'
                : 'opacity-0 group-hover/swap:opacity-40 group-hover/swap:scale-100'
            }`}
          />

          {/* 交換按鈕 - 玻璃擬態設計 */}
          <button
            ref={swapButtonRef}
            onClick={handleSwap}
            className={`
              relative p-3.5
              bg-gradient-to-br from-primary to-primary-hover
              text-white rounded-full
              shadow-lg shadow-primary/30
              transition-all duration-300 ease-out
              hover:shadow-xl hover:shadow-primary/40
              hover:scale-110 active:scale-95
              ${isSwapping ? 'scale-90' : ''}
            `}
            aria-label={t('singleConverter.swapCurrencies')}
            title={t('singleConverter.swapCurrencies')}
            disabled={isSwapping}
          >
            {/* 內部光暈效果 */}
            <span
              className={`absolute inset-0 rounded-full bg-white/20 transition-opacity duration-300 ${
                isSwapping ? 'opacity-100' : 'opacity-0 group-hover/swap:opacity-30'
              }`}
            />

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
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover/swap:opacity-100 transition-all duration-300 pointer-events-none">
            <span className="text-[10px] font-semibold text-text-muted whitespace-nowrap bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md border border-border/50">
              {t('singleConverter.clickToSwap')}
            </span>
          </div>
        </div>
      </div>

      <div
        className={[
          singleConverterLayoutTokens.section.base,
          singleConverterLayoutTokens.section.compact,
          singleConverterLayoutTokens.section.short,
        ].join(' ')}
      >
        <label className="block text-sm font-medium text-neutral-text-secondary mb-2">
          {t('singleConverter.toAmount')}
        </label>
        <div className="relative">
          <select
            value={toCurrency}
            onChange={(e) => onToCurrencyChange(e.target.value as CurrencyCode)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 text-text rounded-lg px-2 py-1.5 text-base font-semibold border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
            aria-label={t('singleConverter.selectToCurrency')}
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_DEFINITIONS[code].flag} {code}
              </option>
            ))}
          </select>
          {/* 金額輸入框 - 點擊開啟計算機鍵盤 */}
          <div
            ref={toInputRef}
            role="button"
            tabIndex={0}
            data-testid="amount-output"
            onClick={() => calculator.openCalculator('to')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                calculator.openCalculator('to');
              }
            }}
            className={`w-full pl-32 pr-4 ${singleConverterLayoutTokens.amountDisplay.padding} ${singleConverterLayoutTokens.amountDisplay.typography} font-bold text-right bg-primary-bg/30 border-2 border-primary/30 rounded-2xl cursor-pointer hover:border-primary/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-[border-color,box-shadow] duration-300`}
            aria-label={t('singleConverter.toAmountLabel', { code: toCurrency })}
          >
            {formatAmountDisplay(toAmount, toCurrency) || '0.00'}
          </div>
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
          className={[
            singleConverterLayoutTokens.quickAmounts.base,
            singleConverterLayoutTokens.quickAmounts.toVisibility,
          ].join(' ')}
        >
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
                onToAmountChange(amount.toFixed(decimals));
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className="
                flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold
                bg-surface-elevated text-text/70
                hover:bg-primary/10 hover:text-primary
                active:bg-primary/20 active:text-primary
                transition-all duration-200 ease-out
                hover:scale-[1.03] active:scale-[0.97]
                hover:shadow-md active:shadow-sm
              "
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* 加入歷史記錄按鈕 - 現代化微互動設計
       *
       * 設計規範：
       * - 主色調漸層背景 (primary → primary-hover)
       * - 玻璃擬態陰影效果 (shadow-xl shadow-primary/25)
       * - 微互動：hover scale + 漣漪光暈
       * - 點擊縮放回饋 (active:scale-[0.98])
       */}
      <button
        onClick={onAddToHistory}
        className={[
          'relative w-full overflow-hidden',
          singleConverterLayoutTokens.addToHistory.padding,
          'bg-gradient-to-r from-primary to-primary-hover',
          'text-white font-bold rounded-2xl',
          'shadow-xl shadow-primary/25',
          'transition-all duration-300 ease-out',
          'hover:shadow-2xl hover:shadow-primary/30',
          'hover:scale-[1.02] active:scale-[0.98]',
          'group',
        ].join(' ')}
      >
        {/* 光暈效果 */}
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
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
