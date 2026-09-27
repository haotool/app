import type { QuoteSnapshot } from '@app/shared/fx';

export interface GeneratedAlternativeProvider {
  providerId: string;
  quotes: QuoteSnapshot[];
}

export interface GeneratedSeoExample {
  alternativeProviders?: GeneratedAlternativeProvider[];
}

export function buildSeoExamples(
  bankPayload: unknown,
  moneyboxPayload?: unknown,
): Record<string, GeneratedSeoExample>;
