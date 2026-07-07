import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CURRENCY_DEFINITIONS,
  DEFAULT_BASE_CURRENCY,
  DEFAULT_CONVERTER_AMOUNT,
  DEFAULT_CONVERTER_MODE,
  DEFAULT_RATE_TYPE,
} from '../constants';
import type {
  AmountField,
  ConversionHistoryEntry,
  ConverterMode,
  CurrencyCode,
  MultiAmountsState,
  RateSource,
  RateType,
} from '../types';
import type { RateDetails } from './useExchangeRates';
import { logger } from '../../../utils/logger';
import { getUnitExchangeRate } from '../../../utils/exchangeRateCalculation';
import { getRelativeTimeString } from '../../../utils/timeFormatter';
import { INP_LONG_TASK_THRESHOLD_MS } from '../../../utils/interactionBudget';
import { useToast } from '../../../components/Toast';
import { useConverterStore } from '../../../stores/converterStore';
import {
  getExchangeShopProvider,
  getSupportedExchangeShopCurrencies,
  hasExchangeShopProvider,
} from '../../../config/exchangeShopProviders';
import {
  getExchangeShopRateForPair,
  type ExchangeShopRate,
  type ExchangeShopRatesByCurrency,
} from '../../../services/moneyboxRateService';
import { useMoneyBoxRates } from './useMoneyBoxRates';
import { useMoneyBoxRatesMap } from './useMoneyBoxRatesMap';
import {
  getCardRateServerSnapshot,
  isCardRateEnabled,
  subscribeCardRateFlag,
} from '../../../config/card-rate-flag';
import {
  getConverterV2ServerSnapshot,
  getConverterV2Snapshot,
  subscribeConverterV2Variant,
} from '../../../config/converter-v2-flag';
import type { ProviderSelectionMode, ResolvedRateProvider } from '../rateProviderTypes';
import {
  rankProviderQuotes,
  resolveProviderPreference,
  type ProviderQuote,
} from '../rateProviderRanking';
import { buildProviderQuotes } from '../rateProviderQuoteAdapters';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

const createInitialMultiAmounts = (
  baseCurrency: CurrencyCode,
  baseValue = DEFAULT_CONVERTER_AMOUNT,
): MultiAmountsState => {
  return CURRENCY_CODES.reduce<MultiAmountsState>((acc, code) => {
    acc[code] = code === baseCurrency ? baseValue : '';
    return acc;
  }, {} as MultiAmountsState);
};

const sanitizeFavorites = (codes: CurrencyCode[]): CurrencyCode[] => {
  const unique = Array.from(new Set(codes));
  const isCurrencyCode = (value: string): value is CurrencyCode =>
    CURRENCY_CODES.includes(value as CurrencyCode);
  return unique.filter(isCurrencyCode);
};

const buildFallbackExchangeShopRate = (currency: CurrencyCode): ExchangeShopRate | null => {
  const provider = getExchangeShopProvider(currency);
  if (!provider) return null;

  return {
    currency,
    sell: provider.fallbackSell,
    buy: provider.fallbackBuy,
    updateTime: '—',
    source: provider.source,
    sourceUrl: provider.sourceUrl,
    providerName: provider.providerName,
    isFallback: true,
  };
};

interface UseCurrencyConverterOptions {
  exchangeRates?: Record<string, number | null>;
  details?: Record<string, RateDetails>;
  rateType?: RateType;
  rateSource?: RateSource;
  mode?: ConverterMode;
}

