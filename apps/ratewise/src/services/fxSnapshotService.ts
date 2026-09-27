import {
  ACTIVE_RELEASE_KEY,
  restoreRelease,
  loadRelease,
  type ActiveRelease,
} from '@app/shared/fx/release';

interface HistoryRow {
  date: string;
  rate: string | null;
  quoteId: string;
  sourcePublishedAt: string | null;
}

function isCachedHistoryRows(value: unknown, dates: readonly string[]): value is HistoryRow[] {
  return (
    Array.isArray(value) &&
    value.length === dates.length &&
    value.every((candidate, index) => {
      if (candidate === null || typeof candidate !== 'object') return false;
      const row = candidate as Record<string, unknown>;
      return (
        row['date'] === dates[index] &&
        (row['rate'] === null ||
          (typeof row['rate'] === 'string' && /^\d+(\.\d+)?$/.test(row['rate']))) &&
        typeof row['quoteId'] === 'string' &&
        (row['sourcePublishedAt'] === null || typeof row['sourcePublishedAt'] === 'string')
      );
    })
  );
}

export async function readActiveRelease(): Promise<ActiveRelease | null> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ACTIVE_RELEASE_KEY) ?? 'null');
    return await restoreRelease(value);
  } catch {
    return null;
  }
}
export async function refreshActiveRelease(): Promise<ActiveRelease> {
  const release = await loadRelease();
  // 只有整個 latest atomic unit 通過結構、語意與 hash 驗證才持久化。
  try {
    localStorage.setItem(ACTIVE_RELEASE_KEY, JSON.stringify(release));
  } catch {
    /* memory remains usable */
  }
  return release;
}

/** History is a separate atomic unit; unavailable history never invalidates latest. */
export async function fetchFxHistory(quoteSeriesId: string) {
  const { fetchVerifiedObject } = await import('@app/shared/fx/release');
  const { validateProviderSnapshot } = await import('@app/shared/fx');
  const release = await readActiveRelease();
  if (!release) throw new Error('尚無已驗證的匯率快照');
  const selected = release.snapshots
    .flatMap((snapshot) => snapshot.quotes)
    .find((quote) => quote.quoteSeriesId === quoteSeriesId);
  if (!selected) throw new Error('找不到指定牌告系列');
  const refs = release.manifest.history
    .filter((entry) => entry.providerId === selected.providerId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);
  if (!refs.length) throw new Error('尚無此來源的已驗證歷史');
  const key = `ratewise.fx.v3.history:${release.current.releaseId}:${quoteSeriesId}`;
  try {
    const rows = await Promise.all(
      refs.map(async (entry) => {
        const snapshot = await fetchVerifiedObject(entry.snapshot);
        if (!validateProviderSnapshot(snapshot) || snapshot.providerId !== selected.providerId)
          throw new Error('Invalid historical snapshot');
        const quote = snapshot.quotes.find((quote) => quote.quoteSeriesId === quoteSeriesId);
        return {
          date: entry.date,
          rate: quote?.rate ?? null,
          quoteId: quote?.quoteId ?? '',
          sourcePublishedAt: quote?.sourceQuote.sourcePublishedAt ?? null,
        };
      }),
    );
    try {
      localStorage.setItem(key, JSON.stringify(rows));
    } catch {
      /* quota: keep in memory */
    }
    return rows;
  } catch (error) {
    // This namespace only contains complete windows that passed object validation.
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (
      isCachedHistoryRows(
        saved,
        refs.map((entry) => entry.date),
      )
    )
      return saved;
    throw error;
  }
}
