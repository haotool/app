import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CURRENCY_DEFINITIONS,
  DEFAULT_BASE_CURRENCY,
  DEFAULT_FAVORITES,
  DEFAULT_FROM_CURRENCY,
  DEFAULT_TO_CURRENCY,
} from '../constants';
import type {
  AmountField,
  ConversionHistoryEntry,
  ConverterMode,
  CurrencyCode,
  MultiAmountsState,
  TrendState,
  RateType,
} from '../types';
import { readJSON, readString, writeJSON, writeString } from '../storage';
import { STORAGE_KEYS } from '../storage-keys';
import type { RateDetails } from './useExchangeRates';
import { logger } from '../../../utils/logger';
import { getExchangeRate, convertCurrencyAmount } from '../../../utils/exchangeRateCalculation';
import { getRelativeTimeString } from '../../../utils/timeFormatter';
import { INP_LONG_TASK_THRESHOLD_MS } from '../../../utils/interactionBudget';
import { useToast } from '../../../components/Toast';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

const isCurrencyCode = (value: string): value is CurrencyCode =>
  CURRENCY_CODES.includes(value as CurrencyCode);

const createInitialMultiAmounts = (
  baseCurrency: CurrencyCode,
  baseValue = '1000',
): MultiAmountsState => {
  return CURRENCY_CODES.reduce<MultiAmountsState>((acc, code) => {
    acc[code] = code === baseCurrency ? baseValue : '';
    return acc;
  }, {} as MultiAmountsState);
};

// 初始化趨勢狀態為 null（等待真實數據）
const seedTrends = (): TrendState =>
  CURRENCY_CODES.reduce<TrendState>((acc, code) => {
    acc[code] = null; // 使用 null 表示無數據，而非假數據
    return acc;
  }, {} as TrendState);

const sanitizeFavorites = (codes: CurrencyCode[]): CurrencyCode[] => {
  const unique = Array.from(new Set(codes));
  return unique.filter(isCurrencyCode);
};

const sanitizeCurrency = (candidate: string, fallback: CurrencyCode): CurrencyCode =>
  isCurrencyCode(candidate) ? candidate : fallback;

interface UseCurrencyConverterOptions {
  exchangeRates?: Record<string, number | null>;
  details?: Record<string, RateDetails>;
  rateType?: RateType;
}

