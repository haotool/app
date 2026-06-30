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
  useRef,
  useMemo,
  useCallback,
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
import { formatExchangeRate, formatAmountDisplay } from '../../../utils/currencyFormatter';
import { singleConverterLayoutTokens } from '../../../config/design-tokens';
import {
  DEFAULT_HERO_LAYOUT_VARIANT,
  getHeroLayoutVariant,
  HERO_LAYOUT_VARIANT_CHANGE_EVENT,
} from '../../../config/hero-layout-variant';

const subscribeHeroLayoutVariant = (onStoreChange: () => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = () => onStoreChange();
  window.addEventListener(HERO_LAYOUT_VARIANT_CHANGE_EVENT, handler);
  return () => window.removeEventListener(HERO_LAYOUT_VARIANT_CHANGE_EVENT, handler);
};

const getHeroLayoutIsV2Snapshot = () => getHeroLayoutVariant() === 'hero-v2';
const getHeroLayoutIsV2ServerSnapshot = () => DEFAULT_HERO_LAYOUT_VARIANT === 'hero-v2';
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
import { HeroAmountNumpad, applyHeroAmountKey } from './HeroAmountNumpad';
import { HeroRatePanel } from './HeroRatePanel';
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
  lastUpdate?: string | null;
  lastFetchedAt?: string | null;
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
  lastUpdate = null,
  lastFetchedAt = null,
}: SingleConverterProps) => {
  const { t } = useTranslation();
  const rateCardTokens = singleConverterLayoutTokens.rateCard;
  const isHeroV2 = useSyncExternalStore(
    subscribeHeroLayoutVariant,
    getHeroLayoutIsV2Snapshot,
    getHeroLayoutIsV2ServerSnapshot,
  );
  const [heroActiveInput, setHeroActiveInput] = useState<'from' | 'to'>('from');
  const [trendData, setTrendData] = useState<MiniTrendDataPoint[]>([]);
  const [_loadingTrend, setLoadingTrend] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
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
    },
  );
  const reverseRate = getReciprocalExchangeRate(exchangeRate);

  const heroRateValues = useMemo(
    () => ({
      spot: getUnitExchangeRate(
        fromCurrency,
        toCurrency,
        details,
        'spot',
        rateMode,
        exchangeRates,
        { rateSource, exchangeShopRate: moneyBoxRate },
      ),
      cash: getUnitExchangeRate(
        fromCurrency,
        toCurrency,
        details,
        'cash',
        rateMode,
        exchangeRates,
        { rateSource, exchangeShopRate: moneyBoxRate },
      ),
      exchangeShop: moneyBoxRate
        ? computeConverterRate(moneyBoxRate, fromCurrency, toCurrency)
        : null,
    }),
    [fromCurrency, toCurrency, details, rateMode, exchangeRates, rateSource, moneyBoxRate],
  );

  const heroQuickAmounts = useMemo(() => {
    const currency = heroActiveInput === 'from' ? fromCurrency : toCurrency;
    return CURRENCY_QUICK_AMOUNTS[currency] || CURRENCY_QUICK_AMOUNTS.TWD;
  }, [heroActiveInput, fromCurrency, toCurrency]);

  const handleHeroNumpadKey = useCallback(
    (key: string) => {
      if (heroActiveInput === 'from') {
        const next = applyHeroAmountKey(fromAmount, key);
        onFromAmountChange(next);
        const parsed = parseFloat(next);
        if (!Number.isNaN(parsed)) {
          onQuickAmount(parsed);
        }
      } else {
        const next = applyHeroAmountKey(toAmount, key);
        onToAmountChange(next);
      }
    },
    [heroActiveInput, fromAmount, toAmount, onFromAmountChange, onToAmountChange, onQuickAmount],
  );

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
  }, [fromCurrency, toCurrency, trendDateKey, rateSource, moneyBoxRate, exchangeShopCurrency]);

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

  const renderFromAmountSection = () => (
    <div className={singleConverterLayoutTokens.section.className}>
      <label
        className={`block text-sm font-medium text-neutral-text-secondary ${singleConverterLayoutTokens.label.className}`}
      >
        {t('singleConverter.fromAmount')}
      </label>
      <div className="relative">
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
      </div>
      <div
        data-testid="quick-amounts-from"
        className={`${singleConverterLayoutTokens.quickAmounts.container} ${singleConverterLayoutTokens.quickAmounts.fromVisibility}`}
      >
        {(CURRENCY_QUICK_AMOUNTS[fromCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map((amount) => (
          <button
            key={amount}
            onClick={() => {
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
  );

  const renderSwapButton = () => (
    <div
      data-testid="swap-button"
      className={`${singleConverterLayoutTokens.swap.wrapper} ${singleConverterLayoutTokens.swap.visibility}`}
    >
      {/* 外圍漸層光環 */}
      <div
        className={`absolute -inset-2 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full blur-xl transition-all duration-500 ${singleConverterLayoutTokens.swap.glowHidden} ${
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
  );

  const renderAddToHistoryButton = () => (
    <button
      onClick={onAddToHistory}
      className={`
          relative w-full overflow-hidden ${singleConverterLayoutTokens.addToHistory.className}
          bg-gradient-to-r from-primary to-primary-hover
          text-white font-bold rounded-2xl
          shadow-xl shadow-primary/25
          transition-all duration-300 ease-out
          hover:shadow-2xl hover:shadow-primary/30
          hover:scale-[1.02] active:scale-[0.98]
          group
        `}
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
  );

  const renderHeroInlineSwapButton = () => (
    <button
      ref={swapButtonRef}
      type="button"
      data-testid="hero-swap-button"
      onClick={handleSwap}
      disabled={isSwapping}
      className={`${rateCardTokens.heroSwapInline} ${isSwapping ? 'scale-90' : ''}`}
      aria-label={t('singleConverter.swapCurrencies')}
      title={t('singleConverter.swapCurrencies')}
    >
      <svg
        className={`h-5 w-5 transition-transform duration-500 ${isSwapping ? '[transform:rotateY(180deg)]' : ''}`}
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
  );

  const renderHeroV2Layout = () => (
    <>
      <div className={rateCardTokens.section} data-testid="rate-hero-section">
        <div
          className={`relative rounded-xl w-full ${rateCardTokens.heroCardGradient} ${rateCardTokens.cardSpacing}`}
        >
          <div
            className={`relative px-4 flex flex-col items-center justify-center rounded-xl overflow-hidden ${rateCardTokens.heroInfoPadding}`}
          >
            <HeroRatePanel
              fromCurrency={fromCurrency}
              toCurrency={toCurrency}
              exchangeRate={exchangeRate}
              reverseRate={reverseRate}
              rateType={rateType}
              rateSource={rateSource}
              rateMode={rateMode}
              rateTypeAvailability={rateTypeAvailability}
              hasExchangeShop={!!exchangeShopCurrency}
              heroRateValues={heroRateValues}
              onRateTypeChange={onRateTypeChange}
              onRateSourceChange={onRateSourceChange ?? (() => undefined)}
              lastUpdate={lastUpdate}
              lastFetchedAt={lastFetchedAt}
            />

            <div className={rateCardTokens.heroConverterSection}>
              <div className={rateCardTokens.heroDualCurrencyRow}>
                <div className={rateCardTokens.heroDualCurrencyField}>
                  <span className={rateCardTokens.heroDualCurrencyLabel}>
                    {t('singleConverter.fromAmount')}
                  </span>
                  <div className="relative">
                    <select
                      value={fromCurrency}
                      onChange={(e) => onFromCurrencyChange(e.target.value as CurrencyCode)}
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-lg border border-primary/20 bg-primary/10 px-1.5 py-1 text-sm font-semibold text-text transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      aria-label={t('singleConverter.selectFromCurrency')}
                    >
                      {CURRENCY_CODES.map((code) => (
                        <option key={code} value={code}>
                          {CURRENCY_DEFINITIONS[code].flag} {code}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      data-testid="hero-currency-input-from"
                      onClick={() => setHeroActiveInput('from')}
                      className={`pl-24 ${rateCardTokens.heroDualCurrencyInput} ${
                        heroActiveInput === 'from'
                          ? rateCardTokens.heroDualCurrencyInputActive
                          : rateCardTokens.heroDualCurrencyInputInactive
                      }`}
                      aria-label={`${t('singleConverter.fromAmountLabel', { code: fromCurrency })}: ${formatAmountDisplay(fromAmount, fromCurrency) || '0.00'}`}
                    >
                      {formatAmountDisplay(fromAmount, fromCurrency) || '0.00'}
                    </button>
                  </div>
                </div>

                {renderHeroInlineSwapButton()}

                <div className={rateCardTokens.heroDualCurrencyField}>
                  <span className={rateCardTokens.heroDualCurrencyLabel}>
                    {t('singleConverter.toAmount')}
                  </span>
                  <div className="relative">
                    <select
                      value={toCurrency}
                      onChange={(e) => onToCurrencyChange(e.target.value as CurrencyCode)}
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-lg border border-primary/20 bg-primary/10 px-1.5 py-1 text-sm font-semibold text-text transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      aria-label={t('singleConverter.selectToCurrency')}
                    >
                      {CURRENCY_CODES.map((code) => (
                        <option key={code} value={code}>
                          {CURRENCY_DEFINITIONS[code].flag} {code}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      data-testid="hero-currency-input-to"
                      onClick={() => setHeroActiveInput('to')}
                      className={`pl-24 ${rateCardTokens.heroDualCurrencyInput} ${
                        heroActiveInput === 'to'
                          ? rateCardTokens.heroDualCurrencyInputActive
                          : rateCardTokens.heroDualCurrencyInputInactive
                      }`}
                      aria-label={`${t('singleConverter.toAmountLabel', { code: toCurrency })}: ${formatAmountDisplay(toAmount, toCurrency) || '0.00'}`}
                    >
                      {formatAmountDisplay(toAmount, toCurrency) || '0.00'}
                    </button>
                  </div>
                </div>
              </div>

              <div
                data-testid="quick-amounts-hero"
                className={`w-full ${singleConverterLayoutTokens.quickAmounts.container}`}
              >
                {heroQuickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      if (heroActiveInput === 'from') {
                        onFromAmountChange(amount.toString());
                        onQuickAmount(amount);
                      } else {
                        const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
                        onToAmountChange(amount.toFixed(decimals));
                      }
                      if ('vibrate' in navigator) {
                        navigator.vibrate(30);
                      }
                    }}
                    className="
                    flex-shrink-0 min-h-11 px-3 py-1.5 rounded-xl text-sm font-semibold
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

              <HeroAmountNumpad onKeyPress={handleHeroNumpadKey} className="w-full" />
            </div>
          </div>
        </div>
      </div>

      {renderAddToHistoryButton()}
    </>
  );

  const renderLegacyLayout = () => (
    <>
      {renderFromAmountSection()}

      <div className={rateCardTokens.section} data-testid="rate-hero-section">
        <div
          className={`relative rounded-xl w-full bg-gradient-to-b from-surface-card to-surface-elevated border border-border/50 hover:border-primary/30 group cursor-pointer hover:shadow-xl transition-all duration-500 ${rateCardTokens.cardSpacing}`}
        >
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          <div
            className={`relative text-center px-4 flex flex-col items-center justify-center rounded-t-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.02] ${rateCardTokens.infoPadding}`}
          >
            <RateSelector
              rateType={rateType}
              rateSource={rateSource}
              rateTypeAvailability={rateTypeAvailability}
              hasExchangeShop={!!exchangeShopCurrency}
              onRateTypeChange={onRateTypeChange}
              onRateSourceChange={onRateSourceChange ?? (() => undefined)}
            />

            <div className={`w-full ${rateCardTokens.rateTextBlock}`}>
              <div
                data-testid="hero-rate-display"
                className={`${rateCardTokens.rateText} font-bold tabular-nums text-text mb-1 transition-transform duration-300 group-hover:scale-105`}
              >
                1 {fromCurrency} = {formatExchangeRate(exchangeRate)} {toCurrency}
              </div>
              <div
                className={`${rateCardTokens.rateSubText} tabular-nums text-text-muted font-semibold opacity-80 group-hover:opacity-95 transition-opacity`}
              >
                1 {toCurrency} = {formatExchangeRate(reverseRate)} {fromCurrency}
              </div>
            </div>
          </div>

          {/* 滿版趨勢圖 - 無獨立背景，繼承父元素漸層實現一體化 */}
          <div
            data-testid="trend-chart"
            className={`relative w-full ${rateCardTokens.chartHeight} ${rateCardTokens.chartHoverHeight} transition-[height,opacity,transform] duration-500 will-change-[height,opacity,transform] overflow-hidden rounded-b-xl ${
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

        {renderSwapButton()}
      </div>

      <div className={singleConverterLayoutTokens.section.className}>
        <label
          className={`block text-sm font-medium text-neutral-text-secondary ${singleConverterLayoutTokens.label.className}`}
        >
          {t('singleConverter.toAmount')}
        </label>
        <div className="relative">
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
        </div>
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

      {renderAddToHistoryButton()}

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

  return isHeroV2 ? renderHeroV2Layout() : renderLegacyLayout();
};
