import { Star } from 'lucide-react';
import { CURRENCY_DEFINITIONS, CURRENCY_QUICK_AMOUNTS } from '../constants';
import type { CurrencyCode, MultiAmountsState } from '../types';

interface MultiConverterProps {
  sortedCurrencies: CurrencyCode[];
  multiAmounts: MultiAmountsState;
  baseCurrency: CurrencyCode;
  favorites: CurrencyCode[];
  onAmountChange: (code: CurrencyCode, value: string) => void;
  onQuickAmount: (amount: number) => void;
  onToggleFavorite: (code: CurrencyCode) => void;
}

export const MultiConverter = ({
  sortedCurrencies,
  multiAmounts,
  baseCurrency,
  favorites,
  onAmountChange,
  onQuickAmount,
  onToggleFavorite,
}: MultiConverterProps) => {
  return (
    <>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          即時多幣別換算 <span className="text-xs text-gray-500">（點擊 ⭐ 可加入常用）</span>
        </label>
        <div className="flex gap-2 mb-3 flex-wrap">
          {(CURRENCY_QUICK_AMOUNTS[baseCurrency] || CURRENCY_QUICK_AMOUNTS.TWD).map(
            (amount: number) => (
              <button
                key={amount}
                onClick={() => onQuickAmount(amount)}
                className="px-3 py-1 bg-gray-100 hover:bg-blue-100 rounded-lg text-sm font-medium transition"
              >
                {amount.toLocaleString()}
              </button>
            ),
          )}
        </div>
      </div>

      <div
        className="flex-grow overflow-y-auto space-y-2 pr-2"
        tabIndex={0}
        role="region"
        aria-label="貨幣列表"
      >
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
                  onClick={() => onToggleFavorite(code)}
                  className="hover:scale-110 transition"
                  type="button"
                  aria-label={isFavorite ? `移除常用貨幣 ${code}` : `加入常用貨幣 ${code}`}
                  title={isFavorite ? `移除常用貨幣 ${code}` : `加入常用貨幣 ${code}`}
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
                  <div className="text-xs text-gray-600">{CURRENCY_DEFINITIONS[code].name}</div>
                </div>
              </div>
              <div className="flex-grow ml-3">
                <input
                  type="number"
                  value={multiAmounts[code] ?? ''}
                  onChange={(e) => onAmountChange(code, e.target.value)}
                  className={`w-full text-right px-3 py-2 text-lg font-bold rounded-lg border-2 transition focus:outline-none ${
                    baseCurrency === code
                      ? 'border-purple-400 bg-white focus:border-purple-600'
                      : 'border-transparent bg-white/50 focus:border-blue-400'
                  }`}
                  placeholder="0.00"
                  aria-label={`${CURRENCY_DEFINITIONS[code].name} (${code}) 金額`}
                />
                <div className="text-xs text-right text-gray-500 mt-0.5">
                  匯率由台灣銀行即時資料計算
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
