import {
  freshness,
  type QuoteSnapshot,
  type EstimateResult,
  type DerivedEstimateResult,
} from '@app/shared/fx';
import { formatIsoTimestamp } from '../../utils/timeFormatter';
import type { ProviderQuote } from './rateProviderRanking';
import type { FxContextSubstitution } from './fxEffectiveContext';
import { summarizeFxSubstitutions } from './fxSubstitutionText';
import { getRateProvider } from '../../config/rateProviders';
import type { FxProviderStatus } from './hooks/useFxQuotes';

interface ProviderPreference {
  mode: 'best' | 'manual';
  manualProvider?: { providerId: string } | null;
}

const labelOf = (providerId: string) => getRateProvider(providerId)?.label ?? providerId;

function refreshNotice(
  refreshFailed: boolean,
  fallbackActive: boolean,
  hasQuotes: boolean,
): string | null {
  if (!refreshFailed) return null;
  if (fallbackActive) return '最新報價載入失敗，暫以備援牌告顯示，換錢所報價暫不可用。';
  return hasQuotes ? '最新報價更新失敗，暫以上次已驗證的報價顯示，請留意發布時間。' : null;
}

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
  /** 目前服務地點；只彙整實際可能參與換算的來源，避免對其他地點的來源誤報。 */
  serviceCountry: string;
  /** 目前顯示的是 legacy 備援牌告（未經 v3 hash chain 驗證），不可宣稱為已驗證快照。 */
  fallbackActive: boolean;
}): string[] {
  const { providerStatuses, preference, now, refreshFailed, serviceCountry, fallbackActive } =
    input;
  const manualId = preference.mode === 'manual' ? preference.manualProvider?.providerId : null;
  // Best 不做地點替換，只看目前服務地點；手動來源若在該地點沒有牌告，換算會改用其唯一地點，
  // 提示也要跟著涵蓋實際採用的報價。
  const inCountry = input.quotes.filter(
    (quote) => quote.sourceQuote.serviceCountry === serviceCountry,
  );
  const manualQuotes = input.quotes.filter((quote) => quote.providerId === manualId);
  const quotes = manualId
    ? manualQuotes.some((quote) => quote.sourceQuote.serviceCountry === serviceCountry)
      ? manualQuotes.filter((quote) => quote.sourceQuote.serviceCountry === serviceCountry)
      : manualQuotes
    : inCountry;
  const refresh = refreshNotice(refreshFailed, fallbackActive, quotes.length > 0);
  const notices = refresh ? [refresh] : [];
  if (fallbackActive) return notices;

  const byProvider = new Map<string, QuoteSnapshot[]>();
  for (const quote of quotes)
    byProvider.set(quote.providerId, [...(byProvider.get(quote.providerId) ?? []), quote]);

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

/** 單幣別只常駐異常／替代條件；正常牌告說明留在收合詳情。 */
export function getSingleFxQuoteNotices(input: {
  error: string | null;
  fallbackActive: boolean;
  hasQuotes: boolean;
  estimate: EstimateResult | DerivedEstimateResult | undefined;
  selectedQuote: QuoteSnapshot | null;
  evidence: readonly QuoteSnapshot[];
  estimateFreshness: ReturnType<typeof freshness>;
  providerStatus: FxProviderStatus | null | undefined;
  substitutions: readonly FxContextSubstitution[];
  providerQuotes: readonly ProviderQuote[];
  providerStatuses?: ReadonlyMap<string, FxProviderStatus>;
}): string[] {
  const refresh = refreshNotice(Boolean(input.error), input.fallbackActive, input.hasQuotes);
  const notices = refresh ? [refresh] : [];
  if (!input.estimate) return notices;
  if (input.estimate.status === 'unavailable')
    notices.push('此條件無可用牌告；請確認地點、分店、來源及金額。');
  else if ('kind' in input.estimate)
    notices.push('經中介幣別的兩腿推算，非業者直接牌告；不納入推薦。');
  notices.push(...summarizeFxSubstitutions(input.substitutions));
  if (input.evidence.length > 0 && input.estimateFreshness === 'unknown')
    notices.push('來源未提供發布時間，無法判斷新鮮度，僅供參考。');
  if (input.evidence.length > 0 && input.estimateFreshness === 'stale')
    notices.push('牌告已超過更新門檻（台銀 36 小時、換錢所 24 小時），僅供參考。');
  if (input.providerStatus && input.providerStatus !== 'ok')
    notices.push('來源最近檢查未成功，顯示上次已驗證快照，僅供參考。');
  for (const quote of input.providerQuotes) {
    const providerId = quote.provider.providerId;
    if (providerId === input.selectedQuote?.providerId) continue;
    const status = input.providerStatuses?.get(providerId);
    if (status !== undefined && status !== 'ok')
      notices.push(`${labelOf(providerId)}：來源最近檢查未成功，未列入最佳推薦。`);
    else if (quote.freshness === 'unknown')
      notices.push(`${labelOf(providerId)}：來源未提供可判斷的發布時間，未列入最佳推薦。`);
    else if (quote.freshness === 'stale')
      notices.push(
        `${labelOf(providerId)}：來源發布時間 ${formatIsoTimestamp(quote.sourcePublishedAt, { includeYear: true }) || '未知'}，已超過更新門檻，未列入最佳推薦。`,
      );
  }
  return [...new Set(notices)];
}
