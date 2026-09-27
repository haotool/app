import { FxReleaseError, loadRelease, FX_BASE_URLS } from '@app/shared/fx/release';
import { freshness, normalizeMoneyboxSnapshot } from '@app/shared/fx';

/** 匯率快照有效期：6 小時。 */
export const RATE_TTL_MS = 6 * 60 * 60 * 1000;

export interface MoneyboxRate {
  /** 使用者支付 1 TWD 可取得的 KRW 牌告金額 */
  krwPerTwd: number;
  updatedAt: string;
  /** 已驗證 v3 的來源發布時間；legacy 擷取時間不冒充發布時間。 */
  updatedAtIso: string | null;
  /** 未經 v3 hash chain 驗證的暫時參考值，必須保持失敗／未知提示。 */
  isFallback?: boolean;
}

/** 快照缺失、不可解析或超過 TTL 視為過期。 */
export function isRateStale(updatedAtIso: string | null, now = Date.now()): boolean {
  if (!updatedAtIso) return true;
  const ts = Date.parse(updatedAtIso);
  return !Number.isFinite(ts) || ts > now || now - ts > RATE_TTL_MS;
}

export async function fetchMoneyboxRate(now = new Date().toISOString()): Promise<MoneyboxRate> {
  let release;
  try {
    release = await loadRelease();
  } catch (error) {
    if (!(error instanceof FxReleaseError) || error.kind !== 'unpublished') throw error;
    // 只有 v3 current 明確尚未發布（兩個端點均 404）才沿用舊端點作明示參考。
    let value: unknown = null;
    let lastError: Error | null = null;
    for (const base of FX_BASE_URLS) {
      try {
        const response = await fetch(new URL('../providers/moneybox/latest.json', base), {
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
          lastError = new Error(`Legacy rate HTTP ${response.status}`);
          continue;
        }
        value = await response.json();
        break;
      } catch (cause) {
        lastError = cause instanceof Error ? cause : new Error('Legacy rate unavailable');
      }
    }
    if (value === null) throw lastError ?? new Error('Legacy rate unavailable');
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Invalid legacy rate');
    const data = value as Record<string, unknown>;
    if (
      data['base'] !== 'KRW' ||
      typeof data['source'] !== 'string' ||
      !/^MoneyBox(?: \(明洞換匯所聯盟\))?$/.test(data['source']) ||
      (data['schemaVersion'] !== undefined && data['schemaVersion'] !== '2.0')
    )
      throw new Error('Invalid legacy source identity');
    const quote = normalizeMoneyboxSnapshot(value).find(
      (q) => q.fromCurrency === 'TWD' && q.toCurrency === 'KRW' && q.status === 'available',
    );
    const rate = Number(quote?.rate);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Legacy TWD to KRW quote unavailable');
    return { krwPerTwd: rate, updatedAt: '', updatedAtIso: null, isFallback: true };
  }
  const provider = release.manifest.providers.find((entry) => entry.providerId === 'moneybox');
  const quote = release.snapshots
    .find((snapshot) => snapshot.providerId === 'moneybox')
    ?.quotes.find(
      (quote) =>
        quote.fromCurrency === 'TWD' &&
        quote.toCurrency === 'KRW' &&
        quote.sourceQuote.deliveryMethod === 'cash' &&
        quote.sourceQuote.branchId === 'myeongdong',
    );
  if (
    provider?.checkStatus !== 'ok' ||
    !quote?.rate ||
    quote.status !== 'available' ||
    freshness(quote, now) !== 'fresh'
  )
    throw new Error('TWD to KRW quote unavailable or stale');
  const publishedAt = quote.sourceQuote.sourcePublishedAt;
  if (!publishedAt) throw new Error('Source publication time unknown');
  // Existing expenses retain their captured numeric rate; only future defaults change.
  return { krwPerTwd: Number(quote.rate), updatedAt: publishedAt, updatedAtIso: publishedAt };
}
