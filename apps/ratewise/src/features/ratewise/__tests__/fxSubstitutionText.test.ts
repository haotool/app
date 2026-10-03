import { describe, expect, it } from 'vitest';
import type { FxContextSubstitution } from '../fxEffectiveContext';
import { formatFxSubstitution, summarizeFxSubstitutions } from '../fxSubstitutionText';

const location = (toCurrency: string, providerIds = ['moneybox']): FxContextSubstitution => ({
  kind: 'location',
  from: 'TW|',
  to: 'KR|myeongdong',
  fromCurrency: 'TWD',
  toCurrency,
  country: 'KR',
  branchId: 'myeongdong',
  providerIds,
});

describe('fxSubstitutionText', () => {
  it('shows the provider branch label instead of the raw branch id', () => {
    const text = formatFxSubstitution(location('KRW'));

    expect(text).toContain('（明洞）');
    expect(text).not.toContain('myeongdong');
  });

  it('lists each provider once even when the route repeats it', () => {
    expect(formatFxSubstitution(location('JPY', ['moneybox', 'moneybox']))).toBe(
      'JPY：明洞換匯所僅提供南韓（明洞）據點報價，已以該地點計算。',
    );
  });

  it('collapses the same reason across many currencies into one line', () => {
    const currencies = ['JPY', 'KRW', 'CNY', 'VND', 'THB', 'HKD', 'PHP', 'MYR'];

    const lines = summarizeFxSubstitutions(currencies.map((currency) => location(currency)));

    expect(lines).toEqual([
      'JPY、KRW、CNY 等 8 種幣別：明洞換匯所僅提供南韓（明洞）據點報價，已以該地點計算。',
    ]);
  });

  it('lists few currencies explicitly and keeps different reasons on separate lines', () => {
    const lines = summarizeFxSubstitutions([
      location('JPY'),
      location('KRW'),
      {
        kind: 'deliveryMethod',
        from: 'account',
        to: 'cash',
        fromCurrency: 'USD',
        toCurrency: 'VND',
      },
    ]);

    expect(lines).toEqual([
      'JPY、KRW：明洞換匯所僅提供南韓（明洞）據點報價，已以該地點計算。',
      'VND無即期報價，改以現鈔計算。',
    ]);
  });

  it('does not repeat a currency that appears twice for the same reason', () => {
    expect(summarizeFxSubstitutions([location('JPY'), location('JPY')])).toHaveLength(1);
    expect(summarizeFxSubstitutions([location('JPY'), location('JPY')])[0]).toMatch(/^JPY：/);
  });
});
