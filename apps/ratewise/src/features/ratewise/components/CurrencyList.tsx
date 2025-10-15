import { RefreshCw, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { CURRENCY_DEFINITIONS } from '../constants';
import type { CurrencyCode, TrendState } from '../types';

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
        <h3 className="text-xl font-bold text-gray-800">全部幣種</h3>
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
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {CURRENCY_CODES.map((code) => (
          <div
            key={`list-${code}`}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition cursor-pointer"
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
              {trend[code] === 'up' ? (
                <TrendingUp className="text-green-500" size={14} />
              ) : (
                <TrendingDown className="text-red-500" size={14} />
              )}
              <span className="text-sm">{(exchangeRates[code] ?? 0).toFixed(4)}</span>
              {favorites.includes(code) && (
                <Star className="text-yellow-500" size={14} fill="currentColor" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
