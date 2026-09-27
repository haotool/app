import Decimal from 'decimal.js';
import {
  validateSourceQuote,
  validateProviderSnapshot as validateProviderShape,
  validateQuoteSnapshot as validateQuoteShape,
  validateEstimateRequest,
  validateSelectionContext,
} from './validators.js';
import type {
  SourceQuote,
  QuoteSnapshot,
  EstimateRequest,
  EstimateResult,
  SelectionContext,
  DerivedCrossQuote,
  DerivedEstimateResult,
  ProviderSnapshot,
} from './types';
export type * from './types';
export { validateSourceQuote, validateEstimateRequest, validateSelectionContext };
export {
  validateProvider,
  validateReleaseManifest,
  validateCurrentRelease,
  validateObjectReference,
  validateDerivedCrossQuote,
  validateDerivedEstimateResult,
} from './validators.js';
const D = Decimal.clone({ precision: 80, rounding: Decimal.ROUND_HALF_EVEN });
export const MINOR_UNITS: Readonly<Record<string, number>> = Object.freeze({
  TWD: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  AUD: 2,
  CAD: 2,
  CHF: 2,
  CNY: 2,
  HKD: 2,
  SGD: 2,
  NZD: 2,
  THB: 2,
  MYR: 2,
  PHP: 2,
  IDR: 2,
  INR: 2,
  ZAR: 2,
  SEK: 2,
  NOK: 2,
  DKK: 2,
  JPY: 0,
  KRW: 0,
  VND: 0,
  KWD: 3,
  BHD: 3,
  OMR: 3,
  TND: 3,
});
export function minorUnit(currency: string): number {
  const result = MINOR_UNITS[currency];
  if (result === undefined) throw new Error(`Unsupported currency minor unit: ${currency}`);
  return result;
}
export function isValidAmount(value: string): boolean {
  return (
    value.length <= 25 &&
    /^(0|[1-9]\d*)(\.\d{1,8})?$/.test(value) &&
    new D(value).lte('9007199254740991')
  );
}
function positive(value: string | null): value is string {
  return value !== null && new D(value).gt(0);
}
function canonical(value: Decimal): string {
  return value.toSignificantDigits(34, Decimal.ROUND_HALF_EVEN).toFixed();
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).sort().join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
export function normalizeQuote(row: SourceQuote): QuoteSnapshot[] {
  if (
    !validateSourceQuote(row) ||
    (row.feeStatus === 'no_additional_fee' && !row.feeEvidenceUrl) ||
    (row.amountRange && new D(row.amountRange.min).gt(row.amountRange.max)) ||
    row.denominations?.some((value) => !positive(value)) ||
    !positive(row.unitAmount) ||
    row.subjectCurrency === row.priceCurrency ||
    (row.buy !== null && !positive(row.buy)) ||
    (row.sell !== null && !positive(row.sell))
  )
    throw new Error('Invalid source quote');
  return (['buy', 'sell'] as const).map((side) => {
    const fromCurrency = side === 'buy' ? row.subjectCurrency : row.priceCurrency;
    const toCurrency = side === 'buy' ? row.priceCurrency : row.subjectCurrency;
    const series = {
      providerId: row.providerId,
      fromCurrency,
      toCurrency,
      side,
      serviceCountry: row.serviceCountry,
      deliveryMethod: row.deliveryMethod,
      channel: row.channel,
      branchId: row.branchId ?? null,
      denominations: row.denominations?.map((value) => new D(value).toFixed()) ?? null,
      qualifications: row.qualifications ?? null,
      amountRange: row.amountRange
        ? {
            ...row.amountRange,
            min: new D(row.amountRange.min).toFixed(),
            max: new D(row.amountRange.max).toFixed(),
          }
        : null,
    };
    const quoteSeriesId = `fx3:${encodeURIComponent(stable(series))}`;
    const { lastSuccessfulCheckAt: _lastCheck, fetchedAt: _fetchTime, ...snapshot } = row;
    const quoteId = `${quoteSeriesId}:${encodeURIComponent(stable(snapshot))}`;
    const value = row[side];
    return {
      quoteId,
      quoteSeriesId,
      providerId: row.providerId,
      fromCurrency,
      toCurrency,
      providerSide: side,
      status: value === null ? 'unavailable' : 'available',
      rate:
        value === null
          ? null
          : canonical(
              side === 'buy' ? new D(value).div(row.unitAmount) : new D(row.unitAmount).div(value),
            ),
      unavailableReason: value === null ? 'not_quoted' : null,
      sourceQuote: structuredClone(row),
      methodVersion: '1',
    };
  });
}
export function boardMidpoint(row: SourceQuote): string | null {
  if (
    !validateSourceQuote(row) ||
    !positive(row.unitAmount) ||
    !positive(row.buy) ||
    !positive(row.sell)
  )
    return null;
  return canonical(new D(row.buy).plus(row.sell).div(2).div(row.unitAmount));
}
function unavailable(reason: string, quoteId: string | null = null): EstimateResult {
  return {
    status: 'unavailable',
    fromAmount: null,
    toAmount: null,
    quoteId,
    rate: null,
    reason,
    feeStatus: 'unknown',
  };
}
export function estimate(quote: QuoteSnapshot | null, request: EstimateRequest): EstimateResult {
  if (!validateEstimateRequest(request) || !isValidAmount(request.amount))
    return unavailable('invalid_amount');
  if (request.fromCurrency === request.toCurrency)
    return {
      status: 'available',
      fromAmount: request.amount,
      toAmount: request.amount,
      quoteId: null,
      rate: '1',
      reason: null,
      feeStatus: 'no_additional_fee',
    };
  if (
    !quote ||
    !validateQuoteSnapshot(quote) ||
    quote.status !== 'available' ||
    quote.rate === null ||
    !positive(quote.rate)
  )
    return unavailable('not_quoted', quote?.quoteId ?? null);
  if (quote.fromCurrency !== request.fromCurrency || quote.toCurrency !== request.toCurrency)
    return unavailable('direction_mismatch', quote.quoteId);
  return estimateAmounts(
    quote.rate,
    request,
    quote.quoteId,
    quote.sourceQuote.feeStatus ?? 'unknown',
  );
}
function estimateAmounts(
  canonicalRate: string,
  request: EstimateRequest,
  quoteId: string | null,
  feeStatus: EstimateResult['feeStatus'],
): EstimateResult {
  let fromScale: number;
  let toScale: number;
  try {
    fromScale = minorUnit(request.fromCurrency);
    toScale = minorUnit(request.toCurrency);
  } catch {
    return unavailable('unsupported_currency', quoteId);
  }
  const rate = new D(canonicalRate),
    amount = new D(request.amount);
  const from =
    request.mode === 'EXACT_IN'
      ? amount
      : amount.div(rate).toDecimalPlaces(fromScale, Decimal.ROUND_CEIL);
  const to =
    request.mode === 'EXACT_OUT'
      ? amount
      : from.mul(rate).toDecimalPlaces(toScale, Decimal.ROUND_HALF_EVEN);
  if (from.gt('9007199254740991')) return unavailable('amount_out_of_range', quoteId);
  return {
    status: 'available',
    fromAmount: from.toFixed(),
    toAmount: to.toFixed(),
    quoteId: quoteId,
    rate: canonicalRate,
    reason: null,
    feeStatus: feeStatus,
  };
}
export function freshness(quote: QuoteSnapshot, now: string): 'fresh' | 'stale' | 'unknown' {
  const row = quote.sourceQuote;
  if (row.sourcePublishedAt === null) return 'unknown';
  const time = Date.parse(now),
    published = Date.parse(row.sourcePublishedAt),
    checked = Date.parse(row.lastSuccessfulCheckAt);
  if (![time, published, checked].every(Number.isFinite) || published > time || checked > time)
    return 'unknown';
  const maxHours = row.providerId === 'bot' ? 36 : 24;
  return time - published <= maxHours * 3600000 && time - checked <= 30 * 60000 ? 'fresh' : 'stale';
}
export function isQuoteApplicable(
  quote: QuoteSnapshot,
  request: EstimateRequest,
  context: SelectionContext,
): boolean {
  if (
    !validateSelectionContext(context) ||
    !validateEstimateRequest(request) ||
    !isValidAmount(request.amount) ||
    !validateQuoteSnapshot(quote)
  )
    return false;
  const row = quote.sourceQuote;
  if (
    quote.fromCurrency !== request.fromCurrency ||
    quote.toCurrency !== request.toCurrency ||
    row.serviceCountry !== context.country ||
    row.deliveryMethod !== context.deliveryMethod ||
    row.channel !== context.channel ||
    (row.branchId && row.branchId !== context.branchId) ||
    (row.denominations &&
      (!context.denomination ||
        !row.denominations.some((value) => new D(value).eq(context.denomination ?? '0')))) ||
    row.qualifications?.some((q) => !context.qualifications?.includes(q))
  )
    return false;
  const result = estimate(quote, request);
  if (result.status !== 'available') return false;
  if (row.amountRange) {
    const amount =
      row.amountRange.currency === request.fromCurrency
        ? result.fromAmount
        : row.amountRange.currency === request.toCurrency
          ? result.toAmount
          : null;
    if (
      amount === null ||
      new D(amount).lt(row.amountRange.min) ||
      new D(amount).gt(row.amountRange.max)
    )
      return false;
  }
  return true;
}
export function rankQuotes(
  quotes: readonly QuoteSnapshot[],
  request: EstimateRequest,
  context: SelectionContext,
  providerStatuses?: ReadonlyMap<string, 'ok' | 'failed' | 'carried_forward'>,
): { quote: QuoteSnapshot; estimate: EstimateResult }[] {
  if (
    !validateSelectionContext(context) ||
    !validateEstimateRequest(request) ||
    !isValidAmount(request.amount) ||
    new D(request.amount).isZero()
  )
    return [];
  return quotes
    .filter(
      (quote) =>
        (!providerStatuses || providerStatuses.get(quote.providerId) === 'ok') &&
        isQuoteApplicable(quote, request, context) &&
        freshness(quote, context.now) === 'fresh' &&
        quote.sourceQuote.feeStatus !== 'unsupported' &&
        (!quote.sourceQuote.dataKind || quote.sourceQuote.dataKind === 'published_board'),
    )
    .map((quote) => ({ quote, estimate: estimate(quote, request) }))
    .sort((a, b) =>
      request.mode === 'EXACT_IN'
        ? new D(b.estimate.toAmount ?? '0').cmp(a.estimate.toAmount ?? '0') ||
          a.quote.quoteId.localeCompare(b.quote.quoteId)
        : new D(a.estimate.fromAmount ?? '0').cmp(b.estimate.fromAmount ?? '0') ||
          a.quote.quoteId.localeCompare(b.quote.quoteId),
    );
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid provider payload');
  return value as Record<string, unknown>;
}
function decimalValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const string = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  if (typeof string !== 'string' || !/^(0|[1-9]\d*)(\.\d+)?$/.test(string) || !new D(string).gt(0))
    throw new Error('Invalid provider decimal');
  return string;
}
function times(
  payload: Record<string, unknown>,
): Pick<SourceQuote, 'sourcePublishedAt' | 'fetchedAt' | 'lastSuccessfulCheckAt'> {
  const fetchedAt = payload['fetchedAt'] ?? payload['timestamp'];
  if (typeof fetchedAt !== 'string' || !Number.isFinite(Date.parse(fetchedAt)))
    throw new Error('Missing provider fetch time');
  const sourcePublishedAt = payload['sourcePublishedAt'] ?? null;
  const lastSuccessfulCheckAt = payload['lastSuccessfulCheckAt'] ?? fetchedAt;
  if (
    sourcePublishedAt !== null &&
    (typeof sourcePublishedAt !== 'string' || !Number.isFinite(Date.parse(sourcePublishedAt)))
  )
    throw new Error('Invalid source time');
  if (
    typeof lastSuccessfulCheckAt !== 'string' ||
    !Number.isFinite(Date.parse(lastSuccessfulCheckAt))
  )
    throw new Error('Invalid check time');
  return { sourcePublishedAt, fetchedAt, lastSuccessfulCheckAt };
}
export function normalizeBankSnapshot(value: unknown): QuoteSnapshot[] {
  const payload = record(value),
    rows = record(payload['sourceQuotes'] ?? payload['details']);
  const dataKind =
    payload['dataKind'] === 'fixed_fallback' ? { dataKind: 'fixed_fallback' as const } : {};
  return Object.entries(rows).flatMap(([currency, value]) => {
    const detail = record(value);
    return (['cash', 'spot'] as const).flatMap((method) => {
      if (detail[method] === undefined) return [];
      const prices = record(detail[method]);
      return normalizeQuote({
        providerId: 'bot',
        subjectCurrency: currency,
        priceCurrency: 'TWD',
        unitAmount: '1',
        buy: decimalValue(prices['buy']),
        sell: decimalValue(prices['sell']),
        ...times(payload),
        serviceCountry: 'TW',
        deliveryMethod: method === 'cash' ? 'cash' : 'account',
        channel: method === 'cash' ? 'branch' : 'online',
        feeStatus: 'unknown',
        originalBuyField: `${method}.buy`,
        originalSellField: `${method}.sell`,
        mappingVersion: 'bot-1',
        sourceUrl: 'https://rate.bot.com.tw/xrt?Lang=zh-TW',
        ...dataKind,
      });
    });
  });
}
export function normalizeMoneyboxSnapshot(value: unknown): QuoteSnapshot[] {
  const payload = record(value),
    canonicalRows = payload['sourceQuotes'] !== undefined,
    rows = record(payload['sourceQuotes'] ?? payload['rates']);
  return Object.entries(rows).flatMap(([currency, value]) => {
    if (currency === 'KRW') return [];
    const prices = record(value);
    // 舊 MoneyBox sell 是業者買入外幣；新版 sourceQuotes 已使用業者視角。
    const unitAmount = canonicalRows
      ? decimalValue(prices['unitAmount'])
      : ['JPY', 'IDR', 'VND'].includes(currency)
        ? '100'
        : '1';
    if (unitAmount === null) throw new Error('Missing quote unit');
    return normalizeQuote({
      providerId: 'moneybox',
      subjectCurrency: currency,
      priceCurrency: 'KRW',
      unitAmount,
      buy: decimalValue(prices[canonicalRows ? 'buy' : 'sell']),
      sell: decimalValue(prices[canonicalRows ? 'sell' : 'buy']),
      ...times(payload),
      serviceCountry: 'KR',
      deliveryMethod: 'cash',
      channel: 'branch',
      branchId: 'myeongdong',
      feeStatus: 'unknown',
      originalBuyField: canonicalRows ? 'buyRate' : 'sell',
      originalSellField: canonicalRows ? 'sellRate' : 'buy',
      mappingVersion: canonicalRows ? 'moneybox-2' : 'moneybox-legacy-1',
      sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange/',
    });
  });
}

