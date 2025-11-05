import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';
import { getCurrentVersion, getPreviousVersion } from '../utils/versionManager';
import { startVersionCheckInterval } from '../utils/versionChecker';

/**
 * PWA 更新通知組件 - 品牌對齊風格
 *
 * 採用風格: Brand Aligned (品牌對齊)
 * 更新時間: 2025-10-22T19:00:00+08:00
 * 設計文檔: docs/design/NOTIFICATION_DESIGN_SYSTEM.md
 *
 * 設計特點：
 * - 藍紫雙色漸變 (與主應用完全一致)
 * - 圓潤現代的視覺元素 (32px 圓角)
 * - 柔和的泡泡裝飾效果
 * - emoji 點綴增加親和力
 * - 專業可靠的品牌配色
 *
 * 技術實現：
 * - 彈性入場動畫 (spring physics)
 * - 右上角定位，不影響用戶操作
 * - 完整無障礙支援 (ARIA labels, keyboard navigation)
 * - 響應式設計 (手機/桌面適配)
 * - 品牌統一性 100%
 *
 * 研究來源：
 * - vite-pwa-org.netlify.app/frameworks/react
 * - shadcn/ui, Smashing Magazine, CSS-Tricks, NN/g
 */
export function UpdatePrompt() {
  const [show, setShow] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

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
        console.warn('[PWA] Skip service worker registration:', error);
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

    workbox.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        setNeedRefresh(true);
      } else {
        setOfflineReady(true);
      }
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
          console.error('SW registration error:', error);
        });
    });

    // 清理函數（雖然這個 effect 不會被清理，但保持良好習慣）
    return undefined;
  }, []);

  // 動畫效果：延遲顯示以實現入場動畫
  useEffect(() => {
    if (offlineReady || needRefresh) {
      // 微延遲讓瀏覽器準備好渲染動畫
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    }
    setShow(false);
    return undefined;
  }, [offlineReady, needRefresh]);

  // [fix:2025-11-05] 版本檢查機制：每 5 分鐘檢查一次 HTML meta 標籤的版本號
  // 參考: PWA_UPDATE_FINAL_REPORT.md - 問題 3 的修復
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // 每 5 分鐘檢查一次（300000 ms）
    const cleanup = startVersionCheckInterval(300000, () => {
      console.log('[PWA] Version mismatch detected via meta tag check');
      setNeedRefresh(true);
    });

    return cleanup;
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShow(false);
  };

  const handleUpdate = async () => {
    if (wb) {
      // [fix:2025-11-05] 更新流程：清除快取 → skipWaiting → 重新載入
      // 參考: https://web.dev/learn/pwa/update
      try {
        // 1. 清除所有 Service Worker 快取
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
          console.log('[PWA] All caches cleared before update');
        }

        // 2. 發送 skipWaiting 訊息給新的 Service Worker
        wb.messageSkipWaiting();

        // 3. 重新載入頁面以啟用新版本
        window.location.reload();
      } catch (error) {
        console.error('[PWA] Update error:', error);
        // 即使清除快取失敗，仍然執行更新
        wb.messageSkipWaiting();
        window.location.reload();
      }
    }
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-500 ease-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
      role="alertdialog"
      aria-labelledby="update-prompt-title"
      aria-describedby="update-prompt-description"
    >
      {/* 品牌對齊風格卡片 */}
      <div
        className="
          relative overflow-hidden rounded-[32px]
          w-80 max-w-[calc(100vw-2rem)]
          bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
          border-2 border-indigo-100
          shadow-xl
          animate-slide-in-bounce
        "
      >
        {/* 品牌泡泡裝飾 */}
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-100/50 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-blue-100/50 blur-3xl"
          aria-hidden="true"
        />

        {/* 內容區域 */}
        <div className="relative p-6">
          {/* 圖標區 */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* 外圈光暈 */}
              <div className="absolute inset-0 rounded-full bg-indigo-200 blur-md opacity-50" />
              {/* 主圖標 */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {offlineReady ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* 標題 */}
          <h2
            id="update-prompt-title"
            className="text-xl font-bold text-indigo-700 mb-2 text-center"
          >
            {offlineReady ? '✨ 離線模式已就緒' : '🎉 發現新版本'}
          </h2>

          {/* 描述 */}
          <p
            id="update-prompt-description"
            className="text-sm text-indigo-500 mb-2 leading-relaxed text-center px-2"
          >
            {offlineReady ? '應用已準備好，隨時隨地都能使用！' : '新版本帶來更棒的體驗哦！'}
          </p>

          {/* 版本資訊 */}
          {needRefresh && (
            <div className="text-xs text-indigo-400 mb-4 text-center space-y-1">
              <p className="font-mono">
                v{getPreviousVersion() ?? '1.0.0'} → v{getCurrentVersion()}
              </p>
              <p className="text-[10px] text-indigo-300">更新後將清除快取數據，保留您的設定</p>
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex flex-col space-y-2">
            {needRefresh && (
              <button
                onClick={() => {
                  void handleUpdate();
                }}
                className="
                  w-full px-5 py-3 rounded-[20px]
                  bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500
                  text-white text-sm font-bold
                  shadow-lg
                  hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600
                  active:scale-[0.98]
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                "
              >
                馬上更新
              </button>
            )}

            <button
              onClick={close}
              className="
                w-full px-5 py-3 rounded-[20px]
                bg-white/90 backdrop-blur-sm
                text-indigo-600 text-sm font-semibold
                border-2 border-indigo-200
                hover:bg-white hover:border-indigo-300
                active:scale-[0.98]
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
              "
            >
              {needRefresh ? '等等再說' : '好的'}
            </button>
          </div>
        </div>

        {/* 關閉按鈕 */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 text-indigo-400 hover:text-indigo-600 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="關閉通知"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
