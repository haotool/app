import { useEffect, useMemo, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export interface UpdatePromptState {
  visible: boolean;
  needRefresh: boolean;
  offlineReady: boolean;
  handleUpdate: () => void;
  handleDismiss: () => void;
}

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;
// 喚回檢查節流：避免頻繁前景切換連環觸發 update()。
const WAKE_CHECK_THROTTLE_MS = 60 * 1000;

export function useUpdatePrompt(): UpdatePromptState {
  const [dismissed, setDismissed] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const swUrlRef = useRef<string | null>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      swUrlRef.current = swUrl;
      registrationRef.current = registration ?? null;
    },
    onRegisterError() {
      // 失敗時不打擾使用者；仍可正常使用網頁版。
      setOfflineReady(false);
      setNeedRefresh(false);
    },
  });

  // 瀏覽器僅在 navigation 時自動檢查 SW 更新；已安裝 PWA（iOS standalone 喚回、
  // bfcache 復原）長期不觸發 navigation，須以週期＋喚回主動 update() 補洞。
  // 官方 SOP：https://vite-pwa-org.netlify.app/guide/periodic-sw-updates
  useEffect(() => {
    const checkForUpdate = async (): Promise<void> => {
      const registration = registrationRef.current;
      if (!registration || registration.installing || !navigator.onLine) return;
      try {
        // 先以 no-store 探測 sw.js 可達，避免伺服器異常時空轉 update()。
        const swUrl = swUrlRef.current;
        if (swUrl) {
          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: { 'cache-control': 'no-cache' },
          });
          if (resp.status !== 200) return;
        }
        await registration.update();
      } catch {
        // 網路瞬斷時靜默跳過，待下次觸發再試。
      }
    };

    const interval = setInterval(() => void checkForUpdate(), UPDATE_INTERVAL_MS);

    // 喚回節流：距上次喚回檢查未滿門檻則跳過（掛載當下視為已檢查）。
    let lastWakeCheckAt = Date.now();
    const checkOnWake = () => {
      const now = Date.now();
      if (now - lastWakeCheckAt < WAKE_CHECK_THROTTLE_MS) return;
      lastWakeCheckAt = now;
      void checkForUpdate();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkOnWake();
    };
    // Safari bfcache 復原走 pageshow persisted，不保證觸發 visibilitychange。
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) checkOnWake();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const visible = useMemo(() => {
    if (needRefresh) return true;
    if (dismissed) return false;
    return offlineReady;
  }, [dismissed, offlineReady, needRefresh]);

  const handleUpdate = () => {
    // workbox-window 將註冊 60 秒後才發現的更新視為 external（_isUpdate=false），
    // 此時 vite-pwa 的 controlling 監聽不會自動 reload，造成套用後停留舊版。
    // 顯式監聽 controllerchange 確保新 SW 接管後整頁重載（once 防洩漏；重複 reload 無害）。
    navigator.serviceWorker?.addEventListener(
      'controllerchange',
      () => {
        window.location.reload();
      },
      { once: true },
    );
    void updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return { visible, needRefresh, offlineReady, handleUpdate, handleDismiss };
}
