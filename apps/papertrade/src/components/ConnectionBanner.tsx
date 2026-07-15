import { useEffect, useState } from 'react';
import { useMarketStore } from '../stores/marketStore';

const RECOVERED_BANNER_MS = 2000;

export function ConnectionBanner() {
  const wsStatus = useMarketStore((state) => state.wsStatus);
  const [prevStatus, setPrevStatus] = useState(wsStatus);
  const [showRecovered, setShowRecovered] = useState(false);

  if (wsStatus !== prevStatus) {
    setPrevStatus(wsStatus);
    if (prevStatus === 'reconnecting' && wsStatus === 'connected') {
      setShowRecovered(true);
    } else if (wsStatus === 'reconnecting') {
      setShowRecovered(false);
    }
  }

  useEffect(() => {
    if (!showRecovered) return undefined;
    const timer = setTimeout(() => setShowRecovered(false), RECOVERED_BANNER_MS);
    return () => clearTimeout(timer);
  }, [showRecovered]);

  if (wsStatus === 'reconnecting') {
    return (
      <div
        role="status"
        className="sticky top-0 z-30 bg-warning/15 px-4 py-2 text-center text-label text-warning"
      >
        連線中斷，重連中…
      </div>
    );
  }

  if (wsStatus === 'connected' && showRecovered) {
    return (
      <div
        role="status"
        className="sticky top-0 z-30 bg-long-bg px-4 py-2 text-center text-label text-long"
      >
        已重新連線
      </div>
    );
  }

  return null;
}
