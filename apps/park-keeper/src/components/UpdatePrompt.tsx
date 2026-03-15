/**
 * UpdatePrompt — PWA 版本更新通知元件
 *
 * 策略：
 * - 在線時自動靜默更新（updateServiceWorker(true) 觸發整頁重載）
 * - 離線或更新失敗時顯示底部 Toast，提供手動重試
 * - offlineReady 顯示 3 秒後自動消失
 * - SSR 安全：window undefined 時回傳 null
 */
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useUpdatePrompt } from '@app/park-keeper/hooks/useUpdatePrompt';

const AUTO_DISMISS_MS = 3_000;

/** SSR 安全入口 */
export function UpdatePrompt() {
  if (typeof window === 'undefined') return null;
  return <UpdatePromptClient />;
}

function UpdatePromptClient() {
  const { t } = useTranslation();
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { offlineReady, setOfflineReady, isUpdating, updateFailed, handleUpdate, handleDismiss } =
    useUpdatePrompt();

  // offlineReady 3 秒自動消失。
  useEffect(() => {
    if (!offlineReady) return;
    dismissRef.current = setTimeout(() => {
      setOfflineReady(false);
    }, AUTO_DISMISS_MS);
    return () => {
      if (dismissRef.current !== null) clearTimeout(dismissRef.current);
    };
  }, [offlineReady, setOfflineReady]);

  const isVisible = offlineReady || updateFailed;
  const isAlert = updateFailed;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="update-prompt"
          role={isAlert ? 'alert' : 'status'}
          aria-live={isAlert ? 'assertive' : 'polite'}
          className="fixed bottom-6 left-1/2 z-50 pointer-events-none"
          style={{ x: '-50%' }}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        >
          <div
            className={`
              pointer-events-auto
              flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl
              text-sm font-medium text-white
              ${
                updateFailed
                  ? 'bg-gradient-to-r from-rose-500 to-red-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }
            `}
          >
            {/* 圖示 */}
            <span aria-hidden="true" className="text-base leading-none">
              {updateFailed ? '⚠️' : '✅'}
            </span>

            {/* 文字 */}
            <span className="whitespace-nowrap">
              {updateFailed
                ? t('pwa.updateFailed')
                : offlineReady
                  ? t('pwa.offlineReady')
                  : t('pwa.needRefresh')}
            </span>

            {/* 操作按鈕 */}
            {updateFailed && !isUpdating && (
              <button
                onClick={() => void handleUpdate()}
                aria-label={t('pwa.actionRetry')}
                className="
                  ml-1 px-3 py-1 rounded-full text-xs font-bold
                  bg-white/20 hover:bg-white/35 active:bg-white/15
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
                "
              >
                {t('pwa.actionRetry')}
              </button>
            )}
            <button
              onClick={handleDismiss}
              aria-label={t('pwa.actionDismiss')}
              className="
                p-1 rounded-full
                bg-white/15 hover:bg-white/30 active:bg-white/10
                transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
              "
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** 僅在 needRefresh 狀態顯示更新進度（不可見的 aria-live 區域）*/
export function UpdateProgressAnnouncer() {
  const { t } = useTranslation();
  const { needRefresh, isUpdating } = useUpdatePrompt();

  if (!needRefresh && !isUpdating) return null;

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {isUpdating ? t('pwa.needRefresh') : ''}
    </div>
  );
}
