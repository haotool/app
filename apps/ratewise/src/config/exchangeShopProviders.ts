import type { CurrencyCode } from '../features/ratewise/types';

export interface ExchangeShopConfig {
  providerName: string;
  providerNameEn: string;
  cdnUrl: string;
  cdnUrlFallback: string;
  source: string;
  sourceUrl: string;
  getSellRate: (raw: unknown) => number | null;
  getBuyRate: (raw: unknown) => number | null;
  fallbackSell: number;
  fallbackBuy: number;
}

export const EXCHANGE_SHOP_PROVIDERS: Readonly<Partial<Record<CurrencyCode, ExchangeShopConfig>>> =
  {
    KRW: {
      providerName: '明洞換匯所',
      providerNameEn: 'Myeongdong Exchange',
      cdnUrl: 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/moneybox.json',
      cdnUrlFallback:
        'https://raw.githubusercontent.com/haotool/app/data/public/rates/moneybox.json',
      source: 'MoneyBox',
      sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
      getSellRate: (raw: unknown): number | null => {
        const data = raw as { rates?: { TWD?: { sell?: unknown } } } | null;
        const sell = data?.rates?.TWD?.sell;
        return typeof sell === 'number' && sell > 0 ? sell : null;
      },
      getBuyRate: (raw: unknown): number | null => {
        const data = raw as { rates?: { TWD?: { buy?: unknown } } } | null;
        const buy = data?.rates?.TWD?.buy;
        return typeof buy === 'number' && buy > 0 ? buy : null;
      },
      fallbackSell: 46.0,
      fallbackBuy: 46.7,
    },
  } as const;

export function hasExchangeShopProvider(currency: CurrencyCode): boolean {
  return currency in EXCHANGE_SHOP_PROVIDERS;
}

export function getExchangeShopProvider(currency: CurrencyCode): ExchangeShopConfig | null {
  return EXCHANGE_SHOP_PROVIDERS[currency] ?? null;
}

export function getSupportedExchangeShopCurrencies(): CurrencyCode[] {
  return Object.keys(EXCHANGE_SHOP_PROVIDERS) as CurrencyCode[];
}
