import type { ProviderQuote } from '../rateProviderRanking';
import { getRateProvider } from '../../../config/rateProviders';
import {
  estimate,
  estimateDerived,
  freshness,
  normalizeBankSnapshot,
  rankQuotes,
  isQuoteApplicable,
  type QuoteSnapshot,
  type EstimateRequest,
  type EstimateResult,
  type DerivedEstimateResult,
  type SelectionContext,
} from '@app/shared/fx';
import { useFxQuotes } from './useFxQuotes';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  type ExchangeShopRate,
  type ExchangeShopRatesByCurrency,
} from '../../../services/moneyboxRateService';
import { useMoneyBoxRates } from './useMoneyBoxRates';
import { useMoneyBoxRatesMap } from './useMoneyBoxRatesMap';
import type { ProviderSelectionMode } from '../rateProviderTypes';

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
    // fallback 是編譯期常數，沒有上游快照時間；null 使過期揭露不對它誤判年齡。
    timestamp: null,
    source: provider.source,
    sourceUrl: provider.sourceUrl,
    providerName: provider.providerName,
    isFallback: true,
  };
};

interface UseCurrencyConverterOptions {
  fxQuotes?: QuoteSnapshot[];
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
}: {
  mode: 'single' | 'multi';
  requestedRateSource?: RateSource;
  resolvedSourceKind: RateSource;
  exchangeShopRate: ExchangeShopRate | null;
  /** providerPreference.mode：'best' 模式下多幣別需依每個 row pair 的可用換錢所匯率決定來源。 */
  providerSelectionMode?: ProviderSelectionMode;
}): RateSource {
  if (mode !== 'multi') return resolvedSourceKind;
  // 多幣別 SSOT：使用者明選 exchange-shop 或 best 模式偵測到該 row 有換錢所匯率時走換錢所；
  // 否則 fallback 銀行（避免單幣別 single-pair resolvedSourceKind 跨 row 誤套用）。
  if (!exchangeShopRate) return 'bank';
  if (requestedRateSource === 'exchange-shop') return 'exchange-shop';
  if (providerSelectionMode === 'best') return 'exchange-shop';
  return 'bank';
}

