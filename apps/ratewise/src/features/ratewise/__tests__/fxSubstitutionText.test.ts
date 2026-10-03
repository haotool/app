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

const delivery = (toCurrency: string): FxContextSubstitution => ({
  kind: 'deliveryMethod',
  from: 'account',
  to: 'cash',
  fromCurrency: 'TWD',
  toCurrency,
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

  it('does not announce location substitutions; the chosen provider already implies them', () => {
    expect(summarizeFxSubstitutions([location('JPY'), location('KRW')])).toEqual([]);
  });

  it('collapses the same reason across many currencies into one line', () => {
    const currencies = ['JPY', 'KRW', 'CNY', 'VND', 'THB', 'HKD', 'PHP', 'MYR'];

    expect(summarizeFxSubstitutions(currencies.map(delivery))).toEqual([
      'JPY、KRW、CNY 等 8 種幣別無即期報價，改以現鈔計算。',
    ]);
  });

  it('lists few currencies explicitly and keeps location out of the result', () => {
    expect(summarizeFxSubstitutions([location('JPY'), delivery('KRW'), delivery('VND')])).toEqual([
      'KRW、VND無即期報價，改以現鈔計算。',
    ]);
  });

  it('does not repeat a currency that appears twice for the same reason', () => {
    expect(summarizeFxSubstitutions([delivery('JPY'), delivery('JPY')])).toEqual([
      'JPY無即期報價，改以現鈔計算。',
    ]);
  });
});
