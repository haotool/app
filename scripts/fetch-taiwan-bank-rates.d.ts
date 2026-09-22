// fetch-taiwan-bank-rates.js 型別宣告（#900）：實作以 .js 為 SSOT，本檔僅描述既有 export 形狀。
export type TaiwanBankRates = Record<string, number>;

export interface TaiwanBankRateDetail {
  name: string;
  spot: { buy: number | null; sell: number | null };
  cash: { buy: number | null; sell: number | null };
}

export interface TaiwanBankSourceQuote {
  cash: { buy: string | null; sell: string | null };
  spot: { buy: string | null; sell: string | null };
}

export interface TaiwanBankParseResult {
  rates: TaiwanBankRates;
  details: Record<string, TaiwanBankRateDetail>;
  sourceQuotes: Record<string, TaiwanBankSourceQuote>;
}

export interface TaiwanBankFetchResult extends TaiwanBankParseResult {
  timestamp: string;
  fetchedAt: string;
  lastSuccessfulCheckAt: string;
  sourcePublishedAt: null;
}

export function fetchTaiwanBankRates(): Promise<TaiwanBankFetchResult>;
export function parseTaiwanBankCSV(csvText: string): TaiwanBankParseResult;
export function assertRatesIntegrity(
  newRates: TaiwanBankRates | null | undefined,
  previousRates: TaiwanBankRates | null | undefined,
  options?: { minCurrencyCount?: number; mutationThreshold?: number },
): void;
export function resolveMutationThreshold(env?: Record<string, string | undefined>): number;
export function hasRateChanges(newData: unknown, previousData?: unknown): boolean;
