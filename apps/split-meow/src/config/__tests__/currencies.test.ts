import { describe, it, expect } from 'vitest';
import { formatAmount, formatKrwAsTwd } from '../currencies';

describe('formatAmount', () => {
  it('KRW 使用 ₩ 符號並四捨五入', () => {
    expect(formatAmount(30000.4, 'KRW')).toBe('₩30,000');
  });

  it('TWD 使用 NT$ 符號', () => {
    expect(formatAmount(1234.6, 'TWD')).toBe('NT$ 1,235');
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
