import {
  isQuoteApplicable,
  type EstimateRequest,
  type QuoteSnapshot,
  type SelectionContext,
} from '@app/shared/fx';

export interface FxContextSubstitution {
  kind: 'deliveryMethod' | 'location';
  from: string;
  to: string;
  country?: string;
  branchId?: string | null;
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
  const scoped = quotes.filter(
    (quote) => !input.providerId || quote.providerId === input.providerId,
  );
  const applicable = (candidate: SelectionContext) =>
    scoped.some((quote) => isQuoteApplicable(quote, request, candidate));
  const substitutions: FxContextSubstitution[] = [];

  if (!applicable(context)) {
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
      substitutions.push({ kind: 'deliveryMethod', from: context.deliveryMethod, to: otherMethod });
      Object.assign(context, otherContext);
    }
  }

  return { context, substitutions };
}
