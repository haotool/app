export type CurrencyCode = 'TWD' | 'KRW';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  flag: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  TWD: { code: 'TWD', symbol: 'NT$', flag: '🇹🇼', locale: 'zh-TW' },
  KRW: { code: 'KRW', symbol: '₩', flag: '🇰🇷', locale: 'ko-KR' },
};

const TIMEZONE_TO_CURRENCY: Record<string, CurrencyCode> = {
  'Asia/Seoul': 'KRW',
  'Asia/Busan': 'KRW',
  'Asia/Taipei': 'TWD',
};

export function detectCurrencyFromTimezone(): CurrencyCode | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_CURRENCY[tz] ?? null;
  } catch {
    return null;
  }
}

export function formatAmount(amount: number, currency: CurrencyCode): string {
  const rounded = Math.round(amount);
  if (currency === 'KRW') return `₩${rounded.toLocaleString('ko-KR')}`;
  return `NT$ ${rounded.toLocaleString('zh-TW')}`;
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency].symbol;
}

/**
 * 將 KRW 金額依匯率快照換算為 TWD 顯示字串（用於 KRW 記帳時的副標）。
 * rate 為 1 TWD = rate KRW（賣出價）；rate 無效時回傳 null 表示無法換算。
 */
export function formatKrwAsTwd(krwAmount: number, rate: number | null | undefined): string | null {
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
  return formatAmount(krwAmount / rate, 'TWD');
}
