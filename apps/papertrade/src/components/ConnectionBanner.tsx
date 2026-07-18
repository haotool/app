import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useMarketStore } from '../stores/marketStore';

// 斷線寬限：短暫重連（<2.5s）全程無 UI，避免行動網路抖動頻繁打擾。
const RECONNECT_GRACE_MS = 2500;
const RECOVERED_PILL_MS = 1500;

type BannerState = 'hidden' | 'reconnecting' | 'recovered';

export function ConnectionBanner() {
  const wsStatus = useMarketStore((state) => state.wsStatus);
  const [banner, setBanner] = useState<BannerState>('hidden');
  const [prevStatus, setPrevStatus] = useState(wsStatus);

  // render-time 調整：狀態切換當下同步收斂 banner；寬限期內恢復（banner 尚 hidden）維持全程靜默。
  if (wsStatus !== prevStatus) {
    setPrevStatus(wsStatus);
    if (wsStatus === 'connected') {
      setBanner(banner === 'reconnecting' ? 'recovered' : 'hidden');
    } else if (wsStatus !== 'reconnecting') {
      setBanner('hidden');
    }
  }

  useEffect(() => {
    if (wsStatus !== 'reconnecting') return undefined;
    const timer = setTimeout(() => setBanner('reconnecting'), RECONNECT_GRACE_MS);
    return () => clearTimeout(timer);
  }, [wsStatus]);

  useEffect(() => {
    if (banner !== 'recovered') return undefined;
    const timer = setTimeout(() => setBanner('hidden'), RECOVERED_PILL_MS);
    return () => clearTimeout(timer);
  }, [banner]);

  if (banner === 'hidden') return null;

  return (
    // 固定浮層 pill：不佔版面、不可點穿透；z-[60] 高於 BottomSheet（z-40）與 toast／對話框（z-50）。
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'toast-in pointer-events-none fixed left-1/2 top-[calc(var(--sat)+8px)] z-[60] -translate-x-1/2 whitespace-nowrap rounded-full border px-3 py-1.5 text-caption font-medium backdrop-blur',
        banner === 'reconnecting'
          ? 'conn-pulse border-warning/30 bg-surface-2/90 text-warning'
          : 'border-long/30 bg-surface-2/90 text-long',
      )}
    >
      {banner === 'reconnecting' ? '連線中斷，自動重連中' : '已恢復連線'}
    </div>
  );
}
