import { useCallback, useEffect, useMemo, useState } from 'react';
import { Grid, Maximize2, RefreshCw, Star, TrendingDown, TrendingUp } from 'lucide-react';
import {
  CURRENCY_DEFINITIONS,
  DEFAULT_BASE_CURRENCY,
  DEFAULT_FAVORITES,
  DEFAULT_FROM_CURRENCY,
  DEFAULT_TO_CURRENCY,
  QUICK_AMOUNTS,
} from './constants';
import type {
  AmountField,
  ConversionHistoryEntry,
  ConverterMode,
  CurrencyCode,
  MultiAmountsState,
  TrendDirection,
  TrendState,
} from './types';
import { readJSON, readString, writeJSON, writeString } from './storage';

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

const RateWise = () => {
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

  const recalcMultiAmounts = useCallback(
    (
      sourceCode: CurrencyCode,
      sourceAmount: string,
      prev: MultiAmountsState,
    ): MultiAmountsState => {
      const amount = parseFloat(sourceAmount);
      const hasValue = !Number.isNaN(amount);
      const sourceRate = CURRENCY_DEFINITIONS[sourceCode].rate;

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

          const targetRate = CURRENCY_DEFINITIONS[code].rate;
          const converted = (amount * sourceRate) / targetRate;
          acc[code] = converted ? converted.toFixed(2) : '0.00';
          return acc;
        },
        { ...prev },
      );
    },
    [],
  );

  const calculateFromAmount = useCallback(() => {
    const amount = parseFloat(fromAmount);
    if (Number.isNaN(amount)) {
      setToAmount('');
      return;
    }
    const fromRate = CURRENCY_DEFINITIONS[fromCurrency].rate;
    const toRate = CURRENCY_DEFINITIONS[toCurrency].rate;
    const converted = (amount * fromRate) / toRate;
    setToAmount(converted ? converted.toFixed(2) : '0.00');
  }, [fromAmount, fromCurrency, toCurrency]);

  const calculateToAmount = useCallback(() => {
    const amount = parseFloat(toAmount);
    if (Number.isNaN(amount)) {
      setFromAmount('');
      return;
    }
    const fromRate = CURRENCY_DEFINITIONS[fromCurrency].rate;
    const toRate = CURRENCY_DEFINITIONS[toCurrency].rate;
    const converted = (amount * toRate) / fromRate;
    setFromAmount(converted ? converted.toFixed(2) : '0.00');
  }, [toAmount, fromCurrency, toCurrency]);

  const generateTrends = useCallback(() => {
    setTrend(() =>
      CURRENCY_CODES.reduce<TrendState>((acc, code) => {
        const direction: TrendDirection = Math.random() > 0.5 ? 'up' : 'down';
        acc[code] = direction;
        return acc;
      }, {} as TrendState),
    );
  }, []);

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

  const modeToggleButton = (
    <div className="inline-flex bg-gray-100 rounded-xl p-1">
      <button
        onClick={() => setMode('single')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          mode === 'single'
            ? 'bg-white text-blue-600 shadow-md'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <Maximize2 size={18} />
        <span className="text-sm font-medium">單幣別</span>
      </button>
      <button
        onClick={() => setMode('multi')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          mode === 'multi'
            ? 'bg-white text-purple-600 shadow-md'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <Grid size={18} />
        <span className="text-sm font-medium">多幣別</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
            好工具匯率
          </h1>
          <p className="text-sm text-gray-600">即時匯率換算 · 精準可靠</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:h-auto h-[calc(100vh-180px)] flex flex-col">
              <div className="flex justify-center mb-4">{modeToggleButton}</div>

              {mode === 'single' ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">轉換金額</label>
                    <div className="relative">
                      <select
                        value={fromCurrency}
                        onChange={(event) =>
                          setFromCurrency(
                            sanitizeCurrency(event.target.value, DEFAULT_FROM_CURRENCY),
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-gray-100 rounded-lg px-2 py-1.5 text-base font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CURRENCY_CODES.map((code) => (
                          <option key={code} value={code}>
                            {CURRENCY_DEFINITIONS[code].flag} {code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={fromAmount}
                        onChange={(event) => handleFromAmountChange(event.target.value)}
                        className="w-full pl-32 pr-4 py-3 text-2xl font-bold border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 transition"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {QUICK_AMOUNTS.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => quickAmount(amount)}
                          className="px-3 py-1 bg-gray-100 hover:bg-blue-100 rounded-lg text-sm font-medium transition"
                        >
                          {amount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center mb-4">
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-3 mb-3 w-full">
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-0.5">即時匯率</div>
                        <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                          1 {fromCurrency} ={' '}
                          {(
                            CURRENCY_DEFINITIONS[fromCurrency].rate /
                            CURRENCY_DEFINITIONS[toCurrency].rate
                          ).toFixed(4)}{' '}
                          {toCurrency}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          1 {toCurrency} ={' '}
                          {(
                            CURRENCY_DEFINITIONS[toCurrency].rate /
                            CURRENCY_DEFINITIONS[fromCurrency].rate
                          ).toFixed(4)}{' '}
                          {fromCurrency}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={swapCurrencies}
                      className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg transition transform hover:scale-110"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>

                  <div className="mb-4 flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-2">轉換結果</label>
                    <div className="relative">
                      <select
                        value={toCurrency}
                        onChange={(event) =>
                          setToCurrency(sanitizeCurrency(event.target.value, DEFAULT_TO_CURRENCY))
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-gray-100 rounded-lg px-2 py-1.5 text-base font-semibold border-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {CURRENCY_CODES.map((code) => (
                          <option key={code} value={code}>
                            {CURRENCY_DEFINITIONS[code].flag} {code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={toAmount}
                        onChange={(event) => handleToAmountChange(event.target.value)}
                        className="w-full pl-32 pr-4 py-3 text-2xl font-bold border-2 border-purple-200 rounded-2xl bg-purple-50 focus:outline-none focus:border-purple-500 transition"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <button
                    onClick={addToHistory}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105 mt-auto"
                  >
                    加入歷史記錄
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      即時多幣別換算{' '}
                      <span className="text-xs text-gray-500">（點擊 ⭐ 可加入常用）</span>
                    </label>
                    <div className="flex gap-2 mb-3">
                      {QUICK_AMOUNTS.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => quickAmount(amount)}
                          className="px-3 py-1 bg-gray-100 hover:bg-blue-100 rounded-lg text-sm font-medium transition"
                        >
                          {amount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {sortedCurrencies.map((code) => {
                      const isFavorite = favorites.includes(code);
                      return (
                        <div
                          key={code}
                          className={`flex items-center justify-between p-3 rounded-xl transition ${
                            isFavorite
                              ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200'
                              : 'bg-gradient-to-r from-blue-50 to-purple-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                              onClick={() => toggleFavorite(code)}
                              className="hover:scale-110 transition"
                              type="button"
                            >
                              <Star
                                className={isFavorite ? 'text-yellow-500' : 'text-gray-300'}
                                size={18}
                                fill={isFavorite ? 'currentColor' : 'none'}
                              />
                            </button>
                            <span className="text-2xl">{CURRENCY_DEFINITIONS[code].flag}</span>
                            <div>
                              <div className="font-semibold text-gray-800">{code}</div>
                              <div className="text-xs text-gray-600">
                                {CURRENCY_DEFINITIONS[code].name}
                              </div>
                            </div>
                          </div>
                          <div className="flex-grow ml-3">
                            <input
                              type="number"
                              value={multiAmounts[code] ?? ''}
                              onChange={(event) =>
                                handleMultiAmountChange(code, event.target.value)
                              }
                              className={`w-full text-right px-3 py-2 text-lg font-bold rounded-lg border-2 transition focus:outline-none ${
                                baseCurrency === code
                                  ? 'border-purple-400 bg-white focus:border-purple-600'
                                  : 'border-transparent bg-white/50 focus:border-blue-400'
                              }`}
                              placeholder="0.00"
                            />
                            <div className="text-xs text-right text-gray-500 mt-0.5">
                              1 TWD = {(1 / CURRENCY_DEFINITIONS[code].rate).toFixed(6)} {code}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {history.length > 0 && mode === 'single' && (
              <div className="bg-white rounded-3xl shadow-xl p-6 mt-4 md:mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">轉換歷史</h3>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={`${item.time}-${item.amount}-${item.to}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{item.time}</span>
                        <span className="font-semibold">
                          {item.amount} {item.from}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-semibold text-purple-600">
                          {item.result} {item.to}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="text-yellow-500" size={20} fill="currentColor" />
                <h3 className="text-xl font-bold text-gray-800">常用貨幣</h3>
              </div>
              <div className="space-y-2">
                {favorites.map((code) => (
                  <div
                    key={`fav-${code}`}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{CURRENCY_DEFINITIONS[code].flag}</span>
                      <div>
                        <div className="font-semibold text-gray-800">{code}</div>
                        <div className="text-xs text-gray-600">
                          {CURRENCY_DEFINITIONS[code].name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trend[code] === 'up' ? (
                        <TrendingUp className="text-green-500" size={16} />
                      ) : (
                        <TrendingDown className="text-red-500" size={16} />
                      )}
                      <span className="text-sm font-medium">
                        {CURRENCY_DEFINITIONS[code].rate.toFixed(4)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">全部幣種</h3>
                <button
                  onClick={generateTrends}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  type="button"
                >
                  <RefreshCw size={16} className="text-gray-600" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {CURRENCY_CODES.map((code) => (
                  <div
                    key={`list-${code}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                    onClick={() => toggleFavorite(code)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CURRENCY_DEFINITIONS[code].flag}</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{code}</div>
                        <div className="text-xs text-gray-500">
                          {CURRENCY_DEFINITIONS[code].name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trend[code] === 'up' ? (
                        <TrendingUp className="text-green-500" size={14} />
                      ) : (
                        <TrendingDown className="text-red-500" size={14} />
                      )}
                      <span className="text-sm">{CURRENCY_DEFINITIONS[code].rate.toFixed(4)}</span>
                      {favorites.includes(code) && (
                        <Star className="text-yellow-500" size={14} fill="currentColor" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-8 text-center text-xs md:text-sm text-gray-500">
          <p>匯率資料參考台灣銀行牌告匯率（本行賣出現金），實際交易請以銀行公告為準</p>
        </div>
      </div>
    </div>
  );
};

export default RateWise;
