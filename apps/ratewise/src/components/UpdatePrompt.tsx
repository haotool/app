import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

/**
 * PWA 更新通知組件
 *
 * 基於 2025 最佳實踐：
 * - 液態玻璃效果 (Liquid Glass / Glassmorphism)
 * - 微動畫 (spring physics with CSS linear())
 * - 右上角定位，不影響用戶操作
 * - 無障礙訪問 (ARIA labels, keyboard navigation)
 *
 * 研究來源：
 * - vite-pwa-org.netlify.app/frameworks/react
 * - NN/G Glassmorphism Guidelines
 * - CSS-Tricks Animation Best Practices
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

      workbox
        .register()
        .then(() => setWb(workbox))
        .catch((error) => {
          console.error('SW registration error:', error);
        });
    });

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

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShow(false);
  };

  const handleUpdate = () => {
    if (wb) {
      // 發送消息給 Service Worker 並重新載入
      // [context7:vite-pwa-org.netlify.app:2025-10-21T18:00:00+08:00]
      wb.messageSkipWaiting();
      window.location.reload();
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
      {/* 液態玻璃卡片 */}
      <div
        className="
          relative overflow-hidden rounded-2xl
          w-80 max-w-[calc(100vw-2rem)]
          backdrop-blur-xl backdrop-saturate-150
          bg-white/70 dark:bg-slate-900/70
          border border-white/20 dark:border-slate-700/30
          shadow-2xl shadow-purple-500/10
          animate-slide-in-bounce
        "
        style={{
          boxShadow: `
            0 20px 60px -15px rgba(139, 92, 246, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            0 1px 0 0 rgba(255, 255, 255, 0.3) inset
          `,
        }}
      >
        {/* 背景光澤效果 */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"
          aria-hidden="true"
        />

        {/* 內容區域 */}
        <div className="relative p-5">
          {/* 標題區 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {/* 動畫圖標 */}
              <div
                className="
                  w-10 h-10 rounded-full
                  bg-gradient-to-br from-purple-500 to-blue-500
                  flex items-center justify-center
                  animate-ping-slow
                  shadow-lg shadow-purple-500/50
                "
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {offlineReady ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  )}
                </svg>
              </div>

              {/* 標題文字 */}
              <div>
                <h2
                  id="update-prompt-title"
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  {offlineReady ? '離線模式已就緒' : '發現新版本'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {offlineReady ? 'App 已可離線使用' : '點擊重新載入以更新'}
                </p>
              </div>
            </div>

            {/* 關閉按鈕 */}
            <button
              onClick={close}
              className="
                -mr-1 -mt-1 p-1.5 rounded-lg
                text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
                hover:bg-slate-100/50 dark:hover:bg-slate-800/50
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              "
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

          {/* 描述文字 */}
          <p
            id="update-prompt-description"
            className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed"
          >
            {offlineReady
              ? '應用程式已緩存到您的設備上，現在可以離線使用。'
              : '我們發布了新版本，包含改進和錯誤修復。建議立即更新以獲得最佳體驗。'}
          </p>

          {/* 按鈕區 */}
          <div className="flex space-x-2">
            {needRefresh && (
              <button
                onClick={handleUpdate}
                className="
                  flex-1 px-4 py-2.5 rounded-xl
                  bg-gradient-to-r from-purple-500 to-blue-500
                  text-white text-sm font-medium
                  shadow-lg shadow-purple-500/30
                  hover:shadow-xl hover:shadow-purple-500/40
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                  animate-pulse-soft
                "
              >
                <span className="flex items-center justify-center space-x-1.5">
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>立即更新</span>
                </span>
              </button>
            )}

            <button
              onClick={close}
              className="
                px-4 py-2.5 rounded-xl
                bg-slate-100/80 dark:bg-slate-800/80
                text-slate-700 dark:text-slate-300
                text-sm font-medium
                hover:bg-slate-200/80 dark:hover:bg-slate-700/80
                active:scale-[0.98]
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
              "
            >
              {needRefresh ? '稍後提醒' : '知道了'}
            </button>
          </div>
        </div>

        {/* 底部微光效果 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
