// fetch-moneybox-rates.js 型別宣告（#900）：實作以 .js 為 SSOT，本檔僅描述既有 export 形狀。
export interface MoneyBoxRateQuote {
  currency?: string;
  sell?: number | null;
  buy?: number | null;
  base?: number | null;
  spbuy?: number | null;
  spsell?: number | null;
}

export interface MoneyBoxSourceQuote {
  buy: string | null;
  sell: string | null;
  unitAmount: string;
}

export type MoneyBoxRates = Record<string, MoneyBoxRateQuote>;

export interface RateChange {
  currency: string;
  field: string;
  oldValue: number | undefined;
  newValue: number | undefined;
}

export interface MoneyBoxSnapshot {
  rates?: MoneyBoxRates;
  sourceQuotes?: Record<string, MoneyBoxSourceQuote>;
  sourcePublishedAt?: string | null;
  fetchedAt?: string;
  lastSuccessfulCheckAt?: string;
  updateTime?: string;
  timestamp?: string;
  schemaVersion?: string;
}

export interface MoneyBoxFetchResult extends MoneyBoxSnapshot {
  rates: MoneyBoxRates;
  sourceQuotes: Record<string, MoneyBoxSourceQuote>;
  sourcePublishedAt: string | null;
  fetchedAt: string;
  lastSuccessfulCheckAt: string;
}

export interface RefreshDecision {
  shouldUpdate: boolean;
  reason: 'rate-changed' | 'date-rollover' | 'unchanged';
  rateChanges: RateChange[];
  oldSnapshotDate?: string;
  newSnapshotDate?: string;
}

export function fetchMoneyBoxRates(): Promise<MoneyBoxFetchResult>;
export function listRateChanges(oldRates?: MoneyBoxRates, newRates?: MoneyBoxRates): RateChange[];
export function needsSchemaMigration(): boolean;
export function extractSeoulSnapshotDate(
  snapshot: MoneyBoxSnapshot | null | undefined,
): string | null;
export function shouldRefreshLatestSnapshot(
  oldData?: MoneyBoxSnapshot,
  newData?: MoneyBoxSnapshot,
): RefreshDecision;
export function assertMoneyBoxRatesIntegrity(
  newRates: MoneyBoxRates | null | undefined,
  previousRates: MoneyBoxRates | null | undefined,
  options?: { minCurrencyCount?: number; mutationThreshold?: number },
): void;
export function resolveMutationThreshold(env?: Record<string, string | undefined>): number;

/** 將新 API 的一列轉為 legacy 欄位結構；無效列回傳 null。 */
export function mapUpstreamRow(item: unknown): [string, MoneyBoxRateQuote] | null;

/** 將上游每 1 單位報價還原為既有 per-100 慣例（僅 JPY/IDR/VND）。 */
export function toLegacyQuoteUnit(code: string, value: number | null): number | null;

/** 兩側牌告價的算術中點。 */
export function deriveMidpoint(buy: number | null, sell: number | null): number | null;
