import { describe, it, expect } from 'vitest';
import {
  formatAmount,
  detectCurrencyFromTimezone,
  getCurrencySymbol,
  convertAmount,
  formatKrwAsTwd,
  resolveExpenseCurrency,
  resolveTripCurrency,
  isMixedCurrencyTrip,
  wouldCreateMixedCurrencyTrip,
  computeMemberBalances,
} from '../currencies';

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

describe('convertAmount', () => {
  it('KRW→TWD 除以 rate', () => {
    expect(convertAmount(10000, 'KRW', 'TWD', 40)).toBe(250);
  });

  it('TWD→KRW 乘以 rate', () => {
    expect(convertAmount(250, 'TWD', 'KRW', 40)).toBe(10000);
  });

  it('同幣別回原值且不需 rate', () => {
    expect(convertAmount(123, 'TWD', 'TWD', null)).toBe(123);
  });

  it('rate 無效回 null', () => {
    expect(convertAmount(100, 'KRW', 'TWD', 0)).toBeNull();
    expect(convertAmount(100, 'KRW', 'TWD', -1)).toBeNull();
    expect(convertAmount(100, 'KRW', 'TWD', null)).toBeNull();
    expect(convertAmount(100, 'KRW', 'TWD', undefined)).toBeNull();
    expect(convertAmount(100, 'KRW', 'TWD', Number.NaN)).toBeNull();
  });
});

describe('formatKrwAsTwd', () => {
  it('依匯率將 KRW 換算為 TWD 顯示字串', () => {
    // 30000 KRW / 43.5 (KRW per TWD) ≈ 689.66 → NT$ 690
    expect(formatKrwAsTwd(30000, 43.5)).toBe('NT$ 690');
  });

  it('匯率為 null 時回傳 null（無法換算）', () => {
    expect(formatKrwAsTwd(30000, null)).toBeNull();
  });

  it('匯率為 0 或負值時回傳 null（避免除以零）', () => {
    expect(formatKrwAsTwd(30000, 0)).toBeNull();
    expect(formatKrwAsTwd(30000, -1)).toBeNull();
  });

  it('匯率為 undefined（舊資料）時回傳 null', () => {
    expect(formatKrwAsTwd(30000, undefined)).toBeNull();
  });
});

describe('trip currency helpers', () => {
  it('resolveTripCurrency 取最舊一筆的幣別', () => {
    expect(resolveTripCurrency([{ currency: 'KRW' }, { currency: 'TWD' }], 'TWD')).toBe('TWD');
  });

  it('isMixedCurrencyTrip 偵測混幣行程', () => {
    expect(isMixedCurrencyTrip([{ currency: 'TWD' }, { currency: 'KRW' }], 'TWD')).toBe(true);
    expect(isMixedCurrencyTrip([{ currency: 'TWD' }, { currency: 'TWD' }], 'TWD')).toBe(false);
  });

  it('computeMemberBalances 僅加總同幣別 raw 金額', () => {
    expect(
      computeMemberBalances([
        {
          paidBy: 'a',
          totalAmount: 100,
          perPersonAmounts: { a: 50, b: 50 },
        },
      ]),
    ).toEqual({ a: 50, b: -50 });
  });

  it('resolveExpenseCurrency 舊資料 fallback TWD', () => {
    expect(resolveExpenseCurrency({}, 'KRW')).toBe('TWD');
    expect(resolveExpenseCurrency({ currency: 'TWD' }, 'KRW')).toBe('TWD');
    expect(resolveExpenseCurrency({ currency: 'KRW' }, 'TWD')).toBe('KRW');
  });

  it('resolveTripCurrency 舊資料 fallback TWD，空行程 fallback 全域幣別', () => {
    expect(resolveTripCurrency([{}], 'KRW')).toBe('TWD');
    expect(resolveTripCurrency([], 'KRW')).toBe('KRW');
  });

  it('wouldCreateMixedCurrencyTrip 僅在單幣行程將混幣時為 true', () => {
    expect(wouldCreateMixedCurrencyTrip([], 'TWD', 'KRW')).toBe(false);
    expect(wouldCreateMixedCurrencyTrip([{ currency: 'TWD' }], 'TWD', 'TWD')).toBe(false);
    expect(wouldCreateMixedCurrencyTrip([{ currency: 'TWD' }], 'TWD', 'KRW')).toBe(true);
    expect(
      wouldCreateMixedCurrencyTrip([{ currency: 'TWD' }, { currency: 'KRW' }], 'TWD', 'TWD'),
    ).toBe(false);
  });

  it('wouldCreateMixedCurrencyTrip 舊資料缺 currency 欄位時仍偵測混幣風險', () => {
    expect(wouldCreateMixedCurrencyTrip([{}], 'TWD', 'KRW')).toBe(true);
    expect(wouldCreateMixedCurrencyTrip([{ currency: undefined }], 'TWD', 'KRW')).toBe(true);
  });
});