export const useCurrencyConverter = (options: UseCurrencyConverterOptions = {}) => {
  const { rateType = DEFAULT_RATE_TYPE, rateSource, mode: requestedMode } = options;
  const fx = useFxQuotes(options.fxQuotes === undefined);
  const { t } = useTranslation();
  const { showToast } = useToast();

  const {
    fromCurrency,
    toCurrency,
    rateMode,
    favorites,
    providerPreference,
    serviceCountry,
    branchId,
    history,
    baseCurrency,
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

  const { rate: moneyBoxRate } = useMoneyBoxRates(exchangeShopCurrency);
  const fallbackExchangeShopRate = useMemo((): ExchangeShopRate | null => {
    if (!exchangeShopCurrency) return null;
    return buildFallbackExchangeShopRate(exchangeShopCurrency);
  }, [exchangeShopCurrency]);
  const selectedExchangeShopRate = moneyBoxRate ?? fallbackExchangeShopRate;

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

  const legacyFallbackQuotes = useMemo(() => {
    if (options.fxQuotes !== undefined || fx.quotes.length > 0 || !options.details) return [];
    const fetchedAt = new Date().toISOString();
    try {
      return normalizeBankSnapshot({
        timestamp: fetchedAt,
        sourcePublishedAt: null,
        dataKind: 'fixed_fallback',
        details: options.details,
      });
    } catch {
      return [];
    }
  }, [fx.quotes.length, options.details, options.fxQuotes]);
  const fxQuotes = options.fxQuotes ?? (fx.quotes.length > 0 ? fx.quotes : legacyFallbackQuotes);
  const providerStatuses = options.fxQuotes === undefined ? fx.providerStatuses : undefined;

  const pendingMultiRecalcRef = useRef<{ code: CurrencyCode; value: string } | null>(null);
  const multiRecalcFrameRef = useRef<number | null>(null);

  const cancelScheduledMultiRecalc = useCallback(() => {
    if (multiRecalcFrameRef.current !== null) {
      cancelAnimationFrame(multiRecalcFrameRef.current);
      multiRecalcFrameRef.current = null;
    }
  }, []);

  const getQuoteContext = useCallback(
    (): SelectionContext => ({
      now: new Date().toISOString(),
      country: serviceCountry,
      deliveryMethod: rateType === 'cash' ? 'cash' : 'account',
      channel: rateType === 'cash' ? 'branch' : 'online',
      ...(branchId ? { branchId } : {}),
    }),
    [serviceCountry, rateType, branchId],
  );

  const estimatePair = useCallback(
    (
      amount: string,
      from: CurrencyCode,
      to: CurrencyCode,
      inputMode: EstimateRequest['mode'] = 'EXACT_IN',
    ): EstimateResult | DerivedEstimateResult => {
      const request = { amount, fromCurrency: from, toCurrency: to, mode: inputMode };
      const context = getQuoteContext();
      const quote =
        providerPreference.mode === 'best'
          ? (rankQuotes(fxQuotes, request, context, providerStatuses)[0]?.quote ?? null)
          : (fxQuotes.find(
              (q) =>
                q.providerId === providerPreference.manualProvider?.providerId &&
                isQuoteApplicable(q, request, context),
            ) ?? null);
      if (quote || from === to || providerPreference.mode === 'best')
        return estimate(quote, request);
      const manualQuotes = fxQuotes.filter(
        (q) => q.providerId === providerPreference.manualProvider?.providerId,
      );
      for (const first of manualQuotes.filter((q) => q.fromCurrency === from)) {
        for (const second of manualQuotes.filter(
          (q) => q.fromCurrency === first.toCurrency && q.toCurrency === to,
        )) {
          const derived = estimateDerived(first, second, request);
          if (derived.status !== 'available' || derived.fromAmount === null) continue;
          const firstRequest = {
            fromCurrency: first.fromCurrency,
            toCurrency: first.toCurrency,
            amount: derived.fromAmount,
            mode: 'EXACT_IN' as const,
          };
          const intermediate = estimate(first, firstRequest);
          if (intermediate.toAmount === null || !isQuoteApplicable(first, firstRequest, context))
            continue;
          const secondRequest = {
            fromCurrency: second.fromCurrency,
            toCurrency: second.toCurrency,
            amount: intermediate.toAmount,
            mode: 'EXACT_IN' as const,
          };
          if (isQuoteApplicable(second, secondRequest, context)) return derived;
        }
      }
      return estimate(null, request);
    },
    [fxQuotes, providerPreference, getQuoteContext, providerStatuses],
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

          const result = estimatePair(sourceAmount, sourceCode, code);
          acc[code] = result.toAmount ?? 'N/A';

          return acc;
        },
        { ...prev },
      );
    },
    [estimatePair],
  );

  const calculateFromAmount = useCallback(() => {
    const result = estimatePair(fromAmount, fromCurrency, toCurrency);
    setToAmount(result.toAmount ?? '');
  }, [fromAmount, fromCurrency, toCurrency, estimatePair]);

  const calculateToAmount = useCallback(() => {
    const result = estimatePair(toAmount, fromCurrency, toCurrency, 'EXACT_OUT');
    setFromAmount(result.fromAmount ?? '');
  }, [toAmount, fromCurrency, toCurrency, estimatePair]);

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
    setLastEdited('from');
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
    const current = estimatePair(
      lastEdited === 'from' ? fromAmount : toAmount,
      fromCurrency,
      toCurrency,
      lastEdited === 'from' ? 'EXACT_IN' : 'EXACT_OUT',
    );
    if (current.status !== 'available') return;
    const snapshot = fxQuotes.find((q) => q.quoteId === current.quoteId);
    const timestamp = Date.now();
    const entry: ConversionHistoryEntry = {
      from: fromCurrency,
      to: toCurrency,
      amount: current.fromAmount ?? fromAmount,
      result: current.toAmount ?? toAmount,
      time: getRelativeTimeString(timestamp),
      timestamp,
      rateType,
      sourceKind:
        getRateProvider(snapshot?.providerId ?? '')?.sourceKind ??
        providerPreference.manualProvider?.sourceKind ??
        'bank',
      providerId: snapshot?.providerId ?? providerPreference.manualProvider?.providerId,
      providerSelectionMode: providerPreference.mode,
      rateMode: 'auto',
      schemaVersion: 3,
      quoteSnapshot: snapshot,
      derivedLegs:
        'legs' in current
          ? fxQuotes.filter((q) => current.legs.some((id) => id === q.quoteId))
          : undefined,
      releaseId: fx.releaseId,
      estimateMode: lastEdited === 'from' ? 'EXACT_IN' : 'EXACT_OUT',
      serviceCountry,
      branchId,
    };

    storeAddToHistory(entry);
    showToast(t('singleConverter.addedToHistory'), 'success');
  }, [
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    rateType,
    providerPreference,
    storeAddToHistory,
    estimatePair,
    fxQuotes,
    fx.releaseId,
    lastEdited,
    serviceCountry,
    branchId,
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
      setToAmount(entry.result);
      setLastEdited(entry.estimateMode === 'EXACT_OUT' ? 'to' : 'from');
      if (entry.serviceCountry)
        useConverterStore.getState().setServiceCountry(entry.serviceCountry);
      if (entry.branchId) useConverterStore.getState().setBranchId(entry.branchId);
      if ((entry.schemaVersion === 2 || entry.schemaVersion === 3) && entry.rateType) {
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

  const fxEstimate = estimatePair(
    lastEdited === 'from' ? fromAmount : toAmount,
    fromCurrency,
    toCurrency,
    lastEdited === 'from' ? 'EXACT_IN' : 'EXACT_OUT',
  );
  const selectedQuote = fxQuotes.find((q) => q.quoteId === fxEstimate.quoteId) ?? null;
  const selectedQuoteEvidence =
    'legs' in fxEstimate
      ? fxEstimate.legs.flatMap((id) => fxQuotes.filter((quote) => quote.quoteId === id))
      : selectedQuote
        ? [selectedQuote]
        : [];
  const evidenceStates = selectedQuoteEvidence.map((quote) =>
    freshness(quote, new Date().toISOString()),
  );
  const estimateFreshness = evidenceStates.includes('stale')
    ? 'stale'
    : evidenceStates.length === 0 || evidenceStates.includes('unknown')
      ? 'unknown'
      : 'fresh';
  const effectiveSource =
    getRateProvider(selectedQuote?.providerId ?? '')?.sourceKind ?? rateSource ?? 'bank';
  const activeRequest: EstimateRequest = {
    amount: lastEdited === 'from' ? fromAmount : toAmount,
    fromCurrency,
    toCurrency,
    mode: lastEdited === 'from' ? 'EXACT_IN' : 'EXACT_OUT',
  };
  const activeContext = getQuoteContext();
  // Numeric compatibility fields are presentation-only; monetary ranking stays decimal.
  const presentQuote = (quote: QuoteSnapshot, result: EstimateResult): ProviderQuote => {
    const sourceKind = getRateProvider(quote.providerId)?.sourceKind ?? 'bank';
    return {
      provider: { providerId: quote.providerId, sourceKind },
      sourceKind,
      rateType: quote.sourceQuote.deliveryMethod === 'cash' ? 'cash' : 'spot',
      unitRate: Number(result.rate ?? 0),
      resultAmount: Number(
        (activeRequest.mode === 'EXACT_IN' ? result.toAmount : result.fromAmount) ?? 0,
      ),
      isAvailable: result.status === 'available',
      inputMode: activeRequest.mode,
    };
  };
  const providerQuotes = fxQuotes
    .filter((quote) => isQuoteApplicable(quote, activeRequest, activeContext))
    .map((quote) => presentQuote(quote, estimate(quote, activeRequest)));
  const rankedProviderQuotes = rankQuotes(
    fxQuotes,
    activeRequest,
    activeContext,
    providerStatuses,
  ).map(({ quote, estimate: result }) => presentQuote(quote, result));
  return {
    // State
    fxQuotes,
    estimatePair,
    fxEstimate,
    selectedQuote,
    selectedProviderStatus:
      providerStatuses?.get(selectedQuoteEvidence[0]?.providerId ?? '') ?? null,
    providerStatuses,
    selectedQuoteEvidence,
    estimateFreshness,
    mode,
    rateMode,
    moneyBoxRate: selectedExchangeShopRate,
    exchangeShopCurrency,
    exchangeShopRatesByCurrency: multiExchangeShopRatesByCurrency,
    effectiveRateSource: effectiveSource,
    resolvedProvider: {
      sourceKind: effectiveSource,
      providerId: selectedQuote?.providerId ?? providerPreference.manualProvider?.providerId ?? '',
      selectionMode: providerPreference.mode,
      reason: providerPreference.mode === 'best' ? 'best-rate' : 'manual',
    },
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
