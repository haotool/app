import { Star, TrendingDown, TrendingUp } from 'lucide-react';
import { CURRENCY_DEFINITIONS } from '../constants';
import type { CurrencyCode, TrendState } from '../types';
import { formatExchangeRate } from '../../../utils/currencyFormatter';

interface FavoritesListProps {
  favorites: CurrencyCode[];
  trend: TrendState;
  exchangeRates: Record<CurrencyCode, number | null>;
}

export const FavoritesList = ({ favorites, trend, exchangeRates }: FavoritesListProps) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="text-yellow-500" size={20} fill="currentColor" />
        <h2 className="text-xl font-bold text-gray-800">常用貨幣</h2>
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
                <div className="text-xs text-gray-600">{CURRENCY_DEFINITIONS[code].name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {trend[code] === 'up' && <TrendingUp className="text-green-500" size={16} />}
              {trend[code] === 'down' && <TrendingDown className="text-red-500" size={16} />}
              {/* 當 trend[code] 為 null 時，不顯示任何趨勢圖標 */}
              <span className="text-sm font-medium">
                {formatExchangeRate(exchangeRates[code] ?? 0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
