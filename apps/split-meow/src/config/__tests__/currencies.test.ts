import { describe, it, expect } from 'vitest';
import {
  formatAmount,
  detectCurrencyFromTimezone,
  getCurrencySymbol,
  formatKrwAsTwd,
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
