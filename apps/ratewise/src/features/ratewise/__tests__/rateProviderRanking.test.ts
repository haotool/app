import { describe, it, expect, vi } from 'vitest';
import type {
  RateProviderPreference,
  RateProviderRef,
  ResolvedRateProvider,
} from '../rateProviderTypes';
import {
  rankProviderQuotes,
  resolveProviderPreference,
  type ProviderQuote,
} from '../rateProviderRanking';

const botRef: RateProviderRef = { sourceKind: 'bank', providerId: 'bot' };
const moneyboxRef: RateProviderRef = {
  sourceKind: 'exchange-shop',
  providerId: 'moneybox',
};

function makeQuote(overrides: Partial<ProviderQuote> = {}): ProviderQuote {
  return {
    provider: { ...botRef },
    rateType: 'cash',
    sourceKind: 'bank',
    unitRate: 0.0259,
    resultAmount: 25.9,
    isAvailable: true,
    ...overrides,
  };
}

describe('rankProviderQuotes', () => {
  it('quotes 為空時回傳空陣列', () => {
    const ranked = rankProviderQuotes({
      amount: 1000,
      from: 'KRW',
      to: 'TWD',
      rateType: 'cash',
      quotes: [],
    });
    expect(ranked).toEqual([]);
  });

  it('全部 isAvailable=false 時回傳空陣列', () => {
    const ranked = rankProviderQuotes({
      amount: 1000,
      from: 'KRW',
      to: 'TWD',
      rateType: 'cash',
      quotes: [
        makeQuote({ provider: { ...botRef }, isAvailable: false, resultAmount: 99 }),
        makeQuote({ provider: { ...moneyboxRef }, isAvailable: false, resultAmount: 100 }),
      ],
    });
    expect(ranked).toEqual([]);
  });

  it('混合 available 與 unavailable：僅保留 available，依 resultAmount 由大到小排序', () => {
    const high = makeQuote({
      provider: { ...moneyboxRef },
      sourceKind: 'exchange-shop',
      resultAmount: 27.5,
    });
    const low = makeQuote({ provider: { ...botRef }, resultAmount: 25.9 });
    const unavailable = makeQuote({
      provider: { sourceKind: 'bank', providerId: 'future-bank' },
      isAvailable: false,
      resultAmount: 999,
    });

    const ranked = rankProviderQuotes({
      amount: 1000,
      from: 'KRW',
      to: 'TWD',
      rateType: 'cash',
      quotes: [low, unavailable, high],
    });

    expect(ranked).toHaveLength(2);
    expect(ranked[0]).toBe(high);
    expect(ranked[1]).toBe(low);
    expect(ranked).not.toContain(unavailable);
  });

  it('resultAmount 相同時，維持輸入順序（穩定排序）', () => {
    const first = makeQuote({
      provider: { ...botRef },
      resultAmount: 30,
    });
    const second = makeQuote({
      provider: { ...moneyboxRef },
      sourceKind: 'exchange-shop',
      resultAmount: 30,
    });
    const third = makeQuote({
      provider: { sourceKind: 'bank', providerId: 'future-bank' },
      resultAmount: 30,
    });

    const ranked = rankProviderQuotes({
      amount: 1000,
      from: 'KRW',
      to: 'TWD',
      rateType: 'cash',
      quotes: [first, second, third],
    });

    expect(ranked).toEqual([first, second, third]);
  });

  it('不修改原 quotes 陣列（純函式）', () => {
    const a = makeQuote({ resultAmount: 1 });
    const b = makeQuote({ resultAmount: 2 });
    const input = [a, b];
    rankProviderQuotes({
      amount: 1,
      from: 'KRW',
      to: 'TWD',
      rateType: 'cash',
      quotes: input,
    });
    expect(input).toEqual([a, b]);
  });
});

