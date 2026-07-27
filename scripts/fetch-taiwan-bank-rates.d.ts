// fetch-taiwan-bank-rates.js 型別宣告（#900）：實作以 .js 為 SSOT，本檔僅描述既有 export 形狀。
export type TaiwanBankRates = Record<string, number>;

export interface TaiwanBankParseResult {
  rates: TaiwanBankRates;
  details: Record<string, unknown>;
}

export function fetchTaiwanBankRates(): Promise<TaiwanBankParseResult>;
export function parseTaiwanBankCSV(csvText: string): TaiwanBankParseResult;
export function assertRatesIntegrity(
  newRates: TaiwanBankRates | null | undefined,
  previousRates: TaiwanBankRates | null | undefined,
  options?: { minCurrencyCount?: number; mutationThreshold?: number },
): void;
export function resolveMutationThreshold(env?: Record<string, string | undefined>): number;
