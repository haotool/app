/**
 * FavoritesList Component
 *
 * 顯示使用者收藏的貨幣匯率，使用 SSOT design token
 */
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
    <div className="bg-surface rounded-3xl shadow-xl p-6 border border-border/30">
      <div className="flex items-center gap-2 mb-4">
        <Star className="text-favorite" size={20} fill="currentColor" />
        <h2 className="text-xl font-bold text-text">常用貨幣</h2>
      </div>
      <div className="space-y-2">
        {favorites.map((code) => (
          <div
            key={`fav-${code}`}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-bg/50 to-primary-light/30 rounded-xl border border-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{CURRENCY_DEFINITIONS[code].flag}</span>
              <div>
                <div className="font-semibold text-text">{code}</div>
                <div className="text-xs text-text-muted">{CURRENCY_DEFINITIONS[code].name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {trend[code] === 'up' && <TrendingUp className="text-success" size={16} />}
              {trend[code] === 'down' && <TrendingDown className="text-destructive" size={16} />}
              <span className="text-sm font-medium text-text">
                {formatExchangeRate(exchangeRates[code] ?? 0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