describe('resolveProviderPreference - manual mode', () => {
  it('manualProvider 有對應 available quote → reason=manual', () => {
    const preference: RateProviderPreference = {
      mode: 'manual',
      manualProvider: { ...botRef },
    };
    const quote = makeQuote({ provider: { ...botRef } });

    const resolved = resolveProviderPreference({
      preference,
      from: 'USD',
      to: 'TWD',
      rateType: 'cash',
      quotes: [quote],
    });

    expect(resolved).toEqual<ResolvedRateProvider>({
      selectionMode: 'manual',
      sourceKind: 'bank',
      providerId: 'bot',
      reason: 'manual',
    });
  });

  it('manualProvider 支援該幣別組合但暫無 quote → 仍回 manual（讓 caller 顯示無資料）', () => {
    const preference: RateProviderPreference = {
      mode: 'manual',
      manualProvider: { ...botRef },
    };

    const resolved = resolveProviderPreference({
      preference,
      from: 'USD',
      to: 'TWD',
      rateType: 'cash',
      quotes: [],
    });

    expect(resolved).toEqual<ResolvedRateProvider>({
      selectionMode: 'manual',
      sourceKind: 'bank',
      providerId: 'bot',
      reason: 'manual',
    });
  });

  it('manualProvider 不支援該幣別組合（moneybox + USD）→ 退回預設並標記 unsupported-pair', () => {
    const preference: RateProviderPreference = {
      mode: 'manual',
      manualProvider: { ...moneyboxRef },
    };

    const resolved = resolveProviderPreference({
      preference,
      from: 'USD',
      to: 'TWD',
      rateType: 'cash',
      quotes: [],
    });

    expect(resolved).toEqual<ResolvedRateProvider>({
      selectionMode: 'manual',
      sourceKind: 'bank',
      providerId: 'bot',
      reason: 'unsupported-pair',
    });
  });

  it('manualProvider 為支援的非 TWD pair（moneybox + KRW/TWD）→ reason=manual', () => {
    const preference: RateProviderPreference = {
      mode: 'manual',
      manualProvider: { ...moneyboxRef },
    };
    const quote = makeQuote({
      provider: { ...moneyboxRef },
      sourceKind: 'exchange-shop',
    });

    const resolved = resolveProviderPreference({
      preference,
      from: 'KRW',
      to: 'TWD',
      rateType: 'cash',
      quotes: [quote],
    });

    expect(resolved.reason).toBe('manual');
    expect(resolved.providerId).toBe('moneybox');
    expect(resolved.sourceKind).toBe('exchange-shop');
  });

  it('manualProvider 未設定（mode=manual 但 manualProvider undefined）→ fallback-default', () => {
    const preference: RateProviderPreference = { mode: 'manual' };

    const resolved = resolveProviderPreference({
      preference,
      from: 'USD',
      to: 'TWD',
      rateType: 'cash',
      quotes: [],
    });

    expect(resolved).toEqual<ResolvedRateProvider>({
      selectionMode: 'manual',
      sourceKind: 'bank',
      providerId: 'bot',
      reason: 'fallback-default',
    });
  });

  it('manualProvider 為未知 providerId → 視為不支援，退回預設並標記 unsupported-pair', () => {
    const preference: RateProviderPreference = {
      mode: 'manual',
      manualProvider: { sourceKind: 'bank', providerId: 'unknown-bank' },
    };

    const resolved = resolveProviderPreference({
      preference,
      from: 'USD',
      to: 'TWD',
      rateType: 'cash',
      quotes: [],
    });

    expect(resolved).toEqual<ResolvedRateProvider>({
      selectionMode: 'manual',
      sourceKind: 'bank',
      providerId: 'bot',
      reason: 'unsupported-pair',
    });
  });
});

describe('resolveProviderPreference - best mode', () => {
  it('有可用 quotes → 取 ranked 第一名，reason=best-rate', () => {
    const preference: RateProviderPreference = { mode: 'best' };
    const better = makeQuote({
      provider: { ...moneyboxRef },
      sourceKind: 'exchange-shop',
      resultAmount: 27.5,
    });
    const worse = makeQuote({ provider: { ...botRef }, resultAmount: 25.9 });

    const resolved = resolveProviderPreference({
      preference,
      from: 'KRW',
      to: 'TWD',
      rateType: 'cash',
      quotes: [worse, better],
    });

    expect(resolved).toEqual<ResolvedRateProvider>({
      selectionMode: 'best',
      sourceKind: 'exchange-shop',
      providerId: 'moneybox',
      reason: 'best-rate',
    });
  });

  it('沒有 available quote → fallback 到預設 bank provider，reason=fallback-default', () => {
    const preference: RateProviderPreference = { mode: 'best' };

    const resolved = resolveProviderPreference({
      preference,
      from: 'USD',
      to: 'TWD',
      rateType: 'cash',
      quotes: [
        makeQuote({ isAvailable: false }),
        makeQuote({ provider: { ...moneyboxRef }, isAvailable: false }),
      ],
    });

    expect(resolved).toEqual<ResolvedRateProvider>({
      selectionMode: 'best',
      sourceKind: 'bank',
      providerId: 'bot',
      reason: 'fallback-default',
    });
  });

  it('quotes 為空 → fallback-default', () => {
    const resolved = resolveProviderPreference({
      preference: { mode: 'best' },
      from: 'USD',
      to: 'TWD',
      rateType: 'cash',
      quotes: [],
    });

    expect(resolved.reason).toBe('fallback-default');
    expect(resolved.providerId).toBe('bot');
    expect(resolved.sourceKind).toBe('bank');
  });
});

describe('resolveProviderPreference - 退化情境（registry default 缺失）', () => {
  it('當 getDefaultProvider("bank") 回 null 時，硬退回 {bot, bank}', async () => {
    vi.resetModules();
    vi.doMock('../../../config/rateProviders', async () => {
      const actual = await vi.importActual<typeof import('../../../config/rateProviders')>(
        '../../../config/rateProviders',
      );
      return {
        ...actual,
        getDefaultProvider: vi.fn(() => null),
      };
    });

    const { resolveProviderPreference: mockedResolve } = await import('../rateProviderRanking');

    const resolved = mockedResolve({
      preference: { mode: 'best' },
      from: 'USD',
      to: 'TWD',
      rateType: 'cash',
      quotes: [],
    });

    expect(resolved).toEqual<ResolvedRateProvider>({
      selectionMode: 'best',
      sourceKind: 'bank',
      providerId: 'bot',
      reason: 'fallback-default',
    });

    vi.doUnmock('../../../config/rateProviders');
    vi.resetModules();
  });
});
