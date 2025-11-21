import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getExchangeRate } from '../../../utils/exchangeRateCalculation';

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

const getTimeString = () =>
  new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

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
  const [mode, setMode] = useState<ConverterMode>(() =>
    readString(STORAGE_KEYS.CURRENCY_CONVERTER_MODE, 'single') === 'multi' ? 'multi' : 'single',
  );

  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(() =>
    sanitizeCurrency(
      readString(STORAGE_KEYS.FROM_CURRENCY, DEFAULT_FROM_CURRENCY),
      DEFAULT_FROM_CURRENCY,
    ),
  );

  const [toCurrency, setToCurrency] = useState<CurrencyCode>(() =>
    sanitizeCurrency(
      readString(STORAGE_KEYS.TO_CURRENCY, DEFAULT_TO_CURRENCY),
      DEFAULT_TO_CURRENCY,
    ),
  );

  const [fromAmount, setFromAmount] = useState<string>('1000');
  const [toAmount, setToAmount] = useState<string>('');

  const [favorites, setFavorites] = useState<CurrencyCode[]>(() =>
    sanitizeFavorites(readJSON<CurrencyCode[]>(STORAGE_KEYS.FAVORITES, [...DEFAULT_FAVORITES])),
  );

  const [multiAmounts, setMultiAmounts] = useState<MultiAmountsState>(() =>
    createInitialMultiAmounts(DEFAULT_BASE_CURRENCY),
  );
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(DEFAULT_BASE_CURRENCY);

  const [history, setHistory] = useState<ConversionHistoryEntry[]>([]);
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

  // Conversion calculations
  const recalcMultiAmounts = useCallback(
    (
      sourceCode: CurrencyCode,
      sourceAmount: string,
      prev: MultiAmountsState,
    ): MultiAmountsState => {
      const amount = parseFloat(sourceAmount);
      const hasValue = !Number.isNaN(amount);
      const sourceRate = getRate(sourceCode);

      // 開發模式：記錄基準貨幣匯率
      logger.debug('Multi-currency calculation base', {
        sourceCode,
        sourceRate,
        amount,
      });

      return CURRENCY_CODES.reduce<MultiAmountsState>(
        (acc, code) => {
          if (code === sourceCode) {
            acc[code] = sourceAmount;
            return acc;
          }

          if (!hasValue || sourceRate === null) {
            acc[code] = '';
            return acc;
          }

          const targetRate = getRate(code);
          if (targetRate === null) {
            acc[code] = 'N/A'; // Mark as Not Available
            // 開發模式：記錄無匯率的貨幣
            logger.warn(`No exchange rate available for ${code}`, { code });
            return acc;
          }

          const converted = (amount * sourceRate) / targetRate;
          const decimals = CURRENCY_DEFINITIONS[code].decimals;
          acc[code] = converted ? converted.toFixed(decimals) : '0'.padEnd(decimals + 2, '0');

          // 開發模式：記錄計算過程（僅 TWD）
          if (code === 'TWD') {
            logger.debug('Multi-currency conversion to TWD', {
              from: sourceCode,
              amount,
              sourceRate,
              targetRate,
              result: converted,
            });
          }

          return acc;
        },
        { ...prev },
      );
    },
    [getRate],
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

  // 暫時停用假趨勢生成，等待歷史匯率數據整合
  // TODO: 整合 exchangeRateHistoryService 提供真實趨勢數據
  const generateTrends = useCallback(() => {
    // 不再生成假數據，保持 null 狀態
    // 當歷史數據可用時，這裡應該從 exchangeRates 計算真實趨勢
  }, []);

  // Effects for calculations
  useEffect(() => {
    if (mode === 'single') {
      if (lastEdited === 'from') {
        calculateFromAmount();
      } else {
        calculateToAmount();
      }
    }
    generateTrends();
  }, [
    mode,
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

  const handleMultiAmountChange = useCallback(
    (code: CurrencyCode, value: string) => {
      setBaseCurrency(code);
      setMultiAmounts((prev) => recalcMultiAmounts(code, value, prev));
    },
    [recalcMultiAmounts],
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

  const addToHistory = () => {
    const entry: ConversionHistoryEntry = {
      from: fromCurrency,
      to: toCurrency,
      amount: fromAmount,
      result: toAmount,
      time: getTimeString(),
    };
    setHistory((prev) => [entry, ...prev].slice(0, 5));
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
    addToHistory,
    generateTrends,
  };
};
