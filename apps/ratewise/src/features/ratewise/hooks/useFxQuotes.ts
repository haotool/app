import { useEffect, useState, useMemo } from 'react';
import type { ActiveRelease } from '@app/shared/fx/release';
import {
  clearFxV3Storage,
  readActiveRelease,
  refreshActiveRelease,
} from '../../../services/fxSnapshotService';
import { isFxV3Public } from '../../../config/api-endpoints';

export type FxProviderStatus = 'ok' | 'failed' | 'carried_forward';

export function useFxQuotes(enabled = true) {
  const active = enabled && isFxV3Public();
  const [release, setRelease] = useState<ActiveRelease | null>(null);
  const [isLoading, setLoading] = useState(active);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!active) {
      clearFxV3Storage();
      return;
    }
    let isCurrent = true;
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const next = await refreshActiveRelease();
        if (isCurrent) {
          setRelease(next);
          setError(null);
        }
      } catch (cause) {
        if (isCurrent) setError(cause instanceof Error ? cause.message : '匯率暫時無法更新');
      } finally {
        pending = false;
        if (isCurrent) setLoading(false);
      }
    };
    const foreground = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    void readActiveRelease().then((saved) => {
      if (isCurrent && saved) setRelease(saved);
      return refresh();
    });
    const timer = setInterval(() => void refresh(), 5 * 60_000);
    document.addEventListener('visibilitychange', foreground);
    window.addEventListener('online', foreground);
    return () => {
      isCurrent = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', foreground);
      window.removeEventListener('online', foreground);
    };
  }, [active]);
  const visibleRelease = active ? release : null;
  const quotes = useMemo(
    () => visibleRelease?.snapshots.flatMap((snapshot) => snapshot.quotes) ?? [],
    [visibleRelease],
  );
  const providerStatuses = useMemo(
    () =>
      new Map<string, FxProviderStatus>(
        visibleRelease?.manifest.providers.map((provider) => [
          provider.providerId,
          provider.checkStatus,
        ]) ?? [],
      ),
    [visibleRelease],
  );
  return {
    quotes,
    providerStatuses,
    releaseId: visibleRelease?.current.releaseId ?? null,
    isLoading: active && isLoading,
    error: active ? error : null,
  };
}
