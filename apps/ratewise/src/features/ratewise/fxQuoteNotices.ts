import { freshness, type QuoteSnapshot } from '@app/shared/fx';
import { getRateProvider } from '../../config/rateProviders';
import type { FxProviderStatus } from './hooks/useFxQuotes';

interface ProviderPreference {
  mode: 'best' | 'manual';
  manualProvider?: { providerId: string } | null;
}

const labelOf = (providerId: string) => getRateProvider(providerId)?.label ?? providerId;

/** 同一來源多筆報價取最差狀態：stale > unknown > fresh。 */
function providerFreshness(quotes: readonly QuoteSnapshot[], now: string) {
  const states = quotes.map((quote) => freshness(quote, now));
  return states.includes('stale') ? 'stale' : states.includes('unknown') ? 'unknown' : 'fresh';
}

/**
 * 沒有單一來源證據區塊的頁面（例如多幣別）使用：
 * 彙整目前採用來源的新鮮度、檢查狀態與刷新失敗，避免過期或未知報價被靜默使用。
 */
export function getFxQuoteNotices(input: {
  quotes: readonly QuoteSnapshot[];
  providerStatuses?: ReadonlyMap<string, FxProviderStatus>;
  preference: ProviderPreference;
  now: string;
  refreshFailed: boolean;
}): string[] {
  const { quotes, providerStatuses, preference, now, refreshFailed } = input;
  const notices: string[] = [];
  if (refreshFailed && quotes.length > 0)
    notices.push('最新報價更新失敗，暫以上次已驗證的報價顯示，請留意發布時間。');

  const byProvider = new Map<string, QuoteSnapshot[]>();
  for (const quote of quotes)
    byProvider.set(quote.providerId, [...(byProvider.get(quote.providerId) ?? []), quote]);
  const manualId = preference.mode === 'manual' ? preference.manualProvider?.providerId : null;

  for (const [providerId, providerQuotes] of byProvider) {
    if (manualId && providerId !== manualId) continue;
    const state = providerFreshness(providerQuotes, now);
    const status = providerStatuses?.get(providerId);
    const suffix = manualId ? '僅供參考。' : '未列入最佳推薦。';
    if (state === 'stale') notices.push(`${labelOf(providerId)}：牌告已超過更新門檻，${suffix}`);
    else if (state === 'unknown')
      notices.push(`${labelOf(providerId)}：來源未提供發布時間，無法判斷新鮮度，${suffix}`);
    if (status && status !== 'ok')
      notices.push(`${labelOf(providerId)}：來源最近檢查未成功，顯示上次已驗證快照，${suffix}`);
  }
  return notices;
}
