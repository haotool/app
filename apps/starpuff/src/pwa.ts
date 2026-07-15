import { registerSW } from 'virtual:pwa-register';

// 根因：瀏覽器僅在 navigation 時自動檢查 SW 更新；已安裝 PWA（iOS standalone
// 自 app switcher 喚回、bfcache 復原）長期不觸發 navigation，舊版用戶因此滯留。
// 官方 SOP：https://vite-pwa-org.netlify.app/guide/periodic-sw-updates
const PERIODIC_INTERVAL_MS = 60 * 60 * 1000;
const VISIBILITY_THROTTLE_MS = 5 * 60 * 1000;

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;

    // 先以 no-store 探測 sw.js 可達，避免離線或伺服器異常時空轉 update()。
    const checkForUpdate = async (): Promise<void> => {
      if (registration.installing || !navigator.onLine) return;
      try {
        const resp = await fetch(swUrl, {
          cache: 'no-store',
          headers: { 'cache-control': 'no-cache' },
        });
        if (resp.status === 200) await registration.update();
      } catch {
        // 網路瞬斷時靜默跳過，待下次觸發再試。
      }
    };

    setInterval(() => void checkForUpdate(), PERIODIC_INTERVAL_MS);

    // iOS 喚回場景走 visibilitychange；節流避免頻繁切換連續發請求。
    let lastCheckAt = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastCheckAt < VISIBILITY_THROTTLE_MS) return;
      lastCheckAt = now;
      void checkForUpdate();
    });
  },
});
