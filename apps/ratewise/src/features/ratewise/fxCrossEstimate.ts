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
  const candidates = quotes.filter((quote) => best || quote.providerId === providerId);
  // 中介幣別由兩腿報價決定（台銀為 TWD、換錢所為 KRW），不預設樞紐。
  const firstQuotes = candidates.filter(
    (quote) =>
      quote.fromCurrency === request.fromCurrency && quote.toCurrency !== request.toCurrency,
  );
  const secondQuotes = candidates.filter(
    (quote) =>
      quote.toCurrency === request.toCurrency && quote.fromCurrency !== request.fromCurrency,
  );
  const methods: SelectionContext['deliveryMethod'][] = [
    context.deliveryMethod,
    context.deliveryMethod === 'cash' ? 'account' : 'cash',
  ];
  for (const method of methods) {
    const routeCandidates: DerivedEstimateResult[] = [];
    const pairs = firstQuotes.flatMap((first) =>
      secondQuotes
        .filter(
          (second) =>
            first.providerId === second.providerId &&
            first.toCurrency === second.fromCurrency &&
            first.sourceQuote.deliveryMethod === method &&
            second.sourceQuote.deliveryMethod === method &&
            first.sourceQuote.channel === second.sourceQuote.channel &&
            first.sourceQuote.serviceCountry === second.sourceQuote.serviceCountry &&
            first.sourceQuote.branchId === second.sourceQuote.branchId,
        )
        .map((second) => ({ first, second })),
    );
    const locations = new Map<string, SelectionContext>();
    for (const { first } of pairs) {
      const row = first.sourceQuote;
      const key = `${row.serviceCountry}|${row.branchId ?? ''}`;
      locations.set(key, {
        ...context,
        country: row.serviceCountry,
        branchId: row.branchId ?? undefined,
        deliveryMethod: method,
        channel: row.channel,
      });
    }
    const requestedKey = `${context.country}|${context.branchId ?? ''}`;
    const chosenLocation = best
      ? locations.get(requestedKey)
      : (locations.get(requestedKey) ??
        (locations.size === 1 ? [...locations.values()][0] : undefined));
    if (!chosenLocation) continue;

    for (const { first, second } of pairs) {
      if (
        first.sourceQuote.serviceCountry !== chosenLocation.country ||
        (first.sourceQuote.branchId ?? undefined) !== chosenLocation.branchId
      )
        continue;
      const derived = estimateDerived(first, second, request);
      if (derived.status !== 'available' || derived.fromAmount === null) continue;
      const legRequests = getCrossLegRequests(request, derived, quotes);
      if (legRequests.length !== 2) continue;
      const [firstRequest, secondRequest] = legRequests;
      if (!firstRequest || !secondRequest) continue;
      const eligible = (quote: QuoteSnapshot, legRequest: EstimateRequest) =>
        best
          ? rankQuotes(quotes, legRequest, chosenLocation, providerStatuses).some(
              ({ quote: ranked }) => ranked.quoteId === quote.quoteId,
            ) ||
            (quote.providerId === 'bot' && isQuoteApplicable(quote, legRequest, chosenLocation))
          : isQuoteApplicable(quote, legRequest, chosenLocation);
      if (eligible(first, firstRequest) && eligible(second, secondRequest))
        routeCandidates.push(derived);
    }
    if (routeCandidates.length)
      return (
        routeCandidates.sort((a, b) =>
          request.mode === 'EXACT_IN'
            ? compareAmounts(b.toAmount ?? '0', a.toAmount ?? '0')
            : compareAmounts(a.fromAmount ?? '0', b.fromAmount ?? '0'),
        )[0] ?? null
      );
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
