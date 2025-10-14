import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { CURRENCY_DEFINITIONS, QUICK_AMOUNTS } from '../constants';
import type { CurrencyCode } from '../types';
import { MiniTrendChart, type MiniTrendDataPoint } from './MiniTrendChart';
import { fetchHistoricalRatesRange } from '../../../services/exchangeRateHistoryService';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

interface SingleConverterProps {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: string;
  toAmount: string;
  exchangeRates: Record<CurrencyCode, number | null>;
  onFromCurrencyChange: (currency: CurrencyCode) => void;
  onToCurrencyChange: (currency: CurrencyCode) => void;
  onFromAmountChange: (amount: string) => void;
  onToAmountChange: (amount: string) => void;
  onQuickAmount: (amount: number) => void;
  onSwapCurrencies: () => void;
  onAddToHistory: () => void;
}

export const SingleConverter = ({
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  exchangeRates,
  onFromCurrencyChange,
  onToCurrencyChange,
  onFromAmountChange,
  onToAmountChange,
  onQuickAmount,
  onSwapCurrencies,
  onAddToHistory,
}: SingleConverterProps) => {
  const [trendData, setTrendData] = useState<MiniTrendDataPoint[]>([]);
  const [_loadingTrend, setLoadingTrend] = useState(false);

  const fromRate = exchangeRates[fromCurrency] ?? 1;
  const toRate = exchangeRates[toCurrency] ?? 1;
  const exchangeRate = fromRate / toRate;
  const reverseRate = toRate / fromRate;

  // Load historical data for trend chart
  useEffect(() => {
    async function loadTrend() {
      try {
        setLoadingTrend(true);
        const historicalData = await fetchHistoricalRatesRange(7);

        const data: MiniTrendDataPoint[] = historicalData
          .map((item) => {
            const rate = item.data.rates[toCurrency];
            if (!rate) return null;

            return {
              date: item.date.slice(5), // MM-DD
              rate,
            };
          })
          .filter((item): item is MiniTrendDataPoint => item !== null)
          .reverse();

        setTrendData(data);
      } catch {
        setTrendData([]);
      } finally {
        setLoadingTrend(false);
      }
    }

    void loadTrend();
  }, [toCurrency]);

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">轉換金額</label>
        <div className="relative">
          <select
            value={fromCurrency}
            onChange={(e) => onFromCurrencyChange(e.target.value as CurrencyCode)}
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
            onChange={(e) => onFromAmountChange(e.target.value)}
            className="w-full pl-32 pr-4 py-3 text-2xl font-bold border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 transition"
            placeholder="0.00"
          />
        </div>
        <div className="flex gap-2 mt-2">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => onQuickAmount(amount)}
              className="px-3 py-1 bg-gray-100 hover:bg-blue-100 rounded-lg text-sm font-medium transition"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center mb-4">
        <div className="relative bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl overflow-hidden mb-3 w-full">
          {/* 匯率資訊 - 上半部 1:1 */}
          <div className="text-center p-4 flex flex-col justify-center h-24">
            <div className="text-xs text-gray-600 mb-1">即時匯率</div>
            <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
              1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
            </div>
            <div className="text-xs text-gray-700 font-medium">
              1 {toCurrency} = {reverseRate.toFixed(4)} {fromCurrency}
            </div>
          </div>

          {/* 滿版趨勢圖 - 下半部 1:1 */}
          <div className="w-full h-24">
            <MiniTrendChart data={trendData} />
          </div>
        </div>
        <button
          onClick={onSwapCurrencies}
          className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 hover:rotate-180 active:scale-95"
          aria-label="交換幣別"
          title="交換幣別"
        >
          <RefreshCw size={20} className="transition-transform duration-300" />
        </button>
      </div>

      <div className="mb-4 flex-grow">
        <label className="block text-sm font-medium text-gray-700 mb-2">轉換結果</label>
        <div className="relative">
          <select
            value={toCurrency}
            onChange={(e) => onToCurrencyChange(e.target.value as CurrencyCode)}
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
            onChange={(e) => onToAmountChange(e.target.value)}
            className="w-full pl-32 pr-4 py-3 text-2xl font-bold border-2 border-purple-200 rounded-2xl bg-purple-50 focus:outline-none focus:border-purple-500 transition"
            placeholder="0.00"
          />
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                const convertedValue = (amount * fromRate) / toRate;
                const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
                onToAmountChange(convertedValue.toFixed(decimals));
              }}
              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded-lg text-sm font-medium transition"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onAddToHistory}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105 mt-auto"
      >
        加入歷史記錄
      </button>
    </>
  );
};
