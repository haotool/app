import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTradeStore } from '../stores/tradeStore';

export const UPDATE_TOAST_FLAG_KEY = 'papertrade:sw-updated';
export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
export const VISIBILITY_CHECK_THROTTLE_MS = 5 * 60 * 1000;

// PWA 自動更新：SW 端維持 prompt 型控制（sw.ts 收到 SKIP_WAITING 才 skipWaiting），
// client 端偵測到新版即自動送 SKIP_WAITING，controllerchange 後原子 reload 切版。
// 不改用 autoUpdate 模式：新 SW 立即接管會使舊頁 lazy chunk 失效（版本撕裂前科）。
export function useAutoUpdate(): void {
  const pushToast = useTradeStore((state) => state.pushToast);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const lastCheckAtRef = useRef(0);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_, registration) {
      registrationRef.current = registration ?? null;
    },
    onOfflineReady() {
      pushToast({ tone: 'info', title: '離線就緒', description: '已快取應用外殼，離線也能開啟。' });
    },
  });

  // 偵測到 waiting SW 即自動送 SKIP_WAITING 切版，不需使用者點按。
  useEffect(() => {
    if (!needRefresh) return;
    void updateServiceWorker();
  }, [needRefresh, updateServiceWorker]);

  // 新 SW 接管後整頁 reload：全狀態 persist 於 localStorage，reload 無損。
  // hadController 區分首次安裝的 clientsClaim 接管（不 reload）；reloading 防重入避免循環。
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const serviceWorker = navigator.serviceWorker;
    let hadController = serviceWorker.controller !== null;
    let reloading = false;
    const onControllerChange = () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      if (reloading) return;
      reloading = true;
      sessionStorage.setItem(UPDATE_TOAST_FLAG_KEY, '1');
      window.location.reload();
    };
    serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  // iOS PWA 長開不重載頁面：定期 update() ＋回前景時檢查（節流 ≥5 分鐘）才偵測得到新版 SW。
  useEffect(() => {
    lastCheckAtRef.current = Date.now();
    const check = () => {
      lastCheckAtRef.current = Date.now();
      void registrationRef.current?.update().catch(() => undefined);
    };
    const interval = setInterval(check, UPDATE_CHECK_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastCheckAtRef.current < VISIBILITY_CHECK_THROTTLE_MS) return;
      check();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // 升級後首次載入顯示一次性提示；flag 立即消費，不殘留。
  useEffect(() => {
    if (sessionStorage.getItem(UPDATE_TOAST_FLAG_KEY) === null) return;
    sessionStorage.removeItem(UPDATE_TOAST_FLAG_KEY);
    pushToast({ tone: 'info', title: '已更新至新版本', description: '已自動載入最新功能與修正。' });
  }, [pushToast]);
}
