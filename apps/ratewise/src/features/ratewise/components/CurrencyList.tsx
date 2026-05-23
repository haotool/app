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
import { contentPageTokens } from '../../../config/design-tokens';

const CURRENCY_CODES = Object.keys(CURRENCY_DEFINITIONS) as CurrencyCode[];

interface CurrencyListProps {
  favorites: CurrencyCode[];
  exchangeRates: Record<CurrencyCode, number | null>;
  onToggleFavorite: (code: CurrencyCode) => void;
}

export const CurrencyList = ({ favorites, exchangeRates, onToggleFavorite }: CurrencyListProps) => {
  const { t } = useTranslation();

  return (
    <div className={contentPageTokens.surfaces.panel}>
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
          <button
            type="button"
            key={`list-${code}`}
            className="group flex w-full cursor-pointer items-center justify-between rounded-lg p-3 text-left transition-colors duration-200 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                className={`${favorites.includes(code) ? 'text-favorite' : 'text-text-muted/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100'}`}
                size={14}
                fill={favorites.includes(code) ? 'currentColor' : 'none'}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
