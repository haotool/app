import {
  isQuoteApplicable,
  rankQuotes,
  type EstimateRequest,
  type QuoteSnapshot,
  type SelectionContext,
} from '@app/shared/fx';
import type { FxProviderStatus } from './hooks/useFxQuotes';

const isZeroAmount = (amount: string) => /^0+(\.0+)?$/.test(amount);

/**
 * Best 模式的單一報價選擇：
 * 1. 通過新鮮度與來源狀態排名的最優牌告；
 * 2. 排名沒有贏家時，過期／未知的臺銀牌告仍作揭露式備援；
 * 3. 金額為 0 時排名依契約不推薦任何報價，但 0 是有效輸入，使用適用且檢查正常的來源回傳 0。
 */
export function selectBestQuote(
  quotes: readonly QuoteSnapshot[],
  request: EstimateRequest,
  context: SelectionContext,
  providerStatuses?: ReadonlyMap<string, FxProviderStatus>,
): QuoteSnapshot | null {
  const ranked = rankQuotes(quotes, request, context, providerStatuses)[0]?.quote;
  if (ranked) return ranked;
  const bot = quotes.find(
    (quote) => quote.providerId === 'bot' && isQuoteApplicable(quote, request, context),
  );
  if (bot) return bot;
  if (!isZeroAmount(request.amount)) return null;
  return (
    quotes.find(
      (quote) =>
        (!providerStatuses || providerStatuses.get(quote.providerId) === 'ok') &&
        isQuoteApplicable(quote, request, context),
    ) ?? null
  );
}
