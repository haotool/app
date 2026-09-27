import { estimate, type QuoteSnapshot } from '@app/shared/fx';

/** 同一方向報價供畫面、FAQ、CTA 與 JSON-LD 使用；未知時間不補值。 */
export function projectSeoQuote(
  quotes: readonly QuoteSnapshot[],
  currency: string,
  direction: 'to-twd' | 'twd-to-foreign',
  amount: string,
): {
  rate: string;
  amount: string;
  quoteId: string;
  providerSide: 'buy' | 'sell';
  sourcePublishedAt: string | null;
  fetchedAt: string;
} | null {
  const fromCurrency = direction === 'to-twd' ? currency : 'TWD';
  const toCurrency = direction === 'to-twd' ? 'TWD' : currency;
  const quote = quotes.find((q) => q.fromCurrency === fromCurrency && q.toCurrency === toCurrency);
  if (!quote) return null;
  const result = estimate(quote, { fromCurrency, toCurrency, amount, mode: 'EXACT_IN' });
  if (result.status !== 'available' || result.rate === null || result.toAmount === null)
    return null;
  return {
    rate: result.rate,
    amount: result.toAmount,
    quoteId: quote.quoteId,
    providerSide: quote.providerSide,
    sourcePublishedAt: quote.sourceQuote.sourcePublishedAt,
    fetchedAt: quote.sourceQuote.fetchedAt,
  };
}
