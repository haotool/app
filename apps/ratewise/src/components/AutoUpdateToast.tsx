import { useCallback, useEffect, useState } from 'react';

/**
 * AutoUpdateToast - PWA 自動更新通知組件
 *
 * 業界最佳實踐設計 (2025)
 *
 * 參考:
 * - Google Web.dev PWA Updates: https://web.dev/learn/pwa/update/
 * - Vercel Design System: https://vercel.com/design
 * - Sonner Toast: https://sonner.emilkowal.ski/
 *
 * UX 特點:
 * - ✅ 自動倒數 10 秒後更新
 * - ✅ 可手動點擊立即更新
 * - ✅ 進度條視覺化倒數
 * - ✅ 柔和的入場/退場動畫
 * - ✅ 不干擾用戶操作（右下角）
 * - ✅ 完整無障礙支援
 * - ✅ 響應式設計
 *
 * 技術細節:
 * - 使用 autoUpdate 模式
 * - 10 秒倒數計時
 * - 清除快取 + 刷新頁面
 * - 優雅的 CSS 動畫
 */

interface AutoUpdateToastProps {
  /** 是否顯示更新提示 */
  show: boolean;
  /** 關閉回調 */
  onClose: () => void;
  /** 更新回調 */
  onUpdate: () => void;
}

export function AutoUpdateToast({ show, onClose, onUpdate }: AutoUpdateToastProps) {
  const [countdown, setCountdown] = useState(10);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = useCallback(() => {
    if (isUpdating) return;
    setIsUpdating(true);
    onUpdate();
  }, [isUpdating, onUpdate]);

  // 倒數計時邏輯
  useEffect(() => {
    if (!show || isUpdating) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // 倒數結束，自動更新
          handleUpdate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      setCountdown(10); // 重置倒數
    };
  }, [show, isUpdating, handleUpdate]);

  const handleSkip = () => {
    onClose();
  };

  if (!show) return null;

  const progress = (countdown / 10) * 100;

  return (
    <>
      {/* 背景遮罩（可選，點擊不關閉） */}
      <div className="fixed inset-0 z-[9998] pointer-events-none" aria-hidden="true" />

      {/* Toast 容器 */}
      <div
        className={`
          fixed bottom-4 right-4 z-[9999]
          transition-all duration-300 ease-out
          ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {/* Toast 卡片 */}
        <div
          className="
          relative w-80 max-w-[calc(100vw-2rem)]
          bg-white border border-gray-200
          rounded-2xl shadow-2xl
          overflow-hidden
        "
        >
          {/* 進度條 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 內容區 */}
          <div className="p-4 pt-5">
            {/* 圖標與文字 */}
            <div className="flex items-start gap-3 mb-3">
              {/* 圖標 */}
              <div className="flex-shrink-0">
                {isUpdating ? (
                  // 載入中
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-600 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                ) : (
                  // 更新圖標
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* 文字內容 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                  {isUpdating ? '正在更新...' : '新版本可用'}
                </h3>
                <p className="text-xs text-gray-600">
                  {isUpdating ? '請稍候，即將重新載入' : `${countdown} 秒後自動更新`}
                </p>
              </div>

              {/* 關閉按鈕 */}
              {!isUpdating && (
                <button
                  onClick={handleSkip}
                  className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="稍後更新"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* 按鈕 */}
            {!isUpdating && (
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="
                  w-full px-4 py-2 rounded-xl
                  bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500
                  text-white text-sm font-semibold
                  hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600
                  active:scale-[0.98]
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                "
              >
                立即更新
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
