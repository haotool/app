import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';
import { startVersionCheckInterval } from '../utils/versionChecker';
import { AutoUpdateToast } from './AutoUpdateToast';
import { logger } from '../utils/logger';

/**
 * PWA 更新通知組件 - 自動更新模式
 *
 * [fix:2025-11-06] 改為自動更新模式
 * 更新時間: 2025-11-06T00:30:00+08:00
 *
 * 業界最佳實踐 (2025):
 * - ✅ 自動倒數 10 秒後更新
 * - ✅ 可手動點擊立即更新
 * - ✅ 進度條視覺化倒數
 * - ✅ 柔和的 Toast 通知（右下角）
 * - ✅ 不干擾用戶操作
 * - ✅ 完整無障礙支援
 *
 * 參考:
 * - https://web.dev/learn/pwa/update/
 * - https://vercel.com/design
 * - https://sonner.emilkowal.ski/
 */
export function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const [wb, setWb] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const swUrl = import.meta.env.DEV
      ? `${import.meta.env.BASE_URL}dev-sw.js?dev-sw`
      : `${import.meta.env.BASE_URL}sw.js`;
    const swScope = import.meta.env.BASE_URL || '/';

    const validateServiceWorkerScript = async () => {
      try {
        const response = await fetch(swUrl, {
          cache: 'no-store',
          headers: {
            'cache-control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`Unexpected response (${response.status}) while fetching ${swUrl}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('javascript')) {
          throw new Error(`Unsupported MIME type "${contentType}" for ${swUrl}`);
        }

        return true;
      } catch (error) {
        logger.warn('Skip service worker registration', {
          reason: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    };

    // 根據環境設定 Service Worker 類型
    // [context7:vite-pwa-org.netlify.app:2025-10-21T18:00:00+08:00]
    const swType = import.meta.env.DEV ? 'module' : 'classic';

    const workbox = new Workbox(swUrl, {
      scope: swScope,
      type: swType,
    });

    // [fix:2025-11-06] autoUpdate 模式：檢測到更新立即顯示通知
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workbox.addEventListener('installed', (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (event.isUpdate) {
        logger.info('New version detected, showing update toast');
        setNeedRefresh(true);
      }
      // 移除 offlineReady 狀態（autoUpdate 模式不需要）
    });

    void validateServiceWorkerScript().then((isValid) => {
      if (!isValid) {
        return;
      }

      // [fix:2025-11-05] 手動註冊 Service Worker 並設定 updateViaCache: 'none'
      // 防止 Service Worker 本身被瀏覽器快取
      // 參考: https://learn.microsoft.com/answers/questions/1163448/blazor-wasm-pwa-not-updating
      navigator.serviceWorker
        .register(swUrl, {
          scope: swScope,
          type: swType,
          updateViaCache: 'none', // 關鍵設定：不快取 SW 檔案
        })
        .then((registration) => {
          // [fix:2025-11-05] 只使用原生 API 註冊，不重複調用 workbox.register()
          // 避免雙重註冊問題
          setWb(workbox);

          // [fix:2025-11-05] 週期性檢查更新（每 60 秒）
          // 參考: https://vite-pwa-org.netlify.app/guide/periodic-sw-updates
          const updateCheckInterval = setInterval(() => {
            void registration.update(); // 使用原生 API 檢查更新
          }, 60000); // 60 秒

          // 清理定時器
          return () => clearInterval(updateCheckInterval);
        })
        .catch((error) => {
          logger.error(
            'SW registration error',
            error instanceof Error ? error : new Error(String(error)),
          );
        });
    });

    // 清理函數（雖然這個 effect 不會被清理，但保持良好習慣）
    return undefined;
  }, []);

  // [fix:2025-11-05] 版本檢查機制：每 5 分鐘檢查一次 HTML meta 標籤的版本號
  // 參考: PWA_UPDATE_FINAL_REPORT.md - 問題 3 的修復
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // 每 5 分鐘檢查一次（300000 ms）
    const cleanup = startVersionCheckInterval(300000, () => {
      logger.info('Version mismatch detected via meta tag check');
      setNeedRefresh(true);
    });

    return cleanup;
  }, []);

  // 關閉通知（稍後更新）
  const handleClose = () => {
    setNeedRefresh(false);
  };

  // 立即更新
  const handleUpdate = async () => {
    if (!wb) return;

    logger.info('User triggered update');

    try {
      // 1. 清除所有 Service Worker 快取
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        logger.info('All caches cleared');
      }

      // 2. skipWaiting（自動更新模式下 Service Worker 會自動處理）
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      wb.messageSkipWaiting();

      // 3. 重新載入頁面
      window.location.reload();
    } catch (error) {
      logger.error('PWA update error', error instanceof Error ? error : new Error(String(error)));
      // 即使出錯也嘗試重新載入
      window.location.reload();
    }
  };

  return (
    <AutoUpdateToast
      show={needRefresh}
      onClose={handleClose}
      onUpdate={() => void handleUpdate()}
    />
  );
}