/** Structural validation and reconstruction of the economic meaning are both required. */
export function validateQuoteSnapshot(value: unknown): value is QuoteSnapshot {
  if (!validateQuoteShape(value)) return false;
  try {
    const expected = normalizeQuote(value.sourceQuote).find(
      (q) => q.providerSide === value.providerSide,
    );
    return (
      expected !== undefined &&
      [
        'quoteId',
        'quoteSeriesId',
        'providerId',
        'fromCurrency',
        'toCurrency',
        'status',
        'rate',
        'unavailableReason',
        'methodVersion',
      ].every((key) => expected[key as keyof QuoteSnapshot] === value[key as keyof QuoteSnapshot])
    );
  } catch {
    return false;
  }
}
export const validateNormalizedQuote = validateQuoteSnapshot;

export function deriveCrossQuote(
  first: QuoteSnapshot,
  second: QuoteSnapshot,
): DerivedCrossQuote | null {
  if (
    !validateQuoteSnapshot(first) ||
    !validateQuoteSnapshot(second) ||
    !first.rate ||
    !second.rate ||
    first.toCurrency !== second.fromCurrency ||
    first.fromCurrency === second.toCurrency ||
    first.providerId !== second.providerId
  )
    return null;
  const a = first.sourceQuote,
    b = second.sourceQuote;
  if (
    a.deliveryMethod !== b.deliveryMethod ||
    a.channel !== b.channel ||
    a.serviceCountry !== b.serviceCountry ||
    a.branchId !== b.branchId
  )
    return null;
  return {
    kind: 'derived_cross',
    providerId: first.providerId,
    fromCurrency: first.fromCurrency,
    toCurrency: second.toCurrency,
    rate: canonical(new D(first.rate).mul(second.rate)),
    legs: [first.quoteId, second.quoteId],
    recommendable: false,
  };
}
/** Decimal strings retain raw precision; the legacy writer owns its numeric serialization. */
export function exportLegacyRates(
  quotes: readonly QuoteSnapshot[],
  providerId: 'bot' | 'moneybox',
): Record<string, Record<string, string | null>> {
  const rows = Object.create(null) as Record<string, Record<string, string | null>>;
  for (const quote of quotes) {
    if (!validateQuoteSnapshot(quote) || quote.providerId !== providerId)
      throw new Error('Invalid legacy source');
    const source = quote.sourceQuote;
    if (providerId === 'moneybox') {
      const multiplier = ['JPY', 'IDR', 'VND'].includes(source.subjectCurrency) ? '100' : '1';
      rows[source.subjectCurrency] = {
        sell:
          source.buy === null
            ? null
            : new D(source.buy).div(source.unitAmount).mul(multiplier).toFixed(),
        buy:
          source.sell === null
            ? null
            : new D(source.sell).div(source.unitAmount).mul(multiplier).toFixed(),
      };
    } else {
      const output =
        rows[source.subjectCurrency] ??
        (rows[source.subjectCurrency] = Object.create(null) as Record<string, string | null>);
      const prefix = source.deliveryMethod === 'cash' ? 'cash' : 'spot';
      output[`${prefix}Buy`] = source.buy;
      output[`${prefix}Sell`] = source.sell;
    }
  }
  return rows;
}

export function estimateDerived(
  first: QuoteSnapshot,
  second: QuoteSnapshot,
  request: EstimateRequest,
): DerivedEstimateResult {
  const route = deriveCrossQuote(first, second);
  const result =
    !route ||
    !validateEstimateRequest(request) ||
    !isValidAmount(request.amount) ||
    route.fromCurrency !== request.fromCurrency ||
    route.toCurrency !== request.toCurrency
      ? unavailable('invalid_derived_route')
      : estimateAmounts(route.rate, request, null, 'unknown');
  return { ...result, kind: 'derived_cross', legs: route?.legs ?? [], recommendable: false };
}

export function validateProviderSnapshot(value: unknown): value is ProviderSnapshot {
  return (
    validateProviderShape(value) &&
    value.quotes.length > 0 &&
    value.quotes.every(
      (quote) => quote.providerId === value.providerId && validateQuoteSnapshot(quote),
    ) &&
    new Set(value.quotes.map((quote) => quote.quoteId)).size === value.quotes.length
  );
}
