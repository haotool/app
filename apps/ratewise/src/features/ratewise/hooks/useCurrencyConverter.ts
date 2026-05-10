import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CURRENCY_DEFINITIONS, DEFAULT_BASE_CURRENCY } from '../constants';
import type {
  AmountField,
  ConversionHistoryEntry,
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
import type { ResolvedRateProvider } from '../rateProviderTypes';
import {
  rankProviderQuotes,
  resolveProviderPreference,
  type ProviderQuote,
} from '../rateProviderRanking';
import { buildProviderQuotes } from '../rateProviderQuoteAdapters';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

const createInitialMultiAmounts = (
  baseCurrency: CurrencyCode,
  baseValue = '1000',
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
}

export function resolveEffectiveRateSourceForConversion({
  mode,
  requestedRateSource,
  resolvedSourceKind,
  exchangeShopRate,
}: {
  mode: 'single' | 'multi';
  requestedRateSource?: RateSource;
  resolvedSourceKind: RateSource;
  exchangeShopRate: ExchangeShopRate | null;
}): RateSource {
  if (mode !== 'multi') return resolvedSourceKind;
  return requestedRateSource === 'exchange-shop' && exchangeShopRate ? 'exchange-shop' : 'bank';
}

export const useCurrencyConverter = (options: UseCurrencyConverterOptions = {}) => {
  const { exchangeRates, details, rateType = 'spot', rateSource } = options;
  const { t } = useTranslation();
  const { showToast } = useToast();

  // 持久化狀態由 Zustand store 管理（含 localStorage persist middleware）
  const {
    fromCurrency,
    toCurrency,
    mode,
    rateMode,
    favorites,
    providerPreference,
    history,
    setFromCurrency,
    setToCurrency,
    setMode,
    setRateMode,
    setRateType,
    setRateSource,
    setProviderPreference,
    toggleFavorite: storeToggleFavorite,
    reorderFavorites: storeReorderFavorites,
    swapCurrencies: storeSwapCurrencies,
    addToHistory: storeAddToHistory,
    clearHistory: storeClearHistory,
  } = useConverterStore();

  const [fromAmount, setFromAmount] = useState<string>('1000');
  const [toAmount, setToAmount] = useState<string>('');

  const [multiAmounts, setMultiAmounts] = useState<MultiAmountsState>(() =>
    createInitialMultiAmounts(DEFAULT_BASE_CURRENCY),
  );
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(DEFAULT_BASE_CURRENCY);

  const exchangeShopCurrency = useMemo((): CurrencyCode | null => {
    if (fromCurrency === 'TWD' && hasExchangeShopProvider(toCurrency)) return toCurrency;
    if (toCurrency === 'TWD' && hasExchangeShopProvider(fromCurrency)) return fromCurrency;
    return null;
  }, [fromCurrency, toCurrency]);

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
        mode: 'single',
        requestedRateSource: rateSource,
        resolvedSourceKind: resolvedProvider.sourceKind,
        exchangeShopRate: selectedExchangeShopRate,
      }),
    [rateSource, resolvedProvider.sourceKind, selectedExchangeShopRate],
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
      });
      const exchangeShopRate =
        effectiveSourceKind === 'exchange-shop' ? pairExchangeShopRate : null;
      const unitRate = getUnitExchangeRate(from, to, details, rateType, rateMode, exchangeRates, {
        rateSource: effectiveSourceKind,
        exchangeShopRate,
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
    setToAmount(converted ? converted.toFixed(decimals) : '0'.padEnd(decimals + 2, '0'));
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
    setFromAmount(converted ? converted.toFixed(decimals) : '0'.padEnd(decimals + 2, '0'));
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
    [scheduleMultiRecalc],
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

  const addToHistory = useCallback(() => {
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
    showToast(t('singleConverter.addedToHistory'), 'success');
  }, [
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
  ]);

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
    return [DEFAULT_BASE_CURRENCY as CurrencyCode, ...favWithoutBase, ...remaining];
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

    // Setters
    setMode,
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
