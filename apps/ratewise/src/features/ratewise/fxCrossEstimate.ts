import {
  estimate,
  estimateDerived,
  isQuoteApplicable,
  rankQuotes,
  type DerivedEstimateResult,
  type EstimateRequest,
  type EstimateResult,
  type QuoteSnapshot,
  type SelectionContext,
} from '@app/shared/fx';
import { resolveEffectiveFxContext } from './fxEffectiveContext';

const compareAmounts = (left: string, right: string) => {
  const [leftWhole = '0', leftFraction = ''] = left.split('.');
  const [rightWhole = '0', rightFraction = ''] = right.split('.');
  if (leftWhole.length !== rightWhole.length) return leftWhole.length - rightWhole.length;
  if (leftWhole !== rightWhole) return leftWhole < rightWhole ? -1 : 1;
  const scale = Math.max(leftFraction.length, rightFraction.length);
  const leftScaled = BigInt(leftWhole + leftFraction.padEnd(scale, '0'));
  const rightScaled = BigInt(rightWhole + rightFraction.padEnd(scale, '0'));
  return leftScaled < rightScaled ? -1 : leftScaled > rightScaled ? 1 : 0;
};

export function estimateCrossPair(input: {
  request: EstimateRequest;
  context: SelectionContext;
  quotes: readonly QuoteSnapshot[];
  providerId?: string;
  best: boolean;
  providerStatuses?: ReadonlyMap<string, 'ok' | 'failed' | 'carried_forward'>;
}): DerivedEstimateResult | null {
  const { request, quotes, context, providerId, best, providerStatuses } = input;
  const legs = (from: string, to: string) =>
    quotes.filter(
      (quote) =>
        quote.fromCurrency === from &&
        quote.toCurrency === to &&
        (best || quote.providerId === providerId),
    );
  const firstQuotes = legs(request.fromCurrency, 'TWD');
  const secondQuotes = legs('TWD', request.toCurrency);
  const candidates: DerivedEstimateResult[] = [];

  for (const first of firstQuotes) {
    for (const second of secondQuotes) {
      const derived = estimateDerived(first, second, request);
      if (derived.status !== 'available' || derived.fromAmount === null) continue;
      const firstRequest = {
        fromCurrency: first.fromCurrency,
        toCurrency: first.toCurrency,
        amount: derived.fromAmount,
        mode: 'EXACT_IN' as const,
      };
      const intermediate = estimate(first, firstRequest);
      if (intermediate.toAmount === null) continue;
      const secondRequest = {
        fromCurrency: second.fromCurrency,
        toCurrency: second.toCurrency,
        amount: intermediate.toAmount,
        mode: 'EXACT_IN' as const,
      };
      const firstContext = resolveEffectiveFxContext({
        request: firstRequest,
        context,
        providerId: best ? undefined : providerId,
        quotes,
      }).context;
      const secondContext = resolveEffectiveFxContext({
        request: secondRequest,
        context,
        providerId: best ? undefined : providerId,
        quotes,
      }).context;
      const eligible = (
        quote: QuoteSnapshot,
        legRequest: typeof firstRequest,
        legContext: SelectionContext,
      ) =>
        best
          ? rankQuotes(quotes, legRequest, legContext, providerStatuses).some(
              ({ quote: ranked }) => ranked.quoteId === quote.quoteId,
            )
          : isQuoteApplicable(quote, legRequest, legContext);
      if (
        eligible(first, firstRequest, firstContext) &&
        eligible(second, secondRequest, secondContext)
      )
        candidates.push(derived);
    }
  }

  if (candidates.length) {
    return (
      candidates.sort((a, b) =>
        request.mode === 'EXACT_IN'
          ? compareAmounts(b.toAmount ?? '0', a.toAmount ?? '0')
          : compareAmounts(a.fromAmount ?? '0', b.fromAmount ?? '0'),
      )[0] ?? null
    );
  }
  if (!best) return null;

  for (const first of firstQuotes.filter((quote) => quote.providerId === 'bot')) {
    for (const second of secondQuotes.filter((quote) => quote.providerId === 'bot')) {
      const derived = estimateDerived(first, second, request);
      if (derived.status !== 'available' || derived.fromAmount === null) continue;
      const firstRequest = {
        fromCurrency: first.fromCurrency,
        toCurrency: first.toCurrency,
        amount: derived.fromAmount,
        mode: 'EXACT_IN' as const,
      };
      const intermediate = estimate(first, firstRequest);
      if (intermediate.toAmount === null) continue;
      const secondRequest = {
        fromCurrency: second.fromCurrency,
        toCurrency: second.toCurrency,
        amount: intermediate.toAmount,
        mode: 'EXACT_IN' as const,
      };
      const firstContext = resolveEffectiveFxContext({
        request: firstRequest,
        context,
        providerId: 'bot',
        quotes,
      }).context;
      const secondContext = resolveEffectiveFxContext({
        request: secondRequest,
        context,
        providerId: 'bot',
        quotes,
      }).context;
      if (
        isQuoteApplicable(first, firstRequest, firstContext) &&
        isQuoteApplicable(second, secondRequest, secondContext)
      )
        return derived;
    }
  }
  return null;
}

export function getCrossLegRequests(
  request: EstimateRequest,
  result: EstimateResult | DerivedEstimateResult,
  quotes: readonly QuoteSnapshot[],
): EstimateRequest[] {
  if (
    !('kind' in result) ||
    result.kind !== 'derived_cross' ||
    result.legs.length !== 2 ||
    result.fromAmount === null
  )
    return [request];
  const first = quotes.find((quote) => quote.quoteId === result.legs[0]);
  const second = quotes.find((quote) => quote.quoteId === result.legs[1]);
  if (!first || !second) return [request];
  const firstRequest: EstimateRequest = {
    fromCurrency: first.fromCurrency,
    toCurrency: first.toCurrency,
    amount: result.fromAmount.replace(/^-/, ''),
    mode: 'EXACT_IN',
  };
  const intermediate = estimate(first, firstRequest);
  if (intermediate.toAmount === null) return [firstRequest];
  return [
    firstRequest,
    {
      fromCurrency: second.fromCurrency,
      toCurrency: second.toCurrency,
      amount: intermediate.toAmount,
      mode: 'EXACT_IN',
    },
  ];
}
