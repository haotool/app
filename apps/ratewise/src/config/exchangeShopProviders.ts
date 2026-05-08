/**
 * 換錢所 provider registry SSOT
 *
 * 集中管理非銀行牌告匯率來源（目前為 KRW / MoneyBox），包含資料端點、欄位解析、
 * UI 顯示名稱與 fallback 匯率。所有換錢所支援幣別必須先在此註冊，服務層再依
 * CurrencyCode 取得對應 provider，避免跨幣別誤用匯率資料。
 */

import type { CurrencyCode } from '../features/ratewise/types';

export interface ExchangeShopConfig {
  /** 換匯所中文名稱（顯示於 UI badge） */
  providerName: string;
  /** 換匯所英文名稱 */
  providerNameEn: string;
  /** jsDelivr CDN 主要 URL（支援 ETag） */
  cdnUrl: string;
  /** GitHub Raw 備援 URL */
  cdnUrlFallback: string;
  /** 資料來源名稱（顯示於 badge） */
  source: string;
  /** 資料來源網頁 URL（badge 超連結） */
  sourceUrl: string;
  /**
   * 從 CDN raw JSON 取得「客戶買入外幣」匯率（TWD→外幣方向）
   * 例 KRW：raw.rates.TWD.sell = 44.85（1 TWD = 44.85 KRW）
   */
  getSellRate: (raw: unknown) => number | null;
  /**
   * 從 CDN raw JSON 取得「客戶賣出外幣」匯率（外幣→TWD 方向）
   * 例 KRW：raw.rates.TWD.buy = 45.1（45.1 KRW = 1 TWD）
   */
  getBuyRate: (raw: unknown) => number | null;
  /** getSellRate 失敗時的緊急後備值 */
  fallbackSell: number;
  /** getBuyRate 失敗時的緊急後備值 */
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
