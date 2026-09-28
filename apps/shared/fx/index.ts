import Decimal from 'decimal.js';
import { FX_PUBLISHER } from './publisher-metadata.mjs';
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
  ReleaseManifest,
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
import { minorUnit } from './minor-units.mjs';
import { FX_PROVIDER_METADATA } from './provider-metadata.mjs';
export { MINOR_UNITS, minorUnit } from './minor-units.mjs';
const D = Decimal.clone({ precision: 80, rounding: Decimal.ROUND_HALF_EVEN });
export function isValidAmount(value: string): boolean {
  return (
    value.length <= 25 &&
    /^(0|[1-9]\d*)(\.\d{1,8})?$/.test(value) &&
    new D(value).lte('9007199254740991')
  );
}
/**
 * App 輸入邊界：計算機結果可能帶超過 8 位小數、指數或負號。
 * 依幣別 minor unit 四捨五入（半位取偶）後再估算；負數以絕對值估算並回報符號。
 */
export function normalizeAmountInput(
  value: string,
  currency: string,
): { amount: string; negative: boolean } | null {
  const trimmed = value.trim();
  // 無歧義文法（避免多項式回溯 ReDoS）並限制長度；計算機結果不會超過 64 字元。
  if (trimmed.length > 64 || !/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed))
    return null;
  let scale: number;
  try {
    scale = minorUnit(currency);
  } catch {
    scale = 8;
  }
  const parsed = new D(trimmed);
  // 先界定數量級再展開：`1e999999999` 若直接 toFixed 會產生十億位字串（OOM）。
  if (parsed.abs().gt('9007199254740991')) return null;
  const amount = parsed.abs().toDecimalPlaces(scale, Decimal.ROUND_HALF_EVEN).toFixed();
  if (!isValidAmount(amount)) return null;
  return { amount, negative: parsed.isNegative() && !new D(amount).isZero() };
}
function positive(value: string | null): value is string {
  return value !== null && new D(value).gt(0);
}
/** PRD §18.4：倒數與無法整除的推導值保留 12 位小數 ROUND_HALF_EVEN。 */
export const RECIPROCAL_DECIMAL_PLACES = 12;
function derived(value: Decimal): string {
  return value.toDecimalPlaces(RECIPROCAL_DECIMAL_PLACES, Decimal.ROUND_HALF_EVEN).toFixed();
}
/** 可有限表示的來源直接值保留原始位數；無法整除時才落到 12 位小數。 */
function direct(value: Decimal): string {
  return value.decimalPlaces() <= 40 ? value.toFixed() : derived(value);
}
/** 與語系無關的 code-point 排序；localeCompare 會因 cs/sk 等 collation 改變排序。 */
export function compareCodePoints(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
export const FX_CONTRACT_SCHEMA_URL =
  'https://app.haotool.org/ratewise/api/v3/contract.schema.json' as const;
/** PRD §21.3：我方網站標示（manifest 層一次）。 */
export { FX_PUBLISHER };
/** 上游 provider 標示 SSOT 位於 provider-metadata.mjs（零依賴，RateWise 開放資料 metadata 共用）。 */
export { FX_PROVIDER_METADATA } from './provider-metadata.mjs';
/** 與 schema.json ReleaseManifest.calculationRule const 一致；producer 嚴格驗證守門。 */
export const FX_CALCULATION_RULE =
  'toAmount = fromAmount × rate（rate 為每 1 fromCurrency 的 toCurrency）；EXACT_OUT 以來源原值計算 fromAmount = ceil_minor(toAmount × unitAmount ÷ providerPrice)；倒數 rate 保留 12 位小數 ROUND_HALF_EVEN；金額依 ISO 4217 minor unit 捨入';
export const FX_QUOTE_AVAILABILITY = 'indicative_not_transaction_guarantee';
type ReleaseProvider = ReleaseManifest['providers'][number];
type ReleaseProviderStatus = Pick<
  ReleaseProvider,
  'providerId' | 'snapshot' | 'checkStatus' | 'lastSuccessfulCheckAt'
>;
export function buildProviderSnapshot(
  providerId: string,
  quotes: readonly QuoteSnapshot[],
): ProviderSnapshot {
  const [first, ...rest] = quotes;
  if (!first) throw new Error('Empty provider snapshot');
  return {
    $schema: FX_CONTRACT_SCHEMA_URL,
    schemaVersion: '3.0',
    providerId,
    quotes: [first, ...rest],
  };
}
/** manifest 層一次帶出 publisher、provider 標示、計算規則與可用性聲明。 */
export function buildReleaseManifest(input: {
  generatedAt: string;
  providers: readonly ReleaseProviderStatus[];
  history: ReleaseManifest['history'];
  deprecation: ReleaseManifest['deprecation'];
}): ReleaseManifest {
  return {
    $schema: FX_CONTRACT_SCHEMA_URL,
    schemaVersion: '3.0',
    generatedAt: input.generatedAt,
    publisher: { ...FX_PUBLISHER },
    providers: input.providers.map((provider) => {
      const meta = FX_PROVIDER_METADATA[provider.providerId as keyof typeof FX_PROVIDER_METADATA];
      if (!meta) throw new Error(`Unknown provider metadata: ${provider.providerId}`);
      return {
        providerId: provider.providerId,
        snapshot: provider.snapshot,
        checkStatus: provider.checkStatus,
        lastSuccessfulCheckAt: provider.lastSuccessfulCheckAt,
        ...meta,
        // nextSourceCheckAt 選填不輸出（PRD §18.5）：排程由 cron 驅動、不承諾上游更新，日後相容新增。
      };
    }),
    history: input.history,
    deprecation: input.deprecation,
    calculationRule: FX_CALCULATION_RULE,
    quoteAvailability: FX_QUOTE_AVAILABILITY,
  };
}
export type UnavailableReason = Exclude<QuoteSnapshot['unavailableReason'], null>;
/** quoteSeriesId：同一 provider／通路／地點／方向的時間序列鍵；不內嵌來源 JSON。 */
export function quoteSeriesIdOf(
  row: Pick<
    SourceQuote,
    'providerId' | 'deliveryMethod' | 'channel' | 'serviceCountry' | 'branchId'
  >,
  fromCurrency: string,
  toCurrency: string,
): string {
  return `fx3:${row.providerId}:${row.deliveryMethod}:${row.channel}:${row.serviceCountry}:${row.branchId ?? '-'}:${fromCurrency}-${toCurrency}`;
}
export function normalizeQuote(row: SourceQuote): QuoteSnapshot[] {
  const buy = row.providerBuyPrice,
    sell = row.providerSellPrice;
  if (
    !validateSourceQuote(row) ||
    (row.feeStatus === 'no_additional_fee' && !row.feeEvidenceUrl) ||
    (row.amountRange && new D(row.amountRange.min).gt(row.amountRange.max)) ||
    row.denominations?.some((value) => !positive(value)) ||
    !positive(row.unitAmount) ||
    row.subjectCurrency === row.priceCurrency ||
    (buy !== null && !positive(buy)) ||
    (sell !== null && !positive(sell))
  )
    throw new Error('Invalid source quote');
  const observedAt = row.sourcePublishedAt ?? row.fetchedAt;
  // 業者買入 subjectCurrency：subject → price；業者賣出 subjectCurrency：price → subject。
  return (
    [
      [row.subjectCurrency, row.priceCurrency, buy, row.providerBuyUnavailableReason],
      [row.priceCurrency, row.subjectCurrency, sell, row.providerSellUnavailableReason],
    ] as const
  ).map(([fromCurrency, toCurrency, price, reason], index) => {
    const quoteSeriesId = quoteSeriesIdOf(row, fromCurrency, toCurrency);
    return {
      quoteId: `${quoteSeriesId}@${observedAt}`,
      quoteSeriesId,
      providerId: row.providerId,
      fromCurrency,
      toCurrency,
      status: price === null ? 'unavailable' : 'available',
      rate:
        price === null
          ? null
          : index === 0
            ? direct(new D(price).div(row.unitAmount))
            : derived(new D(row.unitAmount).div(price)),
      unavailableReason: price === null ? (reason ?? 'not_quoted') : null,
      sourceQuote: structuredClone(row),
      methodVersion: '1',
    };
  });
}
/** EXACT_OUT 所需的「每 1 toCurrency 需支付的 fromCurrency」，直接由來源原值計算。 */
const sourcePerTargetCache = new WeakMap<QuoteSnapshot, Decimal | null>();
const quoteRateCache = new WeakMap<QuoteSnapshot, Decimal>();
const POSITIVE_DECIMAL = /^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d+)?$/;
function sourcePerTarget(quote: QuoteSnapshot): Decimal | null {
  if (sourcePerTargetCache.has(quote)) return sourcePerTargetCache.get(quote) ?? null;
  const row = quote.sourceQuote;
  const result =
    quote.fromCurrency === row.priceCurrency && row.providerSellPrice !== null
      ? new D(row.providerSellPrice).div(row.unitAmount)
      : quote.fromCurrency === row.subjectCurrency && row.providerBuyPrice !== null
        ? new D(row.unitAmount).div(row.providerBuyPrice)
        : null;
  sourcePerTargetCache.set(quote, result);
  return result;
}
export function boardMidpoint(row: SourceQuote): string | null {
  if (
    !validateSourceQuote(row) ||
    !positive(row.unitAmount) ||
    !positive(row.providerBuyPrice) ||
    !positive(row.providerSellPrice)
  )
    return null;
  return direct(new D(row.providerBuyPrice).plus(row.providerSellPrice).div(2).div(row.unitAmount));
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
// 載入快照時已完整驗證 schema；估算熱路徑只檢查算術必要欄位。
function hasUsableQuote(quote: QuoteSnapshot | null): quote is QuoteSnapshot {
  if (!quote || typeof quote !== 'object') return false;
  const source = quote.sourceQuote;
  const validPrice = (value: string | null) => value === null || POSITIVE_DECIMAL.test(value);
  return (
    typeof quote.quoteId === 'string' &&
    typeof quote.fromCurrency === 'string' &&
    typeof quote.toCurrency === 'string' &&
    quote.status === 'available' &&
    typeof quote.rate === 'string' &&
    POSITIVE_DECIMAL.test(quote.rate) &&
    !!source &&
    typeof source === 'object' &&
    typeof source.unitAmount === 'string' &&
    POSITIVE_DECIMAL.test(source.unitAmount) &&
    (source.providerBuyPrice === null ||
      (typeof source.providerBuyPrice === 'string' && validPrice(source.providerBuyPrice))) &&
    (source.providerSellPrice === null ||
      (typeof source.providerSellPrice === 'string' && validPrice(source.providerSellPrice)))
  );
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
  const quoteId = quote?.quoteId ?? null;
  if (!hasUsableQuote(quote)) return unavailable('not_quoted', quoteId);
  const rate = quote.rate;
  if (rate === null) return unavailable('not_quoted', quoteId);
  if (quote.fromCurrency !== request.fromCurrency || quote.toCurrency !== request.toCurrency)
    return unavailable('direction_mismatch', quote.quoteId);
  // EXACT_OUT：from = ceil_minor(to × unitAmount ÷ providerPrice)，禁止除以捨入後的 rate。
  return estimateAmounts(
    rate,
    request,
    quote.quoteId,
    quote.sourceQuote.feeStatus ?? 'unknown',
    sourcePerTarget(quote),
    quoteRateCache.get(quote) ?? cacheQuoteRate(quote, rate),
  );
}
function cacheQuoteRate(quote: QuoteSnapshot, value: string): Decimal {
  const cached = new D(value);
  quoteRateCache.set(quote, cached);
  return cached;
}
function estimateAmounts(
  canonicalRate: string,
  request: EstimateRequest,
  quoteId: string | null,
  feeStatus: EstimateResult['feeStatus'],
  sourcePerTarget: Decimal | null = null,
  cachedRate?: Decimal,
): EstimateResult {
  let fromScale: number;
  let toScale: number;
  try {
    fromScale = minorUnit(request.fromCurrency);
    toScale = minorUnit(request.toCurrency);
  } catch {
    return unavailable('unsupported_currency', quoteId);
  }
  const rate = cachedRate ?? new D(canonicalRate),
    amount = new D(request.amount);
  const from =
    request.mode === 'EXACT_IN'
      ? amount
      : (sourcePerTarget ? amount.mul(sourcePerTarget) : amount.div(rate)).toDecimalPlaces(
          fromScale,
          Decimal.ROUND_CEIL,
        );
  const to =
    request.mode === 'EXACT_OUT'
      ? amount
      : from.mul(rate).toDecimalPlaces(toScale, Decimal.ROUND_HALF_EVEN);
  if (from.gt('9007199254740991') || to.gt('9007199254740991'))
    return unavailable('amount_out_of_range', quoteId);
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
/** PRD 049 新鮮度門檻 SSOT：以來源發布時間計算；未列 provider 採較嚴格的 24 小時。 */
export const FRESHNESS_MAX_HOURS: Readonly<Record<string, number>> = Object.freeze({
  bot: 36,
  moneybox: 24,
});
/**
 * `unknown`：來源未提供發布時間（或時間不合法／晚於現在），不可當成已過期。
 * `stale`：來源發布時間超過 provider 門檻。檢查時間不參與判斷（不落盤、不造成 churn）。
 */
export function freshness(quote: QuoteSnapshot, now: string): 'fresh' | 'stale' | 'unknown' {
  const row = quote.sourceQuote;
  if (row.sourcePublishedAt === null) return 'unknown';
  const time = Date.parse(now),
    published = Date.parse(row.sourcePublishedAt);
  if (![time, published].every(Number.isFinite) || published > time) return 'unknown';
  const maxHours = FRESHNESS_MAX_HOURS[row.providerId] ?? 24;
  return time - published <= maxHours * 3600000 ? 'fresh' : 'stale';
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
    !hasUsableQuote(quote)
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
        quote.sourceQuote.dataKind === 'published_board',
    )
    .map((quote) => ({ quote, estimate: estimate(quote, request) }))
    .sort((a, b) =>
      request.mode === 'EXACT_IN'
        ? new D(b.estimate.toAmount ?? '0').cmp(a.estimate.toAmount ?? '0') ||
          compareCodePoints(a.quote.quoteId, b.quote.quoteId)
        : new D(a.estimate.fromAmount ?? '0').cmp(b.estimate.fromAmount ?? '0') ||
          compareCodePoints(a.quote.quoteId, b.quote.quoteId),
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
/**
 * 單側價格：缺值為 not_quoted（ECB M）；0 代表業者停供為 suppressed（Q）；
 * 無法解析的值為 not_collected（L，資料存在但未能取得有效值）。一側異常不影響另一側。
 */
function sidePrice(value: unknown): {
  price: string | null;
  reason?: Exclude<UnavailableReason, 'not_quoted'>;
} {
  if (value === null || value === undefined) return { price: null };
  try {
    return { price: decimalValue(value) };
  } catch {
    const text = typeof value === 'number' ? String(value) : value;
    return typeof text === 'string' && /^0+(\.0+)?$/.test(text.trim())
      ? { price: null, reason: 'suppressed' }
      : { price: null, reason: 'not_collected' };
  }
}
function sidePrices(
  buyValue: unknown,
  sellValue: unknown,
): Pick<
  SourceQuote,
  | 'providerBuyPrice'
  | 'providerSellPrice'
  | 'providerBuyUnavailableReason'
  | 'providerSellUnavailableReason'
> {
  const buy = sidePrice(buyValue),
    sell = sidePrice(sellValue);
  return {
    providerBuyPrice: buy.price,
    providerSellPrice: sell.price,
    ...(buy.reason ? { providerBuyUnavailableReason: buy.reason } : {}),
    ...(sell.reason ? { providerSellUnavailableReason: sell.reason } : {}),
  };
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
/** 單列壞值只排除該列（不發布、不推測），其餘列照常可用；payload 層錯誤仍整體拒絕。 */
function validRows(build: () => QuoteSnapshot[]): QuoteSnapshot[] {
  try {
    return build();
  } catch {
    return [];
  }
}
export function normalizeBankSnapshot(value: unknown): QuoteSnapshot[] {
  const payload = record(value),
    rows = record(payload['sourceQuotes'] ?? payload['details']),
    time = times(payload);
  const dataKind = payload['dataKind'] === 'fixed_fallback' ? 'fixed_fallback' : 'published_board';
  return Object.entries(rows).flatMap(([currency, value]) =>
    (['cash', 'spot'] as const).flatMap((method) =>
      validRows(() => {
        const detail = record(value);
        if (detail[method] === undefined) return [];
        const prices = record(detail[method]);
        return normalizeQuote({
          providerId: 'bot',
          subjectCurrency: currency,
          priceCurrency: 'TWD',
          unitAmount: '1',
          ...sidePrices(prices['buy'], prices['sell']),
          ...time,
          serviceCountry: 'TW',
          deliveryMethod: method === 'cash' ? 'cash' : 'account',
          channel: method === 'cash' ? 'branch' : 'online',
          feeStatus: 'unknown',
          originalBuyField: `${method}.buy`,
          originalSellField: `${method}.sell`,
          mappingVersion: 'bot-1',
          dataKind,
        });
      }),
    ),
  );
}
export function normalizeMoneyboxSnapshot(value: unknown): QuoteSnapshot[] {
  const payload = record(value),
    canonicalRows = payload['sourceQuotes'] !== undefined,
    rows = record(payload['sourceQuotes'] ?? payload['rates']),
    time = times(payload);
  return Object.entries(rows).flatMap(([currency, value]) =>
    validRows(() => {
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
        ...sidePrices(
          prices[canonicalRows ? 'buy' : 'sell'],
          prices[canonicalRows ? 'sell' : 'buy'],
        ),
        ...time,
        serviceCountry: 'KR',
        deliveryMethod: 'cash',
        channel: 'branch',
        branchId: 'myeongdong',
        feeStatus: 'unknown',
        originalBuyField: canonicalRows ? 'buyRate' : 'sell',
        originalSellField: canonicalRows ? 'sellRate' : 'buy',
        mappingVersion: canonicalRows ? 'moneybox-2' : 'moneybox-legacy-1',
        dataKind: 'published_board',
      });
    }),
  );
}

/** Structural validation and reconstruction of the economic meaning are both required. */
export function validateQuoteSnapshot(value: unknown): value is QuoteSnapshot {
  if (!validateQuoteShape(value)) return false;
  try {
    const expected = normalizeQuote(value.sourceQuote).find(
      (q) => q.fromCurrency === value.fromCurrency && q.toCurrency === value.toCurrency,
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
    rate: derived(new D(first.rate).mul(second.rate)),
    legs: [first.quoteId, second.quoteId],
    recommendable: false,
  };
}
/**
 * Decimal strings retain raw precision; the legacy writer owns its numeric serialization.
 * S4-DELETE：v2 legacy 投影，S4 切換並下線 v2 後刪除（見 049 實作文件 S4 清單）。
 */
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
          source.providerBuyPrice === null
            ? null
            : new D(source.providerBuyPrice).div(source.unitAmount).mul(multiplier).toFixed(),
        buy:
          source.providerSellPrice === null
            ? null
            : new D(source.providerSellPrice).div(source.unitAmount).mul(multiplier).toFixed(),
      };
    } else {
      const output =
        rows[source.subjectCurrency] ??
        (rows[source.subjectCurrency] = Object.create(null) as Record<string, string | null>);
      const prefix = source.deliveryMethod === 'cash' ? 'cash' : 'spot';
      output[`${prefix}Buy`] = source.providerBuyPrice;
      output[`${prefix}Sell`] = source.providerSellPrice;
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
