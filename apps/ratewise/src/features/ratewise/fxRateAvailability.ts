import {
  isQuoteApplicable,
  type QuoteSnapshot,
  type SelectionContext,
  type EstimateResult,
  type DerivedEstimateResult,
  type EstimateRequest,
} from '@app/shared/fx';
import { getDefaultProviderRef, getRateProvider } from '../../config/rateProviders';
import type { CurrencyCode, RateSource, RateType } from './types';
import { estimateCrossPair } from './fxCrossEstimate';
import { resolveEffectiveFxContext } from './fxEffectiveContext';

export type FxRateOption = RateType | 'exchange-shop';

export interface FxRateAvailability {
  current?: FxRateOption;
  spot: boolean;
  cash: boolean;
  exchangeShop: boolean;
}

/** 舊版切換器的可用性取自同一份 v3 報價；不把替代交付方式算成原方式可用。 */
export function getFxRateAvailability(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  quotes: readonly QuoteSnapshot[],
  context: SelectionContext,
  amount = '1',
  mode: EstimateRequest['mode'] = 'EXACT_IN',
): FxRateAvailability {
  if (fromCurrency === toCurrency) return { spot: true, cash: true, exchangeShop: false };
  const request = { fromCurrency, toCurrency, amount, mode };
  const available = (source: RateSource, deliveryMethod: SelectionContext['deliveryMethod']) => {
    const providerId = getDefaultProviderRef(source).providerId;
    const scoped = quotes.filter(
      (quote) =>
        quote.providerId === providerId && quote.sourceQuote.deliveryMethod === deliveryMethod,
    );
    const effective = resolveEffectiveFxContext({
      request,
      quotes: scoped,
      providerId,
      context: {
        ...context,
        deliveryMethod,
        channel: deliveryMethod === 'cash' ? 'branch' : 'online',
      },
    }).context;
    return (
      scoped.some((quote) => isQuoteApplicable(quote, request, effective)) ||
      estimateCrossPair({ request, context: effective, quotes: scoped, providerId, best: false })
        ?.status === 'available'
    );
  };
  return {
    spot: available('bank', 'account'),
    cash: available('bank', 'cash'),
    exchangeShop: available('exchange-shop', 'cash'),
  };
}

/** 切換器標示實際採用的報價；不改寫使用者的交付方式偏好。 */
export function getFxRateOption(
  result: EstimateResult | DerivedEstimateResult | undefined,
  quotes: readonly QuoteSnapshot[],
): FxRateOption | null {
  if (!result) return null;
  const id = 'legs' in result ? result.legs[0] : result.quoteId;
  const quote = quotes.find((candidate) => candidate.quoteId === id);
  if (!quote) return null;
  if (getRateProvider(quote.providerId)?.sourceKind === 'exchange-shop') return 'exchange-shop';
  return quote.sourceQuote.deliveryMethod === 'cash' ? 'cash' : 'spot';
}