export function resolveEffectiveRateSourceForConversion({
  mode,
  requestedRateSource,
  resolvedSourceKind,
  exchangeShopRate,
  providerSelectionMode,
  isCardRateAllowed = false,
}: {
  mode: 'single' | 'multi';
  requestedRateSource?: RateSource;
  resolvedSourceKind: RateSource;
  exchangeShopRate: ExchangeShopRate | null;
  /** providerPreference.mode：'best' 模式下多幣別需依每個 row pair 的可用換錢所匯率決定來源。 */
  providerSelectionMode?: ProviderSelectionMode;
  /** 刷卡估算可用性（feature flag＋情境）；false 時 card 一律回落銀行（flag off 零暴露）。 */
  isCardRateAllowed?: boolean;
}): RateSource {
  if (mode !== 'multi') {
    if (resolvedSourceKind === 'card' && !isCardRateAllowed) return 'bank';
    return resolvedSourceKind;
  }
  // 多幣別 SSOT：使用者明選 exchange-shop 或 best 模式偵測到該 row 有換錢所匯率時走換錢所；
  // 否則 fallback 銀行（避免單幣別 single-pair resolvedSourceKind 跨 row 誤套用）。
  // 刷卡估算 Phase 1 不支援多幣別（Phase 1.5），card 於 multi 一律落銀行。
  if (!exchangeShopRate) return 'bank';
  if (requestedRateSource === 'exchange-shop') return 'exchange-shop';
  if (providerSelectionMode === 'best') return 'exchange-shop';
  return 'bank';
}

