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

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  Suspense,
  lazy,
} from 'react';
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
import { mergeLatestTrendPoint, resolveTrendSeries } from './converter-v2/useConverterTrend';
import { formatExchangeRate, formatAmountDisplay } from '../../../utils/currencyFormatter';
import {
  singleConverterLayoutTokens,
  quickAmountButtonTokens,
} from '../../../config/design-tokens';
// 直接 import 以確保離線冷啟動可用
import { CalculatorKeyboard } from '../../calculator/components/CalculatorKeyboard';
import { logger } from '../../../utils/logger';
import {
  getReciprocalExchangeRate,
  getUnitExchangeRate,
  resolveCardBasisRateType,
} from '../../../utils/exchangeRateCalculation';
import type { RateTypeAvailability } from '../../../utils/exchangeRateCalculation';
import { useCalculatorModal } from '../hooks/useCalculatorModal';
import { TREND_CHART_DEFER_MS, TREND_CHART_IDLE_TIMEOUT_MS } from '../../../config/performance';
import { RateSelector } from './RateSelector';
import { CardEstimateInfo } from './CardEstimateInfo';
import { useConverterStore } from '../../../stores/converterStore';
import {
  computeConverterRate,
  fetchExchangeShopHistoricalRatesRange,
  type ExchangeShopRate,
} from '../../../services/moneyboxRateService';
import {
  subscribeConverterV2Variant,
  getConverterV2Snapshot,
  getConverterV2ServerSnapshot,
} from '../../../config/converter-v2-flag';
import { ConverterV2Skeleton } from './converter-v2/ConverterV2Skeleton';

// v2 走 lazy chunk：flag off 使用者不載入 v2 程式碼。
const loadSingleConverterV2 = () =>
  import('./converter-v2/SingleConverterV2').then((m) => ({ default: m.SingleConverterV2 }));
const SingleConverterV2 = lazy(loadSingleConverterV2);

// 冷啟動預熱：persisted 偏好（或 URL override）為 v2 時，模組評估即預取 v2 chunk，
// 讓 hydration 後 legacy→v2 切換不再等待網路載入（issue #583 兩段跳動收斂）。
// 回傳值供單元測試驗證觸發條件；SSG／flag off 時回傳 null 不觸發下載。
export function preheatConverterV2Chunk(): Promise<unknown> | null {
  if (typeof window === 'undefined' || !getConverterV2Snapshot()) {
    return null;
  }
  return loadSingleConverterV2();
}
// 預熱失敗（弱網、換版後舊 HTML 引用失效 chunk）靜默吞掉：lazy 首次渲染會重試，
// 交由 Suspense／ErrorBoundary 與全域 chunk-load 回復機制處理，避免 unhandled rejection。
preheatConverterV2Chunk()?.catch(() => null);

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

export interface SingleConverterProps {
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
  /** 刷卡估算可用性（flag＋情境）；false 時 pill 不渲染（零暴露）。 */
  hasCardRate?: boolean;
  onRateSourceChange?: (source: RateSource) => void;
}

