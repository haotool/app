/**
 * CurrencyList Component
 *
 * 顯示所有貨幣的即時匯率列表，使用 SSOT design token
 */
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CURRENCY_DEFINITIONS } from '../constants';
import type { CurrencyCode } from '../types';
import { formatExchangeRate } from '../../../utils/currencyFormatter';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

interface CurrencyListProps {
  favorites: CurrencyCode[];
  exchangeRates: Record<CurrencyCode, number | null>;
  onToggleFavorite: (code: CurrencyCode) => void;
}

export const CurrencyList = ({ favorites, exchangeRates, onToggleFavorite }: CurrencyListProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-surface rounded-3xl shadow-xl p-6 border border-border/30">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-text">{t('currencyList.allCurrencies')}</h2>
      </div>
      <div
        className="space-y-2 max-h-96 overflow-y-auto"
        tabIndex={0}
        role="region"
        aria-label={t('currencyList.currencyListLabel')}
        data-testid="currency-list"
      >
        {CURRENCY_CODES.map((code) => (
          <div
            key={`list-${code}`}
            className="group flex items-center justify-between p-2 hover:bg-primary/5 rounded-lg transition-colors duration-200 cursor-pointer"
            onClick={() => onToggleFavorite(code)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{CURRENCY_DEFINITIONS[code].flag}</span>
              <div>
                <div className="text-sm font-semibold text-text">{code}</div>
                <div className="text-xs text-text-muted">{t(`currencies.${code}`)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text">
                {formatExchangeRate(exchangeRates[code] ?? 0)}
              </span>
              <Star
                className={`${favorites.includes(code) ? 'text-favorite' : 'text-text-muted/30 opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}
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
