import { ClientOnly } from 'vite-react-ssg';
import { useTranslation } from 'react-i18next';
import { singleConverterLayoutTokens } from '../../../config/design-tokens';
import { formatExchangeRate } from '../../../utils/currencyFormatter';
import { formatDisplayTime } from '../../../utils/timeFormatter';
import type { CurrencyCode, RateMode, RateSource, RateType } from '../types';
import type { RateTypeAvailability } from '../../../utils/exchangeRateCalculation';
import { RateSelector } from './RateSelector';

interface HeroRatePanelProps {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  exchangeRate: number | null;
  reverseRate: number | null;
  rateType: RateType;
  rateSource: RateSource;
  rateMode: RateMode;
  rateTypeAvailability: RateTypeAvailability;
  hasExchangeShop: boolean;
  heroRateValues: {
    spot: number | null;
    cash: number | null;
    exchangeShop: number | null;
  };
  onRateTypeChange: (type: RateType) => void;
  onRateSourceChange: (source: RateSource) => void;
  lastUpdate?: string | null;
  lastFetchedAt?: string | null;
}

export const HeroRatePanel = ({
  fromCurrency,
  toCurrency,
  exchangeRate,
  reverseRate,
  rateType,
  rateSource,
  rateMode,
  rateTypeAvailability,
  hasExchangeShop,
  heroRateValues,
  onRateTypeChange,
  onRateSourceChange,
  lastUpdate = null,
  lastFetchedAt = null,
}: HeroRatePanelProps) => {
  const { t } = useTranslation();
  const tokens = singleConverterLayoutTokens.rateCard;

  return (
    <div className="flex w-full flex-col items-center">
      <div className={`w-full text-center ${tokens.heroRateBlock}`}>
        <div data-testid="hero-rate-display" className={`${tokens.heroRateDisplay} text-text`}>
          1 {fromCurrency} = {formatExchangeRate(exchangeRate ?? 0)} {toCurrency}
        </div>
        <div className={tokens.rateBasisSlot}>
          <span data-testid="hero-rate-trust-badge" className={tokens.heroTrustBadge}>
            {rateMode === 'sell' ? t('settings.rateModeSell') : t('settings.rateModeMid')}
          </span>
        </div>
        <div
          className={`${tokens.rateSubText} tabular-nums text-text-muted font-medium opacity-80`}
        >
          1 {toCurrency} = {formatExchangeRate(reverseRate ?? 0)} {fromCurrency}
        </div>
      </div>

      <div className={tokens.heroRateTabsWrap}>
        <RateSelector
          variant="hero-v2"
          rateValues={heroRateValues}
          rateType={rateType}
          rateSource={rateSource}
          rateTypeAvailability={rateTypeAvailability}
          hasExchangeShop={hasExchangeShop}
          onRateTypeChange={onRateTypeChange}
          onRateSourceChange={onRateSourceChange}
        />
      </div>

      {lastUpdate ? (
        <div
          data-testid="hero-freshness-chip"
          className={`${tokens.trustChipGap} text-xs tabular-nums text-text-muted/70`}
        >
          <ClientOnly fallback={<span aria-hidden="true">&nbsp;</span>}>
            {() => (
              <span suppressHydrationWarning>{formatDisplayTime(lastUpdate, lastFetchedAt)}</span>
            )}
          </ClientOnly>
        </div>
      ) : null}
    </div>
  );
};
