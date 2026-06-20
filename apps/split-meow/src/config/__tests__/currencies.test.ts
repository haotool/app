import { describe, it, expect } from 'vitest';
import { formatAmount, detectCurrencyFromTimezone, getCurrencySymbol } from '../currencies';

describe('formatAmount', () => {
  it('TWD：以 NT$ 前綴格式化', () => {
    expect(formatAmount(300, 'TWD')).toBe('NT$ 300');
  });

  it('TWD：四捨五入小數', () => {
    expect(formatAmount(99.6, 'TWD')).toBe('NT$ 100');
  });

  it('KRW：以 ₩ 前綴格式化', () => {
    expect(formatAmount(10000, 'KRW')).toBe('₩10,000');
  });

  it('KRW：四捨五入並加千分位', () => {
    expect(formatAmount(1234567.8, 'KRW')).toBe('₩1,234,568');
  });

  it('KRW：零元', () => {
    expect(formatAmount(0, 'KRW')).toBe('₩0');
  });
});

describe('getCurrencySymbol', () => {
  it('TWD → NT$', () => {
    expect(getCurrencySymbol('TWD')).toBe('NT$');
  });

  it('KRW → ₩', () => {
    expect(getCurrencySymbol('KRW')).toBe('₩');
  });
});

describe('detectCurrencyFromTimezone', () => {
  afterEach(() => vi.restoreAllMocks());

  function mockTimezone(tz: string) {
    vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ timeZone: tz }) as Intl.ResolvedDateTimeFormatOptions,
      format: () => '',
      formatToParts: () => [],
    } as unknown as Intl.DateTimeFormat);
  }

  it('Asia/Seoul → KRW', () => {
    mockTimezone('Asia/Seoul');
    expect(detectCurrencyFromTimezone()).toBe('KRW');
  });

  it('Asia/Taipei → TWD', () => {
    mockTimezone('Asia/Taipei');
    expect(detectCurrencyFromTimezone()).toBe('TWD');
  });

  it('未知時區 → null', () => {
    mockTimezone('America/New_York');
    expect(detectCurrencyFromTimezone()).toBeNull();
  });
});
