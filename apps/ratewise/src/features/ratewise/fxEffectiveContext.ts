import {
  isQuoteApplicable,
  type EstimateRequest,
  type EstimateResult,
  type DerivedEstimateResult,
  type QuoteSnapshot,
  type SelectionContext,
} from '@app/shared/fx';

export interface FxContextSubstitution {
  kind: 'deliveryMethod' | 'location';
  from: string;
  to: string;
  fromCurrency: string;
  toCurrency: string;
  country?: string;
  branchId?: string | null;
  branchLabel?: string;
  providerIds?: string[];
}

export function resolveEffectiveFxContext(input: {
  request: EstimateRequest;
  context: SelectionContext;
  providerId?: string;
  quotes: readonly QuoteSnapshot[];
}): { context: SelectionContext; substitutions: FxContextSubstitution[] } {
  const { request, quotes } = input;
  const context = { ...input.context };
  const disclosureCurrency =
    request.toCurrency === 'TWD' ? request.fromCurrency : request.toCurrency;
  const scoped = quotes.filter(
    (quote) => !input.providerId || quote.providerId === input.providerId,
  );
  const applicable = (candidate: SelectionContext) =>
    scoped.some((quote) => isQuoteApplicable(quote, request, candidate));
  const substitutions: FxContextSubstitution[] = [];

  if (input.providerId && !applicable(context)) {
    const locations = new Map<
      string,
      { country: string; branchId: string | null; providerIds: Set<string> }
    >();
    for (const quote of scoped) {
      const row = quote.sourceQuote;
      const location = {
        country: row.serviceCountry,
        branchId: row.branchId ?? null,
      };
      const key = `${location.country}|${location.branchId ?? ''}`;
      if (
        isQuoteApplicable(quote, request, {
          ...context,
          country: location.country,
          branchId: location.branchId ?? undefined,
          deliveryMethod: row.deliveryMethod,
          channel: row.channel,
        })
      ) {
        const current = locations.get(key);
        if (current) current.providerIds.add(quote.providerId);
        else locations.set(key, { ...location, providerIds: new Set([quote.providerId]) });
      }
    }
    if (locations.size === 1) {
      const location = locations.values().next().value;
      if (
        location &&
        (context.country !== location.country || (context.branchId ?? null) !== location.branchId)
      ) {
        substitutions.push({
          kind: 'location',
          from: `${context.country}|${context.branchId ?? ''}`,
          to: `${location.country}|${location.branchId ?? ''}`,
          fromCurrency: request.fromCurrency,
          toCurrency: disclosureCurrency,
          country: location.country,
          branchId: location.branchId,
          providerIds: [...location.providerIds],
        });
        context.country = location.country;
        context.branchId = location.branchId ?? undefined;
      }
    }
  }

  if (!applicable(context)) {
    const otherMethod: SelectionContext['deliveryMethod'] =
      context.deliveryMethod === 'cash' ? 'account' : 'cash';
    const otherContext: SelectionContext = {
      ...context,
      deliveryMethod: otherMethod,
      channel: otherMethod === 'cash' ? 'branch' : 'online',
    };
    if (applicable(otherContext)) {
      substitutions.push({
        kind: 'deliveryMethod',
        from: context.deliveryMethod,
        to: otherMethod,
        fromCurrency: request.fromCurrency,
        toCurrency: disclosureCurrency,
      });
      Object.assign(context, otherContext);
    }
  }

  return { context, substitutions };
}

export function getEstimateContextSubstitutions(input: {
  request: EstimateRequest;
  result: EstimateResult | DerivedEstimateResult;
  context: SelectionContext;
  providerId?: string;
  quotes: readonly QuoteSnapshot[];
}): FxContextSubstitution[] {
  const { request, result, context, providerId, quotes } = input;
  if ('legs' in result && result.kind === 'derived_cross') {
    const selected = result.legs
      .map((id) => quotes.find((quote) => quote.quoteId === id))
      .filter((quote): quote is QuoteSnapshot => Boolean(quote));
    const first = selected[0]?.sourceQuote;
    if (!first) return [];
    const currency = request.toCurrency === 'TWD' ? request.fromCurrency : request.toCurrency;
    const substitutions: FxContextSubstitution[] = [];
    if (first.deliveryMethod !== context.deliveryMethod)
      substitutions.push({
        kind: 'deliveryMethod',
        from: context.deliveryMethod,
        to: first.deliveryMethod,
        fromCurrency: request.fromCurrency,
        toCurrency: currency,
      });
    if (
      first.serviceCountry !== context.country ||
      (first.branchId ?? null) !== (context.branchId ?? null)
    )
      substitutions.push({
        kind: 'location',
        from: `${context.country}|${context.branchId ?? ''}`,
        to: `${first.serviceCountry}|${first.branchId ?? ''}`,
        country: first.serviceCountry,
        branchId: first.branchId,
        providerIds: selected.map((quote) => quote.providerId),
        fromCurrency: request.fromCurrency,
        toCurrency: currency,
      });
    return substitutions;
  }
  return resolveEffectiveFxContext({ request, context, providerId, quotes }).substitutions.map(
    (substitution) => ({
      ...substitution,
      toCurrency: request.toCurrency === 'TWD' ? request.fromCurrency : request.toCurrency,
    }),
  );
}

export function getEffectiveHistoryContext(input: {
  result: EstimateResult | DerivedEstimateResult;
  quotes: readonly QuoteSnapshot[];
  fallback: { rateType: 'cash' | 'spot'; country: string; branchId: string | null };
}) {
  const { result, quotes, fallback } = input;
  const snapshots = (
    'legs' in result
      ? result.legs.map((id) => quotes.find((quote) => quote.quoteId === id))
      : [quotes.find((quote) => quote.quoteId === result.quoteId)]
  ).filter((quote): quote is QuoteSnapshot => quote !== undefined);
  const snapshot = snapshots[0];
  return {
    quoteSnapshot: snapshot,
    derivedLegs: 'legs' in result ? snapshots : undefined,
    rateType: snapshot
      ? snapshot.sourceQuote.deliveryMethod === 'cash'
        ? 'cash'
        : 'spot'
      : fallback.rateType,
    serviceCountry: snapshot?.sourceQuote.serviceCountry ?? fallback.country,
    branchId: snapshot ? (snapshot.sourceQuote.branchId ?? null) : fallback.branchId,
  };
}
