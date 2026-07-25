import { registerSW } from 'virtual:pwa-register';
import { initPwaUpdateGate, queuePwaUpdate } from './pwaUpdateGate';

// 根因：瀏覽器僅在 navigation 時自動檢查 SW 更新；已安裝 PWA（iOS standalone
// 自 app switcher 喚回、bfcache 復原）長期不觸發 navigation，舊版用戶因此滯留。
// 官方 SOP：https://vite-pwa-org.netlify.app/guide/periodic-sw-updates
const PERIODIC_INTERVAL_MS = 60 * 60 * 1000;
const VISIBILITY_THROTTLE_MS = 5 * 60 * 1000;

// prompt 型 SW（v19 #819 卡 8，repo 標準模式）：新版 ready 走 onNeedRefresh 標記
// pending，套用時機由 pwaUpdateGate 把關——遊戲中絕不 reload。
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    queuePwaUpdate(() => void updateSW(true));
  },
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

initPwaUpdateGate();

// e2e 觀測鉤子（卡 8 守門案）：注入假 apply 驗證「遊戲中不套用、回安全場景才套用」。
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  (window as unknown as { __spQueuePwaUpdate?: typeof queuePwaUpdate }).__spQueuePwaUpdate =
    queuePwaUpdate;
}
