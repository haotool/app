// fetch-moneybox-rates.js 型別宣告（#900）：實作以 .js 為 SSOT，本檔僅描述既有 export 形狀。
export interface MoneyBoxRateQuote {
  currency?: string;
  sell?: number | null;
  buy?: number | null;
  base?: number | null;
  spbuy?: number | null;
  spsell?: number | null;
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
  updateTime?: string;
  timestamp?: string;
  schemaVersion?: number;
}

export interface RefreshDecision {
  shouldUpdate: boolean;
  reason: 'rate-changed' | 'date-rollover' | 'unchanged';
  rateChanges: RateChange[];
  oldSnapshotDate?: string;
  newSnapshotDate?: string;
}

export function fetchMoneyBoxRates(): Promise<MoneyBoxRates>;
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