export const useCurrencyConverter = (options: UseCurrencyConverterOptions = {}) => {
  const {
    exchangeRates,
    details,
    rateType = DEFAULT_RATE_TYPE,
    rateSource,
    mode: requestedMode,
  } = options;
  const { t } = useTranslation();
  const { showToast } = useToast();

  const {
    fromCurrency,
    toCurrency,
    rateMode,
    favorites,
    providerPreference,
    history,
    baseCurrency,
    cardFeePercent,
    setFromCurrency,
    setToCurrency,
    setRateMode,
    setRateType,
    setRateSource,
    setProviderPreference,
    setBaseCurrency,
    toggleFavorite: storeToggleFavorite,
    reorderFavorites: storeReorderFavorites,
    swapCurrencies: storeSwapCurrencies,
    addToHistory: storeAddToHistory,
    clearHistory: storeClearHistory,
  } = useConverterStore();

  const [fromAmount, setFromAmount] = useState<string>(DEFAULT_CONVERTER_AMOUNT);
  const [toAmount, setToAmount] = useState<string>('');

  const [multiAmounts, setMultiAmounts] = useState<MultiAmountsState>(() =>
    createInitialMultiAmounts(useConverterStore.getState().baseCurrency),
  );
  const mode = requestedMode ?? DEFAULT_CONVERTER_MODE;

  const exchangeShopCurrency = useMemo((): CurrencyCode | null => {
    if (fromCurrency === 'TWD' && hasExchangeShopProvider(toCurrency)) return toCurrency;
    if (toCurrency === 'TWD' && hasExchangeShopProvider(fromCurrency)) return fromCurrency;
    return null;
  }, [fromCurrency, toCurrency]);

  // 刷卡估算可用性 SSOT：flag on＋單幣別 legacy 版面＋貨幣對涉及 TWD（帳單以 TWD 清算）。
  // v2 版面 Phase 1 缺估算 badge／計算式／手續費／免責揭露，PM 裁決不做半套：
  // card 收斂回 bank，完整 v2 揭露併 E8 wave-B（ADR-002 UI 邊界備註）。
  const isCardRateFlagEnabled = useSyncExternalStore(
    subscribeCardRateFlag,
    isCardRateEnabled,
    getCardRateServerSnapshot,
  );
  const isConverterV2Active = useSyncExternalStore(
    subscribeConverterV2Variant,
    getConverterV2Snapshot,
    getConverterV2ServerSnapshot,
  );
  const isCardRateAvailableInContext = useMemo<boolean>(
    () =>
      isCardRateFlagEnabled &&
      !isConverterV2Active &&
      mode === 'single' &&
      fromCurrency !== toCurrency &&
      (fromCurrency === 'TWD' || toCurrency === 'TWD'),
    [isCardRateFlagEnabled, isConverterV2Active, mode, fromCurrency, toCurrency],
  );

  const { rate: moneyBoxRate } = useMoneyBoxRates(exchangeShopCurrency);
  const fallbackExchangeShopRate = useMemo((): ExchangeShopRate | null => {
    if (!exchangeShopCurrency) return null;
    return buildFallbackExchangeShopRate(exchangeShopCurrency);
  }, [exchangeShopCurrency]);
  const selectedExchangeShopRate = moneyBoxRate ?? fallbackExchangeShopRate;

  const numericAmount = useMemo(() => {
    const parsed = parseFloat(fromAmount);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [fromAmount]);
  const providerQuotes = useMemo<ProviderQuote[]>(() => {
    return buildProviderQuotes({
      amount: numericAmount,
      from: fromCurrency,
      to: toCurrency,
      details,
      rateType,
      rateMode,
      exchangeRates,
      exchangeShopRate: selectedExchangeShopRate,
    });
  }, [
    fromCurrency,
    toCurrency,
    details,
    rateType,
    rateMode,
    exchangeRates,
    selectedExchangeShopRate,
    numericAmount,
  ]);

  const resolvedProvider = useMemo<ResolvedRateProvider>(
    () =>
      resolveProviderPreference({
        preference: providerPreference,
        from: fromCurrency,
        to: toCurrency,
        rateType,
        quotes: providerQuotes,
      }),
    [providerPreference, fromCurrency, toCurrency, rateType, providerQuotes],
  );

  const rankedProviderQuotes = useMemo<ProviderQuote[]>(
    () =>
      rankProviderQuotes({
        amount: numericAmount,
        from: fromCurrency,
        to: toCurrency,
        rateType,
        quotes: providerQuotes,
      }),
    [numericAmount, fromCurrency, toCurrency, rateType, providerQuotes],
  );

  const effectiveRateSource = useMemo<RateSource>(
    () =>
      resolveEffectiveRateSourceForConversion({
        mode,
        requestedRateSource: rateSource,
        resolvedSourceKind: resolvedProvider.sourceKind,
        exchangeShopRate: selectedExchangeShopRate,
        providerSelectionMode: providerPreference.mode,
        isCardRateAllowed: isCardRateAvailableInContext,
      }),
    [
      mode,
      rateSource,
      resolvedProvider.sourceKind,
      selectedExchangeShopRate,
      providerPreference.mode,
      isCardRateAvailableInContext,
    ],
  );

  const multiExchangeShopCurrencies = useMemo((): CurrencyCode[] => {
    if (mode !== 'multi') return [];
    if (baseCurrency === 'TWD') return getSupportedExchangeShopCurrencies();
    return hasExchangeShopProvider(baseCurrency) ? [baseCurrency] : [];
  }, [mode, baseCurrency]);
  const { rates: multiMoneyBoxRates } = useMoneyBoxRatesMap(multiExchangeShopCurrencies);
  const multiExchangeShopRatesByCurrency = useMemo((): ExchangeShopRatesByCurrency => {
    return multiExchangeShopCurrencies.reduce<ExchangeShopRatesByCurrency>((acc, currency) => {
      const fallbackRate = buildFallbackExchangeShopRate(currency);
      if (fallbackRate) {
        acc[currency] = multiMoneyBoxRates[currency] ?? fallbackRate;
      }
      return acc;
    }, {});
  }, [multiExchangeShopCurrencies, multiMoneyBoxRates]);

  const pendingMultiRecalcRef = useRef<{ code: CurrencyCode; value: string } | null>(null);
  const multiRecalcFrameRef = useRef<number | null>(null);

  const cancelScheduledMultiRecalc = useCallback(() => {
    if (multiRecalcFrameRef.current !== null) {
      cancelAnimationFrame(multiRecalcFrameRef.current);
      multiRecalcFrameRef.current = null;
    }
  }, []);

  const getResolvedUnitRate = useCallback(
    (from: CurrencyCode, to: CurrencyCode): number => {
      const pairExchangeShopRate =
        mode === 'multi'
          ? getExchangeShopRateForPair(from, to, multiExchangeShopRatesByCurrency)
          : selectedExchangeShopRate;
      const effectiveSourceKind = resolveEffectiveRateSourceForConversion({
        mode,
        requestedRateSource: rateSource,
        resolvedSourceKind: resolvedProvider.sourceKind,
        exchangeShopRate: pairExchangeShopRate,
        providerSelectionMode: providerPreference.mode,
        isCardRateAllowed: isCardRateAvailableInContext,
      });
      const exchangeShopRate =
        effectiveSourceKind === 'exchange-shop' ? pairExchangeShopRate : null;
      const unitRate = getUnitExchangeRate(from, to, details, rateType, rateMode, exchangeRates, {
        rateSource: effectiveSourceKind,
        exchangeShopRate,
        cardFeePercent,
      });

      return unitRate;
    },
    [
      details,
      rateType,
      rateMode,
      exchangeRates,
      mode,
      rateSource,
      resolvedProvider.sourceKind,
      multiExchangeShopRatesByCurrency,
      selectedExchangeShopRate,
      providerPreference.mode,
      isCardRateAvailableInContext,
      cardFeePercent,
    ],
  );

  const convertAmount = useCallback(
    (amount: number, from: CurrencyCode, to: CurrencyCode): number =>
      amount * getResolvedUnitRate(from, to),
    [getResolvedUnitRate],
  );

  useEffect(() => {
    return () => {
      cancelScheduledMultiRecalc();
    };
  }, [cancelScheduledMultiRecalc]);

  useEffect(() => {
    if (history.length === 0) return;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const expired = history.some((entry) => entry.timestamp <= sevenDaysAgo);
    if (!expired) return;
    const valid = history.filter((entry) => entry.timestamp > sevenDaysAgo);
    useConverterStore.setState({ history: valid });
  }, [history]);
  const [lastEdited, setLastEdited] = useState<AmountField>('from');

  // Conversion calculations using convertCurrencyAmountWithMode
  const recalcMultiAmounts = useCallback(
    (
      sourceCode: CurrencyCode,
      sourceAmount: string,
      prev: MultiAmountsState,
    ): MultiAmountsState => {
      const amount = parseFloat(sourceAmount);
      const hasValue = !Number.isNaN(amount);

      logger.debug('Multi-currency calculation base', {
        sourceCode,
        amount,
      });

      return CURRENCY_CODES.reduce<MultiAmountsState>(
        (acc, code) => {
          if (code === sourceCode) {
            acc[code] = sourceAmount;
            return acc;
          }

          if (!hasValue) {
            acc[code] = '';
            return acc;
          }

          const converted = convertAmount(amount, sourceCode, code);

          if (converted === 0 && amount !== 0) {
            acc[code] = 'N/A';
            logger.warn(`No exchange rate available for ${code}`, { code });
            return acc;
          }

          const decimals = CURRENCY_DEFINITIONS[code].decimals;
          acc[code] = converted.toFixed(decimals);

          return acc;
        },
        { ...prev },
      );
    },
    [convertAmount],
  );

  const calculateFromAmount = useCallback(() => {
    const amount = parseFloat(fromAmount);
    if (Number.isNaN(amount)) {
      setToAmount('');
      return;
    }

    const converted = convertAmount(amount, fromCurrency, toCurrency);

    const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
    // 零值/缺匯率一律輸出正規化零字串（如 "0.00"），避免 padEnd 產生 "0000" 亂碼流入歷史記錄與剪貼簿。
    setToAmount(converted ? converted.toFixed(decimals) : (0).toFixed(decimals));
  }, [fromAmount, fromCurrency, toCurrency, convertAmount]);

  const calculateToAmount = useCallback(() => {
    const amount = parseFloat(toAmount);
    if (Number.isNaN(amount)) {
      setFromAmount('');
      return;
    }

    const unitRate = getResolvedUnitRate(fromCurrency, toCurrency);
    const converted = unitRate ? amount / unitRate : 0;

    const decimals = CURRENCY_DEFINITIONS[fromCurrency].decimals;
    setFromAmount(converted ? converted.toFixed(decimals) : (0).toFixed(decimals));
  }, [toAmount, fromCurrency, toCurrency, getResolvedUnitRate]);

  // 單幣別換算效果（路由決定顯示，無需依賴 mode 狀態）
  useEffect(() => {
    if (lastEdited === 'from') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 響應式計算，必須在依賴變更時同步更新
      calculateFromAmount();
    } else {
      calculateToAmount();
    }
  }, [
    lastEdited,
    fromAmount,
    toAmount,
    fromCurrency,
    toCurrency,
    calculateFromAmount,
    calculateToAmount,
  ]);

  useEffect(() => {
    if (mode !== 'multi') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 多幣別模式下響應式重新計算所有金額
    setMultiAmounts((prev) => recalcMultiAmounts(baseCurrency, prev[baseCurrency] ?? '0', prev));
  }, [mode, baseCurrency, recalcMultiAmounts]);

  // 換錢所可用性 SSOT：當前情境是否有任何幣別走換錢所匯率。
  // 單幣別：pair 必須是 TWD ↔ 換錢所支援幣（目前僅 KRW）。
  // 多幣別：基準幣為 TWD（顯示所有支援幣）或基準幣本身有 provider。
  const isExchangeShopAvailableInContext = useMemo<boolean>(
    () =>
      mode === 'multi' ? multiExchangeShopCurrencies.length > 0 : exchangeShopCurrency !== null,
    [mode, multiExchangeShopCurrencies, exchangeShopCurrency],
  );

  useEffect(() => {
    // 已選擇換錢所但目前情境無法支援時，自動回退銀行來源（透過 store action 收斂使用者設定）。
    // SSOT：單一 effect 取代過去 RateWise / MultiConverter 各自的重複 fallback。
    if (rateSource === 'exchange-shop' && !isExchangeShopAvailableInContext) {
      setRateSource('bank');
    }
    // 刷卡估算同理：flag off／多幣別／貨幣對不涉 TWD 時收斂回銀行。
    if (rateSource === 'card' && !isCardRateAvailableInContext) {
      setRateSource('bank');
    }
  }, [rateSource, isExchangeShopAvailableInContext, isCardRateAvailableInContext, setRateSource]);

  // Handlers
  const handleFromAmountChange = useCallback((value: string) => {
    setFromAmount(value);
    setLastEdited('from');
  }, []);

  const handleToAmountChange = useCallback((value: string) => {
    setToAmount(value);
    setLastEdited('to');
  }, []);

  const scheduleMultiRecalc = useCallback(
    (code: CurrencyCode, value: string) => {
      pendingMultiRecalcRef.current = { code, value };
      cancelScheduledMultiRecalc();

      const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
      if (!schedule) {
        const pending = pendingMultiRecalcRef.current;
        if (!pending) return;
        setMultiAmounts((prev) => recalcMultiAmounts(pending.code, pending.value, prev));
        return;
      }

      multiRecalcFrameRef.current = schedule(() => {
        const pending = pendingMultiRecalcRef.current;
        if (!pending) return;

        setMultiAmounts((prev) => {
          const start = performance.now();
          const next = recalcMultiAmounts(pending.code, pending.value, prev);
          const duration = performance.now() - start;
          if (duration > INP_LONG_TASK_THRESHOLD_MS) {
            logger.warn('Multi-currency recalculation exceeds budget', {
              duration,
              threshold: INP_LONG_TASK_THRESHOLD_MS,
              baseCurrency: pending.code,
            });
          }
          return next;
        });
      });
    },
    [cancelScheduledMultiRecalc, recalcMultiAmounts],
  );

  const handleMultiAmountChange = useCallback(
    (code: CurrencyCode, value: string) => {
      setBaseCurrency(code);
      scheduleMultiRecalc(code, value);
    },
    [scheduleMultiRecalc, setBaseCurrency],
  );

  const quickAmount = useCallback(
    (value: number) => {
      const strValue = value.toString();
      if (mode === 'single') {
        setFromAmount(strValue);
        setLastEdited('from');
      } else {
        handleMultiAmountChange(baseCurrency, strValue);
      }
    },
    [mode, baseCurrency, handleMultiAmountChange],
  );

  const swapCurrencies = useCallback(() => {
    storeSwapCurrencies(); // 幣別互換（atomic，在 store 中一次性更新）
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  }, [storeSwapCurrencies, toAmount, fromAmount]);

  const toggleFavorite = useCallback(
    (code: CurrencyCode) => {
      storeToggleFavorite(code);
    },
    [storeToggleFavorite],
  );

  /** 重新排序收藏貨幣（拖曳排序用） */
  const reorderFavorites = useCallback(
    (newOrder: CurrencyCode[]) => {
      storeReorderFavorites(newOrder);
      // Zustand persist middleware 自動處理 localStorage 同步，無需手動 writeJSON
    },
    [storeReorderFavorites],
  );

  // notify: false 供 v2 換算 settle 自動寫入（E8 缺口 2）；預設維持 v1 手動加入的 toast 回饋。
  const addToHistory = useCallback(
    (options?: { notify?: boolean }) => {
      const timestamp = Date.now();
      const entry: ConversionHistoryEntry = {
        from: fromCurrency,
        to: toCurrency,
        amount: fromAmount,
        result: toAmount,
        time: getRelativeTimeString(timestamp),
        timestamp,
        rateType,
        sourceKind: resolvedProvider.sourceKind,
        providerId: resolvedProvider.providerId,
        providerSelectionMode: resolvedProvider.selectionMode,
        rateMode,
        schemaVersion: 2,
      };

      storeAddToHistory(entry);
      if (options?.notify !== false) {
        showToast(t('singleConverter.addedToHistory'), 'success');
      }
    },
    [
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      rateType,
      resolvedProvider,
      rateMode,
      storeAddToHistory,
      showToast,
      t,
    ],
  );

  /** 清除全部歷史記錄 */
  const clearAllHistory = useCallback(() => {
    storeClearHistory();
  }, [storeClearHistory]);

  /** 從歷史記錄重新載入轉換參數 */
  const reconvertFromHistory = useCallback(
    (entry: ConversionHistoryEntry) => {
      setFromCurrency(entry.from);
      setToCurrency(entry.to);
      setFromAmount(entry.amount);
      setLastEdited('from');
      if (entry.schemaVersion === 2 && entry.rateType) {
        if (entry.rateMode) {
          setRateMode(entry.rateMode);
        }
        if (entry.sourceKind && entry.providerId) {
          setProviderPreference({
            mode: entry.providerSelectionMode ?? 'manual',
            manualProvider: {
              sourceKind: entry.sourceKind,
              providerId: entry.providerId,
            },
          });
        } else if (entry.sourceKind) {
          setRateSource(entry.sourceKind);
        }
        setRateType(entry.rateType);
      }
    },
    [
      setFromCurrency,
      setProviderPreference,
      setRateMode,
      setRateSource,
      setRateType,
      setToCurrency,
    ],
  );

  const sortedCurrencies = useMemo((): CurrencyCode[] => {
    // 基準幣永遠固定在第一位（不存於 favorites 陣列）
    const favWithoutBase = sanitizeFavorites(favorites).filter((c) => c !== DEFAULT_BASE_CURRENCY);
    const favSet = new Set(favWithoutBase);
    const remaining = CURRENCY_CODES.filter(
      (code) => code !== DEFAULT_BASE_CURRENCY && !favSet.has(code),
    ).sort();
    return [DEFAULT_BASE_CURRENCY, ...favWithoutBase, ...remaining];
  }, [favorites]);

  return {
    // State
    mode,
    rateMode,
    moneyBoxRate: selectedExchangeShopRate,
    exchangeShopCurrency,
    exchangeShopRatesByCurrency: multiExchangeShopRatesByCurrency,
    effectiveRateSource,
    resolvedProvider,
    providerQuotes,
    rankedProviderQuotes,
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    favorites,
    multiAmounts,
    baseCurrency,
    history,
    sortedCurrencies,
    isExchangeShopAvailableInContext,
    isCardRateAvailableInContext,
    multiExchangeShopCurrencies,

    // Setters
    setFromCurrency,
    setToCurrency,
    setBaseCurrency,

    // Handlers
    handleFromAmountChange,
    handleToAmountChange,
    handleMultiAmountChange,
    quickAmount,
    swapCurrencies,
    toggleFavorite,
    reorderFavorites,
    addToHistory,
    clearAllHistory,
    reconvertFromHistory,
  };
};
