import { useCallback, useState } from 'react';

/**
 * UpdateToast - PWA 更新提示（右上角）
 *
 * 產品需求：
 * - 取消 10 秒自動更新吐司
 * - 保留右上角提示吐司（高級、不打擾）
 * - 明確行為：使用者主動更新
 */

interface UpdateToastProps {
  /** 是否顯示更新提示 */
  show: boolean;
  /** 關閉回調 */
  onClose: () => void;
  /** 更新回調 */
  onUpdate: () => void;
}

export function UpdateToast({ show, onClose, onUpdate }: UpdateToastProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = useCallback(() => {
    if (isUpdating) return;
    setIsUpdating(true);
    onUpdate();
  }, [isUpdating, onUpdate]);

  if (!show) return null;

  return (
    <div
      className={
        'fixed top-4 right-4 z-[9999] w-[22rem] max-w-[calc(100vw-2rem)] ' +
        'transition-all duration-300 ease-out opacity-100 translate-y-0'
      }
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="
          relative rounded-2xl border border-indigo-100/80
          bg-white/95 backdrop-blur-xl shadow-2xl
          overflow-hidden
        "
      >
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {isUpdating ? (
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 flex items-center justify-center">
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

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {isUpdating ? '正在更新版本…' : '有新版本可用'}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {isUpdating
                  ? '清除快取後即將重新載入，不會影響收藏與歷史紀錄。'
                  : '建議立即更新以取得最新匯率與功能。'}
              </p>
            </div>

            {!isUpdating && (
              <button
                onClick={onClose}
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

          {!isUpdating && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white text-sm font-semibold hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 active:scale-[0.98] transition-all"
              >
                立即更新
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                稍後
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
