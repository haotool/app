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
  TrendDirection,
  TrendState,
} from '../types';
import { readJSON, readString, writeJSON, writeString } from '../storage';

const STORAGE_KEYS = {
  mode: 'currencyConverterMode',
  from: 'fromCurrency',
  to: 'toCurrency',
  favorites: 'favorites',
} as const;

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

const seedTrends = (): TrendState =>
  CURRENCY_CODES.reduce<TrendState>((acc, code) => {
    acc[code] = Math.random() > 0.5 ? 'up' : 'down';
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
  exchangeRates?: Record<string, number>;
}

export const useCurrencyConverter = (options: UseCurrencyConverterOptions = {}) => {
  const { exchangeRates } = options;
  const [mode, setMode] = useState<ConverterMode>(() =>
    readString(STORAGE_KEYS.mode, 'single') === 'multi' ? 'multi' : 'single',
  );

  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(() =>
    sanitizeCurrency(readString(STORAGE_KEYS.from, DEFAULT_FROM_CURRENCY), DEFAULT_FROM_CURRENCY),
  );

  const [toCurrency, setToCurrency] = useState<CurrencyCode>(() =>
    sanitizeCurrency(readString(STORAGE_KEYS.to, DEFAULT_TO_CURRENCY), DEFAULT_TO_CURRENCY),
  );

  const [fromAmount, setFromAmount] = useState<string>('1000');
  const [toAmount, setToAmount] = useState<string>('');

  const [favorites, setFavorites] = useState<CurrencyCode[]>(() =>
    sanitizeFavorites(readJSON<CurrencyCode[]>(STORAGE_KEYS.favorites, [...DEFAULT_FAVORITES])),
  );

  const [multiAmounts, setMultiAmounts] = useState<MultiAmountsState>(() =>
    createInitialMultiAmounts(DEFAULT_BASE_CURRENCY),
  );
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(DEFAULT_BASE_CURRENCY);

  const [history, setHistory] = useState<ConversionHistoryEntry[]>([]);
  const [trend, setTrend] = useState<TrendState>(() => seedTrends());
  const [lastEdited, setLastEdited] = useState<AmountField>('from');

  // Persist to localStorage
  useEffect(() => {
    writeString(STORAGE_KEYS.mode, mode);
  }, [mode]);

  useEffect(() => {
    writeString(STORAGE_KEYS.from, fromCurrency);
  }, [fromCurrency]);

  useEffect(() => {
    writeString(STORAGE_KEYS.to, toCurrency);
  }, [toCurrency]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  // Helper to get rate. It relies on the exchangeRates prop.
  // If a rate is missing, it defaults to 1 to avoid breaking calculations.
  const getRate = useCallback(
    (code: CurrencyCode): number => {
      return (exchangeRates && exchangeRates[code]) || 1;
    },
    [exchangeRates],
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

          const targetRate = getRate(code);
          const converted = (amount * sourceRate) / targetRate;
          acc[code] = converted ? converted.toFixed(2) : '0.00';
          return acc;
        },
        { ...prev },
      );
    },
    [getRate],
  );

  const calculateFromAmount = useCallback(() => {
    const amount = parseFloat(fromAmount);
    if (Number.isNaN(amount)) {
      setToAmount('');
      return;
    }
    const fromRate = getRate(fromCurrency);
    const toRate = getRate(toCurrency);
    const converted = (amount * fromRate) / toRate;
    setToAmount(converted ? converted.toFixed(2) : '0.00');
  }, [fromAmount, fromCurrency, toCurrency, getRate]);

  const calculateToAmount = useCallback(() => {
    const amount = parseFloat(toAmount);
    if (Number.isNaN(amount)) {
      setFromAmount('');
      return;
    }
    const fromRate = getRate(fromCurrency);
    const toRate = getRate(toCurrency);
    const converted = (amount * toRate) / fromRate;
    setFromAmount(converted ? converted.toFixed(2) : '0.00');
  }, [toAmount, fromCurrency, toCurrency, getRate]);

  const generateTrends = useCallback(() => {
    setTrend(() =>
      CURRENCY_CODES.reduce<TrendState>((acc, code) => {
        const direction: TrendDirection = Math.random() > 0.5 ? 'up' : 'down';
        acc[code] = direction;
        return acc;
      }, {} as TrendState),
    );
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
