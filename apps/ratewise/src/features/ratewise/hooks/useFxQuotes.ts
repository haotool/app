import { useEffect, useState, useMemo } from 'react';
import type { ActiveRelease } from '@app/shared/fx/release';
import { readActiveRelease, refreshActiveRelease } from '../../../services/fxSnapshotService';

export type FxProviderStatus = 'ok' | 'failed' | 'carried_forward';

export function useFxQuotes(enabled = true) {
  const [release, setRelease] = useState<ActiveRelease | null>(null);
  const [isLoading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const next = await refreshActiveRelease();
        if (active) {
          setRelease(next);
          setError(null);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : '匯率暫時無法更新');
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    const foreground = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    void readActiveRelease().then((saved) => {
      if (active && saved) setRelease(saved);
      return refresh();
    });
    const timer = setInterval(() => void refresh(), 5 * 60_000);
    document.addEventListener('visibilitychange', foreground);
    window.addEventListener('online', foreground);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', foreground);
      window.removeEventListener('online', foreground);
    };
  }, [enabled]);
  const quotes = useMemo(
    () => release?.snapshots.flatMap((snapshot) => snapshot.quotes) ?? [],
    [release],
  );
  const providerStatuses = useMemo(
    () =>
      new Map<string, FxProviderStatus>(
        release?.manifest.providers.map((provider) => [
          provider.providerId,
          provider.checkStatus,
        ]) ?? [],
      ),
    [release],
  );
  return {
    quotes,
    providerStatuses,
    releaseId: release?.current.releaseId ?? null,
    isLoading,
    error,
  };
}
