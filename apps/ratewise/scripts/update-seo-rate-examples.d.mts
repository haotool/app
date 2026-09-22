export interface GeneratedAlternativeProvider {
  rate: number | null;
  rateBuy: number | null;
}

export interface GeneratedSeoExample {
  alternativeProviders?: GeneratedAlternativeProvider[];
}

export function buildSeoExamples(
  bankPayload: unknown,
  moneyboxPayload?: unknown,
): Record<string, GeneratedSeoExample>;
