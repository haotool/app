import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// Screen Wake Lock：導航時防熄屏；hidden 釋放、回前景重新取得（iOS 18.4+ 修復）。
// 自 NavOverlay 純搬移抽出（issue #725 千行檔拆分），行為零變更。
// ---------------------------------------------------------------------------
export function useScreenWakeLock() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return undefined;

    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // 低電量模式或平台拒絕：靜默降級，不影響導航功能。
        sentinel = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !disposed) void request();
    };

    void request();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      void sentinel?.release().catch(() => undefined);
    };
  }, []);
}
