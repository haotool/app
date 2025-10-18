import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { CURRENCY_DEFINITIONS, CURRENCY_QUICK_AMOUNTS } from '../constants';
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
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const swapButtonRef = useRef<HTMLButtonElement>(null);

  const fromRate = exchangeRates[fromCurrency] ?? 1;
  const toRate = exchangeRates[toCurrency] ?? 1;
  const exchangeRate = fromRate / toRate;
  const reverseRate = toRate / fromRate;

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

    // 重置動畫
    setTimeout(() => setIsSwapping(false), 600);
  };

  // 獲取當前目標貨幣的快速金額選項
  const quickAmounts = CURRENCY_QUICK_AMOUNTS[toCurrency] || CURRENCY_QUICK_AMOUNTS.TWD;

  // Load historical data for trend chart (並行獲取優化)
  useEffect(() => {
    async function loadTrend() {
      try {
        setLoadingTrend(true);
        const historicalData = await fetchHistoricalRatesRange(7);

        const data: MiniTrendDataPoint[] = historicalData
          .map((item) => {
            const fromRate = item.data.rates[fromCurrency] ?? 1;
            const toRate = item.data.rates[toCurrency] ?? 1;
            const rate = fromRate / toRate;

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
  }, [fromCurrency, toCurrency]);

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">轉換金額</label>
        <div className="relative">
          <select
            value={fromCurrency}
            onChange={(e) => onFromCurrencyChange(e.target.value as CurrencyCode)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-gray-100 rounded-lg px-2 py-1.5 text-base font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="選擇來源貨幣"
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
            className="w-full pl-32 pr-4 py-3 text-2xl font-bold border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
            placeholder="0.00"
            aria-label={`轉換金額 (${fromCurrency})`}
          />
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {(CURRENCY_QUICK_AMOUNTS[fromCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map((amount) => (
            <button
              key={amount}
              onClick={() => {
                onQuickAmount(amount);
                // 觸覺反饋
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className="px-3 py-1 bg-gray-100 hover:bg-blue-100 active:bg-blue-200 rounded-lg text-sm font-medium transition-all duration-200 transform active:scale-95 hover:scale-105 hover:shadow-md"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center mb-4">
        {/* 匯率卡片 - 懸停效果 - 移除 overflow-hidden 避免遮蔽 tooltip */}
        <div className="relative bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl mb-3 w-full group cursor-pointer hover:shadow-xl transition-all duration-500">
          {/* 光澤效果 */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl" />

          {/* 匯率資訊 - 上半部 */}
          <div className="relative text-center py-5 px-4 flex flex-col justify-center transition-all duration-300 group-hover:scale-[1.02] rounded-t-xl overflow-hidden">
            <div className="text-xs text-slate-600 mb-1 flex items-center justify-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">即時匯率</span>
            </div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2 transition-all duration-300 group-hover:scale-105">
              1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
            </div>
            <div className="text-sm text-slate-600 font-semibold opacity-80 group-hover:opacity-95 transition-opacity">
              1 {toCurrency} = {reverseRate.toFixed(4)} {fromCurrency}
            </div>
          </div>

          {/* 滿版趨勢圖 - 下半部 - 懸停放大 + 進場動畫 */}
          <div
            className={`relative w-full h-20 transition-all duration-500 group-hover:h-24 overflow-hidden rounded-b-xl ${
              showTrend ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
              <MiniTrendChart data={trendData} currencyCode={toCurrency} />
            </div>
            {/* 互動提示 */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-1 pointer-events-none">
              <span className="text-[10px] font-semibold text-slate-600">查看趨勢圖</span>
            </div>
          </div>
        </div>

        {/* 轉換按鈕 - 高級微互動 */}
        <div className="relative group/swap">
          {/* 外圍光環 */}
          <div
            className={`absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 rounded-full blur-md transition-all duration-500 ${
              isSwapping ? 'opacity-60 scale-125' : 'opacity-0 group-hover/swap:opacity-30'
            } animate-pulse`}
          />

          {/* 按鈕本體 */}
          <button
            ref={swapButtonRef}
            onClick={handleSwap}
            className={`relative p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg transition-all duration-500 transform hover:scale-110 active:scale-95 group-hover/swap:shadow-2xl ${
              isSwapping ? 'scale-95' : ''
            }`}
            aria-label="交換幣別"
            title="交換幣別"
            disabled={isSwapping}
          >
            {/* 背景脈動效果 */}
            <div
              className={`absolute inset-0 rounded-full bg-white transition-opacity duration-300 ${
                isSwapping ? 'opacity-30' : 'opacity-0 group-hover/swap:opacity-20'
              } animate-ping`}
            />

            {/* 圖示 - 點擊旋轉 */}
            <RefreshCw
              size={20}
              className={`relative z-10 transition-all duration-600 ${
                isSwapping ? 'rotate-180' : 'group-hover/swap:rotate-180'
              }`}
              style={{
                transform: isSwapping ? 'rotate(180deg)' : undefined,
              }}
            />

            {/* 點擊漣漪效果 */}
            <span
              className={`absolute inset-0 rounded-full bg-white transition-opacity duration-300 ${
                isSwapping ? 'opacity-30 animate-ping' : 'opacity-0'
              }`}
            />
          </button>

          {/* 懸停提示 */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/swap:opacity-100 transition-all duration-300 pointer-events-none">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap bg-white px-2 py-1 rounded-full shadow-md">
              點擊交換
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">轉換結果</label>
        <div className="relative">
          <select
            value={toCurrency}
            onChange={(e) => onToCurrencyChange(e.target.value as CurrencyCode)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-gray-100 rounded-lg px-2 py-1.5 text-base font-semibold border-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="選擇目標貨幣"
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
            className="w-full pl-32 pr-4 py-3 text-2xl font-bold border-2 border-purple-200 rounded-2xl bg-purple-50 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
            placeholder="0.00"
            aria-label={`轉換結果 (${toCurrency})`}
          />
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                // 直接設定目標貨幣金額，不需要轉換
                const decimals = CURRENCY_DEFINITIONS[toCurrency].decimals;
                onToAmountChange(amount.toFixed(decimals));
                // 觸覺反饋
                if ('vibrate' in navigator) {
                  navigator.vibrate(30);
                }
              }}
              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 active:bg-purple-300 rounded-lg text-sm font-medium transition-all duration-200 transform active:scale-95 hover:scale-105 hover:shadow-md"
            >
              {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onAddToHistory}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
      >
        加入歷史記錄
      </button>
    </>
  );
};