export const useCurrencyConverter = (options: UseCurrencyConverterOptions = {}) => {
  const { exchangeRates, details, rateType = 'spot' } = options;
  const { t } = useTranslation();
  const { showToast } = useToast();

  // 使用固定初始值避免 SSR hydration mismatch，在 useEffect 中從 localStorage 恢復
  const [mode, setMode] = useState<ConverterMode>('single');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(DEFAULT_FROM_CURRENCY);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(DEFAULT_TO_CURRENCY);

  // Restore user preferences from localStorage after hydration
  useEffect(() => {
    const storedMode = readString(STORAGE_KEYS.CURRENCY_CONVERTER_MODE, 'single');
    if (storedMode === 'multi') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration：必須在 effect 中從 localStorage 恢復用戶偏好
      setMode('multi');
    }

    const storedFrom = readString(STORAGE_KEYS.FROM_CURRENCY, DEFAULT_FROM_CURRENCY);
    const storedTo = readString(STORAGE_KEYS.TO_CURRENCY, DEFAULT_TO_CURRENCY);
    setFromCurrency(sanitizeCurrency(storedFrom, DEFAULT_FROM_CURRENCY));
    setToCurrency(sanitizeCurrency(storedTo, DEFAULT_TO_CURRENCY));
  }, []);

  const [fromAmount, setFromAmount] = useState<string>('1000');
  const [toAmount, setToAmount] = useState<string>('');

  // Fixed initial value to avoid hydration mismatch
  const [favorites, setFavorites] = useState<CurrencyCode[]>([...DEFAULT_FAVORITES]);

  // Restore favorites from localStorage after hydration
  useEffect(() => {
    const storedFavorites = readJSON<CurrencyCode[]>(STORAGE_KEYS.FAVORITES, [
      ...DEFAULT_FAVORITES,
    ]);
    const sanitized = sanitizeFavorites(storedFavorites);
    // 只有當 localStorage 中的值與預設值不同時才更新
    if (JSON.stringify(sanitized) !== JSON.stringify(DEFAULT_FAVORITES)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration：必須在 effect 中從 localStorage 恢復用戶偏好
      setFavorites(sanitized);
    }
  }, []);

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
  const [trend] = useState<TrendState>(() => seedTrends()); // 暫時不更新趨勢，等待歷史數據整合
  const [lastEdited, setLastEdited] = useState<AmountField>('from');

  // Persist to localStorage
  useEffect(() => {
    writeString(STORAGE_KEYS.CURRENCY_CONVERTER_MODE, mode);
  }, [mode]);

  useEffect(() => {
    writeString(STORAGE_KEYS.FROM_CURRENCY, fromCurrency);
  }, [fromCurrency]);

  useEffect(() => {
    writeString(STORAGE_KEYS.TO_CURRENCY, toCurrency);
  }, [toCurrency]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.FAVORITES, favorites);
  }, [favorites]);

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

  // [2025-11-28] 趨勢圖數據已在 SingleConverter 組件中直接整合
  // 使用 exchangeRateHistoryService.fetchHistoricalRatesRange() 獲取真實數據
  // 此處保留空函數以維持 API 相容性
  const generateTrends = useCallback(() => {
    // No-op: 趨勢數據由 SingleConverter 直接管理
  }, []);

  // 單幣別換算效果（路由決定顯示，無需依賴 mode 狀態）
  useEffect(() => {
    if (lastEdited === 'from') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 響應式計算，必須在依賴變更時同步更新
      calculateFromAmount();
    } else {
      calculateToAmount();
    }
    generateTrends();
  }, [
    lastEdited,
    fromAmount,
    toAmount,
    fromCurrency,
    toCurrency,
    calculateFromAmount,
    calculateToAmount,
    generateTrends,
  ]);

  useEffect(() => {
    if (mode !== 'multi') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 多幣別模式下響應式重新計算所有金額
    setMultiAmounts((prev) => recalcMultiAmounts(baseCurrency, prev[baseCurrency] ?? '0', prev));
  }, [mode, baseCurrency, recalcMultiAmounts]);

  // Handlers
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setLastEdited('from');
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    setLastEdited('to');
  };

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

  const quickAmount = (value: number) => {
    const strValue = value.toString();
    if (mode === 'single') {
      setFromAmount(strValue);
      setLastEdited('from');
    } else {
      handleMultiAmountChange(baseCurrency, strValue);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const toggleFavorite = (code: CurrencyCode) => {
    setFavorites((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  };

  /** 重新排序收藏貨幣（拖曳排序用） */
  const reorderFavorites = (newOrder: CurrencyCode[]) => {
    setFavorites(newOrder);
    writeJSON(STORAGE_KEYS.FAVORITES, newOrder);
  };

  /**
   * Add current conversion to history with toast notification
   * 將當前轉換加入歷史記錄並顯示 Toast 通知
   */
  const addToHistory = () => {
    const timestamp = Date.now();
    const entry: ConversionHistoryEntry = {
      from: fromCurrency,
      to: toCurrency,
      amount: fromAmount,
      result: toAmount,
      time: getRelativeTimeString(timestamp),
      timestamp, // 完整時間戳記
    };

    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 10); // 增加至 10 條
      // 持久化到 localStorage
      writeJSON(STORAGE_KEYS.CONVERSION_HISTORY, updated);
      return updated;
    });

    // 顯示成功通知
    showToast(t('singleConverter.addedToHistory'), 'success');
  };

  // [feat:2025-12-26] 清除全部歷史記錄
  const clearAllHistory = () => {
    setHistory([]);
    writeJSON(STORAGE_KEYS.CONVERSION_HISTORY, []);
  };

  // [feat:2025-12-26] 從歷史記錄重新轉換
  const reconvertFromHistory = (entry: ConversionHistoryEntry) => {
    setFromCurrency(entry.from);
    setToCurrency(entry.to);
    setFromAmount(entry.amount);
    setLastEdited('from');
  };

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
    trend,
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
    generateTrends,
  };
};
