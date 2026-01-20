/**
 * PWA Update Prompt Component
 *
 * Material Design snackbar-style notification for PWA updates.
 * Uses vite-plugin-pwa's official useRegisterSW hook.
 *
 * Features:
 * - Pastel gradient design with cloud decorations
 * - Spring animation entrance
 * - Bottom-center positioning
 * - Full accessibility support (ARIA, keyboard nav)
 * - Responsive design (mobile/tablet/desktop)
 */
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const [show, setShow] = useState(false);

  // 使用 vite-plugin-pwa 官方 React Hook
  // [context7:/vite-pwa/vite-plugin-pwa:2025-12-29]
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Service Worker 已註冊，設定定期更新檢查（每小時）
      if (r) {
        setInterval(
          () => {
            void r.update();
          },
          60 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  // 手動更新：用戶點擊「更新」按鈕時執行
  const handleUpdate = () => {
    void updateServiceWorker(true);
  };

  // 動畫效果：延遲顯示以實現入場動畫
  // 修正：使用條件返回避免 effect 中直接呼叫 setState
  // [context7:/react/react.dev:useEffect:2025-12-29]
  useEffect(() => {
    // 只有當需要顯示時才設定計時器
    if (!offlineReady && !needRefresh) {
      // 不需要顯示時，直接返回（不在 effect 中設定 state）
      return undefined;
    }
    // 微延遲讓瀏覽器準備好渲染動畫
    const timer = setTimeout(() => setShow(true), 100);
    return () => {
      clearTimeout(timer);
      // 清理時重置 show 狀態（在 cleanup 中調用是安全的）
      setShow(false);
    };
  }, [offlineReady, needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShow(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      role="alertdialog"
      aria-labelledby="update-prompt-title"
      aria-describedby="update-prompt-description"
    >
      {/* Material Design Snackbar 風格卡片 - 緊湊水平布局 */}
      <div
        className="
          relative overflow-hidden rounded-lg
          w-[calc(100vw-2rem)] max-w-[344px]
          bg-gradient-to-r from-brand-from via-brand-via to-brand-to
          border border-brand-border/60
          shadow-lg shadow-brand-shadow/50
          animate-slide-in-bounce
        "
      >
        {/* 雲朵裝飾 - 優化尺寸 */}
        <div
          className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white/40 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-brand-decoration/40 blur-2xl"
          aria-hidden="true"
        />

        {/* 內容區域 - Material Design 內距 (14px/24px) */}
        <div className="relative px-6 py-3.5">
          <div className="flex items-center gap-3">
            {/* 圖標區 - 緊湊尺寸 */}
            <div className="flex-shrink-0">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-brand-icon-from to-brand-icon-to flex items-center justify-center shadow">
                <svg
                  className="w-5 h-5 text-brand-text"
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

            {/* 文字區 - 彈性空間 */}
            <div className="flex-1 min-w-0">
              <h2
                id="update-prompt-title"
                className="text-sm font-semibold text-brand-text-dark truncate"
              >
                {offlineReady ? '✨ 離線模式已就緒' : '🎉 發現新版本'}
              </h2>
              <p id="update-prompt-description" className="text-xs text-brand-text truncate">
                {offlineReady ? '隨時隨地都能使用' : '點擊更新獲取最新功能'}
              </p>
            </div>

            {/* 行動區 - 緊湊按鈕 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {needRefresh ? (
                // 發現新版本時顯示「更新」按鈕
                <button
                  onClick={handleUpdate}
                  className="
                    px-3 py-1.5 rounded-full text-xs font-medium
                    bg-gradient-to-r from-brand-button-from to-brand-button-to
                    text-white shadow-sm
                    hover:from-brand-button-hover-from hover:to-brand-button-hover-to
                    transition-all
                    focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1
                  "
                  aria-label="更新應用程式"
                >
                  更新
                </button>
              ) : (
                // 離線就緒時顯示關閉按鈕
                <button
                  onClick={close}
                  className="
                    p-1.5 rounded-full
                    bg-white/80 text-primary-text-light
                    hover:text-primary hover:bg-white
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
