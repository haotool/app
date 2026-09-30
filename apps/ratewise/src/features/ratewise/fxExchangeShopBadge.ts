import type { QuoteSnapshot } from '@app/shared/fx';
import { getExchangeShopProvider } from '../../config/exchangeShopProviders';
import type { ExchangeShopRate } from '../../services/moneyboxRateService';
import { formatIsoTimestamp } from '../../utils/timeFormatter';
import type { CurrencyCode } from './types';

/** 徽章只需要來源識別與發布時間，不含買賣價（v3 價格由已驗證 quote 提供）。 */
export type ExchangeShopBadgeInfo = Pick<
  ExchangeShopRate,
  'currency' | 'updateTime' | 'timestamp' | 'source' | 'sourceUrl' | 'providerName' | 'isFallback'
>;

/**
 * v3 公開後，頁尾來源徽章由實際採用的已驗證 quote 建立，
 * 不再讀取 legacy MoneyBox 端點，避免換算與揭露的來源／新鮮度不一致。
 */
export function buildExchangeShopBadgeFromQuote(
  quote: QuoteSnapshot | null | undefined,
): ExchangeShopBadgeInfo | null {
  if (quote?.providerId !== 'moneybox') return null;
  // 換錢所設定以牌告計價幣別（KRW）為鍵；標的幣別可能是 TWD、USD 等任何幣別，
  // 所以直接牌告（例如 USD→KRW）也能取得來源資訊，不依賴 legacy 的 TWD↔KRW 判斷。
  const currency = quote.sourceQuote.priceCurrency as CurrencyCode;
  const provider = getExchangeShopProvider(currency);
  if (!provider) return null;
  const publishedAt = quote.sourceQuote.sourcePublishedAt;
  return {
    currency,
    updateTime: publishedAt
      ? formatIsoTimestamp(publishedAt, { includeYear: true }) || '未知'
      : '未知',
    timestamp: publishedAt,
    source: provider.source,
    sourceUrl: provider.sourceUrl,
    providerName: provider.providerName,
    isFallback: false,
  };
}
