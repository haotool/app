import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

/**
 * PWA 更新通知組件 - 粉彩雲朵配色（響應式優化版）
 *
 * 更新時間: 2025-12-27T02:56:00+08:00
 * 版本: 1.4.0
 *
 * 設計特點：
 * - 柔和天空色調漸變 (purple-50 → blue-50 → purple-100)
 * - 清晨薄霧的柔和感受
 * - 圓潤現代的視覺元素 (24px 圓角)
 * - 雲朵質感裝飾效果
 * - 極度柔和的視覺體驗
 *
 * 響應式最佳實踐（2025 更新）：
 * - 手機 (<375px): 最大寬度 280px, padding 16px, 緊湊設計
 * - 手機 (375-639px): 最大寬度 300px, padding 20px
 * - 平板/桌面 (640px+): 最大寬度 320px, padding 24px
 * - 總是保持距離邊緣 1rem (16px) 安全間距
 *
 * 技術實現：
 * - 彈性入場動畫 (spring physics)
 * - 右上角定位，不影響用戶操作
 * - 完整無障礙支援 (ARIA labels, keyboard navigation)
 * - 響應式設計 (手機/桌面適配)
 *
 * 研究來源：
 * - vite-pwa-org.netlify.app/frameworks/react
 * - shadcn/ui, Smashing Magazine, CSS-Tricks, NN/g
 * - Windows UX Guidelines: min 800x600 support
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
      className={`fixed top-3 right-3 sm:top-4 sm:right-4 z-50 transition-all duration-500 ease-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
      role="alertdialog"
      aria-labelledby="update-prompt-title"
      aria-describedby="update-prompt-description"
    >
      {/* 粉彩雲朵風格卡片 - 響應式尺寸 */}
      <div
        className="
          relative overflow-hidden rounded-2xl sm:rounded-3xl
          w-[280px] xs:w-[300px] sm:w-[320px]
          max-w-[calc(100vw-1.5rem)]
          bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100
          border border-purple-200/60 sm:border-2 sm:border-purple-200/50
          shadow-lg sm:shadow-xl shadow-purple-100/50
          animate-slide-in-bounce
        "
      >
        {/* 雲朵裝飾 */}
        <div
          className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-purple-100/40 blur-3xl"
          aria-hidden="true"
        />

        {/* 內容區域 - 響應式 padding */}
        <div className="relative p-4 sm:p-5 md:p-6">
          {/* 圖標區 - 響應式尺寸 */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="relative">
              {/* 外圈光暈 */}
              <div className="absolute inset-0 rounded-full bg-purple-200 blur-md opacity-50" />
              {/* 主圖標 */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600"
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

          {/* 標題 - 響應式字體 */}
          <h2
            id="update-prompt-title"
            className="text-base sm:text-lg md:text-xl font-bold text-purple-800 mb-1.5 sm:mb-2 text-center"
          >
            {offlineReady ? '✨ 離線模式已就緒' : '🎉 發現新版本'}
          </h2>

          {/* 描述 - 響應式字體與間距 */}
          <p
            id="update-prompt-description"
            className="text-xs sm:text-sm text-purple-600 mb-3 sm:mb-4 md:mb-5 leading-relaxed text-center px-1 sm:px-2"
          >
            {offlineReady ? '應用已準備好，隨時隨地都能使用！' : '新版本帶來更棒的體驗哦！'}
          </p>

          {/* 按鈕 - 響應式 */}
          <div className="flex flex-col space-y-1.5 sm:space-y-2">
            {needRefresh && (
              <button
                onClick={handleUpdate}
                className="
                  w-full px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl
                  bg-gradient-to-r from-purple-400 to-blue-400
                  text-white text-xs sm:text-sm font-bold
                  shadow-md sm:shadow-lg shadow-purple-200/50
                  hover:from-purple-500 hover:to-blue-500
                  active:scale-[0.98]
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                "
              >
                馬上更新
              </button>
            )}

            <button
              onClick={close}
              className="
                w-full px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl
                bg-white/90 backdrop-blur-sm
                text-purple-600 text-xs sm:text-sm font-semibold
                border border-purple-200 sm:border-2
                hover:bg-white hover:border-purple-300
                active:scale-[0.98]
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
              "
            >
              {needRefresh ? '等等再說' : '好的'}
            </button>
          </div>
        </div>

        {/* 關閉按鈕 - 響應式 */}
        <button
          onClick={close}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-white/80 text-purple-400 hover:text-purple-600 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label="關閉通知"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
