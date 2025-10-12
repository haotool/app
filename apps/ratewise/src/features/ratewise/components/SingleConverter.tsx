import { RefreshCw } from 'lucide-react';
import { CURRENCY_DEFINITIONS, QUICK_AMOUNTS } from '../constants';
import type { CurrencyCode } from '../types';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

interface SingleConverterProps {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: string;
  toAmount: string;
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
  onFromCurrencyChange,
  onToCurrencyChange,
  onFromAmountChange,
  onToAmountChange,
  onQuickAmount,
  onSwapCurrencies,
  onAddToHistory,
}: SingleConverterProps) => {
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
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-3 mb-3 w-full">
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-0.5">即時匯率</div>
            <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              1 {fromCurrency} ={' '}
              {(
                CURRENCY_DEFINITIONS[fromCurrency].rate / CURRENCY_DEFINITIONS[toCurrency].rate
              ).toFixed(4)}{' '}
              {toCurrency}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              1 {toCurrency} ={' '}
              {(
                CURRENCY_DEFINITIONS[toCurrency].rate / CURRENCY_DEFINITIONS[fromCurrency].rate
              ).toFixed(4)}{' '}
              {fromCurrency}
            </div>
          </div>
        </div>
        <button
          onClick={onSwapCurrencies}
          className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-lg transition transform hover:scale-110"
          aria-label="交換幣別"
          title="交換幣別"
        >
          <RefreshCw size={20} />
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
