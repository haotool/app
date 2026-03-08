import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CURRENCY_DEFINITIONS, DEFAULT_BASE_CURRENCY } from '../constants';
import type {
  AmountField,
  ConversionHistoryEntry,
  CurrencyCode,
  MultiAmountsState,
  RateType,
} from '../types';
import { readJSON, writeJSON } from '../storage';
import { STORAGE_KEYS } from '../storage-keys';
import type { RateDetails } from './useExchangeRates';
import { logger } from '../../../utils/logger';
import { getExchangeRate, convertCurrencyAmount } from '../../../utils/exchangeRateCalculation';
import { getRelativeTimeString } from '../../../utils/timeFormatter';
import { INP_LONG_TASK_THRESHOLD_MS } from '../../../utils/interactionBudget';
import { useToast } from '../../../components/Toast';
import { useConverterStore } from '../../../stores/converterStore';

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

interface UseCurrencyConverterOptions {
  exchangeRates?: Record<string, number | null>;
  details?: Record<string, RateDetails>;
  rateType?: RateType;
}

export const useCurrencyConverter = (options: UseCurrencyConverterOptions = {}) => {
  const { exchangeRates, details, rateType = 'spot' } = options;
  const { t } = useTranslation();
  const { showToast } = useToast();

  // 持久化狀態由 Zustand store 管理（含 localStorage persist middleware）
  const {
    fromCurrency,
    toCurrency,
    mode,
    favorites,
    setFromCurrency,
    setToCurrency,
    setMode,
    toggleFavorite: storeToggleFavorite,
    reorderFavorites: storeReorderFavorites,
    swapCurrencies: storeSwapCurrencies,
  } = useConverterStore();

  const [fromAmount, setFromAmount] = useState<string>('1000');
  const [toAmount, setToAmount] = useState<string>('');

  const [multiAmounts, setMultiAmounts] = useState<MultiAmountsState>(() =>
    createInitialMultiAmounts(DEFAULT_BASE_CURRENCY),
  );
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(DEFAULT_BASE_CURRENCY);

  const [history, setHistory] = useState<ConversionHistoryEntry[]>([]);

  const pendingMultiRecalcRef = useRef<{ code: CurrencyCode; value: string } | null>(null);
  const multiRecalcFrameRef = useRef<number | null>(null);

  const cancelScheduledMultiRecalc = useCallback(() => {
    if (multiRecalcFrameRef.current !== null) {
      cancelAnimationFrame(multiRecalcFrameRef.current);
      multiRecalcFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelScheduledMultiRecalc();
    };
  }, [cancelScheduledMultiRecalc]);

  // [feat:2025-12-26] 從 localStorage 恢復歷史記錄並過濾過期記錄（7 天）
  useEffect(() => {
    const storedHistory = readJSON<ConversionHistoryEntry[]>(STORAGE_KEYS.CONVERSION_HISTORY, []);

    // 過濾 7 天前的記錄
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const validHistory = storedHistory.filter((entry) => entry.timestamp > sevenDaysAgo);

    // 如果有過期記錄被過濾，更新 localStorage
    if (validHistory.length !== storedHistory.length) {
      writeJSON(STORAGE_KEYS.CONVERSION_HISTORY, validHistory);
    }

    // 只有當有歷史記錄時才更新 state
    if (validHistory.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration：必須在 effect 中從 localStorage 恢復用戶歷史記錄
      setHistory(validHistory);
    }
  }, []);
  const [lastEdited, setLastEdited] = useState<AmountField>('from');

  // Helper to get rate based on rateType (spot/cash)
  // Returns null if the rate is not available or invalid.
  const getRate = useCallback(
    (code: CurrencyCode): number | null => {
      return getExchangeRate(code, details, rateType, exchangeRates);
    },
    [exchangeRates, details, rateType],
  );

  // Conversion calculations using unified convertCurrencyAmount
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

          const converted = convertCurrencyAmount(
            amount,
            sourceCode,
            code,
            details,
            rateType,
            exchangeRates,
          );

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
    [details, rateType, exchangeRates],
  );

  const calculateFromAmount = useCallback(() => {
    const amount = parseFloat(fromAmount);
    const fromRate = getRate(fromCurrency);
    const toRate = getRate(toCurrency);

    if (Number.isNaN(amount) || fromRate === null || toRate === null) {
      setToAmount('');
      return;
    }

    const converted = (amount * fromRate) / toRate;
    const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
    setToAmount(converted ? converted.toFixed(decimals) : '0'.padEnd(decimals + 2, '0'));
  }, [fromAmount, fromCurrency, toCurrency, getRate]);

  const calculateToAmount = useCallback(() => {
    const amount = parseFloat(toAmount);
    const fromRate = getRate(fromCurrency);
    const toRate = getRate(toCurrency);

    if (Number.isNaN(amount) || fromRate === null || toRate === null) {
      setFromAmount('');
      return;
    }

    const converted = (amount * toRate) / fromRate;
    const decimals = CURRENCY_DEFINITIONS[fromCurrency].decimals;
    setFromAmount(converted ? converted.toFixed(decimals) : '0'.padEnd(decimals + 2, '0'));
  }, [toAmount, fromCurrency, toCurrency, getRate]);

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

  /**
   * 將當前轉換加入歷史記錄並顯示 Toast 通知
   */
  const addToHistory = useCallback(() => {
    const timestamp = Date.now();
    const entry: ConversionHistoryEntry = {
      from: fromCurrency,
      to: toCurrency,
      amount: fromAmount,
      result: toAmount,
      time: getRelativeTimeString(timestamp),
      timestamp,
    };

    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 10);
      writeJSON(STORAGE_KEYS.CONVERSION_HISTORY, updated);
      return updated;
    });

    showToast(t('singleConverter.addedToHistory'), 'success');
  }, [fromCurrency, toCurrency, fromAmount, toAmount, showToast, t]);

  /** 清除全部歷史記錄 */
  const clearAllHistory = useCallback(() => {
    setHistory([]);
    writeJSON(STORAGE_KEYS.CONVERSION_HISTORY, []);
  }, []);

  /** 從歷史記錄重新載入轉換參數 */
  const reconvertFromHistory = useCallback(
    (entry: ConversionHistoryEntry) => {
      setFromCurrency(entry.from);
      setToCurrency(entry.to);
      setFromAmount(entry.amount);
      setLastEdited('from');
    },
    [setFromCurrency, setToCurrency],
  );

  const sortedCurrencies = useMemo(() => {
    const orderedFavorites = sanitizeFavorites(favorites);
    const remaining = CURRENCY_CODES.filter((code) => !orderedFavorites.includes(code));
    return [...orderedFavorites, ...remaining];
  }, [favorites]);

  return {
    // State
    mode,
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
