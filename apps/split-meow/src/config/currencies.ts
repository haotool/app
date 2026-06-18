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