const SingleConverterLegacy = ({
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
  hasCardRate = false,
  onRateSourceChange,
}: SingleConverterProps) => {
  const { t } = useTranslation();
  const cardFeePercent = useConverterStore((state) => state.cardFeePercent);
  const [trendData, setTrendData] = useState<MiniTrendDataPoint[]>([]);
  const [_loadingTrend, setLoadingTrend] = useState(false);
  // 趨勢圖實際使用的費率基準；即期序列不足時誠實回落現金賣出，標註跟隨（#564）。
  const [trendRateType, setTrendRateType] = useState<RateType>(rateType);
  const [isSwapping, setIsSwapping] = useState(false);
  const [trendDateKey, setTrendDateKey] = useState(() => getLocalDateKey());
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
      cardFeePercent,
    },
  );
  const reverseRate = getReciprocalExchangeRate(exchangeRate);

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
          ? computeConverterRate(moneyBoxRate, fromCurrency, toCurrency)
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
              const converterRate = computeConverterRate(rate, fromCurrency, toCurrency);
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

        // 基準跟隨卡片費率模式（#564）；即期序列不足時誠實回落現金賣出。
        const { points: historyPoints, trendRateType: effectiveRateType } = resolveTrendSeries(
          historicalData,
          fromCurrency,
          toCurrency,
          rateType,
        );
        const mergedPoints = mergeLatestTrendPoint(
          historyPoints,
          latestRates,
          fromCurrency,
          toCurrency,
          effectiveRateType,
        );

        // 按日期排序並限制最多30天
        const sortedPoints = mergedPoints.sort((a, b) => a.date.localeCompare(b.date));
        setTrendData(sortedPoints.slice(-MAX_TREND_DAYS));
        setTrendRateType(effectiveRateType);
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
    moneyBoxRate,
    exchangeShopCurrency,
    rateType,
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
            className={`w-full pl-32 pr-4 ${singleConverterLayoutTokens.amountInput.className} font-bold text-right bg-surface border-2 border-border/60 rounded-2xl cursor-pointer hover:border-primary/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-[border-color,box-shadow] duration-300`}
            aria-label={`${t('singleConverter.fromAmountLabel', { code: fromCurrency })}: ${formatAmountDisplay(fromAmount, fromCurrency) || '0.00'}`}
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
          className={`${singleConverterLayoutTokens.quickAmounts.container} ${singleConverterLayoutTokens.quickAmounts.fromVisibility}`}
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
              className={quickAmountButtonTokens.pattern}
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className={singleConverterLayoutTokens.rateCard.section}>
        {/* 匯率卡片 - 一體化設計，無切分感 */}
        <div
          className={`relative bg-gradient-to-b from-surface-card to-surface-elevated rounded-xl w-full group cursor-pointer hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-primary/30 ${singleConverterLayoutTokens.rateCard.cardSpacing} ${singleConverterLayoutTokens.rateCard.cardMinHeight}`}
        >
          {/*
           * 微光效果 - 極淺的漸層覆蓋
           * 使用 aspect-square + object-cover 確保等比例不變形
           */}
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* 匯率資訊區塊 - 透明背景繼承父元素漸層。
           * 不設 overflow-hidden：RateTypeTooltip 以 bottom-full 向上彈出，
           * 剪裁會讓「即期不可用」說明只露出數 px；微光疊層已由上方獨立容器自行剪裁。 */}
          <div
            className={`relative text-center px-4 flex flex-col items-center justify-center rounded-t-xl ${singleConverterLayoutTokens.rateCard.infoPadding}`}
          >
            <RateSelector
              rateType={rateType}
              rateSource={rateSource}
              rateTypeAvailability={rateTypeAvailability}
              hasExchangeShop={!!exchangeShopCurrency}
              hasCard={hasCardRate}
              onRateTypeChange={onRateTypeChange}
              onRateSourceChange={onRateSourceChange ?? (() => undefined)}
            />

            {/* 匯率顯示 - 使用 SSOT text 色；固定高度避免計價基準 pill / live 匯率載入 CLS */}
            <div className={`w-full ${singleConverterLayoutTokens.rateCard.rateTextBlock}`}>
              <div
                className={`${singleConverterLayoutTokens.rateCard.rateText} font-bold tabular-nums text-text mb-1`}
              >
                1 {fromCurrency} = {formatExchangeRate(exchangeRate)} {toCurrency}
              </div>
              <div
                className={`${singleConverterLayoutTokens.rateCard.rateSubText} tabular-nums text-text-muted font-semibold opacity-80 group-hover:opacity-95 transition-opacity`}
              >
                1 {toCurrency} = {formatExchangeRate(reverseRate)} {fromCurrency}
              </div>
              {/* 刷卡估算揭露區：估算 badge＋計算式＋手續費 stepper＋免責（ADR-002 Phase 1）。
               * 基準揭露由 resolveCardBasisRateType 依 pair 可用性解析（與引擎賣出腿 fallback 同判準）。
               * 非刷卡來源維持固定高度 slot 避免 CLS。 */}
              {rateSource === 'card' ? (
                <CardEstimateInfo basisRateType={resolveCardBasisRateType(rateTypeAvailability)} />
              ) : (
                <div
                  className={singleConverterLayoutTokens.rateCard.rateBasisSlot}
                  aria-hidden="true"
                >
                  <span className="invisible rounded-full border border-transparent px-2 py-0.5 text-xs">
                    &#8203;
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 滿版趨勢圖 - 無獨立背景，繼承父元素漸層實現一體化 */}
          <div
            data-testid="trend-chart"
            className={`relative w-full ${singleConverterLayoutTokens.rateCard.chartHeight} ${singleConverterLayoutTokens.rateCard.chartHoverHeight} overflow-hidden rounded-b-xl`}
          >
            <div className="absolute inset-0">
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
                    {/* 銀行歷史趨勢基準跟隨卡片費率模式（#564）；即期序列不足時回落現金賣出並同步標註。
                     * 換錢所趨勢與卡片同基準，不另標。 */}
                    <MiniTrendChart
                      data={trendData}
                      currencyCode={toCurrency}
                      basisLabel={
                        rateSource === 'exchange-shop'
                          ? undefined
                          : trendRateType === 'spot'
                            ? t('trend.spotSellBasis')
                            : t('trend.cashSellBasis')
                      }
                    />
                  </Suspense>
                )}
              </ErrorBoundary>
            </div>
            {/* 互動提示 - 與整體漸層融合 */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface-elevated/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-1 pointer-events-none">
              <span className="text-2xs font-semibold text-text-muted">查看趨勢圖</span>
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
          {/* 交換按鈕 - 平色主色深階（E1 去漸層、白字 AA 錨點） */}
          <button
            ref={swapButtonRef}
            onClick={handleSwap}
            className={`
              relative p-3.5
              bg-primary-strong hover:bg-primary-hover
              text-white rounded-full
              transition-all duration-300 ease-out
              active:scale-95
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
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
              className={`relative z-10 w-5 h-5 transition-transform duration-300 ${
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
            <span className="text-2xs font-semibold text-text-muted whitespace-nowrap bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md border border-border/50">
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
            className={`w-full pl-32 pr-4 ${singleConverterLayoutTokens.amountInput.className} font-bold text-right bg-primary-bg/30 border-2 border-primary/30 rounded-2xl cursor-pointer hover:border-primary/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-[border-color,box-shadow] duration-300`}
            aria-label={`${t('singleConverter.toAmountLabel', { code: toCurrency })}: ${formatAmountDisplay(toAmount, toCurrency) || '0.00'}`}
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
          className={`${singleConverterLayoutTokens.quickAmounts.container} ${singleConverterLayoutTokens.quickAmounts.toVisibility}`}
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
              className={quickAmountButtonTokens.pattern}
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* 加入歷史記錄按鈕 - 平色主 CTA（E1）
       *
       * 設計規範：
       * - 平色主色深階背景（白字表面錨定 primary-strong 保 AA）
       * - 無裝飾性陰影與光澤掃過
       * - 點擊縮放回饋 (active:scale-[0.98])
       */}
      <button
        onClick={onAddToHistory}
        className={`
          relative w-full overflow-hidden ${singleConverterLayoutTokens.addToHistory.className}
          bg-primary-strong hover:bg-primary-hover
          text-white font-bold rounded-2xl
          transition-all duration-300 ease-out
          active:scale-[0.98]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
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

// SSR 環境呼叫 useLayoutEffect 會產生 React 警告；依 window 存在與否切換，SSR 端退回 useEffect。
// client 端用 layout effect 於 paint 前同步切換；base 的 uSES 一致性切換由 passive effect
// 於 paint 後觸發——本修法切換時點更早，不多出可見 legacy 幀。
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// issue #653：persisted v2 冷載時，hydration 期間的 store 更新會迫使 React 對尚未完成
// hydration 的邊界改走 client render；此時 client snapshot 已是 v2，與 SSG 的 legacy
// HTML 不符 → React #418（間歇、舊 profile 必現）。模組級旗標記錄本次 page load 是否
// 已完成一次 hydration：SPA 導覽 remount 時首幀直接依 persisted 偏好渲染，不重演 two-pass。
let hasCompletedHydration = false;

// 測試專用：重置 hydration 旗標，模擬新的 page load。
// eslint-disable-next-line react-refresh/only-export-components
export function resetConverterHydrationForTests() {
  hasCompletedHydration = false;
}

/**
 * 模式分流：converter-v2 flag on 時渲染等值雙列 v2，off 時維持 legacy。
 * server snapshot 固定 legacy，flag off 時 SSG 首頁輸出與現行一致（hydration 紅線）。
 * two-pass render（#653）：hydration commit 前 client snapshot 一律回傳 legacy
 * （與 server snapshot 相同），確保 hydration 中任何強制 re-render 都與 SSG 輸出一致；
 * commit 後的 layout effect（paint 前）才改讀 persisted 偏好，v2 使用者無多餘可見閃爍。
 */
export const SingleConverter = (props: SingleConverterProps) => {
  const [hydrated, setHydrated] = useState(hasCompletedHydration);

  useIsomorphicLayoutEffect(() => {
    hasCompletedHydration = true;
    setHydrated(true);
  }, []);

  const isV2 = useSyncExternalStore(
    subscribeConverterV2Variant,
    hydrated ? getConverterV2Snapshot : getConverterV2ServerSnapshot,
    getConverterV2ServerSnapshot,
  );

  if (isV2) {
    return (
      // fallback 為 v2 佈局輪廓骨架：chunk 未就緒時取代空白，冷啟動至多一次可感知佈局變化。
      <Suspense fallback={<ConverterV2Skeleton />}>
        <SingleConverterV2 {...props} />
      </Suspense>
    );
  }

  return <SingleConverterLegacy {...props} />;
};
