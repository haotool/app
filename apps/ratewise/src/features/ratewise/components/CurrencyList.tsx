import { RefreshCw, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { CURRENCY_DEFINITIONS } from '../constants';
import type { CurrencyCode, TrendState } from '../types';
import { formatExchangeRate } from '../../../utils/currencyFormatter';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

interface CurrencyListProps {
  favorites: CurrencyCode[];
  trend: TrendState;
  exchangeRates: Record<CurrencyCode, number | null>;
  onToggleFavorite: (code: CurrencyCode) => void;
  onRefreshTrends: () => void;
}

export const CurrencyList = ({
  favorites,
  trend,
  exchangeRates,
  onToggleFavorite,
  onRefreshTrends,
}: CurrencyListProps) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">全部幣種</h2>
        <button
          onClick={onRefreshTrends}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          type="button"
          aria-label="刷新趨勢數據"
          title="刷新趨勢數據"
        >
          <RefreshCw size={16} className="text-gray-600" />
        </button>
      </div>
      <div
        className="space-y-2 max-h-96 overflow-y-auto"
        tabIndex={0}
        role="region"
        aria-label="貨幣列表"
      >
        {CURRENCY_CODES.map((code) => (
          <div
            key={`list-${code}`}
            className="group flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition cursor-pointer"
            onClick={() => onToggleFavorite(code)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{CURRENCY_DEFINITIONS[code].flag}</span>
              <div>
                <div className="text-sm font-semibold text-gray-800">{code}</div>
                <div className="text-xs text-gray-500">{CURRENCY_DEFINITIONS[code].name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {trend[code] === 'up' && <TrendingUp className="text-green-500" size={14} />}
              {trend[code] === 'down' && <TrendingDown className="text-red-500" size={14} />}
              {/* 當 trend[code] 為 null 時，不顯示任何趨勢圖標 */}
              <span className="text-sm">{formatExchangeRate(exchangeRates[code] ?? 0)}</span>
              {/* 始終保留星星位置，防止佈局跳動 */}
              <Star
                className={`${favorites.includes(code) ? 'text-yellow-500' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
                size={14}
                fill={favorites.includes(code) ? 'currentColor' : 'none'}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
