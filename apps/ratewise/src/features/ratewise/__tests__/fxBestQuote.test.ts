import { describe, expect, it } from 'vitest';
import { normalizeQuote, type SelectionContext } from '@app/shared/fx';
import { selectBestQuote } from '../fxBestQuote';

const NOW = '2026-09-30T00:00:00Z';
const moneybox = normalizeQuote({
  providerId: 'moneybox',
  subjectCurrency: 'USD',
  priceCurrency: 'KRW',
  unitAmount: '1',
  providerBuyPrice: '1300',
  providerSellPrice: '1350',
  sourcePublishedAt: NOW,
  fetchedAt: NOW,
  lastSuccessfulCheckAt: NOW,
  serviceCountry: 'KR',
  deliveryMethod: 'cash',
  channel: 'branch',
  branchId: 'myeongdong',
  dataKind: 'published_board',
});
const context: SelectionContext = {
  now: NOW,
  country: 'KR',
  deliveryMethod: 'cash',
  channel: 'branch',
  branchId: 'myeongdong',
};
const usdToKrw = { fromCurrency: 'USD', toCurrency: 'KRW', mode: 'EXACT_IN' as const };
const ok = new Map<string, 'ok' | 'failed'>([['moneybox', 'ok']]);

describe('selectBestQuote', () => {
  it('ranks normally for a positive amount', () => {
    const quote = selectBestQuote(moneybox, { ...usdToKrw, amount: '10' }, context, ok);

    expect(quote?.providerId).toBe('moneybox');
  });

  it('keeps a valid zero amount on an applicable, healthy non-BoT provider', () => {
    const quote = selectBestQuote(moneybox, { ...usdToKrw, amount: '0' }, context, ok);

    expect(quote?.providerId).toBe('moneybox');
  });

  it('does not use a failed provider for a zero amount', () => {
    const failed = new Map<string, 'ok' | 'failed'>([['moneybox', 'failed']]);

    expect(selectBestQuote(moneybox, { ...usdToKrw, amount: '0' }, context, failed)).toBeNull();
  });
});
