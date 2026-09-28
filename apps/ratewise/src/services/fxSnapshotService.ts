import {
  ACTIVE_RELEASE_KEY,
  restoreRelease,
  loadRelease,
  type ActiveRelease,
} from '@app/shared/fx/release';
import { isFxV3Public } from '@app/shared/fx/public';

const FX_CACHE_PREFIX = 'ratewise.fx.v3.';
const HISTORY_CACHE_PREFIX = `${FX_CACHE_PREFIX}history:`;
const historyCacheKey = (releaseId: string, quoteSeriesId: string) =>
  `${HISTORY_CACHE_PREFIX}${releaseId}:${quoteSeriesId}`;
const MAX_HISTORY_CACHE_KEYS = 4;
const getStorage = (): Storage | null => {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};
const storageKeys = () => {
  const storage = getStorage();
  return storage
    ? Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
        (key): key is string => key !== null,
      )
    : [];
};

export function clearFxV3Storage(): void {
  try {
    for (const key of storageKeys()) {
      if (key.startsWith(FX_CACHE_PREFIX)) getStorage()?.removeItem(key);
    }
  } catch {
    // Storage may be unavailable in privacy mode.
  }
}

function pruneHistoryCache(): void {
  try {
    const keys = storageKeys()
      .filter((key) => key.startsWith(HISTORY_CACHE_PREFIX))
      .map((key) => {
        let savedAt = 0;
        try {
          const entry: unknown = JSON.parse(getStorage()?.getItem(key) ?? 'null');
          if (
            entry !== null &&
            typeof entry === 'object' &&
            typeof (entry as { savedAt?: unknown }).savedAt === 'number'
          )
            savedAt = (entry as { savedAt: number }).savedAt;
        } catch {
          // Invalid/legacy entries are treated as oldest.
        }
        return { key, savedAt };
      })
      .sort((a, b) => a.savedAt - b.savedAt || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    for (const { key } of keys.slice(0, Math.max(0, keys.length - MAX_HISTORY_CACHE_KEYS)))
      getStorage()?.removeItem(key);
  } catch {
    // Storage may be unavailable in privacy mode.
  }
}

function oldestHistoryCacheKey(): string | undefined {
  return storageKeys()
    .filter((key) => key.startsWith(HISTORY_CACHE_PREFIX))
    .map((key) => {
      let savedAt = 0;
      try {
        const entry: unknown = JSON.parse(getStorage()?.getItem(key) ?? 'null');
        if (
          entry !== null &&
          typeof entry === 'object' &&
          typeof (entry as { savedAt?: unknown }).savedAt === 'number'
        )
          savedAt = (entry as { savedAt: number }).savedAt;
      } catch {
        // Invalid/legacy entries are treated as oldest.
      }
      return { key, savedAt };
    })
    .sort((a, b) => a.savedAt - b.savedAt || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))[0]?.key;
}

function saveCache(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  for (;;) {
    try {
      storage.setItem(key, value);
      return;
    } catch (error) {
      const quotaError = error as { name?: string; code?: number };
      if (
        quotaError?.name !== 'QuotaExceededError' &&
        quotaError?.code !== 22 &&
        quotaError?.code !== 1014
      )
        return;
      const oldest = oldestHistoryCacheKey();
      if (!oldest) return;
      storage.removeItem(oldest);
    }
  }
}

// 啟動時回滾旗標會清除 v3 快取，不碰使用者設定。
if (!isFxV3Public()) clearFxV3Storage();

interface HistoryRow {
  date: string;
  rate: string | null;
  quoteId: string;
  sourcePublishedAt: string | null;
}

interface CachedHistory {
  savedAt: number;
  rows: HistoryRow[];
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
    const value: unknown = JSON.parse(getStorage()?.getItem(ACTIVE_RELEASE_KEY) ?? 'null');
    const release = await restoreRelease(value);
    if (release) pruneHistoryCache();
    return release;
  } catch {
    return null;
  }
}
export async function refreshActiveRelease(): Promise<ActiveRelease> {
  const release = await loadRelease();
  // 只有整個 latest atomic unit 通過結構、語意與 hash 驗證才持久化。
  try {
    saveCache(ACTIVE_RELEASE_KEY, JSON.stringify(release));
    pruneHistoryCache();
  } catch {
    /* memory remains usable */
  }
  return release;
}

/** History is a separate atomic unit; unavailable history never invalidates latest. */
export async function fetchFxHistory(quoteSeriesId: string) {
  const { fetchVerifiedObject } = await import('@app/shared/fx/release');
  const { validateProviderSnapshot, compareCodePoints } = await import('@app/shared/fx');
  const release = await readActiveRelease();
  if (!release) throw new Error('尚無已驗證的匯率快照');
  const selected = release.snapshots
    .flatMap((snapshot) => snapshot.quotes)
    .find((quote) => quote.quoteSeriesId === quoteSeriesId);
  if (!selected) throw new Error('找不到指定牌告系列');
  const refs = release.manifest.history
    .filter((entry) => entry.providerId === selected.providerId)
    .sort((a, b) => compareCodePoints(b.date, a.date))
    .slice(0, 30);
  if (!refs.length) throw new Error('尚無此來源的已驗證歷史');
  const key = historyCacheKey(release.current.releaseId, quoteSeriesId);
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
      getStorage()?.removeItem(key);
      saveCache(key, JSON.stringify({ savedAt: Date.now(), rows } satisfies CachedHistory));
      pruneHistoryCache();
    } catch {
      /* quota: keep in memory */
    }
    return rows;
  } catch (error) {
    // This namespace only contains complete windows that passed object validation.
    const saved: unknown = JSON.parse(getStorage()?.getItem(key) ?? 'null');
    const cachedRows = Array.isArray(saved)
      ? saved
      : saved !== null && typeof saved === 'object'
        ? (saved as { rows?: unknown }).rows
        : null;
    if (
      isCachedHistoryRows(
        cachedRows,
        refs.map((entry) => entry.date),
      )
    )
      return cachedRows;
    throw error;
  }
}
